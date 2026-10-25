import { useEffect, useMemo, useState } from 'react'
import { api, ensureCsrf } from '../services/api'
import { AuthContext } from './useAuth'

function sessionEnded(error) {
  const status = error?.response?.status
  return status === 401 || status === 419
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionUnconfirmed, setSessionUnconfirmed] = useState(false)

  function noteSessionError(error) {
    if (sessionEnded(error)) {
      setUser(null)
      setSessionUnconfirmed(false)
      return
    }
    setSessionUnconfirmed(true)
  }

  async function refresh() {
    try {
      const response = await api.get('/api/v1/auth/user')
      setUser(response.data.data)
      setSessionUnconfirmed(false)
    } catch (error) {
      noteSessionError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    api.get('/api/v1/auth/user')
      .then((response) => {
        if (!active) return
        setUser(response.data.data)
        setSessionUnconfirmed(false)
      })
      .catch((error) => {
        if (active) noteSessionError(error)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    const onUnauthorized = () => {
      setUser(null)
      setSessionUnconfirmed(false)
    }
    const onForbidden = () => { refresh() }
    window.addEventListener('marqetise:unauthorized', onUnauthorized)
    window.addEventListener('marqetise:forbidden', onForbidden)
    return () => {
      active = false
      window.removeEventListener('marqetise:unauthorized', onUnauthorized)
      window.removeEventListener('marqetise:forbidden', onForbidden)
    }
  }, [])

  async function login(payload) {
    await ensureCsrf()
    const response = await api.post('/api/v1/auth/login', payload)
    setUser(response.data.data)
    setSessionUnconfirmed(false)
    return response.data.data
  }

  async function logout() {
    await ensureCsrf()
    await api.post('/api/v1/auth/logout')
    setUser(null)
    setSessionUnconfirmed(false)
  }

  const value = useMemo(
    () => ({ user, loading, sessionUnconfirmed, login, logout, refresh }),
    [user, loading, sessionUnconfirmed],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
