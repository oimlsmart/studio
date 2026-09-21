#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// The model bundler (the viewer wave, smart TODO.editor/04): compose a
// multi-file Primmel package into the single .prl the editor loads,
// SERVER-SIDE (the include expansion needs Node's fs).
//
// Runs at build time (npm run prebuild / predev). The bundle IS
// committed (public/models/): CI freshness rides the `bundle-freshness`
// job in ci.yml — regenerate + byte-identical diff, unconditionally.
//
// Inputs:
//   - the kernel is the studio's own @primmel/primmel dependency
//     (npm-pinned by the lockfile — deterministic), NOT a local
//     primmel-ts checkout;
//   - the packages root is the pinned @oimlsmart/primmel-packages
//     dependency (the version pin IS the content contract — the
//     package's root IS the packages root, one child directory per PRL
//     package). PRIMMEL_PACKAGES_ROOT overrides it with a content-repo
//     checkout for authoring previews.
//
// The target package is loaded STANDALONE: the rec packages are
// self-contained under the layers.prl doctrine — the generated file
// includes the consumed layer files verbatim and the kernel's include
// preprocessor expands them before parsing, so a plain package load IS
// the composed model. (A resolvePackage closure merge over the manifest
// `uses` would double-count the layer content and collide with it —
// uses-no-redefine.) The manifest `uses` stays in the bundle as
// lineage, not as a merge instruction.
//
// Honesty rules:
//   - load failure is FATAL (the old "load without deps" fallback
//     silently shipped a partial model once — never again);
//   - the target package's manifest (package.primmel) is PREPENDED to
//     the dump: the merge loses the package identity (the kernel's dump
//     emits no `package { }` block), and without it the editor's
//     manifest panel cannot activate;
//   - a missing packages root is FATAL, said out loud: a declared
//     PRIMMEL_PACKAGES_ROOT that does not resolve is a misconfiguration,
//     and an undeclared one means the pinned package is not installed
//     (npm ci is the fix).
// ─────────────────────────────────────────────────────────────────────
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { loadPackage, dump } from '@primmel/primmel'

const STUDIO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = process.argv[2] || 'oiml-r60'
const OUT = process.argv[3] || resolve(STUDIO_ROOT, 'public', 'models', `${TARGET}.prl`)

// The packages root: the override first (a content-repo checkout for
// authoring previews; missing = fatal), the pinned npm package second
// (not installed = fatal).
function packagesRoot() {
  const override = process.env.PRIMMEL_PACKAGES_ROOT
  if (override) {
    if (!existsSync(override)) {
      console.error(`FATAL: PRIMMEL_PACKAGES_ROOT=${override} does not exist — point it at a checkout of oimlsmart/primmel-packages (or unset it to use the pinned npm package)`)
      process.exit(1)
    }
    return { root: override }
  }
  try {
    const req = createRequire(import.meta.url)
    const manifest = req.resolve('@oimlsmart/primmel-packages/package.json')
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
    return { root: dirname(manifest), name: pkg.name, version: pkg.version }
  } catch {
    console.error('FATAL: @oimlsmart/primmel-packages is not installed — run npm ci (the pinned content package the bundle is built from)')
    process.exit(1)
  }
}

const source = packagesRoot()
const PKGS_ROOT = source.root

// Provenance for the CI log: which content revision this bundle carries.
// A checkout answers git; the installed npm package answers name@version.
// (The .git probe must be explicit: the installed package sits INSIDE
// this repo's work tree, so a bare `git -C` would answer with the
// studio's own HEAD.)
if (existsSync(resolve(PKGS_ROOT, '.git'))) {
  try {
    const sha = execFileSync('git', ['-C', PKGS_ROOT, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
    console.log(`bundling from oimlsmart/primmel-packages @ ${sha}`)
  } catch {
    console.log(`bundling from ${PKGS_ROOT} (checkout exists, revision unreadable)`)
  }
} else if (source.name) {
  console.log(`bundling from ${source.name}@${source.version}`)
} else {
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
  standard = loadPackage(pkgDir)
} catch (e) {
  console.error(`FATAL: the package load failed for ${TARGET}: ${e.message}`)
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
