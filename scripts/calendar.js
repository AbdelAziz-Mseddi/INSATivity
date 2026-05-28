import { API } from './api.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CAT = {
    academic: { pill: 'pill-blue', badge: 'badge-blue', label: 'Academic' },
    sports: { pill: 'pill-green', badge: 'badge-green', label: 'Sports' },
    culture: { pill: 'pill-purple', badge: 'badge-purple', label: 'Cultural' },
    career: { pill: 'pill-gold', badge: 'badge-gold', label: 'Career' },
    social: { pill: 'pill-red', badge: 'badge-red', label: 'Social' },
    other: { pill: 'pill-grey', badge: 'badge-grey', label: 'Other' },
};

let events = [];
let current = { year: new Date().getFullYear(), month: new Date().getMonth() };
let selected = null;

const TODAY = new Date();
const T = { y: TODAY.getFullYear(), m: TODAY.getMonth(), d: TODAY.getDate() };

const $ = id => document.getElementById(id);
const calGrid = $('calGrid');
const calMonthLabel = $('calMonthLabel');
const calYearLabel = $('calYearLabel');
const btnPrev = $('btnPrev');
const btnNext = $('btnNext');
const btnToday = $('btnToday');
const dayPanel = $('dayPanel');
const dayPanelOverlay = $('dayPanelOverlay');
const dayPanelTitle = $('dayPanelTitle');
const dayPanelList = $('dayPanelList');
const btnClosePanel = $('btnClosePanel');
const searchBar = document.querySelector('.search-bar');
const featuredList = $('featuredList');

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await API.getEvents();
        if (data) {
            events = data.filter(e => e.is_approved);
        }
    } catch (e) {
        console.error("Failed to load events for calendar:", e);
    }

    renderCalendar();
    renderFeatured();
    bindControls();
    bindDayPanel();
    bindSearch();
});

function renderCalendar() {
    const { year, month } = current;

    calMonthLabel.textContent = MONTHS[month];
    calYearLabel.textContent = year;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const totalCells = 42;

    const frag = document.createDocumentFragment();
    calGrid.querySelectorAll('.day-name').forEach(n => frag.appendChild(n));

    for (let i = 0; i < totalCells; i++) {
        let cellDay, cellMonth, cellYear, isMuted = false;

        if (i < firstDay) {
            cellDay = daysInPrev - firstDay + 1 + i;
            cellMonth = month === 0 ? 11 : month - 1;
            cellYear = month === 0 ? year - 1 : year;
            isMuted = true;
        } else if (i >= firstDay + daysInMonth) {
            cellDay = i - firstDay - daysInMonth + 1;
            cellMonth = month === 11 ? 0 : month + 1;
            cellYear = month === 11 ? year + 1 : year;
            isMuted = true;
        } else {
            cellDay = i - firstDay + 1;
            cellMonth = month;
            cellYear = year;
        }

        const isToday = !isMuted && cellDay === T.d && cellMonth === T.m && cellYear === T.y;
        const isWeekend = (i % 7 === 0) || (i % 7 === 6);
        const dateStr = toDateStr(cellYear, cellMonth, cellDay);
        const dayEvts = events.filter(e => e.date === dateStr);

        const cell = document.createElement('div');
        cell.className = [
            'calendar-day',
            isMuted ? 'muted' : '',
            isToday ? 'current' : '',
            !isMuted && isWeekend ? 'weekend' : '',
            !isMuted && dayEvts.length ? 'has-event' : '',
            isSelected(cellYear, cellMonth, cellDay) ? 'selected' : '',
        ].filter(Boolean).join(' ');

        const num = document.createElement('span');
        num.className = 'day-number';
        num.textContent = cellDay;
        cell.appendChild(num);

        if (!isMuted && dayEvts.length) {
            const MAX = 2;
            dayEvts.slice(0, MAX).forEach(evt => {
                const pill = document.createElement('span');
                const isDone = evt.status === 'finished';
                const pillClass = isDone ? 'pill-grey' : 'pill-red';
                pill.className = `event-pill ${pillClass}`;
                pill.textContent = evt.title;
                cell.appendChild(pill);
            });
            if (dayEvts.length > MAX) {
                const more = document.createElement('span');
                more.className = 'event-pill pill-more';
                more.textContent = `+${dayEvts.length - MAX}`;
                cell.appendChild(more);
            }
        }

        if (!isMuted) {
            cell.addEventListener('click', () => selectDay(cellYear, cellMonth, cellDay));
        }

        frag.appendChild(cell);
    }

    calGrid.innerHTML = '';
    calGrid.appendChild(frag);

    calGrid.classList.remove('cal-animate');
    void calGrid.offsetWidth; // force reflow to restart animation
    calGrid.classList.add('cal-animate');
}

function selectDay(year, month, day) {
    selected = { year, month, day };
    renderCalendar();
    openDayPanel(year, month, day);
}

function openDayPanel(year, month, day) {
    const dateStr = toDateStr(year, month, day);
    const dayEvts = events.filter(e => e.date === dateStr);
    const dow = new Date(year, month, day).getDay();

    dayPanelTitle.textContent = `${DAYS[dow]}, ${MONTHS[month]} ${day}, ${year}`;

    if (dayEvts.length === 0) {
        dayPanelList.innerHTML = `<p class="no-events-msg">No events scheduled.</p>`;
    } else {
        const frag = document.createDocumentFragment();
        dayEvts.forEach(evt => {
            const cat = CAT[evt.category || 'other'] || CAT.other;
            const item = document.createElement('div');
            item.className = 'agenda-item';
            const isDone = evt.status === 'finished';
            const accentClass = isDone ? 'pill-grey' : 'pill-red';
            item.innerHTML = `
                <div class="agenda-accent ${accentClass}"></div>
                <div class="agenda-info">
                    <span class="agenda-time">${evt.time || '—'}</span>
                    <span class="agenda-name">${evt.title}</span>
                    ${evt.location ? `<span class="agenda-loc">📍 ${evt.location}</span>` : ''}
                    ${evt.description ? `<p class="agenda-desc">${evt.description}</p>` : ''}
                </div>`;
            frag.appendChild(item);
        });
        dayPanelList.innerHTML = '';
        dayPanelList.appendChild(frag);
    }

    dayPanelOverlay.classList.add('open');
}

function closeDayPanel() {
    dayPanelOverlay.classList.remove('open');
    selected = null;
    renderCalendar();
}

function bindDayPanel() {
    btnClosePanel.addEventListener('click', closeDayPanel);
    dayPanelOverlay.addEventListener('click', e => { if (e.target === dayPanelOverlay) closeDayPanel(); });
}

function renderFeatured(filter = '') {
    const lower = filter.toLowerCase().trim();
    const nowStart = new Date(); nowStart.setHours(0, 0, 0, 0);

    const list = events
        .filter(e => new Date(e.date) >= nowStart)
        .filter(e => !lower
            || e.title.toLowerCase().includes(lower)
            || (e.location || '').toLowerCase().includes(lower)
            || (e.category || 'other').toLowerCase().includes(lower))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 8);

    if (list.length === 0) {
        featuredList.innerHTML = `<p class="no-events-msg" style="padding:1rem 0;">No events match your search.</p>`;
        return;
    }

    const frag = document.createDocumentFragment();
    list.forEach(evt => {
        const cat = CAT[evt.category || 'other'] || CAT.other;
        const dateLabel = new Date(evt.date + 'T00:00')
            .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const desc = evt.description
            ? evt.description.slice(0, 65) + (evt.description.length > 65 ? '…' : '')
            : '';

        const card = document.createElement('article');
        card.className = 'event-card';
        card.innerHTML = `
            <div class="card-image featured-color-${evt.category || 'other'}"></div>
            <div class="card-content">
                <span class="badge ${cat.badge}">${cat.label}</span>
                <h4>${evt.title}</h4>
                <p class="meta">📍 ${evt.location || '—'} &nbsp;•&nbsp; ${dateLabel} &nbsp;•&nbsp; ${evt.time || '—'}</p>
                ${desc ? `<p class="card-desc">${desc}</p>` : ''}
            </div>`;

        card.addEventListener('click', () => {
            const d = new Date(evt.date + 'T00:00');
            current = { year: d.getFullYear(), month: d.getMonth() };
            selectDay(d.getFullYear(), d.getMonth(), d.getDate());
        });

        frag.appendChild(card);
    });

    featuredList.innerHTML = '';
    featuredList.appendChild(frag);
}

function bindControls() {
    btnPrev.addEventListener('click', () => {
        current.month === 0 ? (current.month = 11, current.year--) : current.month--;
        closeDayPanel();
    });

    btnNext.addEventListener('click', () => {
        current.month === 11 ? (current.month = 0, current.year++) : current.month++;
        closeDayPanel();
    });

    btnToday.addEventListener('click', () => {
        current = { year: T.y, month: T.m };
        closeDayPanel();
        selectDay(T.y, T.m, T.d);
    });

    btnClosePanel.addEventListener('click', closeDayPanel);

}

function bindSearch() {
    if (!searchBar) return;
    let timer;
    searchBar.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => renderFeatured(searchBar.value), 200);
    });
}

function toDateStr(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function isSelected(y, m, d) {
    return selected && selected.year === y && selected.month === m && selected.day === d;
}
