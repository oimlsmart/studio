#!/usr/bin/env node
// CI smoke test for /studio/edit.
//
// Preconditions: `npm run build` has produced dist/, and `npm run preview`
// (or any static server) is serving the studio at $BASE_URL.
//
// Exits 0 on success, 1 on any failure. Failures are reported with the
// specific assertion that broke — single source of truth for "did the
// editor mount and load R60 on the deployed site."

import { chromium } from 'playwright'

const BASE = process.env.BASE_URL || 'http://localhost:4322'
const EDIT = `${BASE}/studio/edit`
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

console.log(`Loading ${EDIT}`)
await page.goto(EDIT, { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForTimeout(3000)

// The site chrome renders — the site injects its own nav model, brand,
// and footer through the shell's typed contract (TODO.public track 02).
check('the federation header renders the site brand', (await page.locator('header.site-nav a.nav-brand', { hasText: 'SMART Studio' }).count()) === 1)
check('the minisite strip carries the six sections', (await page.locator('nav[aria-label="Sections"] a').count()) === 6)
check('the footer renders the hosts column', (await page.locator('footer h3', { hasText: 'The sites' }).count()) === 1)

const editorChildren = await page.locator('#editor-root > *').count()
check('editor-root has children (mount succeeded)', editorChildren > 0, `count=${editorChildren}`)

const bodyText = await page.locator('body').innerText()
check('OIML SMART STUDIO brand present', /OIML SMART\s+STUDIO/.test(bodyText))
check('default Primmel Atelier brand overridden', !/Primmel\s+Atelier/.test(bodyText))

// The middle pill is the compliance surface: provisions on legacy
// models, the requirements count on v3 packages (editor wave 03, G6).
const statsMatch = bodyText.match(/(\d+)\s+processes\s+(\d+)\s+(provisions|requirements)\s+(\d+)\s+canvases/)
if (statsMatch) {
  const [, procs] = statsMatch.map(Number)
  check(`stats pill shows real model (processes > 3, not sample)`, procs > 3, `processes=${procs}`)
} else {
  check('stats pill visible', false, 'no match in body')
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
