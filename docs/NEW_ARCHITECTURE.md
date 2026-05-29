# INSATivity New Architecture Guide

Welcome to the newly refactored INSATivity architecture! This project follows a clean, layered **REST API pattern** (endpoints → middleware → models), with authentication handled by PHP sessions.

## 1. Directory Structure

The project strictly separates the **Frontend** (UI and API clients) from the **Backend** (API endpoints, Models, and Database connections).

```text
INSATivity/
├── .env                          # Environment variables (Supabase credentials)
├── pages/                        # HTML pages (UI)
├── styles/                       # CSS files
├── scripts/                      # Frontend JavaScript
│   ├── api.js                    # The centralized API client (headers, fetches, session cookie)
│   ├── config.js                 # Configuration file (holds API_BASE_URL)
│   ├── events.js                 # UI logic for Events page
│   ├── clubs.js                  # UI logic for Clubs page
│   └── ...
└── backend/                      # PHP Backend
    ├── api/                      # REST API Endpoints (Controllers)
    │   ├── auth.php              # Handles /login, /register, and /me
    │   ├── events.php            # Handles fetching, creating, updating events
    │   ├── clubs.php             # Handles fetching clubs
    │   └── media.php             # Handles image uploads
    ├── config/
    │   └── Database.php          # Database Singleton (connects to Supabase Postgres via PDO)
    ├── middleware/
    │   └── AuthMiddleware.php    # Intercepts requests, validates the PHP session, checks roles
    ├── models/                   # Data Layer (Direct DB interactions)
    │   ├── UserModel.php         # Queries for public.users
    │   ├── EventModel.php        # Queries for public.events
    │   ├── ClubModel.php         # Queries for public.clubs
    │   └── MediaModel.php        # Handles file system storage
    └── utils/
        └── Response.php          # Standardizes `{success: bool, data: ...}` outputs
```

## 2. Core Concepts

### A. Separation of Concerns
- **Endpoints (`backend/api/`)** do NOT contain database logic. They only receive the request, validate it via Middleware, pass it to a Model, and format the response using `Response::success()`.
- **Models (`backend/models/`)** do NOT handle HTTP requests or sessions. They only write raw SQL queries, execute them via PDO, and return raw arrays/objects.
- **Frontend Scripts (`scripts/`)** do NOT use `fetch()` randomly. They all import the centralized `API` object from `api.js` to ensure consistent headers and error handling.

### B. Session-Based Authentication
Authentication uses **PHP native sessions**. When a user logs in (or registers), the backend stores the authenticated user in `$_SESSION['user']` and PHP issues a `PHPSESSID` cookie. The browser automatically sends that cookie on every subsequent same-origin request, so the frontend does not manage any tokens. `AuthMiddleware` validates the session on protected endpoints, and `POST /auth.php?action=logout` destroys it. The frontend only caches the user object in `localStorage` for role-based UI rendering — it is not used for authentication.

### C. Standardized Responses
Every API endpoint uses `backend/utils/Response.php` to guarantee a consistent JSON output format:
**Success:**
```json
{
  "success": true,
  "data": { "id": 1, "title": "Example Event" },
  "message": "Operation successful"
}
```
**Error:**
```json
{
  "success": false,
  "error": "Authentication required. Please log in.",
  "code": "AUTH_MISSING"
}
```

---
**See the scenario files for deep-dives into specific flows:**
- [Authentication Flow (`SCENARIO_AUTH_FLOW.md`)](SCENARIO_AUTH_FLOW.md)
- [Data Fetching Flow (`SCENARIO_DATA_FETCH.md`)](SCENARIO_DATA_FETCH.md)
