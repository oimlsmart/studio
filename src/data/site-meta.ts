/**
 * The SMART Studio site constants — the identity and origin values the
 * injected configs (brand, nav, footer) compose from (TODO.public track
 * 02: the shell went machinery-only at 0.2.0, so the site carries its
 * own content). Data-only under plain node: the nav completeness gate
 * (scripts/check-nav.mjs, via the shell's check-nav) loads the nav
 * model through this module, so nothing here may import the package's
 * TypeScript source.
 */
export const SITE = {
  url: 'https://www.oimlsmart.org',
  base: '/studio',
  title: 'SMART Studio',
  description: 'The tool for viewing and authoring OIML SMART Recommendations.',
}

/** The canonical component-logo asset base — served by the main www
 *  site (no per-site copies, so the logo renders on any origin). */
export const COMPONENT_ASSET_BASE = `${SITE.url}/img/components`
