import { WORDS } from '../config/puzzles.js';
import WORD_STRING from '../data/validWords.js';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;
export const PUZZLE_COUNT = 21;

/** Returns a list of human-readable problems with the answer config (empty if fine). */
export function validateAnswers(answers) {
  const problems = [];
  if (!Array.isArray(answers)) return ['WORDS must be an array.'];
  if (answers.length !== PUZZLE_COUNT) {
    problems.push(`Expected exactly ${PUZZLE_COUNT} answers but found ${answers.length}.`);
  }
  answers.forEach((word, i) => {
    if (typeof word !== 'string' || !/^[A-Za-z]{5}$/.test(word.trim())) {
      problems.push(`Word ${i + 1} must be exactly five letters (A–Z), got ${JSON.stringify(word)}.`);
    }
  });
  return problems;
}

export const CONFIG_PROBLEMS = validateAnswers(WORDS);

/** Puzzles are identified by their 1-based number ("Word 1" … "Word 21"). */
export const PUZZLES = CONFIG_PROBLEMS.length
  ? []
  : WORDS.map((word, i) => ({ id: i + 1, answer: word.trim().toUpperCase() }));

const answerById = new Map(PUZZLES.map((p) => [p.id, p.answer]));
export const getAnswer = (id) => answerById.get(id);

const VALID = new Set();
for (let i = 0; i < WORD_STRING.length; i += WORD_LENGTH) VALID.add(WORD_STRING.slice(i, i + WORD_LENGTH));
for (const p of PUZZLES) VALID.add(p.answer);

export const isValidWord = (word) => VALID.has(word.toUpperCase());

/**
 * Small non-reversible fingerprint of an answer. Saved with each puzzle's
 * progress so that editing an answer in the config resets only that puzzle,
 * without ever writing the answer itself to localStorage.
 */
export function fingerprint(word) {
  let h = 5381;
  for (const ch of `moulee:${word}`) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h.toString(36);
}
