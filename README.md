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

`/studio/models/oiml-r60.prl` is committed and refreshed by
`scripts/bundle-model.mjs` (also wired to `prebuild`/`predev`): it
composes the PRL package from the packages root —
`PRIMMEL_PACKAGES_ROOT` when declared (a checkout of the private
content repo `oimlsmart/model-library`), otherwise the pinned
`@oimlsmart/primmel-packages` dependency (the git tag
`github:oimlsmart/model-library#v…`; distribution moved off npm on
2026-09-24) — with
the studio's own npm-pinned `@primmel/primmel` kernel, prepends the
package manifest (the merge's dump carries no `package { }` block, and
the manifest panel needs it), and writes the bundle. Composition failure
is fatal; a missing packages root with `PRIMMEL_PACKAGES_ROOT` declared
is fatal,
undeclared is a loud skip (the committed bundle serves).

Freshness is enforced by the `bundle-freshness` CI job (regenerate from
the pinned dependency, diff byte-identical against the committed
bundle) and by the nightly `freshness-sentinel`: the pin compared
against the model-library tag feed, the kernel floor, a regeneration
drift check, and a live smoke — a lag opens a standing issue.

`@primmel/editor` is consumed from `github:primmel/editor#main` until the next
npm release carries the viewer mode; flip to the published `^0.4.0` then.

## CI

`ci.yml` builds, runs the nav completeness gate (`npm run check:nav` —
every href in the nav model must resolve to a page in the built dist),
and smokes `/studio/edit` and `/studio/view` (playwright, in
`scripts/smoke-edit.mjs` / `scripts/smoke-view.mjs`). `deploy.yml`
publishes `dist/` to GitHub Pages on merge to main.

Part of OIML SMART. Developed under the OIML SMART program by Ribose.
