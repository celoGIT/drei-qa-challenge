import { useEffect, useState, useCallback } from 'react';
import { searchLocations, deleteLocation, updateLocation } from '../api/locationApi';
import type { LocationResponse, LocationType } from '../types/location';

type SortOption = 'premium-newest' | 'newest' | 'a-z';

interface Props {
  onNavigateCreate: () => void;
}

export default function LocationsPage({ onNavigateCreate }: Props) {
  const [all, setAll]               = useState<LocationResponse[]>([]);
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | LocationType>('');
  const [sortBy, setSortBy]         = useState<SortOption>('premium-newest');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editName, setEditName]     = useState('');
  const [editType, setEditType]     = useState<LocationType>('STANDARD');
  const [editLat, setEditLat]       = useState('');
  const [editLng, setEditLng]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    searchLocations({})
      .then(setAll)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(loc: LocationResponse) {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditType(loc.type);
    setEditLat(String(loc.coordinates.lat));
    setEditLng(String(loc.coordinates.lng));
    setActionError(null);
    setConfirmDeleteId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setActionError(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    setActionError(null);
    try {
      await updateLocation(id, {
        name: editName,
        type: editType,
        coordinates: { lat: parseFloat(editLat), lng: parseFloat(editLng) },
      });
      setEditingId(null);
      load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(id: string) {
    setSaving(true);
    setActionError(null);
    try {
      await deleteLocation(id);
      setConfirmDeleteId(null);
      load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setSaving(false);
    }
  }

  const premiumCount  = all.filter((l) => l.type === 'PREMIUM').length;
  const standardCount = all.filter((l) => l.type === 'STANDARD').length;

  const filtered = all
    .filter((loc) => loc.name.toLowerCase().includes(search.toLowerCase()))
    .filter((loc) => typeFilter === '' ? true : loc.type === typeFilter)
    .sort((a, b) => {
      if (sortBy === 'premium-newest') {
        if (a.type !== b.type) return a.type === 'PREMIUM' ? -1 : 1;
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <section style={styles.card}>

      {/* ── Header ── */}
      <div style={styles.topRow}>
        <div>
          <h2 style={styles.heading}>All locations</h2>
          <p style={styles.subtitle}>
            Admin view. Here you can edit locations or delete them after confirmation.{' '}
            You can create new locations on the{' '}
            <span style={styles.link} onClick={onNavigateCreate}>Create Location</span>.
          </p>
        </div>
        <div style={styles.statsRow}>
          <span style={styles.badgePremium}>{premiumCount} Premium</span>
          <span style={styles.badgeStandard}>{standardCount} Standard</span>
          <button style={styles.updateBtn} onClick={load}>Refresh</button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={styles.filterBox}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Search</label>
          <input
            style={styles.filterInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or address"
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Type</label>
          <select
            style={styles.filterSelect}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as '' | LocationType)}
          >
            <option value="">All</option>
            <option value="PREMIUM">Premium</option>
            <option value="STANDARD">Standard</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Sorting</label>
          <select
            style={styles.filterSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="premium-newest">Premium first, then newest</option>
            <option value="newest">Newest first</option>
            <option value="a-z">A – Z</option>
          </select>
        </div>
      </div>

      {/* ── Content ── */}
      {loading && <p style={styles.info}>Loading…</p>}
      {error   && <p style={styles.error}>{error}</p>}

      {!loading && !error && (
        <>
          <p style={styles.count}>{filtered.length} location{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.length === 0 ? (
            <p style={styles.info}>No locations match your filters.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Lat</th>
                  <th style={styles.th}>Lng</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((loc) => {
                  const isEditing = editingId === loc.id;
                  const isConfirming = confirmDeleteId === loc.id;

                  if (isEditing) {
                    return (
                      <tr key={loc.id} style={{ background: '#fffde7' }}>
                        <td style={styles.td}>
                          <input style={styles.inlineInput} value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </td>
                        <td style={styles.td}>
                          <select style={styles.inlineSelect} value={editType} onChange={(e) => setEditType(e.target.value as LocationType)}>
                            <option value="STANDARD">STANDARD</option>
                            <option value="PREMIUM">PREMIUM</option>
                          </select>
                        </td>
                        <td style={styles.td}>
                          <input style={styles.inlineInput} value={editLat} onChange={(e) => setEditLat(e.target.value)} />
                        </td>
                        <td style={styles.td}>
                          <input style={styles.inlineInput} value={editLng} onChange={(e) => setEditLng(e.target.value)} />
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionRow}>
                            <button style={styles.btnSave} onClick={() => saveEdit(loc.id)} disabled={saving}>Save</button>
                            <button style={styles.btnCancel} onClick={cancelEdit} disabled={saving}>Cancel</button>
                          </div>
                          {actionError && <div style={styles.actionError}>{actionError}</div>}
                        </td>
                      </tr>
                    );
                  }

                  if (isConfirming) {
                    return (
                      <tr key={loc.id} style={{ background: '#fff5f5' }}>
                        <td style={styles.td} colSpan={4}>
                          <span style={{ fontSize: '0.88rem', color: '#c0392b' }}>
                            Delete <strong>{loc.name}</strong>? This cannot be undone.
                          </span>
                          {actionError && <span style={{ color: '#e63946', marginLeft: '0.5rem', fontSize: '0.82rem' }}>{actionError}</span>}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionRow}>
                            <button style={styles.btnDelete} onClick={() => confirmDelete(loc.id)} disabled={saving}>Yes, delete</button>
                            <button style={styles.btnCancel} onClick={() => { setConfirmDeleteId(null); setActionError(null); }} disabled={saving}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={loc.id}>
                      <td style={styles.td}>{loc.name}</td>
                      <td style={styles.td}>
                        <span style={loc.type === 'PREMIUM' ? styles.typePremium : styles.typeStandard}>
                          {loc.type}
                        </span>
                      </td>
                      <td style={styles.td}>{loc.coordinates.lat.toFixed(5)}</td>
                      <td style={styles.td}>{loc.coordinates.lng.toFixed(5)}</td>
                      <td style={styles.td}>
                        <div style={styles.actionRow}>
                          <button style={styles.btnEdit} onClick={() => startEdit(loc)}>Edit</button>
                          <button style={styles.btnDelete} onClick={() => { setConfirmDeleteId(loc.id); setActionError(null); setEditingId(null); }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: 8,
    padding: '1.75rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: '1rem',
    marginBottom: '1.25rem',
  },
  heading: { margin: '0 0 0.4rem', color: '#0a0a0a', fontSize: '1.6rem' },
  subtitle: { margin: 0, fontSize: '0.88rem', color: '#555', maxWidth: 480, lineHeight: 1.5 },
  link: { color: '#00a0d2', cursor: 'pointer', textDecoration: 'underline' },
  statsRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 },
  badgePremium: {
    background: '#00a0d2',
    color: '#0a0a0a',
    fontSize: '0.8rem',
    fontWeight: 700,
    padding: '0.3rem 0.75rem',
    borderRadius: 20,
  },
  badgeStandard: {
    background: '#f0f0f0',
    color: '#444',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '0.3rem 0.75rem',
    borderRadius: 20,
  },
  updateBtn: {
    padding: '0.3rem 0.9rem',
    background: '#fff',
    color: '#333',
    border: '1px solid #ccc',
    borderRadius: 20,
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  filterBox: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem 1.25rem',
    background: '#f8f8f8',
    borderRadius: 8,
    marginBottom: '1.25rem',
    flexWrap: 'wrap' as const,
    border: '1px solid #ebebeb',
  },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1, minWidth: 160 },
  filterLabel: { fontSize: '0.78rem', fontWeight: 600, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  filterInput: { padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.95rem', background: '#fff' },
  filterSelect: { padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.95rem', background: '#fff' },
  count: { fontSize: '0.82rem', color: '#999', margin: '0 0 0.6rem' },
  info:  { color: '#666', fontSize: '0.9rem' },
  error: { color: '#e63946', fontSize: '0.9rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.5rem 0.6rem', borderBottom: '2px solid #e8e8e8', background: '#fafafa', fontSize: '0.82rem', color: '#666', fontWeight: 600 },
  td: { padding: '0.55rem 0.6rem', borderBottom: '1px solid #f2f2f2', fontSize: '0.9rem', color: '#222' },
  typePremium: { background: '#0a0a0a', color: '#00a0d2', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: 3 },
  typeStandard: { background: '#efefef', color: '#555', fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: 3 },
  actionRow: { display: 'flex', gap: '0.4rem', alignItems: 'center' },
  btnEdit: { padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 600, background: '#e8f0fe', color: '#1a73e8', border: '1px solid #c5d8fa', borderRadius: 4, cursor: 'pointer' },
  btnDelete: { padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 600, background: '#fdecea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: 4, cursor: 'pointer' },
  btnSave: { padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 700, background: '#00a0d2', color: '#0a0a0a', border: 'none', borderRadius: 4, cursor: 'pointer' },
  btnCancel: { padding: '0.2rem 0.65rem', fontSize: '0.78rem', fontWeight: 600, background: '#f0f0f0', color: '#555', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' },
  inlineInput: { padding: '0.2rem 0.4rem', fontSize: '0.85rem', border: '1px solid #c5c5c5', borderRadius: 4, width: '100%', boxSizing: 'border-box' as const },
  inlineSelect: { padding: '0.2rem 0.4rem', fontSize: '0.85rem', border: '1px solid #c5c5c5', borderRadius: 4 },
  actionError: { color: '#e63946', fontSize: '0.78rem', marginTop: '0.25rem' },
};
