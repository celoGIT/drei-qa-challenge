export type LocationType = 'PREMIUM' | 'STANDARD';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationResponse {
  id: string;
  name: string;
  type: LocationType;
  coordinates: Coordinates;
  createdAt?: string;
}

export interface CreateLocationPayload {
  name: string;
  type: LocationType;
  coordinates: Coordinates;
}

export interface SearchParams {
  type?: LocationType;
  p1?: string;
  p2?: string;
  name1?: string;
  name2?: string;
  limit?: number;
}

