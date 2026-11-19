import { useEffect, useRef, useState } from 'react';
import { FINALE } from '../config/messages.js';
import { finaleCelebration } from '../lib/confetti.js';
import { PUZZLES } from '../lib/puzzles.js';

const TOTAL = PUZZLES.length;
const FILL_START = 250; // ms — keep in sync with .finale__seg delay in CSS
const FILL_STEP = 45; // ms per segment

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Popper({ side }) {
  return (
    <div className={`popper popper--${side}`} aria-hidden="true">
      <svg className="popper__cone" viewBox="0 0 40 64" width="40" height="64">
        <defs>
          <clipPath id={`cone-${side}`}>
            <path d="M3 8 L37 8 L20 63 Z" />
          </clipPath>
        </defs>
        <g clipPath={`url(#cone-${side})`}>
          <rect x="0" y="0" width="40" height="64" fill="#0f1a38" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="-20" y={8 + i * 13} width="80" height="5" fill="#2f5fff" transform="rotate(-24 20 32)" />
          ))}
        </g>
        <ellipse cx="20" cy="8" rx="17" ry="4" fill="#c3cad8" />
        <ellipse cx="20" cy="8" rx="13.5" ry="2.4" fill="#0a1124" />
      </svg>
      <span className="popper__puff" />
      <span className="popper__mouth" />
    </div>
  );
}

export default function Finale({ onHome }) {
  const [count, setCount] = useState(() => (reducedMotion() ? TOTAL : 0));
  const landed = count === TOTAL;
  const heading = useRef(null);

  // Party poppers + confetti: once per visit to this screen (not per render).
  useEffect(() => {
    const mouth = (side) => {
      const r = document.querySelector(`.popper--${side} .popper__mouth`)?.getBoundingClientRect();
      return r && { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
    };
    return finaleCelebration(() => ({ left: mouth('left'), right: mouth('right') }));
  }, []);

  // Count 0 → 21 in step with the progress bar filling.
  useEffect(() => {
    if (reducedMotion()) return undefined;
    let raf = 0;
    const start = performance.now() + FILL_START;
    const duration = FILL_STEP * TOTAL;
    const step = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      setCount(Math.round(t * TOTAL));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => heading.current?.focus({ preventScroll: true }), []);

  const [first, ...rest] = FINALE.message;

  return (
    <main className="finale">
      <Popper side="left" />
      <Popper side="right" />

      <div className={`finale__counter${landed ? ' is-landed' : ''}`} aria-label={`${TOTAL} of ${TOTAL} completed`}>
        <span className="finale__count">{count}</span>
        <span className="finale__of">/ {TOTAL}</span>
      </div>

      <div className="finale__bar" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={TOTAL}>
        {PUZZLES.map(({ id }, i) => (
          <span key={id} className="finale__seg" style={{ '--i': i }} />
        ))}
      </div>

      <p className="finale__caption">
        {FINALE.score} {FINALE.headline}
      </p>

      <h1 className="finale__banner" ref={heading} tabIndex={-1}>
        {FINALE.banner}
      </h1>
      <p className="finale__cheer">{FINALE.cheer}</p>

      <span className="finale__rule" aria-hidden="true" />

      <div className="finale__message">
        <p className="finale__greeting">{first}</p>
        {rest.map((line, i) => (line ? <p key={i}>{line}</p> : <span key={i} className="finale__gap" />))}
      </div>

      <button type="button" className="btn btn--ghost finale__back" onClick={onHome}>
        Back to all words
      </button>
    </main>
  );
}
