## Main Technical and Business Risks

**Technical Risks**
* **Security Vulnerabilities (SQL Injection):** The UI allows non-integer inputs (like letters) into the "Limit" field. Bypassing UI validation reveals the API crashes with a `500 Internal Server Error` on SQL payloads (e.g., `?limit=10 OR 1=1`), indicating missing sanitization at the controller boundary.
* **Performance & DOM Overload:** Rendering thousands of DOM nodes (pins) on a Leaflet map simultaneously will crash the browser or cause severe UI lag. PostGIS spatial queries might also time out under heavy load.
* **Data Integrity:** If client-side validation is bypassed, saving invalid coordinates could corrupt the PostGIS spatial indexes, breaking the bounding-box search globally.

**Business Risks**
* **Operational Delays & Dispatch Errors:** If the map displays a node at the wrong coordinates (or fails to load due to 3rd-party tile server outages), field engineers are dispatched to the wrong physical location.
* **Destructive Bulk Operations:** The CSV import and table delete functionalities pose a massive risk for human error without a clear rollback mechanism.

## Assumptions, Ambiguities, and Quality Gaps

**Assumptions Made**
* **Target Audience:** Assumed to be an internal enterprise tool, meaning users have baseline technical knowledge.
* **Data Volume:** Assumed production contains tens of thousands of locations, making the local testing environment an underrepresentation of actual load.

**Ambiguous Requirements**
* **The "Limit" Logic:** If a bounding box contains 100 locations, but the user sets a limit of "20", it is ambiguous how the backend decides *which* 20 to return (e.g., newest, closest to center, random).
* **Premium Overlaps:** It is undefined what constitutes a `PREMIUM` conflict—whether it requires exact coordinate matches or includes a radial buffer (e.g., 500 meters).

**Potential Quality Gaps & Proposals for Improvement**
* **Missing Pagination & UI Feedback:** The table loads all points at once. Querying thousands of items will freeze the client. Additionally, there are no loading spinners during heavy spatial searches.
* **Automated API Fuzzing Pipeline:** Integrate a dedicated fuzzing step in the CI/CD pipeline using comprehensive datasets directly against the backend controllers to uncover unhandled character encoding failures and injection vectors.
* **Geographic Guardrails:** Add soft warnings if a user drops a pin in the ocean or outside the target operating region to catch manual coordinate typos.
* **Address Geocoding:** Integrate an address search bar that automatically converts a typed street name into map coordinates.

## AI Usage & Collaboration

**Tools & Tasks**
I utilized a Large Language Model (Gemini) as a pair-programming assistant. I used it to quickly scaffold the boilerplate code for my Playwright Page Object Model (POM), brainstorm negative testing vectors (such as input boundaries and SQL injection strings), and structure this final Markdown documentation.

**Where AI Helped**
AI significantly accelerated the initial test framework setup. By having the tool generate the boilerplate `playwright.config.ts` and the foundational class structures for the UI locators, I was able to skip the setup phase and had enough time to focus on writing the actual business logic assertions and verifying the API boundary vulnerabilities on port 8080.

**Where I Disagreed With & Modified AI Suggestions**
The AI initially recommended automating physical map interactions—specifically, writing tests to click on the map canvas to drop pins and visually verify their rendering. I disagreed with this approach. Because modern interactive maps render as `<canvas>` elements or complex image grids, standard DOM-based locators cannot "see" inside them, and relying on hardcoded X/Y pixel clicks leads to highly flaky tests. I modified the strategy to ensure all automated E2E tests target the reliable UI forms and API layers, leaving map canvas interaction to exploratory manual testing. In the final strategy, I could imagine this as a semi-automated solution where a blind point can be created automatically, but the other visual part of the test is required by manual means.