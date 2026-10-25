import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PageEditorPage } from '../pages/admin/PageEditorPage.jsx'
import { api } from '../services/api'

vi.mock('../context/useSite', () => ({
  useSite: () => ({ site: { settings: {} }, error: '' }),
}))

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
    ensureCsrf: vi.fn(),
  }
})

const draft = {
  data: {
    data: {
      title: 'Privacy',
      slug: 'privacy',
      excerpt: '',
      body: 'Notice',
      meta_title: '',
      meta_description: '',
      status: 'draft',
    },
  },
}

describe('page editor load', () => {
  it('ignores a stale page response after the editor has rendered', async () => {
    const user = userEvent.setup()
    const pending = []
    api.get.mockImplementation(() => new Promise((resolve) => pending.push(resolve)))

    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/admin/cms/pages/4']}>
          <Routes>
            <Route path="/admin/cms/pages/:id" element={<PageEditorPage />} />
          </Routes>
        </MemoryRouter>
      </StrictMode>,
    )

    await waitFor(() => expect(pending.length).toBe(2))
    pending[0](draft)
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument()

    pending[1](draft)
    expect(await screen.findByLabelText('Status')).toHaveValue('draft')
    await user.selectOptions(screen.getByLabelText('Status'), 'published')
    expect(screen.getByLabelText('Status')).toHaveValue('published')
  })
})
