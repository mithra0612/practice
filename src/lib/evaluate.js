export const CORRECT = 'correct';
export const PRESENT = 'present';
export const ABSENT = 'absent';

/**
 * Score a guess against the answer using standard Wordle rules.
 *
 * Duplicate letters are handled in two passes:
 *  1. Exact matches are marked green and consume that letter from the answer.
 *  2. Remaining letters are marked yellow only while unconsumed copies of
 *     that letter are still left in the answer; otherwise grey.
 *
 * e.g. answer APPLE, guess PAPPY → P(yellow) A(yellow) P(green) P(grey) Y(grey)
 */
export function evaluateGuess(guess, answer) {
  const g = guess.toUpperCase();
  const a = answer.toUpperCase();
  if (g.length !== a.length) throw new Error('Guess and answer must be the same length');

  const result = new Array(g.length).fill(ABSENT);
  const remaining = {};

  for (let i = 0; i < a.length; i++) {
    if (g[i] === a[i]) result[i] = CORRECT;
    else remaining[a[i]] = (remaining[a[i]] || 0) + 1;
  }

  for (let i = 0; i < g.length; i++) {
    if (result[i] === CORRECT) continue;
    if (remaining[g[i]] > 0) {
      result[i] = PRESENT;
      remaining[g[i]]--;
    }
  }

  return result;
}

const RANK = { [ABSENT]: 1, [PRESENT]: 2, [CORRECT]: 3 };

/** Best-known status for each letter across all guesses, for colouring the keyboard. */
export function keyboardStatuses(guesses, answer) {
  const map = {};
  for (const guess of guesses) {
    const statuses = evaluateGuess(guess, answer);
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];
      if (!map[letter] || RANK[statuses[i]] > RANK[map[letter]]) map[letter] = statuses[i];
    }
  }
  return map;
}
