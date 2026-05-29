import { CONFIG } from './config.js';

class ApiClient {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }

    // Helper for request headers. Auth is handled by the PHP session cookie,
    // which the browser sends automatically on same-origin requests.
    getHeaders(isFormData = false) {
        const headers = {};
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    }

    // Core Fetch Method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        // Always send the session cookie with API requests.
        options.credentials = options.credentials || 'same-origin';

        try {
            const response = await fetch(url, options);
            const data = await response.json();

            if (!response.ok) {
                // If the session is missing/expired, auto logout
                if (response.status === 401 && endpoint !== '/auth.php?action=login') {
                    this.logout();
                }
                throw new Error(data.error || 'API Request Failed');
            }

            return data.data; // Response.php wraps in {success: true, data: ...}
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // ---- AUTHENTICATION ----
    async login(username, password) {
        const data = await this.request('/auth.php?action=login', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ username, password })
        });
        if (data && data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    }

    async register(userData) {
        const data = await this.request('/auth.php?action=register', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(userData)
        });
        if (data && data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    }

    async logout() {
        // Destroy the server-side session, then clear the cached user.
        try {
            await fetch(`${this.baseURL}/auth.php?action=logout`, {
                method: 'POST',
                credentials: 'same-origin'
            });
        } catch (e) {
            // Ignore network errors; still clear client state below.
        }
        localStorage.removeItem('user');
        window.location.href = 'login.html'; // Redirect to login page
    }

    async getMe() {
        return this.request('/auth.php?action=me', {
            headers: this.getHeaders()
        });
    }

    // ---- EVENTS ----
    async getEvents() {
        return this.request('/events.php?action=getAll', {
            headers: this.getHeaders()
        });
    }

    async getEventById(id) {
        return this.request(`/events.php?action=get&id=${id}`, {
            headers: this.getHeaders()
        });
    }

    async getEventsByClub(club) {
        return this.request(`/events.php?action=getByClub&club=${encodeURIComponent(club)}`, {
            headers: this.getHeaders()
        });
    }

    async createEvent(eventData) {
        return this.request('/events.php?action=create', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(eventData)
        });
    }

    async updateEvent(id, eventData) {
        return this.request(`/events.php?action=update&id=${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(eventData)
        });
    }

    async approveEvent(id) {
        return this.request(`/events.php?action=approve&id=${id}`, {
            method: 'PATCH',
            headers: this.getHeaders()
        });
    }

    async deleteEvent(id) {
        return this.request(`/events.php?action=delete&id=${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
    }

    async reviewEvent(id, reviewData) {
        return this.request(`/events.php?action=review&id=${id}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(reviewData)
        });
    }

    async submitEventFeedback(feedbackData) {
        return this.request('/events.php?action=feedback', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(feedbackData)
        });
    }

    // ---- CLUBS ----
    async getClubs() {
        return this.request('/clubs.php?action=getAll', {
            headers: this.getHeaders()
        });
    }

    async getClubById(id) {
        return this.request(`/clubs.php?action=get&id=${id}`, {
            headers: this.getHeaders()
        });
    }

    // ---- MEDIA ----
    async uploadMedia(file, prefix = '') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('prefix', prefix);

        return this.request('/media.php?action=upload', {
            method: 'POST',
            headers: this.getHeaders(true), // Don't set Content-Type, let browser handle FormData boundaries
            body: formData
        });
    }
}

export const API = new ApiClient();

// Globally bind logout links
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.logout-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                API.logout();
            });
        });
    });
}
