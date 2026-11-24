import { useCallback, useEffect, useState } from 'react';
import { StorageBackend, storageService } from '../services/storage';
import {
  Bookmark,
  BookmarkIconName,
  CassetteStripeColor,
  Category,
  DashboardSettings,
  DashboardState,
  OperatorProfile,
  PomodoroSessionState,
  TaskHistoryDay,
  TaskItem,
  WeatherData,
} from '../types/dashboard';
import { getLocalDateKey } from '../utils/date';
import { detectPurposeGroupName, PURPOSE_GROUPS } from '../utils/categorizer';
import { CASSETTE_STRIPE_ORDER, createDefaultDashboardState } from '../utils/defaults';
import { createId, normalizeUrl, sanitizeDashboardState } from '../utils/validation';

function applyDailyRollover(state: DashboardState, targetDateKey: string): {
  nextState: DashboardState;
  didRollover: boolean;
} {
  if (state.currentDateKey === targetDateKey && state.stats.dateKey === targetDateKey) {
    return { nextState: state, didRollover: false };
  }

  let updatedHistory: TaskHistoryDay[] = [...state.taskHistory];
  const carriedTasks: TaskItem[] = [];

  if (state.currentDateKey !== targetDateKey) {
    // Group previous tasks by their dateKey to archive completed work without losing history
    const previousTasks = state.tasks.filter((t) => t.dateKey !== targetDateKey);
    const currentDayTasks = state.tasks.filter((t) => t.dateKey === targetDateKey);

    const byDate = new Map<string, TaskItem[]>();
    for (const t of previousTasks) {
      const list = byDate.get(t.dateKey) ?? [];
      list.push(t);
      byDate.set(t.dateKey, list);
    }

    for (const [dateKey, list] of byDate.entries()) {
      const completed = list.filter((t) => t.completed);
      const existingIdx = updatedHistory.findIndex((h) => h.dateKey === dateKey);
      const entry: TaskHistoryDay = {
        dateKey,
        completedCount: completed.length,
        totalCount: list.length,
        completedTitles: completed.map((t) => t.title),
      };

      if (existingIdx >= 0) {
        updatedHistory[existingIdx] = entry;
      } else if (list.length > 0) {
        updatedHistory.unshift(entry);
      }

      // Preserve unfinished tasks into today's checklist
      for (const t of list) {
        if (!t.completed) {
          carriedTasks.push({
            ...t,
            dateKey: targetDateKey,
          });
        }
      }
    }

    // Sort history descending by dateKey and keep last 60 days
    updatedHistory = updatedHistory
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
      .slice(0, 60);

    const mergedTasks = [...carriedTasks, ...currentDayTasks];
    const nextStats =
      state.stats.dateKey === targetDateKey
        ? state.stats
        : {
            ...state.stats,
            dateKey: targetDateKey,
            focusSessionsCompleted: 0,
            totalFocusMinutes: 0,
          };

    return {
      nextState: {
        ...state,
        currentDateKey: targetDateKey,
        tasks: mergedTasks,
        taskHistory: updatedHistory,
        stats: nextStats,
      },
      didRollover: previousTasks.length > 0 || state.stats.dateKey !== targetDateKey,
    };
  }

  return {
    nextState: {
      ...state,
      stats: {
        ...state.stats,
        dateKey: targetDateKey,
        focusSessionsCompleted: 0,
        totalFocusMinutes: 0,
      },
    },
    didRollover: true,
  };
}

export function useDashboardData(onNotice?: (message: string) => void) {
  const [state, setState] = useState<DashboardState>(() => createDefaultDashboardState());
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageBackend, setStorageBackend] = useState<StorageBackend>('localStorage');
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void storageService.load().then((result) => {
      if (!mounted) return;
      const today = getLocalDateKey();
      const { nextState, didRollover } = applyDailyRollover(result.state, today);
      setState(nextState);
      setStorageBackend(result.backend);
      setStorageError(result.error);
      setIsLoaded(true);
      if (didRollover) {
        void storageService.saveImmediate(nextState);
      }
    });

    const unsubscribe = storageService.subscribeExternalChanges((externalState) => {
      if (!mounted) return;
      const today = getLocalDateKey();
      const { nextState } = applyDailyRollover(externalState, today);
      setState(nextState);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const updateState = useCallback(
    (updater: (prev: DashboardState) => DashboardState, immediate = false) => {
      setState((prev) => {
        const next = updater(prev);
        if (next === prev) return prev;
        if (immediate) {
          void storageService.saveImmediate(next);
        } else {
          storageService.scheduleSave(next);
        }
        return next;
      });
    },
    []
  );

  const handleDateRollover = useCallback(
    (newDateKey: string) => {
      updateState((prev) => {
        const { nextState, didRollover } = applyDailyRollover(prev, newDateKey);
        if (didRollover) {
          onNotice?.('New day started — unfinished tasks carried forward.');
        }
        return nextState;
      }, true);
    },
    [onNotice, updateState]
  );

  // Settings & Profile
  const updateSettings = useCallback(
    (patch: Partial<DashboardSettings>) => {
      updateState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...patch },
      }));
    },
    [updateState]
  );

  const updateProfile = useCallback(
    (patch: Partial<OperatorProfile>) => {
      updateState((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...patch },
      }));
    },
    [updateState]
  );

  const updateQuickNote = useCallback(
    (note: string) => {
      updateState((prev) => ({
        ...prev,
        quickNote: note.slice(0, 1000),
      }));
    },
    [updateState]
  );

  const updateWeather = useCallback(
    (patch: Partial<WeatherData>) => {
      updateState((prev) => ({
        ...prev,
        weather: { ...prev.weather, ...patch },
      }));
    },
    [updateState]
  );

  // Categories
  const addCategory = useCallback(
    (name: string): { ok: boolean; error?: string; category?: Category } => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false, error: 'Category name cannot be empty.' };
      if (trimmed.length > 32) {
        return { ok: false, error: 'Category name must be 32 characters or fewer.' };
      }

      let created: Category | undefined;
      let duplicate = false;

      updateState((prev) => {
        if (prev.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
          duplicate = true;
          return prev;
        }
        created = {
          id: createId('cat'),
          name: trimmed,
          order: prev.categories.length,
          createdAt: Date.now(),
        };
        return {
          ...prev,
          categories: [...prev.categories, created],
          settings: {
            ...prev.settings,
            activeCategoryId: created.id,
          },
        };
      });

      if (duplicate) {
        return { ok: false, error: 'A category with that name already exists.' };
      }
      return { ok: true, category: created };
    },
    [updateState]
  );

  const renameCategory = useCallback(
    (id: string, name: string): { ok: boolean; error?: string } => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false, error: 'Category name cannot be empty.' };

      let duplicate = false;
      updateState((prev) => {
        if (
          prev.categories.some(
            (c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase()
          )
        ) {
          duplicate = true;
          return prev;
        }
        return {
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === id ? { ...c, name: trimmed.slice(0, 32) } : c
          ),
        };
      });

      if (duplicate) {
        return { ok: false, error: 'Another category already uses that name.' };
      }
      return { ok: true };
    },
    [updateState]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      updateState((prev) => {
        if (prev.categories.length <= 1) return prev;
        const remaining = prev.categories
          .filter((c) => c.id !== id)
          .map((c, idx) => ({ ...c, order: idx }));
        const fallbackId = remaining[0].id;
        return {
          ...prev,
          categories: remaining,
          bookmarks: prev.bookmarks.map((b) =>
            b.categoryId === id ? { ...b, categoryId: fallbackId } : b
          ),
          settings: {
            ...prev.settings,
            activeCategoryId:
              prev.settings.activeCategoryId === id
                ? 'all'
                : prev.settings.activeCategoryId,
          },
        };
      });
    },
    [updateState]
  );

  const moveCategory = useCallback(
    (id: string, direction: -1 | 1) => {
      updateState((prev) => {
        const sorted = [...prev.categories].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex((c) => c.id === id);
        if (index < 0) return prev;
        const target = index + direction;
        if (target < 0 || target >= sorted.length) return prev;
        const [item] = sorted.splice(index, 1);
        sorted.splice(target, 0, item);
        return {
          ...prev,
          categories: sorted.map((c, idx) => ({ ...c, order: idx })),
        };
      });
    },
    [updateState]
  );

  const autoGroupBookmarks = useCallback(() => {
    let groupsCreated = 0;
    let bookmarksMoved = 0;

    updateState((prev) => {
      const nextCategories = [...prev.categories].sort((a, b) => a.order - b.order);
      const byLowerName = new Map<string, Category>();
      for (const c of nextCategories) {
        byLowerName.set(c.name.trim().toLowerCase(), c);
      }

      // Ensure core purpose groups exist
      for (const groupName of PURPOSE_GROUPS) {
        if (!byLowerName.has(groupName.toLowerCase())) {
          const created: Category = {
            id: `cat-${groupName.toLowerCase()}-${createId('g').slice(-4)}`,
            name: groupName,
            order: nextCategories.length,
            createdAt: Date.now(),
          };
          nextCategories.push(created);
          byLowerName.set(groupName.toLowerCase(), created);
          groupsCreated += 1;
        }
      }

      const nextBookmarks = prev.bookmarks.map((bm) => {
        const detectedGroup = detectPurposeGroupName(bm.url, bm.title);
        const targetCat = byLowerName.get(detectedGroup.toLowerCase());
        if (targetCat && bm.categoryId !== targetCat.id) {
          bookmarksMoved += 1;
          return { ...bm, categoryId: targetCat.id };
        }
        return bm;
      });

      if (groupsCreated === 0 && bookmarksMoved === 0) {
        return prev;
      }

      return {
        ...prev,
        categories: nextCategories.map((c, idx) => ({ ...c, order: idx })),
        bookmarks: nextBookmarks,
        settings: {
          ...prev.settings,
          activeCategoryId: 'all',
        },
      };
    }, true);

    if (groupsCreated > 0 && bookmarksMoved > 0) {
      onNotice?.(
        `Created ${groupsCreated} purpose group(s) and organized ${bookmarksMoved} bookmark(s).`
      );
    } else if (groupsCreated > 0) {
      onNotice?.(`Created ${groupsCreated} purpose group(s).`);
    } else if (bookmarksMoved > 0) {
      onNotice?.(`Organized ${bookmarksMoved} bookmark(s) into purpose groups.`);
    } else {
      onNotice?.('All bookmarks are already organized by purpose.');
    }

    return { groupsCreated, bookmarksMoved };
  }, [onNotice, updateState]);

  // Bookmarks
  const addBookmark = useCallback(
    (input: {
      title: string;
      url: string;
      categoryId: string;
      icon: BookmarkIconName;
      stripeColor?: CassetteStripeColor;
    }): { ok: boolean; error?: string } => {
      const normalized = normalizeUrl(input.url);
      if (!normalized) {
        return { ok: false, error: 'Please enter a valid website URL (e.g. https://github.com).' };
      }
      const title = input.title.trim();
      if (!title) {
        return { ok: false, error: 'Bookmark title is required.' };
      }

      updateState((prev) => {
        const validCat = prev.categories.some((c) => c.id === input.categoryId)
          ? input.categoryId
          : prev.categories[0]?.id ?? 'cat-google';

        const nextBookmark: Bookmark = {
          id: createId('bm'),
          title: title.slice(0, 48),
          url: normalized,
          categoryId: validCat,
          icon: input.icon,
          stripeColor:
            input.stripeColor ??
            CASSETTE_STRIPE_ORDER[prev.bookmarks.length % CASSETTE_STRIPE_ORDER.length],
          order: prev.bookmarks.length,
          createdAt: Date.now(),
        };

        return {
          ...prev,
          bookmarks: [...prev.bookmarks, nextBookmark],
        };
      });

      return { ok: true };
    },
    [updateState]
  );

  const updateBookmark = useCallback(
    (
      id: string,
      input: {
        title: string;
        url: string;
        categoryId: string;
        icon: BookmarkIconName;
        stripeColor?: CassetteStripeColor;
      }
    ): { ok: boolean; error?: string } => {
      const normalized = normalizeUrl(input.url);
      if (!normalized) {
        return { ok: false, error: 'Please enter a valid website URL.' };
      }
      const title = input.title.trim();
      if (!title) {
        return { ok: false, error: 'Bookmark title is required.' };
      }

      updateState((prev) => ({
        ...prev,
        bookmarks: prev.bookmarks.map((b) =>
          b.id === id
            ? {
                ...b,
                title: title.slice(0, 48),
                url: normalized,
                categoryId: input.categoryId,
                icon: input.icon,
                stripeColor: input.stripeColor ?? b.stripeColor,
              }
            : b
        ),
      }));
      return { ok: true };
    },
    [updateState]
  );

  const deleteBookmark = useCallback(
    (id: string) => {
      updateState((prev) => ({
        ...prev,
        bookmarks: prev.bookmarks
          .filter((b) => b.id !== id)
          .map((b, idx) => ({ ...b, order: idx })),
      }));
    },
    [updateState]
  );

  const reorderBookmark = useCallback(
    (sourceId: string, targetId: string) => {
      if (sourceId === targetId) return;
      updateState((prev) => {
        const sorted = [...prev.bookmarks].sort((a, b) => a.order - b.order);
        const fromIdx = sorted.findIndex((b) => b.id === sourceId);
        const toIdx = sorted.findIndex((b) => b.id === targetId);
        if (fromIdx < 0 || toIdx < 0) return prev;
        const [moved] = sorted.splice(fromIdx, 1);
        sorted.splice(toIdx, 0, moved);
        return {
          ...prev,
          bookmarks: sorted.map((b, idx) => ({ ...b, order: idx })),
        };
      });
    },
    [updateState]
  );

  const moveBookmarkStep = useCallback(
    (id: string, direction: -1 | 1, visibleIds: string[]) => {
      const idx = visibleIds.indexOf(id);
      if (idx < 0) return;
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= visibleIds.length) return;
      reorderBookmark(id, visibleIds[targetIdx]);
    },
    [reorderBookmark]
  );

  // Tasks
  const addTask = useCallback(
    (title: string): { ok: boolean; error?: string } => {
      const trimmed = title.trim();
      if (!trimmed) return { ok: false, error: 'Task description cannot be empty.' };
      const today = getLocalDateKey();
      updateState((prev) => ({
        ...prev,
        tasks: [
          {
            id: createId('task'),
            title: trimmed.slice(0, 140),
            completed: false,
            dateKey: today,
            createdAt: Date.now(),
            completedAt: null,
          },
          ...prev.tasks,
        ],
      }));
      return { ok: true };
    },
    [updateState]
  );

  const toggleTask = useCallback(
    (id: string) => {
      updateState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                completed: !t.completed,
                completedAt: !t.completed ? Date.now() : null,
              }
            : t
        ),
      }));
    },
    [updateState]
  );

  const editTask = useCallback(
    (id: string, title: string): { ok: boolean; error?: string } => {
      const trimmed = title.trim();
      if (!trimmed) return { ok: false, error: 'Task description cannot be empty.' };
      updateState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id ? { ...t, title: trimmed.slice(0, 140) } : t
        ),
      }));
      return { ok: true };
    },
    [updateState]
  );

  const deleteTask = useCallback(
    (id: string) => {
      updateState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      }));
    },
    [updateState]
  );

  const clearCompletedTasks = useCallback(() => {
    updateState((prev) => {
      const completed = prev.tasks.filter((t) => t.completed);
      if (completed.length === 0) return prev;
      const today = getLocalDateKey();
      const existingIdx = prev.taskHistory.findIndex((h) => h.dateKey === today);
      const nextHistory = [...prev.taskHistory];
      const existingTitles = existingIdx >= 0 ? nextHistory[existingIdx].completedTitles : [];
      const mergedTitles = Array.from(
        new Set([...existingTitles, ...completed.map((t) => t.title)])
      ).slice(0, 50);

      if (existingIdx >= 0) {
        nextHistory[existingIdx] = {
          ...nextHistory[existingIdx],
          completedCount: mergedTitles.length,
          totalCount: Math.max(nextHistory[existingIdx].totalCount, mergedTitles.length),
          completedTitles: mergedTitles,
        };
      } else {
        nextHistory.unshift({
          dateKey: today,
          completedCount: completed.length,
          totalCount: prev.tasks.length,
          completedTitles: completed.map((t) => t.title),
        });
      }

      return {
        ...prev,
        tasks: prev.tasks.filter((t) => !t.completed),
        taskHistory: nextHistory.slice(0, 60),
      };
    });
  }, [updateState]);

  // Pomodoro state persistence
  const updatePomodoroState = useCallback(
    (updater: (prev: PomodoroSessionState) => PomodoroSessionState, immediate = false) => {
      updateState(
        (prev) => ({
          ...prev,
          pomodoro: updater(prev.pomodoro),
        }),
        immediate
      );
    },
    [updateState]
  );

  const recordFocusSessionCompletion = useCallback(
    (minutesCompleted: number) => {
      const today = getLocalDateKey();
      updateState((prev) => {
        const isSameDay = prev.stats.dateKey === today;
        return {
          ...prev,
          stats: {
            dateKey: today,
            focusSessionsCompleted: (isSameDay ? prev.stats.focusSessionsCompleted : 0) + 1,
            totalFocusMinutes:
              (isSameDay ? prev.stats.totalFocusMinutes : 0) + minutesCompleted,
            lifetimeFocusSessions: prev.stats.lifetimeFocusSessions + 1,
            lifetimeFocusMinutes: prev.stats.lifetimeFocusMinutes + minutesCompleted,
          },
        };
      }, true);
    },
    [updateState]
  );

  // Import / Export / Reset
  const exportBackupJson = useCallback((): string => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importBackupJson = useCallback(
    (jsonText: string): { ok: boolean; error?: string } => {
      try {
        const parsed = JSON.parse(jsonText) as unknown;
        const sanitized = sanitizeDashboardState(parsed);
        const { nextState } = applyDailyRollover(sanitized, getLocalDateKey());
        setState(nextState);
        void storageService.saveImmediate(nextState);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Invalid backup JSON file.' };
      }
    },
    []
  );

  const resetAllData = useCallback(async () => {
    const fresh = await storageService.resetToDefaults();
    setState(fresh);
    onNotice?.('Dashboard restored to factory defaults.');
  }, [onNotice]);

  return {
    state,
    isLoaded,
    storageBackend,
    storageError,
    handleDateRollover,
    updateSettings,
    updateProfile,
    updateQuickNote,
    updateWeather,
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
  };
}
