import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, LSTM, Dense, RepeatVector, TimeDistributed

# Optional land mask dependency fallback
try:
    from global_land_mask import globe
    HAS_LAND_MASK = True
except ImportError:
    HAS_LAND_MASK = False

# ==========================================
# 1. GLOBAL COASTAL WATCH MATRIX (GLOBAL SECTORS)
# ==========================================
# ==========================================
# 1. GLOBAL WATCH CITY MATRIX (COASTAL + INLAND)
# ==========================================
ALL_WATCH_CITIES = [
    # --- Bay of Bengal Coastal ---
    {"city": "Visakhapatnam", "state": "Andhra Pradesh", "country": "India", "lat": 17.68, "lon": 83.21},
    {"city": "Bhubaneswar", "state": "Odisha", "country": "India", "lat": 20.29, "lon": 85.82},
    {"city": "Puri / Paradip", "state": "Odisha", "country": "India", "lat": 19.81, "lon": 85.82},
    {"city": "Kolkata / Haldia", "state": "West Bengal", "country": "India", "lat": 22.57, "lon": 88.36},
    {"city": "Chennai", "state": "Tamil Nadu", "country": "India", "lat": 13.08, "lon": 80.27},
    {"city": "Puducherry", "state": "Puducherry", "country": "India", "lat": 11.94, "lon": 79.80},
    {"city": "Chittagong", "state": "Chittagong", "country": "Bangladesh", "lat": 22.35, "lon": 91.78},
    {"city": "Cox's Bazar", "state": "Chittagong", "country": "Bangladesh", "lat": 21.42, "lon": 92.00},
    # --- Arabian Sea Coastal ---
    {"city": "Mumbai", "state": "Maharashtra", "country": "India", "lat": 18.96, "lon": 72.82},
    {"city": "Panaji", "state": "Goa", "country": "India", "lat": 15.49, "lon": 73.82},
    {"city": "Kochi", "state": "Kerala", "country": "India", "lat": 9.93, "lon": 76.26},
    {"city": "Karachi", "state": "Sindh", "country": "Pakistan", "lat": 24.86, "lon": 67.00},
    {"city": "Muscat", "state": "Muscat", "country": "Oman", "lat": 23.58, "lon": 58.38},
    {"city": "Trincomalee", "state": "Eastern Province", "country": "Sri Lanka", "lat": 8.58, "lon": 81.21},
    # --- Inland India (for overland storms) ---
    {"city": "Raipur", "state": "Chhattisgarh", "country": "India", "lat": 21.25, "lon": 81.63},
    {"city": "Nagpur", "state": "Maharashtra", "country": "India", "lat": 21.14, "lon": 79.08},
    {"city": "Bhopal", "state": "Madhya Pradesh", "country": "India", "lat": 23.25, "lon": 77.40},
    {"city": "Jabalpur", "state": "Madhya Pradesh", "country": "India", "lat": 23.18, "lon": 79.94},
    {"city": "Lucknow", "state": "Uttar Pradesh", "country": "India", "lat": 26.85, "lon": 80.95},
    {"city": "Varanasi", "state": "Uttar Pradesh", "country": "India", "lat": 25.32, "lon": 82.97},
    {"city": "Allahabad (Prayagraj)", "state": "Uttar Pradesh", "country": "India", "lat": 25.44, "lon": 81.84},
    {"city": "Patna", "state": "Bihar", "country": "India", "lat": 25.59, "lon": 85.13},
    {"city": "Ranchi", "state": "Jharkhand", "country": "India", "lat": 23.34, "lon": 85.31},
    {"city": "Bilaspur", "state": "Chhattisgarh", "country": "India", "lat": 22.08, "lon": 82.14},
    {"city": "Korba", "state": "Chhattisgarh", "country": "India", "lat": 22.36, "lon": 82.68},
    {"city": "Ambikapur", "state": "Chhattisgarh", "country": "India", "lat": 23.12, "lon": 83.19},
    {"city": "Dehradun", "state": "Uttarakhand", "country": "India", "lat": 30.32, "lon": 78.03},
    # --- Atlantic / Pacific (TCIR compatibility) ---
    {"city": "Miami", "state": "Florida", "country": "USA", "lat": 25.76, "lon": -80.19},
    {"city": "New Orleans", "state": "Louisiana", "country": "USA", "lat": 29.95, "lon": -90.07},
    {"city": "Houston", "state": "Texas", "country": "USA", "lat": 29.76, "lon": -95.36},
]
# Keep backward-compat alias
COASTAL_CITIES = ALL_WATCH_CITIES

# ==========================================
# 2. MODEL ARCHITECTURE
# ==========================================
def build_seq2seq_trajectory_model(input_timesteps=4, feature_dim=4, forecast_steps=12):
    """Builds a Keras Seq2Seq LSTM architecture for trajectory offset forecasting."""
    inputs = Input(shape=(input_timesteps, feature_dim))
    encoder = LSTM(64, return_sequences=False)(inputs)
    repeat = RepeatVector(forecast_steps)(encoder)
    decoder = LSTM(64, return_sequences=True)(repeat)
    outputs = TimeDistributed(Dense(2))(decoder)  # Output: (d_lat, d_lon) for each 6h step
    
    model = Model(inputs=inputs, outputs=outputs, name="seq2seq_trajectory")
    model.compile(optimizer='adam', loss='mse')
    return model

# ==========================================
# 3. MOTION & FEATURE EXTRACTION
# ==========================================
def derive_convective_centroid_motion(x_raw, vmax=35.0):
    """Derives storm steering heading, speed, and track curvature from tensor convective mass."""
    ir_channel = x_raw[:, :, 0]
    
    # Cold cloud top centroid (< 10th percentile brightness temperature)
    thresh = np.percentile(ir_channel, 10)
    y_idx, x_idx = np.where(ir_channel <= thresh)
    
    if len(x_idx) > 0:
        cx, cy = np.mean(x_idx), np.mean(y_idx)
        off_x = (cx - 100.0) / 100.0
        off_y = (cy - 100.0) / 100.0
        
        heading = (np.degrees(np.arctan2(off_x, -off_y)) + 360) % 360
        speed = max(5.0, min(25.0, 10.0 + np.sqrt(off_x**2 + off_y**2) * 15.0))
        curvature = off_x * 0.08
    else:
        heading, speed, curvature = 315.0, 11.5, 0.0
        
    return float(heading), float(speed), float(curvature)

def build_past_sequence_from_motion(heading, speed, vmax):
    """Constructs a (1, 4, 4) tensor representing past 18 hours of motion history."""
    rad = np.radians(heading)
    dx = speed * np.sin(rad) * 0.05
    dy = speed * np.cos(rad) * 0.05
    
    seq = []
    for t in range(4):
        scale = (t + 1) / 4.0
        seq.append([dx * scale, dy * scale, vmax / 100.0, speed / 30.0])
        
    return np.array([seq], dtype=np.float32)

# ==========================================
# 4. SEQ2SEQ TRAJECTORY PREDICTION
# ==========================================
def predict_trajectory_seq2seq(model, past_features, start_lat, start_lon, heading, speed, curvature, hours=72, step=6):
    """Predicts future eye coordinates at 6-hour steps up to 72 hours using Seq2Seq model dynamics."""
    steps = hours // step
    raw_preds = model.predict(past_features, verbose=0)[0]
    
    traj_points = []
    curr_lat, curr_lon = float(start_lat), float(start_lon)
    rad = np.radians(heading)
    
    # Kinematic baseline initial setup
    dl_weight = 0.5
    phys_weight = 0.5
    
    now = pd.Timestamp.now()
    
    for i in range(steps):
        h = (i + 1) * step
        
        # Calculate current physical steering based on updated heading
        rad = np.radians(heading)
        base_dlat = (speed * np.cos(rad) * step) / 60.0
        base_dlon = (speed * np.sin(rad) * step) / (60.0 * np.cos(np.radians(curr_lat)) + 1e-5)
        
        # Blend deep learning predictions with physical steering dynamics
        dl_dlat = float(raw_preds[i][0]) if i < len(raw_preds) else 0.0
        dl_dlon = float(raw_preds[i][1]) if i < len(raw_preds) else 0.0
        
        d_lat = dl_dlat * dl_weight + base_dlat * phys_weight
        d_lon = dl_dlon * dl_weight + base_dlon * phys_weight
        
        curr_lat += d_lat
        curr_lon += d_lon
        
        # Simulate natural Coriolis recurvature (turn right as latitude increases)
        # Use the region-specific curvature parameter, slightly increasing as it moves north
        recurvature_rate = curvature + max(0, (curr_lat - start_lat) * 0.15)
        heading = (heading + recurvature_rate) % 360.0
        
        # Apply intense land friction/dissipation if far inland (e.g., North of 22 deg)
        # This prevents overland depressions from blasting 1000km over the Himalayas
        if curr_lat > 22.0:
            speed = max(0.5, speed * 0.65)  # Rapidly decay speed by 35% every 6 hours over deep land
        
        t_proj = (now + pd.Timedelta(hours=h)).strftime("%Y-%m-%d %H:00 UTC")
        
        traj_points.append({
            "hour": h,
            "time": t_proj,
            "lat": round(curr_lat, 2),
            "lon": round(curr_lon, 2),
            "d_lat": round(d_lat, 2),
            "d_lon": round(d_lon, 2)
        })
        
    return traj_points

# ==========================================
# 5. CONE OF UNCERTAINTY & LANDFALL GEOSPATIAL
# ==========================================
def generate_cone_of_uncertainty(traj_points, start_lat, start_lon):
    """Generates a track-aligned cone whose radius grows with forecast hour."""
    if not traj_points:
        return []

    left_edge, right_edge = [], []
    prev_lat, prev_lon = float(start_lat), float(start_lon)

    for pt in traj_points:
        h = pt["hour"]
        lat, lon = float(pt["lat"]), float(pt["lon"])
        # ~30 km at +6h to ~220 km at +72h
        radius = 0.28 + (h / 72.0) * 1.70
        dlat = lat - prev_lat
        dlon = lon - prev_lon
        mag = max((dlat ** 2 + dlon ** 2) ** 0.5, 1e-6)
        plat, plon = (-dlon / mag) * radius, (dlat / mag) * radius
        left_edge.append([lat + plat, lon + plon])
        right_edge.append([lat - plat, lon - plon])
        prev_lat, prev_lon = lat, lon

    return [[start_lat, start_lon]] + left_edge + right_edge[::-1] + [[start_lat, start_lon]]

def is_over_land(lat, lon):
    """Spatial land lookup with global_land_mask or fallback geometric bounds."""
    if HAS_LAND_MASK:
        try:
            return bool(globe.is_land(lat, lon))
        except Exception:
            pass
            
    # Fallback geographic boundary check for North America / India / Asia landmasses
    if (8.0 <= lat <= 35.0 and 68.0 <= lon <= 89.0) and not (10.0 <= lat <= 20.0 and 82.0 <= lon <= 92.0):
        return True
    if (24.0 <= lat <= 49.0 and -125.0 <= lon <= -66.0):
        return True
    return False

# ==========================================
# 6. HAVERSINE DISTANCE & DISASTER ADVISORY
# ==========================================
def haversine_km(lat1, lon1, lat2, lon2):
    """Calculates great-circle distance between two geographic points in kilometers."""
    R = 6371.0
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = np.sin(dlat / 2.0)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2.0)**2
    return float(2 * R * np.arcsin(np.sqrt(a)))

def assess_imd_alert_level(traj_points, start_lat, start_lon, vmax):
    """Evaluates proximity to cities along the FORECAST TRACK and issues NDMA / MoES SOP alerts.
    
    Uses the trajectory points (future forecast) — NOT the original detection coordinate —
    so that alerts reflect where the storm IS GOING, not where it was detected.
    """
    impacts = []
    
    for city in ALL_WATCH_CITIES:
        min_dist = 99999.0
        eta_h = 0
        eta_time = "Current"
        
        # Also check the current live position (start_lat/lon = current override)
        d_now = haversine_km(start_lat, start_lon, city["lat"], city["lon"])
        if d_now < min_dist:
            min_dist = d_now
            eta_h = 0
            eta_time = "Now"
        
        # Scan forward along predicted track only
        for pt in traj_points:
            d = haversine_km(pt["lat"], pt["lon"], city["lat"], city["lon"])
            if d < min_dist:
                min_dist = d
                eta_h = pt["hour"]
                eta_time = pt["time"]
                
        if min_dist <= 500.0:
            if min_dist <= 100.0:
                alert = "RED ALERT (Direct Hit)"
            elif min_dist <= 300.0:
                alert = "ORANGE ALERT (Severe Watch)"
            else:
                alert = "YELLOW ALERT (Advisory)"
                
            impacts.append({
                "city": city["city"],
                "state": city["state"],
                "country": city["country"],
                "dist_km": round(min_dist, 1),
                "eta_hour": f"+{eta_h}h" if eta_h > 0 else "0h (Current)",
                "eta_time": eta_time,
                "alert": alert
            })
            
    impacts.sort(key=lambda x: x["dist_km"])
    
    if impacts:
        primary = impacts[0]
        closest_dist = primary["dist_km"]
        primary_sector = f"{primary['city']}, {primary['state']} ({primary['country']})"
        eta_str = f"{primary['eta_hour']} ({primary['eta_time']})"
        
        if closest_dist <= 150.0 or vmax >= 64.0:
            level = "RED ALERT"
            badge = "🚨 RED ALERT: IMMEDIATE COASTAL EVACUATION MANDATED"
            action = "Activate NDMA Response SOP Tier 1. Complete coastal evacuations within 12h. Port Operations Halton."
        elif closest_dist <= 350.0:
            level = "ORANGE ALERT"
            badge = "⚠️ ORANGE ALERT: PREPARE FOR SEVERE CYCLONIC IMPACT"
            action = "Position NDRF/SDRF teams. Issue fisherfolk warnings. Suspend offshore oil and marine transport."
        else:
            level = "YELLOW ALERT"
            badge = "🟡 YELLOW ALERT: CYCLONIC WATCH IN EFFECT"
            action = "Monitor satellite track updates every 3 hours. Inspect storm surge infrastructure."
    else:
        level = "GREEN ALERT"
        badge = "🟢 GREEN ALERT: NO IMMEDIATE COASTAL THREAT DETECTED"
        primary_sector = "Deep Oceanic Waters"
        closest_dist = "> 650.0"
        eta_str = "N/A"
        action = "Standard routine oceanic monitoring. No emergency response required."
        
    return {
        "level": level,
        "badge": badge,
        "primary_target": primary_sector,
        "dist_km": f"{closest_dist} km" if isinstance(closest_dist, (int, float)) else closest_dist,
        "eta": eta_str,
        "action": action,
        "impacts": impacts
    }