/**
 * The site's header and footer, made in the Artin page builder, around every
 * page of the site: the pages made in code (app/.../page.tsx) and the
 * builder's own pages are one website. A builder page draws its own header
 * and footer (and may hide them), so there the frame steps aside.
 *
 * On Artin they are read live from the Content API, so changing the header in
 * the builder updates every page without a rebuild. Outside Artin (after
 * exporting the project), they are read from `content/site.json`.
 *
 * siteMetadata() gives the root layout the site's search and sharing
 * defaults (its name, title pattern, description, sharing image, whether
 * search engines may index it), as set in Artin's Search settings. Each page's
 * own title and description still come first.
 *
 * This file belongs to your project; change it freely.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { cache, type ReactNode } from 'react';

import { SiteFrame } from '@/components/artin-builder/page';
import type { PageData, PageSettings } from '@/components/artin-builder/types';
import { mediaUrl } from '@/lib/artin-media';

interface SiteRecord {
  site?: PageSettings | null;
  header?: PageData | null;
  footer?: PageData | null;
  products?: Parameters<typeof SiteFrame>[0]['products'];
}

/** The site's settings, header and footer, once per request. */
const getSite = cache(async (): Promise<SiteRecord | null> => {
  if (!process.env.ARTIN_CONTENT_URL) {
    try {
      return JSON.parse(await readFile(path.join(process.cwd(), 'content', 'site.json'), 'utf8')) as SiteRecord;
    } catch {
      return null;
    }
  }
  try {
    const res = await fetch(`${process.env.ARTIN_CONTENT_URL}/_site`, {
      headers: { authorization: `Bearer ${process.env.ARTIN_CONTENT_TOKEN ?? ''}` },
      cache: 'no-store',
    });
    return res.ok ? ((await res.json()) as SiteRecord) : null;
  } catch {
    return null;
  }
});

/**
 * The layout's metadata with the site's search and sharing defaults on top:
 * `export async function generateMetadata() { return siteMetadata(base); }`.
 * Where nothing is set in Artin, `base` (the layout's own metadata) stays as it is.
 */
export async function siteMetadata(base: Metadata = {}): Promise<Metadata> {
  const seo = (await getSite())?.site?.seo;
  if (!seo) return base;
  const out: Metadata = { ...base };
  const name = seo.siteName;
  if (name || seo.titleTemplate) {
    const own = typeof base.title === 'string' ? base.title : undefined;
    out.title = { default: name ?? own ?? '', template: seo.titleTemplate ?? (name ? `%s | ${name}` : '%s') };
  }
  if (seo.description) out.description = seo.description;
  // A sharing picture needs a full address: the one this request came in on.
  let image = seo.image ? mediaUrl(seo.image) : '';
  if (image.startsWith('/')) {
    const incoming = await headers();
    const host = incoming.get('x-forwarded-host') ?? incoming.get('host');
    image = host ? `${incoming.get('x-forwarded-proto') ?? 'https'}://${host}${image}` : '';
  }
  if (name || seo.description || image) {
    out.openGraph = { type: 'website', ...(base.openGraph ?? {}), ...(name ? { siteName: name } : {}), ...(seo.description ? { description: seo.description } : {}), ...(image ? { images: [image] } : {}) };
    out.twitter = { card: image ? 'summary_large_image' : 'summary', ...(base.twitter ?? {}), ...(seo.description ? { description: seo.description } : {}), ...(image ? { images: [image] } : {}) };
  }
  if (seo.noindex) out.robots = { index: false, follow: false };
  if (seo.googleVerification || seo.bingVerification) {
    out.verification = { ...(seo.googleVerification ? { google: seo.googleVerification } : {}), ...(seo.bingVerification ? { other: { 'msvalidate.01': seo.bingVerification } } : {}) };
  }
  return out;
}

export async function ArtinSiteFrame({ children }: { children: ReactNode }) {
  const record = await getSite();
  if (!record) return <>{children}</>;
  return (
    <SiteFrame site={record.site ?? null} header={record.header ?? null} footer={record.footer ?? null} products={record.products ?? null} media={mediaUrl}>
      {children}
    </SiteFrame>
  );
}
