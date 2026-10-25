import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

export function handleApiError(error) {
  const url = error.config?.url || ''
  const isSessionProbe = url.includes('/auth/login') || url.includes('/auth/user') || url.includes('/sanctum/csrf-cookie')
  if (error.response?.status === 401 && !isSessionProbe) {
    window.dispatchEvent(new Event('marqetise:unauthorized'))
  }
  if (error.response?.status === 403 && !isSessionProbe) {
    window.dispatchEvent(new Event('marqetise:forbidden'))
  }
  return Promise.reject(error)
}

api.interceptors.response.use(
  (response) => response,
  handleApiError,
)

export async function ensureCsrf() {
  await api.get('/sanctum/csrf-cookie')
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data

  if (error?.response?.status === 429) {
    return 'Too many attempts. Please wait a few minutes and try again.'
  }

  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }

  return data?.message || fallback
}

export function can(user, permission) {
  return Boolean(user?.permissions?.includes(permission))
}
