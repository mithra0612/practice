import { TITLE } from '../config/messages.js';
import { PUZZLES } from '../lib/puzzles.js';
import Progress from './Progress.jsx';
import PuzzleGrid from './PuzzleGrid.jsx';

export default function Home({ state, actions }) {
  const done = state.completedIds.length;
  const total = PUZZLES.length;
  const allDone = done === total;

  return (
    <main className="home">
      <header className="masthead">
        <h1 className="masthead__title">
          <span className="masthead__name">{TITLE.name}</span>
          <span className="sr-only">: </span>
          <span className="masthead__edition">
            <span className="masthead__rule" aria-hidden="true" />
            {TITLE.edition}
          </span>
        </h1>
        <p className="masthead__subtitle">{TITLE.subtitle}</p>
      </header>

      <Progress done={done} total={total} />

      <PuzzleGrid puzzles={PUZZLES} state={state} onOpen={actions.open} />

      <footer className="home__foot">
        {allDone ? (
          <button type="button" className="btn btn--primary" onClick={actions.finale}>
            Open your message
          </button>
        ) : (
          <p className="hint">Pick any word, in any order. Six guesses each.</p>
        )}
      </footer>
    </main>
  );
}
