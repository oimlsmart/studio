/**
 * The SMART Studio nav model — the ordered items the house shell's
 * header, the mobile overlay, and the footer's Explore column render
 * (one model, injected through the site layout's `nav` prop, TODO.public
 * track 02). The shell went machinery-only at 0.2.0: the model moved
 * into this repository, shaped to the package's NavModel contract
 * (@oimlsmart/site-shell/config). The file is data-only: the
 * active-path predicates ship with the package's config contract, never
 * from here.
 *
 * The site is small, and its six sections already render in the
 * minisite strip below the header, so the federation nav stays one
 * dropdown plus the product CTA:
 *
 *   1. Explore — the site's own routes, in the strip's order (About,
 *      Story, Docs, Demo, Viewer, Editor).
 *   2. The product CTA — "Open the viewer": the read-only viewer at
 *      /studio/view is the site's public surface, the one thing a
 *      first-time visitor is here to do.
 *
 * Cross-site navigation is deliberately absent from the top nav — it
 * lives in the footer (the Programme column and the hosts registry).
 * Every href is this repo's own route, so the completeness gate checks
 * every entry against the built dist.
 *
 * Hrefs stay root-relative; `origin` absolutizes them at render, so
 * the chrome's links resolve from any host (ADR-0003).
 */
import type { NavDropdownConfig, NavModel, NavLink } from '@oimlsmart/site-shell/config'
import { SITE } from './site-meta.ts'

// The relative import above carries an explicit .ts extension on
// purpose (the only such import in src/data): the nav completeness
// gate (scripts/check-nav.mjs, via the shell's check-nav) loads this
// file under plain node's type stripping, which resolves relative
// specifiers literally — the extensionless house style would 404 it.
// The same constraint keeps this module data-only: the active-path
// predicates stay in the package (@oimlsmart/site-shell/config), and
// importing them here would drag the package's TypeScript source into
// a plain-node load, which node refuses to strip under node_modules.

const link = (label: string, href: string, desc: string): NavLink => ({ label, href, desc })

/** The site's own routes, in the minisite strip's order. */
export const EXPLORE_DROPDOWN: NavDropdownConfig = {
  id: 'explore',
  label: 'Explore',
  variant: 'default',
  links: [
    link('About', `${SITE.base}/`, 'What SMART Studio is'),
    link('Story', `${SITE.base}/story`, 'From the MMEL editor to Primmel Studio'),
    link('Docs', `${SITE.base}/docs`, 'The Studio guides'),
    link('Demo', `${SITE.base}/demo`, 'Where to try the surfaces'),
    link('Viewer', `${SITE.base}/view`, 'The read-only viewer over the published models'),
    link('Editor', `${SITE.base}/edit`, 'The full authoring surface'),
  ],
}

/** The minisite strip's sections — the site-local navigation under the
 *  federation header (hrefs resolve against the MinisiteNav base). */
export const MINISITE_SECTIONS = [
  { label: 'About', href: '/' },
  { label: 'Story', href: '/story' },
  { label: 'Docs', href: '/docs' },
  { label: 'Demo', href: '/demo' },
  { label: 'Viewer', href: '/view' },
  { label: 'Studio', href: '/edit' },
]

export const NAV_MODEL: NavModel = {
  // Front-door absolute at render (ADR-0003): the chrome's links
  // resolve from any origin.
  origin: SITE.url,
  items: [{ type: 'dropdown', config: EXPLORE_DROPDOWN }],
  productCta: { label: 'Open the viewer', href: `${SITE.base}/view` },
}
