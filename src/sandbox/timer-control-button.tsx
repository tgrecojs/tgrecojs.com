import type { Dispatch } from "react";
import type { TimerEvent } from "./timer";

export type TimerControlProps = {
  event: TimerEvent;
  label: string;
  dispatch: Dispatch<TimerEvent>;
};

export const ControlButton = ({ event, label, dispatch }: TimerControlProps) => (
  <button type="button" onClick={() => dispatch(event)}>
    {label}
  </button>
);
