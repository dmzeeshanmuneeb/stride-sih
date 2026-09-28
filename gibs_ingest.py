"""NASA GIBS / Worldview Snapshot ingest for Stride 4-channel tensors.

MOSDAC/INSAT-3DS would supply IR, WV, VIS, and PMW. GIBS publicly exposes
the first three as daily mosaics. Channel 4 (passive microwave) is synthesized
from IR+WV ice-scattering structure so Stage 1–3 still receive (201, 201, 4).
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

import numpy as np
import requests
import tensorflow as tf

WVS_URL = "https://wvs.earthdata.nasa.gov/api/v1/snapshot"
TARGET_SIZE = 201
HALF_DEG = 4.0  # ~440 km radius, comparable to TCIR crop scale
TIMEOUT = 25

# Native GIBS layers (3 spectral families). Order = fallbacks.
IR_LAYERS = [
    "MODIS_Terra_Brightness_Temp_Band31_Night",
    "MODIS_Terra_Brightness_Temp_Band31_Day",
    "VIIRS_SNPP_Brightness_Temp_BandI5_Night",
]
WV_LAYERS = [
    "MODIS_Terra_Water_Vapor_5km_Night",
    "MODIS_Aqua_Water_Vapor_5km_Night",
]
VIS_LAYERS = [
    "MODIS_Terra_CorrectedReflectance_TrueColor",
    "VIIRS_SNPP_CorrectedReflectance_TrueColor",
]

_CACHE: dict[str, tuple[np.ndarray, dict]] = {}


def _dates_to_try(n: int = 4) -> list[str]:
    today = datetime.now(timezone.utc).date()
    # GIBS mosaics lag ~1 day; skip "today" first.
    return [(today - timedelta(days=i)).isoformat() for i in range(1, n + 1)]


def _bbox(lat: float, lon: float) -> str:
    west = lon - HALF_DEG
    south = lat - HALF_DEG
    east = lon + HALF_DEG
    north = lat + HALF_DEG
    return f"{west:.4f},{south:.4f},{east:.4f},{north:.4f}"


def _decode_rgb(content: bytes) -> Optional[np.ndarray]:
    try:
        img = tf.io.decode_image(content, channels=3, expand_animations=False)
        arr = img.numpy()
        if arr.size == 0:
            return None
        return arr.astype(np.float32)
    except Exception:
        return None


def _luma01(rgb: np.ndarray) -> np.ndarray:
    if rgb.ndim == 2:
        g = rgb.astype(np.float32)
    else:
        g = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    if float(np.nanmax(g)) > 1.5:
        g = g / 255.0
    return np.clip(g, 0.0, 1.0)


def _resize(channel: np.ndarray) -> np.ndarray:
    t = tf.convert_to_tensor(channel[..., np.newaxis], dtype=tf.float32)
    out = tf.image.resize(t, [TARGET_SIZE, TARGET_SIZE], method="bilinear")
    return out.numpy()[:, :, 0]


def _fetch_layer(layer: str, date: str, bbox: str) -> Optional[np.ndarray]:
    params = {
        "REQUEST": "GetSnapshot",
        "TIME": date,
        "BBOX": bbox,
        "CRS": "EPSG:4326",
        "LAYERS": layer,
        "FORMAT": "image/png",
        "WIDTH": str(TARGET_SIZE),
        "HEIGHT": str(TARGET_SIZE),
        "WRAP": "DAY",
    }
    try:
        r = requests.get(WVS_URL, params=params, timeout=TIMEOUT)
    except Exception:
        return None
    if r.status_code != 200 or "image" not in (r.headers.get("content-type") or ""):
        return None
    if str(r.headers.get("Data-Present", "true")).lower() == "false":
        return None
    rgb = _decode_rgb(r.content)
    if rgb is None:
        return None
    luma = _luma01(rgb)
    if float(np.mean(luma)) < 0.015 and float(np.max(luma)) < 0.05:
        return None
    if rgb.shape[0] != TARGET_SIZE or rgb.shape[1] != TARGET_SIZE:
        return _resize(luma)
    return luma


def _first_available(layers: list[str], dates: list[str], bbox: str) -> tuple[Optional[np.ndarray], Optional[str], Optional[str]]:
    for date in dates:
        for layer in layers:
            arr = _fetch_layer(layer, date, bbox)
            if arr is not None:
                return arr, layer, date
    return None, None, None


def _to_kelvin(luma: np.ndarray, t_warm: float, t_cold: float) -> np.ndarray:
    """Map GIBS visualization luma to brightness temperature.

    Cold cloud tops are typically bright (high luma) on IR/WV GIBS palettes.
    """
    return t_warm - luma * (t_warm - t_cold)


def _synthesize_pmw(ir_k: np.ndarray, wv_k: np.ndarray) -> np.ndarray:
    """Passive-microwave proxy: ice scattering in deep convection lowers 85 GHz BT."""
    pmw = 0.62 * ir_k + 0.38 * wv_k
    pmw = np.where(ir_k < 220.0, pmw - 28.0, pmw)
    return np.clip(pmw, 100.0, 350.0).astype(np.float32)


def fetch_multispectral_tensor(lat: float, lon: float) -> tuple[np.ndarray, dict]:
    """Return (201, 201, 4) tensor in TCIR physical units plus provenance."""
    cache_key = f"{round(lat, 2):.2f},{round(lon, 2):.2f}"
    if cache_key in _CACHE:
        return _CACHE[cache_key]

    bbox = _bbox(lat, lon)
    dates = _dates_to_try()
    meta = {
        "source": "NASA GIBS / Worldview Snapshot",
        "note": "IR, WV, VIS from GIBS. PMW synthesized (GIBS has no 85 GHz TC channel).",
        "layers": {},
        "dates": {},
        "bbox": bbox,
    }

    ir_luma, ir_layer, ir_date = _first_available(IR_LAYERS, dates, bbox)
    wv_luma, wv_layer, wv_date = _first_available(WV_LAYERS, dates, bbox)
    vis_luma, vis_layer, vis_date = _first_available(VIS_LAYERS, dates, bbox)

    if ir_luma is None:
        raise RuntimeError("NASA GIBS IR brightness-temperature mosaic unavailable")

    ir_k = _to_kelvin(ir_luma, t_warm=310.0, t_cold=180.0)
    if wv_luma is None:
        wv_k = np.clip(ir_k + 8.0, 150.0, 350.0)
        wv_layer, wv_date = "derived_from_IR", ir_date
    else:
        wv_k = _to_kelvin(wv_luma, t_warm=250.0, t_cold=190.0)

    if vis_luma is None or float(np.mean(vis_luma)) < 0.04:
        vis = np.clip((310.0 - ir_k) / 130.0, 0.0, 1.0)
        vis_layer, vis_date = "IR_enhanced_night_VIS", ir_date
    else:
        vis = vis_luma

    pmw_k = _synthesize_pmw(ir_k, wv_k)

    tensor = np.stack([ir_k, wv_k, vis, pmw_k], axis=-1).astype(np.float32)
    meta["layers"] = {
        "thermal_ir": ir_layer,
        "water_vapor": wv_layer,
        "visible": vis_layer,
        "pmw_proxy": "synthesized_from_IR_WV",
    }
    meta["dates"] = {
        "thermal_ir": ir_date,
        "water_vapor": wv_date,
        "visible": vis_date,
        "pmw_proxy": ir_date,
    }
    overlay_date = ir_date or dates[0]
    meta["overlay_date"] = overlay_date
    meta["overlay_truecolor"] = (
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/"
        f"MODIS_Terra_CorrectedReflectance_TrueColor/default/{overlay_date}/"
        "GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg"
    )
    meta["overlay_ir"] = (
        "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/"
        f"MODIS_Terra_Brightness_Temp_Band31_Night/default/{overlay_date}/"
        "GoogleMapsCompatible_Level6/{z}/{y}/{x}.png"
    )

    _CACHE[cache_key] = (tensor, meta)
    return tensor, meta


def fetch_gdacs_tropical_cyclones() -> list[dict]:
    import io
    import xml.etree.ElementTree as ET

    url = "https://www.gdacs.org/xml/rss.xml"
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)

    ns = {}
    for event, elem in ET.iterparse(io.BytesIO(resp.content), events=["start-ns"]):
        prefix, uri = elem
        if prefix:
            ns[prefix] = uri
    ns.setdefault("gdacs", "http://www.gdacs.org")
    ns.setdefault("geo", "http://www.w3.org/2003/01/geo/wgs84_pos#")

    cyclones = []
    for item in root.iter("item"):
        event_type = item.find("gdacs:eventtype", ns)
        if event_type is None:
            for child in item:
                if "eventtype" in child.tag:
                    event_type = child
                    break
        if event_type is None or event_type.text != "TC":
            continue

        title = item.findtext("title", "Unknown")
        desc = item.findtext("description", "")
        link = item.findtext("link", "")
        pub_date = item.findtext("pubDate", "")
        lat, lon = 0.0, 0.0

        lat_el = item.find("geo:lat", ns)
        lon_el = item.find("geo:long", ns)
        if lat_el is not None and lon_el is not None and lat_el.text and lon_el.text:
            lat, lon = float(lat_el.text), float(lon_el.text)
        if lat == 0 and lon == 0:
            for child in item:
                if "point" in child.tag.lower() and child.text:
                    parts = child.text.strip().split()
                    if len(parts) == 2:
                        lat, lon = float(parts[0]), float(parts[1])
                        break

        severity, alert_level, country = "Unknown", "Green", "Unknown"
        for child in item:
            tag = child.tag.lower()
            if "severity" in tag:
                severity = child.text or "Unknown"
            elif "alertlevel" in tag:
                alert_level = child.text or "Green"
            elif "country" in tag:
                country = child.text or "Unknown"

        if lat != 0 or lon != 0:
            cyclones.append({
                "name": title,
                "description": desc,
                "link": link,
                "lat": lat,
                "lon": lon,
                "severity": severity,
                "alert_level": alert_level,
                "country": country,
                "pub_date": pub_date,
            })
    return cyclones
