// Artin page builder v18. Rewritten when the builder is updated; your other files are never touched.
import type { CSSProperties, ReactNode } from 'react';

import { Icon } from './icons';
import { LANGUAGE_BY_CODE } from './languages';
import { imageProps, linkProps, richText, type RenderContext } from './parts';
import { richTextToPlain } from './richtext';
import { color, num, oneOf, src, text } from './safe';
import type { PageNode } from './types';

/**
 * The Pro widgets: gallery, slider, tabs, accordion, testimonial, price
 * table, counter, countdown, form, icon list, icon and image boxes, social
 * icons, progress bars, alert and map.
 *
 * Markup only: what moves (slides, tabs, counting, the countdown, sending
 * a form, the lightbox) is marked with data attributes that runtime.tsx
 * picks up. Without JavaScript every widget still shows its content.
 *
 * Part of the project's copy of the builder renderer.
 */

const s = (node: PageNode, key: string) => node.settings?.[key];

/**
 * Code that runs in the page: its scripts are written inert (type
 * text/plain) and runtime.tsx runs each once the page is showing, so they
 * run on the first load and after moving between pages alike. Data scripts
 * (JSON-LD and the like) are left as they are.
 */
export function inertScripts(html: string) {
  return html.replace(/<script\b([^>]*)>/gi, (whole, attrs: string) => {
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1]?.toLowerCase();
    if (type && !['text/javascript', 'application/javascript', 'module', 'text/ecmascript'].includes(type)) return whole;
    const rest = attrs.replace(/\btype\s*=\s*["']?[^"'\s>]+["']?/i, '');
    return `<script type="text/plain" data-ab-run=""${type === 'module' ? ' data-ab-type="module"' : ''}${rest}>`;
  });
}

/** A sandboxed frame's whole document: the code, with links opening outside the frame. */
export function frameDocument(code: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>html,body{margin:0}body{font-family:system-ui,sans-serif}</style></head><body>${code}</body></html>`;
}

/** The meta tags in some head code (verification, robots), as attributes React can render into the head. */
export function metaTagsOf(html: string) {
  const out: Array<Record<string, string>> = [];
  for (const m of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const attrs: Record<string, string> = {};
    for (const a of m[1]!.matchAll(/([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) {
      const key = a[1]!.toLowerCase();
      if (['name', 'property', 'content', 'charset'].includes(key)) attrs[key] = a[2] ?? a[3] ?? a[4] ?? '';
    }
    if ((attrs.name || attrs.property) && attrs.content !== undefined) out.push(attrs);
  }
  return out.slice(0, 20);
}

/** Page-wide code (the site's and the page's head and body code), run in the page on the live site. */
export function PageCode({ code, place }: { code: string; place: 'head' | 'body' }) {
  const meta = place === 'head' ? metaTagsOf(code) : [];
  const rest = place === 'head' ? code.replace(/<meta\b[^>]*>/gi, '') : code;
  return (
    <>
      {meta.map((m, i) => <meta key={i} {...(m.name ? { name: m.name } : { property: m.property })} content={m.content} />)}
      {rest.trim() ? <div hidden={place === 'head'} data-ab-code={place} dangerouslySetInnerHTML={{ __html: inertScripts(rest) }} /> : null}
    </>
  );
}
type Item = Record<string, unknown>;
const items = (node: PageNode, key: string): Item[] => (Array.isArray(s(node, key)) ? (s(node, key) as unknown[]).filter((i): i is Item => !!i && typeof i === 'object') : []);
const str = (v: unknown, max = 500) => text(v, max);
const vars = (v: Record<string, string | number | null | undefined>) => Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null && x !== undefined)) as CSSProperties;

export const BRAND: Record<string, string> = {
  facebook: '#1877f2', instagram: '#e4405f', 'x-twitter': '#000000', linkedin: '#0a66c2', youtube: '#ff0000', whatsapp: '#25d366', tiktok: '#000000', github: '#181717', mail: '#475569',
};
export const NETWORK_LABEL: Record<string, string> = {
  facebook: 'Facebook', instagram: 'Instagram', 'x-twitter': 'X', linkedin: 'LinkedIn', youtube: 'YouTube', whatsapp: 'WhatsApp', tiktok: 'TikTok', github: 'GitHub', mail: 'Email',
};
const RATIO: Record<string, string> = { '1:1': '1 / 1', '4:3': '4 / 3', '3:4': '3 / 4', '16:9': '16 / 9' };

function Stars({ value }: { value: number }) {
  return (
    <div className="ab-stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => <span key={n} className={n <= value ? 'ab-star-on' : 'ab-star-off'}><Icon name="star" /></span>)}
    </div>
  );
}

/** ₹1,299 or ₹1,299.50: a price as an Indian shop shows it. */
const rupees = (minor: number) => `₹${(minor / 100).toLocaleString('en-IN', { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

export function proWidget(node: PageNode, ctx: RenderContext): ReactNode {
  const id = node.id;
  switch (node.type) {
    case 'gallery': {
      const cols = num(s(node, 'columns'), 1, 6) ?? 3;
      const colsMobile = num(s(node, 'columnsMobile'), 1, 3) ?? 2;
      const gap = num(s(node, 'gap'), 0, 60) ?? 12;
      const ratio = RATIO[str(s(node, 'ratio'), 8)];
      const lightbox = s(node, 'lightbox') !== false;
      const list = items(node, 'images');
      if (list.length === 0) return <div className="ab-empty">Add images to the gallery in the panel.</div>;
      return (
        <div className="ab-gallery" style={vars({ '--ab-cols': cols, '--ab-cols-m': colsMobile, '--ab-gap': `${gap}px` })} data-ab-gallery={lightbox ? '' : undefined}>
          {list.map((item, i) => {
            const u = src(item.src);
            const alt = str(item.alt, 300);
            const caption = str(item.caption, 200);
            // eslint-disable-next-line @next/next/no-img-element
            const img = u ? <img {...imageProps(ctx, u, '(max-width: 768px) 50vw, 33vw')} alt={alt} loading="lazy" style={ratio ? { aspectRatio: ratio } : undefined} /> : <span className="ab-placeholder" style={{ aspectRatio: ratio ?? '4 / 3' }} />;
            return (
              <figure key={i} className="ab-gallery-item">
                {u && lightbox ? <a href={ctx.media(u)} data-ab-lightbox={caption || alt}>{img}</a> : img}
                {caption ? <figcaption>{caption}</figcaption> : null}
              </figure>
            );
          })}
        </div>
      );
    }

    case 'slider': {
      const slides = items(node, 'slides');
      const height = num(s(node, 'height'), 200, 1200) ?? 520;
      const interval = (num(s(node, 'interval'), 2, 30) ?? 6) * 1000;
      const overlay = color(s(node, 'overlay'));
      const align = oneOf(s(node, 'align'), ['left', 'center', 'right'] as const) ?? 'center';
      if (slides.length === 0) return <div className="ab-empty">Add slides in the panel.</div>;
      return (
        <div className={`ab-slider ab-slider-${align}`} data-ab-slider={s(node, 'autoplay') === false ? '0' : String(interval)}
          style={vars({ '--ab-h': `${height}px`, '--ab-overlay': overlay })} aria-roledescription="carousel" role="region" aria-label="Slides">
          <div className="ab-slides" data-ab-track tabIndex={0}>
            {slides.map((slide, i) => {
              const bg = src(slide.image);
              const link = linkProps(slide.buttonLink);
              return (
                <div key={i} className="ab-slide" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}
                  style={bg ? { backgroundImage: `url("${ctx.media(bg)}")` } : undefined}>
                  <div className="ab-slide-in">
                    {str(slide.heading, 200) ? <h2 className="ab-slide-title">{str(slide.heading, 200)}</h2> : null}
                    {str(slide.text, 600) ? <p className="ab-slide-text">{str(slide.text, 600)}</p> : null}
                    {str(slide.buttonText, 60) ? (link ? <a className="ab-btn ab-btn-lg" {...link}>{str(slide.buttonText, 60)}</a> : <span className="ab-btn ab-btn-lg">{str(slide.buttonText, 60)}</span>) : null}
                  </div>
                </div>
              );
            })}
          </div>
          {s(node, 'arrows') !== false && slides.length > 1 ? (
            <>
              <button type="button" className="ab-arrow ab-arrow-prev" data-ab-prev aria-label="Previous slide"><Icon name="arrow-left" /></button>
              <button type="button" className="ab-arrow ab-arrow-next" data-ab-next aria-label="Next slide"><Icon name="arrow-right" /></button>
            </>
          ) : null}
          {s(node, 'dots') !== false && slides.length > 1 ? (
            <div className="ab-dots">
              {slides.map((_, i) => <button key={i} type="button" data-ab-dot={i} aria-label={`Slide ${i + 1}`} aria-current={i === 0 ? 'true' : undefined} />)}
            </div>
          ) : null}
        </div>
      );
    }

    case 'tabs': {
      const list = items(node, 'items');
      const vertical = s(node, 'layout') === 'vertical';
      return (
        <div className={`ab-tabs${vertical ? ' ab-tabs-vertical' : ''}`} data-ab-tabs>
          <div className="ab-tablist" role="tablist" aria-orientation={vertical ? 'vertical' : 'horizontal'}>
            {list.map((item, i) => (
              <button key={i} type="button" role="tab" id={`ab-${id}-tab-${i}`} aria-controls={`ab-${id}-panel-${i}`} aria-selected={i === 0} tabIndex={i === 0 ? 0 : -1} data-ab-tab={i}>
                {str(item.title, 80)}
              </button>
            ))}
          </div>
          {list.map((item, i) => (
            <div key={i} role="tabpanel" id={`ab-${id}-panel-${i}`} aria-labelledby={`ab-${id}-tab-${i}`} className="ab-tabpanel ab-text" hidden={i !== 0} data-ab-panel={i}>
              {richText(str(item.text, 20_000), ctx)}
            </div>
          ))}
        </div>
      );
    }

    case 'accordion': {
      const list = items(node, 'items');
      const faq = s(node, 'faqSchema') === true ? JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: list.map((item) => ({ '@type': 'Question', name: str(item.title, 200), acceptedAnswer: { '@type': 'Answer', text: richTextToPlain(str(item.text, 20_000), 2000) } })),
      }).replace(/</g, '\\u003c') : null;
      return (
        <div className="ab-accordion">
          {list.map((item, i) => (
            <details key={i} className="ab-acc-item" open={i === 0 && s(node, 'openFirst') !== false}>
              <summary className="ab-acc-title"><span>{str(item.title, 200)}</span><span className="ab-acc-icon" aria-hidden><Icon name="chevron-down" /></span></summary>
              <div className="ab-acc-body ab-text">{richText(str(item.text, 20_000), ctx)}</div>
            </details>
          ))}
          {/* Structured data for search engines; `<` is escaped, so it cannot end the script early. */}
          {faq ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faq }} /> : null}
        </div>
      );
    }

    case 'testimonial': {
      const avatar = src(s(node, 'avatar'));
      const rating = num(s(node, 'rating'), 0, 5) ?? 0;
      return (
        <figure className={`ab-card ab-testimonial${s(node, 'layout') === 'center' ? ' ab-testimonial-center' : ''}`}>
          {rating ? <Stars value={Math.round(rating)} /> : null}
          <blockquote className="ab-quote">“{str(s(node, 'quote'), 1200)}”</blockquote>
          <figcaption className="ab-person">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {avatar ? <img {...imageProps(ctx, avatar, '96px')} alt="" className="ab-avatar" loading="lazy" /> : <span className="ab-avatar ab-avatar-empty" aria-hidden>{str(s(node, 'name'), 80).slice(0, 1)}</span>}
            <span><strong>{str(s(node, 'name'), 80)}</strong>{str(s(node, 'role'), 120) ? <span className="ab-role">{str(s(node, 'role'), 120)}</span> : null}</span>
          </figcaption>
        </figure>
      );
    }

    case 'pricing': {
      const link = linkProps(s(node, 'buttonLink'));
      const featured = s(node, 'featured') === true;
      const ribbon = str(s(node, 'ribbon'), 30);
      return (
        <div className={`ab-card ab-pricing${featured ? ' ab-pricing-featured' : ''}`}>
          {ribbon ? <span className="ab-ribbon">{ribbon}</span> : null}
          <h3 className="ab-plan">{str(s(node, 'title'), 80)}</h3>
          {str(s(node, 'subtitle'), 200) ? <p className="ab-plan-sub">{str(s(node, 'subtitle'), 200)}</p> : null}
          <p className="ab-price"><span className="ab-currency">{str(s(node, 'currency'), 4)}</span>{str(s(node, 'price'), 20)}{str(s(node, 'period'), 30) ? <span className="ab-period">/{str(s(node, 'period'), 30)}</span> : null}</p>
          <ul className="ab-features">
            {items(node, 'features').map((f, i) => (
              <li key={i} className={f.included === false ? 'ab-off' : ''}>
                <Icon name={f.included === false ? 'x' : 'check'} /><span>{str(f.text, 160)}</span>
                {f.included === false ? <span className="ab-sr">(not included)</span> : null}
              </li>
            ))}
          </ul>
          {str(s(node, 'buttonText'), 60) ? (link
            ? <a className={`ab-btn ab-btn-md ab-btn-full${featured ? '' : ' ab-btn-outline'}`} {...link}>{str(s(node, 'buttonText'), 60)}</a>
            : <span className={`ab-btn ab-btn-md ab-btn-full${featured ? '' : ' ab-btn-outline'}`}>{str(s(node, 'buttonText'), 60)}</span>) : null}
        </div>
      );
    }

    case 'counter': {
      const end = num(s(node, 'end'), -1e9, 1e9) ?? 0;
      const start = num(s(node, 'start'), -1e9, 1e9) ?? 0;
      const separator = s(node, 'separator') !== false;
      const shown = separator ? end.toLocaleString('en-IN') : String(end);
      // A counter given its own colour (white on a dark band) is that colour throughout, its label a little quieter.
      const own = ['desktop', 'tablet', 'mobile'].some((d) => typeof node.style?.[d as 'desktop']?.color === 'string');
      return (
        <div className={own ? 'ab-counter ab-counter-own' : 'ab-counter'}>
          <div className="ab-count">
            {str(s(node, 'prefix'), 10)}
            <span data-ab-count={end} data-ab-from={start} data-ab-dur={num(s(node, 'duration'), 300, 10_000) ?? 2000} data-ab-sep={separator ? '1' : '0'}>{shown}</span>
            {str(s(node, 'suffix'), 10)}
          </div>
          {str(s(node, 'title'), 120) ? <div className="ab-count-title">{str(s(node, 'title'), 120)}</div> : null}
        </div>
      );
    }

    case 'countdown': {
      const at = str(s(node, 'at'), 16);
      const valid = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(at);
      if (!valid) return <div className="ab-empty">Choose the date and time to count down to.</div>;
      const labels = s(node, 'labels') !== false;
      return (
        <div className="ab-countdown" data-ab-countdown={at} data-ab-done={str(s(node, 'done'), 200)}>
          {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => (
            <div key={unit} className="ab-cd-unit">
              <span className="ab-cd-num" data-ab-unit={unit}>–</span>
              {labels ? <span className="ab-cd-label">{unit[0]!.toUpperCase() + unit.slice(1)}</span> : null}
            </div>
          ))}
          <noscript><time dateTime={at}>{at.replace('T', ' ')}</time></noscript>
        </div>
      );
    }

    case 'form': {
      const form = s(node, 'form') as { key?: string; fields?: Array<{ key: string; label: string; type: string; required: boolean; options?: string[] }>; successMessage?: string } | undefined;
      if (!form?.key || !/^[a-z][a-z0-9-]{1,30}$/.test(form.key) || !Array.isArray(form.fields)) {
        return <div className="ab-empty">Choose one of the site’s forms in the panel (make one under Forms first).</div>;
      }
      const endpoint = `/_artin/forms/v1/${form.key}`;
      return (
        <form className={`ab-form${s(node, 'columns') === true ? ' ab-form-cols' : ''}`} action={endpoint} method="post" data-ab-form={str(form.successMessage, 200) || 'Thanks! We’ll be in touch soon.'} noValidate>
          {form.fields.slice(0, 20).map((field) => {
            if (!/^[a-z][a-zA-Z0-9]{0,30}$/.test(field.key)) return null;
            const fid = `ab-${id}-${field.key}`;
            const common = { id: fid, name: field.key, required: field.required === true };
            const label = `${str(field.label, 80)}${field.required ? ' *' : ''}`;
            return (
              <div key={field.key} className={`ab-field${field.type === 'longtext' ? ' ab-field-wide' : ''}`}>
                {field.type === 'checkbox' ? (
                  <label htmlFor={fid} className="ab-check"><input type="checkbox" value="yes" {...common} /><span>{label}</span></label>
                ) : (
                  <>
                    <label htmlFor={fid}>{label}</label>
                    {field.type === 'longtext' ? <textarea {...common} rows={5} />
                      : field.type === 'select' ? (
                        <select {...common} defaultValue=""><option value="" disabled>Choose…</option>{(field.options ?? []).map((o) => <option key={o} value={str(o, 80)}>{str(o, 80)}</option>)}</select>
                      ) : <input {...common} type={['email', 'tel', 'number'].includes(field.type) ? field.type : 'text'} autoComplete={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : undefined} />}
                  </>
                )}
                <span className="ab-field-error" data-ab-error={field.key} role="alert" />
              </div>
            );
          })}
          {/* Spam traps: invisible to people, filled in by many bots. */}
          <div aria-hidden="true" className="ab-hp"><label>Leave this empty <input type="text" name="_artin_hp" tabIndex={-1} autoComplete="off" defaultValue="" /></label></div>
          <input type="hidden" name="_artin_t" defaultValue={String(Date.now())} data-ab-started />
          <p className="ab-form-message" role="status" data-ab-message hidden />
          <div className="ab-field-wide"><button type="submit" className="ab-btn ab-btn-md">{str(s(node, 'submitText'), 60) || 'Send'}</button></div>
        </form>
      );
    }

    case 'iconList': {
      const inlineLayout = s(node, 'layout') === 'inline';
      const iconColor = color(s(node, 'iconColor'));
      return (
        <ul className={`ab-icon-list${inlineLayout ? ' ab-icon-list-inline' : ''}`} style={iconColor ? vars({ '--ab-icon': iconColor }) : undefined}>
          {items(node, 'items').map((item, i) => {
            const link = linkProps(item.link);
            const body = <><span className="ab-li-icon" aria-hidden><Icon name={str(item.icon, 40) || 'check'} /></span><span>{str(item.text, 200)}</span></>;
            return <li key={i}>{link ? <a {...link}>{body}</a> : body}</li>;
          })}
        </ul>
      );
    }

    case 'iconBox': {
      const link = linkProps(s(node, 'link'));
      const beside = s(node, 'position') === 'left';
      const title = str(s(node, 'title'), 120);
      // Given its own colour (light words on a dark card), its text is that colour too, a little quieter.
      const own = ['desktop', 'tablet', 'mobile'].some((d) => typeof node.style?.[d as 'desktop']?.color === 'string');
      return (
        <div className={`ab-card ab-icon-box${beside ? ' ab-icon-box-left' : ''}${own ? ' ab-box-own' : ''}`}>
          <span className="ab-box-icon" aria-hidden><Icon name={str(s(node, 'icon'), 40) || 'zap'} /></span>
          <div>
            {title ? <h3 className="ab-box-title">{link ? <a {...link}>{title}</a> : title}</h3> : null}
            {str(s(node, 'text'), 600) ? <p className="ab-box-text">{str(s(node, 'text'), 600)}</p> : null}
          </div>
        </div>
      );
    }

    case 'imageBox': {
      const link = linkProps(s(node, 'link'));
      const u = src(s(node, 'image'));
      const title = str(s(node, 'title'), 120);
      return (
        <div className="ab-card ab-image-box">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {u ? <img {...imageProps(ctx, u, '(max-width: 768px) 100vw, 33vw')} alt={str(s(node, 'alt'), 300)} loading="lazy" /> : <span className="ab-placeholder" />}
          <div className="ab-image-box-body">
            {title ? <h3 className="ab-box-title">{link ? <a {...link}>{title}</a> : title}</h3> : null}
            {str(s(node, 'text'), 600) ? <p className="ab-box-text">{str(s(node, 'text'), 600)}</p> : null}
          </div>
        </div>
      );
    }

    case 'socialIcons': {
      const shape = oneOf(s(node, 'shape'), ['circle', 'rounded', 'square', 'none'] as const) ?? 'circle';
      const size = num(s(node, 'size'), 16, 80) ?? 40;
      const brand = s(node, 'brandColors') !== false;
      return (
        <ul className={`ab-social ab-social-${shape}`} style={vars({ '--ab-size': `${size}px` })}>
          {items(node, 'items').map((item, i) => {
            const network = str(item.network, 20);
            const label = NETWORK_LABEL[network];
            if (!label) return null;
            const url = network === 'mail' && typeof item.url === 'string' && /^[^\s@]+@[^\s@]+$/.test(item.url) ? `mailto:${item.url}` : item.url;
            const link = linkProps(url);
            const style = brand ? vars({ '--ab-brand': BRAND[network] }) : undefined;
            return (
              <li key={i}>
                {link ? <a {...link} aria-label={label} style={style}><Icon name={network} /></a> : <span aria-label={label} style={style}><Icon name={network} /></span>}
              </li>
            );
          })}
        </ul>
      );
    }

    case 'progress': {
      const bar = color(s(node, 'barColor'));
      const show = s(node, 'showPercent') !== false;
      return (
        <div className="ab-progress" style={bar ? vars({ '--ab-bar': bar }) : undefined}>
          {items(node, 'items').map((item, i) => {
            const pct = num(item.percent, 0, 100) ?? 0;
            return (
              <div key={i} className="ab-bar-row">
                <div className="ab-bar-label"><span>{str(item.label, 80)}</span>{show ? <span>{pct}%</span> : null}</div>
                <div className="ab-bar" role="progressbar" aria-label={str(item.label, 80)} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <span data-ab-grow style={vars({ '--ab-p': `${pct}%` })} />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    case 'alert': {
      const tone = oneOf(s(node, 'tone'), ['info', 'success', 'warning', 'danger'] as const) ?? 'info';
      const icon = { info: 'info', success: 'check-circle', warning: 'alert', danger: 'alert' }[tone];
      return (
        <div className={`ab-card ab-alert ab-alert-${tone}`} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'} data-ab-alert>
          <span className="ab-alert-icon" aria-hidden><Icon name={icon} /></span>
          <div className="ab-alert-body">
            {str(s(node, 'title'), 120) ? <strong>{str(s(node, 'title'), 120)}</strong> : null}
            {str(s(node, 'text'), 600) ? <p>{str(s(node, 'text'), 600)}</p> : null}
          </div>
          {s(node, 'dismiss') === true ? <button type="button" className="ab-alert-close" data-ab-dismiss aria-label="Close"><Icon name="x" /></button> : null}
        </div>
      );
    }

    case 'embed': {
      const code = typeof s(node, 'code') === 'string' ? (s(node, 'code') as string).slice(0, 20_000) : '';
      const height = num(s(node, 'height'), 40, 2000) ?? 300;
      const inPage = s(node, 'mode') === 'page';
      if (!code.trim()) return <div className="ab-empty">Paste HTML, CSS or JavaScript in the panel.</div>;
      // The editor never runs code in the dashboard: both kinds show in a sandboxed frame there.
      if (inPage && !ctx.editing) return <div className="ab-embed" data-ab-code="" dangerouslySetInnerHTML={{ __html: inertScripts(code) }} />;
      return (
        <div className="ab-embed-frame">
          {inPage && ctx.editing ? <span className="ab-embed-note">Runs in the page on the live site</span> : null}
          <iframe title="Embedded content" loading="lazy" style={{ height }} srcDoc={frameDocument(code)}
            sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation" referrerPolicy="no-referrer" />
        </div>
      );
    }

    case 'map': {
      const query = str(s(node, 'query'), 200).trim();
      const zoom = num(s(node, 'zoom'), 1, 20) ?? 14;
      const height = num(s(node, 'height'), 150, 900) ?? 380;
      if (!query) return <div className="ab-empty">Type an address or a place in the panel.</div>;
      return (
        <div className="ab-map" style={{ height }}>
          <iframe title={`Map: ${query}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=${Math.round(zoom)}&output=embed`} />
        </div>
      );
    }

    case 'menu': {
      const align = oneOf(s(node, 'align'), ['start', 'center', 'end'] as const) ?? 'end';
      const collapse = oneOf(s(node, 'collapse'), ['mobile', 'tablet', 'never'] as const) ?? 'mobile';
      const look = oneOf(s(node, 'look'), ['underline', 'pill', 'plain'] as const) ?? 'underline';
      // A link "in the drop-down of" another top-level link goes under it; one naming no such link stays on top.
      const all = items(node, 'items');
      const key = (v: unknown) => str(v, 40).trim().toLowerCase();
      const topLabels = new Set(all.filter((i) => !key(i.under)).map((i) => key(i.label)));
      const top = all.filter((i) => !key(i.under) || !topLabels.has(key(i.under)));
      const under = (parent: Item) => all.filter((i) => key(i.under) && key(i.under) === key(parent.label) && !key(parent.under));
      const anchor = (item: Item) => {
        const link = linkProps(item.link, false);
        return link ? <a {...link}>{str(item.label, 40)}</a> : <span>{str(item.label, 40)}</span>;
      };
      return (
        <nav className={`ab-menu ab-menu-${align} ab-collapse-${collapse} ab-menu-look-${look}`} aria-label="Main" data-ab-menu>
          <button type="button" className="ab-menu-toggle" aria-expanded="false" aria-label="Menu" data-ab-menu-toggle><Icon name="menu" /></button>
          <ul className="ab-menu-list">
            {top.map((item, i) => {
              const children = under(item);
              if (!children.length) return <li key={i}>{anchor(item)}</li>;
              const link = linkProps(item.link, false);
              return (
                <li key={i} className="ab-has-sub">
                  {link
                    ? <a {...link} className="ab-sub-toggle" aria-haspopup="true">{str(item.label, 40)}<Icon name="chevron-down" /></a>
                    : <span className="ab-sub-toggle" tabIndex={0} aria-haspopup="true">{str(item.label, 40)}<Icon name="chevron-down" /></span>}
                  <ul className="ab-submenu">{children.map((child, j) => <li key={j}>{anchor(child)}</li>)}</ul>
                </li>
              );
            })}
          </ul>
        </nav>
      );
    }

    case 'products': {
      const all = ctx.products ?? [];
      const chosen = s(node, 'source') === 'chosen' ? (Array.isArray(s(node, 'products')) ? (s(node, 'products') as unknown[]).filter((x): x is string => typeof x === 'string') : []) : null;
      const limit = num(s(node, 'limit'), 1, 24) ?? 8;
      const shown = (chosen ? chosen.map((slug) => all.find((p) => p.slug === slug)).filter((p): p is NonNullable<typeof p> => !!p) : all).slice(0, limit);
      const columns = num(s(node, 'columns'), 1, 4) ?? 4;
      const button = str(s(node, 'buttonText'), 40);
      if (!shown.length) return ctx.editing ? <div className="ab-empty">{all.length ? 'Choose products in the panel.' : 'Products on sale in your store show here.'}</div> : null;
      return (
        <ul className="ab-products" style={{ ['--ab-cols' as string]: String(columns) }}>
          {shown.map((p) => (
            <li key={p.slug}>
              <a href={`/shop/${encodeURIComponent(p.slug)}`} className="ab-product">
                <span className="ab-product-img">{p.images[0] ? <img {...imageProps(ctx, p.images[0], `(max-width: 767px) 50vw, ${Math.round(100 / columns)}vw`)} alt={p.name} loading="lazy" /> : null}</span>
                <span className="ab-product-name">{str(p.name, 160)}</span>
                {s(node, 'showPrice') !== false ? (
                  <span className="ab-product-price">
                    {rupees(p.priceMinor)}
                    {p.compareAtMinor ? <s>{rupees(p.compareAtMinor)}</s> : null}
                    {p.soldOut ? <em>Sold out</em> : null}
                  </span>
                ) : null}
                {button ? <span className="ab-product-button">{button}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      );
    }

    case 'languages': {
      // In the editor (or a site in one language) a sample shows where the links will be.
      const langs = ctx.languages ?? (ctx.editing ? { current: 'en', locales: ['en', 'hi'], path: '/' } : null);
      if (!langs || langs.locales.length < 2) return null;
      const align = oneOf(s(node, 'align'), ['start', 'center', 'end'] as const) ?? 'end';
      const codes = s(node, 'show') === 'codes';
      return (
        <nav className={`ab-langs ab-menu-${align}`} aria-label="Language">
          <ul>
            {langs.locales.filter((code) => /^[a-z]{2,3}$/.test(code)).map((code) => (
              <li key={code}>
                <a href={`/${code}${langs.path === '/' ? '' : langs.path}`} hrefLang={code} lang={code} aria-current={code === langs.current ? 'true' : undefined}>
                  {codes ? code.toUpperCase() : LANGUAGE_BY_CODE.get(code)?.native ?? code}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      );
    }

    default:
      return null;
  }
}

/** Styles for the Pro widgets, added to the base stylesheet. */
export const PRO_CSS = `
.ab-empty{padding:24px;border:1px dashed var(--ab-line);border-radius:10px;color:var(--ab-muted);text-align:center;font-size:14px}
.ab-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.ab-gallery{display:grid;grid-template-columns:repeat(var(--ab-cols,3),minmax(0,1fr));gap:var(--ab-gap,12px)}
@container artin-page (max-width:767px){.ab-gallery{grid-template-columns:repeat(var(--ab-cols-m,2),minmax(0,1fr))}}
.ab-gallery-item{margin:0}.ab-gallery-item img,.ab-gallery-item .ab-placeholder{display:block;width:100%;height:auto;object-fit:cover;border-radius:10px;transition:transform .35s ease,filter .35s ease}
.ab-gallery-item a{display:block;overflow:hidden;border-radius:10px;cursor:zoom-in}.ab-gallery-item a:hover img{transform:scale(1.04)}
.ab-gallery-item figcaption{margin-top:6px;font-size:13px;color:var(--ab-muted)}
.ab-lightbox{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:rgba(2,6,23,.9);padding:24px}
.ab-lightbox img{max-width:min(1200px,92vw);max-height:84vh;border-radius:8px;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.ab-lightbox p{margin:12px 0 0;color:#e2e8f0;text-align:center;font:14px system-ui}
.ab-lightbox button{position:absolute;display:grid;place-items:center;width:48px;height:48px;border:0;border-radius:999px;background:rgba(255,255,255,.12);color:#fff;cursor:pointer;font-size:22px}
.ab-lightbox button:hover{background:rgba(255,255,255,.25)}.ab-lb-close{top:16px;right:16px}.ab-lb-prev{left:16px;top:50%}.ab-lb-next{right:16px;top:50%}
.ab-slider{position:relative;border-radius:16px;overflow:hidden;color:#fff}
.ab-slides{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none}.ab-slides::-webkit-scrollbar{display:none}
.ab-slide{position:relative;flex:0 0 100%;min-height:var(--ab-h,520px);scroll-snap-align:start;display:flex;align-items:center;background:linear-gradient(135deg,#312e81,#0f172a);background-size:cover;background-position:center}
.ab-slide::before{content:"";position:absolute;inset:0;background:var(--ab-overlay,transparent)}
.ab-slide-in{position:relative;width:100%;max-width:820px;padding:48px 64px;display:grid;gap:16px;justify-items:start}
.ab-slider-center .ab-slide-in{margin:0 auto;text-align:center;justify-items:center}.ab-slider-right .ab-slide-in{margin-left:auto;text-align:right;justify-items:end}
.ab-slide-title{margin:0;font-size:48px;line-height:1.1;font-weight:800;letter-spacing:-0.02em}.ab-slide-text{margin:0;font-size:19px;opacity:.9}
@container artin-page (max-width:767px){.ab-slide-title{font-size:32px}.ab-slide-in{padding:32px 24px}.ab-slider .ab-arrow{display:none}}
.ab-arrow{position:absolute;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:46px;height:46px;border:0;border-radius:999px;background:rgba(255,255,255,.18);color:#fff;cursor:pointer;backdrop-filter:blur(6px);transition:background .2s}
.ab-arrow:hover{background:rgba(255,255,255,.32)}.ab-arrow svg{width:20px;height:20px}.ab-arrow-prev{left:16px}.ab-arrow-next{right:16px}
.ab-dots{position:absolute;bottom:18px;left:0;right:0;display:flex;justify-content:center;gap:8px}
.ab-dots button{width:10px;height:10px;border:0;border-radius:999px;background:rgba(255,255,255,.45);cursor:pointer;padding:0;transition:width .25s,background .25s}
.ab-dots button[aria-current="true"]{width:28px;background:#fff}
.ab-tabs{display:grid;gap:0}.ab-tablist{display:flex;gap:4px;border-bottom:1px solid var(--ab-line);flex-wrap:wrap}
.ab-tablist [role=tab]{padding:12px 18px;border:0;border-bottom:2px solid transparent;margin-bottom:-1px;background:none;color:var(--ab-muted);font:inherit;font-weight:600;cursor:pointer}
.ab-tablist [role=tab][aria-selected=true]{color:var(--ab-accent);border-bottom-color:var(--ab-accent)}
.ab-tabpanel{padding:20px 4px}
.ab-tabs-vertical{grid-template-columns:220px 1fr;gap:24px}.ab-tabs-vertical .ab-tablist{flex-direction:column;border-bottom:0;border-right:1px solid var(--ab-line)}
.ab-tabs-vertical .ab-tablist [role=tab]{text-align:left;border-bottom:0;border-right:2px solid transparent;margin:0 -1px 0 0}
.ab-tabs-vertical .ab-tablist [role=tab][aria-selected=true]{border-right-color:var(--ab-accent)}
@container artin-page (max-width:767px){.ab-tabs-vertical{grid-template-columns:1fr}.ab-tabs-vertical .ab-tablist{flex-direction:row;border-right:0;border-bottom:1px solid var(--ab-line)}}
.ab-accordion{display:grid;gap:10px}
.ab-acc-item{border:1px solid var(--ab-line);border-radius:12px;background:#fff;overflow:hidden}
.ab-acc-title{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 20px;font-weight:600;cursor:pointer;list-style:none}
.ab-acc-title::-webkit-details-marker{display:none}.ab-acc-icon{display:inline-flex;transition:transform .25s}.ab-acc-icon svg{width:18px;height:18px}
.ab-acc-item[open] .ab-acc-icon{transform:rotate(180deg)}.ab-acc-body{padding:0 20px 18px}
.ab-card{position:relative;border-radius:16px;background:#fff;border:1px solid var(--ab-line);padding:28px;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}
.ab-stars{display:flex;gap:2px;margin-bottom:12px}.ab-stars svg{width:18px;height:18px}.ab-star-on{color:#f59e0b}.ab-star-on svg{fill:currentColor}.ab-star-off{color:#cbd5e1}
.ab-testimonial{margin:0}.ab-quote{margin:0;font-size:18px;line-height:1.6;color:var(--ab-ink)}
.ab-person{display:flex;align-items:center;gap:12px;margin-top:20px}.ab-person strong{display:block}.ab-role{display:block;font-size:14px;color:var(--ab-muted)}
.ab-avatar{width:48px;height:48px;border-radius:999px;object-fit:cover;flex:none}.ab-avatar-empty{display:grid;place-items:center;background:color-mix(in srgb,var(--ab-accent) 15%,white);color:var(--ab-accent);font-weight:700}
.ab-testimonial-center{text-align:center}.ab-testimonial-center .ab-stars,.ab-testimonial-center .ab-person{justify-content:center}
.ab-pricing{display:flex;flex-direction:column;gap:12px;height:100%}
.ab-pricing-featured{border:2px solid var(--ab-accent);box-shadow:0 24px 48px -20px color-mix(in srgb,var(--ab-accent) 45%,transparent)}
.ab-ribbon{position:absolute;top:16px;right:16px;padding:4px 10px;border-radius:999px;background:var(--ab-accent);color:#fff;font-size:12px;font-weight:700}
.ab-plan{margin:0;font-size:20px;font-weight:700}.ab-plan-sub{margin:0;color:var(--ab-muted);font-size:15px}
.ab-price{margin:8px 0;font-size:44px;font-weight:800;letter-spacing:-0.03em;line-height:1}.ab-currency{font-size:24px;vertical-align:top;margin-right:2px}.ab-period{font-size:16px;font-weight:500;color:var(--ab-muted);margin-left:4px}
.ab-features{list-style:none;margin:8px 0 16px;padding:0;display:grid;gap:10px;flex:1}
.ab-features li{display:flex;align-items:center;gap:10px}.ab-features svg{width:18px;height:18px;flex:none;color:#16a34a}.ab-features .ab-off{color:var(--ab-muted);text-decoration:line-through}.ab-features .ab-off svg{color:#cbd5e1}
.ab-counter{display:grid;gap:4px}.ab-count{font-size:52px;font-weight:800;letter-spacing:-0.03em;line-height:1;color:var(--ab-accent);font-variant-numeric:tabular-nums}
.ab-count-title{color:var(--ab-muted);font-size:16px}
.ab-counter-own .ab-count{color:inherit}.ab-counter-own .ab-count-title{color:inherit;opacity:.75}
.ab-countdown{display:flex;flex-wrap:wrap;gap:12px}.ab-cd-unit{display:grid;justify-items:center;min-width:84px;padding:16px 12px;border-radius:14px;background:color-mix(in srgb,var(--ab-accent) 8%,white)}
.ab-cd-num{font-size:40px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;color:var(--ab-ink)}.ab-cd-label{margin-top:6px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--ab-muted)}
.ab-countdown-done{font-size:22px;font-weight:700}
.ab-form{display:grid;gap:16px}.ab-form-cols{grid-template-columns:repeat(2,minmax(0,1fr))}.ab-form-cols .ab-field-wide{grid-column:1/-1}
@container artin-page (max-width:767px){.ab-form-cols{grid-template-columns:1fr}}
.ab-field{display:grid;gap:6px}.ab-field label{font-weight:600;font-size:15px}
.ab-field input:not([type=checkbox]),.ab-field textarea,.ab-field select{width:100%;padding:12px 14px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:var(--ab-ink);font:inherit;transition:border-color .15s,box-shadow .15s}
.ab-field input:focus,.ab-field textarea:focus,.ab-field select:focus{outline:none;border-color:var(--ab-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--ab-accent) 20%,transparent)}
.ab-field [aria-invalid=true]{border-color:#dc2626}.ab-field-error{font-size:13px;color:#b91c1c}.ab-field-error:empty{display:none}
.ab-check{display:flex;align-items:flex-start;gap:8px;font-weight:500}.ab-check input{width:18px;height:18px;margin-top:3px;accent-color:var(--ab-accent)}
.ab-hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.ab-form-message{margin:0;padding:12px 16px;border-radius:10px;background:#fef2f2;color:#991b1b}.ab-form-sent{padding:20px 24px;border-radius:14px;background:color-mix(in srgb,var(--ab-accent) 10%,white);font-size:17px}
.ab-icon-list{list-style:none;margin:0;padding:0;display:grid;gap:12px}.ab-icon-list-inline{display:flex;flex-wrap:wrap;gap:12px 28px}
.ab-icon-list li,.ab-icon-list a{display:flex;align-items:center;gap:10px;text-decoration:none}
.ab-li-icon{display:inline-flex;color:var(--ab-icon,var(--ab-accent))}.ab-li-icon svg{width:20px;height:20px}
.ab-icon-box{display:grid;gap:14px}.ab-icon-box-left{grid-template-columns:auto 1fr;align-items:start}
.ab-box-icon{display:grid;place-items:center;width:56px;height:56px;border-radius:14px;background:color-mix(in srgb,var(--ab-accent) 12%,white);color:var(--ab-accent)}.ab-box-icon svg{width:28px;height:28px}
.ab-box-title{margin:0 0 6px;font-size:20px;font-weight:700}.ab-box-title a{text-decoration:none}.ab-box-text{margin:0;color:var(--ab-muted)}.ab-box-own .ab-box-text{color:inherit;opacity:.72}
.ab-image-box{padding:0;overflow:hidden}.ab-image-box img,.ab-image-box .ab-placeholder{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}.ab-image-box-body{padding:22px}
.ab-social{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:10px}
.ab-social a,.ab-social span{display:grid;place-items:center;width:var(--ab-size,40px);height:var(--ab-size,40px);color:#fff;background:var(--ab-brand,var(--ab-accent));transition:transform .2s,opacity .2s}
.ab-social a:hover{transform:translateY(-2px);opacity:.9}.ab-social svg{width:calc(var(--ab-size,40px)*.5);height:calc(var(--ab-size,40px)*.5)}
.ab-social-circle a,.ab-social-circle span{border-radius:999px}.ab-social-rounded a,.ab-social-rounded span{border-radius:10px}
.ab-social-none a,.ab-social-none span{background:none;color:var(--ab-brand,var(--ab-accent))}.ab-social-none svg{width:calc(var(--ab-size,40px)*.7);height:calc(var(--ab-size,40px)*.7)}
.ab-progress{display:grid;gap:16px}.ab-bar-label{display:flex;justify-content:space-between;margin-bottom:6px;font-weight:600;font-size:15px}
.ab-bar{height:10px;border-radius:999px;background:var(--ab-line);overflow:hidden}
.ab-bar span{display:block;height:100%;width:var(--ab-p);border-radius:inherit;background:var(--ab-bar,var(--ab-accent));transition:width 1.2s cubic-bezier(.2,.7,.2,1)}
.artin-page.ab-js .ab-bar span:not(.ab-in){width:0}
.ab-alert{display:flex;gap:12px;align-items:flex-start;padding:16px 18px;border-radius:12px}.ab-alert-icon svg{width:22px;height:22px}.ab-alert-body{flex:1}.ab-alert-body p{margin:2px 0 0}
.ab-alert-info{background:#eff6ff;border-color:#bfdbfe;color:#1e3a8a}.ab-alert-success{background:#f0fdf4;border-color:#bbf7d0;color:#14532d}
.ab-alert-warning{background:#fffbeb;border-color:#fde68a;color:#78350f}.ab-alert-danger{background:#fef2f2;border-color:#fecaca;color:#7f1d1d}
.ab-alert-close{border:0;background:none;color:inherit;cursor:pointer;opacity:.7;padding:2px}.ab-alert-close:hover{opacity:1}.ab-alert-close svg{width:18px;height:18px}
.ab-embed-frame{position:relative}.ab-embed-frame iframe{display:block;width:100%;border:0;background:transparent}
.ab-embed-note{position:absolute;top:6px;right:6px;z-index:1;font:600 11px/1.6 system-ui,sans-serif;padding:2px 8px;border-radius:999px;background:#1e1b4b;color:#fff;opacity:.85}
.ab-map{border-radius:14px;overflow:hidden;background:#e2e8f0}.ab-map iframe{width:100%;height:100%;border:0}
.ab-menu{position:relative;display:flex;align-items:center}.ab-menu-start{justify-content:flex-start}.ab-menu-center{justify-content:center}.ab-menu-end{justify-content:flex-end}
.ab-menu-list{display:flex;flex-wrap:wrap;align-items:center;gap:6px 28px;list-style:none;margin:0;padding:0}
.ab-menu-list a{text-decoration:none;font-weight:500;padding:6px 0;border-bottom:2px solid transparent;transition:color .2s,border-color .2s}
.ab-menu-list a:hover,.ab-menu-list a[aria-current=page]{color:var(--ab-accent);border-bottom-color:currentColor}
.ab-menu-toggle{display:none;place-items:center;width:44px;height:44px;border:1px solid var(--ab-line);border-radius:10px;background:transparent;color:inherit;cursor:pointer}.ab-menu-toggle svg{width:22px;height:22px}
@container artin-page (max-width:767px){.ab-ready .ab-collapse-mobile .ab-menu-toggle,.ab-ready .ab-collapse-tablet .ab-menu-toggle{display:grid}.ab-ready .ab-collapse-mobile .ab-menu-list,.ab-ready .ab-collapse-tablet .ab-menu-list{display:none;position:absolute;top:calc(100% + 8px);right:0;z-index:60;min-width:220px;flex-direction:column;align-items:stretch;gap:0;padding:8px;border:1px solid var(--ab-line);border-radius:12px;background:#fff;color:var(--ab-ink);box-shadow:0 18px 40px -12px rgba(15,23,42,.25)}.ab-ready .ab-open .ab-menu-list{display:flex!important}.ab-ready .ab-collapse-mobile .ab-menu-list a,.ab-ready .ab-collapse-tablet .ab-menu-list a{display:block;padding:10px 12px;border:0}}
@container artin-page (min-width:768px) and (max-width:1024px){.ab-ready .ab-collapse-tablet .ab-menu-toggle{display:grid}.ab-ready .ab-collapse-tablet .ab-menu-list{display:none;position:absolute;top:calc(100% + 8px);right:0;z-index:60;min-width:220px;flex-direction:column;align-items:stretch;gap:0;padding:8px;border:1px solid var(--ab-line);border-radius:12px;background:#fff;color:var(--ab-ink);box-shadow:0 18px 40px -12px rgba(15,23,42,.25)}.ab-ready .ab-collapse-tablet.ab-open .ab-menu-list{display:flex}.ab-ready .ab-collapse-tablet .ab-menu-list a{display:block;padding:10px 12px;border:0}}
.ab-sticky{position:sticky;top:0;z-index:50}
[data-ab-part]{display:contents}
@media (prefers-reduced-motion:reduce){.ab-slides{scroll-behavior:auto}.ab-bar span,.ab-gallery-item img,.ab-card,.ab-acc-icon{transition:none}}
.ab-langs ul{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0;padding:0;list-style:none}.ab-langs.ab-menu-center ul{justify-content:center}.ab-langs.ab-menu-end ul{justify-content:flex-end}
.ab-langs a{color:inherit;text-decoration:none;opacity:.8}.ab-langs a:hover{opacity:1;text-decoration:underline}.ab-langs a[aria-current]{opacity:1;font-weight:600}
.ab-products{display:grid;grid-template-columns:repeat(var(--ab-cols,4),minmax(0,1fr));gap:24px;margin:0;padding:0;list-style:none}
@container artin-page (max-width:1024px){.ab-products{grid-template-columns:repeat(min(var(--ab-cols,4),3),minmax(0,1fr))}}
@container artin-page (max-width:767px){.ab-products{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}}
.ab-product{display:grid;gap:8px;color:inherit;text-decoration:none}.ab-product-img{display:block;aspect-ratio:1;overflow:hidden;border-radius:12px;background:var(--ab-line)}
.ab-product-img img{width:100%;height:100%;object-fit:cover;transition:transform .35s ease}.ab-product:hover .ab-product-img img{transform:scale(1.04)}
.ab-product-name{font-weight:600}.ab-product:hover .ab-product-name{text-decoration:underline}.ab-product-price{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline}.ab-product-price s{opacity:.6;font-size:.9em}.ab-product-price em{font-style:normal;font-size:.85em;font-weight:600;opacity:.7}
.ab-product-button{justify-self:start;margin-top:4px;padding:8px 14px;border-radius:var(--ab-button-radius,8px);background:var(--ab-accent);color:#fff;font-size:14px;font-weight:600}
`.trim();
