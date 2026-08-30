import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Map, { Source, Layer, Marker, Popup, NavigationControl, AttributionControl } from 'react-map-gl/maplibre';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { LocationResponse } from '../types/location';

const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster' as const, source: 'osm' }],
};

interface Props {
  existing: LocationResponse[];
  newLat: number | null;
  newLng: number | null;
  onMapClick: (lat: number, lng: number) => void;
  loading?: boolean;
  searchResults?: LocationResponse[];
}

export default function LocationMap({ existing, newLat, newLng, onMapClick, loading, searchResults }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<LocationResponse | null>(null);

  const initialLng = newLng ?? existing[0]?.coordinates.lng ?? 16.3728;
  const initialLat = newLat ?? existing[0]?.coordinates.lat ?? 48.2092;

  const geojson: GeoJSON.FeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: existing.map((loc) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [loc.coordinates.lng, loc.coordinates.lat] },
      properties: { id: loc.id, name: loc.name, type: loc.type,
        lat: loc.coordinates.lat, lng: loc.coordinates.lng },
    })),
  }), [existing]);

  const searchGeojson: GeoJSON.FeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: (searchResults ?? []).map((loc) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [loc.coordinates.lng, loc.coordinates.lat] },
      properties: { id: loc.id, name: loc.name, type: loc.type,
        lat: loc.coordinates.lat, lng: loc.coordinates.lng },
    })),
  }), [searchResults]);

  const bboxGeojson: GeoJSON.FeatureCollection = useMemo(() => {
    if (!searchResults?.length || searchResults.length < 2) {
      return { type: 'FeatureCollection', features: [] };
    }
    const lngs = searchResults.map((l) => l.coordinates.lng);
    const lats = searchResults.map((l) => l.coordinates.lat);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [minLng, minLat], [maxLng, minLat],
            [maxLng, maxLat], [minLng, maxLat],
            [minLng, minLat],
          ]],
        },
        properties: {},
      }],
    };
  }, [searchResults]);

  // Fit map to search results when they arrive
  useEffect(() => {
    if (!mapRef.current || !searchResults?.length) return;
    if (searchResults.length === 1) {
      mapRef.current.flyTo({ center: [searchResults[0].coordinates.lng, searchResults[0].coordinates.lat], zoom: 14, duration: 800 });
      return;
    }
    const lngs = searchResults.map((l) => l.coordinates.lng);
    const lats = searchResults.map((l) => l.coordinates.lat);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    if (minLng === maxLng && minLat === maxLat) {
      mapRef.current.flyTo({ center: [minLng, minLat], zoom: 14, duration: 800 });
    } else {
      mapRef.current.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        { padding: 60, duration: 800 }
      );
    }
  }, [searchResults]);

  useEffect(() => {
    if (mapRef.current && newLat !== null && newLng !== null) {
      mapRef.current.flyTo({ center: [newLng, newLat], duration: 500 });
    }
  }, [newLat, newLng]);

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const props = e.features[0].properties;
      if (props) {
        const loc =
          searchResults?.find((l) => l.id === props.id) ??
          existing.find((l) => l.id === props.id);
        if (loc) { setPopupInfo(loc); return; }
      }
    }
    onMapClick(e.lngLat.lat, e.lngLat.lng);
    setPopupInfo(null);
  }, [onMapClick, existing, searchResults]);

  return (
    <div id="location-map" style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd' }}>

      {/* Legend + hint bar */}
      <div style={{
        padding: '0.4rem 0.75rem', background: '#f8f8f8',
        borderBottom: '1px solid #ddd', fontSize: '0.78rem', color: '#666',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '0.4rem',
      }}>
        <span>Click the map to set coordinates — or type them manually in the form</span>
        <span style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {[
            { bg: '#00a0d2', border: '#0a0a0a', label: 'Premium' },
            { bg: '#DDEE3D', border: '#1a5fb4', label: 'Standard' },
            { bg: '#e63946', border: '#9b111e', label: 'New' },
          ].map(({ bg, border, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: bg, border: `2px solid ${border}` }} />
              {label}
            </span>
          ))}
        </span>
      </div>

      <div style={{ position: 'relative', cursor: 'crosshair' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: 'rgba(255,255,255,0.65)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '0.6rem', backdropFilter: 'blur(2px)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid #e0e0e0',
              borderTopColor: '#0a0a0a',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: '0.82rem', color: '#555', fontWeight: 500 }}>
              Loading locations…
            </span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        <Map
          ref={mapRef}
          initialViewState={{ longitude: initialLng, latitude: initialLat, zoom: 11 }}
          style={{ height: 500 }}
          mapStyle={OSM_STYLE}
          onClick={handleClick}
          attributionControl={false}
          interactiveLayerIds={['locations-premium', 'locations-standard', 'search-results-circle']}
        >
          <NavigationControl position="top-right" />
          <AttributionControl
            compact={true}
            position="bottom-right"
            customAttribution='<a href="https://maplibre.org/" target="_blank">MapLibre</a>'
          />

          {/* Bounding box rectangle for search results */}
          <Source id="search-bbox" type="geojson" data={bboxGeojson}>
            <Layer
              id="search-bbox-fill"
              type="fill"
              paint={{ 'fill-color': '#00a0d2', 'fill-opacity': 0.07 }}
            />
            <Layer
              id="search-bbox-line"
              type="line"
              paint={{
                'line-color': '#00a0d2',
                'line-width': 2,
                'line-dasharray': [4, 3],
                'line-opacity': 0.8,
              }}
            />
          </Source>

          {/* All existing locations rendered as a single WebGL draw call */}
          <Source id="locations" type="geojson" data={geojson}>
            <Layer
              id="locations-standard"
              type="circle"
              filter={['==', ['get', 'type'], 'STANDARD']}
              paint={{
                'circle-radius': 9,
                'circle-color': '#DDEE3D',
                'circle-stroke-width': 2.5,
                'circle-stroke-color': '#1a5fb4',
                'circle-opacity': 0.9,
              }}
            />
            <Layer
              id="locations-premium"
              type="circle"
              filter={['==', ['get', 'type'], 'PREMIUM']}
              paint={{
                'circle-radius': 9,
                'circle-color': '#00a0d2',
                'circle-stroke-width': 2.5,
                'circle-stroke-color': '#0a0a0a',
                'circle-opacity': 0.9,
              }}
            />
          </Source>

          {/* Search results — rendered on top with a white halo */}
          <Source id="search-results" type="geojson" data={searchGeojson}>
            <Layer
              id="search-results-circle"
              type="circle"
              paint={{
                'circle-radius': 12,
                'circle-color': ['case', ['==', ['get', 'type'], 'PREMIUM'], '#00a0d2', '#DDEE3D'],
                'circle-stroke-width': 3,
                'circle-stroke-color': '#ffffff',
                'circle-opacity': 1,
              }}
            />
          </Source>

          {/* New pin — kept as a DOM marker so it's visually distinct */}
          {newLat !== null && newLng !== null && (
            <Marker longitude={newLng} latitude={newLat} anchor="center">
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: '#e63946', border: '2.5px solid #9b111e',
                boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                cursor: 'crosshair',
              }} />
            </Marker>
          )}

          {popupInfo && (
            <Popup
              longitude={popupInfo.coordinates.lng}
              latitude={popupInfo.coordinates.lat}
              anchor="bottom"
              offset={12}
              onClose={() => setPopupInfo(null)}
              closeOnClick={false}
            >
              <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                <strong>{popupInfo.name}</strong><br />
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.35rem',
                  borderRadius: 3,
                  background: popupInfo.type === 'PREMIUM' ? '#0a0a0a' : '#efefef',
                  color: popupInfo.type === 'PREMIUM' ? '#00a0d2' : '#555',
                }}>
                  {popupInfo.type}
                </span><br />
                <span style={{ fontSize: '0.75rem', color: '#777' }}>
                  {popupInfo.coordinates.lat.toFixed(5)}, {popupInfo.coordinates.lng.toFixed(5)}
                </span>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
