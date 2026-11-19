const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Animation timings (ms). Kept in sync with the CSS custom properties in index.css. */
export function timings() {
  if (reduced()) return { flipStep: 0, flip: 150, bounceStep: 0, bounce: 0, settle: 250 };
  return { flipStep: 260, flip: 520, bounceStep: 90, bounce: 900, settle: 450 };
}
