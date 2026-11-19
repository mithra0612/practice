import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateGuess, keyboardStatuses } from '../src/lib/evaluate.js';
import * as game from '../src/lib/game.js';
import { PUZZLES, fingerprint, getAnswer, isValidWord, validateAnswers } from '../src/lib/puzzles.js';

const code = (guess, answer) =>
  evaluateGuess(guess, answer)
    .map((s) => ({ correct: 'G', present: 'Y', absent: '-' })[s])
    .join('');

test('basic feedback', () => {
  assert.equal(code('APPLE', 'APPLE'), 'GGGGG');
  assert.equal(code('CRANE', 'APPLE'), '--Y-G');
  assert.equal(code('ZZZZZ', 'APPLE'), '-----');
});

test('duplicate letters are scored correctly', () => {
  // Only one L in answer: first L green, second L grey
  assert.equal(code('LLAMA', 'HELLO'), 'YY---');
  assert.equal(code('HELLO', 'LLAMA'), '--YY-');
  // Green consumes before yellow: answer has two Ps
  assert.equal(code('PAPPY', 'APPLE'), 'YYG--');
  // Guess has two Es, answer one E (at end): only the exact one is green
  assert.equal(code('EERIE', 'APPLE'), '----G');
  // Guess has two Es, answer one E elsewhere: only the first is yellow
  assert.equal(code('GEESE', 'THOSE'), '---GG');
  assert.equal(code('SPEED', 'ABIDE'), '--Y-Y');
  assert.equal(code('ROBOT', 'FLOOR'), 'YY-G-');
  assert.equal(code('EAGLE', 'EAGLE'), 'GGGGG');
  assert.equal(code('LEVEL', 'JOLLY'), 'Y---Y');
  assert.equal(code('ALLOY', 'JOLLY'), '-YGYG');
});

test('keyboard keeps the best status per letter', () => {
  const s = keyboardStatuses(['LLAMA', 'HELLO'], 'HELLO');
  assert.equal(s.L, 'correct');
  assert.equal(s.A, 'absent');
  assert.equal(s.H, 'correct');
});

test('config: 21 valid five-letter answers, all accepted as guesses', () => {
  assert.equal(PUZZLES.length, 21);
  for (const p of PUZZLES) {
    assert.match(p.answer, /^[A-Z]{5}$/);
    assert.ok(isValidWord(p.answer));
  }
  assert.ok(validateAnswers(['ABCD']).length > 0);
  assert.ok(validateAnswers(Array(21).fill('ABC12')).length > 0);
});

test('word validation', () => {
  assert.ok(isValidWord('crane'));
  assert.ok(!isValidWord('XQZPT'));
  assert.ok(!isValidWord('ABCD'));
});

function typeWord(state, id, word) {
  for (const l of word) state = game.typeLetter(state, id, l);
  return state;
}

test('input editing and validation', () => {
  let s = game.openPuzzle(game.initialState(), 3);
  s = typeWord(s, 3, 'CRANES'); // 6th letter ignored
  assert.equal(s.puzzles[3].current, 'CRANE');
  s = game.deleteLetter(s, 3);
  assert.equal(s.puzzles[3].current, 'CRAN');
  assert.equal(game.submitGuess(s, 3).error, 'short');
  s = typeWord(game.deleteLetter(s, 3), 3, 'QZX');
  s = game.typeLetter(s, 3, '1');
  assert.equal(s.puzzles[3].current, 'CRAQZ');
  assert.equal(game.submitGuess(s, 3).error, 'invalid');
  assert.equal(s.puzzles[3].guesses.length, 0);
});

test('win on any row marks the puzzle completed', () => {
  const id = 1;
  let s = game.openPuzzle(game.initialState(), id);
  for (const w of ['CRANE', 'MOIST']) s = game.submitGuess(typeWord(s, id, w), id).state;
  s = game.submitGuess(typeWord(s, id, getAnswer(id)), id).state;
  assert.equal(s.puzzles[id].status, 'won');
  assert.deepEqual(s.completedIds, [id]);
  // no further input accepted
  assert.equal(game.typeLetter(s, id, 'A'), s);
});

test('six wrong guesses lose; retry resets only that puzzle', () => {
  const id = 2;
  let s = game.openPuzzle(game.initialState(), 1);
  s = game.submitGuess(typeWord(s, 1, 'CRANE'), 1).state;
  s = game.openPuzzle(s, id);
  for (let i = 0; i < 6; i++) {
    assert.equal(s.puzzles[id].status, 'playing');
    s = game.submitGuess(typeWord(s, id, 'MOIST'), id).state;
  }
  assert.equal(s.puzzles[id].status, 'lost');
  assert.equal(s.puzzles[id].guesses.length, 6);
  assert.equal(game.submitGuess(typeWord(s, id, 'CRANE'), id).ignored, true);
  assert.deepEqual(s.completedIds, []);

  s = game.retryPuzzle(s, id);
  assert.equal(s.puzzles[id].status, 'playing');
  assert.equal(s.puzzles[id].guesses.length, 0);
  assert.equal(s.puzzles[id].attempts, 1);
  assert.deepEqual(s.puzzles[1].guesses, ['CRANE']); // other puzzle untouched
});

test('sanitizeState round-trips and rejects bad data', () => {
  let s = game.openPuzzle(game.initialState(), 5);
  s = game.submitGuess(typeWord(s, 5, getAnswer(5)), 5).state;
  s = typeWord(game.openPuzzle(s, 6), 6, 'CR');
  const restored = game.sanitizeState(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored, s);

  assert.deepEqual(game.sanitizeState(null), game.initialState());
  assert.deepEqual(game.sanitizeState({ version: 99 }), game.initialState());

  const tampered = JSON.parse(JSON.stringify(s));
  tampered.puzzles[6].key = fingerprint('OTHER'); // answer was edited in config
  tampered.puzzles[7] = { key: fingerprint(getAnswer(7)), guesses: ['bad', 42], current: '!!' };
  tampered.completedIds = [5, 5, 9, 'x'];
  tampered.activeId = 99;
  tampered.view = 'game';
  const clean = game.sanitizeState(tampered);
  assert.equal(clean.puzzles[6], undefined);
  assert.deepEqual(clean.puzzles[7].guesses, []);
  assert.equal(clean.puzzles[7].current, '');
  assert.deepEqual(clean.completedIds, [5]);
  assert.equal(clean.view, 'home');
});

test('storage never contains plain-text answers of unplayed puzzles', () => {
  const s = game.openPuzzle(game.initialState(), 4);
  const json = JSON.stringify(s);
  for (const p of PUZZLES) assert.ok(!json.includes(p.answer), p.answer);
});

test('finale only opens when all 21 are solved', () => {
  let s = game.initialState();
  assert.equal(game.openFinale(s).view, 'home');
  for (const { id, answer } of PUZZLES) s = game.submitGuess(typeWord(game.openPuzzle(s, id), id, answer), id).state;
  assert.equal(s.completedIds.length, 21);
  assert.equal(game.openFinale(s).view, 'finale');
});

test('final answers load in order: Word 1 = LILAC … Word 21 = TOKYO', () => {
  const expected = ['LILAC', 'STUDY', 'GAMES', 'SPORT', 'SMART', 'CHICK', 'TULIP', 'TEACH', 'GUIDE', 'SLEEP', 'SMASH',
    'NIGHT', 'NOTES', 'STYLE', 'KULFI', 'MOVIE', 'GAANA', 'SMELL', 'SNIFF', 'LOVES', 'TOKYO'];
  assert.deepEqual(PUZZLES.map((p) => p.id), expected.map((_, i) => i + 1));
  expected.forEach((word, i) => assert.equal(getAnswer(i + 1), word, `Word ${i + 1}`));
  // Non-dictionary answers must still be accepted as guesses
  for (const w of ['KULFI', 'GAANA', 'TOKYO']) assert.ok(isValidWord(w), w);
});

test('duplicate letters against the real answers', () => {
  assert.equal(code('ALPHA', 'GAANA'), 'Y---G');
  assert.equal(code('LOLLY', 'SMELL'), 'Y--G-');
  assert.equal(code('FIFTY', 'SNIFF'), 'YYY--');
  assert.equal(code('EERIE', 'SLEEP'), 'YY---');
  assert.equal(code('KICKS', 'CHICK'), 'YYY--');
  assert.equal(code('LILAC', 'LILAC'), 'GGGGG');
});

test('every one of the 21 puzzles can be won and lost independently', () => {
  for (const { id, answer } of PUZZLES) {
    let s = game.openPuzzle(game.initialState(), id);
    s = game.submitGuess(typeWord(s, id, answer), id).state;
    assert.equal(s.puzzles[id].status, 'won', `Word ${id} win`);
    assert.deepEqual(s.completedIds, [id]);

    let l = game.openPuzzle(game.initialState(), id);
    const miss = answer === 'CRANE' ? 'MOIST' : 'CRANE';
    for (let i = 0; i < 6; i++) l = game.submitGuess(typeWord(l, id, miss), id).state;
    assert.equal(l.puzzles[id].status, 'lost', `Word ${id} loss`);
    assert.deepEqual(l.completedIds, []);
    assert.deepEqual(game.sanitizeState(JSON.parse(JSON.stringify(l))), l, `Word ${id} persistence`);
  }
});
