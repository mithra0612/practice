/**
 * All the words shown on screen that you might want to tweak.
 * Edit freely — no game logic lives here.
 */

export const TITLE = {
  name: 'WORDLE',
  edition: "Moulee’s Birthday Edition",
  subtitle: '21 challenges. One special edition.',
  documentTitle: 'Wordle · Moulee’s 21st Birthday Edition',
};

/** Shown once every one of the 21 puzzles has been solved. */
export const FINALE = {
  banner: 'ALL 21 WORDS CONQUERED!',
  cheer: 'You did it, Moulee!',
  score: '21 out of 21.',
  headline: 'You solved them all!',
  // Each string is its own line. Use '' for a blank line between paragraphs.
  message: [
    'Happy 21st Birthday, Moulee!',
    '',
    'One more year, countless more memories.',
    'I’m so glad I get to be part of your story.',
  ],
};

/** Toast shown after a correct guess, indexed by the row it was solved on (1–6). */
export const WIN_PRAISE = ['Unreal', 'Brilliant', 'Superb', 'Excellent', 'Nicely done', 'Just in time'];
