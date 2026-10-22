import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, ensureCsrf } from '../services/api'

const AuthContext = createContext(null)

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
    refresh()
    const onUnauthorized = () => setUser(null)
    window.addEventListener('marqetise:unauthorized', onUnauthorized)
    return () => window.removeEventListener('marqetise:unauthorized', onUnauthorized)
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
