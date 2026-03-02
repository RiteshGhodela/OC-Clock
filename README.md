# Horloge — Clock, Calendar & Diary

A premium time management and productivity app built with **Next.js 14**, **Tailwind CSS v3**, and **TypeScript**. Inspired by One UI, Nothing Phone, and Android 16 aesthetics. 

🌍 **Live Demo:** [https://oc-clock.vercel.app/](https://oc-clock.vercel.app/)

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
- **Event Scheduling** — Add events with Start/End times and Priorities
- **Conflict Resolver** — Auto-detects overlapping events and suggests free time slots
- **Ticks & Notes** — Mark any day as done or add text notes
- **Full-Screen Mode** — Expanded immersive calendar view

### 📓 Diary
- Create entries with title + body
- **Voice Dictation** — Use browser Web Speech API to dictate entries
- **AI Smart Save** — Uses Gemini AI to auto-categorize entries and extract actionable tasks directly to your Calendar
- Card grid view with date badge and category
- All data persisted to `localStorage`

### 🌅 Morning Briefing (Alarms)
- Set daily alarms
- **AI Briefing** — When an alarm rings, Horloge summarizes your daily Agenda, Weather, and recent Diary thoughts using Gemini AI.
- **Audio Playback** — Your briefing is read aloud to you using the Web Speech API.
- **Telegram Delivery** — Your briefing is additionally sent to your mobile via Telegram Bot.

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

### Calendar & Conflict Resolver
1. Click any day cell to open the day modal
2. Add a new **Event** with Start and End times.
3. If the time overlaps with an existing event, the **Conflict Resolver** will automatically suggest a new available time slot.

### Voice Diary & AI Smart Save
1. Click **+ New Entry** to open the editor
2. Click **Dictate** to speak your thoughts.
3. Click **Smart Save (AI)**. Horloge will use Gemini to auto-generate a title, categorize your entry, and extract any actionable tasks directly into your Calendar!

### Morning Briefing & Alarms
1. Go to the **Alarm** tab on the main Clock page.
2. Add a daily alarm.
3. Keep the tab open. When the time arrives, a **Wake Up Modal** will appear with a ringing animation.
4. Click **Stop & Play Briefing** to hear an AI-generated personalized spoken summary of your day!
