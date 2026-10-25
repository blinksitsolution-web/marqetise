import { useCallback, useState } from 'react'

export function useKeyedState(key, createValue) {
  const [state, setState] = useState(() => ({ key, value: createValue() }))
  if (state.key !== key) {
    setState({ key, value: createValue() })
  }

  const update = useCallback((updater) => {
    setState((current) => {
      const value = typeof updater === 'function' ? updater(current.value) : updater
      return { key: current.key, value }
    })
  }, [])

  return [state.value, update]
}
