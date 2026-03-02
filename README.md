# Horloge — Clock, Calendar & Diary

A premium time management and productivity app built with **Next.js 14**, **Tailwind CSS v3**, and **TypeScript**. Inspired by One UI, Nothing Phone, and Android 16 aesthetics.

---

## ✨ Features

### 🕐 Clock
- **Three Themes**:
  - **Nothing Phone** — Glyph-inspired dot bars, animated second progress dots, blinking monospace colon
  - **Android 16** — Material You SVG arc ring, day-of-week pills, AM/PM badge
  - **B&W** — Classic SVG analog clock with hour/minute/second hands and digital readout
- **Location-Based Timezone** — Auto-detects timezone via browser `Intl` API (no API key required)
- **Full-Screen Mode** — Immersive clock overlay with theme-specific background decoration

### ⏱ Timer
- Set hours, minutes, seconds
- Animated SVG countdown ring
- Web Audio API beep on completion
- Start / Pause / Resume / Reset

### ⏩ Stopwatch
- Start / Stop / Lap / Reset
- `requestAnimationFrame` precision display
- Lap history with split times

### 📅 Calendar
- Full monthly grid with Prev/Next month navigation
- **Ticks** — Mark any day as done with a ✓ indicator
- **Notes** — Add, delete per-day text notes
- **Full-Screen Mode** — Expanded immersive calendar view
- Click any day to open the day detail modal

### 📓 Diary
- Create entries with title + body
- Card grid view with date badge and body snippet
- Word count display while editing
- Delete with confirmation dialog
- All data persisted to `localStorage`

---

## 🎨 Themes

| Theme | Description |
|---|---|
| **Nothing Phone** | Black background, red-orange accent, dot-grid background, glyph bars |
| **Android 16** | Dark indigo, violet accent, mesh gradient, Material You circles |
| **Black & White** | Pure black, white accent, classic analog clock |

Theme preference is saved across sessions.

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- npm

### Install and Run

```bash
cd "path/to/Horloge"
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with ThemeProvider
│   ├── page.tsx            # Clock page (home)
│   ├── calendar/page.tsx   # Calendar page
│   ├── diary/page.tsx      # Diary page
│   └── globals.css         # Global styles + theme CSS variables
├── components/
│   ├── AppShell.tsx        # Sidebar navigation + theme switcher
│   ├── clock/
│   │   ├── ClockPage.tsx   # Clock tabs, timezone, fullscreen host
│   │   ├── NothingClock.tsx
│   │   ├── Android16Clock.tsx
│   │   ├── BWClock.tsx
│   │   ├── Timer.tsx
│   │   └── Stopwatch.tsx
│   ├── calendar/
│   │   ├── CalendarPage.tsx
│   │   └── DayModal.tsx
│   └── diary/
│       ├── DiaryPage.tsx
│       └── DiaryEditor.tsx
├── context/
│   └── ThemeContext.tsx    # Theme state + CSS class injection
├── hooks/
│   ├── useDiaryStore.ts    # CRUD for diary entries
│   └── useCalendarStore.ts # CRUD for calendar ticks/notes
└── lib/
    ├── time.ts             # Time formatting utilities
    └── storage.ts          # Type-safe localStorage helpers
```

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3 + CSS custom properties
- **Icons/Emoji**: Native emoji (no external icon library dependency)
- **Data**: Browser `localStorage` (no backend required)
- **Audio**: Web Audio API for timer completion beep
- **Animation**: CSS keyframes + SVG

---

## 📖 Usage Guide

### Switching Themes
Use the three circular buttons in the sidebar (● ◆ ◐) to switch between Nothing, Android 16, and B&W themes.

### Clock Full Screen
Click **⛶ Full Screen** button at the top-right of the Clock page.

### Timer
1. Set hours/minutes/seconds using the number inputs
2. Click **Start**
3. Hear a beep when the timer completes
4. Use **Pause/Resume/Reset** as needed

### Stopwatch
1. Click **Start** → **Lap** to record lap times → **Stop** → **Reset**
2. Lap history shows total and split times

### Calendar
1. Navigate months with ‹ and › arrows
2. Click any day cell to open the day modal
3. Toggle the ✓ tick or add text notes
4. Notes and ticks persist across sessions and page reloads

### Diary
1. Click **+ New Entry** to open the editor
2. Type a title and body
3. Click **Save** — entry appears in the card grid
4. Click any card to edit or delete it
