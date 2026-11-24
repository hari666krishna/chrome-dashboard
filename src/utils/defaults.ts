import {
  AccentPresetId,
  Bookmark,
  CassetteStripeColor,
  Category,
  DashboardState,
  TaskItem,
} from '../types/dashboard';
import { getLocalDateKey } from './date';

export interface AccentPreset {
  id: AccentPresetId;
  label: string;
  highlight: string;
  crimson: string;
  dark: string;
  glow: string;
}

export const ACCENT_PRESETS: Record<AccentPresetId, AccentPreset> = {
  crimson: {
    id: 'crimson',
    label: 'Hawkins Crimson',
    highlight: '#E63946',
    crimson: '#A51D2D',
    dark: '#64131F',
    glow: 'rgba(230, 57, 70, 0.36)',
  },
  ember: {
    id: 'ember',
    label: 'Rift Ember',
    highlight: '#F43F5E',
    crimson: '#BE123C',
    dark: '#701029',
    glow: 'rgba(244, 63, 94, 0.35)',
  },
  amber: {
    id: 'amber',
    label: 'Terminal Amber',
    highlight: '#F59E0B',
    crimson: '#B45309',
    dark: '#5C2B09',
    glow: 'rgba(245, 158, 11, 0.32)',
  },
  phosphor: {
    id: 'phosphor',
    label: 'Lab Phosphor',
    highlight: '#38BDF8',
    crimson: '#0284C7',
    dark: '#0C4A6E',
    glow: 'rgba(56, 189, 248, 0.30)',
  },
  violet: {
    id: 'violet',
    label: 'Shadow Violet',
    highlight: '#C084FC',
    crimson: '#7E22CE',
    dark: '#4C1D95',
    glow: 'rgba(192, 132, 252, 0.32)',
  },
};

export const CASSETTE_STRIPE_HEX: Record<CassetteStripeColor, string> = {
  red: '#F23D52',
  yellow: '#F5C431',
  blue: '#3AA7E8',
  green: '#5AE082',
  pink: '#D975C6',
  crimson: '#D1263B',
};

export const CASSETTE_STRIPE_ORDER: CassetteStripeColor[] = [
  'red',
  'yellow',
  'blue',
  'green',
  'pink',
  'crimson',
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-google', name: 'Google', order: 0, createdAt: 1700000000000 },
  { id: 'cat-development', name: 'Development', order: 1, createdAt: 1700000000001 },
  { id: 'cat-entertainment', name: 'Entertainment', order: 2, createdAt: 1700000000002 },
  { id: 'cat-research', name: 'Research', order: 3, createdAt: 1700000000003 },
  { id: 'cat-study', name: 'Study', order: 4, createdAt: 1700000000004 },
  { id: 'cat-personal', name: 'Personal', order: 5, createdAt: 1700000000005 },
];

export const DEFAULT_BOOKMARKS: Bookmark[] = [
  {
    id: 'bm-gmail',
    title: 'Gmail',
    url: 'https://mail.google.com',
    categoryId: 'cat-google',
    icon: 'auto',
    stripeColor: 'red',
    order: 0,
    createdAt: 1700000000100,
  },
  {
    id: 'bm-github',
    title: 'GitHub',
    url: 'https://github.com',
    categoryId: 'cat-development',
    icon: 'auto',
    stripeColor: 'yellow',
    order: 1,
    createdAt: 1700000000101,
  },
  {
    id: 'bm-youtube',
    title: 'YouTube',
    url: 'https://www.youtube.com',
    categoryId: 'cat-entertainment',
    icon: 'auto',
    stripeColor: 'blue',
    order: 2,
    createdAt: 1700000000102,
  },
  {
    id: 'bm-drive',
    title: 'Drive',
    url: 'https://drive.google.com',
    categoryId: 'cat-google',
    icon: 'auto',
    stripeColor: 'green',
    order: 3,
    createdAt: 1700000000103,
  },
  {
    id: 'bm-claude',
    title: 'Claude',
    url: 'https://claude.ai',
    categoryId: 'cat-research',
    icon: 'auto',
    stripeColor: 'pink',
    order: 4,
    createdAt: 1700000000104,
  },
  {
    id: 'bm-leetcode',
    title: 'LeetCode',
    url: 'https://leetcode.com',
    categoryId: 'cat-study',
    icon: 'auto',
    stripeColor: 'crimson',
    order: 5,
    createdAt: 1700000000105,
  },
];

export function createDefaultTasks(dateKey: string): TaskItem[] {
  const now = Date.now();
  return [
    {
      id: 'task-init-1',
      title: 'Review today’s top priorities',
      completed: false,
      dateKey,
      createdAt: now,
      completedAt: null,
    },
    {
      id: 'task-init-2',
      title: 'Complete one focused Pomodoro session',
      completed: false,
      dateKey,
      createdAt: now + 1,
      completedAt: null,
    },
    {
      id: 'task-init-3',
      title: 'Organize bookmarks by purpose group',
      completed: false,
      dateKey,
      createdAt: now + 2,
      completedAt: null,
    },
  ];
}

export const DEFAULT_QUICK_NOTE = '';

export function createDefaultDashboardState(): DashboardState {
  const today = getLocalDateKey();
  return {
    version: 3,
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    bookmarks: DEFAULT_BOOKMARKS.map((b) => ({ ...b })),
    tasks: createDefaultTasks(today),
    taskHistory: [],
    quickNote: DEFAULT_QUICK_NOTE,
    weather: {
      tempC: 28,
      condition: 'Partly cloudy',
      highC: 31,
      lowC: 22,
      weatherCode: 2,
      location: 'Local',
      updatedAt: 0,
      isCustom: false,
    },
    currentDateKey: today,
    pomodoro: {
      mode: 'focus',
      isRunning: false,
      remainingMs: 25 * 60 * 1000,
      endTimeMs: null,
      durations: {
        focus: 25,
        shortBreak: 5,
        longBreak: 15,
      },
      soundMuted: true,
    },
    stats: {
      dateKey: today,
      focusSessionsCompleted: 0,
      totalFocusMinutes: 0,
      lifetimeFocusSessions: 0,
      lifetimeFocusMinutes: 0,
    },
    settings: {
      theme: 'upside-down',
      animationIntensity: 'subtle',
      particlesEnabled: true,
      scanlinesEnabled: true,
      flickerEnabled: true,
      soundEnabled: false,
      clock24Hour: false,
      showSeconds: true,
      accentColor: 'crimson',
      activeCategoryId: 'all',
      tvChannel: 'clock',
    },
    profile: {
      callsign: 'OPERATOR 011',
      stationLabel: 'HAWKINS STATION',
      bannerName: 'HARIKRISHNA',
    },
  };
}
