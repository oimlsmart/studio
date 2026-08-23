# SMART Studio

The tool for viewing and authoring OIML SMART Recommendations: the canvas where
an expert models a Recommendation and the model is the published artifact. This
repo serves the component's site at <https://www.oimlsmart.org/studio>.

## The two surfaces

- `/studio/view` is the public read-only viewer: the Primmel Studio editor
  mounted with `readOnly: true` over the bundled model. The store refuses every
  mutation and the editing chrome (palette, New/Save/Import, inspector fields)
  hides; the tree, canvas, code view, mapping lenses, diff and validation stay.
- `/studio/edit` is the full editor (the authoring surface). Edits stay local
  to the browser; nothing writes back to the published model.

## The model bundle

`/studio/models/oiml-r60.prl` is a BUILD ARTIFACT, never committed
(`public/models/` is gitignored). `scripts/bundle-model.mjs` runs on
`prebuild`/`predev`: it composes the PRL package from the SSOT checkout
(`$SMART_REPO/primmel-packages`, default `~/src/oimlsmart/smart`; CI checks
oimlsmart/smart out at `vendor/smart` and sets `SMART_REPO`) with the studio's
own npm-pinned `@primmel/primmel` kernel, prepends the package manifest (the
merge's dump carries no `package { }` block, and the manifest panel needs it),
and writes the bundle. Composition failure is fatal; on CI a missing packages
root is fatal, locally it is a loud skip (docs-only clones can still build).

`@primmel/editor` is consumed from `github:primmel/editor#main` until the next
npm release carries the viewer mode; flip to the published `^0.4.0` then.

## CI

`ci.yml` builds and smokes `/studio/edit` and `/studio/view` (playwright, in
`scripts/smoke-edit.mjs` / `scripts/smoke-view.mjs`). `deploy.yml` publishes
`dist/` to GitHub Pages on merge to main.

Part of OIML SMART. Developed under the OIML SMART program by Ribose.
