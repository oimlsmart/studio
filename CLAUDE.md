# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`oimlsmart/studio` serves the OIML SMART Studio **minisite** at
<https://www.oimlsmart.org/studio> — and, since 0.2.0, also **mounts the
editor itself** at `/studio/edit`. The editor is the Primmel Studio
editor (model canvas, inspectors, mapper, etc.) consumed as the npm
package `@primmel/editor`; the minisite is the four-page public face
(About / Story / Docs / Studio nav).

The editor source lives in a sibling repo (`~/src/primmel/editor/`,
GitHub: `primmel/editor`). This repo consumes the published version
(`@primmel/editor@^0.2.0`) — no vendored copy. The Primmel kernel
(`@primmel/primmel@^1.5.3`) is also consumed from npm.

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

### Regenerating the R60 model bundle

The editor at `/studio/edit` loads `public/models/oiml-r60.prl` — a
server-side bundle of the R60 Recommendation package. Regenerate when
the upstream R60 package changes:

```sh
node scripts/bundle-model.mjs oiml-r60
```

The bundler loads `~/src/oimlsmart/smart/primmel-packages/oiml-r60/`
with `uses` composition via the local kernel build, then `dump()`s the
merged Standard as a single .prl. Browser builds of the kernel can't
resolve `include` directives (no fs), so bundling is server-side.

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

Five top-level pages, each a thin Astro file wrapping content in
`<Base>` + `<MinisiteNav>` with a 4-item nav:

- `src/pages/index.astro` — About / hero
- `src/pages/story.astro` — narrative
- `src/pages/demo.astro` — historically the "honest pointer" to where
  the editor was said to live; needs updating now that the editor is
  actually mounted at `/studio/edit`
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
mount(document.getElementById('editor-root'), { initialText })
```

The `?model=` URL parameter swaps models. Default is the bundled R60.

The published `@primmel/editor@^0.2.0` `mount()` accepts `{ plugins,
initialText, ready }`. It does NOT yet accept `brand` — brand
customization (replacing the default "Primmel Atelier" wordmark with
"OIML SMART STUDIO") is a follow-up editor PR.

### Content collection

`src/content.config.ts` defines a single `docs` collection, loaded via
`astro/loaders`' `glob` from `src/content/docs/**/*.mdx`. The 14 chapter
files live under `src/content/docs/guides/`. Schema: `title`,
`shortTitle`, `description`, `eyebrow`, `sidebar`, `order`. Sidebar
order is `order`-sorted; `eyebrow` renders as the chapter index
("Guide · 03 of 14").

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
