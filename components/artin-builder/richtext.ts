// Artin page builder v18. Rewritten when the builder is updated; your other files are never touched.
/**
 * Rich text: a small, safe subset of Markdown, parsed into a tree.
 *
 * Supported: headings (#, ##, ###), paragraphs, **bold**, *italic*, `code`,
 * [links](https://…), ![images](/…), bulleted and numbered lists, > quotes,
 * fenced code blocks and --- rules.
 *
 * The text is never turned into HTML. A renderer walks the tree and creates
 * elements, so nothing an author types can become markup or script, and link
 * and image addresses are checked here (no `javascript:` and the like).
 *
 * This file has no imports on purpose: Artin copies it into projects as
 * `lib/artin-richtext.ts`, where it belongs to the project.
 */

export type Inline =
  | { type: 'text'; value: string }
  | { type: 'bold' | 'italic'; children: Inline[] }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; children: Inline[] }
  | { type: 'image'; src: string; alt: string }
  | { type: 'break' };

export type Block =
  | { type: 'heading'; level: 2 | 3 | 4; children: Inline[] }
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'quote'; children: Inline[] }
  | { type: 'code'; value: string }
  | { type: 'rule' };

export const RICH_TEXT_MAX = 200_000;
const MAX_DEPTH = 5;
const MAX_LABEL = 1000;

const HAS_SPACE_OR_CONTROL = /[\s\u0000-\u001f\u007f]/; // eslint-disable-line no-control-regex

/** A link an author may point at: web, mail, phone, a path on this site, or an anchor. */
export function safeHref(url: string): string | null {
  const value = url.trim();
  if (!value || value.length > 2000 || HAS_SPACE_OR_CONTROL.test(value)) return null;
  return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(value) ? value : null;
}

/** An image address: the web or a path on this site. */
export function safeSrc(url: string): string | null {
  const value = url.trim();
  if (!value || value.length > 2000 || HAS_SPACE_OR_CONTROL.test(value)) return null;
  return /^(https?:\/\/|\/)/i.test(value) ? value : null;
}

const WORD = /[A-Za-z0-9]/;
const ESCAPABLE = '\\`*_[]()!#>-.+';

function parseInline(source: string, depth = 0): Inline[] {
  const out: Inline[] = [];
  let text = '';
  const flush = () => { if (text) { out.push({ type: 'text', value: text }); text = ''; } };
  // Remember where each marker was last found, and when it is known to be
  // missing: long runs of unmatched markers stay linear instead of quadratic.
  const missing = new Set<string>();
  const seen = new Map<string, number>();
  const find = (marker: string, from: number) => {
    if (missing.has(marker)) return -1;
    const known = seen.get(marker);
    if (known !== undefined && known >= from) return known;
    const at = source.indexOf(marker, from);
    if (at === -1) missing.add(marker);
    else seen.set(marker, at);
    return at;
  };
  const nested = (inner: string): Inline[] => (depth >= MAX_DEPTH ? [{ type: 'text', value: inner }] : parseInline(inner, depth + 1));

  let i = 0;
  while (i < source.length) {
    const ch = source[i]!;

    if (ch === '\\' && i + 1 < source.length && ESCAPABLE.includes(source[i + 1]!)) { text += source[i + 1]; i += 2; continue; }
    if (ch === '\n') { flush(); out.push({ type: 'break' }); i += 1; continue; }

    if (ch === '`') {
      const end = find('`', i + 1);
      if (end > i + 1) { flush(); out.push({ type: 'code', value: source.slice(i + 1, end) }); i = end + 1; continue; }
    }

    if (ch === '[' || (ch === '!' && source[i + 1] === '[')) {
      const image = ch === '!';
      const open = image ? i + 1 : i;
      const mid = find('](', open + 1);
      const end = mid === -1 || mid - open > MAX_LABEL ? -1 : find(')', mid + 2);
      const label = end === -1 ? '' : source.slice(open + 1, mid);
      // A label never spans another "[": keeps "[a] and [b](url)" linking only "b".
      if (end !== -1 && !label.includes('[') && !label.includes('\n')) {
        const url = source.slice(mid + 2, end);
        flush();
        if (image) {
          const src = safeSrc(url);
          out.push(src ? { type: 'image', src, alt: label } : { type: 'text', value: label });
        } else {
          const href = safeHref(url);
          const children = nested(label);
          if (href) out.push({ type: 'link', href, children });
          else out.push(...children);
        }
        i = end + 1;
        continue;
      }
    }

    if (ch === '*' && source[i + 1] === '*') {
      let end = find('**', i + 2);
      while (end !== -1 && source[end + 2] === '*') end += 1; // "***" closes italic first, then bold
      if (end > i + 2) { flush(); out.push({ type: 'bold', children: nested(source.slice(i + 2, end)) }); i = end + 2; continue; }
    } else if (ch === '*' || ch === '_') {
      // "_" only counts at word edges, so snake_case_names stay as typed.
      const opens = ch === '*' || i === 0 || !WORD.test(source[i - 1]!);
      const tried = opens && source[i + 1] !== ' ' && source[i + 1] !== undefined;
      let end = tried ? find(ch, i + 1) : -1;
      while (end !== -1 && ch === '_' && end + 1 < source.length && WORD.test(source[end + 1]!)) end = source.indexOf('_', end + 1);
      if (end === -1 && tried && ch === '_') missing.add('_'); // no closing "_" from here on
      if (end > i + 1 && !source.slice(i + 1, end).includes('\n')) {
        flush();
        out.push({ type: 'italic', children: nested(source.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }

    text += ch;
    i += 1;
  }
  flush();
  return out;
}

const FENCE = /^```/;
const HEADING = /^(#{1,3})\s+(.+)$/;
const RULE = /^(-{3,}|\*{3,})\s*$/;
const QUOTE = /^>\s?/;
const BULLET = /^[-*]\s+/;
const NUMBER = /^\d{1,9}[.)]\s+/;
const startsBlock = (line: string) => FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line) || BULLET.test(line) || NUMBER.test(line);

/** Parse rich text into blocks. Never throws; text it does not understand stays text. */
export function parseRichText(input: string | null | undefined): Block[] {
  if (typeof input !== 'string' || !input.trim()) return [];
  const lines = input.slice(0, RICH_TEXT_MAX).replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) { i += 1; continue; }

    if (FENCE.test(line)) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !FENCE.test(lines[i]!)) body.push(lines[i++]!);
      i += 1; // the closing fence, if there was one
      blocks.push({ type: 'code', value: body.join('\n') });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      // The page already has its title as h1, so "#" starts at h2.
      blocks.push({ type: 'heading', level: (heading[1]!.length + 1) as 2 | 3 | 4, children: parseInline(heading[2]!.trim()) });
      i += 1;
      continue;
    }

    if (RULE.test(line)) { blocks.push({ type: 'rule' }); i += 1; continue; }

    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i]!)) body.push(lines[i++]!.replace(QUOTE, ''));
      blocks.push({ type: 'quote', children: parseInline(body.join('\n').trim()) });
      continue;
    }

    const marker = BULLET.test(line) ? BULLET : NUMBER.test(line) ? NUMBER : null;
    if (marker) {
      const items: Inline[][] = [];
      while (i < lines.length && marker.test(lines[i]!)) items.push(parseInline(lines[i++]!.replace(marker, '').trim()));
      blocks.push({ type: 'list', ordered: marker === NUMBER, items });
      continue;
    }

    const body: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i]!.trim() && !startsBlock(lines[i]!)) body.push(lines[i++]!);
    blocks.push({ type: 'paragraph', children: parseInline(body.map((l) => l.trim()).join('\n')) });
  }
  return blocks;
}

/** The words alone, for summaries and search: no markers, no addresses. */
export function richTextToPlain(input: string | null | undefined, limit = 300): string {
  const words = (nodes: Inline[]): string => nodes.map((n) => {
    switch (n.type) {
      case 'text': case 'code': return n.value;
      case 'bold': case 'italic': case 'link': return words(n.children);
      case 'break': return ' ';
      default: return '';
    }
  }).join('');
  const text = parseRichText(input).map((b) => {
    switch (b.type) {
      case 'heading': case 'paragraph': case 'quote': return words(b.children);
      case 'list': return b.items.map(words).join(' ');
      default: return '';
    }
  }).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit).replace(/\s+\S*$/, '')}…` : text;
}
