import type { Dispatch } from 'react';
import type { TimerEvent, TimerState } from './timer';
import { ControlButton } from './ControlButton';

type TimerViewProps = {
  state: TimerState;
  dispatch: Dispatch<TimerEvent>;
};

export const TimerView = ({ state, dispatch }: TimerViewProps) => {
  switch (state.status) {
    case 'idle':
      return (
        <ControlButton
          label="Start"
          event={{ type: 'start', durationSeconds: 30 }}
          dispatch={dispatch}
        />
      );

    case 'running':
      return (
        <section>
          <p>Running: {state.remainingSeconds} seconds remaining</p>
          <ControlButton label="Pause" event={{ type: 'pause' }} dispatch={dispatch} />
          <ControlButton label="Reset" event={{ type: 'reset' }} dispatch={dispatch} />
        </section>
      );

    case 'paused':
      return (
        <section>
          <p>Paused: {state.remainingSeconds} seconds remaining</p>
          <ControlButton label="Resume" event={{ type: 'resume' }} dispatch={dispatch} />
          <ControlButton label="Reset" event={{ type: 'reset' }} dispatch={dispatch} />
        </section>
      );

    case 'finished':
      return (
        <section>
          <p>Timer finished</p>
          <ControlButton label="Reset" event={{ type: 'reset' }} dispatch={dispatch} />
        </section>
      );

    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
};
