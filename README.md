# THE UPSIDE DOWN — Personal Productivity Control Center

A **Chrome New Tab Extension (Manifest V3)** built with **React, TypeScript, Vite, Tailwind CSS, Motion, and Lucide React**. Designed with a dark 1980s supernatural control-room aesthetic, it replaces the default Chrome New Tab page with an immersive, fast, offline-capable productivity workspace powered by `chrome.storage.local`.

---

## Key Features

- **Live Digital Clock & Date**: Real-time tabular clock (`Share Tech Mono`) with 12-hour / 24-hour and seconds toggles, weekday/date readout, and customizable operator callsign.
- **Google Search Integration**: Keyboard-accessible search bar (`/` shortcut to focus, `Enter` to submit) that opens Google search results in a new tab.
- **Categorized Bookmarks & Quick Access**: Add, edit, delete, filter, and reorder bookmarks (drag-and-drop or arrow controls) with automatic website favicons, fallback icons, and custom icon overrides.
- **Category Management**: Create, rename, reorder, and delete categories (`Development`, `Learning`, `Research`, `Productivity`, `Entertainment`, `Personal` by default).
- **Daily Checklist with Date Rollover**: Add, edit, toggle, and delete daily tasks with live progress tracking. Automatically archives completed days to history on midnight rollover while carrying unfinished tasks forward.
- **Timestamp-Accurate Pomodoro Focus Timer**: Focus (`25m`), Short Break (`5m`), and Long Break (`15m`) modes with customizable durations, circular SVG progress ring, optional synthesized Web Audio completion chime (muted by default), and accurate timestamp recovery across Chrome tab switches and restarts.
- **Productivity Overview**: Clean daily metrics for tasks completed, daily completion percentage, focus sessions completed, and total focus time.
- **Dual Theme System**: Switch smoothly between **Normal World** (minimalist dark workspace) and **Upside Down** (deep crimson aura, floating spore particles, organic edge vines, subtle CRT scanlines, and film grain), respecting `prefers-reduced-motion`.
- **100% Local Persistence & Backup**: Persists everything in `chrome.storage.local` (with automatic `localStorage` fallback when previewed outside Chrome), plus JSON backup export, import, and confirmed factory reset.

---

## Installing in Google Chrome

1. Install dependencies and create the production extension build:

   ```bash
   npm install
   npm run build
   ```

2. Open Google Chrome and navigate to:

   ```
   chrome://extensions
   ```

3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked**.
5. Select the generated `dist/` folder from this project.
6. Open a new Chrome tab (`Ctrl+T` / `Cmd+T`) to launch **THE UPSIDE DOWN**.

---

## Development & Verification Scripts

```bash
# Start local development server (uses localStorage fallback outside Chrome Extension)
npm run dev

# Run TypeScript type check
npm run lint

# Build production Chrome extension bundle into dist/
npm run build
```

---

## Project Structure

```
├── public/
│   ├── manifest.json          # Chrome Extension Manifest V3
│   └── icons/                 # Extension icons (16x16, 48x48, 128x128)
├── src/
│   ├── components/
│   │   ├── bookmarks/         # Bookmark grid, modal, and favicon/glyph renderer
│   │   ├── categories/        # Category tabs and category management modal
│   │   ├── checklist/         # Daily checklist and archived history viewer
│   │   ├── clock/             # Live terminal clock and dynamic greeting
│   │   ├── common/            # Accessible confirmation dialog and toast banner
│   │   ├── effects/           # Atmospheric particles, vines, scanlines, grain
│   │   ├── header/            # Top control bar and operator identity popover
│   │   ├── search/            # Google search bar
│   │   ├── settings/          # Customization drawer/modal and backup tools
│   │   ├── statistics/        # Compact daily productivity overview
│   │   └── timer/             # Circular Pomodoro focus timer
│   ├── hooks/                 # useClock, useDashboardData, usePomodoro, useReducedMotionPreference
│   ├── services/
│   │   └── storage.ts         # chrome.storage.local + localStorage persistence service
│   ├── types/
│   │   └── dashboard.ts       # TypeScript domain interfaces
│   ├── utils/                 # Date formatting, defaults, validation, Web Audio tones
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Preview Limitations

- When viewed inside a standard web browser or AI Studio preview rather than loaded as an unpacked Chrome extension, `chrome.storage.local` is unavailable, so the storage service automatically falls back to `window.localStorage` to provide full interactive persistence.
- Loading the `dist/` directory in `chrome://extensions` activates the native `chrome.storage.local` backend and overrides Chrome's New Tab page.
