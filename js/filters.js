// Shared timeframe/zone/contact/billable filtering used by both Logs and Reports.
import * as state from './state.js';

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
export function startOfWeek(d) {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - dow);
  return x;
}
export function endOfWeek(d) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return endOfDay(e);
}
export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function endOfMonth(d) {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function getRange(period, anchor) {
  if (period === 'day') return [startOfDay(anchor), endOfDay(anchor)];
  if (period === 'week') return [startOfWeek(anchor), endOfWeek(anchor)];
  return [startOfMonth(anchor), endOfMonth(anchor)];
}

export function shiftAnchor(period, anchor, dir) {
  const d = new Date(anchor);
  if (period === 'day') d.setDate(d.getDate() + dir);
  else if (period === 'week') d.setDate(d.getDate() + 7 * dir);
  else d.setMonth(d.getMonth() + dir);
  return d;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtShort(d) {
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function formatRangeLabel(period, anchor) {
  const [start, end] = getRange(period, anchor);
  if (period === 'day') {
    return `${DAYS[start.getDay()]}, ${start.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
  }
  if (period === 'week') {
    const sameYear = start.getFullYear() === end.getFullYear();
    return `${fmtShort(start)} – ${fmtShort(end)}${sameYear ? ' ' + end.getFullYear() : ''}`;
  }
  return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
}

export function filterEntries(entries, { range, zoneId, contactId, billable }) {
  const [start, end] = range;
  return entries.filter((e) => {
    const entryStart = new Date(e.start);
    if (entryStart < start || entryStart > end) return false;
    if (zoneId && zoneId !== 'all' && e.zoneId !== zoneId) return false;
    if (contactId && contactId !== 'all' && e.contactId !== contactId) return false;
    if (billable === 'billable' && !e.billable) return false;
    if (billable === 'non-billable' && e.billable) return false;
    return true;
  });
}

export function durationHours(entry) {
  const ms = new Date(entry.end).getTime() - new Date(entry.start).getTime();
  return Math.max(0, ms / 3600000);
}

// Formats a decimal hours value as "3h 20m" / "45m" / "2h" — human-readable
// rather than a raw decimal like "3.33".
export function formatDuration(hours) {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Renders a shared filter bar (timeframe w/ prev-next, zone, contact, billable) into `container`.
// `filterState` is mutated in place; `onChange` is called after any control changes.
export function renderFilterBar(container, filterState, onChange) {
  const zones = state.allZones();
  const contacts = state.allContacts();

  container.innerHTML = `
    <div class="filter-bar">
      <div class="filter-row filter-timeframe">
        <select data-filter="period">
          <option value="day" ${filterState.period === 'day' ? 'selected' : ''}>Day</option>
          <option value="week" ${filterState.period === 'week' ? 'selected' : ''}>Week</option>
          <option value="month" ${filterState.period === 'month' ? 'selected' : ''}>Month</option>
        </select>
        <div class="filter-nav">
          <button type="button" class="icon-btn" data-action="prev" aria-label="Previous period">&#8249;</button>
          <span class="filter-range-label">${formatRangeLabel(filterState.period, filterState.anchor)}</span>
          <button type="button" class="icon-btn" data-action="next" aria-label="Next period">&#8250;</button>
        </div>
        <button type="button" class="btn btn-link" data-action="today">Today</button>
      </div>
      <div class="filter-row">
        <select data-filter="zoneId">
          <option value="all">All zones</option>
          ${zones.map((z) => `<option value="${z.id}" ${filterState.zoneId === z.id ? 'selected' : ''}>${escapeHtml(z.name)}${z.archived ? ' (archived)' : ''}</option>`).join('')}
        </select>
        <select data-filter="contactId">
          <option value="all">All references</option>
          ${contacts.map((c) => `<option value="${c.id}" ${filterState.contactId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}${c.archived ? ' (archived)' : ''}</option>`).join('')}
        </select>
        <select data-filter="billable">
          <option value="all" ${filterState.billable === 'all' ? 'selected' : ''}>All time</option>
          <option value="billable" ${filterState.billable === 'billable' ? 'selected' : ''}>Billable</option>
          <option value="non-billable" ${filterState.billable === 'non-billable' ? 'selected' : ''}>Non-billable</option>
        </select>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-filter]').forEach((el) => {
    el.addEventListener('change', () => {
      const key = el.dataset.filter;
      filterState[key] = el.value;
      onChange(filterState);
    });
  });
  container.querySelector('[data-action="prev"]').addEventListener('click', () => {
    filterState.anchor = shiftAnchor(filterState.period, filterState.anchor, -1);
    onChange(filterState);
  });
  container.querySelector('[data-action="next"]').addEventListener('click', () => {
    filterState.anchor = shiftAnchor(filterState.period, filterState.anchor, 1);
    onChange(filterState);
  });
  container.querySelector('[data-action="today"]').addEventListener('click', () => {
    filterState.anchor = new Date();
    onChange(filterState);
  });
}
