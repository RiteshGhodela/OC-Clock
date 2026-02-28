## Openclaw Clock — Browser Extension

Install this extension to get a **clock directly in your browser toolbar** — accessible from any tab without opening a new page.

### Features
- **3 clock styles:** Digital LED, Analog (SVG hands), Minimal gradient
- **12h / 24h format** toggle — remembered between sessions
- **Live badge** on toolbar icon shows current time (updates every minute)
- Works **offline** — no internet required

---

### How to Install (Chrome / Edge)

1. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge)
2. Turn on **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select this `extension/` folder
5. The ⏰ Openclaw Clock icon appears in your toolbar

> 💡 **Tip:** Pin the extension by clicking the puzzle icon 🧩 → pin Openclaw Clock

---

### Files
| File | Purpose |
|------|---------|
| `manifest.json` | Extension config (Manifest V3) |
| `popup.html` | Self-contained popup with all 3 clocks |
| `background.js` | Service worker — updates badge with live time |
| `icons/` | Extension icons (add 16/32/48/128px PNGs) |

---

### Adding Icons

Place icon PNG files in `extension/icons/`:
- `icon16.png` — for favicon/badge
- `icon32.png` — Windows taskbar
- `icon48.png` — Extensions page
- `icon128.png` — Chrome Web Store

You can use any clock emoji rendered to PNG, or generate icons from the app logo.
