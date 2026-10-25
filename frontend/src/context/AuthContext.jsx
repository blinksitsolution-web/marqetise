import { useEffect, useMemo, useState } from 'react'
import { api, ensureCsrf } from '../services/api'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    try {
      const response = await api.get('/api/v1/auth/user')
      setUser(response.data.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    api.get('/api/v1/auth/user')
      .then((response) => {
        if (active) setUser(response.data.data)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    const onUnauthorized = () => setUser(null)
    window.addEventListener('marqetise:unauthorized', onUnauthorized)
    return () => {
      active = false
      window.removeEventListener('marqetise:unauthorized', onUnauthorized)
    }
  }, [])

  async function login(payload) {
    await ensureCsrf()
    const response = await api.post('/api/v1/auth/login', payload)
    setUser(response.data.data)
    return response.data.data
  }

  async function logout() {
    await ensureCsrf()
    await api.post('/api/v1/auth/logout')
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
