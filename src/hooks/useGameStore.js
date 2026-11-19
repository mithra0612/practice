import { useCallback, useMemo, useRef, useState } from 'react';
import * as game from '../lib/game.js';
import { loadState, saveState } from '../lib/storage.js';

/**
 * Single source of truth for all progress. Every change is written to
 * localStorage immediately, so a refresh mid-game never loses anything.
 */
export function useGameStore() {
  const [state, setState] = useState(loadState);
  const ref = useRef(state);

  const commit = useCallback((next) => {
    if (next === ref.current) return next;
    ref.current = next;
    saveState(next);
    setState(next);
    return next;
  }, []);

  const actions = useMemo(
    () => ({
      open: (id) => commit(game.openPuzzle(ref.current, id)),
      home: () => commit(game.goHome(ref.current)),
      finale: () => commit(game.openFinale(ref.current)),
      type: (id, letter) => commit(game.typeLetter(ref.current, id, letter)),
      erase: (id) => commit(game.deleteLetter(ref.current, id)),
      retry: (id) => commit(game.retryPuzzle(ref.current, id)),
      submit: (id) => {
        const result = game.submitGuess(ref.current, id);
        commit(result.state);
        return result;
      },
    }),
    [commit],
  );

  return { state, actions };
}
