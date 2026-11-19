import { useEffect } from 'react';
import Finale from './components/Finale.jsx';
import GameView from './components/GameView.jsx';
import Home from './components/Home.jsx';
import { TITLE } from './config/messages.js';
import { useGameStore } from './hooks/useGameStore.js';
import { CONFIG_PROBLEMS } from './lib/puzzles.js';

function ConfigError() {
  return (
    <main className="config-error">
      <h1>Check src/config/puzzles.js</h1>
      <ul>
        {CONFIG_PROBLEMS.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </main>
  );
}

export default function App() {
  const { state, actions } = useGameStore();

  useEffect(() => {
    document.title = TITLE.documentTitle;
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.view, state.activeId]);

  if (CONFIG_PROBLEMS.length) return <ConfigError />;

  let screen;
  if (state.view === 'game' && state.activeId) {
    screen = <GameView key={state.activeId} id={state.activeId} state={state} actions={actions} />;
  } else if (state.view === 'finale') {
    screen = <Finale onHome={actions.home} />;
  } else {
    screen = <Home state={state} actions={actions} />;
  }

  return (
    <div className={`screen screen--${state.view}`} key={state.view === 'game' ? `game-${state.activeId}` : state.view}>
      {screen}
    </div>
  );
}
