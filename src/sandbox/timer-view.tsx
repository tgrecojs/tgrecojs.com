import type { Dispatch } from 'react';
import type { TimerEvent, TimerState } from './timer';

type TimerViewProps = {
  state: TimerState;
  dispatch: Dispatch<TimerEvent>;
};

export const TimerView = ({ state, dispatch }: TimerViewProps) => {
  switch (state.status) {
    case 'idle':
      return (
        <button onClick={() => dispatch({ type: 'start', durationSeconds: 30 })}>
          Start
        </button>
      );

    case 'running':
      return (
        <section>
          <p>Running: {state.remainingSeconds} seconds remaining</p>
          <button onClick={() => dispatch({ type: 'pause' })}>Pause</button>
          <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
        </section>
      );

    case 'paused':
      return (
        <section>
          <p>Paused: {state.remainingSeconds} seconds remaining</p>
          <button onClick={() => dispatch({ type: 'resume' })}>Resume</button>
          <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
        </section>
      );

    case 'finished':
      return (
        <section>
          <p>Timer finished</p>
          <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
        </section>
      );

    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
};
