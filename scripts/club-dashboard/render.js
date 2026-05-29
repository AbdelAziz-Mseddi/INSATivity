import {
  canManageClub,
  escapeHtml,
  formatEventDate,
  getCurrentUser,
  getEventTheme,
  getRelativeDateLabel
} from './utils.js';
// njibou l elements necessaires li bech n manipuliwhom
export function getDashboardDom() {
  return {
    sidebar: document.querySelector('.sidebar'),
    panels: Array.from(document.querySelectorAll('[data-panel]')),
    createForm: document.querySelector('.event-create-form'),
    profileNameEl: document.querySelector('.club-name'),
    profileDescriptionEl: document.querySelector('.club-description'),
    profileBannerEl: document.querySelector('.club-banner'),
    profileLogoEl: document.querySelector('.club-logo'),
    profileTagsEl: document.querySelector('.club-tags'),
    metaLabelEls: Array.from(document.querySelectorAll('.club-meta-label')),
    metaValueEls: Array.from(document.querySelectorAll('.club-meta-value')),
    pendingList: document.querySelector('.pending-list'),
    pendingStatus: document.querySelector('.pending-status'),
    pendingTitle: document.querySelector('.pending-title'),
    historyList: document.querySelector('.history-list'),
    historyTitle: document.querySelector('.history-title'),
    doneList: document.querySelector('.done-list'),
    doneStatus: document.querySelector('.done-status'),
    doneTitle: document.querySelector('.done-title'),
    feedbackSelect: document.getElementById('feedback-event')
  };
}
// nkhabiw l panels li ma hajetnech bihom w n7otou l panel li hajetna biha (name)
export function showPanel(dom, name) {
  dom.panels.forEach(panel => {
    panel.hidden = panel.dataset.panel !== name;
  });
  // tabdil alwen l links
  dom.sidebar?.querySelectorAll('.sidebar_link').forEach(link => {
    link.classList.toggle('active', link.dataset.target === name);
  });
}
// ena nestaamel li fou9i 
export function bindSidebar(dom) {
  // closest tetla3 fel tree mte3 l dom w trajaalek soit awel element hajtek bih soit null
  // a9al memory men eventListener fi kol link + cleaner
  dom.sidebar?.addEventListener('click', event => {
    const link = event.target.closest('.sidebar_link');
    if (!link?.dataset.target) return;
    showPanel(dom, link.dataset.target);
  });
  // ndhahrou awel panel tji 9odemna initialement (houni hiya l profile)
  // bech l user ma ychoufech page bidha
  // depth-first search default for all CSS selectors in JavaScript: querySelector, querySelectorAll, getElementsBy*, etc.
  const first = dom.sidebar?.querySelector('.sidebar_link[data-target]');
  if (first?.dataset.target) {
    showPanel(dom, first.dataset.target);
  }
}
// Show the club-management links (Create / Pending / Done) only to the club's
// moderator or an admin. Normal users get the read-only club view (Profile,
// Community Feedback, History). Returns whether the viewer can manage the club.
export function applyRoleVisibility(dom, club) {
  const canManage = canManageClub(getCurrentUser(), club.id);

  dom.sidebar?.querySelectorAll('.sidebar_link[data-role="admin"]').forEach(link => {
    link.hidden = !canManage;
  });

  // If a management panel is currently active but the viewer can't manage it,
  // fall back to the public profile panel.
  if (!canManage) {
    const active = dom.sidebar?.querySelector('.sidebar_link.active');
    if (active?.dataset.role === 'admin') {
      showPanel(dom, 'profile');
    }
  }

  return canManage;
}
// naamlou "resultat" lel form submission kenha mouch mawjouda, snn nbadlouha
export function setFormStatus(dom, message, isError = false) {
  if (!dom.createForm) return;

  let status = dom.createForm.querySelector('.form-status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'form-status';
    status.style.marginTop = '12px';
    status.style.fontSize = '14px';
    dom.createForm.appendChild(status);
  }

  status.textContent = message;
  status.style.color = isError ? '#b42318' : '#027a48';
}
// njibou l logo mte3 l club
function getClubLogoPath(club) {
  return `../assets/images/${club.id}/profile.jpg`;
}
// naltkhou l panel mte3 l profile
export function renderClubProfile(dom, club, events) {
  // nbadlou ism l'onglet hasb l club
  document.title = `INSATivity | ${club.name} Dashboard`;
  // ism l club w description mte3ou ken mawjouda
  if (dom.profileNameEl) dom.profileNameEl.textContent = club.name;
  if (dom.profileDescriptionEl) {
    dom.profileDescriptionEl.textContent = club.description || 'No description available.';
  }
  // l banner mte3 l club
  if (dom.profileBannerEl) {
    dom.profileBannerEl.style.backgroundImage = `linear-gradient(120deg, rgba(43, 62, 78, 0.75), rgba(130, 6, 8, 0.75)), url('${club.banner}')`;
    dom.profileBannerEl.style.backgroundPosition = 'center';
    dom.profileBannerEl.style.backgroundSize = 'cover';
  }
  // logo l club
  if (dom.profileLogoEl) {
    const logoPath = getClubLogoPath(club);
    dom.profileLogoEl.innerHTML = `<img src="${logoPath}" alt="${escapeHtml(club.name)} logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"/>`;
    dom.profileLogoEl.setAttribute('aria-hidden', 'false');
  }
  // tags (ism fac, id, category)
  if (dom.profileTagsEl) {
    const tags = [club.category, club.id.toUpperCase(), 'INSAT'];
    dom.profileTagsEl.innerHTML = tags
      .filter(Boolean)
      .map(tag => `<span class="club-tag">${escapeHtml(tag)}</span>`)
      .join('');
  }
  // somme nombre participants fel events + local
  const totalParticipants = events.reduce((sum, event) => sum + Number(event.participants || 0), 0);
  const topLocation = events[0]?.location || 'Various locations';
  // pour le moment l local ghalet taw nsal7ouha
  if (dom.metaLabelEls[0]) dom.metaLabelEls[0].textContent = 'Participants';
  if (dom.metaValueEls[0]) dom.metaValueEls[0].textContent = String(totalParticipants);
  if (dom.metaLabelEls[1]) dom.metaLabelEls[1].textContent = 'Main Venue';
  if (dom.metaValueEls[1]) dom.metaValueEls[1].textContent = topLocation;
}
// panel l <pending> events (yestanew fel confirmation mel admin)
// pour le moment l pending wel finished wel history mazel mouch mriguel
export function renderPendingEvents(dom, club, upcomingEvents) {
  if (dom.pendingTitle) dom.pendingTitle.textContent = `${club.name} Pending Events`;
  if (dom.pendingStatus) dom.pendingStatus.textContent = `${upcomingEvents.length} awaiting review`;
  if (!dom.pendingList) return;

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  console.log("Current user for admin check:", user);
  const isAdmin = user && String(user.role).trim().toLowerCase() === 'admin';

  if (!upcomingEvents.length) {
    dom.pendingList.innerHTML = '<article class="pending-card"><div class="pending-body"><h3 class="pending-name">No upcoming events for this club.</h3></div></article>';
    return;
  }

  dom.pendingList.innerHTML = upcomingEvents
    .map((event, index) => {
      const theme = getEventTheme(index);
      const safeTitle = escapeHtml(event.title);
      const safeDescription = escapeHtml(event.description || 'No description provided.');
      const safeLocation = escapeHtml(event.location || 'Location TBA');

      return `
        <article class="pending-card">
          <div
            class="pending-cover"
            data-theme="${theme}"
            aria-label="${safeTitle} cover"
            style="background-image: linear-gradient(135deg, rgba(43, 62, 78, 0.8), rgba(130, 6, 8, 0.7)), url('${escapeHtml(event.image || '')}'); background-size: cover; background-position: center;"
          >
            <span class="pending-cover-label">Upcoming</span>
          </div>
          <div class="pending-body">
            <div class="pending-meta">
              <span class="pending-badge">Awaiting approval</span>
              <span class="pending-date">${escapeHtml(getRelativeDateLabel(event.date, event.time, true))}</span>
            </div>
            <h3 class="pending-name">${safeTitle}</h3>
            <div class="pending-tags">
              <span class="club-tag">${escapeHtml(club.category || 'Event')}</span>
              <span class="club-tag">${safeLocation}</span>
              ${event.featured ? '<span class="club-tag">Featured</span>' : ''}
            </div>
            <p class="pending-description">${safeDescription}</p>
            <p class="pending-description">${escapeHtml(formatEventDate(event.date, event.time))}</p>
            ${isAdmin ? `
            <div class="pending-actions" style="margin-top: 15px; display: flex; gap: 10px;">
              <button class="btn btn-success approve-btn" data-id="${event.id}" style="background-color: #027a48; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;">Accept</button>
              <button class="btn btn-danger reject-btn" data-id="${event.id}" style="background-color: #b42318; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;">Refuse</button>
            </div>
            ` : ''}
          </div>
        </article>
      `;
    })
    .join('');
}
// panel l <history> events (finished + rated men admin l club)
export function renderHistoryEvents(dom, club, finishedEvents) {
  if (dom.historyTitle) dom.historyTitle.textContent = `${club.name} History`;
  if (!dom.historyList) return;

  if (!finishedEvents.length) {
    dom.historyList.innerHTML = '<article class="history-card"><div class="history-body"><h3 class="history-name">No archived events for this club yet.</h3></div></article>';
    return;
  }

  dom.historyList.innerHTML = finishedEvents
    .map((event, index) => {
      const theme = getEventTheme(index);
      const safeTitle = escapeHtml(event.title);
      const safeDescription = escapeHtml(event.description || 'No description provided.');
      const safeLocation = escapeHtml(event.location || 'Location TBA');
      const participants = Number(event.participants || 0);

      return `
        <article class="history-card">
          <div
            class="history-cover"
            data-theme="${theme}"
            aria-label="${safeTitle} cover"
            style="background-image: linear-gradient(135deg, rgba(43, 62, 78, 0.8), rgba(130, 6, 8, 0.7)), url('${escapeHtml(event.image || '')}'); background-size: cover; background-position: center;"
          >
            <span class="history-cover-label">Past event</span>
          </div>
          <div class="history-body">
            <div class="history-meta">
              <span class="history-badge">Archived</span>
              <span class="history-date">${escapeHtml(getRelativeDateLabel(event.date, event.time, false))}</span>
            </div>
            <h3 class="history-name">${safeTitle}</h3>
            <div class="history-tags">
              <span class="club-tag">${escapeHtml(club.category || 'Event')}</span>
              <span class="club-tag">${safeLocation}</span>
            </div>
            <p class="history-description">${safeDescription}</p>
            <div class="history-stats">
              <div class="history-stat">
                <span class="history-stat-label">Date</span>
                <span class="history-stat-value">${escapeHtml(formatEventDate(event.date, event.time))}</span>
              </div>
              <div class="history-stat">
                <span class="history-stat-label">Attended</span>
                <span class="history-stat-value">${participants} people</span>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}
// panel l <done> events (finished + waiting for club admin review)
export function renderDoneEvents(dom, club, finishedEvents) {
  if (dom.doneTitle) dom.doneTitle.textContent = `${club.name} Done`;
  if (dom.doneStatus) dom.doneStatus.textContent = `${finishedEvents.length} awaiting review`;
  if (!dom.doneList) return;

  if (!finishedEvents.length) {
    dom.doneList.innerHTML = '<article class="done-card"><div class="done-event-body"><h3 class="done-name">No finished events to review yet.</h3></div></article>';
    return;
  }

  dom.doneList.innerHTML = finishedEvents
    .map((event, index) => {
      const theme = getEventTheme(index);
      const safeTitle = escapeHtml(event.title);
      const safeDescription = escapeHtml(event.description || 'No description provided.');
      const safeLocation = escapeHtml(event.location || 'Location TBA');
      const eventId = Number(event.id || index + 1);

      return `
        <article class="done-card">
          <div class="done-event">
            <div
              class="done-cover"
              data-theme="${theme}"
              aria-label="${safeTitle} cover"
              style="background-image: linear-gradient(135deg, rgba(43, 62, 78, 0.8), rgba(130, 6, 8, 0.7)), url('${escapeHtml(event.image || '')}'); background-size: cover; background-position: center;"
            >
              <span class="done-cover-label">Ended</span>
            </div>
            <div class="done-event-body">
              <div class="done-meta">
                <span class="done-badge">Needs review</span>
                <span class="done-date">${escapeHtml(getRelativeDateLabel(event.date, event.time, false))}</span>
              </div>
              <h3 class="done-name">${safeTitle}</h3>
              <div class="done-tags">
                <span class="club-tag">${escapeHtml(club.category || 'Event')}</span>
                <span class="club-tag">${safeLocation}</span>
              </div>
              <p class="done-description">${safeDescription}</p>
            </div>
          </div>
          <div class="done-review">
            <h4 class="done-review-title">Complete event review</h4>
            <form class="done-review-form">
              <div class="done-form-row">
                <div class="form-field">
                  <label class="form-label" for="done-rating-${eventId}">How well did it go? (0-5)</label>
                  <input
                    class="form-input"
                    id="done-rating-${eventId}"
                    name="done-rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    placeholder="0-5"
                    required
                  />
                </div>
                <div class="form-field">
                  <label class="form-label" for="done-attendance-${eventId}">Number attended</label>
                  <input
                    class="form-input"
                    id="done-attendance-${eventId}"
                    name="done-attendance"
                    type="number"
                    min="0"
                    placeholder="e.g. 45"
                    required
                  />
                </div>
              </div>
              <button class="btn btn-gold done-submit" type="submit">Move to history</button>
            </form>
          </div>
        </article>
      `;
    })
    .join('');
}
// rendering l student feedback options hasb l finished events
export function renderFeedbackEventOptions(dom, finishedEvents) {
  if (!dom.feedbackSelect) return;

  const defaultOption = '<option value="">Choose an event...</option>';
  const eventOptions = finishedEvents
    .map(event => {
      const eventId = escapeHtml(String(event.id || ''));
      const eventTitle = escapeHtml(event.title || 'Untitled event');
      return `<option value="${eventId}">${eventTitle}</option>`;
    })
    .join('');

  dom.feedbackSelect.innerHTML = `${defaultOption}${eventOptions}`;
}
// au cas ou saret mochkla fel fetch mte3 data
export function renderLoadError(dom, message) {
  if (dom.profileNameEl) dom.profileNameEl.textContent = 'Club not found';
  if (dom.profileDescriptionEl) {
    dom.profileDescriptionEl.textContent = message || 'Unable to load this club dashboard right now.';
  }
}
