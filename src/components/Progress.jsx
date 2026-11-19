import { useEffect, useState } from 'react';

// Last count the player actually saw, so returning to the grid after a win
// animates from the old value to the new one (and a page refresh does not).
let lastShown = null;

/** Segmented progress meter — one segment per puzzle, filled left to right. */
export default function Progress({ done, total }) {
  const [from] = useState(() => lastShown ?? done);
  const [shown, setShown] = useState(from);

  useEffect(() => {
    lastShown = shown;
    if (shown === done) return undefined;
    const t = setTimeout(() => setShown(done), 450); // let the screen settle first
    return () => clearTimeout(t);
  }, [shown, done]);

  const bumped = shown > from;

  return (
    <section className="progress" aria-label="Progress">
      <div className="progress__row">
        <span className="eyebrow">Progress</span>
        <span className="progress__count">
          <strong key={shown} className={bumped ? 'is-bump' : undefined}>
            {shown}
          </strong>
          <span className="progress__sep"> / </span>
          {total} completed
        </span>
      </div>
      <div
        className="progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total} completed`}
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`progress__seg${i < shown ? ' is-on' : ''}${bumped && i >= from && i < shown ? ' is-new' : ''}`}
            style={{ '--d': `${Math.max(0, i - from) * 70}ms` }}
          />
        ))}
      </div>
    </section>
  );
}
