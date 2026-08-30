import { useState, type FormEvent } from 'react';
import { searchLocations } from '../api/locationApi';
import type { LocationResponse, LocationType } from '../types/location';

interface Props {
  onResults?: (results: LocationResponse[]) => void;
}

export default function SearchLocations({ onResults }: Props) {
  const [type, setType] = useState<'' | LocationType>('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [limit, setLimit] = useState('');
  const [results, setResults] = useState<LocationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const p1p2Filled = p1.trim() !== '' || p2.trim() !== '';
  const nameFilled = name1.trim() !== '' || name2.trim() !== '';

  const handleCancel = () => {
    setP1('');
    setP2('');
    setName1('');
    setName2('');
    setType('');
    setLimit('');
    setResults([]);
    setSearched(false);
    setError(null);
    onResults?.([]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSearched(false);

    try {
      const data = await searchLocations({
        p1: p1 || undefined,
        p2: p2 || undefined,
        name1: name1 || undefined,
        name2: name2 || undefined,
        type: type !== '' ? type : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });
      setResults(data);
      setSearched(true);
      onResults?.(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      onResults?.([]);
    } finally {
      setLoading(false);
    }
  };

  const inputDisabled = (otherFilled: boolean) =>
    otherFilled ? { ...styles.input, ...styles.inputDisabled } : styles.input;

  const handleExport = () => {
    const header = 'name,type,lat,lng';
    const rows = results.map(
      (loc) => `${loc.name},${loc.type},${loc.coordinates.lat},${loc.coordinates.lng}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'locations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="search-locations" style={styles.card}>
      <h2 style={styles.heading}>Search Locations</h2>

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* ── Coordinate bounding box ── */}
        <div style={styles.row}>
          <label style={styles.label}>
            P1 (lat,lng)
            <input
              style={inputDisabled(nameFilled)}
              value={p1}
              disabled={nameFilled}
              onChange={(e) => setP1(e.target.value)}
              placeholder="e.g. 48.85,2.34"
            />
          </label>
          <label style={styles.label}>
            P2 (lat,lng)
            <input
              style={inputDisabled(nameFilled)}
              value={p2}
              disabled={nameFilled}
              onChange={(e) => setP2(e.target.value)}
              placeholder="e.g. 48.87,2.36"
            />
          </label>
        </div>

        {/* ── Divider ── */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or search by location name</span>
          <div style={styles.dividerLine} />
        </div>

        {/* ── Name bounding box ── */}
        <div style={styles.row}>
          <label style={styles.label}>
            Location Name 1
            <input
              style={inputDisabled(p1p2Filled)}
              value={name1}
              disabled={p1p2Filled}
              onChange={(e) => setName1(e.target.value)}
              placeholder="e.g. Schönbrunn Palace"
            />
          </label>
          <label style={styles.label}>
            Location Name 2
            <input
              style={inputDisabled(p1p2Filled)}
              value={name2}
              disabled={p1p2Filled}
              onChange={(e) => setName2(e.target.value)}
              placeholder="e.g. Stephansdom"
            />
          </label>
        </div>

        {/* ── Filters ── */}
        <div style={styles.row}>
          <label style={styles.label}>
            Type filter
            <select
              style={styles.input}
              value={type}
              onChange={(e) => setType(e.target.value as '' | LocationType)}
            >
              <option value="">All</option>
              <option value="PREMIUM">Premium</option>
              <option value="STANDARD">Standard</option>
            </select>
          </label>
          <label style={styles.label}>
            Limit
            <input
              style={styles.input}
              type="number"
              min="1"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="e.g. 20"
            />
          </label>
        </div>

        <div style={styles.buttonRow}>
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
          <button style={styles.cancelButton} type="button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      {searched && (
        <div style={styles.results}>
          <div style={styles.resultsHeader}>
            <h3 style={{ margin: 0 }}>{results.length} result{results.length !== 1 ? 's' : ''}</h3>
            {results.length > 0 && (
              <button style={styles.exportButton} onClick={handleExport}>
                Export CSV
              </button>
            )}
          </div>
          {results.length === 0 ? (
            <p style={{ color: '#666' }}>No locations found matching your criteria.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Lat</th>
                  <th style={styles.th}>Lng</th>
                </tr>
              </thead>
              <tbody>
                {results.map((loc) => (
                  <tr key={loc.id}>
                    <td style={styles.td}>{loc.name}</td>
                    <td style={styles.td}>{loc.type}</td>
                    <td style={styles.td}>{loc.coordinates.lat.toFixed(6)}</td>
                    <td style={styles.td}>{loc.coordinates.lng.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: 8,
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  heading: { marginTop: 0, color: '#1a1a2e' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  row: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  label: { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', fontWeight: 500, flex: 1, minWidth: 160 },
  input: { padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc', fontSize: '1rem' },
  inputDisabled: { background: '#f5f5f5', color: '#aaa', cursor: 'not-allowed', border: '1px solid #e0e0e0' },
  divider: { display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.1rem 0' },
  dividerLine: { flex: 1, height: 1, background: '#e0e0e0' },
  dividerText: { fontSize: '0.8rem', color: '#999', whiteSpace: 'nowrap' as const },
  buttonRow: { display: 'flex', gap: '0.75rem' },
  button: {
    padding: '0.6rem 1.2rem',
    background: '#00a0d2',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '1rem',
  },
  cancelButton: {
    padding: '0.6rem 1.2rem',
    background: '#fff',
    color: '#555',
    border: '1px solid #ccc',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '1rem',
  },
  error: { color: '#e63946', margin: '0.5rem 0 0' },
  results: { marginTop: '0.5rem' },
  resultsHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' },
  exportButton: {
    padding: '0.4rem 1rem',
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' },
  th: { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #ddd', background: '#f5f5f5' },
  td: { padding: '0.5rem', borderBottom: '1px solid #eee' },
};
