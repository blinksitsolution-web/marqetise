import { createContext, useContext } from 'react'

export const SiteContext = createContext(null)

export function useSite() {
  const context = useContext(SiteContext)
  if (!context) {
    throw new Error('useSite must be used within SiteProvider')
  }
  return context
}
