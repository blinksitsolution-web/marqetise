import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useKeyedState } from '../hooks/useKeyedState'

function Probe({ slug }) {
  const [state, setState] = useKeyedState(slug, () => ({ label: 'empty' }))

  return (
    <div>
      <p>{state.label}</p>
      <button type="button" onClick={() => setState({ label: slug })}>Load</button>
    </div>
  )
}

describe('useKeyedState', () => {
  it('drops the previous value when the key changes', async () => {
    const user = userEvent.setup()
    const view = render(<Probe slug="one" />)
    expect(screen.getByText('empty')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Load' }))
    expect(screen.getByText('one')).toBeInTheDocument()
    view.rerender(<Probe slug="two" />)
    expect(screen.getByText('empty')).toBeInTheDocument()
  })
})
