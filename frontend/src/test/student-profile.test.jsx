import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GHANA_PHONE_ERROR } from '../components/ghanaPhone'
import { StudentProfilePage } from '../pages/admin/StudentsPage.jsx'
import { api } from '../services/api'

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api')
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    ensureCsrf: vi.fn(),
  }
})

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Ada Lovelace',
      permissions: ['students.view', 'students.manage'],
    },
  }),
}))

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={['/admin/students/7']}>
      <Routes>
        <Route path="/admin/students/:id" element={<StudentProfilePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function studentPayload(phone) {
  return {
    data: {
      data: {
        id: 7,
        name: 'Ama Mensah',
        email: 'ama@example.com',
        phone,
        status: 'waitlist',
        notes: '',
        course: null,
        enrolled_on: null,
      },
    },
  }
}

describe('student profile phone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation((url) => {
      if (String(url).includes('/courses')) return Promise.resolve({ data: { data: [] } })
      return Promise.resolve(studentPayload(null))
    })
  })

  it('saves a Ghana phone and shows the stored number after reload', async () => {
    const user = userEvent.setup()
    api.put.mockResolvedValue(studentPayload('+233 24 123 4567'))

    const view = renderProfile()
    const phone = await screen.findByLabelText('Phone')
    await user.type(phone, '024 123 4567')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(api.put).toHaveBeenCalledWith('/api/v1/admin/students/7', expect.objectContaining({
      name: 'Ama Mensah',
      email: 'ama@example.com',
      phone: '024 123 4567',
    }))
    expect(screen.getByLabelText('Phone')).toHaveValue('+233 24 123 4567')

    view.unmount()
    api.get.mockImplementation((url) => {
      if (String(url).includes('/courses')) return Promise.resolve({ data: { data: [] } })
      return Promise.resolve(studentPayload('+233 24 123 4567'))
    })
    renderProfile()
    expect(await screen.findByLabelText('Phone')).toHaveValue('+233 24 123 4567')
  })

  it('rejects a number that is not a Ghana number before saving', async () => {
    const user = userEvent.setup()
    renderProfile()
    await user.type(await screen.findByLabelText('Phone'), '0211234567')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(api.put).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(GHANA_PHONE_ERROR)
  })
})
