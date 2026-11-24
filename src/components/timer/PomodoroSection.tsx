import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { PomodoroDurations, PomodoroMode, ThemeMode } from '../../types/dashboard';
import { formatMinutesCompact, formatTimerCountdown } from '../../utils/date';

interface PomodoroSectionProps {
  mode: PomodoroMode;
  isRunning: boolean;
  remainingMs: number;
  totalDurationMs: number;
  progressRatio: number;
  durations: PomodoroDurations;
  soundMuted: boolean;
  soundEnabled: boolean;
  focusSessionsToday: number;
  totalFocusMinutesToday: number;
  theme: ThemeMode;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSwitchMode: (mode: PomodoroMode) => void;
  onToggleMute: () => void;
}

const MODE_LABELS: { id: PomodoroMode; label: string }[] = [
  { id: 'focus', label: 'Focus' },
  { id: 'short-break', label: 'Short Break' },
  { id: 'long-break', label: 'Long Break' },
];

export function PomodoroSection({
  mode,
  isRunning,
  remainingMs,
  totalDurationMs,
  progressRatio,
  durations,
  soundMuted,
  soundEnabled,
  focusSessionsToday,
  totalFocusMinutesToday,
  theme,
  onStart,
  onPause,
  onReset,
  onSwitchMode,
  onToggleMute,
}: PomodoroSectionProps) {
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);
  const isUpsideDown = theme === 'upside-down';
  const hasStarted = remainingMs < totalDurationMs;
  const effectiveMuted = !soundEnabled || soundMuted;

  return (
    <section
      aria-label="Pomodoro focus timer"
      className="flex flex-col rounded-xl border border-[#302027] bg-[#15151C]/85 p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-wide text-[#F4F0EF]">
            Focus Timer
          </h2>
          <p className="mt-0.5 text-xs text-[#85818A]">
            {durations.focus}m focus · {durations.shortBreak}m short ·{' '}
            {durations.longBreak}m long
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          title={effectiveMuted ? 'Unmute timer chime' : 'Mute timer chime'}
          aria-label={effectiveMuted ? 'Unmute timer chime' : 'Mute timer chime'}
          className="flex items-center gap-1.5 rounded-lg border border-[#302027] bg-[#101117] px-2.5 py-1.5 text-xs text-[#85818A] hover:border-[#85818A]/50 hover:text-[#F4F0EF] transition-colors"
        >
          {effectiveMuted ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : (
            <Volume2
              className="h-3.5 w-3.5"
              style={{ color: 'var(--accent-highlight)' }}
            />
          )}
          <span>{effectiveMuted ? 'Muted' : 'Sound On'}</span>
        </button>
      </div>

      {/* Mode Switcher */}
      <div
        role="tablist"
        aria-label="Timer mode"
        className="mt-4 grid grid-cols-3 gap-1.5 rounded-lg border border-[#302027] bg-[#101117] p-1"
      >
        {MODE_LABELS.map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSwitchMode(item.id)}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap"
              style={{
                backgroundColor: active ? 'rgba(100, 19, 31, 0.5)' : 'transparent',
                color: active ? '#F4F0EF' : '#85818A',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Circular SVG Progress Ring */}
      <div className="my-5 flex flex-col items-center justify-center">
        <div className="relative flex h-44 w-44 items-center justify-center">
          <svg
            viewBox="0 0 180 180"
            className="h-full w-full -rotate-90"
            aria-hidden="true"
          >
            {/* Track Circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="#241A20"
              strokeWidth="7"
            />
            {/* Progress Arc */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="var(--accent-highlight)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset 250ms linear',
                filter:
                  isUpsideDown && isRunning
                    ? 'drop-shadow(0 0 8px var(--accent-glow))'
                    : 'none',
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono-tech text-3xl sm:text-[2.25rem] tracking-wider text-[#F4F0EF]">
              {formatTimerCountdown(remainingMs)}
            </span>
            <span className="mt-1 font-mono-tech text-[11px] tracking-[0.18em] uppercase text-[#85818A]">
              {isRunning
                ? 'Active'
                : hasStarted
                  ? 'Paused'
                  : mode === 'focus'
                    ? 'Ready'
                    : 'Break'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2.5">
        {isRunning ? (
          <button
            type="button"
            onClick={onPause}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#302027] bg-[#101117] px-4 py-2.5 text-xs font-medium text-[#F4F0EF] hover:border-[#85818A]/50 transition-colors"
          >
            <Pause className="h-4 w-4" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium text-[#F4F0EF] transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-crimson)' }}
          >
            <Play className="h-4 w-4" />
            <span>{hasStarted ? 'Resume' : 'Start'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          disabled={!isRunning && !hasStarted}
          title="Reset timer"
          aria-label="Reset timer"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-[#302027] bg-[#101117] px-3.5 py-2.5 text-xs font-medium text-[#85818A] hover:border-[#85818A]/50 hover:text-[#F4F0EF] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Session Footer Metrics */}
      <div className="mt-5 flex items-center justify-between border-t border-[#302027]/80 pt-3.5 text-xs font-mono-tech text-[#85818A]">
        <span>
          Sessions: <strong className="text-[#F4F0EF]">{focusSessionsToday}</strong>
        </span>
        <span>
          Focus Time:{' '}
          <strong className="text-[#F4F0EF]">
            {formatMinutesCompact(totalFocusMinutesToday)}
          </strong>
        </span>
      </div>
    </section>
  );
}
