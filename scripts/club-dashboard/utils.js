// Extracts the club ID from the URL query parameter (?club=acm)
// Returns lowercase trimmed string, or empty string if not present
export function getRequestedClubId() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("club") || "").trim().toLowerCase();
}

// Reads the cached logged-in user (stored by api.js on login/register).
// Used only for UI gating; the server is the source of truth for permissions.
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// The school administrator: can do anything, including approving pending events.
export function isAdminUser(user) {
  return !!user && String(user.role).trim().toLowerCase() === "admin";
}

// A user may manage a club's dashboard if they are an admin (any club) or that
// club's designated moderator (their user.club_id matches the club).
export function canManageClub(user, clubId) {
  if (isAdminUser(user)) return true;
  return (
    !!user &&
    user.club_id != null &&
    String(user.club_id).toLowerCase() === String(clubId).toLowerCase()
  );
}

// Normalizes text for consistent comparison: converts to string, trims spaces, and lowercases
// Useful for comparing names from different sources that may have spacing/casing differences
export function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

// for security against XSS (Cross-Site Scripting).
export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Cycles through theme names based on index (0→night, 1→art, 2→story, 3→night, etc.)
// Gives alternating visual styles to event cards using modulo arithmetic
export function getEventTheme(index) {
  const themes = ["night", "art", "story"];
  return themes[index % themes.length];
}

// Converts date (YYYY-MM-DD) and time (HH:mm) into a readable localized string
// Example: "2026-03-23" + "14:30" → "Mar 23, 2026, 2:30 PM"
export function formatEventDate(date, time) {
  if (!date) return "Date TBA";

  const [year, month, day] = String(date).split("-").map(Number);

  if (!year || !month || !day) return String(date);

  const hours = Number(String(time || "00:00").split(":")[0] || 0);
  const minutes = Number(String(time || "00:00").split(":")[1] || 0);
  const eventDate = new Date(year, month - 1, day, hours, minutes);

  return eventDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Generates friendly relative date labels: "Today", "In 3 days", "Ended 2 days ago", etc.
// isFuture=true for upcoming events, isFuture=false for past events
export function getRelativeDateLabel(date, time, isFuture) {
  if (!date) return isFuture ? "Upcoming" : "Completed";

  const [year, month, day] = String(date).split("-").map(Number);
  const hours = Number(String(time || "00:00").split(":")[0] || 0);
  const minutes = Number(String(time || "00:00").split(":")[1] || 0);

  const target = new Date(year, (month || 1) - 1, day || 1, hours, minutes);
  const now = new Date();
  const dayDiff = Math.round(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (isFuture) {
    if (dayDiff <= 0) return "Today";
    if (dayDiff === 1) return "In 1 day";
    return `In ${dayDiff} days`;
  }

  const ago = Math.abs(dayDiff);
  if (ago <= 0) return "Ended today";
  if (ago === 1) return "Ended 1 day ago";
  return `Ended ${ago} days ago`;
}

// Separates events into upcoming and finished arrays, sorted appropriately
// Upcoming: sorted by date ascending (nearest first)
// Finished: sorted by date descending (most recent first)
export function splitEventsByDate(events) {
  const now = new Date();
  const upcomingEvents = [];
  const finishedEvents = [];

  events.forEach((event) => {
    const datePart = String(event.date || "");
    const timePart = String(event.time || "00:00");
    const eventDate = new Date(`${datePart}T${timePart}`);

    if (!Number.isNaN(eventDate.getTime()) && eventDate > now) {
      upcomingEvents.push(event);
    } else {
      finishedEvents.push(event);
    }
  });

  upcomingEvents.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  finishedEvents.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return { upcomingEvents, finishedEvents };
}
