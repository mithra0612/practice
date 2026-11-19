import { MAX_GUESSES, PUZZLES, WORD_LENGTH, fingerprint, getAnswer, isValidWord } from './puzzles.js';

export const STATE_VERSION = 1;
export const VIEWS = ['home', 'game', 'finale'];

export const emptyPuzzle = (answer) => ({
  key: fingerprint(answer),
  guesses: [],
  current: '',
  status: 'playing', // 'playing' | 'won' | 'lost'
  attempts: 0, // number of finished-but-lost runs before the current one
});

export const initialState = () => ({
  version: STATE_VERSION,
  view: 'home',
  activeId: null,
  puzzles: {},
  completedIds: [],
});

/** Status is always derived from the guesses so it can never drift out of sync. */
export function deriveStatus(guesses, answer) {
  if (guesses.length && guesses[guesses.length - 1] === answer) return 'won';
  if (guesses.length >= MAX_GUESSES) return 'lost';
  return 'playing';
}

const isWord = (w) => typeof w === 'string' && /^[A-Z]{5}$/.test(w);

/**
 * Rebuild a trustworthy state from whatever was in localStorage.
 * Anything malformed, stale (answer changed) or out of range is dropped.
 */
export function sanitizeState(raw) {
  const base = initialState();
  if (!raw || typeof raw !== 'object' || raw.version !== STATE_VERSION) return base;

  for (const { id, answer } of PUZZLES) {
    const p = raw.puzzles?.[id];
    if (!p || typeof p !== 'object' || p.key !== fingerprint(answer)) continue;

    const guesses = [];
    for (const g of Array.isArray(p.guesses) ? p.guesses : []) {
      if (!isWord(g) || guesses.length >= MAX_GUESSES) break;
      guesses.push(g);
      if (g === answer) break; // nothing can follow a winning guess
    }
    const status = deriveStatus(guesses, answer);
    const current =
      status === 'playing' && typeof p.current === 'string' && /^[A-Z]{0,5}$/.test(p.current) ? p.current : '';
    const attempts = Number.isInteger(p.attempts) && p.attempts > 0 ? Math.min(p.attempts, 999) : 0;
    base.puzzles[id] = { key: p.key, guesses, current, status, attempts };
  }

  const won = (id) => base.puzzles[id]?.status === 'won';
  const ordered = Array.isArray(raw.completedIds) ? raw.completedIds.filter((id, i, a) => won(id) && a.indexOf(id) === i) : [];
  for (const { id } of PUZZLES) if (won(id) && !ordered.includes(id)) ordered.push(id);
  base.completedIds = ordered;

  base.activeId = getAnswer(raw.activeId) ? raw.activeId : null;
  base.view = VIEWS.includes(raw.view) ? raw.view : 'home';
  if (base.view === 'game' && !base.activeId) base.view = 'home';
  if (base.view === 'finale' && ordered.length !== PUZZLES.length) base.view = 'home';
  return base;
}

export const getPuzzle = (state, id) => state.puzzles[id] ?? emptyPuzzle(getAnswer(id));

function withPuzzle(state, id, puzzle) {
  const puzzles = { ...state.puzzles, [id]: puzzle };
  let completedIds = state.completedIds;
  if (puzzle.status === 'won' && !completedIds.includes(id)) completedIds = [...completedIds, id];
  if (puzzle.status !== 'won' && completedIds.includes(id)) completedIds = completedIds.filter((x) => x !== id);
  return { ...state, puzzles, completedIds };
}

export function openPuzzle(state, id) {
  if (!getAnswer(id)) return state;
  return withPuzzle({ ...state, view: 'game', activeId: id }, id, getPuzzle(state, id));
}

export const goHome = (state) => ({ ...state, view: 'home' });

export const openFinale = (state) =>
  state.completedIds.length === PUZZLES.length ? { ...state, view: 'finale' } : state;

export function typeLetter(state, id, letter) {
  const p = getPuzzle(state, id);
  const l = String(letter).toUpperCase();
  if (p.status !== 'playing' || !/^[A-Z]$/.test(l) || p.current.length >= WORD_LENGTH) return state;
  return withPuzzle(state, id, { ...p, current: p.current + l });
}

export function deleteLetter(state, id) {
  const p = getPuzzle(state, id);
  if (p.status !== 'playing' || !p.current) return state;
  return withPuzzle(state, id, { ...p, current: p.current.slice(0, -1) });
}

/**
 * Submit the current row.
 * Returns { state, error } where error is null, 'short' or 'invalid'.
 */
export function submitGuess(state, id) {
  const p = getPuzzle(state, id);
  if (p.status !== 'playing') return { state, error: null, ignored: true };
  if (p.current.length < WORD_LENGTH) return { state, error: 'short' };
  if (!isValidWord(p.current)) return { state, error: 'invalid' };

  const answer = getAnswer(id);
  const guesses = [...p.guesses, p.current];
  const status = deriveStatus(guesses, answer);
  return { state: withPuzzle(state, id, { ...p, guesses, current: '', status }), error: null };
}

/** Start a lost puzzle over from an empty board. */
export function retryPuzzle(state, id) {
  const p = getPuzzle(state, id);
  if (p.status !== 'lost') return state;
  return withPuzzle(state, id, { ...emptyPuzzle(getAnswer(id)), attempts: p.attempts + 1 });
}
