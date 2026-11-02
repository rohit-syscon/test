// Artin page builder v17. Rewritten when the builder is updated; your other files are never touched.
import type { CSSProperties, ReactNode } from 'react';

import { Icon } from './icons';
import { imageProps, linkProps, type RenderContext } from './parts';
import { BRAND, NETWORK_LABEL } from './pro';
import { color, cssUrl, num, oneOf, src, text } from './safe';
import type { PageNode } from './types';

/**
 * More widgets: an animated heading, scrolling text, a logo wall, team
 * members, a timeline, a before-and-after slider, flip cards, a star rating,
 * the site's logo and tables.
 *
 * Markup only, as in pro.tsx: what moves (changing words, the before-and-after
 * divider) is marked with data attributes that runtime.tsx picks up, and
 * scrolling text and flip cards are CSS alone. Without JavaScript each still
 * shows its content: the first word, the divider where it starts.
 *
 * Part of the project's copy of the builder renderer.
 */

type Item = Record<string, unknown>;
const s = (node: PageNode, key: string) => node.settings?.[key];
const items = (node: PageNode, key: string): Item[] => (Array.isArray(s(node, key)) ? (s(node, key) as unknown[]).filter((i): i is Item => !!i && typeof i === 'object') : []);
const str = (v: unknown, max = 500) => text(v, max);
const vars = (v: Record<string, string | number | null | undefined>) => Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null && x !== undefined)) as CSSProperties;
const RATIO: Record<string, string> = { '16:9': '16 / 9', '4:3': '4 / 3', '1:1': '1 / 1', '3:4': '3 / 4' };
const NETWORKS = Object.keys(BRAND);

/** Profiles as small round icons, for team members. */
function Profiles({ list }: { list: Item[] }) {
  const shown = list.map((item) => ({ network: oneOf(item.network, NETWORKS), link: linkProps(item.url, true) })).filter((p) => p.network && p.link);
  if (!shown.length) return null;
  return (
    <ul className="ab-team-social">
      {shown.map((p, i) => (
        <li key={i}><a {...p.link!} aria-label={NETWORK_LABEL[p.network!]} style={vars({ '--ab-brand': BRAND[p.network!] })}><Icon name={p.network!} /></a></li>
      ))}
    </ul>
  );
}

/** Five stars filled to a fraction, so 4.7 shows as 4.7. */
function Rating({ value, label }: { value: number; label?: string }) {
  const stars = [1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" />);
  return (
    <span className="ab-rating-stars" role="img" aria-label={label ?? `${value} out of 5 stars`}>
      <span className="ab-rating-base" aria-hidden>{stars}</span>
      <span className="ab-rating-fill" aria-hidden style={{ width: `${(value / 5) * 100}%` }}>{stars}</span>
    </span>
  );
}

/** A row of items that scrolls forever: drawn twice, one after the other, and moved by half its width. */
function Marquee({ children, speed, reverse, pause, className = '' }: { children: ReactNode; speed: number; reverse: boolean; pause: boolean; className?: string }) {
  return (
    <div className={`ab-marquee${reverse ? ' ab-mq-reverse' : ''}${pause ? ' ab-mq-pause' : ''}${className}`} style={vars({ '--ab-speed': `${speed}s` })}>
      <div className="ab-mq-track">
        <div className="ab-mq-group">{children}</div>
        <div className="ab-mq-group" aria-hidden>{children}</div>
      </div>
    </div>
  );
}

export function extraWidget(node: PageNode, ctx: RenderContext): ReactNode {
  switch (node.type) {
    case 'animatedHeading': {
      const Tag = oneOf(s(node, 'tag'), ['h1', 'h2', 'h3', 'p'] as const) ?? 'h2';
      const effect = oneOf(s(node, 'effect'), ['type', 'slide', 'fade', 'highlight'] as const) ?? 'type';
      const words = items(node, 'words').map((w) => str(w.text, 60)).filter(Boolean);
      const before = str(s(node, 'before'), 200);
      const after = str(s(node, 'after'), 200);
      const every = Math.round((num(s(node, 'interval'), 1, 10) ?? 2.5) * 1000);
      return (
        <Tag className={`ab-heading ab-ah ab-ah-${effect}`}>
          {/* Read out once, whole: the moving words are only for the eye. */}
          <span className="ab-sr">{[before, words.join(', '), after].filter(Boolean).join(' ')}</span>
          <span aria-hidden>
            {before ? <span data-ab-edit="before">{before} </span> : null}
            <span className="ab-ah-words" style={vars({ '--ab-word': color(s(node, 'wordColor')) })} data-ab-rotate={words.length > 1 ? every : undefined} data-ab-effect={effect}>
              {words.map((w, i) => <span key={i} className="ab-ah-word" data-ab-on={i === 0 ? '' : undefined}>{w}</span>)}
            </span>
            {after ? <span> {after}</span> : null}
          </span>
        </Tag>
      );
    }

    case 'marquee': {
      const sep = str(s(node, 'separator'), 40);
      const row = items(node, 'items').map((item, i) => (
        <span key={i} className="ab-mq-item">
          <span>{str(item.text, 80)}</span>
          {sep ? <span className="ab-mq-sep" aria-hidden><Icon name={sep} /></span> : null}
        </span>
      ));
      if (!row.length) return <div className="ab-empty">Add some items.</div>;
      return <Marquee speed={num(s(node, 'speed'), 5, 120) ?? 30} reverse={s(node, 'direction') === 'right'} pause={s(node, 'pauseOnHover') !== false}>{row}</Marquee>;
    }

    case 'logos': {
      const list = items(node, 'items');
      if (!list.length) return <div className="ab-empty">Add some logos.</div>;
      const height = num(s(node, 'height'), 16, 160) ?? 40;
      const logo = (item: Item, i: number) => {
        const u = src(item.src);
        const name = str(item.name, 60);
        // eslint-disable-next-line @next/next/no-img-element
        const inner = u ? <img {...imageProps(ctx, u, '200px')} alt={str(item.alt, 120) || name} loading="lazy" /> : <span className="ab-logo-name">{name || 'Logo'}</span>;
        const link = linkProps(item.link, true);
        return <div key={i} className="ab-logo">{link ? <a {...link} aria-label={name || undefined}>{inner}</a> : inner}</div>;
      };
      const style = vars({ '--ab-logo-h': `${height}px`, '--ab-cols': num(s(node, 'columns'), 2, 8) ?? 6 });
      const grey = s(node, 'grayscale') !== false ? ' ab-logos-grey' : '';
      if (s(node, 'layout') === 'marquee') {
        return <div className={`ab-logos ab-logos-band${grey}`} style={style}><Marquee speed={num(s(node, 'speed'), 5, 120) ?? 35} reverse={false} pause>{list.map(logo)}</Marquee></div>;
      }
      return <div className={`ab-logos ab-logos-grid${grey}`} style={style}>{list.map(logo)}</div>;
    }

    case 'teamMember': {
      const layout = oneOf(s(node, 'layout'), ['card', 'overlay', 'round'] as const) ?? 'card';
      const u = src(s(node, 'image'));
      const name = str(s(node, 'name'), 80);
      const role = str(s(node, 'role'), 120);
      const bio = str(s(node, 'bio'), 600);
      // eslint-disable-next-line @next/next/no-img-element
      const photo = u ? <img {...imageProps(ctx, u, '(max-width: 768px) 100vw, 25vw')} alt={name} loading="lazy" /> : <div className="ab-placeholder" role="img" aria-label={name || 'Photo'} />;
      return (
        <article className={`ab-team ab-team-${layout}`}>
          <div className="ab-team-photo">{photo}</div>
          <div className="ab-team-body">
            <h3 className="ab-team-name" data-ab-edit="name">{name}</h3>
            {role ? <p className="ab-team-role" data-ab-edit="role">{role}</p> : null}
            {bio ? <p className="ab-team-bio" data-ab-edit="bio">{bio}</p> : null}
            <Profiles list={items(node, 'social')} />
          </div>
        </article>
      );
    }

    case 'timeline': {
      const layout = oneOf(s(node, 'layout'), ['left', 'alternate', 'horizontal'] as const) ?? 'left';
      const list = items(node, 'items');
      if (!list.length) return <div className="ab-empty">Add some moments.</div>;
      return (
        <ol className={`ab-timeline ab-tl-${layout}`} style={vars({ '--ab-tl': color(s(node, 'lineColor')) })}>
          {list.map((item, i) => {
            const icon = str(item.icon, 40);
            return (
              <li key={i} className="ab-tl-item">
                <span className="ab-tl-dot" aria-hidden>{icon ? <Icon name={icon} /> : null}</span>
                <div className="ab-tl-body">
                  {str(item.date, 40) ? <p className="ab-tl-date">{str(item.date, 40)}</p> : null}
                  <h3 className="ab-tl-title">{str(item.title, 120)}</h3>
                  {str(item.text, 500) ? <p className="ab-tl-text">{str(item.text, 500)}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      );
    }

    case 'beforeAfter': {
      const start = num(s(node, 'start'), 5, 95) ?? 50;
      const ratio = RATIO[oneOf(s(node, 'ratio'), Object.keys(RATIO))?.toString() ?? '16:9'] ?? '16 / 9';
      const alt = str(s(node, 'alt'), 200);
      const picture = (key: string, which: string) => {
        const u = src(s(node, key));
        // eslint-disable-next-line @next/next/no-img-element
        return u ? <img {...imageProps(ctx, u, '(max-width: 768px) 100vw, 60vw')} alt={alt ? `${alt}: ${which}` : which} loading="lazy" /> : <div className={`ab-placeholder ab-ba-empty-${key}`} role="img" aria-label={which} />;
      };
      return (
        <div className="ab-ba" style={vars({ '--ab-pos': `${start}%`, aspectRatio: ratio })} data-ab-compare>
          <div className="ab-ba-after">{picture('after', 'after')}</div>
          <div className="ab-ba-before">{picture('before', 'before')}</div>
          <span className="ab-ba-line" aria-hidden><span className="ab-ba-knob"><Icon name="chevron-right" /></span></span>
          {str(s(node, 'beforeLabel'), 30) ? <span className="ab-ba-label ab-ba-label-before">{str(s(node, 'beforeLabel'), 30)}</span> : null}
          {str(s(node, 'afterLabel'), 30) ? <span className="ab-ba-label ab-ba-label-after">{str(s(node, 'afterLabel'), 30)}</span> : null}
          <input type="range" className="ab-ba-range" min={0} max={100} defaultValue={start} aria-label="Move to compare before and after" data-ab-compare-range />
        </div>
      );
    }

    case 'flipBox': {
      const direction = s(node, 'direction') === 'up' ? 'up' : 'left';
      const icon = str(s(node, 'icon'), 40);
      const bg = cssUrl(s(node, 'image'), ctx.media);
      const button = linkProps(s(node, 'buttonLink'), false);
      const buttonText = str(s(node, 'buttonText'), 60);
      return (
        <div className={`ab-flip ab-flip-${direction}`} style={vars({ '--ab-h': `${num(s(node, 'height'), 160, 800) ?? 300}px` })} tabIndex={0}>
          <div className="ab-flip-inner">
            <div className={`ab-flip-face ab-flip-front${bg ? ' ab-flip-photo' : ''}`} style={bg ? { backgroundImage: bg } : undefined}>
              {icon ? <span className="ab-flip-icon"><Icon name={icon} /></span> : null}
              <h3 className="ab-flip-title" data-ab-edit="title">{str(s(node, 'title'), 120)}</h3>
              {str(s(node, 'text'), 400) ? <p className="ab-flip-text" data-ab-edit="text">{str(s(node, 'text'), 400)}</p> : null}
            </div>
            <div className="ab-flip-face ab-flip-back">
              <h3 className="ab-flip-title" data-ab-edit="backTitle">{str(s(node, 'backTitle'), 120)}</h3>
              {str(s(node, 'backText'), 600) ? <p className="ab-flip-text" data-ab-edit="backText">{str(s(node, 'backText'), 600)}</p> : null}
              {buttonText && button ? <a className="ab-btn ab-btn-sm" {...button}>{buttonText}</a> : null}
            </div>
          </div>
        </div>
      );
    }

    case 'starRating': {
      const rating = num(s(node, 'rating'), 0, 5) ?? 5;
      const label = str(s(node, 'label'), 120);
      return (
        <div className="ab-rating" style={vars({ '--ab-star': color(s(node, 'starColor')), '--ab-size': `${num(s(node, 'size'), 10, 80) ?? 22}px` })}>
          <Rating value={rating} />
          {label ? <span className="ab-rating-label" data-ab-edit="label">{label}</span> : null}
        </div>
      );
    }

    case 'siteLogo': {
      const show = oneOf(s(node, 'show'), ['both', 'image', 'name'] as const) ?? 'both';
      const u = src(s(node, 'image'));
      const name = str(s(node, 'name'), 60);
      const tagline = str(s(node, 'tagline'), 80);
      const link = linkProps(s(node, 'link') ?? '/', false) ?? linkProps('/', false)!;
      // eslint-disable-next-line @next/next/no-img-element
      const img = u && show !== 'name' ? <img {...imageProps(ctx, u, '240px')} alt={show === 'image' ? name : ''} /> : null;
      const words = show !== 'image' || !u ? (
        <span className="ab-logo-words">
          <span className="ab-logo-brand" data-ab-edit="name">{name}</span>
          {tagline ? <span className="ab-logo-tagline">{tagline}</span> : null}
        </span>
      ) : null;
      return <a className="ab-site-logo" {...link} style={vars({ '--ab-logo-h': `${num(s(node, 'height'), 16, 160) ?? 36}px` })}>{img}{words}</a>;
    }

    case 'table': {
      const rows = items(node, 'rows').map((r) => str(r.cells, 600).split('|').map((c) => c.trim()));
      if (!rows.length) return <div className="ab-empty">Add some rows.</div>;
      const width = Math.max(...rows.map((r) => r.length));
      const full = rows.map((r) => [...r, ...Array.from({ length: width - r.length }, () => '')]);
      const header = s(node, 'header') !== false;
      const [head, ...body] = header ? full : [null, ...full];
      const mark = num(s(node, 'highlight'), 0, 8) ?? 0;
      const cls = (i: number) => (mark && i === mark - 1 ? 'ab-table-mark' : undefined);
      const caption = str(s(node, 'caption'), 200);
      return (
        <div className="ab-table-wrap">
          <table className={`ab-table${s(node, 'striped') !== false ? ' ab-table-striped' : ''}`}>
            {caption ? <caption>{caption}</caption> : null}
            {head ? <thead><tr>{head.map((c, i) => <th key={i} scope="col" className={cls(i)}>{c}</th>)}</tr></thead> : null}
            <tbody>
              {(body as string[][]).map((r, ri) => (
                <tr key={ri}>{r.map((c, i) => (i === 0 && header ? <th key={i} scope="row" className={cls(i)}>{c}</th> : <td key={i} className={cls(i)}>{c}</td>))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      return null;
  }
}

/** Styles for these widgets, and for the animations every element may have (entrances are in css.ts). */
export const EXTRA_CSS = `
.ab-ah-words{display:inline-grid;color:var(--ab-word,var(--ab-accent))}
.ab-ah-word{grid-area:1/1;white-space:nowrap}
.ab-ah-word:not([data-ab-on]){visibility:hidden;opacity:0}
.ab-ah-slide .ab-ah-word{transition:transform .5s cubic-bezier(.2,.7,.2,1),opacity .5s}.ab-ah-slide .ab-ah-word:not([data-ab-on]){transform:translateY(60%)}
.ab-ah-fade .ab-ah-word{transition:opacity .6s}
.ab-ah-highlight .ab-ah-word{background:linear-gradient(currentColor,currentColor) 0 100%/0 .12em no-repeat;transition:background-size .8s cubic-bezier(.2,.7,.2,1)}.ab-ah-highlight .ab-ah-word[data-ab-on]{background-size:100% .12em}
.ab-ah-typing .ab-ah-word{display:none}.ab-ah-typed{white-space:nowrap;border-right:.08em solid currentColor;padding-right:.04em;animation:ab-caret 1s steps(1) infinite}
@keyframes ab-caret{50%{border-right-color:transparent}}
.ab-marquee{overflow:hidden;width:100%;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.ab-mq-track{display:flex;width:max-content;animation:ab-marquee var(--ab-speed,30s) linear infinite}
.ab-mq-reverse .ab-mq-track{animation-direction:reverse}.ab-mq-pause:hover .ab-mq-track{animation-play-state:paused}
.ab-mq-group{display:flex;align-items:center;flex-shrink:0}
.ab-mq-item{display:inline-flex;align-items:center;gap:32px;padding-right:32px;white-space:nowrap}
.ab-mq-sep{display:inline-flex;color:var(--ab-accent);font-size:.8em}.ab-mq-sep svg{width:1em;height:1em}
@keyframes ab-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.ab-logos-grid{display:grid;grid-template-columns:repeat(var(--ab-cols,6),minmax(0,1fr));gap:32px;align-items:center}
@container artin-page (max-width:767px){.ab-logos-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}}
.ab-logo{display:flex;align-items:center;justify-content:center}.ab-logos-band .ab-logo{padding:0 28px}
.ab-logo img{height:var(--ab-logo-h,40px);width:auto;max-width:180px;object-fit:contain}
.ab-logo-name{font-size:calc(var(--ab-logo-h,40px) * .55);font-weight:800;letter-spacing:-.02em;color:var(--ab-muted);white-space:nowrap}
.ab-logos-grey .ab-logo{filter:grayscale(1);opacity:.65;transition:filter .3s,opacity .3s}.ab-logos-grey .ab-logo:hover{filter:none;opacity:1}
.ab-team{display:grid;gap:14px;height:100%}
.ab-team-photo{overflow:hidden;border-radius:16px}.ab-team-photo img,.ab-team-photo .ab-placeholder{width:100%;aspect-ratio:4/5;object-fit:cover;display:block;transition:transform .5s ease}
.ab-team:hover .ab-team-photo img{transform:scale(1.04)}
.ab-team-name{margin:0;font-size:19px;font-weight:700;color:var(--ab-heading,var(--color-heading,inherit))}
.ab-team-role{margin:2px 0 0;color:var(--ab-accent);font-weight:600;font-size:14px}.ab-team-bio{margin:8px 0 0;color:var(--ab-muted);font-size:15px}
.ab-team-social{display:flex;gap:8px;list-style:none;margin:10px 0 0;padding:0}
.ab-team-social a{display:grid;place-items:center;width:34px;height:34px;border-radius:999px;background:var(--ab-accent-soft);color:var(--ab-brand,var(--ab-accent));transition:background .2s,color .2s}
.ab-team-social a:hover{background:var(--ab-brand,var(--ab-accent));color:#fff}.ab-team-social svg{width:16px;height:16px}
.ab-team-overlay{position:relative;gap:0}.ab-team-overlay .ab-team-body{position:absolute;inset:auto 0 0 0;padding:20px;border-radius:0 0 16px 16px;background:linear-gradient(transparent,rgba(2,6,23,.85));color:#fff}
.ab-team-overlay .ab-team-name{color:#fff}.ab-team-overlay .ab-team-role{color:rgba(255,255,255,.85)}.ab-team-overlay .ab-team-bio{color:rgba(255,255,255,.8)}
.ab-team-round{justify-items:center;text-align:center}.ab-team-round .ab-team-photo{width:160px;border-radius:999px;box-shadow:0 0 0 6px var(--ab-accent-soft)}.ab-team-round .ab-team-photo img,.ab-team-round .ab-team-photo .ab-placeholder{aspect-ratio:1}
.ab-team-round .ab-team-social{justify-content:center}
.ab-timeline{--ab-tl:var(--ab-accent);list-style:none;margin:0;padding:0;display:grid;gap:28px;position:relative}
.ab-tl-item{position:relative;display:grid;grid-template-columns:40px 1fr;gap:18px}
.ab-tl-left::before,.ab-tl-alternate::before{content:"";position:absolute;top:8px;bottom:8px;left:19px;width:2px;background:color-mix(in srgb,var(--ab-tl) 25%,transparent)}
.ab-tl-dot{position:relative;z-index:1;display:grid;place-items:center;width:40px;height:40px;border-radius:999px;background:var(--ab-tl);color:#fff;box-shadow:0 0 0 6px color-mix(in srgb,var(--ab-tl) 15%,transparent)}
.ab-tl-dot:empty::after{content:"";width:10px;height:10px;border-radius:999px;background:#fff}.ab-tl-dot svg{width:18px;height:18px}
.ab-tl-date{margin:0;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ab-tl)}
.ab-tl-title{margin:4px 0 0;font-size:20px;font-weight:700;color:var(--ab-heading,var(--color-heading,inherit))}.ab-tl-text{margin:6px 0 0;color:var(--ab-muted)}
@container artin-page (min-width:768px){
.ab-tl-alternate::before{left:50%;margin-left:-1px}
.ab-tl-alternate .ab-tl-item{grid-template-columns:1fr 40px 1fr}.ab-tl-alternate .ab-tl-dot{grid-column:2;grid-row:1}
.ab-tl-alternate .ab-tl-item:nth-child(odd) .ab-tl-body{grid-column:1;grid-row:1;text-align:right}.ab-tl-alternate .ab-tl-item:nth-child(even) .ab-tl-body{grid-column:3}
.ab-tl-horizontal{grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:24px}
.ab-tl-horizontal::before{content:"";position:absolute;top:19px;left:20px;right:20px;height:2px;background:color-mix(in srgb,var(--ab-tl) 25%,transparent)}
.ab-tl-horizontal .ab-tl-item{grid-template-columns:1fr;gap:14px}}
.ab-ba{position:relative;overflow:hidden;border-radius:16px;user-select:none;--ab-pos:50%}
.ab-ba img,.ab-ba .ab-placeholder{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:0;aspect-ratio:auto}
.ab-ba-after,.ab-ba-before{position:absolute;inset:0}.ab-ba-before{clip-path:inset(0 calc(100% - var(--ab-pos)) 0 0)}
.ab-ba-empty-before{background:linear-gradient(135deg,#94a3b8,#64748b)}.ab-ba-empty-after{background:linear-gradient(135deg,var(--ab-accent-light),var(--ab-accent))}
.ab-ba-line{position:absolute;top:0;bottom:0;left:var(--ab-pos);width:3px;margin-left:-1.5px;background:#fff;box-shadow:0 0 12px rgba(0,0,0,.35);pointer-events:none}
.ab-ba-knob{position:absolute;top:50%;left:50%;display:grid;place-items:center;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:999px;background:#fff;color:var(--ab-ink);box-shadow:0 6px 20px rgba(0,0,0,.3)}.ab-ba-knob svg{width:20px;height:20px}
.ab-ba-label{position:absolute;top:14px;padding:5px 12px;border-radius:999px;background:rgba(2,6,23,.6);color:#fff;font-size:13px;font-weight:600;pointer-events:none}.ab-ba-label-before{left:14px}.ab-ba-label-after{right:14px}
.ab-ba-range{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:ew-resize}
.ab-flip{perspective:1400px;height:var(--ab-h,300px);outline:none}
.ab-flip-inner{position:relative;width:100%;height:100%;transition:transform .7s cubic-bezier(.2,.7,.2,1);transform-style:preserve-3d}
.ab-flip-left:is(:hover,:focus-within) .ab-flip-inner{transform:rotateY(180deg)}.ab-flip-up:is(:hover,:focus-within) .ab-flip-inner{transform:rotateX(180deg)}
.ab-flip-face{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;gap:10px;padding:28px;border-radius:18px;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden}
.ab-flip-front{background:var(--ab-accent-soft);color:var(--ab-ink)}.ab-flip-photo{background-size:cover;background-position:center;color:#fff}
.ab-flip-photo::before{content:"";position:absolute;inset:0;background:linear-gradient(transparent 30%,rgba(2,6,23,.8))}.ab-flip-photo>*{position:relative}
.ab-flip-back{background:var(--ab-accent);color:var(--ab-accent-ink,#fff)}.ab-flip-left .ab-flip-back{transform:rotateY(180deg)}.ab-flip-up .ab-flip-back{transform:rotateX(180deg)}
.ab-flip-back .ab-btn{align-self:flex-start;background:#fff;color:var(--ab-accent)}
.ab-flip-icon{display:inline-flex;color:var(--ab-accent);font-size:36px}.ab-flip-icon svg{width:1em;height:1em}.ab-flip-photo .ab-flip-icon{color:#fff}
.ab-flip-title{margin:0;font-size:22px;font-weight:700}.ab-flip-text{margin:0;opacity:.85}
.ab-rating{display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap}
.ab-rating-stars{position:relative;display:inline-flex;font-size:var(--ab-size,22px);line-height:1}
.ab-rating-base,.ab-rating-fill{display:inline-flex;gap:2px;white-space:nowrap}.ab-rating-base{color:color-mix(in srgb,var(--ab-star,#f59e0b) 22%,#e2e8f0)}
.ab-rating-fill{position:absolute;inset:0 auto 0 0;overflow:hidden;color:var(--ab-star,#f59e0b)}.ab-rating svg{width:1em;height:1em;flex-shrink:0;fill:currentColor}
.ab-rating-label{font-weight:600;color:var(--ab-muted)}
.ab-site-logo{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:inherit}
.ab-site-logo img{height:var(--ab-logo-h,36px);width:auto;max-width:260px;object-fit:contain}
.ab-logo-words{display:grid;line-height:1.1}.ab-logo-brand{letter-spacing:-.02em}.ab-logo-tagline{font-size:.5em;font-weight:500;letter-spacing:.04em;color:var(--ab-muted)}
.ab-table-wrap{overflow-x:auto;border-radius:14px;border:1px solid var(--ab-line)}
.ab-table{width:100%;border-collapse:collapse;font-size:15px}.ab-table caption{caption-side:bottom;padding:10px;color:var(--ab-muted);font-size:13px}
.ab-table th,.ab-table td{padding:14px 18px;text-align:left;border-bottom:1px solid var(--ab-line)}.ab-table tr:last-child>*{border-bottom:0}
.ab-table thead th{background:var(--ab-accent-soft);color:var(--ab-heading,var(--ab-ink));font-weight:700}.ab-table tbody th{font-weight:600}
.ab-table-striped tbody tr:nth-child(even){background:color-mix(in srgb,var(--ab-accent) 3%,transparent)}
.ab-table .ab-table-mark{background:color-mix(in srgb,var(--ab-accent) 9%,transparent);color:var(--ab-accent-deep);font-weight:700}.ab-table thead .ab-table-mark{background:var(--ab-accent);color:#fff}
.ab-has-sub{position:relative}.ab-sub-toggle{display:inline-flex;align-items:center;gap:4px;cursor:default}.ab-sub-toggle svg{width:14px;height:14px;transition:transform .2s}
.ab-submenu{position:absolute;top:100%;left:-14px;z-index:70;display:none;min-width:200px;list-style:none;margin:0;padding:8px;border:1px solid var(--ab-line);border-radius:12px;background:#fff;color:var(--ab-ink);box-shadow:0 18px 40px -12px rgba(15,23,42,.25)}
.ab-has-sub:is(:hover,:focus-within)>.ab-submenu{display:grid}.ab-has-sub:is(:hover,:focus-within)>.ab-sub-toggle svg{transform:rotate(180deg)}
.ab-submenu a{display:block;padding:9px 12px!important;border:0!important;border-radius:8px;white-space:nowrap}.ab-submenu a:hover{background:var(--ab-accent-soft)}
.ab-menu-list .ab-has-sub::after{content:"";position:absolute;left:0;right:0;top:100%;height:10px}
.ab-menu-look-plain .ab-menu-list>li>a{border-bottom:0}
.ab-menu-look-pill .ab-menu-list{gap:6px}.ab-menu-look-pill .ab-menu-list>li>a,.ab-menu-look-pill .ab-sub-toggle{padding:8px 14px;border:0;border-radius:999px}
.ab-menu-look-pill .ab-menu-list>li>a:is(:hover,[aria-current=page]){background:var(--ab-accent-soft);color:var(--ab-accent)}
@container artin-page (max-width:1024px){.ab-ready .ab-collapse-tablet .ab-submenu{position:static;display:grid;box-shadow:none;border:0;padding:0 0 0 14px}}
@container artin-page (max-width:767px){.ab-ready .ab-collapse-mobile .ab-submenu{position:static;display:grid;box-shadow:none;border:0;padding:0 0 0 14px}}
.ab-onscroll-shrink,.ab-onscroll-shadow,.ab-onscroll-solid{transition:box-shadow .3s,padding .3s,background-color .3s}
.ab-scrolled:is(.ab-onscroll-shadow,.ab-onscroll-shrink,.ab-onscroll-solid){box-shadow:0 10px 30px -14px rgba(15,23,42,.3)}
.ab-scrolled.ab-onscroll-shrink{padding-top:8px!important;padding-bottom:8px!important}.ab-scrolled.ab-onscroll-solid{background:#fff!important}
.ab-parallax{background-position-y:calc(50% + var(--ab-py,0px))!important}
@media (prefers-reduced-motion:reduce){.ab-mq-track{animation:none;flex-wrap:wrap}.ab-mq-group[aria-hidden]{display:none}.ab-flip-inner{transition:none}.ab-ah-typed{animation:none}.ab-ah-word{transition:none!important}}
`.trim();
