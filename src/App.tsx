import { useCallback, useEffect, useRef, useState } from 'react';
import { Flame, Moon, Settings } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { BookmarksSection } from './components/bookmarks/BookmarksSection';
import { ChecklistSection } from './components/checklist/ChecklistSection';
import { ClockSection } from './components/clock/ClockSection';
import { ToastBanner } from './components/common/ToastBanner';
import { AtmosphericBackground } from './components/effects/AtmosphericBackground';
import { SearchBar } from './components/search/SearchBar';
import { SettingsModal } from './components/settings/SettingsModal';
import { ProductivityOverview } from './components/statistics/ProductivityOverview';
import { PomodoroSection } from './components/timer/PomodoroSection';
import { useClock } from './hooks/useClock';
import { useDashboardData } from './hooks/useDashboardData';
import { usePomodoro } from './hooks/usePomodoro';
import { getTimeWish } from './utils/date';
import { ACCENT_PRESETS } from './utils/defaults';

export default function App() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const {
    state,
    isLoaded,
    storageError,
    handleDateRollover,
    updateSettings,
    addCategory,
    renameCategory,
    deleteCategory,
    moveCategory,
    autoGroupBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmark,
    moveBookmarkStep,
    addTask,
    toggleTask,
    editTask,
    deleteTask,
    clearCompletedTasks,
    updatePomodoroState,
    recordFocusSessionCompletion,
    exportBackupJson,
    importBackupJson,
    resetAllData,
  } = useDashboardData(notify);

  const now = useClock(handleDateRollover);
  const wish = getTimeWish(now);

  const pomodoro = usePomodoro({
    pomodoro: state.pomodoro,
    soundEnabled: state.settings.soundEnabled,
    onUpdatePomodoro: updatePomodoroState,
    onFocusCompleted: recordFocusSessionCompletion,
    onNotify: notify,
  });

  // Apply accent color CSS variables
  useEffect(() => {
    const preset = ACCENT_PRESETS[state.settings.accentColor] ?? ACCENT_PRESETS.crimson;
    const root = document.documentElement;
    root.style.setProperty('--accent-highlight', preset.highlight);
    root.style.setProperty('--accent-crimson', preset.crimson);
    root.style.setProperty('--accent-dark', preset.dark);
    root.style.setProperty('--accent-glow', preset.glow);
  }, [state.settings.accentColor]);

  // Global "/" shortcut to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTimerToggleMute = useCallback(() => {
    const currentlyEffectiveMuted =
      !state.settings.soundEnabled || state.pomodoro.soundMuted;
    if (currentlyEffectiveMuted) {
      updateSettings({ soundEnabled: true });
      updatePomodoroState((prev) => ({ ...prev, soundMuted: false }), true);
    } else {
      updatePomodoroState((prev) => ({ ...prev, soundMuted: true }), true);
    }
  }, [
    state.pomodoro.soundMuted,
    state.settings.soundEnabled,
    updatePomodoroState,
    updateSettings,
  ]);

  const tasksCompletedToday = state.tasks.filter((t) => t.completed).length;
  const totalTasksToday = state.tasks.length;
  const isUpsideDown = state.settings.theme === 'upside-down';

  return (
    <MotionConfig
      reducedMotion={state.settings.animationIntensity === 'off' ? 'always' : 'user'}
    >
      <div className="relative min-h-screen flex flex-col bg-[#08090D] text-[#F4F0EF]">
        <AtmosphericBackground
          theme={state.settings.theme}
          animationIntensity={state.settings.animationIntensity}
          particlesEnabled={state.settings.particlesEnabled}
          scanlinesEnabled={state.settings.scanlinesEnabled}
          flickerEnabled={state.settings.flickerEnabled}
        />

        <main
          className={`relative z-10 mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6 transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {storageError && (
            <div
              role="alert"
              className="rounded-xl border border-[#64131F] bg-[#64131F]/25 px-4 py-2.5 text-xs text-[#F4F0EF]"
            >
              Storage notice: {storageError}
            </div>
          )}

          {/* Top Hero Row: Search + Time Wish centered, Clock on the right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pt-2">
            {/* Left spacer on desktop so search stays centered */}
            <div className="hidden lg:block lg:col-span-3" aria-hidden="true" />

            {/* Center: Dynamic Time Wish + Google Search */}
            <div className="lg:col-span-6 flex flex-col items-center space-y-3.5">
              <div className="text-center select-none">
                <h1
                  className="font-display text-2xl sm:text-3xl font-semibold tracking-[0.14em] uppercase text-[#F4F0EF]"
                  style={{
                    textShadow: isUpsideDown
                      ? '0 0 24px var(--accent-glow)'
                      : 'none',
                  }}
                >
                  {wish.title}
                </h1>
                <p className="mt-1 font-mono-tech text-[11px] tracking-[0.22em] uppercase text-[#85818A]">
                  {wish.subtitle}
                </p>
              </div>

              <SearchBar ref={searchInputRef} theme={state.settings.theme} />
            </div>

            {/* Right: Live Digital Clock */}
            <div className="lg:col-span-3">
              <ClockSection
                now={now}
                use24Hour={state.settings.clock24Hour}
                showSeconds={state.settings.showSeconds}
                theme={state.settings.theme}
                align="right"
              />
            </div>
          </div>

          {/* Daily Productivity Metrics */}
          <ProductivityOverview
            tasksCompletedToday={tasksCompletedToday}
            totalTasksToday={totalTasksToday}
            focusSessionsCompleted={state.stats.focusSessionsCompleted}
            totalFocusMinutes={state.stats.totalFocusMinutes}
          />

          {/* Main Workspace: Bookmarks on the Left, Checklist & Focus Timer on the Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-10">
            <div className="lg:col-span-5">
              <BookmarksSection
                categories={state.categories}
                bookmarks={state.bookmarks}
                activeCategoryId={state.settings.activeCategoryId}
                onSelectCategory={(id) => updateSettings({ activeCategoryId: id })}
                onAddCategory={addCategory}
                onRenameCategory={renameCategory}
                onDeleteCategory={deleteCategory}
                onMoveCategory={moveCategory}
                onAutoGroup={autoGroupBookmarks}
                onAddBookmark={addBookmark}
                onUpdateBookmark={updateBookmark}
                onDeleteBookmark={deleteBookmark}
                onReorderBookmark={reorderBookmark}
                onMoveBookmarkStep={moveBookmarkStep}
              />
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              <ChecklistSection
                tasks={state.tasks}
                taskHistory={state.taskHistory}
                currentDateKey={state.currentDateKey}
                onAddTask={addTask}
                onToggleTask={toggleTask}
                onEditTask={editTask}
                onDeleteTask={deleteTask}
                onClearCompleted={clearCompletedTasks}
              />

              <PomodoroSection
                mode={pomodoro.mode}
                isRunning={pomodoro.isRunning}
                remainingMs={pomodoro.remainingMs}
                totalDurationMs={pomodoro.totalDurationMs}
                progressRatio={pomodoro.progressRatio}
                durations={pomodoro.durations}
                soundMuted={pomodoro.soundMuted}
                soundEnabled={state.settings.soundEnabled}
                focusSessionsToday={state.stats.focusSessionsCompleted}
                totalFocusMinutesToday={state.stats.totalFocusMinutes}
                theme={state.settings.theme}
                onStart={pomodoro.start}
                onPause={pomodoro.pause}
                onReset={pomodoro.reset}
                onSwitchMode={pomodoro.switchMode}
                onToggleMute={handleTimerToggleMute}
              />
            </div>
          </div>
        </main>

        {/* Quiet Bottom-Right Floating Controls (Theme & Settings) */}
        <div className="fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border border-[#302027]/90 bg-[#101117]/85 p-1 backdrop-blur-md shadow-lg">
          <button
            type="button"
            onClick={() =>
              updateSettings({
                theme: isUpsideDown ? 'normal' : 'upside-down',
              })
            }
            title={
              isUpsideDown
                ? 'Switch to Normal World mode'
                : 'Switch to Upside Down mode'
            }
            aria-label="Toggle visual theme"
            className="rounded-lg p-2 text-[#85818A] hover:bg-[#15151C] hover:text-[#F4F0EF] transition-colors"
          >
            {isUpsideDown ? (
              <Flame className="h-4 w-4" style={{ color: 'var(--accent-highlight)' }} />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            aria-label="Open settings"
            className="rounded-lg p-2 text-[#85818A] hover:bg-[#15151C] hover:text-[#F4F0EF] transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        <SettingsModal
          open={settingsOpen}
          settings={state.settings}
          durations={state.pomodoro.durations}
          onUpdateSettings={updateSettings}
          onUpdateDurations={pomodoro.updateDurations}
          onExportJson={exportBackupJson}
          onImportJson={importBackupJson}
          onResetAll={resetAllData}
          onNotify={notify}
          onClose={() => setSettingsOpen(false)}
        />

        <ToastBanner
          message={toastMessage}
          onDismiss={() => setToastMessage(null)}
        />
      </div>
    </MotionConfig>
  );
}
