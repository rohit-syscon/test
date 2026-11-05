// Artin page builder v18. Rewritten when the builder is updated; your other files are never touched.
import { color, font, oneOf, FONTS } from './safe';
import type { PageSettings } from './types';

/**
 * One design system for the whole site. The project's code keeps its design
 * tokens in app/globals.css (Tailwind's @theme: --color-brand, --color-ink…),
 * and the page builder keeps the site's settings (accent, text colour,
 * fonts). They are the same thing, said two ways:
 *
 *   --color-brand   ⇄ accent          --font-sans    ⇄ fontFamily
 *   --color-ink     ⇄ color           --font-heading ⇄ headingFont
 *   --color-heading ⇄ headingColor   --color-surface ⇄ background colour
 *
 * Builder pages fall back to the code's tokens (css.ts), coded pages are
 * given the builder's settings as tokens (siteTokensCss, through the site
 * frame), and the two files are kept saying the same (theme-sync.ts).
 *
 * Part of the project's copy of the builder renderer.
 */

export const TOKEN_OF = {
  accent: '--color-brand',
  color: '--color-ink',
  headingColor: '--color-heading',
  fontFamily: '--font-sans',
  headingFont: '--font-heading',
} as const;

/** The site's background colour (settings.background.color): the code's page background. */
export const SURFACE_TOKEN = '--color-surface';

export type ThemeKey = keyof typeof TOKEN_OF;
export const THEME_KEYS = Object.keys(TOKEN_OF) as ThemeKey[];

/** Black or white, whichever reads better on a colour given as #rrggbb (else white). */
export function inkOn(hex: string): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return '#ffffff';
  const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#111827' : '#ffffff';
}

/**
 * The site's settings as the code's tokens, for the pages made in code: what
 * the builder sets wins over app/globals.css at once, without a build. Only
 * what the settings say is set; the rest stays as the code has it.
 */
export function siteTokensCss(settings: PageSettings | null | undefined): string {
  if (!settings) return '';
  const vars: string[] = [];
  const accent = color(settings.accent);
  if (accent && accent !== 'var(--ab-accent)') {
    vars.push(`--color-brand:${accent}`);
    if (/^#[0-9a-f]{6}$/i.test(accent)) vars.push(`--color-brand-ink:${inkOn(accent)}`);
  }
  const ink = color(settings.color);
  if (ink && ink !== 'var(--ab-accent)') vars.push(`--color-ink:${ink}`);
  const heading = color(settings.headingColor);
  if (heading && heading !== 'var(--ab-accent)') vars.push(`--color-heading:${heading}`);
  const surface = color(settings.background?.color);
  if (surface && surface !== 'var(--ab-accent)') vars.push(`${SURFACE_TOKEN}:${surface}`);
  const body = font(settings.fontFamily);
  if (body) vars.push(`--font-sans:${body}`);
  const headingFont = font(settings.headingFont);
  if (headingFont) vars.push(`--font-heading:${headingFont}`);
  if (!vars.length) return '';
  // Headings in code take the heading font and colour too, unless a class says otherwise.
  const headings = [
    ...(headingFont ? ['font-family:var(--font-heading)'] : []),
    ...(heading ? ['color:var(--color-heading)'] : []),
  ];
  return `:root{${vars.join(';')}}${headings.length ? `:where(h1,h2,h3,h4,h5,h6){${headings.join(';')}}` : ''}`;
}

/** A token's value as a builder setting, or null when it is not one the builder can use. */
export function settingFromToken(key: ThemeKey, value: string): string | null {
  const v = value.trim().replace(/\s*!important$/, '');
  if (key === 'fontFamily' || key === 'headingFont') {
    const first = v.split(',')[0]!.trim().replace(/^["']|["']$/g, '');
    return oneOf(first, FONTS);
  }
  const c = color(v);
  return c && c !== 'var(--ab-accent)' ? v.toLowerCase() : null;
}
