import { useEffect, useState } from 'react';
import { getLocalDateKey } from '../utils/date';

export function useClock(onDateRollover?: (newDateKey: string) => void) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let lastDateKey = getLocalDateKey(new Date());

    const tick = () => {
      const current = new Date();
      setNow(current);
      const nextKey = getLocalDateKey(current);
      if (nextKey !== lastDateKey) {
        lastDateKey = nextKey;
        onDateRollover?.(nextKey);
      }
    };

    const intervalId = window.setInterval(tick, 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [onDateRollover]);

  return now;
}
