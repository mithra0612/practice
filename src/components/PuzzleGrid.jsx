import { useEffect, useState } from 'react';
import { clearFreshWins, peekFreshWins } from '../lib/celebrations.js';
import { MAX_GUESSES } from '../lib/puzzles.js';
import { Check, Retry } from './Icons.jsx';

function describe(puzzle) {
  if (!puzzle) return { kind: 'new', note: 'Not played' };
  if (puzzle.status === 'won') return { kind: 'won', note: 'Completed' };
  if (puzzle.status === 'lost') return { kind: 'lost', note: 'Not solved — try again' };
  if (puzzle.guesses.length || puzzle.current) {
    return { kind: 'progress', note: `In progress, ${puzzle.guesses.length} of ${MAX_GUESSES} guesses used` };
  }
  return { kind: 'new', note: 'Not played' };
}

function Selector({ id, puzzle, active, fresh, index, onOpen }) {
  const { kind, note } = describe(puzzle);
  const used = puzzle?.guesses.length ?? 0;
  const celebrate = fresh && kind === 'won';

  return (
    <li className="selector-cell" style={{ '--i': index }}>
      <button
        type="button"
        className={`selector is-${kind}${active ? ' is-active' : ''}${celebrate ? ' is-fresh' : ''}`}
        onClick={() => onOpen(id)}
        aria-label={`Word ${id}. ${note}${active ? '. Last opened' : ''}`}
      >
        <span className="selector__label">Word</span>
        <span className="selector__num">{id}</span>

        {kind === 'won' && (
          <span className="selector__badge selector__badge--won">
            <Check width={11} height={11} />
          </span>
        )}
        {kind === 'lost' && (
          <span className="selector__badge selector__badge--lost">
            <Retry width={11} height={11} />
          </span>
        )}
        {kind === 'progress' && (
          <span className="selector__pips" aria-hidden="true">
            {Array.from({ length: MAX_GUESSES }, (_, i) => (
              <i key={i} className={i < used ? 'is-on' : ''} />
            ))}
          </span>
        )}
      </button>
    </li>
  );
}

export default function PuzzleGrid({ puzzles, state, onOpen }) {
  // Words solved since the grid was last shown get a one-time tick animation.
  const [fresh] = useState(peekFreshWins);
  useEffect(() => clearFreshWins(), []);

  return (
    <ol className="puzzle-grid" aria-label="Choose a word">
      {puzzles.map(({ id }, index) => (
        <Selector
          key={id}
          id={id}
          index={index}
          puzzle={state.puzzles[id]}
          active={state.activeId === id}
          fresh={fresh.has(id)}
          onOpen={onOpen}
        />
      ))}
    </ol>
  );
}
