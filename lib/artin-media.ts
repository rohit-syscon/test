/**
 * Images from the Artin CMS.
 *
 * Entries store an image as a path like `/_artin/media/<project>/<file>`.
 * On a deployed Artin site that path is served on the site's own address, so
 * it works as it is. ARTIN_MEDIA_ORIGIN is set where it is not (the live
 * preview while editing).
 *
 * Outside Artin (after exporting the project), put the files under
 * `public/_artin/media/` and the same paths keep working. This file belongs
 * to your project; change it freely.
 */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  const origin = process.env.ARTIN_MEDIA_ORIGIN;
  return origin && path.startsWith('/_artin/media/') ? `${origin.replace(/\/$/, '')}${path}` : path;
}

/** Widths of the optimised WebP copies Artin keeps of every image (asked for with ?w=). */
const WIDTHS = [320, 640, 960, 1280, 1920];

/**
 * A srcset of the image's optimised copies, so a phone downloads a
 * phone-sized picture: `<img src={mediaUrl(p)} srcSet={mediaSrcSet(p)} sizes="100vw" />`.
 * Undefined for images that are not from the media library (and after an
 * export, where the copies are not there).
 */
export function mediaSrcSet(path: string | null | undefined): string | undefined {
  if (!path || !path.startsWith('/_artin/media/') || path.endsWith('.gif')) return undefined;
  if (!process.env.ARTIN_CONTENT_URL && !process.env.ARTIN_MEDIA_ORIGIN) return undefined;
  const url = mediaUrl(path);
  return WIDTHS.map((w) => `${url}?w=${w} ${w}w`).join(', ');
}
