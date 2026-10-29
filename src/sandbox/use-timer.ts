import { useEffect, useReducer } from 'react';
import { transition, type TimerState } from './timer';

const initialState: TimerState = { status: 'idle' };

export const useTimer = () => {
  const [state, dispatch] = useReducer(transition, initialState);

  useEffect(() => {
    if (state.status !== 'running') return;

    const intervalId = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(intervalId);
  }, [state.status, dispatch]);

  return { state, dispatch };
};
