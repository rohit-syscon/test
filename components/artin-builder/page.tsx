// Artin page builder v18. Rewritten when the builder is updated; your other files are never touched.
import type { ReactNode } from 'react';

import { BASE_CSS, fontsOf, pageCss } from './css';
import { EXTRA_CSS } from './extra';
import { PageCode, PRO_CSS } from './pro';
import { PageRuntime } from './runtime';
import { fontsHref } from './safe';
import type { PageData, PageSettings } from './types';
import type { PageLanguages, ShopProduct } from './parts';
import { siteTokensCss } from './theme';
import { Section, type RenderContext } from './widgets';

/**
 * A builder page, drawn from its data: the stylesheet, the fonts it uses,
 * and its sections. The same component draws the live site and the editor's
 * canvas, so what you edit is what visitors get.
 *
 * Part of the project's copy of the builder renderer: this file belongs to
 * your project, but it is rewritten when you update the builder.
 */
export function BuilderPage({ page: own, site, header, footer, media = (p) => p, editing = false, revisions, languages, products }: {
  page: PageData;
  /** The site's settings (colours, fonts, buttons): every page has them unless it sets its own. */
  site?: PageSettings | null;
  /** The site's header and footer (builder pages of their own), shown around this page unless it hides them. */
  header?: PageData | null;
  footer?: PageData | null;
  media?: (path: string) => string;
  /** The editor's canvas: animations wait to be played, and nothing is hidden. */
  editing?: boolean;
  revisions?: Record<string, number>;
  /** On a site in several languages: for the language switcher. */
  languages?: PageLanguages | null;
  /** The store's products, for the products widget. */
  products?: ShopProduct[] | null;
}) {
  const ctx: RenderContext = { media, editing, ...(revisions ? { revisions } : {}), ...(languages ? { languages } : {}), ...(products ? { products } : {}) };
  const page: PageData = site ? { ...own, settings: { ...withoutChrome(site), ...(own.settings ?? {}) } } : own;
  const head = header && !page.settings?.hideHeader ? header.sections ?? [] : [];
  const foot = footer && !page.settings?.hideFooter ? footer.sections ?? [] : [];
  // One stylesheet for all three: the page's settings (colours, fonts) apply to the header and footer too.
  const whole: PageData = { ...page, sections: [...head, ...(page.sections ?? []), ...foot] };
  const fonts = fontsHref([...fontsOf(whole), ...(header ? fontsOf(header) : []), ...(footer ? fontsOf(footer) : [])]);
  // Generated from checked values only (see safe.ts); `<` can never appear, but is neutralised anyway.
  const css = `${BASE_CSS}\n${PRO_CSS}\n${EXTRA_CSS}\n${pageCss(whole, media)}`.replace(/</g, '\\3C ');
  // Code for every page (the site's) and for this one: both run, the site's first. Never in the editor.
  const code = (place: 'headCode' | 'bodyCode') => (editing ? '' : [site?.[place], own.settings?.[place]].filter(Boolean).join('\n'));
  const headCode = code('headCode');
  const bodyCode = code('bodyCode');
  return (
    <div className="artin-page" data-ab-root="" {...(editing ? { 'data-ab-editing': '' } : {})}>
      {fonts ? <link rel="stylesheet" href={fonts} precedence="default" /> : null}
      <style>{css}</style>
      {headCode ? <PageCode code={headCode} place="head" /> : null}
      {head.length ? <div data-ab-part="header">{head.map((section) => <Section key={section.id} node={section} ctx={ctx} />)}</div> : null}
      {(page.sections ?? []).map((section) => <Section key={`${section.id}:${revisions?.[section.id] ?? 0}`} node={section} ctx={ctx} />)}
      {foot.length ? <div data-ab-part="footer">{foot.map((section) => <Section key={section.id} node={section} ctx={ctx} />)}</div> : null}
      {bodyCode ? <PageCode code={bodyCode} place="body" /> : null}
      <PageRuntime editing={editing} />
    </div>
  );
}

/**
 * The site's header and footer around a page made in code, so the coded
 * pages and the builder's pages are one website. Used by the project's
 * app/layout.tsx (through lib/artin-site.tsx). A builder page draws its own
 * header and footer (and may hide them), so on a builder page the frame
 * steps aside: one rule in the stylesheet, no script.
 */
export function SiteFrame({ children, site, header, footer, media = (p) => p, languages, products }: {
  children?: ReactNode;
  site?: PageSettings | null;
  header?: PageData | null;
  footer?: PageData | null;
  media?: (path: string) => string;
  languages?: PageLanguages | null;
  products?: ShopProduct[] | null;
}) {
  const head = header?.sections ?? [];
  const foot = footer?.sections ?? [];
  // The site's colours and fonts, as the code's tokens: coded pages look like the builder's, at once.
  const tokens = siteTokensCss(site);
  const siteFonts = site ? fontsHref(fontsOf({ version: 1, settings: site, sections: [] } as PageData)) : null;
  if (!head.length && !foot.length) {
    return (
      <>
        {siteFonts ? <link rel="stylesheet" href={siteFonts} precedence="default" /> : null}
        {tokens ? <style>{tokens.replace(/</g, '\\3C ')}</style> : null}
        {children}
      </>
    );
  }
  const ctx: RenderContext = { media, editing: false, ...(languages ? { languages } : {}), ...(products ? { products } : {}) };
  const whole: PageData = { version: 1, settings: site ? withoutChrome(site) : {}, sections: [...head, ...foot] } as PageData;
  const fonts = fontsHref([...(header ? fontsOf(header) : []), ...(footer ? fontsOf(footer) : []), ...fontsOf(whole)]);
  const css = `${tokens}\n${BASE_CSS}\n${PRO_CSS}\n${EXTRA_CSS}\n${pageCss(whole, media)}\n${FRAME_CSS}`.replace(/</g, '\\3C ');
  // A header that stays at the top sticks for the whole page, not only within its own box.
  const sticky = head.some((section) => section.settings?.sticky === true);
  return (
    <>
      {fonts ? <link rel="stylesheet" href={fonts} precedence="default" /> : null}
      <style>{css}</style>
      {head.length ? (
        <div className={`artin-page${sticky ? ' ab-sticky' : ''}`} data-ab-frame="header">
          {head.map((section) => <Section key={section.id} node={section} ctx={ctx} />)}
          <PageRuntime />
        </div>
      ) : null}
      {children}
      {foot.length ? (
        <div className="artin-page" data-ab-frame="footer">
          {foot.map((section) => <Section key={section.id} node={section} ctx={ctx} />)}
          <PageRuntime />
        </div>
      ) : null}
    </>
  );
}

/**
 * On a builder page (it draws its own header and footer), the frame's are not
 * shown. Nor on a page made in code that draws its own page header or footer
 * (a <header> or <footer> that is not part of an article, section and the
 * like): one header and one footer per page, never two.
 */
const OWN = ':not(:is(article,aside,main,nav,section,[data-ab-frame]) *)';
export const FRAME_CSS = [
  'body:has(.artin-page[data-ab-root]) [data-ab-frame]{display:none}',
  `body:has(header${OWN}) [data-ab-frame="header"]{display:none}`,
  `body:has(footer${OWN}) [data-ab-frame="footer"]{display:none}`,
].join('\n');

/** The site's settings never hide a page's header or footer: only a page may. */
function withoutChrome(site: PageSettings): PageSettings {
  const { hideHeader: _h, hideFooter: _f, ...rest } = site;
  return rest;
}

/** A page as the Content API gives it: the page, the site's settings, and its header and footer. */
export function BuilderRecordPage({ record, media }: {
  record: { data: PageData; site?: PageSettings | null; header?: PageData | null; footer?: PageData | null; languages?: PageLanguages | null; products?: ShopProduct[] | null };
  media?: (path: string) => string;
}) {
  return <BuilderPage page={record.data} site={record.site ?? null} header={record.header ?? null} footer={record.footer ?? null} languages={record.languages ?? null} products={record.products ?? null} {...(media ? { media } : {})} />;
}
