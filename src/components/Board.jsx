import { evaluateGuess } from '../lib/evaluate.js';
import { MAX_GUESSES, WORD_LENGTH } from '../lib/puzzles.js';

const STATUS_LABEL = { correct: 'correct', present: 'in the word, wrong spot', absent: 'not in the word' };

function Tile({ letter, status, reveal, bounce, index }) {
  const cls = ['tile'];
  if (letter) cls.push('is-filled');
  if (status) cls.push(`is-${status}`);
  if (reveal) cls.push('is-revealing');
  if (bounce) cls.push('is-bouncing');
  return (
    <div className={cls.join(' ')} style={{ '--i': index }} aria-label={letter ? `${letter}${status ? `, ${STATUS_LABEL[status]}` : ''}` : 'empty'} role="gridcell">
      <span className="tile__face">{letter}</span>
    </div>
  );
}

export default function Board({ guesses, current, answer, revealRow, bounceRow, shake, timing }) {
  const rows = [];
  for (let r = 0; r < MAX_GUESSES; r++) {
    let letters = '';
    let statuses = null;
    if (r < guesses.length) {
      letters = guesses[r];
      statuses = evaluateGuess(letters, answer);
    } else if (r === guesses.length) {
      letters = current;
    }
    const isCurrent = r === guesses.length;
    rows.push(
      <div
        key={r}
        role="row"
        className={`board__row${isCurrent && shake ? ' is-shaking' : ''}`}
        aria-label={`Guess ${r + 1}`}
      >
        {Array.from({ length: WORD_LENGTH }, (_, i) => (
          <Tile
            key={i}
            index={i}
            letter={letters[i] || ''}
            status={statuses?.[i]}
            reveal={r === revealRow}
            bounce={r === bounceRow}
          />
        ))}
      </div>,
    );
  }

  return (
    <div className="board-wrap">
      <div
        className="board"
        role="grid"
        aria-label="Game board"
        style={{
          '--flip': `${timing.flip}ms`,
          '--flip-step': `${timing.flipStep}ms`,
          '--bounce': `${timing.bounce}ms`,
          '--bounce-step': `${timing.bounceStep}ms`,
        }}
      >
        {rows}
      </div>
    </div>
  );
}
