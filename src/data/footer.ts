/**
 * The SMART Studio footer config — the content the site injects into
 * the house shell's footer frame (TODO.public track 02; the columns,
 * legal pages, attribution, and copyright were literals inside the
 * shell's SiteFooter.astro until 0.2.0 moved them out). The shape is
 * the package's FooterConfig (@oimlsmart/site-shell/config); the
 * Explore column is NOT here — the footer derives it from the nav
 * model. Cross-site navigation rides this config (the Programme column
 * and the hosts registry), never the top nav. The hosts list is the
 * federation's canonical registry — the same list every site renders —
 * and the attribution stays attribution-class, never promotion.
 */
import type { FooterConfig } from '@oimlsmart/site-shell/config'
import { SITE } from './site-meta'

export const FOOTER: FooterConfig = {
  origin: SITE.url,
  description:
    'The canvas where an expert models an OIML SMART Recommendation and the model itself is the published artifact.',
  columns: [
    {
      heading: 'Programme',
      links: [
        { label: 'About OIML SMART', href: '/about/what-is-smart' },
        { label: 'Contact', href: '/about/contact' },
        { label: 'Service status', href: 'https://status.oimlsmart.org' },
        { label: 'GitHub', href: 'https://github.com/oimlsmart', external: true, icon: 'github' },
      ],
    },
  ],
  hosts: [
    { label: 'Public site', href: 'https://www.oimlsmart.org' },
    { label: 'Platform', href: 'https://platform.oimlsmart.org' },
    { label: 'Demo', href: 'https://demo.oimlsmart.org' },
    { label: 'Identity', href: 'https://id.oimlsmart.org' },
    { label: 'Status', href: 'https://status.oimlsmart.org' },
    { label: 'Primmel', href: 'https://www.primmel.org' },
    { label: 'Studio', href: 'https://www.oimlsmart.org/studio/' },
  ],
  attribution: [
    'A programme of the ',
    { label: 'International Organization of Legal Metrology', href: 'https://www.oiml.org', external: true },
    ', delivered by ',
    { label: 'Ribose', href: 'https://www.ribose.com', external: true },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
  copyright: 'Content © OIML · Code © Ribose',
}
