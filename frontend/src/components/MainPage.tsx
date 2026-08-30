import { useState, useCallback, useEffect, useRef } from 'react';
import CreateLocation from './CreateLocation';
import SearchLocations from './SearchLocations';
import LocationMap from './LocationMap';
import { searchLocations } from '../api/locationApi';
import type { LocationResponse } from '../types/location';

const MAX_RETRIES = 8;
const RETRY_DELAY_MS = 3000;

export default function MainPage() {
  const [existingLocations, setExistingLocations] = useState<LocationResponse[]>([]);
  const [mapPin, setMapPin]         = useState<{ lat: number; lng: number } | null>(null);
  const [searchResults, setSearchResults] = useState<LocationResponse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(false);
  const retryCount              = useRef(0);
  const retryTimer              = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadLocations = useCallback((isRetry = false) => {
    if (!isRetry) setLoading(true);
    searchLocations({})
      .then((data) => {
        setExistingLocations(data);
        setLoading(false);
        retryCount.current = 0;
      })
      .catch(() => {
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current++;
          retryTimer.current = setTimeout(() => loadLocations(true), RETRY_DELAY_MS);
        } else {
          setLoading(false);
          setLoadError(true);
        }
      });
  }, []);

  useEffect(() => {
    loadLocations();
    return () => { if (retryTimer.current) clearTimeout(retryTimer.current); };
  }, [loadLocations]);

  const handleCreated = useCallback((_loc: LocationResponse) => {
    loadLocations();
    setMapPin(null);
  }, [loadLocations]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setMapPin({ lat, lng });
  }, []);

  return (
    <div>
      {loadError && (
        <div style={styles.errorBanner}>
          Could not connect to the backend after several attempts. Please check the service is running and refresh the page.
        </div>
      )}
    <div style={styles.layout}>
      <div style={styles.leftCol}>
        <CreateLocation onCreated={handleCreated} mapPin={mapPin} />
        <SearchLocations onResults={setSearchResults} />
      </div>
      <div style={styles.rightCol}>
        <LocationMap
          existing={existingLocations}
          newLat={mapPin?.lat ?? null}
          newLng={mapPin?.lng ?? null}
          onMapClick={handleMapClick}
          loading={loading}
          searchResults={searchResults}
        />
      </div>
    </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  errorBanner: {
    background: '#fff3cd',
    border: '1px solid #ffc107',
    color: '#856404',
    padding: '0.75rem 1rem',
    borderRadius: 6,
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  layout: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: '0 0 420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    minWidth: 0,
  },
  rightCol: {
    flex: 1,
    position: 'sticky',
    top: '1.5rem',
    minWidth: 0,
  },
};
