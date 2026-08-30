-- Locations table using native PostGIS geometry column
CREATE TABLE IF NOT EXISTS locations (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name     VARCHAR(255)                        NOT NULL,
    type     VARCHAR(20)                         NOT NULL CHECK (type IN ('PREMIUM', 'STANDARD')),
    geometry geometry(Point, 4326)               NOT NULL
);

-- Spatial index for fast ST_DWithin / ST_Contains queries
CREATE INDEX IF NOT EXISTS idx_locations_geometry ON locations USING GIST (geometry);

-- Index on type for filtered searches
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations (type);
