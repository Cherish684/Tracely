import cv2, numpy as np, math, os, time, sys, argparse, urllib.request, json

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

                                                                
MODEL_PATH = "hand_landmarker.task"
MODEL_URL  = ("https://storage.googleapis.com/mediapipe-models/"
              "hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task")
def ensure_model():
    if not os.path.exists(MODEL_PATH):
        print("Downloading model…")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("Done.")

                                                                
                                                  
                                                               
                                                                

def _star_dots():
    pts = []
    for i in range(10):
        r = 0.38 if i % 2 == 0 else 0.16
        a = math.radians(i * 36 - 90)
        pts.append((0.5 + r*math.cos(a), 0.5 + r*math.sin(a)))
    return pts

def _heart_dots():
    pts = []
    for t in np.linspace(0, 2*math.pi, 20, endpoint=False):
        x = 0.5 + 0.28*(16*math.sin(t)**3)/16
        y = 0.52 - 0.28*(13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t))/17
        pts.append((x, y))
    return pts

def _arrow_dots():
    return [
        (0.55, 0.20), (0.85, 0.50), (0.55, 0.80),
        (0.55, 0.65), (0.15, 0.65), (0.15, 0.35), (0.55, 0.35),
    ]

def _crescent_dots():
    pts = []
    for a in np.linspace(-80, 80, 10):
        pts.append((0.5 + 0.38*math.cos(math.radians(a)),
                    0.5 + 0.38*math.sin(math.radians(a))))
    for a in np.linspace(70, -70, 10):
        pts.append((0.58 + 0.30*math.cos(math.radians(a)),
                    0.5  + 0.28*math.sin(math.radians(a))))
    return pts

                                                                
MANGO_POINTS = [
    (0.513,0.03),(0.483,0.036),(0.471,0.087),(0.368,0.104),(0.27,0.161),
    (0.215,0.234),(0.186,0.329),(0.2,0.474),(0.298,0.676),(0.309,0.871),
    (0.342,0.917),(0.405,0.939),(0.473,0.93),(0.544,0.899),(0.704,0.779),
    (0.806,0.631),(0.855,0.468),(0.847,0.336),(0.789,0.22),(0.679,0.13),
    (0.6,0.102),(0.521,0.09),(0.541,0.045),
]
APPLE_POINTS = [
    (0.574,0.091),(0.549,0.096),(0.520,0.146),(0.482,0.272),(0.366,0.228),
    (0.246,0.238),(0.143,0.299),(0.085,0.401),(0.078,0.528),(0.125,0.669),
    (0.235,0.807),(0.350,0.871),(0.401,0.872),(0.495,0.847),(0.626,0.874),
    (0.705,0.855),(0.777,0.804),(0.846,0.728),(0.921,0.579),(0.933,0.506),
    (0.924,0.406),(0.891,0.330),(0.841,0.277),(0.774,0.242),(0.699,0.226),
    (0.608,0.236),(0.520,0.272),(0.551,0.191),(0.605,0.113),
]
BANANA_POINTS = [
    (0.174,0.087),(0.137,0.099),(0.127,0.117),(0.139,0.202),(0.074,0.303),
    (0.066,0.417),(0.124,0.563),(0.224,0.679),(0.373,0.773),(0.544,0.817),
    (0.708,0.803),(0.787,0.775),(0.861,0.730),(0.954,0.629),(0.945,0.594),
    (0.921,0.585),(0.860,0.600),(0.633,0.618),(0.541,0.599),(0.454,0.559),
    (0.367,0.488),(0.307,0.405),(0.245,0.236),(0.212,0.202),(0.204,0.094),
]
ORANGE_POINTS = [
    (0.507,0.069),(0.339,0.104),(0.262,0.148),(0.201,0.202),(0.148,0.274),
    (0.109,0.355),(0.085,0.526),(0.120,0.671),(0.166,0.750),(0.223,0.815),
    (0.362,0.901),(0.524,0.928),(0.677,0.895),(0.757,0.850),(0.825,0.789),
    (0.912,0.646),(0.934,0.561),(0.938,0.475),(0.895,0.307),(0.797,0.175),
    (0.667,0.096),
]
PEAR_POINTS = [
    (0.554,0.206),(0.538,0.214),(0.512,0.265),(0.454,0.274),(0.403,0.307),
    (0.347,0.432),(0.239,0.545),(0.209,0.594),(0.208,0.663),(0.240,0.715),
    (0.297,0.756),(0.378,0.780),(0.510,0.773),(0.610,0.783),(0.662,0.773),
    (0.743,0.732),(0.789,0.668),(0.795,0.625),(0.784,0.584),(0.665,0.447),
    (0.628,0.322),(0.588,0.284),(0.539,0.268),(0.571,0.221),
]
TOMATO_POINTS = [
    (0.481,0.260),(0.463,0.309),(0.424,0.312),(0.355,0.294),(0.381,0.319),
    (0.293,0.346),(0.229,0.382),(0.178,0.447),(0.170,0.508),(0.208,0.585),
    (0.286,0.643),(0.412,0.683),(0.550,0.690),(0.673,0.669),(0.776,0.619),
    (0.837,0.547),(0.847,0.475),(0.830,0.430),(0.800,0.393),(0.759,0.363),
    (0.695,0.335),(0.722,0.316),(0.660,0.326),(0.616,0.316),(0.638,0.278),
    (0.576,0.309),(0.554,0.309),(0.575,0.274),(0.550,0.266),(0.532,0.269),
    (0.510,0.308),
]
CARROT_POINTS = [
    (0.462,0.177),(0.456,0.188),(0.423,0.189),(0.442,0.223),(0.409,0.233),
    (0.386,0.250),(0.370,0.279),(0.367,0.318),(0.438,0.667),(0.475,0.786),
    (0.498,0.807),(0.520,0.773),(0.596,0.410),(0.607,0.292),(0.586,0.245),
    (0.531,0.222),(0.554,0.182),(0.522,0.181),(0.511,0.192),(0.503,0.180),
]
EGGPLANT_POINTS = [
    (0.619,0.170),(0.600,0.172),(0.589,0.229),(0.537,0.246),(0.484,0.294),
    (0.503,0.301),(0.449,0.397),(0.392,0.464),(0.281,0.562),(0.246,0.614),
    (0.236,0.671),(0.252,0.715),(0.286,0.747),(0.338,0.766),(0.426,0.765),
    (0.504,0.734),(0.577,0.668),(0.636,0.574),(0.686,0.426),(0.690,0.315),
    (0.708,0.311),(0.676,0.258),(0.633,0.234),(0.637,0.181),
]
MUSHROOM_POINTS = [
    (0.486,0.289),(0.375,0.305),(0.297,0.337),(0.241,0.383),(0.223,0.412),
    (0.217,0.443),(0.231,0.474),(0.272,0.497),(0.325,0.506),(0.406,0.504),
    (0.383,0.595),(0.389,0.633),(0.435,0.662),(0.519,0.671),(0.580,0.657),
    (0.613,0.625),(0.618,0.583),(0.600,0.504),(0.679,0.505),(0.736,0.493),
    (0.774,0.465),(0.781,0.431),(0.752,0.376),(0.685,0.326),(0.586,0.295),
]
POTATO_POINTS = [
    (0.655,0.252),(0.586,0.255),(0.506,0.270),(0.364,0.327),(0.239,0.409),
    (0.184,0.475),(0.170,0.540),(0.205,0.615),(0.269,0.665),(0.312,0.683),
    (0.375,0.697),(0.481,0.695),(0.581,0.667),(0.673,0.609),(0.759,0.513),
    (0.816,0.395),(0.817,0.361),(0.803,0.324),(0.771,0.290),(0.736,0.270),
]
PUMPKIN_POINTS = [
    (0.539,0.263),(0.483,0.273),(0.457,0.328),(0.361,0.328),(0.278,0.355),
    (0.225,0.391),(0.187,0.446),(0.178,0.517),(0.210,0.587),(0.274,0.636),
    (0.377,0.666),(0.440,0.667),(0.507,0.677),(0.560,0.667),(0.614,0.667),
    (0.683,0.652),(0.759,0.616),(0.789,0.588),(0.813,0.548),(0.819,0.467),
    (0.781,0.398),(0.729,0.359),(0.675,0.337),(0.601,0.324),(0.542,0.328),
    (0.533,0.301),(0.549,0.272),
]

def get_item_data(name):
\
\
\
\
       
    items = {
                                                                
        'circle': (
            [(0.5+0.35*math.cos(math.radians(a)), 0.5+0.35*math.sin(math.radians(a)))
             for a in range(0,360,30)],
            True, (0,100,255), 'easy', 'shape', (0,0,220)
        ),
        'square': (
            [(0.18,0.18),(0.82,0.18),(0.82,0.82),(0.18,0.82)],
            True, (255,80,80), 'easy', 'shape', (255,100,0)
        ),
        'triangle': (
            [(0.50,0.10),(0.90,0.85),(0.10,0.85)],
            True, (0,215,255), 'easy', 'shape', (0,230,255)
        ),
        'rectangle': (
            [(0.10,0.28),(0.90,0.28),(0.90,0.72),(0.10,0.72)],
            True, (80,200,80), 'easy', 'shape', (0,180,0)
        ),
        'star': (
            _star_dots(), True, (0,215,255), 'medium', 'shape', (0,230,255)
        ),
        'heart': (
            _heart_dots(), False, (0,80,255), 'medium', 'shape', (0,0,220)
        ),
        'diamond': (
            [(0.50,0.08),(0.88,0.50),(0.50,0.92),(0.12,0.50)],
            True, (220,130,0), 'medium', 'shape', (255,100,0)
        ),
        'pentagon': (
            [(0.5+0.38*math.cos(math.radians(a-90)), 0.5+0.38*math.sin(math.radians(a-90)))
             for a in range(0,360,72)],
            True, (180,80,255), 'medium', 'shape', (130,0,100)
        ),
        'hexagon': (
            [(0.5+0.38*math.cos(math.radians(a)), 0.5+0.38*math.sin(math.radians(a)))
             for a in range(0,360,60)],
            True, (80,200,80), 'medium', 'shape', (0,180,0)
        ),
        'octagon': (
            [(0.5+0.38*math.cos(math.radians(a)), 0.5+0.38*math.sin(math.radians(a)))
             for a in range(0,360,45)],
            True, (0,165,255), 'hard', 'shape', (0,140,255)
        ),
        'oval': (
            [(0.5+0.40*math.cos(math.radians(a)), 0.5+0.25*math.sin(math.radians(a)))
             for a in range(0,360,20)],
            True, (255,50,200), 'hard', 'shape', (255,100,0)
        ),
        'arrow': (
            _arrow_dots(), True, (0,200,255), 'hard', 'shape', (0,230,255)
        ),
        'crescent': (
            _crescent_dots(), False, (200,100,255), 'hard', 'shape', (130,0,100)
        ),

                                                                
        'orange': (
            ORANGE_POINTS, True, (0,140,255), 'easy', 'fruit', (0,140,255)
        ),
        'mango': (
            MANGO_POINTS, True, (0,200,255), 'medium', 'fruit', (0,230,255)
        ),
        'apple': (
            APPLE_POINTS, True, (0,0,220), 'medium', 'fruit', (0,0,220)
        ),
        'banana': (
            BANANA_POINTS, True, (0,230,255), 'medium', 'fruit', (0,230,255)
        ),
        'pear': (
            PEAR_POINTS, True, (30,180,30), 'hard', 'fruit', (0,180,0)
        ),

                                                                
        'carrot': (
            CARROT_POINTS, True, (0,140,255), 'easy', 'vegetable', (0,140,255)
        ),
        'potato': (
            POTATO_POINTS, True, (60,130,180), 'easy', 'vegetable', (60,20,180)
        ),
        'tomato': (
            TOMATO_POINTS, True, (0,0,210), 'medium', 'vegetable', (0,0,220)
        ),
        'eggplant': (
            EGGPLANT_POINTS, True, (130,0,100), 'medium', 'vegetable', (130,0,100)
        ),
        'mushroom': (
            MUSHROOM_POINTS, True, (60,80,160), 'medium', 'vegetable', (60,20,180)
        ),
        'pumpkin': (
            PUMPKIN_POINTS, True, (0,100,220), 'hard', 'vegetable', (0,140,255)
        ),
    }
    return items.get(name, items['circle'])

                                                                
          
                                                                
def dist(a, b):
    return math.hypot(a[0]-b[0], a[1]-b[1])

def fingers_up(lms):
    tips=[4,8,12,16,20]; bot=[2,6,10,14,18]
    up=[lms[tips[0]].x < lms[bot[0]].x]
    for i in range(1,5): up.append(lms[tips[i]].y < lms[bot[i]].y)
    return up

def draw_skeleton(frame, lms, fw, fh):
    CONN=[(0,1),(1,2),(2,3),(3,4),(0,5),(5,6),(6,7),(7,8),(5,9),(9,10),
          (10,11),(11,12),(9,13),(13,14),(14,15),(15,16),(13,17),(17,18),
          (18,19),(19,20),(0,17)]
    pts=[(int(lm.x*fw),int(lm.y*fh)) for lm in lms]
    for a,b in CONN: cv2.line(frame,pts[a],pts[b],(80,220,80),1)
    for p in pts:    cv2.circle(frame,p,3,(200,255,200),-1)

def alpha_blend(background, overlay_bgr, alpha=0.75):
    mask = np.any(overlay_bgr > 0, axis=2).astype(np.float32)[:,:,None] * alpha
    return np.clip(background*(1-mask) + overlay_bgr*mask, 0, 255).astype(np.uint8)

def draw_dots(overlay, dot_px, visited, next_idx, pulse, done):
    for i, d in enumerate(dot_px):
        if i in visited:
            cv2.circle(overlay, d, 8,  (0,210,80),  -1)
            cv2.circle(overlay, d, 8,  (0,140,50),   1)
        elif i == next_idx and not done:
            r = int(13 + 5*math.sin(pulse))
            cv2.circle(overlay, d, r+7, (0,160,255), 1)
            cv2.circle(overlay, d, r,   (0,210,255), -1)
        else:
            cv2.circle(overlay, d, 8,  (160,160,160), -1)
            cv2.circle(overlay, d, 8,  (100,100,100),  1)

def draw_star_shape(img, cx, cy, r, col):
    pts=[]
    for i in range(5):
        ao=math.radians(-90+i*72); ai=math.radians(-90+i*72+36)
        pts+=[(int(cx+r*math.cos(ao)),int(cy+r*math.sin(ao))),
              (int(cx+r*.4*math.cos(ai)),int(cy+r*.4*math.sin(ai)))]
    cv2.fillPoly(img,[np.array(pts,np.int32)],col)

def draw_hud(overlay, item_name, level, n_done, n_total, W, H, cur_mode, step, pts_so_far,
             all_done=False, done_hover_frames=0, HOVER_NEEDED=18):
                        
    cv2.putText(overlay, item_name.upper(), (20,50),
                cv2.FONT_HERSHEY_DUPLEX, 1.4, (0,0,0), 6)
    cv2.putText(overlay, item_name.upper(), (20,50),
                cv2.FONT_HERSHEY_DUPLEX, 1.4, (255,255,255), 3)

    lv_col_map = {'easy':(80,200,80),'medium':(255,150,0),'hard':(0,80,255)}
    lv_txt_map = {'easy':'Easy','medium':'Medium','hard':'Hard'}
    lv_col = lv_col_map.get(level,(200,200,200))
    cv2.putText(overlay, lv_txt_map.get(level,''), (22,82),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, lv_col, 2)

                               
    step_labels = {1:'Step 1: TRACE',2:'Step 2: NAME IT',3:'Step 3: COLOR IT'}
    step_cols   = {1:(0,220,255),2:(80,255,80),3:(255,160,0)}
    sl = step_labels.get(step,'')
    sc = step_cols.get(step,(200,200,200))
    tx = W//2 - len(sl)*9
    cv2.putText(overlay, sl, (tx, 50), cv2.FONT_HERSHEY_DUPLEX, 0.9, (0,0,0), 5)
    cv2.putText(overlay, sl, (tx, 50), cv2.FONT_HERSHEY_DUPLEX, 0.9, sc, 2)

                      
    pts_txt = f"+{pts_so_far}/30 pts"
    cv2.putText(overlay, pts_txt, (W-220, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 0.85, (0,0,0), 5)
    cv2.putText(overlay, pts_txt, (W-220, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 0.85, (0,215,255), 2)

                      
    mode_map = {'draw':'DRAW','erase':'ERASE','idle':'Show 1 Finger!'}
    mode_col = {'draw':(80,255,120),'erase':(80,80,255),'idle':(0,220,255)}
    cv2.putText(overlay, mode_map.get(cur_mode,''), (20, H-20),
                cv2.FONT_HERSHEY_DUPLEX, 0.85, (0,0,0), 4)
    cv2.putText(overlay, mode_map.get(cur_mode,''), (20, H-20),
                cv2.FONT_HERSHEY_DUPLEX, 0.85, mode_col.get(cur_mode,(200,200,200)), 2)

                                                          
    if step == 1:
        total_stars = 10
        filled = int(n_done / max(n_total,1) * total_stars)
        x0 = W - total_stars*22 - 16
        y0 = H - 22
        for i in range(total_stars):
            c = (0,215,255) if i<filled else (160,160,160)
            draw_star_shape(overlay, x0+i*22, y0, 8, c)

    # Done Tracing button — shown when all dots visited (thumbs up to confirm)
    if all_done and step == 1:
        bw, bh = 260, 55
        bx = W//2 - bw//2
        by = H // 2 + 120
        cv2.rectangle(overlay, (bx, by), (bx+bw, by+bh), (0,180,0), -1)
        cv2.rectangle(overlay, (bx, by), (bx+bw, by+bh), (0,255,0), 3)
        # Thumbs-up progress fill
        if done_hover_frames > 0:
            prog = min(done_hover_frames / HOVER_NEEDED, 1.0)
            cv2.rectangle(overlay, (bx, by), (bx + int(bw*prog), by+bh), (0,255,120), -1)
        lbl = "👍 Done Tracing"
        (tw, th), _ = cv2.getTextSize(lbl, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
        cv2.putText(overlay, lbl, (bx + (bw-tw)//2, by + (bh+th)//2),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,0), 4)
        cv2.putText(overlay, lbl, (bx + (bw-tw)//2, by + (bh+th)//2),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)

def draw_celebration(overlay, W, H, t, msg1="AMAZING! 🎉", msg2=""):
    rng = np.random.default_rng(int(t*15) % 9999)
    for _ in range(80):
        sx=int(rng.integers(0,W)); sy=int(rng.integers(0,H))
        cv2.circle(overlay,(sx,sy),int(rng.integers(5,16)),
                   (int(rng.integers(50,255)),int(rng.integers(50,255)),int(rng.integers(50,255))),-1)
    for dx,col in [(5,(0,0,0)),(0,(0,230,255))]:
        cv2.putText(overlay, msg1, (W//2-200+dx, H//2-20+dx),
                    cv2.FONT_HERSHEY_DUPLEX, 1.8, col, 5+dx)
    if msg2:
        for dx,col in [(3,(0,0,0)),(0,(80,255,80))]:
            cv2.putText(overlay, msg2, (W//2-220+dx, H//2+55+dx),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, col, 2+dx)

                                                                
                         
                                                                
# ── Synthetic letter templates (no download needed) ───────────────────────────
def _build_letter_templates():
    """Generate 28x28 images for A-Z using OpenCV fonts. Returns dict {letter: [imgs]}"""
    templates = {}
    fonts     = [cv2.FONT_HERSHEY_SIMPLEX, cv2.FONT_HERSHEY_DUPLEX,
                 cv2.FONT_HERSHEY_COMPLEX, cv2.FONT_HERSHEY_TRIPLEX]
    scales    = [0.7, 0.85, 1.0]
    thickness = [1, 2]

    for i in range(26):
        letter = chr(ord('A') + i)
        imgs   = []
        for font in fonts:
            for scale in scales:
                for thick in thickness:
                    img = np.zeros((28, 28), dtype=np.uint8)
                    (tw, th), _ = cv2.getTextSize(letter, font, scale, thick)
                    ox = max(0, (28 - tw) // 2)
                    oy = max(th, (28 + th) // 2)
                    cv2.putText(img, letter, (ox, oy), font, scale, 255, thick, cv2.LINE_AA)
                    # Slight variations: original + horizontal flip
                    imgs.append(img.flatten().astype(np.float32))
                    imgs.append(cv2.flip(img, 1).flatten().astype(np.float32))
        templates[letter] = imgs
    return templates

_LETTER_TEMPLATES = None

def _get_templates():
    global _LETTER_TEMPLATES
    if _LETTER_TEMPLATES is None:
        _LETTER_TEMPLATES = _build_letter_templates()
    return _LETTER_TEMPLATES

def _stroke_to_letter(stroke_pts):
    """Convert fingertip stroke to letter by comparing with synthetic templates."""
    if len(stroke_pts) < 5:
        return '?'

    # Draw stroke onto 28x28 canvas
    img    = np.zeros((28, 28), dtype=np.uint8)
    xs     = [p[0] for p in stroke_pts]
    ys     = [p[1] for p in stroke_pts]
    mn_x, mx_x = min(xs), max(xs)
    mn_y, mx_y = min(ys), max(ys)
    span   = max(mx_x - mn_x, mx_y - mn_y, 1)
    margin = 3
    scale  = (28 - 2 * margin) / span
    norm   = [(int((x - mn_x) * scale) + margin,
               int((y - mn_y) * scale) + margin) for x, y in stroke_pts]
    for k in range(1, len(norm)):
        cv2.line(img, norm[k-1], norm[k], 255, 2)
    drawn = img.flatten().astype(np.float32)

    # Compare against all templates, pick closest by Euclidean distance
    templates  = _get_templates()
    best_letter, best_dist = '?', float('inf')
    for letter, imgs in templates.items():
        for tmpl in imgs:
            dist = float(np.linalg.norm(drawn - tmpl))
            if dist < best_dist:
                best_dist   = dist
                best_letter = letter
    return best_letter

# ── naming step (hover keyboard) ──────────────────────────────────────────────
def naming_step(item_name, W, H, cap):
    start_t  = time.time()
    typed    = ""
    wrong    = False

    # MediaPipe hand detector
    base_opts = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
    opts      = mp_vision.HandLandmarkerOptions(
                    base_options=base_opts,
                    running_mode=mp_vision.RunningMode.VIDEO,
                    num_hands=1,
                    min_hand_detection_confidence=0.7,
                    min_hand_presence_confidence=0.7,
                    min_tracking_confidence=0.65)
    detector  = mp_vision.HandLandmarker.create_from_options(opts)

    # Keyboard layout: 3 rows + backspace + enter
    KEYS = [
        list("QWERTYUIOP"),
        list("ASDFGHJKL"),
        list("ZXCVBNM") + ["<"]
    ]

    KEY_W, KEY_H = 56, 52
    KEY_GAP      = 8
    HOVER_NEEDED = 18   # frames to select a key

    hover_key      = None
    hover_frames   = 0
    ok_hover_frames = 0
    ok_missing      = 0

    # Precompute key rects: {letter: (x1,y1,x2,y2)}
    def build_key_rects():
        rects = {}
        kb_total_w = 10 * (KEY_W + KEY_GAP) - KEY_GAP
        kb_x0      = (W - kb_total_w) // 2
        kb_y0      = H // 2 - 3 * (KEY_H + KEY_GAP) // 2
        for row_i, row in enumerate(KEYS):
            row_w = sum(KEY_W*2 if k == '<' else KEY_W for k in row) + KEY_GAP*(len(row)-1)
            x_cursor = (W - row_w) // 2
            for k in row:
                kw = KEY_W * 2 if k == '<' else KEY_W
                y1 = kb_y0 + row_i * (KEY_H + KEY_GAP)
                rects[k] = (x_cursor, y1, x_cursor + kw, y1 + KEY_H)
                x_cursor += kw + KEY_GAP
        ok_y1 = kb_y0 + len(KEYS) * (KEY_H + KEY_GAP)
        rects["OK"] = (kb_x0, ok_y1, kb_x0 + kb_total_w, ok_y1 + KEY_H)
        return rects

    key_rects = build_key_rects()

    while True:
        ret, frame = cap.read()
        if not ret: continue
        frame = cv2.flip(frame, 1)

        display = frame.copy()

        # Detect fingertip — thumbs up activates OK; index finger navigates keys
        fx, fy = -1, -1
        thumbs_up_detected = False
        rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = detector.detect_for_video(mp_img, int(time.time() * 1000))
        if result.hand_landmarks:
            lm = result.hand_landmarks[0]
            thumb_up  = lm[4].y  < lm[2].y
            index_dn  = lm[8].y  > lm[6].y
            middle_dn = lm[12].y > lm[10].y
            ring_dn   = lm[16].y > lm[14].y
            pinky_dn  = lm[20].y > lm[18].y
            thumbs_up_detected = thumb_up and index_dn and middle_dn and ring_dn and pinky_dn

            CONN2 = [(0,1),(1,2),(2,3),(3,4),(0,5),(5,6),(6,7),(7,8),(5,9),(9,10),
                     (10,11),(11,12),(9,13),(13,14),(14,15),(15,16),(13,17),(17,18),
                     (18,19),(19,20),(0,17)]
            skel_pts = [(int(lm[i].x*W), int(lm[i].y*H)) for i in range(21)]
            skel_col = (0, 255, 80)  if thumbs_up_detected else (80, 220, 80)
            dot_col2 = (0, 255, 80)  if thumbs_up_detected else (200, 255, 200)
            for a, b in CONN2:
                cv2.line(display, skel_pts[a], skel_pts[b], skel_col, 2)
            for p in skel_pts:
                cv2.circle(display, p, 4, dot_col2, -1)

            index_up  = lm[8].y  < lm[6].y
            if index_up and middle_dn and ring_dn and pinky_dn:
                fx = int(lm[8].x * W)
                fy = int(lm[8].y * H)
            cv2.circle(display, (int(lm[8].x*W), int(lm[8].y*H)), 14,
                       (0,255,255) if fx != -1 else (100,100,100), -1)
            cv2.circle(display, (int(lm[8].x*W), int(lm[8].y*H)), 14, (255,255,255), 2)

        this_hover = None
        if fx != -1:
            for k, (x1,y1,x2,y2) in key_rects.items():
                if k == "OK":
                    continue
                if x1 <= fx <= x2 and y1 <= fy <= y2:
                    this_hover = k
                    break

        if this_hover == hover_key and this_hover is not None:
            hover_frames += 1
        else:
            hover_key    = this_hover
            hover_frames = 1 if this_hover else 0

        if thumbs_up_detected and typed.strip() != "":
            ok_hover_frames += 1
            ok_missing = 0
        else:
            ok_missing += 1
            if ok_missing > 4:
                ok_hover_frames = 0
                ok_missing = 0

        ok_triggered = (ok_hover_frames >= HOVER_NEEDED)
        if hover_frames >= HOVER_NEEDED or ok_triggered:
            selected_key = "OK" if ok_triggered else hover_key
            if selected_key == "<":
                typed = typed[:-1]
            elif selected_key == "OK":
                if typed.strip().lower() == item_name.lower():
                    elapsed = time.time() - start_t   # capture before celebration
                    # Show celebration for 1.5 seconds
                    t_end = time.time() + 1.5
                    while time.time() < t_end:
                        ret, frame = cap.read()
                        if not ret: break
                        frame = cv2.flip(frame, 1)
                        display = frame.copy()
                        celeb = np.zeros((H, W, 3), dtype=np.uint8)
                        draw_celebration(celeb, W, H, time.time(),
                                         "CORRECT! +10 pts 🎉",
                                         f"'{item_name.upper()}' — Moving to Step 3!")
                        display = alpha_blend(display, celeb, 0.80)
                        cv2.imshow("DrawBook", display)
                        cv2.waitKey(30)
                    detector.close()
                    return elapsed
                else:
                    wrong = True
                    typed = ""
            else:
                typed += selected_key
                wrong  = False
            hover_frames    = 0
            hover_key       = None
            ok_hover_frames = 0
            ok_missing      = 0

        for k, (x1,y1,x2,y2) in key_rects.items():
            is_hover = (k == hover_key)
            if k == "OK":
                progress = ok_hover_frames / HOVER_NEEDED
            else:
                progress = hover_frames / HOVER_NEEDED if is_hover else 0

            if k == "OK":
                bg = (0, int(160 + 60 * min(ok_hover_frames / HOVER_NEEDED, 1.0)), 0)
            elif k == "<":
                bg = (0,0,180)
            elif is_hover:
                bg = (80,80,80)
            else:
                bg = (40,40,40)

            cv2.rectangle(display, (x1,y1), (x2,y2), bg, -1)
            cv2.rectangle(display, (x1,y1), (x2,y2), (120,120,120), 1)

            if k == "OK":
                if ok_hover_frames > 0:
                    fill_w = int((x2-x1) * progress)
                    cv2.rectangle(display, (x1,y1), (x1+fill_w, y2), (0,200,255), -1)
                    cv2.rectangle(display, (x1,y1), (x2,y2), (0,230,255), 2)
            elif is_hover and progress > 0:
                fill_w = int((x2-x1) * progress)
                cv2.rectangle(display, (x1,y1), (x1+fill_w, y2), (0,200,255), -1)
                cv2.rectangle(display, (x1,y1), (x2,y2), (0,230,255), 2)

            # Key label
            lbl   = "👍" if k == "OK" else k
            kw    = x2 - x1
            scale = 0.55 if len(k) == 1 else 0.42
            (tw,th),_ = cv2.getTextSize(lbl, cv2.FONT_HERSHEY_SIMPLEX, scale, 2)
            tx = x1 + (kw - tw)//2
            ty = y1 + (KEY_H + th)//2
            cv2.putText(display, lbl, (tx,ty),
                        cv2.FONT_HERSHEY_SIMPLEX, scale, (255,255,255), 2)

        # Title
        cv2.putText(display, "Spell the name!", (W//2-180, H-200),
                    cv2.FONT_HERSHEY_DUPLEX, 1.3, (0,0,0), 6)
        cv2.putText(display, "Spell the name!", (W//2-180, H-200),
                    cv2.FONT_HERSHEY_DUPLEX, 1.3, (0,230,255), 3)

        # Typed text box
        box_x, box_y, box_w, box_h = W//2-250, H-175, 500, 55
        cv2.rectangle(display,(box_x,box_y),(box_x+box_w,box_y+box_h),(255,255,255),2)
        cv2.putText(display, typed+"_", (box_x+12, box_y+40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.1, (255,255,255), 2)

        cv2.putText(display, "Hover finger on a key to select it",
                    (W//2-230, H-108),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (180,180,180), 1)
        cv2.putText(display, "👍 Thumbs Up to confirm  |  ☝ Index finger to type",
                    (W//2-230, H-82),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,215,255), 1)

        if wrong:
            cv2.putText(display, "Try again! Wrong name",
                        (W//2-190, H-80),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.85, (0,60,255), 2)

        cv2.putText(display, "+10 pts for correct name!",
                    (W//2-190, H-50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,215,100), 2)

        cv2.imshow("DrawBook", display)

        key = cv2.waitKey(1) & 0xFF
        if key == 27:
            detector.close(); return None
        elif key == 13:
            if typed.strip().lower() == item_name.lower():
                detector.close()
                return time.time() - start_t
            else:
                wrong = True
                typed = ""
        elif key == 8:
            typed = typed[:-1]
            wrong = False

                                                                
                           
                                                                
PALETTE = [
    ((0,0,220),   "Red"),
    ((0,140,255), "Orange"),
    ((0,230,255), "Yellow"),
    ((0,180,0),   "Green"),
    ((200,0,0),   "Blue"),
    ((130,0,100), "Purple"),
    ((20,180,200),"Lime"),
    ((255,100,0), "Cyan"),
    ((60,20,180), "Brown"),
    ((180,180,180),"Grey"),
]

def build_guide_image(W, H, dot_px, closed, guide_color):
    # Outline only — no fill so figure starts empty
    guide = np.ones((H, W, 3), dtype=np.uint8) * 40
    pts   = np.array(dot_px, np.int32)
    cv2.polylines(guide, [pts], closed, (255,255,255), 2, cv2.LINE_AA)
    return guide

def coloring_step(item_name, W, H, cap, dot_px, closed, guide_color):
    start_t  = time.time()

    gh, gw = H//4, W//4
    # Guide thumbnail: outline only (empty shape)
    guide_full  = build_guide_image(W, H, dot_px, closed, guide_color)
    guide_thumb = cv2.resize(guide_full, (gw, gh))

    # Find the suggested color name from PALETTE by closest BGR distance
    def bgr_dist(a, b):
        return math.sqrt((int(a[0])-int(b[0]))**2 + (int(a[1])-int(b[1]))**2 + (int(a[2])-int(b[2]))**2)
    suggested_idx  = min(range(len(PALETTE)), key=lambda i: bgr_dist(PALETTE[i][0], guide_color))
    suggested_bgr  = PALETTE[suggested_idx][0]
    suggested_name = PALETTE[suggested_idx][1]

    # Layout: 2 rows of 5 swatches centered
    swatch = 60
    gap    = 14
    cols   = 5
    total_w = cols * (swatch + gap) - gap
    pal_x0  = (W - total_w) // 2
    pal_y0  = H // 2 - 70

    # MediaPipe setup
    base_opts = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
    opts = mp_vision.HandLandmarkerOptions(base_options=base_opts,
        running_mode=mp_vision.RunningMode.VIDEO,
        num_hands=1,
        min_hand_detection_confidence=0.7,
        min_hand_presence_confidence=0.7,
        min_tracking_confidence=0.65)
    detector = mp_vision.HandLandmarker.create_from_options(opts)

    hover_idx    = -1
    hover_frames = 0
    done_col_frames = 0
    done_col_missing = 0
    selected_color  = None
    filled_thumb    = None

    while True:
        ret, frame = cap.read()
        if not ret: continue
        frame = cv2.flip(frame, 1)

        display = frame.copy()

        # Draw empty shape outline in center of screen
        pts_arr = np.array(dot_px, np.int32)
        cv2.polylines(display, [pts_arr], closed, (255,255,255), 2, cv2.LINE_AA)

        # Title drawn at end of loop

        # --- Suggested color label (top-left, outside palette) ---
        sug_box_x, sug_box_y = 20, 80
        cv2.putText(display, "Suggested Color:", (sug_box_x, sug_box_y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0,0,0), 4)
        cv2.putText(display, "Suggested Color:", (sug_box_x, sug_box_y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0,215,255), 2)
        # Colored circle showing the suggested color
        circle_cx = sug_box_x + 14
        circle_cy = sug_box_y + 30
        cv2.circle(display, (circle_cx, circle_cy), 18, suggested_bgr, -1)
        cv2.circle(display, (circle_cx, circle_cy), 18, (255,255,255), 2)
        # Suggested color name next to circle
        cv2.putText(display, suggested_name, (sug_box_x + 38, circle_cy + 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,0), 4)
        cv2.putText(display, suggested_name, (sug_box_x + 38, circle_cy + 6),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,215,255), 2)

        gx, gy = W - gw - 20, 80
        thumb_to_draw = filled_thumb if filled_thumb is not None else guide_thumb
        display[gy:gy+gh, gx:gx+gw] = thumb_to_draw
        border_col_t = tuple(int(c) for c in selected_color) if selected_color is not None else (255,255,255)
        cv2.rectangle(display, (gx-2,gy-2), (gx+gw+2,gy+gh+2), border_col_t, 2)
        cv2.putText(display, "Shape Outline", (gx+gw//2-60, gy-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200,200,200), 1)

        fx, fy   = -1, -1
        pinching = False
        thumbs_up_col = False
        rgb      = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_img   = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result   = detector.detect_for_video(mp_img, int(time.time() * 1000))
        if result.hand_landmarks:
            lm   = result.hand_landmarks[0]
            fx   = int(lm[8].x * W)
            fy   = int(lm[8].y * H)
            tx   = int(lm[4].x * W)
            ty   = int(lm[4].y * H)

            pinch_dist = math.hypot(fx - tx, fy - ty)
            PINCH_THRESH = 60
            pinching = pinch_dist < PINCH_THRESH

            thumb_up_col  = lm[4].y  < lm[2].y
            index_dn_col  = lm[8].y  > lm[6].y
            middle_dn_col = lm[12].y > lm[10].y
            ring_dn_col   = lm[16].y > lm[14].y
            pinky_dn_col  = lm[20].y > lm[18].y
            thumbs_up_col = (thumb_up_col and index_dn_col and middle_dn_col
                             and ring_dn_col and pinky_dn_col)

            CONN3 = [(0,1),(1,2),(2,3),(3,4),(0,5),(5,6),(6,7),(7,8),(5,9),(9,10),
                     (10,11),(11,12),(9,13),(13,14),(14,15),(15,16),(13,17),(17,18),
                     (18,19),(19,20),(0,17)]
            skel3_pts = [(int(lm[i].x*W), int(lm[i].y*H)) for i in range(21)]
            skel3_col = (0, 255, 80)   if thumbs_up_col else (80, 220, 80)
            dot3_col  = (0, 255, 80)   if thumbs_up_col else (200, 255, 200)
            for a, b in CONN3:
                cv2.line(display, skel3_pts[a], skel3_pts[b], skel3_col, 2)
            for p in skel3_pts:
                cv2.circle(display, p, 4, dot3_col, -1)

            dot_col = (0,255,100) if pinching else (0,255,255)
            cv2.circle(display, (fx, fy), 14, dot_col, -1)
            cv2.circle(display, (fx, fy), 14, (255,255,255), 2)
            cv2.circle(display, (tx, ty), 10, dot_col, -1)
            cv2.circle(display, (tx, ty), 10, (255,255,255), 2)
            cv2.line(display, (fx,fy), (tx,ty), dot_col, 2)

        # Find which swatch finger is over
        this_hover = -1
        if fx != -1:
            for i, (bgr, name) in enumerate(PALETTE):
                col  = i % cols
                row  = i // cols
                cx_s = pal_x0 + col * (swatch + gap) + swatch // 2
                cy_s = pal_y0 + row * (swatch + gap) + swatch // 2
                if abs(fx - cx_s) < swatch//2 + 8 and abs(fy - cy_s) < swatch//2 + 8:
                    this_hover = i
                    break

        # Only count hover frames when pinching
        if this_hover != -1 and pinching:
            if this_hover == hover_idx:
                hover_frames += 1
            else:
                hover_idx    = this_hover
                hover_frames = 1
        else:
            hover_idx    = this_hover
            hover_frames = 0

        if hover_frames >= 8 and selected_color is None:
            selected_color = PALETTE[hover_idx][0]
            filled_guide = guide_full.copy()
            shape_mask_full = np.zeros((H, W), dtype=np.uint8)
            cv2.fillPoly(shape_mask_full, [np.array(dot_px, np.int32)], 255)
            filled_guide[shape_mask_full == 255] = selected_color
            cv2.polylines(filled_guide, [np.array(dot_px, np.int32)], closed, (255,255,255), 2, cv2.LINE_AA)
            filled_thumb = cv2.resize(filled_guide, (gw, gh))
            hover_frames = 0
            hover_idx    = -1

        if selected_color is not None:
            if thumbs_up_col:
                done_col_frames += 1
                done_col_missing = 0
            else:
                done_col_missing += 1
                if done_col_missing > 4:
                    done_col_frames = 0
                    done_col_missing = 0

            # Draw done coloring button
            DONE_COL_NEEDED = 18
            bw2, bh2 = 280, 55
            bx2 = W//2 - bw2//2
            by2 = H - 90
            cv2.rectangle(display, (bx2, by2), (bx2+bw2, by2+bh2), (0,160,0), -1)
            cv2.rectangle(display, (bx2, by2), (bx2+bw2, by2+bh2), (0,255,0), 3)
            if done_col_frames > 0:
                prog = min(done_col_frames / DONE_COL_NEEDED, 1.0)
                cv2.rectangle(display, (bx2, by2), (bx2 + int(bw2*prog), by2+bh2), (0,255,120), -1)
            lbl2 = "👍 Done Coloring"
            (tw2, th2), _ = cv2.getTextSize(lbl2, cv2.FONT_HERSHEY_SIMPLEX, 0.75, 2)
            cv2.putText(display, lbl2, (bx2 + (bw2-tw2)//2, by2 + (bh2+th2)//2),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0,0,0), 4)
            cv2.putText(display, lbl2, (bx2 + (bw2-tw2)//2, by2 + (bh2+th2)//2),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255,255,255), 2)
            cv2.putText(display, "Thumbs Up to confirm!", (W//2-130, by2-12),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,215,255), 1)

            if done_col_frames >= DONE_COL_NEEDED:
                chosen_color = selected_color
                elapsed_col = time.time() - start_t
                t_end = time.time() + 1.5
                while time.time() < t_end:
                    ret, cf = cap.read()
                    if not ret: break
                    cf = cv2.flip(cf, 1)
                    cd = cf.copy()
                    cel = np.zeros((H,W,3),dtype=np.uint8)
                    col_name = next((n for b,n in PALETTE if tuple(b)==tuple(chosen_color)), "Color")
                    draw_celebration(cel, W, H, time.time(),
                                     f"{col_name.upper()} — Great pick! 🎨",
                                     "All steps done — see your score!")
                    cd = alpha_blend(cd, cel, 0.80)
                    cv2.imshow("DrawBook", cd)
                    cv2.waitKey(30)
                detector.close()
                return chosen_color, elapsed_col, suggested_bgr

        # Draw swatches
        for i, (bgr, name) in enumerate(PALETTE):
            col  = i % cols
            row  = i // cols
            px   = pal_x0 + col * (swatch + gap)
            py   = pal_y0 + row * (swatch + gap)
            cx_s = px + swatch // 2
            cy_s = py + swatch // 2

            cv2.rectangle(display, (px, py), (px+swatch, py+swatch), bgr, -1)
            border_col = (0,255,100) if i == hover_idx else (100,100,100)
            border_w   = 3          if i == hover_idx else 1
            cv2.rectangle(display, (px, py), (px+swatch, py+swatch), border_col, border_w)
            # Progress arc while pinching
            if i == hover_idx and hover_frames > 0:
                angle = int(360 * hover_frames / 8)
                cv2.ellipse(display, (cx_s, cy_s), (swatch//2+6, swatch//2+6),
                            -90, 0, angle, (255,255,255), 3)
            # Color name
            tx2, ty2 = px, py + swatch + 18
            (tw, th), _ = cv2.getTextSize(name, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(display, (tx2-2, ty2-th-2), (tx2+tw+2, ty2+4), (0,0,0), -1)
            cv2.putText(display, name, (tx2, ty2), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)

        # Update title to reflect pinch + thumbs-up interaction
        cv2.putText(display, "Pinch a color, then 👍 Done!", (W//2-230, 55),
                    cv2.FONT_HERSHEY_DUPLEX, 1.3, (0,0,0), 6)
        cv2.putText(display, "Pinch a color, then 👍 Done!", (W//2-230, 55),
                    cv2.FONT_HERSHEY_DUPLEX, 1.3, (255,160,0), 3)

        cv2.putText(display, "ESC to quit", (20, H-20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (150,150,150), 1)
        cv2.imshow("DrawBook", display)
        if cv2.waitKey(1) & 0xFF == 27:
            detector.close()
            return None, 0, None


def write_completion_signal(item_name, category, pts_earned,
                             time_trace, time_name, time_color):
    try:
        signal = {
            "item":      item_name,
            "category":  category,
            "points":    pts_earned,
            "completed": True,
            "timestamp": time.time(),
            "times": {
                "trace": round(time_trace, 2),
                "name":  round(time_name,  2),
                "color": round(time_color, 2),
            }
        }
        with open("tracely_signal.json","w") as f:
            json.dump(signal, f)
        print(f"✅ Signal written: {signal}")
    except Exception as e:
        print(f"Signal write failed: {e}")

                                                                
       
                                                                
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--item', default='circle', help='Item name to draw')
    args   = parser.parse_args()
    item_name = args.item.lower()

    ensure_model()

    dots_rel, closed, fill_color, level, category, guide_color = get_item_data(item_name)
    N = len(dots_rel)

               
    base_opts = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
    opts = mp_vision.HandLandmarkerOptions(
        base_options=base_opts,
        running_mode=mp_vision.RunningMode.VIDEO,
        num_hands=1,
        min_hand_detection_confidence=0.7,
        min_hand_presence_confidence=0.7,
        min_tracking_confidence=0.65,
    )
    landmarker = mp_vision.HandLandmarker.create_from_options(opts)

            
    cap = None
    for idx in range(3):
        for flag in [cv2.CAP_DSHOW, None]:
            t = cv2.VideoCapture(idx,flag) if flag else cv2.VideoCapture(idx)
            if t.isOpened():
                ok,_=t.read()
                if ok: cap=t; print(f"Camera {idx}"); break
            t.release()
        if cap: break
    if cap is None:
        print("No camera!"); input("Enter…"); return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Resolution: {W}x{H}")

    pad_x, pad_y = 0.12, 0.10
    dot_px = [(int(pad_x*W + d[0]*(W*(1-2*pad_x))), int(pad_y*H + d[1]*(H*(1-pad_y-0.20)))) for d in dots_rel]
    SNAP_R = max(35, int(W * 0.06))

    WIN = "DrawBook"
    cv2.namedWindow(WIN, cv2.WINDOW_NORMAL)
    cv2.setWindowProperty(WIN, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

    draw_layer   = np.zeros((H, W, 3), dtype=np.uint8)
    colour_layer = np.zeros((H, W, 3), dtype=np.uint8)

           
    visited         = set()
    next_dot        = 0
    last_pt         = None
    all_done        = False
    done_hover_frames = 0
    done_trace_missing = 0
    celebrating     = False
    celebrate_start = 0.0
    pulse           = 0.0
    ts_ms           = 0
    cur_mode        = 'idle'
    pts_so_far      = 0
    step            = 1

            
    trace_start = time.time()
    time_trace  = 0.0
    time_name   = 0.0
    time_color  = 0.0

    screenshot_taken = False

    print(f"🎮 {item_name} | {N} dots | Level:{level} | Category:{category}")
    print("Step 1: Point ONE finger at the ORANGE dot!")

    while True:
        ret, frame = cap.read()
        if not ret: break
        frame = cv2.flip(frame, 1)
        fh, fw = frame.shape[:2]
        ts_ms  = int(time.time() * 1000)
        pulse  = time.time() * 4.0

                                                                
        if step == 4:
            display = frame.copy()
            draw_celebration(display, W, H, time.time(),
                             "CONGRATULATIONS!",
                             f"You completed {item_name.capitalize()}! +30 pts")
                     
            cv2.putText(display,f"Tracing:  {time_trace:.1f}s",(W//2-160,H//2+110),
                        cv2.FONT_HERSHEY_SIMPLEX,0.8,(200,200,200),2)
            cv2.putText(display,f"Naming:   {time_name:.1f}s",(W//2-160,H//2+145),
                        cv2.FONT_HERSHEY_SIMPLEX,0.8,(200,200,200),2)
            cv2.putText(display,f"Coloring: {time_color:.1f}s",(W//2-160,H//2+180),
                        cv2.FONT_HERSHEY_SIMPLEX,0.8,(200,200,200),2)
            cv2.putText(display,"Press Q to Quit  |  R to Play Again",(W//2-280,H-30),
                        cv2.FONT_HERSHEY_SIMPLEX,0.75,(180,180,180),1)
            cv2.imshow(WIN, display)
            key = cv2.waitKey(30) & 0xFF
            if key in (ord('q'),27): break
            elif key == ord('r'):
                            
                draw_layer[:]=0; colour_layer[:]=0
                visited.clear(); next_dot=0; last_pt=None
                all_done=False; shape_filled=False
                celebrating=False; pts_so_far=0; step=1
                trace_start=time.time()
                time_trace=time_name=time_color=0.0
                screenshot_taken=False
            continue

                                                                
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB,
                          data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        det = landmarker.detect_for_video(mp_img, ts_ms)

        cur_mode = 'idle'
        tip_px   = None

        if det.hand_landmarks:
            lms = det.hand_landmarks[0]
            draw_skeleton(frame, lms, W, H)
            up = fingers_up(lms)
            _, index, middle, ring, pinky = up
            tip_px = (int(lms[8].x*W), int(lms[8].y*H))
            if index and not middle and not ring and not pinky:
                cur_mode = 'draw'
            elif index and middle and not ring and not pinky:
                cur_mode = 'erase'

                                                                
        if step == 1:
            if cur_mode == 'draw' and tip_px and not all_done:
                if next_dot < N and dist(tip_px, dot_px[next_dot]) < SNAP_R:
                    snap = dot_px[next_dot]
                    visited.add(next_dot)
                    if last_pt is not None:
                        cv2.line(draw_layer, last_pt, snap, (255,255,255), 5, cv2.LINE_AA)
                    last_pt  = snap
                    next_dot += 1
                    if next_dot >= N:
                        if closed and last_pt:
                            cv2.line(draw_layer, last_pt, dot_px[0], (255,255,255), 5, cv2.LINE_AA)
                        all_done        = True
                        celebrating     = True
                        celebrate_start = time.time()
                        time_trace      = time.time() - trace_start
                        pts_so_far     += 10
                        print(f"✅ Traced! +10 pts | Time: {time_trace:.1f}s")

            elif cur_mode == 'erase' and tip_px:
                cv2.circle(draw_layer,   tip_px, 35, (0,0,0), -1)
                cv2.circle(colour_layer, tip_px, 35, (0,0,0), -1)

                           
            display = frame.copy()
            ghost_overlay = np.zeros((H,W,3),dtype=np.uint8)
            cv2.polylines(ghost_overlay,[np.array(dot_px,np.int32)],closed,(200,200,200),2,cv2.LINE_AA)
            display = alpha_blend(display, ghost_overlay, 0.45)
            if np.any(colour_layer>0): display = alpha_blend(display, colour_layer, 0.55)
            display = alpha_blend(display, draw_layer, 0.90)
            dot_overlay = np.zeros((H,W,3),dtype=np.uint8)
            draw_dots(dot_overlay, dot_px, visited, next_dot, pulse, all_done)
            display = alpha_blend(display, dot_overlay, 1.0)
            hud = np.zeros((H,W,3),dtype=np.uint8)
            draw_hud(hud, item_name, level, len(visited), N, W, H, cur_mode, step, pts_so_far,
                     all_done=all_done, done_hover_frames=done_hover_frames)
            display = alpha_blend(display, hud, 0.90)

            if tip_px:
                near = (not all_done and next_dot<N and dist(tip_px,dot_px[next_dot])<SNAP_R*1.5)
                cc = (0,210,80) if near else (0,160,255)
                cv2.circle(display, tip_px, 13, cc, 2)
                cv2.circle(display, tip_px,  4, cc, -1)

                if all_done and det.hand_landmarks:
                    lms_t = det.hand_landmarks[0]
                    thumb_up  = lms_t[4].y  < lms_t[2].y
                    index_dn  = lms_t[8].y  > lms_t[6].y
                    middle_dn = lms_t[12].y > lms_t[10].y
                    ring_dn   = lms_t[16].y > lms_t[14].y
                    pinky_dn  = lms_t[20].y > lms_t[18].y
                    is_thumbs_up = thumb_up and index_dn and middle_dn and ring_dn and pinky_dn
                    if is_thumbs_up:
                        done_hover_frames += 1
                        done_trace_missing = 0
                    else:
                        done_trace_missing += 1
                        if done_trace_missing > 4:
                            done_hover_frames = 0
                            done_trace_missing = 0
                elif all_done and not det.hand_landmarks:
                    done_trace_missing += 1
                    if done_trace_missing > 4:
                        done_hover_frames = 0
                        done_trace_missing = 0

            if celebrating:
                celeb = np.zeros((H,W,3),dtype=np.uint8)
                draw_celebration(celeb, W, H, time.time(),
                                 "TRACED! +10 pts 🎉","👍 Thumbs Up to continue!")
                display = alpha_blend(display, celeb, 0.80)

            cv2.imshow(WIN, display)
            key = cv2.waitKey(1) & 0xFF
            if key in (ord('q'),27): break
            elif key == ord('r'):
                draw_layer[:]=0; colour_layer[:]=0
                visited.clear(); next_dot=0; last_pt=None
                all_done=False; celebrating=False; done_hover_frames=0; done_trace_missing=0
                trace_start=time.time(); pts_so_far=max(0,pts_so_far-10)
            elif key == ord('s'):
                fname=f"{item_name}_trace.png"; cv2.imwrite(fname,display)
                screenshot_taken=True; print(f"💾 {fname}")
            elif (done_hover_frames >= 18) and all_done:
                celebrating = False
                step = 2

                # Show step 1 celebration for 1.5s (not counted in time)
                t_end = time.time() + 1.5
                while time.time() < t_end:
                    ret, cf = cap.read()
                    if not ret: break
                    cf = cv2.flip(cf, 1)
                    cd = cf.copy()
                    cel = np.zeros((H,W,3),dtype=np.uint8)
                    draw_celebration(cel, W, H, time.time(),
                                     "WELL DONE! +10 pts 🎉", "Moving to Step 2 — Name it!")
                    cd = alpha_blend(cd, cel, 0.80)
                    cv2.imshow(WIN, cd)
                    cv2.waitKey(30)
                                                    
                t_name = naming_step(item_name, W, H, cap)
                if t_name is None: break
                time_name  = t_name
                pts_so_far += 10
                print(f"✅ Named! +10 pts | Time: {time_name:.1f}s")
                step = 3

                                                                
        elif step == 3:
            chosen_color, t_col, suggested_bgr = coloring_step(
                item_name, W, H, cap, dot_px, closed, guide_color)
            if chosen_color is None: break
            time_color  = t_col
            if tuple(chosen_color) == tuple(suggested_bgr):
                pts_so_far += 10
                print(f"✅ Correct color! +10 pts | Time: {time_color:.1f}s")
            else:
                print(f"🎨 Color chosen but doesn't match suggested | Time: {time_color:.1f}s")

                                          
            shape_mask = np.zeros((H, W), dtype=np.uint8)
            cv2.fillPoly(shape_mask, [np.array(dot_px, np.int32)], 255)
            colour_layer = np.zeros((H, W, 3), dtype=np.uint8)
            colour_layer[shape_mask == 255] = chosen_color
            shape_filled = True

                                     
            write_completion_signal(item_name, category, pts_so_far,
                                    time_trace, time_name, time_color)
            step = 4

    cap.release()
    cv2.destroyAllWindows()
    landmarker.close()
    print("👋 Bye!")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback; traceback.print_exc()
        input("\nError — Press Enter…")