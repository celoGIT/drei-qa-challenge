import type {
  CreateLocationPayload,
  LocationResponse,
  SearchParams,
} from '../types/location';

const BASE = '/locations';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export async function createLocation(payload: CreateLocationPayload): Promise<LocationResponse> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<LocationResponse>(res);
}

export async function deleteLocation(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Delete failed');
  }
}

export async function updateLocation(id: string, payload: CreateLocationPayload): Promise<LocationResponse> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<LocationResponse>(res);
}

export async function searchLocations(params: SearchParams): Promise<LocationResponse[]> {
  const query = new URLSearchParams();
  if (params.p1) query.set('p1', params.p1);
  if (params.p2) query.set('p2', params.p2);
  if (params.name1) query.set('name1', params.name1);
  if (params.name2) query.set('name2', params.name2);
  if (params.type) query.set('type', params.type);
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  const res = await fetch(`${BASE}/search?${query.toString()}`);
  return handleResponse<LocationResponse[]>(res);
}
