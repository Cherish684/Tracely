# Tracely 🎨

A hand-gesture drawing app for toddlers — shapes, fruits and vegetables.
Desktop uses Python + OpenCV + MediaPipe. Mobile uses MediaPipe JavaScript via camera or touch fallback.

---

## 📁 Project Structure

```
tracely/
├── app.py                  ← Flask server
├── shape_draw.py           ← Desktop drawing game
├── hand_landmarker.task    ← Copy here from original project
├── requirements.txt
├── instance/
│   └── tracely.db          ← SQLite DB (auto-created)
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
pip install -r requirements.txt
```

### 2. Copy your existing files

Copy into the tracely/ folder:
- `shape_draw.py`
- `hand_landmarker.task` (MediaPipe model file)

### 3. Run the server

```bash
python app.py
```

Then open **http://localhost:5050** in your browser.

---

## 🌐 How It Works

| Device   | Drawing Method                            |
|----------|-------------------------------------------|
| Desktop  | Python OpenCV + MediaPipe (shape_draw.py) |
| Mobile   | Dot-to-dot touch + MediaPipe JS camera    |
| Fallback | Touch canvas (if camera denied)           |

---

## 👤 User Accounts

| Mode     | Data Storage               |
|----------|----------------------------|
| Sign up  | SQLite DB via sqlite3       |
| Log in   | SQLite DB via sqlite3       |
| Guest    | localStorage (device only)  |

Passwords are hashed using SHA-256 (hashlib — built into Python).
When a guest signs up, their local progress is automatically imported.

---

## 📱 Mobile Drawing Steps

1. **Trace** — Tap each glowing orange dot in order — line draws itself automatically
2. **Name**  — Say the item name aloud 🎤
3. **Color** — Tap a color swatch to fill 🎨

### Mobile Gesture Controls (camera mode)
| Gesture | Action |
|---|---|
| ☝️ Index finger near dot | Triggers next dot |
| ✌️ Peace sign | Reset to first dot |
| 👍 Thumbs up | Finish trace manually |

### Mobile Bottom Buttons
| Button | Action |
|---|---|
| 🔄 Reset | Go back to first dot |
| 🗑️ Start Over | Full reset |

---

## 🖥️ Sidebar Navigation

- Always-visible sidebar on desktop with collapsible toggle (`‹` / `›`)
- Collapsed state shows icons only with hover tooltips
- On mobile: hidden by default, opens via hamburger menu (slide-in drawer)
- Sidebar state (open/collapsed) saved in localStorage

---

## 🎨 Theme

- Default: Dark mode
- Toggle: 🌙 / ☀️ button in sidebar footer
- Theme saved per user in DB, or localStorage for guests
- Accent color: Orange (`#FF6B35`) + Yellow (`#FFD93D`)

---

## 🎤 Voice Features

- **Voice Commands**: On the Learn page, click 🎤 and say "circle", "apple", etc.
- **Voice Instructions**: Item descriptions are read aloud when you open a card
- **Name Step**: Say the item name to complete step 2

---

## 📊 Reports

The Reports page shows an Overview table with columns:
Item · Level · Progress · Points · Time Taken · Status · Fav

---

## 🔑 Technical Notes

- `sqlite3` and `hashlib` are built into Python — no extra install needed
- Only `flask` and `flask-cors` need to be installed via pip
- DB file is at `instance/tracely.db` — auto-created on first run
- `shape_draw.py` writes completion signal to `tracely_signal.json`
- Flask server runs on `http://0.0.0.0:5050` — accessible on local network

---

## 🚀 Deployment (Render.com)

1. Push project to GitHub
2. Create a new Web Service on Render pointing to your repo
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python app.py`
5. Render provides HTTPS automatically — camera works on all devices

> **Note:** Free tier sleeps after 15 min of inactivity. Use UptimeRobot (free) to keep it awake.