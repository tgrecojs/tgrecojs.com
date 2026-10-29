type TimerState =
  | { status: 'idle' }
  | { status: 'running'; remainingSeconds: number }
  | { status: 'paused'; remainingSeconds: number }
  | { status: 'finished' }
  | { status: 'cancelled' };

type TimerEvent =
  | { type: 'start'; durationSeconds: number }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'tick' }
  | { type: 'reset' };

const transition = (state: TimerState, event: TimerEvent): TimerState => {
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

    // 'cancelled' has no case, so `state` is not `never` here.
    // Add `case 'cancelled': return state;` above and the error goes away.
    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
};

console.log(transition({ status: 'idle' }, { type: 'start', durationSeconds: 3 }));
