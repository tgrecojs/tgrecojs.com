import { useReducer } from 'react';
import { transition, type TimerState } from './timer';

const initialState: TimerState = { status: 'idle' };

export const Timer = () => {
  const [state, dispatch] = useReducer(transition, initialState);

  return (
    <section>
      <p>Status: {state.status}</p>
      {state.status === 'idle' ? (
        <button
          onClick={() => dispatch({ type: 'start', durationSeconds: 30 })}
        >
          Start
        </button>
      ) : null}
    </section>
  );
};
