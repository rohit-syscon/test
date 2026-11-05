// Artin page builder v18. Rewritten when the builder is updated; your other files are never touched.
/**
 * Every value that reaches CSS or an address goes through here, so a page's
 * data can never write its own CSS or a script URL, even if it got past the
 * checks made when it was saved. Anything that does not fit is dropped.
 *
 * Part of the project's copy of the builder renderer: no imports.
 */

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNC = /^(?:rgb|rgba|hsl|hsla)\(\s*[0-9.]+%?\s*,?\s*[0-9.]+%?\s*,?\s*[0-9.]+%?\s*(?:[,/]\s*[0-9.]+%?\s*)?\)$/i;
/** CSS's own colour names (red, navy, rebeccapurple…): plain words, nothing CSS can be written with. */
const NAMED = new Set(('transparent currentcolor aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood '
  + 'cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki '
  + 'darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet '
  + 'deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow '
  + 'grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow '
  + 'lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen '
  + 'linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise '
  + 'mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen '
  + 'paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown '
  + 'seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white '
  + 'whitesmoke yellow yellowgreen').split(' '));
/** The page's main colour, by name: elements set to it follow the page's accent. */
export const ACCENT = 'accent';
/**
 * The site's colours, by name: each is worked out from its main colour (css.ts), so a design made
 * with them follows the brand. A pale tint for light sections, a deep shade and a near-black for
 * dark ones, a light tint for small words on those, and the text's own colours.
 */
export const THEME_COLORS: Record<string, string> = {
  accent: 'var(--ab-accent)', 'accent-soft': 'var(--ab-accent-soft)', 'accent-tint': 'var(--ab-accent-tint)', 'accent-light': 'var(--ab-accent-light)',
  'accent-deep': 'var(--ab-accent-deep)', dark: 'var(--ab-dark)', ink: 'var(--ab-ink)', muted: 'var(--ab-muted)',
};

/** A colour as CSS, or null. */
export function color(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (Object.prototype.hasOwnProperty.call(THEME_COLORS, v)) return THEME_COLORS[v]!;
  if (NAMED.has(v.toLowerCase())) return v.toLowerCase();
  return v.length <= 40 && (HEX.test(v) || FUNC.test(v)) ? v : null;
}

/** A finite number within bounds, or null. */
export function num(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? Math.round(value * 100) / 100 : null;
}

/** One of the given words, or null. */
export function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

/** Fonts a page may use: Google Fonts, loaded by name, plus the system stack. */
export const FONTS = [
  'Inter', 'Poppins', 'Montserrat', 'Playfair Display', 'DM Sans', 'Manrope', 'Outfit', 'Plus Jakarta Sans', 'Space Grotesk', 'Sora',
  'Lora', 'Merriweather', 'Raleway', 'Roboto', 'Open Sans', 'Nunito', 'Work Sans', 'Lato', 'Cormorant Garamond', 'Bebas Neue', 'Syne', 'Urbanist',
] as const;
export const SYSTEM_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export function font(value: unknown): string | null {
  const name = oneOf(value, FONTS);
  return name ? `"${name}", ${/Playfair|Lora|Merriweather|Cormorant/.test(name) ? 'Georgia, serif' : 'system-ui, sans-serif'}` : null;
}

type Font = (typeof FONTS)[number];
/**
 * The weights each font really has. Google Fonts answers with an error, or
 * with the wrong faces, when asked for weights a font does not have, so each
 * is asked for its own: a range for variable fonts, a list for the others.
 * Italics are drawn by the browser.
 */
const FONT_WEIGHTS: Record<Font, string> = {
  Inter: '300..800', Poppins: '300;400;500;600;700;800', Montserrat: '300..800', 'Playfair Display': '400..900', 'DM Sans': '300..800',
  Manrope: '300..800', Outfit: '300..800', 'Plus Jakarta Sans': '300..800', 'Space Grotesk': '300..700', Sora: '300..800',
  Lora: '400..700', Merriweather: '300;400;700;900', Raleway: '300..800', Roboto: '300..800', 'Open Sans': '300..800',
  Nunito: '300..800', 'Work Sans': '300..800', Lato: '300;400;700;900', 'Cormorant Garamond': '300..700', 'Bebas Neue': '400', Syne: '400..800', Urbanist: '300..800',
};

/** The Google Fonts stylesheet for the fonts a page uses, or null when it uses none. */
export function fontsHref(names: Iterable<string>): string | null {
  const used = [...new Set(names)].filter((n) => (FONTS as readonly string[]).includes(n)).sort();
  if (!used.length) return null;
  return `https://fonts.googleapis.com/css2?${used.map((n) => `family=${n.replace(/ /g, '+')}:wght@${FONT_WEIGHTS[n as Font]}`).join('&')}&display=swap`;
}

const NO_SPACE = /[\s\u0000-\u001f\u007f"'<>\\]/; // eslint-disable-line no-control-regex

/** A link: the web, mail, phone, a path on this site or an anchor. */
export function href(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!v || v.length > 2000 || NO_SPACE.test(v)) return null;
  return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(v) ? v : null;
}

/** An image: the web or a path on this site (the media library's are /_artin/media/…). */
export function src(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!v || v.length > 2000 || NO_SPACE.test(v)) return null;
  return /^(https:\/\/|\/(?!\/))/i.test(v) ? v : null;
}

/** An image address for CSS `url()`: the same rules, then quoted. */
export function cssUrl(value: unknown, media: (path: string) => string): string | null {
  const v = src(value);
  return v ? `url("${media(v)}")` : null;
}

/** Plain text, cut to a length. */
export function text(value: unknown, max = 5000): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

/** A video from YouTube or Vimeo as an embeddable address, or a direct https video file. */
export function video(value: unknown): { kind: 'embed' | 'file'; url: string } | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  const yt = /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&#].*)?$/.exec(v);
  if (yt) return { kind: 'embed', url: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vimeo = /^https:\/\/(?:www\.|player\.)?vimeo\.com\/(?:video\/)?(\d{6,12})(?:[?#/].*)?$/.exec(v);
  if (vimeo) return { kind: 'embed', url: `https://player.vimeo.com/video/${vimeo[1]}` };
  const file = src(v);
  return file && /\.(mp4|webm)(\?.*)?$/i.test(file) ? { kind: 'file', url: file } : null;
}

/** An element id the page can link to (#about): letters, digits and hyphens. */
export function anchor(value: unknown): string | null {
  return typeof value === 'string' && /^[a-z][a-z0-9-]{0,40}$/i.test(value) ? value : null;
}

/** A node id: what the CSS uses as a class. Generated by Artin; anything else is not trusted. */
export function nodeId(value: unknown): string | null {
  return typeof value === 'string' && /^[a-z0-9]{4,24}$/i.test(value) ? value : null;
}
