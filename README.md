# Tracely 🎨

A hand-gesture drawing app for kids — shapes, fruits, and vegetables.
Desktop uses Python + OpenCV + MediaPipe Tasks. Mobile/browser uses MediaPipe Hands JS via camera, or touch fallback.

---

## 📁 Project Structure

```
tracely/
├── app.py                  ← Flask server + API routes
├── shape_draw.py           ← Desktop CV drawing game (OpenCV + MediaPipe Tasks)
├── hand_landmarker.task    ← Auto-downloaded on first run (or copy here manually)
├── requirements.txt
├── tracely_signal.json     ← Auto-created; desktop→browser completion signal
├── instance/
│   └── tracely.db          ← SQLite DB (auto-created on first run)
├── templates/
│   ├── login.html          ← Landing page (login / signup / guest)
│   └── index.html          ← Main app
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

---

## ⚙️ Setup

### 1. Install Python dependencies

```bash
pip install flask flask-cors mediapipe opencv-python numpy
```

### 2. Run the server

```bash
python app.py
```

Then open **http://localhost:5050** in your browser.

> **Note:** The `hand_landmarker.task` model file is downloaded automatically by `shape_draw.py` on first run if it is not already present.

---

## 🌐 How It Works

| Device        | Drawing Method                                            |
|---------------|-----------------------------------------------------------|
| Desktop (CV)  | Python OpenCV + MediaPipe Tasks (`shape_draw.py`)         |
| Browser/Mobile| Dot-to-dot + MediaPipe Hands JS camera (loaded via CDN)   |
| Fallback      | Touch canvas (activates automatically if camera denied)   |

---

## 👤 User Accounts

| Mode     | Data Storage                                      |
|----------|---------------------------------------------------|
| Sign up  | SQLite DB via `sqlite3` (built-in Python)         |
| Log in   | SQLite DB via `sqlite3`                           |
| Guest    | `localStorage` (device only; lost on cache clear) |

Passwords are hashed using SHA-256 (`hashlib` — built into Python).
When a guest signs up, their local progress is automatically imported into the new account.

---

## 🗂️ Item Catalogue

Each item has a category, difficulty level, guide dots, and a suggested color.

| Category   | Easy                  | Medium                              | Hard                           |
|------------|-----------------------|-------------------------------------|--------------------------------|
| Shapes     | Circle, Square, Triangle, Rectangle | Star, Heart, Diamond, Pentagon, Hexagon | Octagon, Oval, Arrow, Crescent |
| Fruits     | Orange                | Mango, Apple, Banana                | Pear                           |
| Vegetables | Carrot, Potato        | Tomato, Eggplant, Mushroom          | Pumpkin                        |

---

## 📱 Browser / Mobile Mode

### The Three Steps
1. **Trace** — Point your index finger at each glowing orange dot in order. The line draws itself automatically between dots.
2. **Name** — Hover your index finger over keyboard letters to spell the item name. Confirm with 👍 Thumbs Up on the OK button.
3. **Color** — Pinch your index finger and thumb together over a color swatch to select it. Confirm with the "Done Coloring" button.

### Gesture Reference (camera mode)

| Gesture | Action |
|---|---|
| ☝️ Index finger up, others folded | Draw mode — traces dots |
| ✌️ Index + middle fingers up | Erase mode (touch fallback: use Reset button) |
| 👍 Thumbs up | Confirm / submit (Done Tracing, OK on keyboard, Done Coloring) |
| ✊ Fist | Pen lifted — pauses drawing |
| 🤌 Pinch (index + thumb close) | Select a color swatch in Step 3 |

> **Thumbs up dwell:** Hold the thumbs-up gesture steadily for ~0.8 seconds over the action button. A green progress fill shows how close you are to confirming. The counter decays gradually if your gesture wavers briefly, so it won't flicker or fire accidentally.

### Dot Progress Requirement
The "Done Tracing" button only activates after you have reached at least **50% of the guide dots** (minimum 3). This prevents accidentally skipping the trace step.

### Hand Skeleton Overlay
A cyan bone-and-joint skeleton is drawn over the live camera feed in all three steps, so you can always see exactly which hand landmarks are being tracked.

### Touch Fallback (no camera)
If camera access is denied or unavailable, the app switches automatically to touch/click mode:
- Tap dots directly on the canvas
- 🔄 **Reset** — go back to the first dot
- 🗑️ **Start Over** — full reset

### Color Palette (10 colors)
Red · Orange · Yellow · Green · Blue · Purple · Pink · Brown · White · Black

The suggested color for each item is highlighted with a ⭐ gold dashed ring in the swatch grid. Picking the suggested color earns full points; any other color still earns full points if the suggested color is not in the palette.

---

## 🖥️ Desktop CV Mode (`shape_draw.py`)

Runs as a standalone full-screen OpenCV window. Requires a physical webcam.

### Launch

```bash
# Launched automatically when you click an item card in the browser (localhost only)

# Or run manually:
python shape_draw.py --item circle
python shape_draw.py --item apple
python shape_draw.py --item triangle
```

### Keyboard Controls

| Key | Action |
|-----|--------|
| `Q` / `ESC` | Quit |
| `R` | Restart current item from Step 1 |
| `S` | Save screenshot (e.g. `circle_trace.png`) |
| `ENTER` | Submit name in the typing box (Step 2) |
| `BACKSPACE` | Delete last character in typing box |

### Gesture Controls (CV mode)

| Gesture | Action |
|---|---|
| ☝️ One finger up | Draw mode — point at the next dot |
| ✌️ Two fingers up | Erase mode — wipe drawn lines |
| 👍 Thumbs up (held) | Confirm Done Tracing / Done Coloring |

### Step-by-Step (CV mode)

**Step 1 — Trace:** Point your index finger at the orange pulsing dot. Connect all dots in order. When all dots are visited a "Done Tracing" button appears — hold a thumbs-up gesture over it for ~18 frames to advance.

**Step 2 — Name:** A full hover-keyboard appears. Hover your index finger over letters to type the item name (dwell ~18 frames per key). Thumbs-up activates the OK button to submit. `ENTER` also submits. Wrong answers clear the input and let you try again.

**Step 3 — Color:** Pinch your index finger and thumb together over a color swatch (hold ~8 frames to confirm). A "Done Coloring" button then appears — thumbs-up to confirm. Matching the suggested color earns full points.

### Skeleton Display (CV mode)
The hand skeleton (bones + joints) is always drawn over the webcam feed so you can see which landmarks are being detected. Skeleton turns bright green when a thumbs-up is detected.

### Suggested Color Display (CV mode)
The suggested color for the item is shown in the top-left corner as a colored circle with its name. The coloring palette has 10 colors: Red, Orange, Yellow, Green, Blue, Purple, Lime, Cyan, Brown, Grey.

### Completion Signal
When all 3 steps are finished, `shape_draw.py` writes `tracely_signal.json` to the project folder. The Flask server polls this file and automatically marks the item complete in the browser, adds points, and triggers confetti — no manual refresh needed.

---

## 🏆 Scoring

Each item is worth up to **30 points** across 3 steps:

| Step | Points | Condition |
|------|--------|-----------|
| Trace | 10 pts | Complete at least 50% of guide dots, then confirm |
| Name | 10 pts | Spell the correct name and confirm with OK / ENTER |
| Color | 10 pts | Pick the suggested color (or any color if suggestion not in palette) |

Total points and per-item breakdown are shown in the **Rewards** section.
Time taken per step is recorded and shown in the **Reports** section.

---

## 🖥️ Sidebar Navigation

- Always-visible sidebar on desktop with collapsible toggle (`‹` / `›`)
- Collapsed state shows icons only with hover tooltips
- On mobile: hidden by default, opens via hamburger menu (slide-in drawer)
- Sidebar state (open/collapsed) saved in `localStorage`

### Pages

| Page | Description |
|------|-------------|
| Learn | Browse all items by category (Shapes / Fruits / Vegetables), filtered by difficulty |
| Rewards | Points total, badges, and level completion progress |
| Reports | Per-item overview table: progress, points, time taken, status, favourite |
| Saved | Favourited items (click ☆ on any card to save) and submitted feedback |

---

## 🎨 Theme

- Default: Dark mode
- Toggle: 🌙 / ☀️ button in sidebar footer
- Theme saved per user in DB, or `localStorage` for guests
- Accent color: Orange (`#FF6B35`) + Yellow (`#FFD93D`)

---

## 🎤 Voice Features

- **Voice Commands** — On the Learn page, click 🎤 and say an item name (e.g. "circle", "apple") to jump straight to its card
- **Voice Instructions** — Item descriptions are read aloud automatically when you open a card (Web Speech API)
- **Name Step (browser)** — Microphone button on the Name step lets you say the item name as an alternative to the hover keyboard

---

## 📊 Reports

The Reports page shows an Overview table per category with columns:

Icon · Name · Level · Progress · Points · Time Taken · Status · Favourite

---

## 🔑 Technical Notes

- `sqlite3` and `hashlib` are built into Python — no extra install needed beyond Flask
- DB file is at `instance/tracely.db` — auto-created on first run
- `shape_draw.py` writes completion data to `tracely_signal.json`; Flask polls `/signal` every 2 s to pick it up
- `hand_landmarker.task` is downloaded automatically from Google's MediaPipe CDN if missing
- Browser mode uses `@mediapipe/hands@0.4` loaded via jsDelivr CDN — no local install needed
- Flask server runs on `http://0.0.0.0:5050` — accessible on the local network

---

## 🚀 Deployment (Render.com)

1. Push project to GitHub
2. Create a new Web Service on Render pointing to your repo
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python app.py`
5. Render provides HTTPS automatically — camera and MediaPipe JS work on all devices

> **Note:** Free tier sleeps after 15 min of inactivity. Use UptimeRobot (free) to keep it awake.
> Desktop CV mode (`shape_draw.py`) requires a local webcam and will not work on remote/cloud servers.