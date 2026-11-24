export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface TimeWish {
  title: string;
  subtitle: string;
}

export function getTimeWish(date: Date = new Date()): TimeWish {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return {
      title: 'Good morning',
      subtitle: 'CLEAR MIND · FRESH START',
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      title: 'Good afternoon',
      subtitle: 'STEADY MOMENTUM · DEEP FOCUS',
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      title: 'Good evening',
      subtitle: 'CALM PACE · FINISH STRONG',
    };
  }
  return {
    title: 'Good night',
    subtitle: 'QUIET HOURS · STAY SHARP',
  };
}

export function formatClockParts(
  date: Date,
  use24Hour: boolean,
  showSeconds: boolean
): {
  hours: string;
  minutes: string;
  seconds: string;
  period: string;
} {
  let rawHours = date.getHours();
  const period = use24Hour ? '' : rawHours >= 12 ? 'pm' : 'am';
  if (!use24Hour) {
    rawHours = rawHours % 12 || 12;
  }
  return {
    hours: use24Hour ? String(rawHours).padStart(2, '0') : String(rawHours),
    minutes: String(date.getMinutes()).padStart(2, '0'),
    seconds: showSeconds ? String(date.getSeconds()).padStart(2, '0') : '',
    period,
  };
}

export function formatDateDetails(date: Date): {
  weekday: string;
  fullDate: string;
  retroDate: string;
} {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNum = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const fullDate = date
    .toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
  return {
    weekday: weekday.toUpperCase(),
    fullDate,
    retroDate: `${weekday}, ${dayNum} ${month}`,
  };
}

export function getDayProgressPercent(date: Date = new Date()): number {
  const minutesElapsed = date.getHours() * 60 + date.getMinutes();
  return Math.min(100, Math.max(0, Math.round((minutesElapsed / 1440) * 100)));
}

export function formatMinutesCompact(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatTimerCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
