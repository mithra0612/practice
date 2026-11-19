import { Backspace } from './Icons.jsx';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', ['ENTER', ...'ZXCVBNM', 'BACK']];

export default function Keyboard({ statuses, onKey, disabled }) {
  const press = (e, key) => {
    e.currentTarget.blur(); // stop a later physical Enter from "clicking" this key again
    if (!disabled) onKey(key);
  };

  return (
    <div className={`keyboard${disabled ? ' is-locked' : ''}`} role="group" aria-label="Keyboard">
      {ROWS.map((row, r) => (
        <div className="keyboard__row" key={r}>
          {r === 1 && <span className="keyboard__spacer" />}
          {[...row].map((key) => {
            const wide = key === 'ENTER' || key === 'BACK';
            const status = statuses[key];
            return (
              <button
                key={key}
                type="button"
                className={`key${wide ? ' key--wide' : ''}${status ? ` is-${status}` : ''}`}
                onClick={(e) => press(e, key)}
                aria-label={key === 'BACK' ? 'Backspace' : key === 'ENTER' ? 'Enter' : `${key}${status ? `, ${status}` : ''}`}
              >
                {key === 'BACK' ? <Backspace /> : key === 'ENTER' ? 'Enter' : key}
              </button>
            );
          })}
          {r === 1 && <span className="keyboard__spacer" />}
        </div>
      ))}
    </div>
  );
}
