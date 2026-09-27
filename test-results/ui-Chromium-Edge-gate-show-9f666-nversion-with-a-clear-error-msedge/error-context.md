# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui.spec.ts >> Chromium Edge gate >> shows Edge notice and blocks conversion with a clear error
- Location: e2e\ui.spec.ts:74:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('edge-notice')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByTestId('edge-notice') with timeout 10000ms
  - waiting for getByTestId('edge-notice')

```

```yaml
- main:
  - paragraph: Speech to Audio
  - heading "Convert text to speech" [level=1]
  - paragraph: Paste text, pick a voice, convert once, and download an MP3. Free via Microsoft Edge TTS — no API keys.
  - text: Voice
  - button "Voice": en-US · Emma (Female)
  - text: Your text
  - textbox "Your text 0 / 5,000":
    - /placeholder: Type or paste the text you want spoken…
  - text: 0 / 5,000
  - button "Convert to audio" [disabled]
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test'
  2   | 
  3   | async function openApp(page: Page) {
  4   |   await page.goto('/')
  5   |   await expect(page.getByRole('heading', { name: 'Convert text to speech' })).toBeVisible()
  6   | }
  7   | 
  8   | test.describe('Speech to Audio UI', () => {
  9   |   test('loads the converter page', async ({ page }) => {
  10  |     await openApp(page)
  11  |     await expect(page.getByTestId('voice-trigger')).toBeVisible()
  12  |     await expect(page.getByTestId('text-input')).toBeVisible()
  13  |     await expect(page.getByTestId('convert-button')).toBeVisible()
  14  |     await expect(page.getByTestId('convert-button')).toBeDisabled()
  15  |   })
  16  | 
  17  |   test('convert stays disabled for whitespace-only text', async ({ page }) => {
  18  |     await openApp(page)
  19  |     await page.getByTestId('text-input').fill('   \n\t  ')
  20  |     await expect(page.getByTestId('convert-button')).toBeDisabled()
  21  |   })
  22  | 
  23  |   test('convert enables after typing text', async ({ page }) => {
  24  |     await openApp(page)
  25  |     await page.getByTestId('text-input').fill('Hello world')
  26  |     await expect(page.getByTestId('convert-button')).toBeEnabled()
  27  |   })
  28  | 
  29  |   test('voice menu opens, selects a voice, and closes', async ({ page }) => {
  30  |     await openApp(page)
  31  | 
  32  |     await page.getByTestId('voice-trigger').click()
  33  |     await expect(page.getByTestId('voice-menu')).toBeVisible()
  34  | 
  35  |     await page.getByTestId('voice-option-en-GB-SoniaNeural').click()
  36  |     await expect(page.getByTestId('voice-menu')).toHaveCount(0)
  37  |     await expect(page.getByTestId('voice-trigger-label')).toHaveText(
  38  |       'en-GB · Sonia (Female)',
  39  |     )
  40  |   })
  41  | 
  42  |   test('voice menu closes when clicking outside', async ({ page }) => {
  43  |     await openApp(page)
  44  |     await page.getByTestId('voice-trigger').click()
  45  |     await expect(page.getByTestId('voice-menu')).toBeVisible()
  46  |     await page.getByRole('heading', { name: 'Convert text to speech' }).click()
  47  |     await expect(page.getByTestId('voice-menu')).toHaveCount(0)
  48  |   })
  49  | 
  50  |   test('character count updates while typing', async ({ page }) => {
  51  |     await openApp(page)
  52  |     await expect(page.getByTestId('char-count')).toHaveText('0 / 5,000')
  53  |     await page.getByTestId('text-input').fill('abcd')
  54  |     await expect(page.getByTestId('char-count')).toHaveText('4 / 5,000')
  55  |   })
  56  | 
  57  |   test('happy path UI: pick voice + text enables convert', async ({ page }) => {
  58  |     await openApp(page)
  59  | 
  60  |     await page.getByTestId('voice-trigger').click()
  61  |     await page.getByTestId('voice-option-en-US-JennyNeural').click()
  62  |     await expect(page.getByTestId('voice-trigger-label')).toContainText('Jenny')
  63  | 
  64  |     await page.getByTestId('text-input').fill('This is a UI test sentence.')
  65  |     await expect(page.getByTestId('convert-button')).toBeEnabled()
  66  |   })
  67  | })
  68  | 
  69  | test.describe('Chromium Edge gate', () => {
  70  |   test('shows Edge notice and blocks conversion with a clear error', async ({
  71  |     page,
  72  |   }, testInfo) => {
  73  |     test.skip(testInfo.project.name !== 'chromium', 'Chromium-only gate')
  74  | 
  75  |     await openApp(page)
  76  |     await expect(page.getByTestId('edge-notice')).toBeVisible()
  77  | 
> 78  |     await page.getByTestId('text-input').fill('Hello from Chrome')
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  79  |     await expect(page.getByTestId('convert-button')).toBeEnabled()
  80  |     await page.getByTestId('convert-button').click()
  81  |     await expect(page.getByTestId('error-message')).toContainText(
  82  |       'Microsoft Edge',
  83  |     )
  84  |     await expect(page.getByTestId('result')).toHaveCount(0)
  85  |   })
  86  | })
  87  | 
  88  | test.describe('Microsoft Edge TTS', () => {
  89  |   test('converts text to downloadable audio in Edge', async ({ page }, testInfo) => {
  90  |     test.skip(testInfo.project.name !== 'msedge', 'Requires Microsoft Edge')
  91  | 
  92  |     await openApp(page)
  93  |     await expect(page.getByTestId('edge-notice')).toHaveCount(0)
  94  | 
  95  |     await page.getByTestId('voice-trigger').click()
  96  |     await page.getByTestId('voice-option-en-US-EmmaMultilingualNeural').click()
  97  |     await page
  98  |       .getByTestId('text-input')
  99  |       .fill('Hello from Edge TTS end to end test.')
  100 |     await expect(page.getByTestId('convert-button')).toBeEnabled()
  101 | 
  102 |     await page.getByTestId('convert-button').click()
  103 |     await expect(page.getByTestId('convert-button')).toHaveText('Converting…')
  104 | 
  105 |     await expect(page.getByTestId('result')).toBeVisible({ timeout: 45_000 })
  106 |     await expect(page.getByTestId('audio-player')).toBeVisible()
  107 |     await expect(page.getByTestId('download-link')).toHaveAttribute(
  108 |       'download',
  109 |       'speech.mp3',
  110 |     )
  111 |     await expect(page.getByTestId('error-message')).toHaveCount(0)
  112 |   })
  113 | })
  114 | 
```