import { formatMinutesCompact } from '../../utils/date';

interface ProductivityOverviewProps {
  tasksCompletedToday: number;
  totalTasksToday: number;
  focusSessionsCompleted: number;
  totalFocusMinutes: number;
}

export function ProductivityOverview({
  tasksCompletedToday,
  totalTasksToday,
  focusSessionsCompleted,
  totalFocusMinutes,
}: ProductivityOverviewProps) {
  const completionPct =
    totalTasksToday > 0
      ? Math.round((tasksCompletedToday / totalTasksToday) * 100)
      : 0;

  return (
    <section
      aria-label="Daily productivity overview"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      {/* Metric 1: Tasks Completed Today */}
      <div className="rounded-xl border border-[#302027] bg-[#15151C]/85 px-4 py-3.5">
        <p className="text-xs text-[#85818A] tracking-wide">Tasks Completed</p>
        <div className="mt-1.5 flex items-baseline gap-1.5 font-mono-tech">
          <span className="text-2xl text-[#F4F0EF]">{tasksCompletedToday}</span>
          <span className="text-sm text-[#85818A]">/ {totalTasksToday}</span>
        </div>
      </div>

      {/* Metric 2: Daily Completion Percentage */}
      <div className="rounded-xl border border-[#302027] bg-[#15151C]/85 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-[#85818A] tracking-wide">Daily Completion</p>
          <span
            className="font-mono-tech text-xs"
            style={{ color: 'var(--accent-highlight)' }}
          >
            {completionPct}%
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#101117]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${completionPct}%`,
              backgroundColor: 'var(--accent-highlight)',
            }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-[#85818A] font-mono-tech">
          {totalTasksToday === 0
            ? 'No tasks logged'
            : `${totalTasksToday - tasksCompletedToday} remaining`}
        </p>
      </div>

      {/* Metric 3: Focus Sessions */}
      <div className="rounded-xl border border-[#302027] bg-[#15151C]/85 px-4 py-3.5">
        <p className="text-xs text-[#85818A] tracking-wide">Focus Sessions</p>
        <div className="mt-1.5 flex items-baseline gap-2 font-mono-tech">
          <span className="text-2xl text-[#F4F0EF]">{focusSessionsCompleted}</span>
          <span className="text-xs text-[#85818A]">completed today</span>
        </div>
      </div>

      {/* Metric 4: Total Focus Time */}
      <div className="rounded-xl border border-[#302027] bg-[#15151C]/85 px-4 py-3.5">
        <p className="text-xs text-[#85818A] tracking-wide">Total Focus Time</p>
        <div className="mt-1.5 flex items-baseline gap-2 font-mono-tech">
          <span className="text-2xl text-[#F4F0EF]">
            {formatMinutesCompact(totalFocusMinutes)}
          </span>
          <span className="text-xs text-[#85818A]">logged today</span>
        </div>
      </div>
    </section>
  );
}
