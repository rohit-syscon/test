// Artin page builder v17. Rewritten when the builder is updated; your other files are never touched.
/**
 * The shape of an Artin builder page: sections, which hold columns, which
 * hold widgets. Every element carries its settings (what it shows) and its
 * style per device (how it looks), like Elementor.
 *
 * This file belongs to the project's copy of the builder renderer: it has no
 * imports, so it can be read on its own.
 */

export const DEVICES = ['desktop', 'tablet', 'mobile'] as const;
export type Device = (typeof DEVICES)[number];
/** Widths at and below which the tablet and phone styles apply, measured on the page itself. */
export const BREAKPOINTS: Record<Exclude<Device, 'desktop'>, number> = { tablet: 1024, mobile: 767 };

/** Top, right, bottom, left, in pixels. */
export type Box = [number, number, number, number];

export interface Background {
  color?: string;
  gradient?: { from: string; to: string; angle: number };
  image?: string;
  size?: 'cover' | 'contain' | 'auto';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  /** A colour laid over the image, usually translucent. */
  overlay?: string;
  fixed?: boolean;
}

export interface Shadow { x: number; y: number; blur: number; spread: number; color: string }

export interface Style {
  margin?: Box;
  padding?: Box;
  /** Columns: a share of the row in percent. Widgets: a width in pixels or percent. */
  width?: number;
  widthUnit?: '%' | 'px';
  maxWidth?: number;
  minHeight?: number;
  align?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontStyle?: 'normal' | 'italic';
  background?: Background;
  borderWidth?: Box;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderColor?: string;
  radius?: Box;
  shadow?: Shadow;
  /** Space between columns (sections) or between items (columns, lists). */
  gap?: number;
  /** Main-axis placement of what is inside: columns in a section, widgets in a column. */
  justify?: 'start' | 'center' | 'end' | 'between';
  /** Cross-axis placement of what is inside. */
  valign?: 'start' | 'center' | 'end' | 'stretch';
  /** Columns: stack them (one under another) on this device. */
  stack?: boolean;
  opacity?: number;
  hidden?: boolean;
  /** On hover: buttons, icons, images, cards. */
  hoverColor?: string;
  hoverBackground?: string;
  hoverBorderColor?: string;
  hoverLift?: number;
}

export const ENTRANCES = [
  'fadeIn', 'fadeInUp', 'fadeInDown', 'fadeInLeft', 'fadeInRight', 'zoomIn', 'zoomOut', 'bounceIn',
  'slideInUp', 'slideInDown', 'slideInLeft', 'slideInRight', 'flipInX', 'flipInY', 'rotateIn', 'blurIn', 'rollIn', 'riseIn',
] as const;
export type Entrance = (typeof ENTRANCES)[number];
/** How an entrance moves: an even glide, a gentle ease, a constant speed, or a springy overshoot. */
export const EASINGS = ['smooth', 'ease', 'linear', 'spring'] as const;
export type Easing = (typeof EASINGS)[number];
/** What an element does under the pointer. */
export const HOVERS = ['grow', 'shrink', 'float', 'tilt', 'glow', 'shine', 'pop'] as const;
export type Hover = (typeof HOVERS)[number];
/** A movement that repeats for as long as the element is on screen: to draw the eye, sparingly. */
export const LOOPS = ['pulse', 'bounce', 'float', 'swing', 'spin', 'heartbeat', 'shake', 'wiggle'] as const;
export type Loop = (typeof LOOPS)[number];

export interface Animation {
  entrance?: Entrance;
  duration?: number;
  delay?: number;
  easing?: Easing;
  /** Play the entrance again each time the element comes back into view. */
  repeat?: boolean;
  /** Sections and columns: what they hold comes in one after another, this many ms apart (with this entrance, or each its own). */
  stagger?: number;
  hover?: Hover;
  loop?: Loop;
  /** How long one round of the loop takes, in ms. */
  loopDuration?: number;
  /** Sections: the background photo moves slower than the page, by this much (1–100). */
  parallax?: number;
}

export type NodeType =
  | 'section' | 'column'
  | 'heading' | 'text' | 'image' | 'button' | 'icon' | 'video' | 'divider' | 'spacer'
  | 'gallery' | 'slider' | 'tabs' | 'accordion' | 'testimonial' | 'pricing' | 'counter' | 'countdown' | 'form' | 'iconList' | 'map'
  | 'iconBox' | 'imageBox' | 'socialIcons' | 'progress' | 'alert'
  | 'menu' | 'languages' | 'products'
  | 'animatedHeading' | 'marquee' | 'logos' | 'teamMember' | 'timeline' | 'beforeAfter' | 'flipBox' | 'starRating' | 'siteLogo' | 'table'
  /** Custom HTML, CSS and JavaScript: in a sandboxed frame, or (allowed by the code permission) in the page. */
  | 'embed'
  /** A linked component's place on a page (see components.ts): never drawn itself. */
  | 'component';

export interface PageNode {
  id: string;
  type: NodeType;
  settings: Record<string, unknown>;
  style?: Partial<Record<Device, Style>>;
  animation?: Animation;
  children?: PageNode[];
}

export interface PageSettings {
  background?: Background;
  fontFamily?: string;
  color?: string;
  /** Headings' font, when it differs from the body's. */
  headingFont?: string;
  /** The site's main colour: buttons, links and accents use it unless a widget says otherwise. */
  accent?: string;
  /** Headings' colour, when it differs from the text's. */
  headingColor?: string;
  /** The size of body text, in pixels. */
  textSize?: number;
  /** How wide boxed sections' content may grow, in pixels. */
  contentWidth?: number;
  /** How round buttons' corners are, in pixels. */
  buttonRadius?: number;
  /** This page without the site's header or footer (a landing page, say). */
  hideHeader?: boolean;
  hideFooter?: boolean;
  /** Code for every page (in the site's settings) or one page: meta tags, styles and scripts such as pixels. Changing it needs the code permission. */
  headCode?: string;
  /** Code at the end of the page, such as a chat widget. Changing it needs the code permission. */
  bodyCode?: string;
  /** The site's settings only: its search and sharing defaults, for every page that does not set its own. */
  seo?: SiteSeo;
}

/** A site's defaults for search engines and sharing, used wherever a page sets nothing of its own. */
export interface SiteSeo {
  /** The site's name: shown after page titles and on shared links. */
  siteName?: string;
  /** How page titles read: %s is the page's own title ("%s | Chai Point"). */
  titleTemplate?: string;
  /** The description of pages that have none of their own. */
  description?: string;
  /** The picture shown when a page without its own is shared (a media library path). */
  image?: string;
  /** Hide the whole site from search engines (while it is being built, say). */
  noindex?: boolean;
  /** Search Console's verification code (Google), and Bing Webmaster Tools'. */
  googleVerification?: string;
  bingVerification?: string;
}

export interface PageData {
  version: 1;
  settings: PageSettings;
  sections: PageNode[];
}

export const emptyPage = (): PageData => ({ version: 1, settings: {}, sections: [] });
