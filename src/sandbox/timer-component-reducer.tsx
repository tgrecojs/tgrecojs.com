import { useReducer } from 'react';
import { transition, type TimerState } from './timer';
import { TimerView } from './TimerView';

const initialState: TimerState = { status: 'idle' };

export const Timer = () => {
  const [state, dispatch] = useReducer(transition, initialState);

  return <TimerView state={state} dispatch={dispatch} />;
};
