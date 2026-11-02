/**
 * Pages made with the Artin page builder.
 *
 * On Artin, pages are read live from the Content API, so publishing in the
 * builder updates the site without a rebuild. Outside Artin (after
 * exporting the project), they are read from `content/pages/<path>.json`.
 *
 * On a site in several languages, a page comes in the language it was asked
 * for (proxy.ts says which); words not translated yet are the default
 * language's.
 *
 * This file belongs to your project; change it freely.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { headers } from 'next/headers';

import type { PageData } from '@/components/artin-builder/types';

export interface BuilderPageRecord {
  path: string;
  title: string;
  data: PageData;
  seo?: { title?: string; description?: string; image?: string; noindex?: boolean };
  publishedAt: string | null;
  /** The site's settings: colours, fonts, buttons. */
  site?: import('@/components/artin-builder/types').PageSettings | null;
  /** The site's header and footer, when it has them and this page shows them. */
  header?: PageData | null;
  footer?: PageData | null;
  /** On a site in several languages: the one shown, all of them, and this address without a language. */
  languages?: { current: string; locales: string[]; path: string } | null;
}

const VALID = /^(?:[a-z0-9][a-z0-9-]{0,60})(?:\/[a-z0-9][a-z0-9-]{0,60}){0,3}$|^$/;

/** The site's languages, from proxy.ts: null on a site in one language. */
async function languages(): Promise<{ current: string; fallback: string; locales: string[]; path: string } | null> {
  try {
    const incoming = await headers();
    const locales = (incoming.get('x-artin-locales') ?? '').split(',').filter(Boolean);
    if (locales.length < 2) return null;
    const fallback = incoming.get('x-artin-default-locale') ?? locales[0]!;
    return { current: incoming.get('x-artin-locale') ?? fallback, fallback, locales, path: incoming.get('x-artin-path') ?? '/' };
  } catch {
    return null; // outside a request (at build time)
  }
}

/** The published builder page at an address ('' is the home page), or null. */
export async function getBuilderPage(pathname: string): Promise<BuilderPageRecord | null> {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  if (!VALID.test(clean)) return null;
  const lang = await languages();
  const switcher = lang ? { current: lang.current, locales: lang.locales, path: lang.path } : null;
  if (!process.env.ARTIN_CONTENT_URL) {
    try {
      const page = JSON.parse(await readFile(path.join(process.cwd(), 'content', 'pages', `${clean || 'index'}.json`), 'utf8')) as BuilderPageRecord;
      return { ...page, languages: switcher };
    } catch {
      return null;
    }
  }
  const locale =lang && lang.current !== lang.fallback ? `&locale=${encodeURIComponent(lang.current)}` : '';
  try {
    const res = await fetch(`${process.env.ARTIN_CONTENT_URL}/_pages?path=${encodeURIComponent(clean)}${locale}`, {
      headers: { authorization: `Bearer ${process.env.ARTIN_CONTENT_TOKEN ?? ''}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const page = (await res.json()) as BuilderPageRecord;
    return { ...page, languages: switcher };
  } catch {
    return null;
  }
}

/** On a site in several languages: this page's address in each of them, so search engines show people theirs (hreflang). */
export async function languageAlternates(): Promise<{ canonical: string; languages: Record<string, string> } | null> {
  const lang = await languages();
  if (!lang) return null;
  const incoming = await headers();
  const host = incoming.get('x-forwarded-host') ?? incoming.get('host');
  if (!host) return null;
  const origin = `${incoming.get('x-forwarded-proto') ?? 'https'}://${host}`;
  const at = (code: string) => (code === lang.fallback ? `${origin}${lang.path}` : `${origin}/${code}${lang.path === '/' ? '' : lang.path}`);
  return { canonical: at(lang.current), languages: { ...Object.fromEntries(lang.locales.map((code) => [code, at(code)])), 'x-default': at(lang.fallback) } };
}
