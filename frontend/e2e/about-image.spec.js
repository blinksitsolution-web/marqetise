import { expect, test } from '@playwright/test'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

async function signIn(page) {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill('media-e2e@example.com')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/admin\/?$/)
}

test('selecting an About banner image uploads it, save stores it, and the public page shows it', async ({ page }) => {
  await signIn(page)
  await page.goto('/admin/cms/about')
  const banner = page.locator('[id="editor-about.banner"]')
  await expect(banner.getByRole('button', { name: 'Save Banner' })).toBeVisible()

  const uploaded = page.waitForResponse((response) => response.url().includes('/api/v1/admin/media') && response.request().method() === 'POST')
  await banner.locator('input[type="file"]').setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: png })
  const media = await uploaded
  expect(media.status()).toBe(201)
  const path = (await media.json()).data.url
  expect(path).toMatch(/^\/media\/\d+-[a-f0-9]{64}\.png$/)
  await expect(banner.locator('img')).toHaveAttribute('src', path)

  const saved = page.waitForResponse((response) => response.request().method() === 'PUT' && /\/api\/v1\/admin\/blocks\/\d+$/.test(new URL(response.url()).pathname))
  await banner.getByRole('button', { name: 'Save Banner' }).click()
  const put = await saved
  expect(put.status()).toBe(200)
  const body = put.request().postDataJSON()
  // Production block 24 is about.banner. The editor and the public About banner both use payload.image.
  expect(body.key).toBe('about.banner')
  expect(body.payload.image).toBe(path)

  const site = await page.request.get('/api/v1/site')
  expect(site.ok()).toBe(true)
  const blocks = (await site.json()).data.blocks
  expect(blocks['about.banner'].payload.image).toContain(path)

  await page.goto('/about')
  const image = page.locator('[data-about="banner-image"]')
  await expect(image).toHaveAttribute('src', new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
  await expect.poll(() => image.evaluate((node) => node.naturalWidth)).toBeGreaterThan(0)
})

test('saving during an in-flight upload still stores the media url', async ({ page }) => {
  await page.route('**/api/v1/admin/media', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 1200))
    await route.continue()
  })
  await signIn(page)
  await page.goto('/admin/cms/about')
  const banner = page.locator('[id="editor-about.banner"]')
  const saved = page.waitForRequest((request) => request.method() === 'PUT' && /\/api\/v1\/admin\/blocks\/\d+$/.test(new URL(request.url()).pathname))
  await banner.locator('input[type="file"]').setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: png })
  await banner.getByRole('button', { name: 'Save Banner' }).click()
  const put = await saved
  expect(put.postDataJSON().payload.image).toMatch(/^\/media\/\d+-[a-f0-9]{64}\.png$/)
})

test('a rejected file shows an error and is not stored as a preview', async ({ page }) => {
  await signIn(page)
  await page.goto('/admin/cms/about')
  const story = page.locator('[id="editor-about.story"]')
  const posts = []
  const puts = []
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/v1/admin/media')) posts.push(request.url())
    if (request.method() === 'PUT' && request.url().includes('/api/v1/admin/blocks/')) puts.push(request.url())
  })
  await story.locator('input[type="file"]').setInputFiles({ name: 'pixel.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') })
  await expect(story.getByRole('alert')).toContainText('Use a JPEG, PNG, or WebP image.')
  await expect(story.locator('img')).toHaveCount(0)
  await story.getByRole('button', { name: 'Save Our story' }).click()
  await expect(page.getByText('The image was not uploaded.')).toBeVisible()
  expect(posts).toEqual([])
  expect(puts).toEqual([])
  await expect(story.locator('img')).toHaveCount(0)
})
