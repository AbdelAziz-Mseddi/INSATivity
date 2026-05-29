# Scenario: Data Fetching Flow (Loading Events)

This document traces exactly what happens when a user opens the homepage and the events are displayed on the screen.

## Phase 1: Requesting Data

1. **Page Load (`pages/index.html`)**
   - The user opens `index.html`.
   - The browser loads `<script type="module" src="../scripts/events.js?v=2"></script>`.
2. **Script Initialization (`scripts/events.js`)**
   - The `DOMContentLoaded` event listener triggers `loadEvents()`.
   - `loadEvents()` executes `const data = await API.getEvents();`.
3. **API Client Execution (`scripts/api.js`)**
   - The `API` client calls its internal `request('/events.php?action=getAll')` method.
   - It sends an HTTP `GET` request to the backend with the session cookie (`credentials: 'same-origin'`). Fetching events is a public action, so the endpoint does not require an authenticated session.

---

## Phase 2: Backend Processing

4. **Endpoint Routing (`backend/api/events.php`)**
   - The script detects `$_SERVER['REQUEST_METHOD'] === 'GET'` and `$_GET['action'] === 'getAll'`.
   - It instantiates the `EventModel` and calls `$model->getAllEvents()`.
5. **Database Interaction (`backend/models/EventModel.php`)**
   - The Model connects to Supabase via `Database::connect()`.
   - It executes a complex `JOIN` query to fetch events and their associated club details:
     ```sql
     SELECT e.id, e.title, c.name AS club, c.logo AS club_logo, e.image, ...
     FROM public.events e INNER JOIN public.clubs c ON c.id = e.club_id
     ORDER BY e.event_date DESC
     ```
   - It maps the raw SQL rows into clean, structured PHP arrays using `mapEvent()`.
6. **JSON Response (`backend/utils/Response.php`)**
   - `events.php` wraps the events array using `Response::success($events)`.
   - PHP sets the `Content-Type: application/json` header and prints the data as a JSON string back to the browser.

---

## Phase 3: Frontend Rendering

7. **API Client Unwrapping (`scripts/api.js`)**
   - The fetch promise resolves.
   - `api.js` parses the JSON and checks `response.ok`.
   - It detects `success: true` and extracts the `data` array from the wrapper, returning just the array of events to `events.js`.
8. **UI Updates (`scripts/events.js`)**
   - `eventsData = data;` stores the array in memory.
   - `renderFeaturedEvents()` and `renderUpcomingEvents()` are called.
   - These functions filter the data (e.g., `events.filter((event) => event.featured)`) and use `document.createElement` to build HTML cards (`div.event-card-featured`).
   - Finally, `appendChild()` is used to inject the cards into the DOM (`.featured-grid` and `.events-container`), making the events visible to the user!
