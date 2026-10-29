import { useTimer } from './useTimer';
import { TimerView } from './TimerView';

export const Timer = () => {
  const { state, dispatch } = useTimer();

  return <TimerView state={state} dispatch={dispatch} />;
};
