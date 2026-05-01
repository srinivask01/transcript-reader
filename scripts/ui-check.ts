import puppeteer from 'puppeteer'
import path from 'path'
import { mkdir } from 'fs/promises'
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const BASE = 'http://localhost:3002'
const SCREENSHOTS = path.join(process.cwd(), 'scripts', 'screenshots')
const NAV_TIMEOUT = 60000

let passed = 0
let failed = 0

function pass(msg: string) { console.log(`  ✓ ${msg}`); passed++ }
function fail(msg: string, err?: unknown) { console.error(`  ✗ ${msg}${err ? `: ${err}` : ''}`); failed++ }

async function shot(page: puppeteer.Page, name: string) {
  await mkdir(SCREENSHOTS, { recursive: true })
  await page.screenshot({ path: path.join(SCREENSHOTS, `${name}.png`), fullPage: true })
  console.log(`    → screenshot: ${name}.png`)
}

async function goto(page: puppeteer.Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT })
  await delay(800)
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function hasText(page: puppeteer.Page, text: string): Promise<boolean> {
  const content = await page.content()
  return content.includes(text)
}

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: NAV_TIMEOUT,
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  page.setDefaultTimeout(NAV_TIMEOUT)

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const db = new PrismaClient({ adapter })
  let testProspectId: string | null = null
  let legacyProspectId: string | null = null

  try {
    // ── 1. Home page ─────────────────────────────────────────────
    console.log('\n[1] Home page')
    await goto(page, BASE)
    await shot(page, '01-home')

    ;(await hasText(page, 'Transcript Reader')) ? pass('App title renders') : fail('App title missing')
    ;(await hasText(page, 'Prospects')) ? pass('Prospects nav link present') : fail('Prospects nav link missing')
    ;(await hasText(page, 'Settings')) ? pass('Settings nav link present') : fail('Settings nav link missing')

    // ── 2. New prospect form ──────────────────────────────────────
    console.log('\n[2] New prospect form')
    await goto(page, `${BASE}/prospects/new`)
    await shot(page, '02-new-prospect')

    ;(await hasText(page, 'Add Prospect') || await hasText(page, 'New Prospect') || await hasText(page, 'Contact'))
      ? pass('New prospect form renders')
      : fail('New prospect form missing expected heading')

    const nameInput = await page.$('input[placeholder="Jane Smith"]')
    nameInput ? pass('Name input present') : fail('Name input missing')

    const companyInput = await page.$('input[placeholder="Acme Corp"]')
    companyInput ? pass('Company input present') : fail('Company input missing')

    // ── 3. Create prospect and verify redirect ────────────────────
    console.log('\n[3] Create prospect')
    if (nameInput && companyInput) {
      await nameInput.type('UI Test Prospect')
      await companyInput.type('Test Corp')

      const submitBtn = await page.$('button[type="submit"]')
      if (submitBtn) {
        await submitBtn.click()
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT })
        await delay(800)
        await shot(page, '03-prospect-detail')

        const url = page.url()
        if (url.includes('/prospects/') && !url.includes('/new')) {
          testProspectId = url.split('/prospects/')[1].split('/')[0]
          pass(`Redirected to prospect detail: ${url}`)
        } else {
          fail(`Expected prospect detail URL, got: ${url}`)
        }

        ;(await hasText(page, 'UI Test Prospect') || await hasText(page, 'Test Corp'))
          ? pass('Prospect name/company renders on detail page')
          : fail('Prospect name/company not found on detail page')

        ;(await hasText(page, 'Transcripts'))
          ? pass('Transcripts section present')
          : fail('Transcripts section missing')

        ;(await hasText(page, 'Summaries') || await hasText(page, 'Generate'))
          ? pass('Summaries section present')
          : fail('Summaries section missing')

        ;(await hasText(page, 'No summaries yet'))
          ? pass('Empty summaries state renders correctly')
          : fail('Empty summaries state missing')
      } else {
        fail('Submit button not found')
      }
    }

    // ── 4. Settings page ──────────────────────────────────────────
    console.log('\n[4] Settings page')
    await goto(page, `${BASE}/settings`)
    await shot(page, '04-settings')

    ;(await hasText(page, 'Settings')) ? pass('Settings heading renders') : fail('Settings heading missing')
    ;(await hasText(page, 'AI Model')) ? pass('Model selector label renders') : fail('Model selector missing')
    ;(await hasText(page, 'System Prompt')) ? pass('"System Prompt" card renders') : fail('"System Prompt" card missing')
    ;(await hasText(page, 'Edit')) ? pass('"Edit" link present') : fail('"Edit" link missing')

    // ── 5. Prompt editor page ─────────────────────────────────────
    console.log('\n[5] Prompt editor page')
    await goto(page, `${BASE}/settings/prompt`)
    await shot(page, '05-prompt-editor')

    ;(await hasText(page, 'System Prompt')) ? pass('Page heading renders') : fail('Page heading missing')
    ;(await hasText(page, 'Settings')) ? pass('Back link to Settings present') : fail('Back link missing')

    const textarea = await page.$('textarea')
    textarea ? pass('Prompt textarea renders') : fail('Prompt textarea missing')

    if (textarea) {
      const value = await page.$eval('textarea', (el: HTMLTextAreaElement) => el.value)
      value.length > 100
        ? pass(`Textarea pre-populated (${value.length} chars)`)
        : fail(`Textarea too short (${value.length} chars) — expected default prompt`)
    }

    ;(await hasText(page, 'Save as new version')) ? pass('Save button present') : fail('Save button missing')
    ;(await hasText(page, 'No active version') || await hasText(page, 'Active version'))
      ? pass('Active version status indicator renders')
      : fail('Active version status missing')

    // ── 6. Save a version ────────────────────────────────────────
    console.log('\n[6] Save and activate a prompt version')
    if (textarea) {
      await page.$eval('textarea', (el: HTMLTextAreaElement) => { el.value = '' })
      await textarea.type('UI verification test prompt — confirms save and activate flow works.')

      const notesInput = await page.$('input[type="text"]')
      if (notesInput) await notesInput.type('UI test run')

      const saveBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'))
        return btns.find(b => b.textContent?.includes('Save as new version')) !== undefined
      })

      if (saveBtn) {
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'))
          const btn = btns.find(b => b.textContent?.includes('Save as new version'))
          btn?.click()
        })
        await delay(1500)
        await shot(page, '06-after-save')

        ;(await hasText(page, 'Saved!') || await hasText(page, 'v1') || await hasText(page, 'inactive') || await hasText(page, 'Activate'))
          ? pass('Version saved — history entry or confirmation visible')
          : fail('No sign of successful save')

        // Activate the version
        const hasActivate = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'))
          return btns.some(b => b.textContent?.trim() === 'Activate')
        })

        if (hasActivate) {
          await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'))
            const btn = btns.find(b => b.textContent?.trim() === 'Activate')
            btn?.click()
          })
          await delay(1500)
          await shot(page, '07-after-activate')
          ;(await hasText(page, 'Active')) ? pass('Active badge visible after activation') : fail('Active badge missing after activation')
        } else {
          fail('Activate button not found after save')
        }
      } else {
        fail('Save button not found')
      }
    }

    // ── 7. Load a version into editor ────────────────────────────
    console.log('\n[7] Load version into editor')
    const hasLoad = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      return btns.some(b => b.textContent?.trim() === 'Load')
    })

    if (hasLoad) {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'))
        const btn = btns.find(b => b.textContent?.trim() === 'Load')
        btn?.click()
      })
      await delay(500)
      await shot(page, '08-after-load')
      const loadedValue = await page.$eval('textarea', (el: HTMLTextAreaElement) => el.value)
      loadedValue.length > 10
        ? pass(`Load populated editor (${loadedValue.length} chars)`)
        : fail('Load did not populate editor')
    } else {
      fail('Load button not found')
    }

    // ── 8. Legacy summary (migration default) ────────────────────
    console.log('\n[8] Legacy summary — analysisResult = {} (migration default)')
    const legacyProspect = await db.prospect.create({
      data: { name: 'Legacy Test Prospect', company: 'Legacy Corp' },
    })
    legacyProspectId = legacyProspect.id
    await db.summary.create({
      data: { prospectId: legacyProspect.id, analysisResult: {} },
    })

    await goto(page, `${BASE}/prospects/${legacyProspect.id}`)
    await shot(page, '09-legacy-prospect')

    ;(await hasText(page, 'Analysis data is not available'))
      ? pass('Legacy summary fallback message renders')
      : fail('Legacy summary fallback missing — page may have crashed')
    ;(await hasText(page, 'overallProjectSummary'))
      ? fail('Raw undefined key leaked into page — guard is not working')
      : pass('No raw undefined key visible in page')

  } finally {
    console.log('\n[cleanup] Removing test data')
    try {
      // Remove test prompt versions created during step 6
      const deleted = await db.systemPromptVersion.deleteMany({
        where: { text: 'UI verification test prompt — confirms save and activate flow works.' },
      })
      deleted.count > 0
        ? pass(`Test prompt version removed (${deleted.count} record)`)
        : pass('No test prompt version to remove')

      // Remove test prospect and its summaries (cascade handles summaries)
      if (testProspectId) {
        await db.prospect.delete({ where: { id: testProspectId } })
        pass('Test prospect removed')
      }

      // Remove legacy prospect created in step 8
      if (typeof legacyProspectId === 'string') {
        await db.prospect.delete({ where: { id: legacyProspectId } })
        pass('Legacy test prospect removed')
      }
    } catch (cleanupErr) {
      fail('Cleanup failed', cleanupErr)
    } finally {
      await db.$disconnect()
      await browser.close()
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.log(`Screenshots → scripts/screenshots/`)
  if (failed > 0) process.exit(1)
}

run().catch((err) => {
  console.error('\nFatal:', err)
  process.exit(1)
})
