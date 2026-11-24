import { useEffect, useState } from 'react';
import {
  Archive,
  Check,
  History,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskHistoryDay, TaskItem } from '../../types/dashboard';

interface ChecklistSectionProps {
  tasks: TaskItem[];
  taskHistory: TaskHistoryDay[];
  currentDateKey: string;
  onAddTask: (title: string) => { ok: boolean; error?: string };
  onToggleTask: (id: string) => void;
  onEditTask: (id: string, title: string) => { ok: boolean; error?: string };
  onDeleteTask: (id: string) => void;
  onClearCompleted: () => void;
}

export function ChecklistSection({
  tasks,
  taskHistory,
  currentDateKey,
  onAddTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onClearCompleted,
}: ChecklistSectionProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!historyOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHistoryOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [historyOpen]);

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const totalCount = tasks.length;
  const completedCount = completedTasks.length;
  const remainingCount = pendingTasks.length;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onAddTask(newTaskTitle);
    if (!res.ok) {
      setInputError(res.error ?? 'Task cannot be empty.');
      return;
    }
    setNewTaskTitle('');
    setInputError(null);
  };

  const handleSaveEdit = (id: string) => {
    const res = onEditTask(id, editDraft);
    if (res.ok) {
      setEditingId(null);
    }
  };

  const renderTaskRow = (task: TaskItem) => {
    const isEditing = editingId === task.id;
    return (
      <motion.li
        key={task.id}
        layout
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.16 }}
        className="group flex items-center justify-between gap-2.5 rounded-lg border border-[#302027] bg-[#101117]/90 px-3 py-2.5 transition-colors hover:border-[#64131F]"
      >
        {isEditing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              type="text"
              maxLength={140}
              autoFocus
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveEdit(task.id);
                } else if (e.key === 'Escape') {
                  setEditingId(null);
                }
              }}
              className="flex-1 rounded border border-[#302027] bg-[#15151C] px-2.5 py-1 text-sm text-[#F4F0EF] focus:outline-none focus:border-[#E63946]"
            />
            <button
              type="button"
              onClick={() => handleSaveEdit(task.id)}
              className="rounded px-2.5 py-1 text-xs font-medium text-[#F4F0EF]"
              style={{ backgroundColor: 'var(--accent-crimson)' }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="rounded px-2 py-1 text-xs text-[#85818A] hover:text-[#F4F0EF]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onToggleTask(task.id)}
              aria-pressed={task.completed}
              aria-label={
                task.completed
                  ? `Mark "${task.title}" incomplete`
                  : `Mark "${task.title}" complete`
              }
              className="flex flex-1 items-start gap-2.5 text-left min-w-0"
            >
              <span
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
                style={{
                  borderColor: task.completed ? 'var(--accent-highlight)' : '#52444A',
                  backgroundColor: task.completed
                    ? 'var(--accent-crimson)'
                    : 'transparent',
                }}
              >
                {task.completed && <Check className="h-3 w-3 text-[#F4F0EF]" />}
              </span>
              <span
                className={`text-sm leading-snug break-words transition-colors ${
                  task.completed ? 'line-through text-[#85818A]' : 'text-[#F4F0EF]'
                }`}
              >
                {task.title}
              </span>
            </button>

            <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingId(task.id);
                  setEditDraft(task.title);
                }}
                title="Edit task"
                aria-label={`Edit "${task.title}"`}
                className="rounded p-1 text-[#85818A] hover:bg-[#15151C] hover:text-[#F4F0EF]"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteTask(task.id)}
                title="Delete task"
                aria-label={`Delete "${task.title}"`}
                className="rounded p-1 text-[#85818A] hover:bg-[#15151C] hover:text-[#E63946]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}
      </motion.li>
    );
  };

  return (
    <section
      aria-label="Daily checklist"
      className="flex flex-col rounded-xl border border-[#302027] bg-[#15151C]/85 p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-wide text-[#F4F0EF]">
            Daily Checklist
          </h2>
          <p className="mt-0.5 font-mono-tech text-xs text-[#85818A]">
            {currentDateKey} · {completedCount} completed · {remainingCount} remaining
          </p>
        </div>

        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          title="View task history"
          className="flex items-center gap-1.5 rounded-lg border border-[#302027] bg-[#101117] px-2.5 py-1.5 text-xs text-[#85818A] hover:border-[#85818A]/50 hover:text-[#F4F0EF] transition-colors whitespace-nowrap shrink-0"
        >
          <History className="h-3.5 w-3.5" />
          <span>History</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between text-[11px] font-mono-tech text-[#85818A]">
          <span>Completion Progress</span>
          <span style={{ color: 'var(--accent-highlight)' }}>{progressPct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#101117]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              backgroundColor: 'var(--accent-highlight)',
            }}
          />
        </div>
      </div>

      {/* Task Input */}
      <form onSubmit={handleAdd} className="mt-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            maxLength={140}
            value={newTaskTitle}
            onChange={(e) => {
              setNewTaskTitle(e.target.value);
              if (inputError) setInputError(null);
            }}
            placeholder="Add a task for today..."
            aria-label="New daily task"
            className="flex-1 rounded-lg border border-[#302027] bg-[#101117] px-3 py-2 text-sm text-[#F4F0EF] placeholder-[#85818A]/70 focus:outline-none focus:border-[#E63946]"
          />
          <button
            type="submit"
            aria-label="Add task"
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium text-[#F4F0EF] transition-opacity hover:opacity-90 whitespace-nowrap shrink-0"
            style={{ backgroundColor: 'var(--accent-crimson)' }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>
        {inputError && <p className="mt-1.5 text-xs text-[#E63946]">{inputError}</p>}
      </form>

      {/* Task Lists */}
      {totalCount === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[#302027] bg-[#101117]/60 px-4 py-8 text-center">
          <p className="text-sm font-medium text-[#F4F0EF]">No tasks scheduled today</p>
          <p className="mt-1 text-xs text-[#85818A]">
            Add your first priority above. Unfinished tasks automatically carry forward tomorrow.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4 max-h-[360px] overflow-y-auto pr-1">
          {pendingTasks.length > 0 && (
            <div>
              <h3 className="mb-2 font-mono-tech text-[11px] tracking-[0.16em] uppercase text-[#85818A]">
                Pending ({pendingTasks.length})
              </h3>
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {pendingTasks.map(renderTaskRow)}
                </AnimatePresence>
              </ul>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-mono-tech text-[11px] tracking-[0.16em] uppercase text-[#85818A]">
                  Completed ({completedTasks.length})
                </h3>
                <button
                  type="button"
                  onClick={onClearCompleted}
                  className="flex items-center gap-1 text-[11px] text-[#85818A] hover:text-[#F4F0EF] transition-colors"
                >
                  <Archive className="h-3 w-3" />
                  <span>Archive completed</span>
                </button>
              </div>
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {completedTasks.map(renderTaskRow)}
                </AnimatePresence>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* History Modal */}
      {historyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-history-title"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-[#302027] bg-[#15151C] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#302027] pb-4">
              <div>
                <h3
                  id="task-history-title"
                  className="text-base font-semibold text-[#F4F0EF]"
                >
                  Daily Checklist History
                </h3>
                <p className="mt-0.5 text-xs text-[#85818A]">
                  Archived task records preserved across daily rollovers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Close history modal"
                className="rounded-lg p-1.5 text-[#85818A] hover:bg-[#101117] hover:text-[#F4F0EF]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {taskHistory.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-[#302027] bg-[#101117]/60 px-4 py-10 text-center">
                <p className="text-sm text-[#F4F0EF]">No archived days yet</p>
                <p className="mt-1 text-xs text-[#85818A]">
                  Completed tasks are automatically archived here when the date changes or when you archive completed items.
                </p>
              </div>
            ) : (
              <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                {taskHistory.map((day) => (
                  <div
                    key={day.dateKey}
                    className="rounded-lg border border-[#302027] bg-[#101117] p-3.5"
                  >
                    <div className="flex items-center justify-between font-mono-tech text-xs">
                      <span className="text-[#F4F0EF]">{day.dateKey}</span>
                      <span style={{ color: 'var(--accent-highlight)' }}>
                        {day.completedCount} / {day.totalCount} completed
                      </span>
                    </div>
                    {day.completedTitles.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-[#302027]/70 pt-2">
                        {day.completedTitles.map((title, idx) => (
                          <li
                            key={`${day.dateKey}-${idx}`}
                            className="flex items-center gap-2 text-xs text-[#85818A]"
                          >
                            <Check className="h-3 w-3 shrink-0 text-[#85818A]" />
                            <span className="truncate">{title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
