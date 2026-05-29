# Scenario: Authentication Flow (Login & Sessions)

This document traces exactly what happens when a user attempts to log in and subsequently accesses a protected resource. Authentication is handled by **PHP native sessions** — there are no tokens for the frontend to manage.

## Phase 1: The Login Request

1. **User Submits Form (`pages/login.html`)**
   - The user types their username and password and hits "Login".
2. **Frontend Interception (`scripts/login.js`)**
   - The script prevents the default HTML form submission.
   - It reads the input values and calls `API.login(username, password)`.
3. **API Client (`scripts/api.js`)**
   - `api.js` executes a `fetch` request to `../backend/api/auth.php?action=login` with `credentials: 'same-origin'` so the session cookie is exchanged.
   - Payload: `{"username": "roua", "password": "..."}`.
4. **Backend Endpoint (`backend/api/auth.php`)**
   - The endpoint calls `AuthMiddleware::startSession()` (which runs `session_start()`).
   - It detects `POST` and `action=login`, instantiates `UserModel`, and calls `$model->findByEmailOrUsername(...)`.
5. **Database Query (`backend/models/UserModel.php`)**
   - The Model executes a PDO prepared statement to fetch the user by username/email.
   - The endpoint verifies the password using `password_verify()`.
   - It removes the password hash from the result.
6. **Session Creation (`backend/api/auth.php`)**
   - The endpoint stores the authenticated user in `$_SESSION['user']`. PHP issues a `PHPSESSID` cookie in the response.
   - The endpoint responds with:
     ```json
     {
       "success": true,
       "data": { "user": { "id": 1, "username": "roua", "role": "student" } },
       "message": "Login successful"
     }
     ```
7. **Frontend State Saving (`scripts/api.js` & `scripts/login.js`)**
   - The browser stores the `PHPSESSID` cookie automatically.
   - `api.js` caches the `user` object in `localStorage` **only** for role-based UI rendering (not for authentication).
   - `login.js` detects success, shows a green message, and redirects the user to `index.html`.

---

## Phase 2: Accessing a Protected Route (e.g., Creating an Event)

1. **User Action (`scripts/club-dashboard/api.js`)**
   - A club member submits a new event form. The script calls `API.createEvent(payload)`.
2. **API Client Sends the Session Cookie (`scripts/api.js`)**
   - `api.js` issues the request with `credentials: 'same-origin'`, so the browser automatically attaches the `PHPSESSID` cookie. No `Authorization` header is involved.
3. **Backend Middleware Validation (`backend/api/events.php` -> `AuthMiddleware.php`)**
   - `events.php` hits the line: `AuthMiddleware::requireRole(['admin', 'student']);`.
   - `AuthMiddleware` resumes the session (`session_start()`) and checks `$_SESSION['user']`.
   - If the session is missing, it returns a `401 AUTH_MISSING` error.
   - It then verifies that the user's role allows them to perform this action (otherwise `403 FORBIDDEN`).
4. **Execution & Success**
   - If the session is valid, `events.php` continues, passes the payload to `EventModel`, inserts it into the database, and returns the new event data.

---

## Logout

- The frontend calls `POST /auth.php?action=logout`, which clears `$_SESSION`, expires the `PHPSESSID` cookie, and calls `session_destroy()`.
- `api.js` then removes the cached `user` from `localStorage` and redirects to `login.html`.
