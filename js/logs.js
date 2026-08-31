// Logs tab: filterable, editable, deletable list of entries.
import * as state from './state.js';
import * as modal from './modal.js';
import { renderFilterBar, filterEntries, durationHours, getRange, formatDuration } from './filters.js';

const filterBarEl = document.getElementById('logs-filter-bar');
const listEl = document.getElementById('logs-list');
const summaryEl = document.getElementById('logs-summary');
const manualBtn = document.getElementById('logs-manual-entry-btn');

const filterState = {
  period: 'week',
  anchor: new Date(),
  zoneId: 'all',
  contactId: 'all',
  billable: 'all',
};

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtHours(h) {
  return formatDuration(h);
}

function render() {
  renderFilterBar(filterBarEl, filterState, render);

  const data = state.getData();
  const range = getRange(filterState.period, filterState.anchor);
  const filtered = filterEntries(data.entries, {
    range,
    zoneId: filterState.zoneId,
    contactId: filterState.contactId,
    billable: filterState.billable,
  }).sort((a, b) => new Date(b.start) - new Date(a.start));

  const totalHours = filtered.reduce((sum, e) => sum + durationHours(e), 0);
  const billableHours = filtered.filter((e) => e.billable).reduce((sum, e) => sum + durationHours(e), 0);
  summaryEl.innerHTML = `<strong>${filtered.length}</strong> entries &middot; ${fmtHours(totalHours)} total &middot; ${fmtHours(billableHours)} billable`;

  if (!filtered.length) {
    listEl.innerHTML = '<p class="empty-state">No entries for this filter.</p>';
    return;
  }

  listEl.innerHTML = filtered
    .map((e) => {
      const zone = state.getZone(e.zoneId);
      const contact = e.contactId ? state.getContact(e.contactId) : null;
      const zoneColor = zone ? zone.color : '#999';
      return `
        <div class="log-row" data-entry-id="${e.id}">
          <span class="log-zone-dot" style="background:${zoneColor}"></span>
          <div class="log-main">
            <div class="log-title">
              <span class="log-zone-name">${zone ? escapeHtml(zone.name) : 'Unknown zone'}</span>
              ${e.billable ? '<span class="badge badge-billable">Billable</span>' : ''}
            </div>
            <div class="log-desc">${escapeHtml(e.description) || '<span class="muted">No description</span>'}</div>
            <div class="log-meta">
              ${contact ? escapeHtml(contact.name) + ' &middot; ' : ''}${fmtTime(e.start)} &ndash; ${fmtTime(e.end)} &middot; ${fmtHours(durationHours(e))}
            </div>
            ${e.notes ? `<div class="log-notes">${escapeHtml(e.notes)}</div>` : ''}
          </div>
          <div class="log-menu">
            <button type="button" class="icon-btn log-menu-btn" data-action="menu" aria-label="More actions">&#8942;</button>
            <div class="log-menu-dropdown hidden">
              <button type="button" data-action="edit">Edit</button>
              <button type="button" data-action="start-new">Start new</button>
              <button type="button" data-action="delete">Delete</button>
            </div>
          </div>
        </div>`;
    })
    .join('');

  listEl.querySelectorAll('.log-menu-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = btn.nextElementSibling;
      const wasOpen = !dropdown.classList.contains('hidden');
      closeAllMenus();
      if (!wasOpen) dropdown.classList.remove('hidden');
    });
  });
  listEl.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('.log-row').dataset.entryId;
      closeAllMenus();
      modal.openEdit(id);
    });
  });
  listEl.querySelectorAll('[data-action="start-new"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      closeAllMenus();
      const id = e.target.closest('.log-row').dataset.entryId;
      const entry = state.getEntry(id);
      if (!entry) return;
      const started = await state.startTimerChecked(entry.zoneId, {
        contactId: entry.contactId,
        billable: entry.billable,
        description: entry.description,
        notes: entry.notes,
      });
      if (started) window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'timer' }));
    });
  });
  listEl.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      closeAllMenus();
      const id = e.target.closest('.log-row').dataset.entryId;
      if (confirm('Delete this entry? This cannot be undone.')) {
        state.deleteEntry(id);
      }
    });
  });
}

function closeAllMenus() {
  listEl.querySelectorAll('.log-menu-dropdown').forEach((el) => el.classList.add('hidden'));
}

document.addEventListener('click', closeAllMenus);

export function init() {
  manualBtn.addEventListener('click', () => modal.openManual());
  state.subscribe(render);
  render();
}
