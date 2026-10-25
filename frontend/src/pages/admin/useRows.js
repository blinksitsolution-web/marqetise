import { useEffect, useState } from 'react'
import { api } from '../../services/api'

export function useRows(path) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    api.get(path).then((response) => setRows(response.data)).catch(() => setError('The records could not be loaded.'))
  }, [path, version])
  return { rows, error, reload: () => setVersion((value) => value + 1) }
}
