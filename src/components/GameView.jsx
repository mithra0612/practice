import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TITLE, WIN_PRAISE } from '../config/messages.js';
import { markFreshWin } from '../lib/celebrations.js';
import { winBurst } from '../lib/confetti.js';
import { keyboardStatuses } from '../lib/evaluate.js';
import { getPuzzle } from '../lib/game.js';
import { timings } from '../lib/motion.js';
import { PUZZLES, WORD_LENGTH, getAnswer } from '../lib/puzzles.js';
import Board from './Board.jsx';
import { ChevronLeft, ChevronRight, GridIcon } from './Icons.jsx';
import Keyboard from './Keyboard.jsx';
import ResultPanel from './ResultPanel.jsx';

const TOTAL = PUZZLES.length;
const wrap = (id) => ((id - 1 + TOTAL) % TOTAL) + 1;

export default function GameView({ id, state, actions }) {
  const puzzle = getPuzzle(state, id);
  const answer = getAnswer(id);
  const timing = useMemo(timings, []);

  const [revealRow, setRevealRow] = useState(null);
  const [bounceRow, setBounceRow] = useState(null);
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState(null);
  const [showResult, setShowResult] = useState(puzzle.status !== 'playing');
  const [announcement, setAnnouncement] = useState('');

  const busy = revealRow !== null || bounceRow !== null;
  const timers = useRef([]);
  const later = useCallback((fn, ms) => timers.current.push(setTimeout(fn, ms)), []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const flash = useCallback(
    (text, ms = 1400) => {
      const t = { text, key: Date.now() };
      setToast(t);
      later(() => setToast((cur) => (cur === t ? null : cur)), ms);
    },
    [later],
  );

  const submit = useCallback(() => {
    const { state: next, error, ignored } = actions.submit(id);
    if (ignored) return;
    if (error) {
      setShake(true);
      later(() => setShake(false), 600);
      flash(error === 'short' ? 'Not enough letters' : 'Not in word list');
      return;
    }

    const p = next.puzzles[id];
    const row = p.guesses.length - 1;
    if (p.status === 'won') markFreshWin(id);
    const revealTime = timing.flipStep * (WORD_LENGTH - 1) + timing.flip;
    setRevealRow(row);

    later(() => {
      setRevealRow(null);
      if (p.status === 'won') {
        setBounceRow(row);
        const rect = document.querySelector('.board')?.getBoundingClientRect();
        winBurst(
          rect
            ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height * 0.45) / window.innerHeight }
            : undefined,
        );
        setAnnouncement(`Solved in ${row + 1}.`);
        flash(WIN_PRAISE[row] ?? 'Solved', 1800);
        const allDone = next.completedIds.length === TOTAL;
        later(() => {
          setBounceRow(null);
          if (allDone) later(actions.finale, 900);
          setShowResult(true);
        }, timing.bounceStep * (WORD_LENGTH - 1) + timing.bounce + timing.settle);
      } else if (p.status === 'lost') {
        setAnnouncement(`Out of guesses. The word was ${answer}.`);
        later(() => setShowResult(true), timing.settle);
      } else {
        setAnnouncement(`Guess ${row + 1} submitted.`);
      }
    }, revealTime);
  }, [actions, id, answer, timing, later, flash]);

  const onKey = useCallback(
    (key) => {
      if (busy || puzzle.status !== 'playing') return;
      if (key === 'ENTER') submit();
      else if (key === 'BACK') actions.erase(id);
      else actions.type(id, key);
    },
    [busy, puzzle.status, submit, actions, id],
  );

  // Physical keyboard
  useEffect(() => {
    const handle = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      if (e.key === 'Escape') {
        actions.home();
        return;
      }
      const onButton = e.target instanceof HTMLElement && e.target.closest('button, a, input, textarea');
      if (e.key === 'Enter') {
        if (onButton) return; // let focused buttons behave normally
        e.preventDefault();
        onKey('ENTER');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        onKey('BACK');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        onKey(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onKey, actions]);

  // Keyboard colours only update once a row has finished revealing.
  const settledGuesses = revealRow === null ? puzzle.guesses : puzzle.guesses.slice(0, revealRow);
  const keyStatuses = useMemo(() => keyboardStatuses(settledGuesses, answer), [settledGuesses, answer]);

  const nextUnsolved = useMemo(() => {
    for (let step = 1; step < TOTAL; step++) {
      const candidate = wrap(id + step);
      if (state.puzzles[candidate]?.status !== 'won') return candidate;
    }
    return null;
  }, [id, state.puzzles]);

  return (
    <main className="game">
      <header className="topbar">
        <button type="button" className="icon-btn topbar__back" onClick={actions.home} aria-label="Back to all words">
          <GridIcon />
          <span className="topbar__back-label">All words</span>
        </button>

        <div className="topbar__center">
          <button type="button" className="icon-btn" onClick={() => actions.open(wrap(id - 1))} aria-label={`Previous: Word ${wrap(id - 1)}`}>
            <ChevronLeft />
          </button>
          <div className="topbar__title">
            <h1>Word {id}</h1>
            <span className="topbar__brand">{TITLE.name} · {TITLE.edition}</span>
          </div>
          <button type="button" className="icon-btn" onClick={() => actions.open(wrap(id + 1))} aria-label={`Next: Word ${wrap(id + 1)}`}>
            <ChevronRight />
          </button>
        </div>

        <span className="topbar__count" aria-label={`${state.completedIds.length} of ${TOTAL} completed`}>
          {state.completedIds.length}<span>/{TOTAL}</span>
        </span>
      </header>

      <div className="game__stage">
        <div className="toast-layer" aria-live="assertive">
          {toast && (
            <div key={toast.key} className="toast">
              {toast.text}
            </div>
          )}
        </div>
        <Board
          guesses={puzzle.guesses}
          current={puzzle.current}
          answer={answer}
          revealRow={revealRow}
          bounceRow={bounceRow}
          shake={shake}
          timing={timing}
        />
      </div>

      <div className="game__dock">
        {showResult && puzzle.status !== 'playing' ? (
          <ResultPanel
            status={puzzle.status}
            answer={answer}
            guessCount={puzzle.guesses.length}
            nextId={nextUnsolved}
            allDone={state.completedIds.length === TOTAL}
            onHome={actions.home}
            onNext={actions.open}
            onFinale={actions.finale}
            onRetry={() => {
              actions.retry(id);
              setShowResult(false);
            }}
          />
        ) : (
          <Keyboard statuses={keyStatuses} onKey={onKey} disabled={busy || puzzle.status !== 'playing'} />
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </main>
  );
}
