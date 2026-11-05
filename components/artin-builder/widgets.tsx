// Artin page builder v18. Rewritten when the builder is updated; your other files are never touched.
import type { CSSProperties, ReactNode } from 'react';

import { extraWidget } from './extra';
import { Icon } from './icons';
import { imageProps, linkProps, richText, type RenderContext } from './parts';
import { proWidget } from './pro';
import { anchor, color, num, oneOf, src, text, video } from './safe';
import { EASINGS, ENTRANCES, HOVERS, LOOPS, type Animation, type PageNode } from './types';

/**
 * How each element of a builder page is drawn. Pure markup: no state, so it
 * renders on the server; anything interactive lives in runtime.tsx.
 *
 * Every element carries `data-ab-node` (its id) so the editor can find it,
 * and `data-ab-edit` marks text that can be edited where it stands.
 *
 * Part of the project's copy of the builder renderer.
 */

export type { RenderContext };


/**
 * An element's animation as classes and CSS variables. `passed` is what a
 * section or column that staggers hands it: its entrance, a little later for
 * each one, unless the element has an entrance of its own. One that staggers
 * does not come in itself: what it holds does.
 */
function animation(node: PageNode, passed?: Animation): { className: string; style?: CSSProperties } {
  const own = node.animation ?? {};
  const staggers = (num(own.stagger, 20, 2000) ?? 0) > 0;
  const source = own.entrance ? own : passed ?? own;
  const entrance = staggers ? null : oneOf(source.entrance, ENTRANCES);
  const style: Record<string, string> = {};
  let className = '';
  if (entrance) {
    className += ` ab-anim ab-${entrance}`;
    const easing = oneOf(source.easing, EASINGS);
    if (easing && easing !== 'smooth') className += ` ab-ease-${easing}`;
    if (source.repeat === true) className += ' ab-repeat';
    const duration = num(source.duration, 100, 5000);
    const delay = num(source.delay, 0, 10000);
    if (duration !== null) style['--ab-dur'] = `${duration}ms`;
    if (delay !== null) style['--ab-delay'] = `${delay}ms`;
  }
  const hover = oneOf(own.hover, HOVERS);
  if (hover) className += ` ab-hover ab-hover-${hover}`;
  const loop = oneOf(own.loop, LOOPS);
  if (loop) {
    className += ` ab-loop ab-loop-${loop}`;
    const every = num(own.loopDuration, 300, 20000);
    if (every !== null) style['--ab-loop-dur'] = `${every}ms`;
  }
  const parallax = node.type === 'section' ? num(own.parallax, 1, 100) : null;
  if (parallax) { className += ' ab-parallax'; style['--ab-par'] = String(parallax / 100); }
  return { className, style: Object.keys(style).length ? style as CSSProperties : undefined };
}

/** What a staggering section or column hands its i-th child: its entrance (fade in up by default), a step later each. */
function passedOn(node: PageNode, i: number, passed?: Animation): Animation | undefined {
  const own = node.animation ?? {};
  const step = num(own.stagger, 20, 2000);
  if (!step) return own.entrance ? undefined : passed;
  const entrance = oneOf(own.entrance, ENTRANCES) ?? 'fadeInUp';
  return { entrance, duration: own.duration, easing: own.easing, repeat: own.repeat, delay: (num(own.delay, 0, 10000) ?? 0) + i * step };
}

const keyOf = (node: PageNode, ctx: RenderContext) => `${node.id}:${ctx.revisions?.[node.id] ?? 0}`;
const s = (node: PageNode, key: string) => node.settings?.[key];

// ─── Widgets ───────────────────────────────────────────────────────────────

const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;
const VARIANTS = ['solid', 'outline', 'ghost'] as const;
const RATIOS = { '16:9': '16 / 9', '4:3': '4 / 3', '1:1': '1 / 1', '9:16': '9 / 16', '21:9': '21 / 9' } as const;

function widgetBody(node: PageNode, ctx: RenderContext): ReactNode {
  switch (node.type) {
    case 'heading': {
      const Tag = oneOf(s(node, 'tag'), HEADING_TAGS) ?? 'h2';
      const words = text(s(node, 'text'), 500);
      const link = linkProps(s(node, 'link'), s(node, 'newTab'));
      return <Tag className="ab-heading">{link ? <a {...link} data-ab-edit="text">{words}</a> : <span data-ab-edit="text">{words}</span>}</Tag>;
    }
    case 'text':
      return <div className="ab-text">{richText(text(s(node, 'text'), 50_000), ctx)}</div>;
    case 'image': {
      const u = src(s(node, 'src'));
      const alt = text(s(node, 'alt'), 300);
      const caption = text(s(node, 'caption'), 300);
      // eslint-disable-next-line @next/next/no-img-element
      const img = u ? <img className="ab-img" {...imageProps(ctx, u, '(max-width: 768px) 100vw, 60vw')} alt={alt} loading="lazy" /> : <div className="ab-img ab-placeholder" role="img" aria-label="Image" />;
      const link = linkProps(s(node, 'link'), s(node, 'newTab'));
      return (
        <figure className="ab-figure">
          {link ? <a {...link}>{img}</a> : img}
          {caption ? <figcaption className="ab-caption" data-ab-edit="caption">{caption}</figcaption> : null}
        </figure>
      );
    }
    case 'button': {
      const size = oneOf(s(node, 'size'), SIZES) ?? 'md';
      const variant = oneOf(s(node, 'variant'), VARIANTS) ?? 'solid';
      const icon = text(s(node, 'icon'), 40);
      const after = s(node, 'iconPosition') === 'after';
      const link = linkProps(s(node, 'link'), s(node, 'newTab'));
      const cls = `ab-btn ab-btn-${size}${variant === 'solid' ? '' : ` ab-btn-${variant}`}${s(node, 'fullWidth') === true ? ' ab-btn-full' : ''}`;
      const inner = (
        <>
          {icon && !after ? <Icon name={icon} /> : null}
          <span data-ab-edit="text">{text(s(node, 'text'), 120)}</span>
          {icon && after ? <Icon name={icon} /> : null}
        </>
      );
      return link ? <a className={cls} {...link}>{inner}</a> : <span className={cls}>{inner}</span>;
    }
    case 'icon': {
      const link = linkProps(s(node, 'link'), s(node, 'newTab'));
      const label = text(s(node, 'label'), 120) || undefined;
      const icon = <span className="ab-icon"><Icon name={text(s(node, 'icon'), 40) || 'star'} label={label} /></span>;
      return link ? <a {...link} aria-label={label}>{icon}</a> : icon;
    }
    case 'video': {
      const v = video(s(node, 'url'));
      const ratio = RATIOS[oneOf(s(node, 'ratio'), Object.keys(RATIOS) as Array<keyof typeof RATIOS>) ?? '16:9'];
      const title = text(s(node, 'title'), 200) || 'Video';
      return (
        <div className="ab-video" style={{ aspectRatio: ratio }}>
          {v?.kind === 'embed' ? <iframe src={v.url} title={title} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" /> : null}
          {v?.kind === 'file' ? <video src={ctx.media(v.url)} controls playsInline preload="metadata" title={title} /> : null}
        </div>
      );
    }
    case 'divider': {
      const width = num(s(node, 'width'), 1, 100) ?? 100;
      const weight = num(s(node, 'weight'), 1, 20) ?? 1;
      const lineStyle = oneOf(s(node, 'lineStyle'), ['solid', 'dashed', 'dotted', 'double'] as const) ?? 'solid';
      const line = color(s(node, 'color'));
      const place = oneOf(s(node, 'position'), ['start', 'center', 'end'] as const) ?? 'center';
      return (
        <div className="ab-divider" style={{ justifyContent: place === 'start' ? 'flex-start' : place === 'end' ? 'flex-end' : 'center' }}>
          <span style={{ width: `${width}%`, borderTopWidth: weight, borderTopStyle: lineStyle, ...(line ? { borderTopColor: line } : {}) }} />
        </div>
      );
    }
    case 'spacer':
      return <div aria-hidden className="ab-spacer" />;
    default:
      return proWidget(node, ctx) ?? extraWidget(node, ctx);
  }
}

export function Widget({ node, ctx, passed }: { node: PageNode; ctx: RenderContext; passed?: Animation }) {
  const anim = animation(node, passed);
  return (
    <div key={keyOf(node, ctx)} className={`ab-widget ab-w-${node.type} ab-${node.id}${anim.className}`} style={anim.style} data-ab-node={node.id} data-ab-type={node.type}
      id={anchor(s(node, 'anchor')) ?? undefined}>
      {widgetBody(node, ctx)}
    </div>
  );
}

export function Column({ node, ctx, passed }: { node: PageNode; ctx: RenderContext; passed?: Animation }) {
  const anim = animation(node, passed);
  // A column that does not stagger and has no entrance of its own passes on what it was handed, unchanged.
  const forChildren = (i: number) => (node.animation?.stagger ? passedOn(node, i) : undefined);
  return (
    <div className={`ab-column ab-${node.id}${anim.className}`} style={anim.style} data-ab-node={node.id} data-ab-type="column">
      <div className="ab-col">{(node.children ?? []).map((w, i) => <Widget key={keyOf(w, ctx)} node={w} ctx={ctx} passed={forChildren(i)} />)}</div>
    </div>
  );
}

const SECTION_TAGS = ['section', 'header', 'footer', 'div', 'aside'] as const;

export function Section({ node, ctx }: { node: PageNode; ctx: RenderContext }) {
  const Tag = oneOf(s(node, 'tag'), SECTION_TAGS) ?? 'section';
  const anim = animation(node);
  const full = s(node, 'layout') === 'full' ? ' ab-full' : '';
  const screen = s(node, 'height') === 'screen' ? ' ab-screen' : '';
  const sticky = s(node, 'sticky') === true ? ' ab-sticky' : '';
  const onScroll = oneOf(s(node, 'onScroll'), ['shadow', 'shrink', 'solid'] as const);
  const scrolls = onScroll ? ` ab-onscroll-${onScroll}` : '';
  return (
    <Tag className={`ab-section ab-${node.id}${full}${screen}${sticky}${scrolls}${anim.className}`} style={anim.style} data-ab-node={node.id} data-ab-type="section"
      id={anchor(s(node, 'anchor')) ?? undefined} data-ab-scroll={onScroll ? '' : undefined}>
      <div className="ab-row">{(node.children ?? []).map((c, i) => <Column key={keyOf(c, ctx)} node={c} ctx={ctx} passed={node.animation?.stagger ? passedOn(node, i) : undefined} />)}</div>
    </Tag>
  );
}
