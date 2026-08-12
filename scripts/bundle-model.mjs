#!/usr/bin/env node
// Bundle a multi-file Primmel package (with `uses` deps) into a single .prl
// file the editor can load. Server-side because include/composition resolution
// uses Node's fs.
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const require = createRequire(import.meta.url)
const primmel = require('/Users/mulgogi/src/primmel/primmel-ts/packages/primmel/dist/index.js')

const PKGS_ROOT = '/Users/mulgogi/src/oimlsmart/smart/primmel-packages'
const TARGET = process.argv[2] || 'oiml-r60'
const OUT = process.argv[3] || `/Users/mulgogi/src/oimlsmart/studio/public/models/${TARGET}.prl`

function tryLoad() {
  try {
    return primmel.loadPackage(resolve(PKGS_ROOT, TARGET), {
      resolvePackage: (id) => resolve(PKGS_ROOT, id),
    })
  } catch (e) {
    console.warn('Composition failed, loading without deps:', e.message)
    return primmel.loadPackage(resolve(PKGS_ROOT, TARGET))
  }
}

const standard = tryLoad()
const text = primmel.dump(standard)
writeFileSync(OUT, text, 'utf8')
console.log(`Bundled ${TARGET} → ${OUT} (${text.length} chars)`)
