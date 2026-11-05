/**
 * An exact copy of https://www.vahak.in/ (copied 2026-11-05): the page's own HTML in
 * copies/vahak-in/index.html, its styles written in, its pictures and fonts in public/copies/. Change the page by
 * editing that file. Its scripts, forms and trackers were not copied.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-static';

export async function GET() {
  const html = await readFile(path.join(process.cwd(), "copies/vahak-in/index.html"), 'utf8');
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
