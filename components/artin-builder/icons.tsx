// Artin page builder v18. Rewritten when the builder is updated; your other files are never touched.
/**
 * Icons for builder pages, drawn inline (no icon font, nothing to load).
 *
 * Part of the project's copy of the builder renderer.
 */

import { FILLED, STROKE } from './icon-paths';

export { ICON_NAMES } from './icon-paths';

/** An icon by name, or nothing for a name it does not know. */
export function Icon({ name, label }: { name: string; label?: string }) {
  const filled = FILLED[name];
  const stroked = filled ? undefined : STROKE[name];
  if (!filled && !stroked) return null;
  return (
    <svg viewBox="0 0 24 24" aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}
      fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth={stroked ? 2 : undefined}
      strokeLinecap="round" strokeLinejoin="round">
      <path d={filled ?? stroked} />
    </svg>
  );
}
