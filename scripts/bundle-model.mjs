#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// The model bundler (the viewer wave, smart TODO.editor/04): compose a
// multi-file Primmel package (with its `uses` deps) into the single
// .prl the editor loads, SERVER-SIDE (composition needs Node's fs).
//
// Runs at build time (npm run prebuild / predev), never by hand: the
// bundle is a build artifact and is NEVER committed (public/models/ is
// gitignored) — a committed bundle went stale within days twice
// (audit: PROGRESS/39 §G).
//
// Inputs:
//   - the kernel is the studio's own @primmel/primmel dependency
//     (npm-pinned by the lockfile — deterministic), NOT a local
//     primmel-ts checkout;
//   - the packages root is $SMART_REPO/primmel-packages (default
//     ~/src/oimlsmart/smart — the PRL SSOT; CI checks the repo out at
//     vendor/smart and sets SMART_REPO).
//
// Honesty rules:
//   - composition failure is FATAL (the old "load without deps"
//     fallback silently shipped a partial model once — never again);
//   - the target package's manifest (package.primmel) is PREPENDED to
//     the dump: the merge loses the package identity (the kernel's dump
//     emits no `package { }` block), and without it the editor's
//     manifest panel cannot activate;
//   - a missing packages root is fatal on CI (process.env.CI), a loud
//     skip locally, so docs-only clones can still dev/build.
// ─────────────────────────────────────────────────────────────────────
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadPackage, dump } from '@primmel/primmel'

const STUDIO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SMART_REPO = resolve(process.env.SMART_REPO ?? `${homedir()}/src/oimlsmart/smart`)
const PKGS_ROOT = resolve(SMART_REPO, 'primmel-packages')
const TARGET = process.argv[2] || 'oiml-r60'
const OUT = process.argv[3] || resolve(STUDIO_ROOT, 'public', 'models', `${TARGET}.prl`)

if (!existsSync(PKGS_ROOT)) {
  const msg = `packages root not found: ${PKGS_ROOT} (set SMART_REPO to the oimlsmart/smart checkout)`
  if (process.env.CI) {
    console.error(`FATAL: ${msg} — the CI build must never ship without the bundle`)
    process.exit(1)
  }
  console.warn(`WARN: ${msg} — skipping the bundle regeneration (local dev without the smart checkout)`)
  process.exit(0)
}

// Provenance for the CI log: which SSOT revision this bundle carries.
try {
  const sha = execFileSync('git', ['-C', SMART_REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  console.log(`bundling from oimlsmart/smart @ ${sha}`)
} catch {
  console.log(`bundling from ${PKGS_ROOT} (not a git checkout — no revision to log)`)
}

const pkgDir = resolve(PKGS_ROOT, TARGET)
const manifestPath = resolve(pkgDir, 'package.primmel')
if (!existsSync(manifestPath)) {
  console.error(`FATAL: no package.primmel at ${pkgDir}`)
  process.exit(1)
}

let standard
try {
  standard = loadPackage(pkgDir, { resolvePackage: (id) => resolve(PKGS_ROOT, id) })
} catch (e) {
  console.error(`FATAL: the uses composition failed for ${TARGET}: ${e.message}`)
  process.exit(1)
}

// The manifest rides the bundle: the merge's dump carries no package
// block, so the package.primmel text goes first.
const bundle = readFileSync(manifestPath, 'utf8').trimEnd() + '\n\n' + dump(standard)
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, bundle, 'utf8')
console.log(
  `Bundled ${TARGET} → ${OUT} (${bundle.length} chars; `
  + `${standard.processes.length} processes, ${standard.requirements.length} requirements, `
  + `${standard.dataclasses.length} data classes, ${standard.terms.length} terms)`,
)
