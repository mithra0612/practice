import { initialState, sanitizeState } from './game.js';

const STORAGE_KEY = 'moulee-wordle:v1';

export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : initialState();
  } catch {
    return initialState(); // corrupt JSON, private mode, storage blocked…
  }
}

export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — the game still works for this session */
  }
}
