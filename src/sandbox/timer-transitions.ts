import { transition, type TimerState } from './timer';

const idle: TimerState = { status: 'idle' };

const running = transition(idle, { type: 'start', durationSeconds: 2 });
console.log(running); // { status: 'running', remainingSeconds: 2 }

const paused = transition(running, { type: 'pause' });
console.log(paused); // { status: 'paused', remainingSeconds: 2 }

const resumed = transition(paused, { type: 'resume' });
console.log(resumed); // { status: 'running', remainingSeconds: 2 }

const finished = transition(transition(resumed, { type: 'tick' }), { type: 'tick' });
console.log(finished); // { status: 'finished' }

const stillIdle = transition(idle, { type: 'pause' });
console.log(stillIdle); // { status: 'idle' } — pause doesn't apply to an idle timer

// TypeScript rejects this call: 'start' requires durationSeconds.
transition(idle, { type: 'start' });
