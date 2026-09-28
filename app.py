import os
import re
import h5py
import numpy as np
import pandas as pd
import tensorflow as tf
import streamlit as st
import matplotlib.pyplot as plt
import folium
from streamlit_folium import st_folium
from io import BytesIO

# PDF Generation Dependencies (ReportLab)
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# Import Stage 3 Trajectory Module Functions
try:
    from stage3.trajectory import (
        build_seq2seq_trajectory_model,
        derive_convective_centroid_motion,
        build_past_sequence_from_motion,
        predict_trajectory_seq2seq,
        generate_cone_of_uncertainty,
        assess_imd_alert_level,
        is_over_land
    )
except ModuleNotFoundError:
    from trajectory import (
        build_seq2seq_trajectory_model,
        derive_convective_centroid_motion,
        build_past_sequence_from_motion,
        predict_trajectory_seq2seq,
        generate_cone_of_uncertainty,
        assess_imd_alert_level,
        is_over_land
    )

# ==========================================
# 1. SETUP & PATHS
# ==========================================
st.set_page_config(page_title="MoES AI Cyclone Dashboard", layout="wide")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Check for available dataset path
DATA_H5 = os.path.join(BASE_DIR, 'data', 'raw', 'TCIR-CPAC_IO_SH.h5')
if not os.path.exists(DATA_H5):
    DATA_H5 = os.path.join(BASE_DIR, 'data', 'raw', 'TCIR-ALL_2017.h5')

STAGE1_MODEL_PATH = os.path.join(BASE_DIR, 'stage1_detector.h5')
STAGE2_MODEL_PATH = os.path.join(BASE_DIR, 'stage2_intensity_regressor.h5')
STAGE3_MODEL_PATH = os.path.join(BASE_DIR, 'stage3_seq2seq_trajectory.h5')

STAGE1_STATS = os.path.join(BASE_DIR, 'stage1_stats.npz')
STAGE2_STATS = os.path.join(BASE_DIR, 'stage2_stats.npz')

@st.cache_resource
def load_models():
    s1 = tf.keras.models.load_model(STAGE1_MODEL_PATH, compile=False)
    s2 = tf.keras.models.load_model(STAGE2_MODEL_PATH, compile=False)
    
    alt_stage3_path = os.path.join(BASE_DIR, 'stage3', 'stage3_seq2seq_trajectory.h5')
    if os.path.exists(STAGE3_MODEL_PATH):
        s3 = tf.keras.models.load_model(STAGE3_MODEL_PATH, compile=False)
    elif os.path.exists(alt_stage3_path):
        s3 = tf.keras.models.load_model(alt_stage3_path, compile=False)
    else:
        s3 = build_seq2seq_trajectory_model(input_timesteps=4, feature_dim=4, forecast_steps=12)
        s3.save(STAGE3_MODEL_PATH)
        
    return s1, s2, s3

stage1_model, stage2_model, stage3_model = load_models()

# ==========================================
# 2. HELPER FUNCTIONS
# ==========================================
def normalize_tensor(x_raw, stats_path):
    stats = np.load(stats_path)
    means, stds = stats['means'], stats['stds']
    x_norm = np.zeros_like(x_raw, dtype=np.float32)
    valid_bounds = [(150.0, 350.0), (150.0, 350.0), (0.0, 1.0), (100.0, 350.0)]

    for c in range(4):
        ch = x_raw[:, :, c].copy()
        c_min, c_max = valid_bounds[c]
        invalid_mask = (ch < c_min) | (ch > c_max) | np.isnan(ch) | np.isinf(ch)
        ch[invalid_mask] = means[c]
        x_norm[:, :, c] = (ch - means[c]) / stds[c]

    return np.nan_to_num(x_norm, nan=0.0)

def map_imd_category(vmax):
    if vmax < 34.0:
        return "Depression / Deep Depression"
    elif vmax < 48.0:
        return "Cyclonic Storm (CS)"
    elif vmax < 64.0:
        return "Severe Cyclonic Storm (SCS)"
    elif vmax < 90.0:
        return "Very Severe Cyclonic Storm (VSCS)"
    elif vmax < 120.0:
        return "Extremely Severe Cyclonic Storm (ESCS)"
    else:
        return "Super Cyclonic Storm (SuCS)"

def generate_pdf_bulletin(s1_prob, lat_input, lon_input, pred_vmax, imd_cat, alert_info, traj_points):
    """Generates an executive operational PDF weather bulletin in memory."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter, 
        rightMargin=36, 
        leftMargin=36, 
        topMargin=36, 
        bottomMargin=36
    )
    story = []
    styles = getSampleStyleSheet()

    primary_color = colors.HexColor('#1A365D')
    secondary_color = colors.HexColor('#2B6CB0')
    accent_color = colors.HexColor('#E53E3E') if alert_info['level'] == 'RED ALERT' else colors.HexColor('#DD6B20')

    title_style = ParagraphStyle(
        'TitleStyle', parent=styles['Heading1'], fontSize=13, leading=16,
        textColor=primary_color, alignment=1, fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'SubTitleStyle', parent=styles['Normal'], fontSize=9, leading=12,
        textColor=colors.HexColor('#4A5568'), alignment=1, fontName='Helvetica-Bold'
    )
    section_heading = ParagraphStyle(
        'SecHeading', parent=styles['Heading3'], fontSize=10, leading=13,
        textColor=primary_color, fontName='Helvetica-Bold', spaceBefore=6, spaceAfter=4
    )
    cell_style = ParagraphStyle('Cell', parent=styles['Normal'], fontSize=8, leading=10)
    cell_bold = ParagraphStyle('CellB', parent=styles['Normal'], fontSize=8, leading=10, fontName='Helvetica-Bold')

    # Header
    story.append(Paragraph("MINISTRY OF EARTH SCIENCES (MoES) / INDIA METEOROLOGICAL DEPT", title_style))
    story.append(Paragraph("NATIONAL DISASTER MANAGEMENT AUTHORITY (NDMA) — OPERATIONAL BULLETIN", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))

    # Executive Summary Box
    summary_data = [
        [Paragraph("<b>Generated UTC:</b>", cell_style), Paragraph(pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"), cell_style),
         Paragraph("<b>Stage 1 Conf:</b>", cell_style), Paragraph(f"{s1_prob*100:.1f}%", cell_bold)],
        [Paragraph("<b>Eye Coordinates:</b>", cell_style), Paragraph(f"{lat_input:.2f}°N, {lon_input:.2f}°E", cell_style),
         Paragraph("<b>Estimated Vmax:</b>", cell_style), Paragraph(f"{pred_vmax:.1f} kts", cell_bold)],
        [Paragraph("<b>Classification:</b>", cell_style), Paragraph(f"{imd_cat}", cell_style),
         Paragraph("<b>Official Status:</b>", cell_style), Paragraph(f"<font color='{accent_color}'><b>{alert_info['level']}</b></font>", cell_style)]
    ]
    t_summary = Table(summary_data, colWidths=[90, 170, 90, 170])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F7FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 8))

    # Mandated Directives
    story.append(Paragraph("<b>Coastal Threat Analysis & Emergency Directives</b>", section_heading))
    story.append(Paragraph(f"<b>Primary Target Sector:</b> {alert_info['primary_target']} | <b>Min Distance:</b> {alert_info['dist_km']} | <b>ETA:</b> {alert_info['eta']}", cell_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph(f"<b>Mandated Response (NDMA SOP):</b> {alert_info['action']}", cell_style))
    story.append(Spacer(1, 8))

    # Regional Impact Table
    story.append(Paragraph("<b>Regional Impact Matrix (Watch Sectors)</b>", section_heading))
    if alert_info["impacts"]:
        impact_table = [["City / Port", "State / Province", "Country", "Distance", "ETA Horizon", "Threat Level"]]
        for imp in alert_info["impacts"][:6]:
            impact_table.append([
                Paragraph(imp["city"], cell_style),
                Paragraph(imp["state"], cell_style),
                Paragraph(imp["country"], cell_style),
                Paragraph(f"{imp['dist_km']} km", cell_style),
                Paragraph(imp["eta_hour"], cell_style),
                Paragraph(imp["alert"], cell_bold)
            ])
        t_impact = Table(impact_table, colWidths=[90, 100, 90, 60, 60, 120])
        t_impact.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), secondary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('PADDING', (0,0), (-1,-1), 3),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E0')),
        ]))
        story.append(t_impact)
    else:
        story.append(Paragraph("No land sectors detected in watch radius. Track remains deep oceanic.", cell_style))

    story.append(Spacer(1, 8))

    # 72-Hour Trajectory Table
    story.append(Paragraph("<b>72-Hour Seq2Seq AI Trajectory Forecast Timeline</b>", section_heading))
    traj_table = [["+h", "Projected UTC Time", "Lat (°N)", "Lon (°E)", "Delta Drift", "Status"]]
    for pt in traj_points:
        traj_table.append([
            Paragraph(f"+{pt['hour']}h", cell_style),
            Paragraph(pt["time"], cell_style),
            Paragraph(f"{pt['lat']:.2f}", cell_style),
            Paragraph(f"{pt['lon']:.2f}", cell_style),
            Paragraph(f"Δ{pt['d_lat']}°, Δ{pt['d_lon']}°", cell_style),
            Paragraph(pt["status"], cell_style)
        ])
    t_traj = Table(traj_table, colWidths=[35, 130, 60, 60, 90, 145])
    t_traj.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('PADDING', (0,0), (-1,-1), 2.5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E0')),
    ]))
    story.append(t_traj)

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

# ==========================================
# 3. DASHBOARD SIDEBAR CONTROLS
# ==========================================
st.sidebar.title("Cyclone Control Panel")

# Initialize default session state coordinates if missing
if "lat_val" not in st.session_state:
    st.session_state["lat_val"] = 15.50
if "lon_val" not in st.session_state:
    st.session_state["lon_val"] = 88.20

data_mode = st.sidebar.radio("Data Source Mode", ["Upload Custom NumPy (.npy)", "Dataset Index"])

if data_mode == "Dataset Index":
    sample_idx = st.sidebar.number_input("HDF5 Sample Index", min_value=0, max_value=10000, value=0, step=1)
    if os.path.exists(DATA_H5):
        with h5py.File(DATA_H5, 'r') as f:
            x_raw = f['matrix'][sample_idx]
            cols = [col.decode('utf-8').strip().lower() for col in f['info/block0_items'][:]]
            raw_vals = f['info/block0_values'][:]
            
            # Handle transposed block structure safely
            if raw_vals.shape[0] == len(cols):
                raw_vals = raw_vals.T
                
            df_info = pd.DataFrame(raw_vals[sample_idx:sample_idx+1], columns=cols)
            
            if 'lat' in df_info.columns and 'lon' in df_info.columns:
                st.session_state["lat_val"] = float(df_info['lat'].values[0])
                st.session_state["lon_val"] = float(df_info['lon'].values[0])
    else:
        st.error(f"HDF5 dataset not found at {DATA_H5}")
        st.stop()
else:
    uploaded_file = st.sidebar.file_uploader("Upload Satellite Tensor (.npy)", type=["npy"])
    if uploaded_file is not None:
        filename = uploaded_file.name
        x_raw = np.load(uploaded_file)

        if x_raw.ndim != 3 or x_raw.shape != (201, 201, 4):
            st.error(f"Invalid tensor shape {x_raw.shape}! Expected shape: (201, 201, 4).")
            st.stop()

        # Extract latitude and longitude encoded in filename (e.g. lat15.50_lon88.20)
        match = re.search(r"lat(-?\d+\.?\d*)_lon(-?\d+\.?\d*)", filename, re.IGNORECASE)
        if match:
            parsed_lat = float(match.group(1))
            parsed_lon = float(match.group(2))
            st.session_state["lat_val"] = parsed_lat
            st.session_state["lon_val"] = parsed_lon
            st.sidebar.success(f"📍 Location Parsed: {parsed_lat:.2f}°N, {parsed_lon:.2f}°E")
        else:
            st.sidebar.info("ℹ️ Standard file uploaded. Set coordinates manually below if needed.")
    else:
        st.info("👈 Upload a `.npy` satellite tensor of shape `(201, 201, 4)` in the sidebar to begin inference.")
        st.stop()

st.sidebar.subheader("Geographic Coordinates")
lat_input = st.sidebar.number_input("Latitude (°N)", key="lat_val", format="%.2f")
lon_input = st.sidebar.number_input("Longitude (°E)", key="lon_val", format="%.2f")

auto_heading, auto_speed, auto_curvature = derive_convective_centroid_motion(x_raw)

st.sidebar.subheader("Automated Motion Analysis")
st.sidebar.info(f"**Derived Steering Heading:** {auto_heading:.1f}°")
st.sidebar.info(f"**Derived Forward Speed:** {auto_speed:.1f} kts")

# ==========================================
# 4. MAIN PANEL LAYOUT
# ==========================================
st.title("Multi-Stage AI Tropical Cyclone Pipeline")
st.markdown("##### Ministry of Earth Sciences (MoES) Multi-Spectral Prediction & Trajectory System")

# DISPLAY SATELLITE CHANNELS
st.subheader("1. Multi-Spectral Satellite Input Tensors (201x201)")
fig, axes = plt.subplots(1, 4, figsize=(16, 3.8))
channel_names = ["IR1 (Thermal)", "WV (Water Vapor)", "VIS (Visible)", "PMW (Microwave)"]
cmaps = ['inferno', 'BuPu', 'gray', 'magma']

for i in range(4):
    axes[i].imshow(x_raw[:, :, i], cmap=cmaps[i])
    axes[i].set_title(channel_names[i])
    axes[i].axis('off')
plt.tight_layout()
st.pyplot(fig)

st.divider()

# --- STAGE 1: IDENTIFICATION ---
x_s1 = np.expand_dims(normalize_tensor(x_raw, STAGE1_STATS), axis=0)
s1_prob = float(stage1_model.predict(x_s1, verbose=0)[0][0])

col1, col2, col3 = st.columns(3)

with col1:
    st.subheader("Stage 1: Identification")
    st.metric("Cyclone Probability", f"{s1_prob * 100:.1f}%")
    if s1_prob >= 0.50:
        st.success("ACTIVE CYCLONE DETECTED")
    else:
        st.error("NO CYCLONE DETECTED")

# --- STAGE 2 & STAGE 3 EXECUTION ---
if s1_prob >= 0.50:
    x_s2 = np.expand_dims(normalize_tensor(x_raw, STAGE2_STATS), axis=0)
    pred_vmax = float(stage2_model.predict(x_s2, verbose=0)[0][0])
    imd_cat = map_imd_category(pred_vmax)
    tier_3class = "LOW (<50 kts)" if pred_vmax < 50 else ("MEDIUM (50-74 kts)" if pred_vmax < 75 else "HIGH (>=75 kts)")

    with col2:
        st.subheader("Stage 2: Intensity Prediction")
        st.metric("Predicted Vmax", f"{pred_vmax:.1f} kts")

    with col3:
        st.subheader("Classification Tiers")
        st.info(f"**3-Class Tier:** {tier_3class}")
        st.warning(f"**Official Scale:** {imd_cat}")

    # ==========================================
    # 5. GEOGRAPHIC MAP & SEQ2SEQ TRAJECTORY FORECAST
    # ==========================================
    st.divider()
    st.subheader("2. Interactive Pinpoint Location & Track Forecast")

    heading, speed, curvature = derive_convective_centroid_motion(x_raw, vmax=pred_vmax)
    past_seq = build_past_sequence_from_motion(heading=heading, speed=speed, vmax=pred_vmax)

    traj_points = predict_trajectory_seq2seq(
        model=stage3_model,
        past_features=past_seq,
        start_lat=lat_input,
        start_lon=lon_input,
        heading=heading,
        speed=speed,
        curvature=curvature,
        hours=72,
        step=6
    )

    for pt in traj_points:
        pt["status"] = "LANDFALL / OVER LAND" if is_over_land(pt["lat"], pt["lon"]) else "ACTIVE OCEANIC"

    st.markdown("#### ⏱️ Forecast Horizon Time Inspector")
    selected_hour = st.slider(
        "Scrub Forecast Hour (+h)", 
        min_value=6, 
        max_value=72, 
        value=24, 
        step=6,
        key="time_slider",
        help="Select a specific forecast hour to highlight on the map."
    )

    selected_pt = next((p for p in traj_points if p["hour"] == selected_hour), traj_points[0])

    m_col1, m_col2, m_col3, m_col4 = st.columns([1.0, 1.4, 1.4, 1.2])
    m_col1.metric("Selected Horizon", f"+{selected_pt['hour']} Hours")
    m_col2.metric("Projected Coords", f"{selected_pt['lat']:.2f}°N, {selected_pt['lon']:.2f}°E")
    m_col3.metric("6h Delta Drift", f"ΔLat: {selected_pt['d_lat']}°, ΔLon: {selected_pt['d_lon']}°")
    
    if selected_pt["status"] == "LANDFALL / OVER LAND":
        m_col4.error(f"⚠️ {selected_pt['status']}")
    else:
        m_col4.success(f"🌊 {selected_pt['status']}")

    cone_polygon = generate_cone_of_uncertainty(traj_points, lat_input, lon_input)

    # ------------------------------------------
    # MAP WITH DYNAMIC RE-RENDER KEY & HIGHLIGHTS
    # ------------------------------------------
    m = folium.Map(location=[selected_pt['lat'], selected_pt['lon']], zoom_start=6, tiles=None)

    # Base Tile 1: Street Map
    folium.TileLayer('OpenStreetMap', name='Street Map').add_to(m)

    # Base Tile 2: Dark Canvas
    folium.TileLayer(
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attr="Esri", 
        name="Dark Canvas", 
        overlay=False, 
        control=True
    ).add_to(m)

    # Base Tile 3: Satellite Imagery
    folium.TileLayer(
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attr="Esri", 
        name="Satellite Imagery", 
        overlay=False, 
        control=True
    ).add_to(m)

    # Overlay Checkbox 1: Uncertainty Cone
    cone_group = folium.FeatureGroup(name="Probability Cone", show=True).add_to(m)
    folium.Polygon(
        locations=cone_polygon, color="#3182bd", fill=True, fill_color="#6baed6",
        fill_opacity=0.25, weight=1, popup="72h Track Probability Cone"
    ).add_to(cone_group)

    # Overlay Checkbox 2: Seq2Seq AI Track Polyline
    track_group = folium.FeatureGroup(name="Seq2Seq AI Track", show=True).add_to(m)
    path_coords = [[lat_input, lon_input]] + [[pt["lat"], pt["lon"]] for pt in traj_points]
    folium.PolyLine(path_coords, color="#00ffff", weight=4, opacity=0.9).add_to(track_group)

    # Original Eye Position Marker
    folium.Marker(
        [lat_input, lon_input],
        popup=f"Current Eye Location\nLat: {lat_input:.2f}°N, Lon: {lon_input:.2f}°E\nVmax: {pred_vmax:.1f} kts",
        icon=folium.Icon(color="gray", icon="crosshairs", prefix="fa")
    ).add_to(m)

    # Render All Forecast Track Points with Selected Highlight
    for pt in traj_points:
        is_selected = (pt["hour"] == selected_hour)
        
        if is_selected:
            # Highlight selected point with a large target marker and halo ring
            folium.Marker(
                location=[pt["lat"], pt["lon"]],
                popup=folium.Popup(f"<b>SELECTED: +{pt['hour']}h Horizon</b><br>Lat: {pt['lat']:.2f}°N, Lon: {pt['lon']:.2f}°E<br>Status: {pt['status']}", show=True),
                icon=folium.Icon(color="red", icon="bullseye", prefix="fa")
            ).add_to(m)
            
            folium.CircleMarker(
                location=[pt["lat"], pt["lon"]],
                radius=18,
                color="#ff0000",
                fill=True,
                fill_color="#ff4d4d",
                fill_opacity=0.4
            ).add_to(m)
        else:
            pt_color = "orange" if pt["status"] == "LANDFALL / OVER LAND" else "#3388ff"
            folium.CircleMarker(
                location=[pt["lat"], pt["lon"]],
                radius=6,
                popup=f"+{pt['hour']}h | Lat: {pt['lat']:.2f}°N, Lon: {pt['lon']:.2f}°E",
                color=pt_color,
                fill=True,
                fill_color=pt_color,
                fill_opacity=0.8
            ).add_to(track_group)

    folium.LayerControl(position="topright", collapsed=False).add_to(m)
    
    # Adding key=f"folium_map_{selected_hour}" forces Streamlit to re-render the map instantly when scrubbing
    st_folium(m, width=1200, height=520, key=f"folium_map_{selected_hour}")

    # Forecast Timeline Table
    st.subheader("Seq2Seq Track Forecast Timeline")
    df_traj = pd.DataFrame(traj_points)
    st.dataframe(
        df_traj[["hour", "time", "lat", "lon", "d_lat", "d_lon", "status"]].rename(columns={
            "hour": "Forecast Hours (+h)",
            "time": "Projected UTC Time",
            "lat": "Projected Lat (°N)",
            "lon": "Projected Lon (°E)",
            "d_lat": "Delta Lat (°)",
            "d_lon": "Delta Lon (°)",
            "status": "Landfall / System Status"
        }), 
        use_container_width=True
    )

    # ==========================================
    # 6. NDMA & MOES DISASTER ADVISORY SYSTEM
    # ==========================================
    st.divider()
    st.subheader("3. Ministry of Earth Sciences (MoES) Official Early Warning Advisory")

    alert_info = assess_imd_alert_level(traj_points, lat_input, lon_input, pred_vmax)

    if alert_info["level"] == "RED ALERT":
        st.error(f"### {alert_info['badge']}")
    elif alert_info["level"] == "ORANGE ALERT":
        st.warning(f"### {alert_info['badge']}")
    elif alert_info["level"] == "YELLOW ALERT":
        st.info(f"### {alert_info['badge']}")
    else:
        st.success(f"### {alert_info['badge']}")

    card_col1, card_col2 = st.columns(2)

    with card_col1:
        st.markdown(f"""
        **📍 Primary Sector Target:** `{alert_info['primary_target']}`  
        **📏 Distance to Sector:** `{alert_info['dist_km']}`  
        **⏱️ Forecast Arrival Horizon (ETA):** `{alert_info['eta']}`
        """)

    with card_col2:
        st.markdown(f"""
        **🌀 Max Wind Speed at Eye:** `{pred_vmax:.1f} kts`  
        **📊 System Scale:** `{imd_cat}`  
        **🛡️ Mandated Response (SOP):** {alert_info['action']}
        """)

    st.markdown("---")
    st.subheader("🌍 Multi-State & Multi-Country Coastal Threat Matrix")
    st.markdown("Automated spatial analysis across all regional coastal sectors sorted by distance:")

    if alert_info["impacts"]:
        df_impacts = pd.DataFrame(alert_info["impacts"])
        st.dataframe(
            df_impacts.rename(columns={
                "city": "Coastal City / Port",
                "state": "State / Province",
                "country": "Country",
                "dist_km": "Min Distance (km)",
                "eta_hour": "ETA Horizon",
                "eta_time": "Projected Arrival (UTC)",
                "alert": "Threat Status"
            }),
            use_container_width=True
        )
    else:
        st.info("🌊 No coastal states or countries fall within the 650 km impact watch zone. The storm remains deep offshore.")

    # ==========================================
    # 7. ONE-CLICK PDF BULLETIN GENERATOR
    # ==========================================
    st.divider()
    
    pdf_bytes = generate_pdf_bulletin(
        s1_prob=s1_prob,
        lat_input=lat_input,
        lon_input=lon_input,
        pred_vmax=pred_vmax,
        imd_cat=imd_cat,
        alert_info=alert_info,
        traj_points=traj_points
    )

    btn_col1, btn_col2, btn_col3 = st.columns([1, 2, 1])
    with btn_col2:
        st.download_button(
            label="📄 Download Official MoES Operational Weather Bulletin (.pdf)",
            data=pdf_bytes,
            file_name=f"MoES_Cyclone_Advisory_{pd.Timestamp.now().strftime('%Y%m%d_%H%M')}.pdf",
            mime="application/pdf",
            use_container_width=True
        )

else:
    st.warning("Stage 2 and Trajectory Forecasting are disabled because Stage 1 classified this input as Non-Cyclonic Noise.")