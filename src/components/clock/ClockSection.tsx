import { formatClockParts, formatDateDetails } from '../../utils/date';
import { ThemeMode } from '../../types/dashboard';

interface ClockSectionProps {
  now: Date;
  use24Hour: boolean;
  showSeconds: boolean;
  theme: ThemeMode;
  align?: 'left' | 'right';
}

export function ClockSection({
  now,
  use24Hour,
  showSeconds,
  theme,
  align = 'right',
}: ClockSectionProps) {
  const { hours, minutes, seconds, period } = formatClockParts(
    now,
    use24Hour,
    showSeconds
  );
  const { weekday, fullDate } = formatDateDetails(now);
  const isUpsideDown = theme === 'upside-down';
  const isRight = align === 'right';

  return (
    <section
      aria-label="Clock and date"
      className={`flex flex-col justify-center ${
        isRight ? 'items-start lg:items-end lg:text-right' : 'items-start text-left'
      }`}
    >
      {/* Live Digital Clock */}
      <div
        className={`flex items-baseline gap-2.5 select-none ${
          isRight ? 'lg:justify-end' : ''
        }`}
      >
        <div
          className="font-mono-tech text-5xl sm:text-6xl leading-none tracking-[0.04em] text-[#F4F0EF]"
          style={{
            textShadow: isUpsideDown ? '0 0 28px var(--accent-glow)' : 'none',
          }}
        >
          <span>{hours}</span>
          <span
            className="mx-0.5 transition-opacity duration-300"
            style={{ color: 'var(--accent-highlight)' }}
          >
            :
          </span>
          <span>{minutes}</span>
        </div>

        {(showSeconds || period) && (
          <div className="flex flex-col justify-end pb-0.5 font-mono-tech leading-tight text-left">
            {showSeconds && (
              <span className="text-lg sm:text-xl text-[#85818A] tracking-wider">
                {seconds}
              </span>
            )}
            {period && (
              <span
                className="text-xs tracking-[0.18em]"
                style={{ color: 'var(--accent-highlight)' }}
              >
                {period}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Weekday & Date */}
      <div
        className={`mt-2.5 flex flex-wrap items-center gap-2 text-xs font-mono-tech tracking-[0.14em] text-[#85818A] ${
          isRight ? 'lg:justify-end' : ''
        }`}
      >
        <span className="text-[#F4F0EF]">{weekday}</span>
        <span aria-hidden="true">/</span>
        <span>{fullDate}</span>
      </div>
    </section>
  );
}
