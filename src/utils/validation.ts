import {
  AccentPresetId,
  AnimationIntensity,
  Bookmark,
  BookmarkIconName,
  CassetteStripeColor,
  Category,
  DashboardState,
  PomodoroMode,
  TaskHistoryDay,
  TaskItem,
  ThemeMode,
  TvChannel,
} from '../types/dashboard';
import { CASSETTE_STRIPE_ORDER, createDefaultDashboardState } from './defaults';
import { getLocalDateKey } from './date';

export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      if (parsed.hostname !== 'localhost') {
        return null;
      }
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function getFaviconUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      parsed.hostname
    )}&sz=64`;
  } catch {
    return '';
  }
}

export function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const VALID_THEMES: ThemeMode[] = ['normal', 'upside-down'];
const VALID_INTENSITIES: AnimationIntensity[] = ['off', 'subtle', 'medium', 'intense'];
const VALID_ACCENTS: AccentPresetId[] = ['crimson', 'ember', 'amber', 'phosphor', 'violet'];
const VALID_MODES: PomodoroMode[] = ['focus', 'short-break', 'long-break'];
const VALID_CHANNELS: TvChannel[] = ['clock', 'pomodoro'];
const VALID_STRIPES: CassetteStripeColor[] = [
  'red',
  'yellow',
  'blue',
  'green',
  'pink',
  'crimson',
];
const VALID_ICONS: BookmarkIconName[] = [
  'auto',
  'code',
  'terminal',
  'book',
  'compass',
  'layers',
  'flask',
  'play',
  'shield',
  'cpu',
  'globe',
  'sparkles',
];

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function sanitizeDashboardState(raw: unknown): DashboardState {
  const defaults = createDefaultDashboardState();
  if (!raw || typeof raw !== 'object') {
    return defaults;
  }

  const obj = raw as Record<string, unknown>;

  // Categories
  let categories: Category[] = defaults.categories;
  if (Array.isArray(obj.categories)) {
    const parsedCats = obj.categories
      .filter((c): c is Record<string, unknown> => Boolean(c && typeof c === 'object'))
      .map((c, idx) => ({
        id: typeof c.id === 'string' && c.id.trim() ? c.id.trim() : createId('cat'),
        name:
          typeof c.name === 'string' && c.name.trim()
            ? c.name.trim().slice(0, 32)
            : `Category ${idx + 1}`,
        order: typeof c.order === 'number' && Number.isFinite(c.order) ? c.order : idx,
        createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
      }))
      .sort((a, b) => a.order - b.order)
      .map((c, idx) => ({ ...c, order: idx }));

    if (parsedCats.length > 0) {
      categories = parsedCats;
    }
  }

  const categoryIdSet = new Set(categories.map((c) => c.id));
  const fallbackCategoryId = categories[0]?.id ?? 'cat-google';

  // Bookmarks
  let bookmarks: Bookmark[] = defaults.bookmarks;
  if (Array.isArray(obj.bookmarks)) {
    bookmarks = obj.bookmarks
      .filter((b): b is Record<string, unknown> => Boolean(b && typeof b === 'object'))
      .map((b, idx) => {
        const normalized = typeof b.url === 'string' ? normalizeUrl(b.url) : null;
        if (!normalized) return null;
        const rawIcon = b.icon as BookmarkIconName;
        const rawStripe = b.stripeColor as CassetteStripeColor;
        return {
          id: typeof b.id === 'string' && b.id.trim() ? b.id.trim() : createId('bm'),
          title:
            typeof b.title === 'string' && b.title.trim()
              ? b.title.trim().slice(0, 48)
              : extractDomain(normalized),
          url: normalized,
          categoryId:
            typeof b.categoryId === 'string' && categoryIdSet.has(b.categoryId)
              ? b.categoryId
              : fallbackCategoryId,
          icon: VALID_ICONS.includes(rawIcon) ? rawIcon : 'auto',
          stripeColor: VALID_STRIPES.includes(rawStripe)
            ? rawStripe
            : CASSETTE_STRIPE_ORDER[idx % CASSETTE_STRIPE_ORDER.length],
          order: typeof b.order === 'number' && Number.isFinite(b.order) ? b.order : idx,
          createdAt: typeof b.createdAt === 'number' ? b.createdAt : Date.now(),
        } as Bookmark;
      })
      .filter((b): b is Bookmark => b !== null)
      .sort((a, b) => a.order - b.order)
      .map((b, idx) => ({ ...b, order: idx }));
  }

  const today = getLocalDateKey();

  // Tasks
  let tasks: TaskItem[] = defaults.tasks;
  if (Array.isArray(obj.tasks)) {
    tasks = obj.tasks
      .filter((t): t is Record<string, unknown> => Boolean(t && typeof t === 'object'))
      .map((t) => {
        if (typeof t.title !== 'string' || !t.title.trim()) return null;
        return {
          id: typeof t.id === 'string' && t.id.trim() ? t.id.trim() : createId('task'),
          title: t.title.trim().slice(0, 140),
          completed: Boolean(t.completed),
          dateKey:
            typeof t.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.dateKey)
              ? t.dateKey
              : today,
          createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
          completedAt: typeof t.completedAt === 'number' ? t.completedAt : null,
        } as TaskItem;
      })
      .filter((t): t is TaskItem => t !== null);
  }

  // Task History
  let taskHistory: TaskHistoryDay[] = [];
  if (Array.isArray(obj.taskHistory)) {
    taskHistory = obj.taskHistory
      .filter((h): h is Record<string, unknown> => Boolean(h && typeof h === 'object'))
      .filter(
        (h) => typeof h.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(h.dateKey)
      )
      .map((h) => ({
        dateKey: h.dateKey as string,
        completedCount: clampNumber(h.completedCount, 0, 1000, 0),
        totalCount: clampNumber(h.totalCount, 0, 1000, 0),
        completedTitles: Array.isArray(h.completedTitles)
          ? h.completedTitles.filter((s): s is string => typeof s === 'string').slice(0, 50)
          : [],
      }))
      .slice(0, 60);
  }

  // Quick Note
  const quickNote =
    typeof obj.quickNote === 'string'
      ? obj.quickNote.slice(0, 1000)
      : defaults.quickNote;

  // Weather
  const rawWeather =
    obj.weather && typeof obj.weather === 'object'
      ? (obj.weather as Record<string, unknown>)
      : {};
  const weather = {
    tempC: clampNumber(rawWeather.tempC, -60, 65, defaults.weather.tempC),
    condition:
      typeof rawWeather.condition === 'string' && rawWeather.condition.trim()
        ? rawWeather.condition.trim().slice(0, 40)
        : defaults.weather.condition,
    highC: clampNumber(rawWeather.highC, -60, 65, defaults.weather.highC),
    lowC: clampNumber(rawWeather.lowC, -60, 65, defaults.weather.lowC),
    weatherCode: clampNumber(rawWeather.weatherCode, 0, 99, defaults.weather.weatherCode),
    location:
      typeof rawWeather.location === 'string' && rawWeather.location.trim()
        ? rawWeather.location.trim().slice(0, 48)
        : defaults.weather.location,
    updatedAt:
      typeof rawWeather.updatedAt === 'number' && Number.isFinite(rawWeather.updatedAt)
        ? rawWeather.updatedAt
        : 0,
    isCustom: Boolean(rawWeather.isCustom),
  };

  // Settings
  const rawSettings =
    obj.settings && typeof obj.settings === 'object'
      ? (obj.settings as Record<string, unknown>)
      : {};
  const activeCat =
    typeof rawSettings.activeCategoryId === 'string' &&
    (rawSettings.activeCategoryId === 'all' || categoryIdSet.has(rawSettings.activeCategoryId))
      ? rawSettings.activeCategoryId
      : 'all';

  const settings = {
    theme: VALID_THEMES.includes(rawSettings.theme as ThemeMode)
      ? (rawSettings.theme as ThemeMode)
      : defaults.settings.theme,
    animationIntensity: VALID_INTENSITIES.includes(
      rawSettings.animationIntensity as AnimationIntensity
    )
      ? (rawSettings.animationIntensity as AnimationIntensity)
      : defaults.settings.animationIntensity,
    particlesEnabled:
      typeof rawSettings.particlesEnabled === 'boolean'
        ? rawSettings.particlesEnabled
        : defaults.settings.particlesEnabled,
    scanlinesEnabled:
      typeof rawSettings.scanlinesEnabled === 'boolean'
        ? rawSettings.scanlinesEnabled
        : defaults.settings.scanlinesEnabled,
    flickerEnabled:
      typeof rawSettings.flickerEnabled === 'boolean'
        ? rawSettings.flickerEnabled
        : defaults.settings.flickerEnabled,
    soundEnabled:
      typeof rawSettings.soundEnabled === 'boolean'
        ? rawSettings.soundEnabled
        : defaults.settings.soundEnabled,
    clock24Hour:
      typeof rawSettings.clock24Hour === 'boolean'
        ? rawSettings.clock24Hour
        : defaults.settings.clock24Hour,
    showSeconds:
      typeof rawSettings.showSeconds === 'boolean'
        ? rawSettings.showSeconds
        : defaults.settings.showSeconds,
    accentColor: VALID_ACCENTS.includes(rawSettings.accentColor as AccentPresetId)
      ? (rawSettings.accentColor as AccentPresetId)
      : defaults.settings.accentColor,
    activeCategoryId: activeCat,
    tvChannel: VALID_CHANNELS.includes(rawSettings.tvChannel as TvChannel)
      ? (rawSettings.tvChannel as TvChannel)
      : defaults.settings.tvChannel,
  };

  // Pomodoro
  const rawPomodoro =
    obj.pomodoro && typeof obj.pomodoro === 'object'
      ? (obj.pomodoro as Record<string, unknown>)
      : {};
  const rawDurations =
    rawPomodoro.durations && typeof rawPomodoro.durations === 'object'
      ? (rawPomodoro.durations as Record<string, unknown>)
      : {};

  const durations = {
    focus: clampNumber(rawDurations.focus, 1, 120, 25),
    shortBreak: clampNumber(rawDurations.shortBreak, 1, 60, 5),
    longBreak: clampNumber(rawDurations.longBreak, 1, 90, 15),
  };

  const mode = VALID_MODES.includes(rawPomodoro.mode as PomodoroMode)
    ? (rawPomodoro.mode as PomodoroMode)
    : 'focus';

  const modeMinutes =
    mode === 'focus'
      ? durations.focus
      : mode === 'short-break'
        ? durations.shortBreak
        : durations.longBreak;

  const isRunning = Boolean(rawPomodoro.isRunning);
  const endTimeMs =
    typeof rawPomodoro.endTimeMs === 'number' && Number.isFinite(rawPomodoro.endTimeMs)
      ? rawPomodoro.endTimeMs
      : null;

  let remainingMs =
    typeof rawPomodoro.remainingMs === 'number' && Number.isFinite(rawPomodoro.remainingMs)
      ? Math.max(0, Math.min(120 * 60 * 1000, rawPomodoro.remainingMs))
      : modeMinutes * 60 * 1000;

  if (isRunning && endTimeMs !== null) {
    remainingMs = Math.max(0, endTimeMs - Date.now());
  }

  const pomodoro = {
    mode,
    isRunning,
    remainingMs,
    endTimeMs,
    durations,
    soundMuted:
      typeof rawPomodoro.soundMuted === 'boolean'
        ? rawPomodoro.soundMuted
        : !settings.soundEnabled,
  };

  // Stats
  const rawStats =
    obj.stats && typeof obj.stats === 'object'
      ? (obj.stats as Record<string, unknown>)
      : {};
  const stats = {
    dateKey:
      typeof rawStats.dateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawStats.dateKey)
        ? rawStats.dateKey
        : today,
    focusSessionsCompleted: clampNumber(rawStats.focusSessionsCompleted, 0, 500, 0),
    totalFocusMinutes: clampNumber(rawStats.totalFocusMinutes, 0, 10000, 0),
    lifetimeFocusSessions: clampNumber(rawStats.lifetimeFocusSessions, 0, 100000, 0),
    lifetimeFocusMinutes: clampNumber(rawStats.lifetimeFocusMinutes, 0, 1000000, 0),
  };

  // Profile
  const rawProfile =
    obj.profile && typeof obj.profile === 'object'
      ? (obj.profile as Record<string, unknown>)
      : {};
  const profile = {
    callsign:
      typeof rawProfile.callsign === 'string' && rawProfile.callsign.trim()
        ? rawProfile.callsign.trim().slice(0, 28)
        : defaults.profile.callsign,
    stationLabel:
      typeof rawProfile.stationLabel === 'string' && rawProfile.stationLabel.trim()
        ? rawProfile.stationLabel.trim().slice(0, 32)
        : defaults.profile.stationLabel,
    bannerName:
      typeof rawProfile.bannerName === 'string' && rawProfile.bannerName.trim()
        ? rawProfile.bannerName.trim().slice(0, 20)
        : defaults.profile.bannerName,
  };

  const currentDateKey =
    typeof obj.currentDateKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.currentDateKey)
      ? obj.currentDateKey
      : today;

  return {
    version: 2,
    categories,
    bookmarks,
    tasks,
    taskHistory,
    quickNote,
    weather,
    currentDateKey,
    pomodoro,
    stats,
    settings,
    profile,
  };
}
