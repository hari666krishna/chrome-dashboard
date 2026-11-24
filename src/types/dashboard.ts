export type ThemeMode = 'normal' | 'upside-down';

export type AnimationIntensity = 'off' | 'subtle' | 'medium' | 'intense';

export type AccentPresetId = 'crimson' | 'ember' | 'amber' | 'phosphor' | 'violet';

export type TvChannel = 'clock' | 'pomodoro';

export type CassetteStripeColor =
  | 'red'
  | 'yellow'
  | 'blue'
  | 'green'
  | 'pink'
  | 'crimson';

export type BookmarkIconName =
  | 'auto'
  | 'code'
  | 'terminal'
  | 'book'
  | 'compass'
  | 'layers'
  | 'flask'
  | 'play'
  | 'shield'
  | 'cpu'
  | 'globe'
  | 'sparkles';

export interface Category {
  id: string;
  name: string;
  order: number;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  categoryId: string;
  icon: BookmarkIconName;
  stripeColor: CassetteStripeColor;
  order: number;
  createdAt: number;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  dateKey: string; // YYYY-MM-DD
  createdAt: number;
  completedAt: number | null;
}

export interface TaskHistoryDay {
  dateKey: string;
  completedCount: number;
  totalCount: number;
  completedTitles: string[];
}

export type PomodoroMode = 'focus' | 'short-break' | 'long-break';

export interface PomodoroDurations {
  focus: number; // minutes
  shortBreak: number; // minutes
  longBreak: number; // minutes
}

export interface PomodoroSessionState {
  mode: PomodoroMode;
  isRunning: boolean;
  remainingMs: number;
  endTimeMs: number | null;
  durations: PomodoroDurations;
  soundMuted: boolean;
}

export interface ProductivityStats {
  dateKey: string;
  focusSessionsCompleted: number;
  totalFocusMinutes: number;
  lifetimeFocusSessions: number;
  lifetimeFocusMinutes: number;
}

export interface WeatherData {
  tempC: number;
  condition: string;
  highC: number;
  lowC: number;
  weatherCode: number;
  location: string;
  updatedAt: number;
  isCustom: boolean;
}

export interface OperatorProfile {
  callsign: string;
  stationLabel: string;
  bannerName: string;
}

export interface DashboardSettings {
  theme: ThemeMode;
  animationIntensity: AnimationIntensity;
  particlesEnabled: boolean;
  scanlinesEnabled: boolean;
  flickerEnabled: boolean;
  soundEnabled: boolean; // default false
  clock24Hour: boolean;
  showSeconds: boolean;
  accentColor: AccentPresetId;
  activeCategoryId: string; // 'all' or category id
  tvChannel: TvChannel;
}

export interface DashboardState {
  version: number;
  categories: Category[];
  bookmarks: Bookmark[];
  tasks: TaskItem[];
  taskHistory: TaskHistoryDay[];
  quickNote: string;
  weather: WeatherData;
  currentDateKey: string;
  pomodoro: PomodoroSessionState;
  stats: ProductivityStats;
  settings: DashboardSettings;
  profile: OperatorProfile;
}
