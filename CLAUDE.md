# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`oimlsmart/studio` serves the OIML SMART Studio **minisite** at
<https://www.oimlsmart.org/studio> — and, since 0.2.0, also **mounts the
editor itself** at `/studio/edit`, plus the **read-only viewer** at
`/studio/view` (the viewer wave). The editor is the Primmel Studio
editor (model canvas, inspectors, mapper, etc.); the minisite is the
public face (About / Story / Docs / Demo / Viewer / Studio nav).

The editor source lives in a sibling repo (`~/src/primmel/editor/`,
GitHub: `primmel/editor`). This repo consumes `github:primmel/editor#main`
until the next npm release carries the viewer mode (`readOnly` mount
option); flip to the published `^0.4.0` then. The Primmel kernel
(`@primmel/primmel@^1.6.1`) is consumed from npm.

## Commands

```sh
npm run dev       # Astro dev server
npm run build     # Astro static build → dist/
npm run preview   # Serve the built site
```

Astro 7, static output, `base: '/studio'`. Node 24 in CI.

### The vendor/site-shell caveat

`@oimlsmart/site-shell` is declared as `"file:vendor/site-shell"` and
`vendor/` is **gitignored**. Locally you must populate it (clone
`oimlsmart/site-shell` into `vendor/site-shell`). CI re-checks it from
GitHub as a separate workflow step before `npm ci`. If `npm ci` fails
locally with a missing-shell error, this is why.

### The model bundle

Both editor surfaces load `/studio/models/oiml-r60.prl` — a server-side
bundle of the R60 Recommendation package, committed and refreshed by
`scripts/bundle-model.mjs` (wired to `prebuild`/`predev`). It composes
the package with `uses` resolution from `$SMART_REPO/primmel-packages`
(default `~/src/oimlsmart/smart`) using this repo's own npm-pinned
kernel, then prepends the package's `package.primmel` (the merge's
`dump()` carries no `package { }` block, and the editor's manifest panel
needs the identity). Composition failure is fatal — the old
load-without-deps fallback once silently shipped a partial model. A
missing packages root is fatal when `SMART_REPO` is declared
(misconfiguration, said out loud), a loud skip otherwise (the committed
bundle serves). Browser builds of the kernel can't resolve `include`
directives (no fs), so bundling stays server-side.

Freshness: the `bundle-freshness` CI job regenerates from a smart
checkout and diffs byte-identical against the committed bundle. The
smart repo is private, so the job is gated on repo variable
`SMART_REPO_AVAILABLE` + secret `SMART_REPO_PAT` (the
oimlsmart.github.io gates.yml pattern) and skips cleanly until
configured.

## Architecture

### The shell is the chrome SSOT

Page chrome — federation header, minisite nav, hero, docs sidebar,
footer, design tokens — comes from `@oimlsmart/site-shell`. Consumers
import components and the token CSS; they don't redefine chrome. In
particular:

- **Logos are not shipped.** Mark-up references canonical URLs under
  `/img/components/` (root-relative, served by the main oimlsmart.org
  site). The CI build greps `dist/index.html` for that prefix and curls
  the resolved SVG to confirm a 200 — the "sync-branding" guard.
- **Colors and type live only in the shell's `tokens.css`.** A token
  change ships as one shell release consumed by every site.

### Page layout

Six top-level pages, each a thin Astro file wrapping content in
`<Base>` + `<MinisiteNav>` with the 6-item nav:

- `src/pages/index.astro` — About / hero
- `src/pages/story.astro` — narrative
- `src/pages/demo.astro` — the honest pointer: the viewer is the public
  surface, the editor is the authoring surface
- `src/pages/view.astro` — **the viewer**: the editor mounted with
  `readOnly: true` (the store refuses every mutation; the palette,
  New/Save/Import and inspector editing hide; the tree, canvas, code,
  mapping lenses, diff and validation stay)
- `src/pages/edit.astro` — **the editor**: `<div id="editor-root">` +
  an inline `<script type="module">` that fetches the model and calls
  `mount()` from `@primmel/editor`
- `src/pages/docs/{index,[...slug]}.astro` — the guides index and the
  per-chapter renderer

### The editor mount

`src/pages/edit.astro` boots the editor client-side:

```js
import { mount } from '@primmel/editor'
const model = new URLSearchParams(location.search).get('model') || '/studio/models/oiml-r60.prl'
const initialText = await (await fetch(model)).text()
mount(document.getElementById('editor-root'), { initialText, brand })
```

The `?model=` URL parameter swaps models. Default is the bundled R60.
`mount()` accepts `{ plugins, initialText, brand, readOnly, ready }` —
`brand` overrides the default "Primmel Atelier" wordmark (here: "OIML
SMART STUDIO" / "OIML SMART VIEWER"), `readOnly` mounts the viewer.

### Content collection

`src/content.config.ts` defines a single `docs` collection, loaded via
`astro/loaders`' `glob` from `src/content/docs/**/*.mdx`. The guide
files live under `src/content/docs/guides/`: the quickstart and the
Primmel Studio chapter. (The twelve YAML-pipeline guides retired when
the packages became the single source of truth; the authoring pipeline
is documented once, in the SMART Recommendations corpus at
www.oimlsmart.org/recs/docs/.) Schema: `title`,
`shortTitle`, `description`, `eyebrow`, `sidebar`, `order`. Sidebar
order is `order`-sorted; `eyebrow` renders as the chapter index
("Guide · 01 of 02").

### Styling

Tailwind 4 via `@tailwindcss/vite` (no `tailwind.config`).
`src/styles/app.css` imports tailwind, then the shell's `tokens.css`,
then `@source`s the shell's components so their utility classes
compile. The `.docs-body` layer carries prose styles for MDX-rendered
chapter bodies — extend there, not in component-local CSS.

## Conventions

- All link paths inside this site are prefixed `/studio/...` (set by
  `base` in `astro.config.mjs`). Don't hard-code `/studio` into JS;
  Astro's `<a href>`s are rebased.
- Cross-site links to other OIML SMART components (`/recs/`, `/sst/`)
  are written as absolute paths because the site ships under the same
  domain.
- Commit messages follow a long-form descriptive style; match that
  voice. Never add AI-attribution trailers.
