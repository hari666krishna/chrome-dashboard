import { useCallback, useEffect, useRef, useState } from 'react';
import { PomodoroDurations, PomodoroMode, PomodoroSessionState } from '../types/dashboard';
import { playTimerCompletionTone } from '../utils/sound';

interface UsePomodoroOptions {
  pomodoro: PomodoroSessionState;
  soundEnabled: boolean;
  onUpdatePomodoro: (
    updater: (prev: PomodoroSessionState) => PomodoroSessionState,
    immediate?: boolean
  ) => void;
  onFocusCompleted: (minutesCompleted: number) => void;
  onNotify: (message: string) => void;
}

export function getDurationMsForMode(
  mode: PomodoroMode,
  durations: PomodoroDurations
): number {
  if (mode === 'focus') return durations.focus * 60 * 1000;
  if (mode === 'short-break') return durations.shortBreak * 60 * 1000;
  return durations.longBreak * 60 * 1000;
}

export function usePomodoro({
  pomodoro,
  soundEnabled,
  onUpdatePomodoro,
  onFocusCompleted,
  onNotify,
}: UsePomodoroOptions) {
  const [displayRemainingMs, setDisplayRemainingMs] = useState<number>(() => {
    if (pomodoro.isRunning && pomodoro.endTimeMs !== null) {
      return Math.max(0, pomodoro.endTimeMs - Date.now());
    }
    return pomodoro.remainingMs;
  });

  // Prevent duplicate completion firing for the same endTimeMs
  const completedStampRef = useRef<number | null>(null);

  const handleSessionFinished = useCallback(
    (finishedMode: PomodoroMode, durations: PomodoroDurations, endStamp: number | null) => {
      if (endStamp !== null && completedStampRef.current === endStamp) {
        return;
      }
      completedStampRef.current = endStamp;

      if (finishedMode === 'focus') {
        onFocusCompleted(durations.focus);
        onNotify(`Focus session complete (${durations.focus}m). Time for a break.`);
      } else {
        onNotify(
          finishedMode === 'short-break'
            ? 'Short break complete. Ready to focus.'
            : 'Long break complete. Ready for next focus cycle.'
        );
      }

      if (soundEnabled && !pomodoro.soundMuted) {
        playTimerCompletionTone(finishedMode !== 'focus');
      }

      const freshMs = getDurationMsForMode(finishedMode, durations);
      setDisplayRemainingMs(freshMs);
      onUpdatePomodoro(
        (prev) => ({
          ...prev,
          isRunning: false,
          endTimeMs: null,
          remainingMs: freshMs,
        }),
        true
      );
    },
    [onFocusCompleted, onNotify, onUpdatePomodoro, pomodoro.soundMuted, soundEnabled]
  );

  // Sync displayRemainingMs when persisted state changes (e.g., initial load or external tab update)
  useEffect(() => {
    if (pomodoro.isRunning && pomodoro.endTimeMs !== null) {
      const remaining = Math.max(0, pomodoro.endTimeMs - Date.now());
      setDisplayRemainingMs(remaining);
      if (remaining === 0) {
        handleSessionFinished(pomodoro.mode, pomodoro.durations, pomodoro.endTimeMs);
      }
    } else {
      setDisplayRemainingMs(pomodoro.remainingMs);
    }
  }, [
    handleSessionFinished,
    pomodoro.durations,
    pomodoro.endTimeMs,
    pomodoro.isRunning,
    pomodoro.mode,
    pomodoro.remainingMs,
  ]);

  // Timestamp-accurate ticker + visibilitychange recovery
  useEffect(() => {
    if (!pomodoro.isRunning || pomodoro.endTimeMs === null) {
      return;
    }

    const endMs = pomodoro.endTimeMs;

    const syncNow = () => {
      const remaining = Math.max(0, endMs - Date.now());
      setDisplayRemainingMs(remaining);
      if (remaining <= 0) {
        handleSessionFinished(pomodoro.mode, pomodoro.durations, endMs);
      }
    };

    syncNow();
    const intervalId = window.setInterval(syncNow, 250);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncNow();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [
    handleSessionFinished,
    pomodoro.durations,
    pomodoro.endTimeMs,
    pomodoro.isRunning,
    pomodoro.mode,
  ]);

  const start = useCallback(() => {
    completedStampRef.current = null;
    const baseMs =
      displayRemainingMs > 0
        ? displayRemainingMs
        : getDurationMsForMode(pomodoro.mode, pomodoro.durations);
    const endTimeMs = Date.now() + baseMs;

    onUpdatePomodoro(
      (prev) => ({
        ...prev,
        isRunning: true,
        remainingMs: baseMs,
        endTimeMs,
      }),
      true
    );
  }, [displayRemainingMs, onUpdatePomodoro, pomodoro.durations, pomodoro.mode]);

  const pause = useCallback(() => {
    const remaining =
      pomodoro.isRunning && pomodoro.endTimeMs !== null
        ? Math.max(0, pomodoro.endTimeMs - Date.now())
        : displayRemainingMs;
    setDisplayRemainingMs(remaining);
    onUpdatePomodoro(
      (prev) => ({
        ...prev,
        isRunning: false,
        endTimeMs: null,
        remainingMs: remaining,
      }),
      true
    );
  }, [displayRemainingMs, onUpdatePomodoro, pomodoro.endTimeMs, pomodoro.isRunning]);

  const reset = useCallback(() => {
    completedStampRef.current = null;
    const fullMs = getDurationMsForMode(pomodoro.mode, pomodoro.durations);
    setDisplayRemainingMs(fullMs);
    onUpdatePomodoro(
      (prev) => ({
        ...prev,
        isRunning: false,
        endTimeMs: null,
        remainingMs: fullMs,
      }),
      true
    );
  }, [onUpdatePomodoro, pomodoro.durations, pomodoro.mode]);

  const switchMode = useCallback(
    (nextMode: PomodoroMode) => {
      completedStampRef.current = null;
      const fullMs = getDurationMsForMode(nextMode, pomodoro.durations);
      setDisplayRemainingMs(fullMs);
      onUpdatePomodoro(
        (prev) => ({
          ...prev,
          mode: nextMode,
          isRunning: false,
          endTimeMs: null,
          remainingMs: fullMs,
        }),
        true
      );
    },
    [onUpdatePomodoro, pomodoro.durations]
  );

  const toggleMute = useCallback(() => {
    onUpdatePomodoro(
      (prev) => ({
        ...prev,
        soundMuted: !prev.soundMuted,
      }),
      true
    );
  }, [onUpdatePomodoro]);

  const updateDurations = useCallback(
    (nextDurations: PomodoroDurations) => {
      onUpdatePomodoro((prev) => {
        const nextFull = getDurationMsForMode(prev.mode, nextDurations);
        if (!prev.isRunning) {
          setDisplayRemainingMs(nextFull);
        }
        return {
          ...prev,
          durations: nextDurations,
          remainingMs: prev.isRunning ? prev.remainingMs : nextFull,
        };
      }, true);
    },
    [onUpdatePomodoro]
  );

  const totalDurationMs = getDurationMsForMode(pomodoro.mode, pomodoro.durations);
  const progressRatio =
    totalDurationMs > 0
      ? Math.min(1, Math.max(0, (totalDurationMs - displayRemainingMs) / totalDurationMs))
      : 0;

  return {
    mode: pomodoro.mode,
    isRunning: pomodoro.isRunning,
    remainingMs: displayRemainingMs,
    totalDurationMs,
    progressRatio,
    durations: pomodoro.durations,
    soundMuted: pomodoro.soundMuted,
    start,
    pause,
    reset,
    switchMode,
    toggleMute,
    updateDurations,
  };
}
