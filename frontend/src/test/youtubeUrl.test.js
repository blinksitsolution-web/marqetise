import { describe, expect, it } from 'vitest'
import { isUploadedVideo, youtubeEmbed } from '../components/youtubeUrl.js'

const embed = 'https://www.youtube.com/embed/Lplq8RjQ0zU'

describe('youtube embed urls', () => {
  it('normalizes the public youtube forms', () => {
    for (const input of [
      'https://www.youtube.com/watch?v=Lplq8RjQ0zU',
      'http://youtube.com/watch?v=Lplq8RjQ0zU&t=12s',
      'https://m.youtube.com/watch?v=Lplq8RjQ0zU',
      'https://music.youtube.com/watch?v=Lplq8RjQ0zU',
      'https://youtu.be/Lplq8RjQ0zU',
      'https://www.youtube.com/shorts/Lplq8RjQ0zU',
      'https://www.youtube.com/embed/Lplq8RjQ0zU',
      'https://www.youtube.com/live/Lplq8RjQ0zU',
      'https://www.youtube-nocookie.com/embed/Lplq8RjQ0zU',
    ]) {
      expect(youtubeEmbed(input), input).toBe(embed)
    }
  })

  it('rejects anything that is not a youtube video id', () => {
    for (const input of [
      '',
      '   ',
      'javascript:alert(1)',
      'https://evil.example/watch?v=Lplq8RjQ0zU',
      'https://www.youtube.com/watch?v=short',
      'https://www.youtube.com/watch?v=Lplq8RjQ0zUextra',
      'https://www.youtube.com/watch?v=Lplq8 RjQ0zU',
      'https://youtu.be/not-an-id',
      '/media/1-' + 'a'.repeat(64) + '.mp4',
    ]) {
      expect(youtubeEmbed(input), input).toBe('')
    }
  })

  it('recognizes a stored video path', () => {
    const hash = 'c'.repeat(64)
    expect(isUploadedVideo(`/media/4-${hash}.mp4`)).toBe(true)
    expect(isUploadedVideo(`https://marqetise.onrender.com/media/4-${hash}.webm`)).toBe(true)
    expect(isUploadedVideo(`/media/4-${hash}.mov`)).toBe(true)
    expect(isUploadedVideo(`/media/4-${hash}.png`)).toBe(false)
    expect(isUploadedVideo(embed)).toBe(false)
    expect(isUploadedVideo('javascript:alert(1)')).toBe(false)
  })
})
