// Artin page builder v17. Rewritten when the builder is updated; your other files are never touched.
import { inkOn } from './theme';
import { BREAKPOINTS, DEVICES, type Background, type Box, type Device, type PageData, type PageNode, type Style } from './types';
import { color, cssUrl, font, num, oneOf } from './safe';

/**
 * The stylesheet of a builder page: one class per element (`ab-<id>`), with
 * the tablet and phone styles in container queries on the page itself, so
 * the editor's phone view and a real phone show the same thing.
 *
 * Only checked values are written (see safe.ts); a value that does not fit
 * is left out, never copied in.
 */

export type MediaUrl = (path: string) => string;

/** Which parts of an element a style lands on. */
type Target = 'wrap' | 'box' | 'inner';

const LAYOUT = new Set<keyof Style>(['margin', 'width', 'widthUnit', 'maxWidth', 'hidden', 'opacity', 'align']);
const BOXED = new Set<keyof Style>([
  'padding', 'minHeight', 'color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'fontStyle',
  'background', 'borderWidth', 'borderStyle', 'borderColor', 'radius', 'shadow',
]);
const INNER = new Set<keyof Style>(['gap', 'justify', 'valign']);

/** Widgets whose look belongs to an element inside them rather than to their wrapper. */
const BOX_SELECTOR: Partial<Record<PageNode['type'], string>> = {
  // Headings and text have default sizes and colours of their own, so their style lands on them, not on the wrapper.
  heading: '.ab-heading',
  text: '.ab-text',
  button: '.ab-btn',
  image: '.ab-img',
  icon: '.ab-icon',
  video: '.ab-video',
  pricing: '.ab-card',
  testimonial: '.ab-card',
  iconBox: '.ab-card',
  imageBox: '.ab-card',
  alert: '.ab-card',
};

const px = (n: number) => (n === 0 ? '0' : `${n}px`);
function box(value: unknown, min = -400, max = 800): string | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  const parts = (value as unknown[]).map((v) => num(v, min, max));
  return parts.every((p) => p !== null) ? (parts as number[]).map(px).join(' ') : null;
}

function background(bg: Background | undefined, media: MediaUrl): string[] {
  if (!bg || typeof bg !== 'object') return [];
  const layers: string[] = [];
  const overlay = color(bg.overlay);
  if (overlay) layers.push(`linear-gradient(${overlay}, ${overlay})`);
  const image = cssUrl(bg.image, media);
  if (image) layers.push(image);
  const g = bg.gradient;
  const from = color(g?.from);
  const to = color(g?.to);
  if (from && to) layers.push(`linear-gradient(${num(g?.angle, 0, 360) ?? 180}deg, ${from}, ${to})`);
  const out: string[] = [];
  const base = color(bg.color);
  if (base) out.push(`background-color:${base}`);
  if (layers.length) {
    out.push(`background-image:${layers.join(',')}`);
    if (image) {
      out.push(`background-size:${oneOf(bg.size, ['cover', 'contain', 'auto'] as const) ?? 'cover'}`);
      out.push(`background-position:${oneOf(bg.position, ['center', 'top', 'bottom', 'left', 'right'] as const) ?? 'center'}`);
      out.push('background-repeat:no-repeat');
      if (bg.fixed === true) out.push('background-attachment:fixed');
    }
  }
  return out;
}

const JUSTIFY = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' } as const;
const VALIGN = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' } as const;

/** CSS declarations for some keys of a style. */
function declarations(type: PageNode['type'], s: Style, keys: Set<keyof Style>, media: MediaUrl): string[] {
  const out: string[] = [];
  const has = (k: keyof Style) => keys.has(k) && s[k] !== undefined;
  if (has('margin')) { const v = box(s.margin); if (v) out.push(`margin:${v}`); }
  if (has('padding')) { const v = box(s.padding, 0, 800); if (v) out.push(`padding:${v}`); }
  if (has('width')) {
    // Columns share the row: a width is a share, and they shrink together to make room for the gaps.
    if (type === 'column') { const w = num(s.width, 5, 100); if (w !== null) out.push(`flex:0 1 ${w}%`); }
    else { const unit = s.widthUnit === 'px' ? 'px' : '%'; const w = num(s.width, 1, unit === 'px' ? 3000 : 100); if (w !== null) out.push(`width:${w}${unit}`); }
  }
  if (has('maxWidth')) { const v = num(s.maxWidth, 20, 3000); if (v !== null) out.push(`max-width:${v}px`); }
  if (has('minHeight')) { const v = num(s.minHeight, 0, 3000); if (v !== null) out.push(`min-height:${v}px`); }
  if (has('align')) { const v = oneOf(s.align, ['left', 'center', 'right', 'justify'] as const); if (v) out.push(`text-align:${v}`); }
  if (has('color')) { const v = color(s.color); if (v) out.push(`color:${v}`); }
  if (has('fontFamily')) { const v = font(s.fontFamily); if (v) out.push(`font-family:${v}`); }
  if (has('fontSize')) { const v = num(s.fontSize, 6, 400); if (v !== null) out.push(`font-size:${v}px`); }
  if (has('fontWeight')) { const v = num(s.fontWeight, 100, 900); if (v !== null) out.push(`font-weight:${Math.round(v / 100) * 100}`); }
  if (has('lineHeight')) { const v = num(s.lineHeight, 0.5, 4); if (v !== null) out.push(`line-height:${v}`); }
  if (has('letterSpacing')) { const v = num(s.letterSpacing, -10, 40); if (v !== null) out.push(`letter-spacing:${v}px`); }
  if (has('textTransform')) { const v = oneOf(s.textTransform, ['none', 'uppercase', 'lowercase', 'capitalize'] as const); if (v) out.push(`text-transform:${v}`); }
  if (has('fontStyle')) { const v = oneOf(s.fontStyle, ['normal', 'italic'] as const); if (v) out.push(`font-style:${v}`); }
  if (has('background')) out.push(...background(s.background, media));
  if (has('borderWidth')) { const v = box(s.borderWidth, 0, 40); if (v) out.push(`border-width:${v}`, `border-style:${oneOf(s.borderStyle, ['solid', 'dashed', 'dotted', 'none'] as const) ?? 'solid'}`); }
  else if (has('borderStyle') && s.borderStyle === 'none') out.push('border-style:none');
  if (has('borderColor')) { const v = color(s.borderColor); if (v) out.push(`border-color:${v}`); }
  if (has('radius')) { const v = box(s.radius, 0, 1000); if (v) out.push(`border-radius:${v}`, 'overflow:hidden'); }
  if (has('shadow')) {
    const sh = s.shadow!;
    const c = color(sh?.color);
    const parts = [num(sh?.x, -200, 200), num(sh?.y, -200, 200), num(sh?.blur, 0, 400), num(sh?.spread, -200, 200)];
    if (c && parts.every((p) => p !== null)) out.push(`box-shadow:${(parts as number[]).map(px).join(' ')} ${c}`);
  }
  if (has('gap')) { const v = num(s.gap, 0, 400); if (v !== null) out.push(`gap:${v}px`); }
  if (has('justify')) { const v = oneOf(s.justify, ['start', 'center', 'end', 'between'] as const); if (v) out.push(`justify-content:${JUSTIFY[v]}`); }
  if (has('valign')) { const v = oneOf(s.valign, ['start', 'center', 'end', 'stretch'] as const); if (v) out.push(`align-items:${VALIGN[v]}`); }
  if (has('opacity')) { const v = num(s.opacity, 0, 1); if (v !== null) out.push(`opacity:${v}`); }
  if (has('hidden') && s.hidden === true) out.push('display:none');
  return out;
}

function hover(s: Style): string[] {
  const out: string[] = [];
  const c = color(s.hoverColor); if (c) out.push(`color:${c}`);
  const b = color(s.hoverBackground); if (b) out.push(`background:${b}`);
  const bc = color(s.hoverBorderColor); if (bc) out.push(`border-color:${bc}`);
  const lift = num(s.hoverLift, -40, 40); if (lift) out.push(`transform:translateY(${-lift}px)`);
  return out;
}

interface Rule { selector: string; body: string[] }

function rulesFor(node: PageNode, device: Device, media: MediaUrl): Rule[] {
  const s = node.style?.[device];
  const id = `.ab-${node.id}`;
  const rules: Rule[] = [];
  if (node.type === 'section' && device === 'desktop' && node.settings?.layout !== 'full') {
    const width = num(node.settings?.contentWidth, 320, 2400);
    if (width !== null) rules.push({ selector: `${id} > .ab-row`, body: [`max-width:${width}px`] });
  }
  // Columns stack on phones unless the section says otherwise.
  const stack = node.type === 'section' ? (s?.stack ?? (device === 'mobile' ? true : undefined)) : undefined;
  if (stack === true) {
    rules.push({ selector: `${id} > .ab-row`, body: ['flex-direction:column'] });
    rules.push({ selector: `${id} > .ab-row > .ab-column`, body: ['flex:0 0 auto', 'width:100%'] });
  } else if (stack === false && device !== 'desktop') {
    rules.push({ selector: `${id} > .ab-row`, body: ['flex-direction:row'] });
  }
  if (!s) return rules;
  const boxSel = BOX_SELECTOR[node.type];
  const isLayout = node.type === 'section' || node.type === 'column';
  const add = (target: Target, keys: Set<keyof Style>) => {
    const body = declarations(node.type, s, keys, media);
    if (!body.length) return;
    const selector = target === 'wrap' ? id
      : target === 'box' ? (boxSel ? `${id} ${boxSel}` : id)
        : node.type === 'section' ? `${id} > .ab-row` : `${id} > .ab-col`;
    rules.push({ selector, body });
  };
  add('wrap', LAYOUT);
  add(isLayout ? 'wrap' : 'box', BOXED);
  if (isLayout) add('inner', INNER);
  else add('box', INNER);
  const h = hover(s);
  if (h.length) rules.push({ selector: `${boxSel ? `${id} ${boxSel}` : id}:hover`, body: h });
  return rules;
}

function walk(nodes: PageNode[], visit: (node: PageNode) => void) {
  for (const node of nodes) { visit(node); if (node.children) walk(node.children, visit); }
}

/** The fonts a page uses, for loading them. */
export function fontsOf(page: PageData): string[] {
  const names = new Set<string>();
  const take = (v: unknown) => { if (typeof v === 'string') names.add(v); };
  take(page.settings?.fontFamily);
  take(page.settings?.headingFont);
  walk(page.sections ?? [], (n) => { for (const d of DEVICES) take(n.style?.[d]?.fontFamily); });
  return [...names];
}

/** The whole stylesheet for one page. */
export function pageCss(page: PageData, media: MediaUrl = (p) => p): string {
  const out: string[] = [];
  const settings = page.settings ?? {};
  const root: string[] = [];
  const bodyFont = font(settings.fontFamily); if (bodyFont) root.push(`font-family:${bodyFont}`);
  const ink = color(settings.color); if (ink) root.push(`color:${ink}`);
  const accent = color(settings.accent); if (accent) root.push(`--ab-accent:${accent}`, ...(/^#[0-9a-f]{6}$/i.test(accent) ? [`--ab-accent-ink:${inkOn(accent)}`] : []));
  const headingInk = color(settings.headingColor); if (headingInk) root.push(`--ab-heading:${headingInk}`);
  const size = num(settings.textSize, 12, 24); if (size !== null) root.push(`font-size:${size}px`, `--ab-text:${size}px`);
  const width = num(settings.contentWidth, 720, 1600); if (width !== null) root.push(`--ab-width:${width}px`);
  const corners = num(settings.buttonRadius, 0, 40); if (corners !== null) root.push(`--ab-btn-radius:${corners}px`);
  root.push(...background(settings.background, media));
  if (root.length) out.push(`.artin-page{${root.join(';')}}`);
  const headingFont = font(settings.headingFont);
  if (headingFont) out.push(`.artin-page .ab-heading{font-family:${headingFont}}`);

  const byDevice: Record<Device, Rule[]> = { desktop: [], tablet: [], mobile: [] };
  walk(page.sections ?? [], (node) => {
    if (!/^[a-z0-9]{4,24}$/i.test(node.id)) return;
    for (const device of DEVICES) byDevice[device].push(...rulesFor(node, device, media));
  });
  // One rule per selector: an element's layout and look come from different parts of its style.
  const write = (rules: Rule[]) => {
    const merged = new Map<string, string[]>();
    for (const r of rules) merged.set(r.selector, [...(merged.get(r.selector) ?? []), ...r.body]);
    return [...merged].map(([selector, body]) => `${selector}{${body.join(';')}}`).join('');
  };
  out.push(write(byDevice.desktop));
  if (byDevice.tablet.length) out.push(`@container artin-page (max-width:${BREAKPOINTS.tablet}px){${write(byDevice.tablet)}}`);
  if (byDevice.mobile.length) out.push(`@container artin-page (max-width:${BREAKPOINTS.mobile}px){${write(byDevice.mobile)}}`);
  return out.join('\n');
}

/** What every builder page needs, whatever is on it: the page as a container, resets, widget defaults and animations. */
export const BASE_CSS = `
.artin-page{container:artin-page/inline-size;--ab-accent:var(--color-brand,#4f46e5);--ab-ink:var(--color-ink,#0f172a);--ab-muted:var(--color-muted,#475569);--ab-line:#e2e8f0;--ab-accent-soft:color-mix(in srgb,var(--ab-accent) 7%,#fff);--ab-accent-tint:color-mix(in srgb,var(--ab-accent) 16%,#fff);--ab-accent-light:color-mix(in srgb,var(--ab-accent) 35%,#fff);--ab-accent-deep:color-mix(in srgb,var(--ab-accent) 42%,#060914);--ab-dark:color-mix(in srgb,var(--ab-accent) 9%,#090c14);color:var(--ab-ink);line-height:1.6;-webkit-font-smoothing:antialiased}
.artin-page{overflow-x:clip}
.artin-page *,.artin-page *::before,.artin-page *::after{box-sizing:border-box}
.artin-page img,.artin-page video,.artin-page iframe{max-width:100%;display:block}
.artin-page :where(a){color:inherit}
.ab-section{position:relative;padding:64px 24px}
.ab-row{display:flex;flex-wrap:nowrap;gap:24px;margin:0 auto;width:100%;max-width:var(--ab-width,1140px)}
.ab-full>.ab-row{max-width:none}
.ab-screen{min-height:100vh;display:flex;flex-direction:column;justify-content:center}
.ab-column{flex:1 1 0;min-width:0;display:flex}
.ab-col{display:flex;flex-direction:column;gap:16px;width:100%}
.ab-col:empty{min-height:96px}
.ab-widget{min-width:0}
.ab-heading{margin:0;font-weight:700;line-height:1.15;letter-spacing:-0.02em;color:var(--ab-heading,var(--color-heading,inherit))}
h1.ab-heading{font-size:56px}h2.ab-heading{font-size:40px}h3.ab-heading{font-size:28px}h4.ab-heading{font-size:22px}h5.ab-heading,h6.ab-heading{font-size:18px}p.ab-heading,div.ab-heading{font-size:18px}
@container artin-page (max-width:767px){h1.ab-heading{font-size:38px}h2.ab-heading{font-size:30px}h3.ab-heading{font-size:24px}.ab-section{padding:48px 16px}}
.ab-text{color:var(--ab-muted);font-size:var(--ab-text,17px)}.ab-text>*+*{margin-top:12px}.ab-text p{margin:0}.ab-text ul,.ab-text ol{margin:0;padding-left:22px}
.ab-text a{color:var(--ab-accent);text-decoration:underline;text-underline-offset:2px}
.ab-img{height:auto;width:100%;border-radius:12px;object-fit:cover}
.ab-placeholder{aspect-ratio:16/9;background:linear-gradient(135deg,#e2e8f0,#cbd5e1)}
.ab-w-spacer{min-height:40px}
.ab-figure{margin:0}.ab-caption{margin-top:8px;font-size:14px;color:var(--ab-muted)}
.ab-btn{display:inline-flex;align-items:center;gap:8px;white-space:nowrap;border:2px solid transparent;border-radius:var(--ab-btn-radius,10px);background:var(--ab-accent);color:var(--ab-accent-ink,var(--color-brand-ink,#fff));font-weight:600;text-decoration:none;cursor:pointer;transition:transform .2s ease,background-color .2s ease,color .2s ease,border-color .2s ease,box-shadow .2s ease}
.ab-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px -8px color-mix(in srgb,var(--ab-accent) 60%,transparent)}
.ab-btn:focus-visible{outline:3px solid color-mix(in srgb,var(--ab-accent) 45%,transparent);outline-offset:2px}
.ab-btn-sm{padding:8px 16px;font-size:14px}.ab-btn-md{padding:12px 24px;font-size:16px}.ab-btn-lg{padding:16px 32px;font-size:18px}
.ab-btn-outline{background:transparent;color:var(--ab-accent);border-color:var(--ab-accent)}
.ab-btn-ghost{background:transparent;color:var(--ab-accent)}
.ab-btn-full{width:100%;justify-content:center}
.ab-btn svg{width:1.15em;height:1.15em;flex-shrink:0}
.ab-icon{display:inline-flex;align-items:center;justify-content:center;color:var(--ab-accent);font-size:40px;line-height:1;transition:transform .2s ease,color .2s ease}
.ab-icon svg{width:1em;height:1em}
.ab-video{position:relative;width:100%;border-radius:12px;overflow:hidden;background:#000}.ab-video iframe,.ab-video video{position:absolute;inset:0;width:100%;height:100%;border:0}
.ab-divider{display:flex}.ab-divider span{display:block;border-top:1px solid var(--ab-line)}
.ab-anchor{scroll-margin-top:80px}
.artin-page.ab-js .ab-anim:not(.ab-in){opacity:0}
.ab-anim.ab-in{animation-duration:var(--ab-dur,800ms);animation-delay:var(--ab-delay,0ms);animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.7,.2,1)}
.ab-in.ab-fadeIn{animation-name:ab-fadeIn}.ab-in.ab-fadeInUp{animation-name:ab-fadeInUp}.ab-in.ab-fadeInDown{animation-name:ab-fadeInDown}
.ab-in.ab-fadeInLeft{animation-name:ab-fadeInLeft}.ab-in.ab-fadeInRight{animation-name:ab-fadeInRight}.ab-in.ab-zoomIn{animation-name:ab-zoomIn}.ab-in.ab-bounceIn{animation-name:ab-bounceIn}
.ab-in.ab-zoomOut{animation-name:ab-zoomOut}.ab-in.ab-slideInUp{animation-name:ab-slideInUp}.ab-in.ab-slideInDown{animation-name:ab-slideInDown}.ab-in.ab-slideInLeft{animation-name:ab-slideInLeft}
.ab-in.ab-slideInRight{animation-name:ab-slideInRight}.ab-in.ab-flipInX{animation-name:ab-flipInX}.ab-in.ab-flipInY{animation-name:ab-flipInY}.ab-in.ab-rotateIn{animation-name:ab-rotateIn}
.ab-in.ab-blurIn{animation-name:ab-blurIn}.ab-in.ab-rollIn{animation-name:ab-rollIn}.ab-in.ab-riseIn{animation-name:ab-riseIn}
.ab-anim.ab-ease-ease{animation-timing-function:ease-in-out}.ab-anim.ab-ease-linear{animation-timing-function:linear}.ab-anim.ab-ease-spring{animation-timing-function:cubic-bezier(.34,1.56,.64,1)}
@keyframes ab-fadeIn{from{opacity:0}to{opacity:1}}
@keyframes ab-fadeInUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:none}}
@keyframes ab-fadeInDown{from{opacity:0;transform:translateY(-32px)}to{opacity:1;transform:none}}
@keyframes ab-fadeInLeft{from{opacity:0;transform:translateX(-32px)}to{opacity:1;transform:none}}
@keyframes ab-fadeInRight{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:none}}
@keyframes ab-zoomIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
@keyframes ab-bounceIn{0%{opacity:0;transform:scale(.8)}60%{opacity:1;transform:scale(1.04)}100%{transform:none}}
@keyframes ab-zoomOut{from{opacity:0;transform:scale(1.12)}to{opacity:1;transform:none}}
@keyframes ab-slideInUp{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
@keyframes ab-slideInDown{from{transform:translateY(-100%);opacity:0}to{transform:none;opacity:1}}
@keyframes ab-slideInLeft{from{transform:translateX(-100%);opacity:0}to{transform:none;opacity:1}}
@keyframes ab-slideInRight{from{transform:translateX(100%);opacity:0}to{transform:none;opacity:1}}
@keyframes ab-flipInX{from{opacity:0;transform:perspective(800px) rotateX(70deg)}to{opacity:1;transform:perspective(800px)}}
@keyframes ab-flipInY{from{opacity:0;transform:perspective(800px) rotateY(70deg)}to{opacity:1;transform:perspective(800px)}}
@keyframes ab-rotateIn{from{opacity:0;transform:rotate(-12deg) scale(.92)}to{opacity:1;transform:none}}
@keyframes ab-blurIn{from{opacity:0;filter:blur(14px);transform:scale(1.04)}to{opacity:1;filter:none;transform:none}}
@keyframes ab-rollIn{from{opacity:0;transform:translateX(-60px) rotate(-20deg)}to{opacity:1;transform:none}}
@keyframes ab-riseIn{from{opacity:0;transform:translateY(60px) scale(.96)}to{opacity:1;transform:none}}
.ab-hover>*{transition:scale .35s cubic-bezier(.2,.7,.2,1),translate .35s cubic-bezier(.2,.7,.2,1),rotate .35s ease,box-shadow .35s ease,filter .35s ease}
.ab-hover-grow:hover>*{scale:1.05}.ab-hover-shrink:hover>*{scale:.96}.ab-hover-float:hover>*{translate:0 -8px}.ab-hover-tilt:hover>*{rotate:-2deg;scale:1.02}
.ab-hover-pop:hover>*{scale:1.08;translate:0 -4px}.ab-hover-glow:hover>*{filter:drop-shadow(0 12px 28px color-mix(in srgb,var(--ab-accent) 45%,transparent))}
.ab-hover-shine>*{position:relative;overflow:hidden}.ab-hover-shine>*::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);translate:-120% 0;transition:translate .8s ease;pointer-events:none}
.ab-hover-shine:hover>*::after{translate:120% 0}
.ab-loop>*{animation:var(--ab-loop) var(--ab-loop-dur,2000ms) ease-in-out infinite}
.ab-loop-pulse{--ab-loop:ab-l-pulse}.ab-loop-bounce{--ab-loop:ab-l-bounce}.ab-loop-float{--ab-loop:ab-l-float}.ab-loop-swing{--ab-loop:ab-l-swing}
.ab-loop-spin{--ab-loop:ab-l-spin}.ab-loop-spin>*{animation-timing-function:linear}.ab-loop-heartbeat{--ab-loop:ab-l-heartbeat}.ab-loop-shake{--ab-loop:ab-l-shake}.ab-loop-wiggle{--ab-loop:ab-l-wiggle}
@keyframes ab-l-pulse{50%{transform:scale(1.06)}}
@keyframes ab-l-bounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-14px)}60%{transform:translateY(-6px)}}
@keyframes ab-l-float{50%{transform:translateY(-10px)}}
@keyframes ab-l-swing{20%{transform:rotate(8deg)}40%{transform:rotate(-6deg)}60%{transform:rotate(3deg)}80%{transform:rotate(-2deg)}100%{transform:rotate(0)}}
@keyframes ab-l-spin{to{transform:rotate(360deg)}}
@keyframes ab-l-heartbeat{0%,40%,100%{transform:scale(1)}20%,60%{transform:scale(1.1)}}
@keyframes ab-l-shake{0%,60%,100%{transform:translateX(0)}10%,30%,50%{transform:translateX(-5px)}20%,40%{transform:translateX(5px)}}
@keyframes ab-l-wiggle{0%,70%,100%{transform:rotate(0)}10%,30%,50%{transform:rotate(-4deg)}20%,40%,60%{transform:rotate(4deg)}}
@media (prefers-reduced-motion:reduce){.artin-page.ab-js .ab-anim:not(.ab-in){opacity:1}.ab-anim.ab-in{animation:none}.ab-btn,.ab-icon{transition:none}.ab-loop>*{animation:none}.ab-hover>*{transition:none}}
`.trim();
