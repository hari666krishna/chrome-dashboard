import { useEffect, useRef, useState } from 'react';
import {
  Flame,
  Moon,
  Search,
  Settings,
  User,
  X,
} from 'lucide-react';
import { StorageBackend } from '../../services/storage';
import { OperatorProfile, ThemeMode } from '../../types/dashboard';

interface HeaderProps {
  theme: ThemeMode;
  storageBackend?: StorageBackend;
  profile: OperatorProfile;
  onToggleTheme: () => void;
  onFocusSearch: () => void;
  onOpenSettings: () => void;
  onUpdateProfile: (patch: Partial<OperatorProfile>) => void;
}

export function Header({
  theme,
  profile,
  onToggleTheme,
  onFocusSearch,
  onOpenSettings,
  onUpdateProfile,
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [callsignDraft, setCallsignDraft] = useState(profile.callsign);
  const [stationDraft, setStationDraft] = useState(profile.stationLabel);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCallsignDraft(profile.callsign);
    setStationDraft(profile.stationLabel);
  }, [profile.callsign, profile.stationLabel]);

  useEffect(() => {
    if (!profileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [profileOpen]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      callsign: callsignDraft.trim() || 'OPERATOR 011',
      stationLabel: stationDraft.trim() || 'HAWKINS STATION',
    });
    setProfileOpen(false);
  };

  const isUpsideDown = theme === 'upside-down';

  return (
    <header className="relative z-20 bg-[#08090D]/55 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Zone */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#302027] bg-[#15151C]"
            style={{
              boxShadow: isUpsideDown ? '0 0 18px -4px var(--accent-glow)' : 'none',
            }}
          >
            <span
              className="h-3.5 w-3.5 rounded-sm rotate-45 border"
              style={{
                borderColor: 'var(--accent-highlight)',
                backgroundColor: isUpsideDown
                  ? 'rgba(230, 57, 70, 0.25)'
                  : 'rgba(165, 29, 45, 0.15)',
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-[0.14em] text-[#F4F0EF] whitespace-nowrap leading-tight">
              THE UPSIDE DOWN
            </h1>
            <p className="font-mono-tech text-[11px] tracking-[0.18em] text-[#85818A] whitespace-nowrap">
              PERSONAL CONTROL CENTER
            </p>
          </div>
        </div>

        {/* Utility Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onFocusSearch}
            title="Focus search bar (/)"
            className="flex items-center gap-2 rounded-lg border border-[#302027] bg-[#15151C] px-3 py-2 text-xs font-medium text-[#85818A] hover:border-[#85818A]/50 hover:text-[#F4F0EF] transition-colors whitespace-nowrap shrink-0"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden md:inline font-mono-tech text-[10px] text-[#85818A]/80">
              /
            </kbd>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-pressed={isUpsideDown}
            title="Switch visual dimension"
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all whitespace-nowrap shrink-0"
            style={{
              borderColor: isUpsideDown ? 'var(--accent-crimson)' : '#302027',
              backgroundColor: isUpsideDown ? 'rgba(100, 19, 31, 0.35)' : '#15151C',
              color: '#F4F0EF',
              boxShadow: isUpsideDown ? '0 0 18px -6px var(--accent-glow)' : 'none',
            }}
          >
            {isUpsideDown ? (
              <Flame
                className="h-3.5 w-3.5"
                style={{ color: 'var(--accent-highlight)' }}
              />
            ) : (
              <Moon className="h-3.5 w-3.5 text-[#85818A]" />
            )}
            <span>{isUpsideDown ? 'Upside Down' : 'Normal World'}</span>
          </button>

          {/* Operator Profile Popover */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              aria-expanded={profileOpen}
              aria-label="Operator profile customization"
              className="flex items-center gap-2 rounded-lg border border-[#302027] bg-[#15151C] px-3 py-2 text-xs font-medium text-[#F4F0EF] hover:border-[#85818A]/50 transition-colors whitespace-nowrap shrink-0"
            >
              <User className="h-3.5 w-3.5 text-[#85818A]" />
              <span className="hidden sm:inline max-w-[120px] truncate">
                {profile.callsign}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[#302027] bg-[#15151C] p-4 shadow-2xl z-40">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold tracking-wider uppercase text-[#F4F0EF]">
                    Operator Identity
                  </h3>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(false)}
                    aria-label="Close operator menu"
                    className="rounded p-1 text-[#85818A] hover:text-[#F4F0EF]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div>
                    <label
                      htmlFor="profile-callsign"
                      className="block text-xs text-[#85818A] mb-1"
                    >
                      Callsign
                    </label>
                    <input
                      id="profile-callsign"
                      type="text"
                      maxLength={28}
                      value={callsignDraft}
                      onChange={(e) => setCallsignDraft(e.target.value)}
                      className="w-full rounded-lg border border-[#302027] bg-[#101117] px-3 py-1.5 text-sm text-[#F4F0EF] focus:outline-none focus:border-[#E63946]"
                      placeholder="OPERATOR 011"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="profile-station"
                      className="block text-xs text-[#85818A] mb-1"
                    >
                      Station Label
                    </label>
                    <input
                      id="profile-station"
                      type="text"
                      maxLength={32}
                      value={stationDraft}
                      onChange={(e) => setStationDraft(e.target.value)}
                      className="w-full rounded-lg border border-[#302027] bg-[#101117] px-3 py-1.5 text-sm text-[#F4F0EF] focus:outline-none focus:border-[#E63946]"
                      placeholder="HAWKINS STATION"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setProfileOpen(false)}
                      className="rounded-lg border border-[#302027] px-3 py-1.5 text-xs text-[#85818A] hover:text-[#F4F0EF]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#F4F0EF]"
                      style={{ backgroundColor: 'var(--accent-crimson)' }}
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Settings"
            className="flex items-center justify-center rounded-lg border border-[#302027] bg-[#15151C] p-2 text-[#85818A] hover:border-[#85818A]/50 hover:text-[#F4F0EF] transition-colors shrink-0"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
