import { useEffect, useRef, useState } from 'react';
import { Download, RotateCcw, Upload, X } from 'lucide-react';
import {
  AccentPresetId,
  AnimationIntensity,
  DashboardSettings,
  PomodoroDurations,
  ThemeMode,
} from '../../types/dashboard';
import { ACCENT_PRESETS } from '../../utils/defaults';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface SettingsModalProps {
  open: boolean;
  settings: DashboardSettings;
  durations: PomodoroDurations;
  onUpdateSettings: (patch: Partial<DashboardSettings>) => void;
  onUpdateDurations: (durations: PomodoroDurations) => void;
  onExportJson: () => string;
  onImportJson: (jsonText: string) => { ok: boolean; error?: string };
  onResetAll: () => Promise<void>;
  onNotify: (message: string) => void;
  onClose: () => void;
}

export function SettingsModal({
  open,
  settings,
  durations,
  onUpdateSettings,
  onUpdateDurations,
  onExportJson,
  onImportJson,
  onResetAll,
  onNotify,
  onClose,
}: SettingsModalProps) {
  const [focusMin, setFocusMin] = useState(String(durations.focus));
  const [shortMin, setShortMin] = useState(String(durations.shortBreak));
  const [longMin, setLongMin] = useState(String(durations.longBreak));
  const [durationError, setDurationError] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setFocusMin(String(durations.focus));
    setShortMin(String(durations.shortBreak));
    setLongMin(String(durations.longBreak));
    setDurationError(null);
  }, [durations.focus, durations.longBreak, durations.shortBreak, open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmResetOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [confirmResetOpen, onClose, open]);

  if (!open) return null;

  const handleApplyDurations = (e: React.FormEvent) => {
    e.preventDefault();
    const f = Number(focusMin);
    const s = Number(shortMin);
    const l = Number(longMin);
    if (
      !Number.isFinite(f) ||
      f < 1 ||
      f > 120 ||
      !Number.isFinite(s) ||
      s < 1 ||
      s > 60 ||
      !Number.isFinite(l) ||
      l < 1 ||
      l > 90
    ) {
      setDurationError(
        'Enter valid minutes (Focus: 1–120, Short Break: 1–60, Long Break: 1–90).'
      );
      return;
    }
    setDurationError(null);
    onUpdateDurations({
      focus: Math.round(f),
      shortBreak: Math.round(s),
      longBreak: Math.round(l),
    });
    onNotify('Pomodoro durations updated.');
  };

  const handleDownloadBackup = () => {
    const json = onExportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `the-upside-down-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    onNotify('Backup exported.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const res = onImportJson(content);
      if (res.ok) {
        onNotify('Backup imported successfully.');
      } else {
        onNotify(res.error ?? 'Failed to import backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderToggle = (
    label: string,
    description: string,
    checked: boolean,
    onChange: (next: boolean) => void
  ) => (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-[#F4F0EF]">{label}</p>
        <p className="text-xs text-[#85818A]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[#302027] transition-colors"
        style={{
          backgroundColor: checked ? 'var(--accent-crimson)' : '#101117',
        }}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-[#F4F0EF] transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-xl border border-[#302027] bg-[#15151C] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-[#302027] px-6 py-4">
            <div>
              <h2
                id="settings-modal-title"
                className="text-base font-semibold tracking-wide text-[#F4F0EF]"
              >
                Control Center Settings
              </h2>
              <p className="text-xs text-[#85818A]">
                Customize atmosphere, clock display, focus intervals, and local storage.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close settings"
              className="rounded-lg p-1.5 text-[#85818A] hover:bg-[#101117] hover:text-[#F4F0EF]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Theme & Accent */}
            <section className="space-y-4">
              <h3 className="font-mono-tech text-xs tracking-[0.16em] uppercase text-[#85818A]">
                Visual Dimension & Theme
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      id: 'normal',
                      title: 'Normal World',
                      desc: 'Minimalist dark workspace with restrained accents.',
                    },
                    {
                      id: 'upside-down',
                      title: 'Upside Down',
                      desc: 'Deep crimson aura, spores, vines, and CRT atmosphere.',
                    },
                  ] as { id: ThemeMode; title: string; desc: string }[]
                ).map((item) => {
                  const active = settings.theme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onUpdateSettings({ theme: item.id })}
                      className="rounded-xl border p-3.5 text-left transition-all"
                      style={{
                        borderColor: active ? 'var(--accent-highlight)' : '#302027',
                        backgroundColor: active
                          ? 'rgba(100, 19, 31, 0.28)'
                          : '#101117',
                      }}
                    >
                      <p className="text-sm font-semibold text-[#F4F0EF]">{item.title}</p>
                      <p className="mt-1 text-xs text-[#85818A]">{item.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Accent Color Selection */}
              <div>
                <p className="text-xs text-[#85818A] mb-2">Accent Color</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ACCENT_PRESETS) as AccentPresetId[]).map((presetId) => {
                    const preset = ACCENT_PRESETS[presetId];
                    const selected = settings.accentColor === presetId;
                    return (
                      <button
                        key={presetId}
                        type="button"
                        onClick={() => onUpdateSettings({ accentColor: presetId })}
                        className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          borderColor: selected ? preset.highlight : '#302027',
                          backgroundColor: selected
                            ? 'rgba(21, 21, 28, 1)'
                            : '#101117',
                          color: selected ? '#F4F0EF' : '#85818A',
                        }}
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: preset.highlight }}
                        />
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Animation Intensity */}
              <div>
                <p className="text-xs text-[#85818A] mb-2">Animation Intensity</p>
                <div className="grid grid-cols-4 gap-2">
                  {(['off', 'subtle', 'medium', 'intense'] as AnimationIntensity[]).map(
                    (level) => {
                      const selected = settings.animationIntensity === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() =>
                            onUpdateSettings({ animationIntensity: level })
                          }
                          className="rounded-lg border py-1.5 text-xs font-medium capitalize transition-colors"
                          style={{
                            borderColor: selected
                              ? 'var(--accent-highlight)'
                              : '#302027',
                            backgroundColor: selected
                              ? 'rgba(100, 19, 31, 0.32)'
                              : '#101117',
                            color: selected ? '#F4F0EF' : '#85818A',
                          }}
                        >
                          {level}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="divide-y divide-[#302027]/60 rounded-xl border border-[#302027] bg-[#101117] px-4 py-1">
                {renderToggle(
                  'Floating Particles',
                  'Render drifting ash spores in Upside Down mode',
                  settings.particlesEnabled,
                  (val) => onUpdateSettings({ particlesEnabled: val })
                )}
                {renderToggle(
                  'CRT Scanlines',
                  'Subtle 1980s monitor scanline texture in Upside Down mode',
                  settings.scanlinesEnabled,
                  (val) => onUpdateSettings({ scanlinesEnabled: val })
                )}
                {renderToggle(
                  'Ambient Light Flicker',
                  'Occasional subtle terminal power flicker in Upside Down mode',
                  settings.flickerEnabled,
                  (val) => onUpdateSettings({ flickerEnabled: val })
                )}
              </div>
            </section>

            {/* Clock & Audio */}
            <section className="space-y-3 border-t border-[#302027] pt-5">
              <h3 className="font-mono-tech text-xs tracking-[0.16em] uppercase text-[#85818A]">
                Clock & Audio
              </h3>
              <div className="divide-y divide-[#302027]/60 rounded-xl border border-[#302027] bg-[#101117] px-4 py-1">
                {renderToggle(
                  '24-Hour Clock',
                  'Display time in 24-hour format instead of 12-hour AM/PM',
                  settings.clock24Hour,
                  (val) => onUpdateSettings({ clock24Hour: val })
                )}
                {renderToggle(
                  'Show Seconds',
                  'Display live seconds readout beside clock digits',
                  settings.showSeconds,
                  (val) => onUpdateSettings({ showSeconds: val })
                )}
                {renderToggle(
                  'Timer Sound Effects',
                  'Play a synthesized analog tone when Pomodoro sessions finish',
                  settings.soundEnabled,
                  (val) => onUpdateSettings({ soundEnabled: val })
                )}
              </div>
            </section>

            {/* Pomodoro Durations */}
            <section className="space-y-3 border-t border-[#302027] pt-5">
              <h3 className="font-mono-tech text-xs tracking-[0.16em] uppercase text-[#85818A]">
                Pomodoro Durations (Minutes)
              </h3>
              <form onSubmit={handleApplyDurations} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="dur-focus"
                      className="block text-xs text-[#85818A] mb-1"
                    >
                      Focus
                    </label>
                    <input
                      id="dur-focus"
                      type="number"
                      min={1}
                      max={120}
                      value={focusMin}
                      onChange={(e) => setFocusMin(e.target.value)}
                      className="w-full rounded-lg border border-[#302027] bg-[#101117] px-3 py-2 text-sm font-mono-tech text-[#F4F0EF] focus:outline-none focus:border-[#E63946]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="dur-short"
                      className="block text-xs text-[#85818A] mb-1"
                    >
                      Short Break
                    </label>
                    <input
                      id="dur-short"
                      type="number"
                      min={1}
                      max={60}
                      value={shortMin}
                      onChange={(e) => setShortMin(e.target.value)}
                      className="w-full rounded-lg border border-[#302027] bg-[#101117] px-3 py-2 text-sm font-mono-tech text-[#F4F0EF] focus:outline-none focus:border-[#E63946]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="dur-long"
                      className="block text-xs text-[#85818A] mb-1"
                    >
                      Long Break
                    </label>
                    <input
                      id="dur-long"
                      type="number"
                      min={1}
                      max={90}
                      value={longMin}
                      onChange={(e) => setLongMin(e.target.value)}
                      className="w-full rounded-lg border border-[#302027] bg-[#101117] px-3 py-2 text-sm font-mono-tech text-[#F4F0EF] focus:outline-none focus:border-[#E63946]"
                    />
                  </div>
                </div>
                {durationError && (
                  <p className="text-xs text-[#E63946]">{durationError}</p>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-lg px-4 py-1.5 text-xs font-medium text-[#F4F0EF]"
                    style={{ backgroundColor: 'var(--accent-crimson)' }}
                  >
                    Apply Timer Durations
                  </button>
                </div>
              </form>
            </section>

            {/* Data & Reset */}
            <section className="space-y-3 border-t border-[#302027] pt-5">
              <h3 className="font-mono-tech text-xs tracking-[0.16em] uppercase text-[#85818A]">
                Local Data & Backup
              </h3>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#302027] bg-[#101117] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="flex items-center gap-1.5 rounded-lg border border-[#302027] bg-[#15151C] px-3 py-2 text-xs font-medium text-[#F4F0EF] hover:border-[#85818A]/50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Backup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-[#302027] bg-[#15151C] px-3 py-2 text-xs font-medium text-[#F4F0EF] hover:border-[#85818A]/50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Import Backup</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-[#64131F] bg-[#64131F]/25 px-3 py-2 text-xs font-medium text-[#E63946] hover:bg-[#64131F]/45 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Dashboard</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmResetOpen}
        title="Reset Dashboard to Defaults"
        message="This will erase all custom bookmarks, categories, tasks, history, focus statistics, and settings from local storage. This action cannot be undone."
        confirmLabel="Reset Everything"
        onConfirm={() => {
          setConfirmResetOpen(false);
          void onResetAll().then(() => onClose());
        }}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </>
  );
}
