"""
Stride AI - MongoDB Data Layer
Handles: users, sessions, analysis results, bulletins, alerts, crash recovery
"""

from pymongo import MongoClient, DESCENDING
from datetime import datetime, timedelta
from jose import jwt
import os
import bcrypt

# ── MongoDB connection ─────────────────────────────────────────────────────────
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = "stride_ai"

_client = None

def get_db():
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=4000)
    return _client[DB_NAME]

def db_available():
    try:
        get_db().command("ping")
        return True
    except Exception:
        return False

# ── Password hashing ───────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

# ── JWT config ─────────────────────────────────────────────────────────────────
SECRET_KEY  = os.environ.get("JWT_SECRET", "stride-sih-2026-secret-key-change-in-prod")
ALGORITHM   = "HS256"
TOKEN_TTL_H = 12

ROLES = {
    "admin":    "MoES / IMD Central Admin",
    "ndrf":     "NDRF / District Field Responder",
    "civilian": "Civilian / Public Safety View",
}

# ── User helpers ───────────────────────────────────────────────────────────────
def create_user(username: str, password: str, role: str, email: str = "") -> dict:
    db = get_db()
    if db.users.find_one({"username": username}):
        return {"error": "Username already exists"}
    doc = {
        "username":      username,
        "email":         email,
        "hashed_pw":     hash_password(password),
        "role":          role,
        "role_label":    ROLES.get(role, role),
        "created_at":    datetime.utcnow(),
        "last_login":    None,
        "active":        True,
    }
    db.users.insert_one(doc)
    return {"ok": True, "username": username, "role": role}

def verify_user(username: str, password: str) -> dict | None:
    db = get_db()
    user = db.users.find_one({"username": username, "active": True})
    if not user:
        return None
    if not verify_password(password, user["hashed_pw"]):
        return None
    db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": datetime.utcnow()}})
    return {"username": user["username"], "role": user["role"], "role_label": user["role_label"]}

def create_token(user_info: dict) -> str:
    expire = datetime.utcnow() + timedelta(hours=TOKEN_TTL_H)
    payload = {**user_info, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None

def seed_default_users():
    """Create one default account per role on first run."""
    db = get_db()
    defaults = [
        {"username": "imd_admin",   "password": "Admin@1234",  "role": "admin",    "email": "admin@imd.gov.in"},
        {"username": "ndrf_user",   "password": "Ndrf@1234",   "role": "ndrf",     "email": "ndrf@ndrf.gov.in"},
        {"username": "public_user", "password": "Public@1234", "role": "civilian", "email": ""},
    ]
    for u in defaults:
        if not db.users.find_one({"username": u["username"]}):
            create_user(u["username"], u["password"], u["role"], u["email"])
            print(f"  [Stride DB] Seeded user: {u['username']} ({u['role']})")

# ── Analysis / Bulletin storage ────────────────────────────────────────────────
def save_analysis(data: dict, source: str = "numpy_upload") -> str:
    """Store result from a numpy array analysis run."""
    db = get_db()
    doc = {
        "source":       source,
        "saved_at":     datetime.utcnow(),
        "lat":          data.get("lat"),
        "lon":          data.get("lon"),
        "s1_prob":      data.get("s1_prob"),
        "pred_vmax":    data.get("pred_vmax"),
        "imd_cat":      data.get("imd_cat"),
        "traj_points":  data.get("traj_points", []),
        "alert_info":   data.get("alert_info"),
        "cone":         data.get("cone", []),
        "heading":      data.get("heading"),
        "speed":        data.get("speed"),
        "map_html":     data.get("map_html"),
        "raw": {
            "tier_3class": data.get("tier_3class"),
            "curvature":   data.get("curvature"),
        }
    }
    result = db.analyses.insert_one(doc)
    return str(result.inserted_id)

def save_live_snapshot(cyclones: list, overlay_date: str) -> str:
    """Persist a full live cyclone snapshot (the active-cyclones-multispectral payload)."""
    db = get_db()
    # Strip large base64 thumbnails before storing (saves space)
    clean = []
    for c in cyclones:
        cc = {k: v for k, v in c.items() if k != "spectral_thumbnails"}
        clean.append(cc)
    doc = {
        "saved_at":    datetime.utcnow(),
        "overlay_date": overlay_date,
        "cyclones":    clean,
        "count":       len(clean),
    }
    result = db.live_snapshots.insert_one(doc)
    return str(result.inserted_id)

def save_bulletin(alert_info: dict, cyclone_name: str) -> str:
    """Store a generated alert bulletin."""
    db = get_db()
    doc = {
        "saved_at":     datetime.utcnow(),
        "cyclone_name": cyclone_name,
        **alert_info,
    }
    result = db.bulletins.insert_one(doc)
    return str(result.inserted_id)

def save_crash_state(state: dict) -> str:
    """Persist application state so it can be recovered after a crash."""
    db = get_db()
    doc = {"saved_at": datetime.utcnow(), **state}
    result = db.crash_recovery.insert_one(doc)
    # Keep only the 5 most recent crash states
    all_ids = [d["_id"] for d in db.crash_recovery.find({}, {"_id": 1}).sort("saved_at", DESCENDING)]
    if len(all_ids) > 5:
        db.crash_recovery.delete_many({"_id": {"$in": all_ids[5:]}})
    return str(result.inserted_id)

def get_latest_crash_state() -> dict | None:
    db = get_db()
    doc = db.crash_recovery.find_one({}, sort=[("saved_at", DESCENDING)])
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

def get_recent_analyses(limit: int = 100) -> list:
    db = get_db()
    docs = list(db.analyses.find({}, {"_id": 0}).sort("saved_at", DESCENDING).limit(limit))
    return docs

def get_recent_bulletins(limit: int = 100) -> list:
    db = get_db()
    docs = list(db.bulletins.find({}, {"_id": 0}).sort("saved_at", DESCENDING).limit(limit))
    return docs

def clear_history() -> bool:
    db = get_db()
    try:
        db.analyses.delete_many({})
        db.bulletins.delete_many({})
        return True
    except:
        return False
