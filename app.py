from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory
from flask_cors import CORS
import os, json, subprocess, sys, threading, time, sqlite3, hashlib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH  = os.path.join(BASE_DIR, 'instance', 'tracely.db')

app = Flask(__name__,
            template_folder=os.path.join(BASE_DIR, 'templates'),
            static_folder=os.path.join(BASE_DIR, 'static'))

app.config['SECRET_KEY']            = os.environ.get('SECRET_KEY', 'tracely-2025-secret')
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True

CORS(app, supports_credentials=True)

os.makedirs(os.path.join(BASE_DIR, 'instance'), exist_ok=True)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def check_password(password, hashed):
    return hashlib.sha256(password.encode()).hexdigest() == hashed

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS user (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        username      TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        theme         TEXT DEFAULT 'dark',
        created_at    REAL DEFAULT (strftime('%s','now'))
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS progress (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER NOT NULL,
        item_id    TEXT NOT NULL,
        traced     INTEGER DEFAULT 0,
        named      INTEGER DEFAULT 0,
        colored    INTEGER DEFAULT 0,
        points     INTEGER DEFAULT 0,
        time_trace REAL DEFAULT 0,
        time_name  REAL DEFAULT 0,
        time_color REAL DEFAULT 0,
        is_fav     INTEGER DEFAULT 0,
        UNIQUE(user_id, item_id),
        FOREIGN KEY(user_id) REFERENCES user(id)
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS feedback (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name    TEXT,
        email   TEXT,
        msg     TEXT,
        rating  INTEGER,
        checks  TEXT,
        date    TEXT,
        FOREIGN KEY(user_id) REFERENCES user(id)
    )''')
    conn.commit()
    conn.close()

init_db()

current_process = None
process_lock    = threading.Lock()
SCRIPT          = os.path.join(BASE_DIR, 'shape_draw.py')

def current_user_id():
    return session.get('user_id')

def get_or_create_progress(conn, user_id, item_id):
    c = conn.cursor()
    c.execute('SELECT * FROM progress WHERE user_id=? AND item_id=?', (user_id, item_id))
    row = c.fetchone()
    if not row:
        c.execute('INSERT INTO progress (user_id, item_id) VALUES (?,?)', (user_id, item_id))
        conn.commit()
        c.execute('SELECT * FROM progress WHERE user_id=? AND item_id=?', (user_id, item_id))
        row = c.fetchone()
    return row

def serialize_progress(user_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM progress WHERE user_id=?', (user_id,))
    rows = c.fetchall()
    conn.close()
    progress, points, times, favs = {}, {}, {}, []
    for r in rows:
        progress[r['item_id']] = {'trace': bool(r['traced']), 'name': bool(r['named']), 'color': bool(r['colored'])}
        points[r['item_id']]   = r['points']
        times[r['item_id']]    = {'trace': r['time_trace'], 'name': r['time_name'], 'color': r['time_color']}
        if r['is_fav']:
            favs.append(r['item_id'])
    return {'progress': progress, 'points': points, 'times': times, 'favs': favs}

def _import_guest_state(user_id, state):
    conn = get_db()
    c = conn.cursor()
    progress = state.get('progress', {})
    points   = state.get('points', {})
    times    = state.get('times', {})
    favs     = state.get('favs', [])
    for item_id, prog in progress.items():
        get_or_create_progress(conn, user_id, item_id)
        t = times.get(item_id, {})
        c.execute('''UPDATE progress SET
            traced=?, named=?, colored=?, points=?,
            time_trace=?, time_name=?, time_color=?, is_fav=?
            WHERE user_id=? AND item_id=?''', (
            int(prog.get('trace', False)),
            int(prog.get('name',  False)),
            int(prog.get('color', False)),
            points.get(item_id, 0),
            t.get('trace', 0), t.get('name', 0), t.get('color', 0),
            int(item_id in favs),
            user_id, item_id
        ))
    conn.commit()
    conn.close()

@app.route('/')
def index():
    if current_user_id():
        return redirect(url_for('main_app'))
    return render_template('login.html')

@app.route('/app')
def main_app():
    uid = current_user_id()
    if uid:
        conn = get_db()
        user = conn.execute('SELECT * FROM user WHERE id=?', (uid,)).fetchone()
        conn.close()
        if user:
            return render_template('index.html', username=user['username'], theme=user['theme'])
    if session.get('is_guest') or request.args.get('guest'):
        session['is_guest'] = True
        return render_template('index.html', username='Guest', theme='dark')
    return redirect(url_for('index'))

@app.route('/api/login', methods=['POST'])
def login():
    data     = request.get_json(force=True) or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    conn = get_db()
    user = conn.execute('SELECT * FROM user WHERE username=?', (username,)).fetchone()
    conn.close()
    if not user or not check_password(password, user['password_hash'] or ''):
        return jsonify({'error': 'Invalid username or password'}), 401
    session.clear()
    session['user_id']  = user['id']
    session['is_guest'] = False
    session.permanent   = True
    return jsonify({'ok': True, 'username': username, 'theme': user['theme']})

@app.route('/api/signup', methods=['POST'])
def signup():
    data     = request.get_json(force=True) or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    if len(username) < 2:
        return jsonify({'error': 'Username too short'}), 400
    conn = get_db()
    existing = conn.execute('SELECT id FROM user WHERE username=?', (username,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'Username already taken'}), 400
    hashed = hash_password(password)
    conn.execute('INSERT INTO user (username, password_hash) VALUES (?,?)', (username, hashed))
    conn.commit()
    user = conn.execute('SELECT * FROM user WHERE username=?', (username,)).fetchone()
    conn.close()
    session.clear()
    session['user_id']  = user['id']
    session['is_guest'] = False
    session.permanent   = True
    guest_state = data.get('guestState')
    if guest_state:
        _import_guest_state(user['id'], guest_state)
    return jsonify({'ok': True, 'username': username})

@app.route('/api/guest', methods=['POST', 'GET'])
def guest_login():
    session.clear()
    session['is_guest'] = True
    session.permanent   = True
    return jsonify({'ok': True, 'guest': True})

@app.route('/api/logout', methods=['POST', 'GET'])
def logout():
    session.clear()
    return jsonify({'ok': True})

@app.route('/api/me')
def me():
    uid = current_user_id()
    if uid:
        conn = get_db()
        user = conn.execute('SELECT * FROM user WHERE id=?', (uid,)).fetchone()
        conn.close()
        if user:
            return jsonify({'username': user['username'], 'theme': user['theme']})
    return jsonify({'guest': True})

@app.route('/api/state')
def get_state():
    uid = current_user_id()
    if not uid:
        return jsonify({'guest': True})
    conn = get_db()
    fb_rows = conn.execute('SELECT * FROM feedback WHERE user_id=? ORDER BY id DESC', (uid,)).fetchall()
    conn.close()
    feedbacks = []
    for fb in fb_rows:
        feedbacks.append({'name': fb['name'], 'email': fb['email'], 'msg': fb['msg'],
                          'rating': fb['rating'], 'checks': json.loads(fb['checks'] or '[]'), 'date': fb['date']})
    state = serialize_progress(uid)
    state['feedback'] = feedbacks
    return jsonify(state)

@app.route('/api/state', methods=['POST'])
def save_state():
    uid = current_user_id()
    if not uid:
        return jsonify({'guest': True})
    data     = request.get_json(force=True) or {}
    progress = data.get('progress', {})
    points   = data.get('points', {})
    times    = data.get('times', {})
    favs     = data.get('favs', [])
    conn = get_db()
    c = conn.cursor()
    for item_id, prog in progress.items():
        get_or_create_progress(conn, uid, item_id)
        t = times.get(item_id, {})
        c.execute('''UPDATE progress SET
            traced=?, named=?, colored=?, points=?,
            time_trace=?, time_name=?, time_color=?, is_fav=?
            WHERE user_id=? AND item_id=?''', (
            int(prog.get('trace', False)),
            int(prog.get('name',  False)),
            int(prog.get('color', False)),
            points.get(item_id, 0),
            t.get('trace', 0), t.get('name', 0), t.get('color', 0),
            int(item_id in favs),
            uid, item_id
        ))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/fav', methods=['POST'])
def toggle_fav():
    uid = current_user_id()
    if not uid:
        return jsonify({'guest': True})
    item_id = (request.get_json(force=True) or {}).get('item_id')
    conn = get_db()
    get_or_create_progress(conn, uid, item_id)
    row = conn.execute('SELECT is_fav FROM progress WHERE user_id=? AND item_id=?', (uid, item_id)).fetchone()
    new_fav = not bool(row['is_fav'])
    conn.execute('UPDATE progress SET is_fav=? WHERE user_id=? AND item_id=?', (int(new_fav), uid, item_id))
    conn.commit()
    conn.close()
    return jsonify({'ok': True, 'is_fav': new_fav})

@app.route('/api/theme', methods=['POST'])
def set_theme():
    uid   = current_user_id()
    theme = (request.get_json(force=True) or {}).get('theme', 'dark')
    if uid:
        conn = get_db()
        conn.execute('UPDATE user SET theme=? WHERE id=?', (theme, uid))
        conn.commit()
        conn.close()
    return jsonify({'ok': True})

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    uid = current_user_id()
    if not uid:
        return jsonify({'error': 'Login required'}), 401
    data = request.get_json(force=True) or {}
    conn = get_db()
    conn.execute('INSERT INTO feedback (user_id, name, email, msg, rating, checks, date) VALUES (?,?,?,?,?,?,?)', (
        uid, data.get('name', ''), data.get('email', ''),
        data.get('msg', ''), data.get('rating', 0),
        json.dumps(data.get('checks', [])), data.get('date', '')
    ))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/complete', methods=['POST'])
def complete_item():
    uid  = current_user_id()
    data = request.get_json(force=True) or {}
    item_id    = data.get('item')
    pts_earned = data.get('points', 30)
    time_trace = data.get('time_trace', 0)
    time_name  = data.get('time_name',  0)
    time_color = data.get('time_color', 0)
    if uid:
        conn = get_db()
        get_or_create_progress(conn, uid, item_id)
        conn.execute('''UPDATE progress SET
            traced=1, named=1, colored=1, points=?,
            time_trace=?, time_name=?, time_color=?
            WHERE user_id=? AND item_id=?''', (pts_earned, time_trace, time_name, time_color, uid, item_id))
        conn.commit()
        conn.close()
    signal = {'item': item_id, 'completed': True, 'points': pts_earned, 'timestamp': time.time(),
              'times': {'trace': time_trace, 'name': time_name, 'color': time_color}}
    with open(os.path.join(BASE_DIR, 'tracely_signal.json'), 'w') as f:
        json.dump(signal, f)
    return jsonify({'ok': True})

@app.route('/launch')
def launch():
    global current_process
    item = request.args.get('item', 'circle').lower().strip()
    with process_lock:
        if current_process and current_process.poll() is None:
            current_process.terminate()
        if not os.path.exists(SCRIPT):
            return jsonify({'error': 'shape_draw.py not found'}), 404
        try:
            current_process = subprocess.Popen([sys.executable, SCRIPT, '--item', item], cwd=BASE_DIR)
            return jsonify({'launched': True, 'item': item})
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/status')
def status():
    return jsonify({'running': True, 'server': 'Tracely Flask'})

@app.route('/signal')
def signal():
    path = os.path.join(BASE_DIR, 'tracely_signal.json')
    if os.path.exists(path):
        try:
            with open(path) as f:
                return jsonify(json.load(f))
        except:
            pass
    return jsonify({'error': 'No signal yet'})

@app.route('/clear_signal')
def clear_signal():
    path = os.path.join(BASE_DIR, 'tracely_signal.json')
    if os.path.exists(path):
        os.remove(path)
    return jsonify({'cleared': True})

@app.route('/models/<path:filename>')
def serve_model(filename):
    return send_from_directory(BASE_DIR, filename)

if __name__ == '__main__':
    print("=" * 55)
    print("  Tracely Flask Server")
    print("  Open: http://localhost:5050")
    print("=" * 55)
    app.run(host='0.0.0.0', port=5050, debug=False)
@app.route('/robots.txt')
def robots():
    return send_from_directory('static', 'robots.txt')

@app.route('/sitemap.xml')
def sitemap():
    return send_from_directory('static', 'sitemap.xml')