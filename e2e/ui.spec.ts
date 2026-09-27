import { expect, test, type Page } from '@playwright/test'

async function openApp(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Convert text to speech' })).toBeVisible()
}

test.describe('Speech to Audio UI', () => {
  test('loads the converter page', async ({ page }) => {
    await openApp(page)
    await expect(page.getByTestId('voice-trigger')).toBeVisible()
    await expect(page.getByTestId('text-input')).toBeVisible()
    await expect(page.getByTestId('convert-button')).toBeVisible()
    await expect(page.getByTestId('convert-button')).toBeDisabled()
  })

  test('convert stays disabled for whitespace-only text', async ({ page }) => {
    await openApp(page)
    await page.getByTestId('text-input').fill('   \n\t  ')
    await expect(page.getByTestId('convert-button')).toBeDisabled()
  })

  test('convert enables after typing text', async ({ page }) => {
    await openApp(page)
    await page.getByTestId('text-input').fill('Hello world')
    await expect(page.getByTestId('convert-button')).toBeEnabled()
  })

  test('voice menu opens, selects a voice, and closes', async ({ page }) => {
    await openApp(page)

    await page.getByTestId('voice-trigger').click()
    await expect(page.getByTestId('voice-menu')).toBeVisible()

    await page.getByTestId('voice-option-en-GB-SoniaNeural').click()
    await expect(page.getByTestId('voice-menu')).toHaveCount(0)
    await expect(page.getByTestId('voice-trigger-label')).toHaveText(
      'en-GB · Sonia (Female)',
    )
  })

  test('voice menu closes when clicking outside', async ({ page }) => {
    await openApp(page)
    await page.getByTestId('voice-trigger').click()
    await expect(page.getByTestId('voice-menu')).toBeVisible()
    await page.getByRole('heading', { name: 'Convert text to speech' }).click()
    await expect(page.getByTestId('voice-menu')).toHaveCount(0)
  })

  test('character count updates while typing', async ({ page }) => {
    await openApp(page)
    await expect(page.getByTestId('char-count')).toHaveText('0 / 5,000')
    await page.getByTestId('text-input').fill('abcd')
    await expect(page.getByTestId('char-count')).toHaveText('4 / 5,000')
  })

  test('happy path UI: pick voice + text enables convert', async ({ page }) => {
    await openApp(page)

    await page.getByTestId('voice-trigger').click()
    await page.getByTestId('voice-option-en-US-JennyNeural').click()
    await expect(page.getByTestId('voice-trigger-label')).toContainText('Jenny')

    await page.getByTestId('text-input').fill('This is a UI test sentence.')
    await expect(page.getByTestId('convert-button')).toBeEnabled()
  })
})

test.describe('Chromium Edge gate', () => {
  test('shows Edge notice and blocks conversion with a clear error', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Chromium-only gate')

    await openApp(page)
    await expect(page.getByTestId('edge-notice')).toBeVisible()

    await page.getByTestId('text-input').fill('Hello from Chrome')
    await expect(page.getByTestId('convert-button')).toBeEnabled()
    await page.getByTestId('convert-button').click()
    await expect(page.getByTestId('error-message')).toContainText(
      'Microsoft Edge',
    )
    await expect(page.getByTestId('result')).toHaveCount(0)
  })
})

test.describe('Microsoft Edge TTS', () => {
  test('converts text to downloadable audio in Edge', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'msedge', 'Requires Microsoft Edge')

    await openApp(page)
    await expect(page.getByTestId('edge-notice')).toHaveCount(0)

    await page.getByTestId('voice-trigger').click()
    await page.getByTestId('voice-option-en-US-EmmaMultilingualNeural').click()
    await page
      .getByTestId('text-input')
      .fill('Hello from Edge TTS end to end test.')
    await expect(page.getByTestId('convert-button')).toBeEnabled()

    await page.getByTestId('convert-button').click()
    await expect(page.getByTestId('convert-button')).toHaveText('Converting…')

    await expect(page.getByTestId('result')).toBeVisible({ timeout: 45_000 })
    await expect(page.getByTestId('audio-player')).toBeVisible()
    await expect(page.getByTestId('download-link')).toHaveAttribute(
      'download',
      'speech.mp3',
    )
    await expect(page.getByTestId('error-message')).toHaveCount(0)
  })
})
