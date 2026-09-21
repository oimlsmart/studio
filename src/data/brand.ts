/**
 * The SMART Studio brand config — the identity values the site injects
 * into the house shell's header, mobile overlay, and footer (one brand
 * object passed to the one layout mount, TODO.public track 02). The
 * shape is the package's BrandConfig (@oimlsmart/site-shell/config).
 * No signInHref: the studio serves no authenticated surface, so no
 * sign-in link renders anywhere. The logo pair is the canonical
 * smart-studio asset under the www asset base — the same pair the
 * site's hero and the editor's own wordmark render.
 */
import type { BrandConfig } from '@oimlsmart/site-shell/config'
import { SITE, COMPONENT_ASSET_BASE } from './site-meta'

export const BRAND: BrandConfig = {
  brandName: SITE.title,
  logoLight: `${COMPONENT_ASSET_BASE}/smart-studio-light.svg`,
  logoDark: `${COMPONENT_ASSET_BASE}/smart-studio-dark.svg`,
  homeHref: `${SITE.url}${SITE.base}/`,
  themeColor: '#004996',
}
