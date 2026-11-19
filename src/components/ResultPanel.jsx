import { useEffect, useRef } from 'react';
import { MAX_GUESSES } from '../lib/puzzles.js';
import { Check } from './Icons.jsx';

export default function ResultPanel({ status, answer, guessCount, nextId, allDone, onHome, onNext, onRetry, onFinale }) {
  const primary = useRef(null);
  useEffect(() => {
    primary.current?.focus({ preventScroll: true });
  }, []);

  const won = status === 'won';

  return (
    <section className={`result result--${status}`} aria-live="polite">
      <div className="result__head">
        <span className="eyebrow result__eyebrow">
          {won && (
            <span className="result__check" aria-hidden="true">
              <Check width={12} height={12} />
            </span>
          )}
          {won ? 'Solved' : 'Not this time'}
        </span>
        <p className="result__title">
          {won ? (
            <>
              In {guessCount} <span className="result__muted">of {MAX_GUESSES}</span>
            </>
          ) : (
            'The word was'
          )}
        </p>
      </div>

      <div className="result__word" aria-label={`The word was ${answer}`}>
        {[...answer].map((l, i) => (
          <span key={i} className={`mini-tile ${won ? 'is-correct' : 'is-reveal'}`} style={{ '--i': i }}>
            {l}
          </span>
        ))}
      </div>

      <div className="result__actions">
        <button type="button" className="btn btn--ghost" onClick={onHome}>
          All words
        </button>
        {won ? (
          allDone ? (
            <button ref={primary} type="button" className="btn btn--primary" onClick={onFinale}>
              Open your message
            </button>
          ) : (
            nextId && (
              <button ref={primary} type="button" className="btn btn--primary" onClick={() => onNext(nextId)}>
                Next: Word {nextId}
              </button>
            )
          )
        ) : (
          <button ref={primary} type="button" className="btn btn--primary" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </section>
  );
}
