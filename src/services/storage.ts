import { DashboardState } from '../types/dashboard';
import { createDefaultDashboardState } from '../utils/defaults';
import { sanitizeDashboardState } from '../utils/validation';

const STORAGE_KEY = 'the_upside_down_dashboard_v3';

export type StorageBackend = 'chrome.storage.local' | 'localStorage';

function isChromeStorageAvailable(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.storage !== 'undefined' &&
    typeof chrome.storage.local !== 'undefined'
  );
}

export function getStorageBackendName(): StorageBackend {
  return isChromeStorageAvailable() ? 'chrome.storage.local' : 'localStorage';
}

export interface StorageLoadResult {
  state: DashboardState;
  backend: StorageBackend;
  error: string | null;
}

class DashboardStorageService {
  private lastSerialized: string | null = null;
  private writeTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingState: DashboardState | null = null;

  async load(): Promise<StorageLoadResult> {
    const backend = getStorageBackendName();

    try {
      if (isChromeStorageAvailable()) {
        const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
          chrome.storage.local.get([STORAGE_KEY], (items) => {
            if (chrome.runtime?.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(items ?? {});
          });
        });

        const raw = result[STORAGE_KEY];
        if (!raw) {
          const initial = createDefaultDashboardState();
          await this.saveImmediate(initial);
          return { state: initial, backend, error: null };
        }

        const sanitized = sanitizeDashboardState(raw);
        this.lastSerialized = JSON.stringify(sanitized);
        return { state: sanitized, backend, error: null };
      }

      // Fallback for non-extension web preview
      const rawText = window.localStorage.getItem(STORAGE_KEY);
      if (!rawText) {
        const initial = createDefaultDashboardState();
        await this.saveImmediate(initial);
        return { state: initial, backend, error: null };
      }

      const parsed = JSON.parse(rawText) as unknown;
      const sanitized = sanitizeDashboardState(parsed);
      this.lastSerialized = JSON.stringify(sanitized);
      return { state: sanitized, backend, error: null };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to read stored dashboard data.';
      return {
        state: createDefaultDashboardState(),
        backend,
        error: message,
      };
    }
  }

  scheduleSave(state: DashboardState, delayMs = 150): void {
    this.pendingState = state;
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }
    this.writeTimeout = setTimeout(() => {
      if (this.pendingState) {
        const toWrite = this.pendingState;
        this.pendingState = null;
        void this.saveImmediate(toWrite);
      }
    }, delayMs);
  }

  async saveImmediate(state: DashboardState): Promise<{ ok: boolean; error?: string }> {
    const serialized = JSON.stringify(state);
    if (serialized === this.lastSerialized) {
      return { ok: true };
    }

    try {
      if (isChromeStorageAvailable()) {
        await new Promise<void>((resolve, reject) => {
          chrome.storage.local.set({ [STORAGE_KEY]: state }, () => {
            if (chrome.runtime?.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve();
          });
        });
      } else {
        window.localStorage.setItem(STORAGE_KEY, serialized);
      }
      this.lastSerialized = serialized;
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to save state to local storage.',
      };
    }
  }

  async resetToDefaults(): Promise<DashboardState> {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
      this.writeTimeout = null;
    }
    this.pendingState = null;
    this.lastSerialized = null;
    const fresh = createDefaultDashboardState();
    await this.saveImmediate(fresh);
    return fresh;
  }

  subscribeExternalChanges(onChange: (nextState: DashboardState) => void): () => void {
    if (isChromeStorageAvailable() && chrome.storage.onChanged) {
      const listener = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string
      ) => {
        if (areaName !== 'local') return;
        const change = changes[STORAGE_KEY];
        if (!change || !change.newValue) return;
        const sanitized = sanitizeDashboardState(change.newValue);
        const serialized = JSON.stringify(sanitized);
        if (serialized !== this.lastSerialized) {
          this.lastSerialized = serialized;
          onChange(sanitized);
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => {
        chrome.storage.onChanged.removeListener(listener);
      };
    }

    const handleWindowStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as unknown;
        const sanitized = sanitizeDashboardState(parsed);
        const serialized = JSON.stringify(sanitized);
        if (serialized !== this.lastSerialized) {
          this.lastSerialized = serialized;
          onChange(sanitized);
        }
      } catch {
        // Ignore malformed external writes
      }
    };

    window.addEventListener('storage', handleWindowStorage);
    return () => {
      window.removeEventListener('storage', handleWindowStorage);
    };
  }
}

export const storageService = new DashboardStorageService();
