import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MediaVideoField } from '../components/MediaVideoField.jsx'
import { flushImageFields } from '../components/MediaImageField.jsx'

vi.mock('../services/api', () => ({
  api: { post: vi.fn(), get: vi.fn() },
  ensureCsrf: vi.fn(),
  errorMessage: (error, fallback) => error?.response?.data?.message || fallback,
}))

describe('intro video field', () => {
  it('stores a normalized youtube link and can remove it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MediaVideoField scope="home.hero" label="Intro video" value="" onChange={onChange} />)

    expect(screen.getByRole('button', { name: 'YouTube link' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Upload file' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('The template video stays until you choose one.')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'YouTube URL' }), 'https://youtu.be/Lplq8RjQ0zU')

    expect(onChange).toHaveBeenCalledWith({
      video_url: 'https://www.youtube.com/embed/Lplq8RjQ0zU',
      video_kind: 'youtube',
      video_removed: false,
    })
  })

  it('blocks save when the youtube link is not valid', async () => {
    const user = userEvent.setup()
    render(<MediaVideoField scope="hero-invalid" label="Intro video" value="" onChange={vi.fn()} />)
    await user.type(screen.getByRole('textbox', { name: 'YouTube URL' }), 'https://evil.example/watch?v=Lplq8RjQ0zU')

    await expect(flushImageFields('hero-invalid')).rejects.toThrow('Use a YouTube link')
    expect(await screen.findByRole('alert')).toHaveTextContent('Use a YouTube link')
  })

  it('shows the file limit and rejects a video that is too large', async () => {
    const user = userEvent.setup()
    render(<MediaVideoField scope="hero-file" label="Intro video" value="" onChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Upload file' }))
    expect(screen.getByText('MP4, WebM, or MOV. Maximum 25 MB.')).toBeInTheDocument()

    const file = new File(['not-a-video'], 'tour.mp4', { type: 'video/mp4' })
    Object.defineProperty(file, 'size', { value: 26 * 1024 * 1024 })
    await user.upload(screen.getByLabelText('Video file'), file)

    expect(screen.getByRole('alert')).toHaveTextContent('The video must be 25 MB or smaller.')
    await expect(flushImageFields('hero-file')).rejects.toThrow('The video must be 25 MB or smaller.')
  })

  it('rejects a file that is not a video', async () => {
    const user = userEvent.setup()
    render(<MediaVideoField scope="hero-mime" label="Intro video" value="" onChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Upload file' }))
    const file = new File(['gif'], 'clip.mp4', { type: 'image/gif' })
    await user.upload(screen.getByLabelText('Video file'), file)
    expect(await screen.findByRole('alert')).toHaveTextContent('Use an MP4, WebM, or MOV video.')
  })

  it('marks a removed video so the play button stays hidden', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <MediaVideoField
        scope="hero-remove"
        label="Intro video"
        value="https://www.youtube.com/embed/Lplq8RjQ0zU"
        onChange={onChange}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Remove video' }))
    expect(onChange).toHaveBeenCalledWith({ video_url: '', video_kind: '', video_removed: true })
  })
})
