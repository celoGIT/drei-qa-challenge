# Location Service - QA Automation Challenge

**Project Description**
This project contains an automated test suite for a geospatial Point of Interest (POI) application. The application registers, manages, and queries geographic nodes (`STANDARD` and `PREMIUM` classifications) with coordinate boundaries strictly constrained to latitudes [-90, 90] and longitudes [-180, 180]. It relies on PostGIS spatial indexes for bounding box envelope searches.

**Setup and Execution**

**Local Execution**
1. Ensure the application is running locally via Docker (`docker-compose up`).
2. Navigate to the project root directory and install dependencies: `npm install`
3. Run the Playwright E2E suite: `npx playwright test`
4. View the HTML test report: `npx playwright show-report`

**API & Architecture Overview**
* **`POST /api/locations`**: Ingests new location entities (`name`, `type`, `coordinates`).
* **`GET /api/locations`**: Fetches all locations with sorting and type filtering for the data grid.
* **`GET /api/locations/search`**: Executes bounding box geospatial retrieval (P1, P2, type, limit).
* **`PUT /api/locations/{id}`**: Updates existing record coordinates.
* **`DELETE /api/locations/{id}`**: Removes location record and triggers map/grid refresh.