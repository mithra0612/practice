/**
 * In-memory record of puzzles solved during this visit that haven't been
 * "celebrated" on the puzzle grid yet. Deliberately not persisted: after a
 * refresh, completed puzzles simply show their tick without re-animating.
 */
const fresh = new Set();

export const markFreshWin = (id) => fresh.add(id);
export const peekFreshWins = () => new Set(fresh);
export const clearFreshWins = () => fresh.clear();
