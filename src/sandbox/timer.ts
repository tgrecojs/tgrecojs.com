// The timer from "Prevent Impossible States Pt. 2". Snippets that build on it
// import from './timer' instead of repeating it.

export type TimerState =
  | { status: 'idle' }
  | { status: 'running'; remainingSeconds: number }
  | { status: 'paused'; remainingSeconds: number }
  | { status: 'finished' };

export type TimerEvent =
  | { type: 'start'; durationSeconds: number }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'tick' }
  | { type: 'reset' };

export type Transition = (state: TimerState, event: TimerEvent) => TimerState;

export const transition: Transition = (state, event) => {
  if (event.type === 'reset') {
    return { status: 'idle' };
  }

  switch (state.status) {
    case 'idle':
      return event.type === 'start'
        ? { status: 'running', remainingSeconds: event.durationSeconds }
        : state;

    case 'running':
      switch (event.type) {
        case 'pause':
          return { status: 'paused', remainingSeconds: state.remainingSeconds };
        case 'tick':
          return state.remainingSeconds > 1
            ? { status: 'running', remainingSeconds: state.remainingSeconds - 1 }
            : { status: 'finished' };
        default:
          return state;
      }

    case 'paused':
      return event.type === 'resume'
        ? { status: 'running', remainingSeconds: state.remainingSeconds }
        : state;

    case 'finished':
      return state;

    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
};
