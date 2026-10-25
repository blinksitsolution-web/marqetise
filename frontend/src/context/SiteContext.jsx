import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { SiteContext } from './useSite'

export function SiteProvider({ children }) {
  const [site, setSite] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/api/v1/site')
      .then((response) => {
        if (active) setSite(response.data.data)
      })
      .catch(() => {
        if (active) setError('The website content could not be loaded.')
      })
    return () => {
      active = false
    }
  }, [])

  return <SiteContext.Provider value={{ site, error }}>{children}</SiteContext.Provider>
}
