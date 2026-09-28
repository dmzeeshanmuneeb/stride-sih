"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Polygon, LayersControl, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const hurricaneIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1779/1779940.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

type LatLng = [number, number];

function interpolatePath(path: LatLng[], t: number): LatLng {
  if (!path.length) return [15, 85];
  if (path.length === 1) return path[0];
  const scaled = t * (path.length - 1);
  const i = Math.min(Math.floor(scaled), path.length - 2);
  const f = scaled - i;
  return [
    path[i][0] + (path[i + 1][0] - path[i][0]) * f,
    path[i][1] + (path[i + 1][1] - path[i][1]) * f,
  ];
}

function AnimatedStorm({ path }: { path: LatLng[] }) {
  const [pos, setPos] = useState<LatLng>(path[0]);

  useEffect(() => {
    if (!path.length) return;
    let frame: number;
    const started = performance.now();
    const loop = (now: number) => {
      const t = ((now - started) / 9000) % 1;
      setPos(interpolatePath(path, t));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [path]);

  return (
    <CircleMarker
      center={pos}
      radius={9}
      pathOptions={{ color: '#ffffff', fillColor: '#22d3ee', fillOpacity: 0.95, weight: 2, className: 'storm-pulse' }}
    />
  );
}

export default function MapComponent({
  cyclones,
  setSelectedCyclone,
  overlayTruecolor,
  overlayIr,
}: {
  cyclones: any[];
  setSelectedCyclone: (c: any) => void;
  overlayTruecolor?: string;
  overlayIr?: string;
}) {
  const truecolorUrl = overlayTruecolor ||
    'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2026-09-26/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg';
  const irUrl = overlayIr ||
    'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Brightness_Temp_Band31_Night/default/2026-09-26/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png';

  const tracks = useMemo(() => cyclones.map((c) => {
    const pPoints = c.past_points || [];
    const pPath = pPoints.map((pt: any) => [pt.lat, pt.lon]);
    return {
      id: c.cyclone_id,
      path: (c.trajectory_72h || []) as LatLng[],
      cone: (c.cone || []) as LatLng[],
      points: c.traj_points || [],
      pastPoints: pPoints,
      pastPath: pPath as LatLng[],
      cyclone: c,
    };
  }), [cyclones]);

  return (
    <MapContainer center={[15.0, 85.0]} zoom={5} style={{ height: '100%', width: '100%' }}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Esri Satellite">
          <TileLayer
            attribution='&copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="NASA GIBS True Color">
          <TileLayer
            attribution="NASA GIBS / EOSDIS"
            url={truecolorUrl}
            maxNativeZoom={9}
          />
        </LayersControl.BaseLayer>
        <LayersControl.Overlay checked name="NASA GIBS Thermal IR">
          <TileLayer
            attribution="NASA GIBS MODIS Band 31"
            url={irUrl}
            opacity={0.45}
            maxNativeZoom={6}
          />
        </LayersControl.Overlay>
        <LayersControl.Overlay checked name="Place names">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
        </LayersControl.Overlay>
      </LayersControl>

      {tracks.map((t) => (
        <React.Fragment key={t.id}>
          {t.cone.length > 2 && (
            <Polygon
              positions={t.cone}
              pathOptions={{ color: '#f97316', fillColor: '#fb923c', fillOpacity: 0.18, weight: 1, className: 'cone-breathe' }}
            >
              <Tooltip>Cone of uncertainty (72h)</Tooltip>
            </Polygon>
          )}
          
          {/* Past Track Line */}
          {t.pastPath.length > 1 && (
            <Polyline
              positions={t.pastPath}
              pathOptions={{ color: '#1e293b', weight: 4, opacity: 0.95 }}
            />
          )}

          {/* Past Track Points (excluding first) */}
          {t.pastPoints.slice(1).map((pt: any, idx: number) => (
            <CircleMarker
              key={`past-${t.id}-${idx}`}
              center={[pt.lat, pt.lon]}
              radius={4}
              pathOptions={{ color: '#1e293b', fillColor: '#1e293b', fillOpacity: 1.0 }}
            >
              <Tooltip>Observed Track: {pt.lat.toFixed(1)}°N {pt.lon.toFixed(1)}°E</Tooltip>
            </CircleMarker>
          ))}

          {/* Genesis (Starting) Position */}
          {t.pastPoints.length > 0 && (
            <CircleMarker
              center={[t.pastPoints[0].lat, t.pastPoints[0].lon]}
              radius={8}
              pathOptions={{ color: '#10b981', weight: 3, fillColor: '#ffffff', fillOpacity: 1.0 }}
            >
              <Tooltip permanent direction="bottom" offset={[0, 10]}>
                <strong style={{ color: '#10b981' }}>CYCLONE GENESIS (START)</strong>
              </Tooltip>
            </CircleMarker>
          )}

          {/* Future Track Line */}
          {t.path.length > 1 && (
            <Polyline
              positions={t.path}
              pathOptions={{ color: '#d946ef', weight: 4, opacity: 0.95, dashArray: '8, 8' }}
            />
          )}

          <Marker
            position={[t.cyclone.current_pos[0], t.cyclone.current_pos[1]]}
            icon={hurricaneIcon}
            eventHandlers={{ click: () => setSelectedCyclone(t.cyclone) }}
          >
            <Popup>
              <b>🌀 {t.cyclone.name}</b><br />
              {t.cyclone.intensity.category} ({t.cyclone.intensity.vmax_knots} kt)<br />
              Click marker for NASA GIBS multi-spectral analysis.
            </Popup>
          </Marker>
          <CircleMarker
            center={[t.cyclone.current_pos[0], t.cyclone.current_pos[1]]}
            radius={22}
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, className: 'eye-ring' }}
          >
            <Tooltip permanent direction="right" offset={[25, 0]} className="custom-tooltip">
              <strong style={{ color: '#ef4444', fontSize: '14px', textShadow: '0 0 5px rgba(0,0,0,0.5)' }}>LIVE POSITION 🔴</strong>
            </Tooltip>
          </CircleMarker>

          {/* Future Track Points */}
          {t.points.map((pt: any) => (
            <CircleMarker
              key={`${t.id}-${pt.hour}`}
              center={[pt.lat, pt.lon]}
              radius={6}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: pt.status === 'LANDFALL / OVER LAND' ? '#ef4444' : '#d946ef',
                fillOpacity: 1.0,
              }}
            >
              <Tooltip>+{pt.hour}h ({pt.status}) · {pt.lat.toFixed(1)}°N {pt.lon.toFixed(1)}°E</Tooltip>
            </CircleMarker>
          ))}
          {t.path.length > 1 && <AnimatedStorm path={t.path} />}
        </React.Fragment>
      ))}
    </MapContainer>
  );
}
