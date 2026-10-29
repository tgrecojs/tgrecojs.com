import type { TimerState } from './timer';

// This view returns status text. It deliberately leaves out 'paused'.
const TimerStatus = ({ state }: { state: TimerState }): string => {
  switch (state.status) {
    case 'idle':
      return 'Ready to start';
    case 'running':
      return `Running: ${state.remainingSeconds} seconds remaining`;
    case 'finished':
      return 'Timer finished';
    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
};

// Add a 'paused' case above the default, returning the paused status text.
console.log(TimerStatus({ state: { status: 'running', remainingSeconds: 20 } }));
