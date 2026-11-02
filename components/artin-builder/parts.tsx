// Artin page builder v17. Rewritten when the builder is updated; your other files are never touched.
import { Fragment, type ReactNode } from 'react';

import { parseRichText, type Block, type Inline } from './richtext';
import { href, src } from './safe';

/**
 * Pieces every widget uses: links that are safe to follow, and rich text
 * drawn as elements (never inserted as HTML).
 *
 * Part of the project's copy of the builder renderer.
 */

export interface RenderContext {
  /** Turn a stored image path into an address this page can load. */
  media: (path: string) => string;
  /** In the editor: elements that are re-created after an edit made in place. */
  revisions?: Record<string, number>;
  editing?: boolean;
  /** On a site in several languages: the one shown, all of them, and this page's address without a language. */
  languages?: PageLanguages | null;
  /** The store's products on sale, for the products widget (in the store's order). */
  products?: ShopProduct[] | null;
}

/** A product as a page shows it: no stock counts, only whether it can be bought. */
export interface ShopProduct {
  slug: string;
  name: string;
  images: string[];
  /** In paise, GST included. */
  priceMinor: number;
  compareAtMinor: number | null;
  soldOut: boolean;
}

export interface PageLanguages { current: string; locales: string[]; path: string }

/** Widths of the optimised copies Artin keeps of media-library images (WebP, asked for with ?w=). */
const MEDIA_WIDTHS = [320, 640, 960, 1280, 1920];

/**
 * An image's attributes: its address and, for media-library images, the
 * smaller copies a browser picks from by screen size (srcset), so a phone
 * downloads a phone-sized picture. `sizes` says how wide the image shows.
 */
export function imageProps(ctx: RenderContext, path: string, sizes = '100vw') {
  const url = ctx.media(path);
  if (!path.startsWith('/_artin/media/') || path.endsWith('.gif')) return { src: url };
  return { src: url, srcSet: MEDIA_WIDTHS.map((w) => `${url}?w=${w} ${w}w`).join(', '), sizes, decoding: 'async' as const };
}

/** A link's attributes, or null when the address is not one a page may link to. */
export function linkProps(value: unknown, newTab?: unknown) {
  const url = href(value);
  if (!url) return null;
  const external = /^https?:\/\//i.test(url);
  return { href: url, ...(newTab === true || (external && newTab !== false) ? { target: '_blank', rel: 'noopener noreferrer' } : {}) };
}

function inline(nodes: Inline[], ctx: RenderContext): ReactNode {
  return nodes.map((n, i) => {
    switch (n.type) {
      case 'text': return <Fragment key={i}>{n.value}</Fragment>;
      case 'bold': return <strong key={i}>{inline(n.children, ctx)}</strong>;
      case 'italic': return <em key={i}>{inline(n.children, ctx)}</em>;
      case 'code': return <code key={i}>{n.value}</code>;
      case 'link': { const p = linkProps(n.href); return p ? <a key={i} {...p}>{inline(n.children, ctx)}</a> : <Fragment key={i}>{inline(n.children, ctx)}</Fragment>; }
      // eslint-disable-next-line @next/next/no-img-element
      case 'image': { const u = src(n.src); return u ? <img key={i} {...imageProps(ctx, u, '(max-width: 768px) 100vw, 720px')} alt={n.alt} loading="lazy" /> : null; }
      case 'break': return <br key={i} />;
    }
  });
}

function block(b: Block, i: number, ctx: RenderContext): ReactNode {
  switch (b.type) {
    case 'heading': { const Tag = `h${b.level + 1}` as 'h3'; return <Tag key={i}>{inline(b.children, ctx)}</Tag>; }
    case 'paragraph': return <p key={i}>{inline(b.children, ctx)}</p>;
    case 'list': { const Tag = b.ordered ? 'ol' : 'ul'; return <Tag key={i}>{b.items.map((item, n) => <li key={n}>{inline(item, ctx)}</li>)}</Tag>; }
    case 'quote': return <blockquote key={i}>{inline(b.children, ctx)}</blockquote>;
    case 'code': return <pre key={i}><code>{b.value}</code></pre>;
    case 'rule': return <hr key={i} />;
  }
}

/** Rich text from a page, as elements. */
export function richText(text: string, ctx: RenderContext): ReactNode {
  return parseRichText(text).map((b, i) => block(b, i, ctx));
}
