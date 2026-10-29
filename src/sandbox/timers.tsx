import { useState } from 'react';
import { Timer } from './Timer';

export const Timers = () => {
  const [timerIds, setTimerIds] = useState<string[]>([]);

  const createTimer = () => {
    const id = crypto.randomUUID();
    setTimerIds(ids => [...ids, id]);
  };

  return (
    <section>
      <button type="button" onClick={createTimer}>Create timer</button>
      <ul>
        {timerIds.map((id, index) => (
          <li key={id}>
            <h2>Timer {index + 1}</h2>
            <Timer />
          </li>
        ))}
      </ul>
    </section>
  );
};
