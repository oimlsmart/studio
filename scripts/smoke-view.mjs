#!/usr/bin/env node
// CI smoke test for /studio/view — the read-only viewer (the viewer wave,
// smart TODO.editor/04).
//
// Preconditions: `npm run build` has produced dist/, and `npm run preview`
// (or any static server) is serving the studio at $BASE_URL.
//
// Exits 0 on success, 1 on any failure. The assertions are the wave's
// gate: the viewer mounts, no editing chrome, the model still loads,
// the manifest panel activates.

import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:4322'
const VIEW = `${BASE}/studio/view`
const failures = []

function check(name, ok, detail = '') {
  if (ok) {
    console.log(`  ✓ ${name}`)
  } else {
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
    failures.push(name)
  }
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })

const pageErrors = []
const failedRequests = []
page.on('pageerror', e => pageErrors.push(`${e.message}`))
page.on('requestfailed', r => failedRequests.push(`${r.url()} — ${r.failure()?.errorText ?? ''}`))

console.log(`Loading ${VIEW}`)
await page.goto(VIEW, { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForTimeout(3000)

// 0. The site chrome renders — the site injects its own nav model,
//    brand, and footer through the shell's typed contract (TODO.public
//    track 02); the shell renders exactly what it is given.
check('the federation header renders the site brand', (await page.locator('header.site-nav a.nav-brand', { hasText: 'SMART Studio' }).count()) === 1)
check('the nav menu carries the Explore dropdown', (await page.locator('#nav-menu', { hasText: 'Explore' }).count()) === 1)
check('the minisite strip carries the six sections', (await page.locator('nav[aria-label="Sections"] a').count()) === 6)
check('the footer renders the hosts column', (await page.locator('footer h3', { hasText: 'The sites' }).count()) === 1)

// 1. The viewer mounts.
const editorChildren = await page.locator('#editor-root > *').count()
check('editor-root has children (viewer mount succeeded)', editorChildren > 0, `count=${editorChildren}`)

const bodyText = await page.locator('body').innerText()
check('OIML SMART VIEWER brand present', /OIML SMART\s+VIEWER/.test(bodyText))

// 2. No editing chrome: no palette, no New/Save/Import, no tree/page
//    adds, no comment compose; the read-only badge shows instead.
const gone = async (sel) => (await page.locator(sel).count()) === 0
check('no palette', await gone('[data-testid="element-palette"]'))
check('no New button', await gone('[data-testid="open-new"]'))
check('no Save button', await gone('[data-testid="open-save"]'))
check('no Import button', await gone('[data-testid="open-import"]'))
check('no tree add buttons', await gone('[data-testid^="tree-add-"]'))
check('no page add button', await gone('[data-testid="page-add"]'))
check('no comment compose', await gone('[data-testid="comment-input"]'))
check('the read-only badge shows', (await page.locator('[data-testid="readonly-badge"]').count()) === 1)

// 3. The model still loads (the real bundle, not the sample). The middle
//    pill is the compliance surface: provisions on legacy models, the
//    requirements count on v3 packages (editor wave 03, audit G6).
const statsMatch = bodyText.match(/(\d+)\s+processes\s+(\d+)\s+(provisions|requirements)\s+(\d+)\s+canvases/)
if (statsMatch) {
  const [, procs] = statsMatch.map(Number)
  check('stats pill shows the real model (processes > 3)', procs > 3, `processes=${procs}`)
} else {
  check('stats pill visible', false, 'no match in body')
}

// 4. The manifest panel activates (the package identity rides the bundle).
const manifestBtn = page.locator('[data-testid="open-panel-package-manifest"]')
check('the manifest panel button exists', (await manifestBtn.count()) === 1)
if ((await manifestBtn.count()) === 1) {
  await manifestBtn.click()
  await page.waitForTimeout(500)
  check('the manifest panel opens', (await page.locator('[data-testid="package-manifest-panel"]').count()) === 1)
  const manifestId = await page.locator('[data-testid="manifest-id"]').innerText().catch(() => '')
  check('the manifest id is oiml-r60', manifestId.trim() === 'oiml-r60', `got "${manifestId.trim()}"`)
}

check('no page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join('; '))
check('no failed asset requests', failedRequests.length === 0, failedRequests.slice(0, 3).join('; '))

await browser.close()

console.log('')
if (failures.length) {
  console.log(`FAIL: ${failures.length} check(s) failed`)
  process.exit(1)
}
console.log('OK: all checks passed')
