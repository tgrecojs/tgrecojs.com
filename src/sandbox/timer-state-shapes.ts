type TimerState =
  | { status: 'idle' }
  | { status: 'running'; remainingSeconds: number }
  | { status: 'paused'; remainingSeconds: number }
  | { status: 'finished' };

// An idle timer has no remaining time.
const bad: TimerState = { status: 'idle', remainingSeconds: 5 };

// A running timer must say how much time is left.
const bad2: TimerState = { status: 'running' };

console.log(bad, bad2);
