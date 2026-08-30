## Prioritized Critical User Journeys (CUJs)
* **CUJ-1: Location Creation via UI Form:** Input name, select type, provide valid coordinates, submit, and verify UUID badge and new grid entry. *(E2E)*
* **CUJ-2: Bounding Box Spatial Search:** Set P1/P2 coordinates, apply filters, execute search, verify filtered table results. *(E2E)*
* **CUJ-3: Locations Table Data Management:** Navigate to Locations tab, inline-edit record, delete with confirmation modal, assert total count updates. *(E2E)*
* **CUJ-4: Bulk CSV Import & Export:** Upload `sample-locations.csv`, verify bulk points appear on grid; trigger "Export CSV" and verify downloaded file integrity. *(API/Integration)*
* **CUJ-5: Input Validation & Boundaries:** Enter invalid coordinates (>90° lat, >180° lng) or non-integer limits. *(API)*
* **CUJ-6: Premium Conflict Verification:** Simultaneous duplicate coordinates and premium location business rule enforcement. *(API/Backend)*

## Test Automation Layer Strategy

| Flow / Scenario | Assigned Layer | Reasoning & Findings |
| :--- | :--- | :--- |
| **Location Creation & Search** | **E2E (Playwright)** | Highest-value core journey. Must ensure the UI correctly passes state to the backend and renders results in the DOM. |
| **Map Canvas Interactions** | **Manual / Exploratory** | Web maps render primarily as `<canvas>` elements. Playwright cannot read inside a canvas to visually verify pins. Hardcoding X/Y pixel clicks causes highly flaky tests. |
| **Boundary & Fuzz Testing** | **API / Integration** | Testing mathematical boundaries and payload fuzzing must run directly at the API layer. Running thousands of character variations through UI inputs is inefficient. |
| **Business Rules (Overlaps)** | **Backend Unit / API** | Checking database rejections for `PREMIUM` overlaps is core backend logic; testing via UI is unnecessarily slow. |
| **Bulk CSV Import / Export** | **API / Integration** | File streaming and parsing are backend-heavy tasks. Directly testing the API endpoint ensures accurate data ingestion. |

## Suite Stability and Maintainability

**Local vs CI/CD Execution**
The `playwright.config.ts` acts as a centralized configuration hub handling the `baseURL` and browser contexts, allowing the exact same test code to run locally or seamlessly transition into a CI/CD pipeline (e.g., GitHub Actions) without altering test scripts.

**Flaky Test Handling**
* **Resilient Locators:** Tests rely on user-facing attributes (like `getByRole` or `getByPlaceholder`) instead of fragile CSS selectors that break during minor UI refactors.
* **Dynamic Auto-Waiting:** Tests use Playwright’s web-first assertions (`expect().toBeVisible()`) to automatically wait for DOM states to resolve without hardcoded, flaky timeouts.
* **CI Retries:** Pipelines should be configured to retry failed tests automatically to filter out temporary network blips.

**Test Data Management**
Tests do not rely on existing database states. Each test generates unique, independent data (e.g., dynamic timestamps or random IDs in location names) to prevent collisions during parallel execution.

**Reporting and Failure Analysis**
The suite generates Playwright's built-in HTML report. In CI/CD, these reports, along with trace `.zip` files and video recordings on failure, should be published as pipeline artifacts so developers can visually debug without re-running locally.