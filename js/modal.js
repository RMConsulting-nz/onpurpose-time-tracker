// Shared entry modal: starting a timer, editing a running timer's details,
// adding a manual log entry, and editing/deleting an existing log entry.
import * as state from './state.js';

const overlay = document.getElementById('modal-overlay');
const content = document.getElementById('modal-content');

function pad(n) {
  return String(n).padStart(2, '0');
}
function isoToLocalInput(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localInputToIso(value) {
  return new Date(value).toISOString();
}
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function zoneOptions(selectedId) {
  const zones = state.allZones().filter((z) => !z.archived || z.id === selectedId);
  return zones
    .map((z) => `<option value="${z.id}" ${z.id === selectedId ? 'selected' : ''}>${escapeHtml(z.name)}${z.archived ? ' (archived)' : ''}</option>`)
    .join('');
}
function contactOptions(selectedId) {
  const contacts = state.allContacts().filter((c) => !c.archived || c.id === selectedId);
  const opts = ['<option value="">No tag</option>']
    .concat(
      contacts.map(
        (c) => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${escapeHtml(c.name)}${c.archived ? ' (archived)' : ''}</option>`
      )
    )
    .concat(['<option value="__new__">+ Add new tag…</option>'])
    .join('');
  return opts;
}

let currentMode = null;
let currentEntryId = null;

function close() {
  overlay.classList.add('hidden');
  content.innerHTML = '';
  currentMode = null;
  currentEntryId = null;
}

function render(mode, opts) {
  const showZoneSelect = mode === 'manual' || mode === 'edit';
  const showStartEnd = mode === 'manual' || mode === 'edit';
  const showStartOnly = mode === 'edit-running';
  const zoneId = opts.zoneId;
  const zone = state.getZone(zoneId);

  const title =
    mode === 'start'
      ? `Start: ${zone ? escapeHtml(zone.name) : ''}`
      : mode === 'edit-running'
      ? `Editing: ${zone ? escapeHtml(zone.name) : ''}`
      : mode === 'manual'
      ? 'Add manual entry'
      : 'Edit entry';

  content.innerHTML = `
    <div class="modal-header">
      <h2>${title}</h2>
      <button type="button" class="icon-btn" data-action="cancel" aria-label="Close">&times;</button>
    </div>
    <form id="entry-form" class="modal-body">
      ${
        showZoneSelect
          ? `<label class="field">Zone
              <select name="zoneId" required>${zoneOptions(zoneId)}</select>
            </label>`
          : `<input type="hidden" name="zoneId" value="${zoneId || ''}">`
      }
      <label class="field">Tag
        <select name="contactId">${contactOptions(opts.contactId)}</select>
      </label>
      <label class="field field-checkbox">
        <input type="checkbox" name="billable" ${opts.billable ? 'checked' : ''}>
        Billable
      </label>
      <label class="field">Description
        <input type="text" name="description" value="${escapeHtml(opts.description)}" placeholder="What are you working on?">
      </label>
      <label class="field">Notes
        <textarea name="notes" rows="3" placeholder="Optional notes">${escapeHtml(opts.notes)}</textarea>
      </label>
      ${
        showStartEnd
          ? `<div class="field-row">
              <label class="field">Start
                <input type="datetime-local" name="start" value="${isoToLocalInput(opts.start)}" required>
              </label>
              <label class="field">End
                <input type="datetime-local" name="end" value="${isoToLocalInput(opts.end)}" required>
              </label>
            </div>`
          : ''
      }
      ${
        showStartOnly
          ? `<label class="field">Start time
              <input type="datetime-local" name="start" value="${isoToLocalInput(opts.start)}" required>
            </label>`
          : ''
      }
      <div class="modal-actions">
        ${mode === 'edit' ? '<button type="button" class="btn btn-danger" data-action="delete">Delete</button>' : ''}
        <div class="modal-actions-right">
          <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">${mode === 'start' ? 'Start' : 'Save'}</button>
        </div>
      </div>
    </form>
  `;

  overlay.classList.remove('hidden');

  const form = document.getElementById('entry-form');

  const contactSelect = form.querySelector('select[name="contactId"]');
  let lastContactValue = contactSelect.value;
  contactSelect.addEventListener('change', () => {
    if (contactSelect.value !== '__new__') {
      lastContactValue = contactSelect.value;
      return;
    }
    const name = (prompt('New tag name:') || '').trim();
    if (!name) {
      contactSelect.value = lastContactValue;
      return;
    }
    const contact = state.addContact({ name });
    const option = document.createElement('option');
    option.value = contact.id;
    option.textContent = contact.name;
    contactSelect.insertBefore(option, contactSelect.querySelector('option[value="__new__"]'));
    contactSelect.value = contact.id;
    lastContactValue = contact.id;
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const fields = {
      zoneId: fd.get('zoneId') || zoneId,
      contactId: fd.get('contactId') || null,
      billable: fd.get('billable') === 'on',
      description: fd.get('description') || '',
      notes: fd.get('notes') || '',
    };
    if (showStartEnd) {
      fields.start = localInputToIso(fd.get('start'));
      fields.end = localInputToIso(fd.get('end'));
    } else if (showStartOnly) {
      fields.start = localInputToIso(fd.get('start'));
    }

    if (mode === 'start') {
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Checking…';
      const started = await state.startTimerChecked(zoneId, fields);
      if (!started) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Start';
        return;
      }
    } else if (mode === 'edit-running') {
      state.updateRunningDraft(fields);
    } else if (mode === 'manual') {
      state.addEntry(fields);
    } else if (mode === 'edit') {
      state.updateEntry(currentEntryId, fields);
    }
    close();
  });

  content.querySelectorAll('[data-action="cancel"]').forEach((btn) => btn.addEventListener('click', close));
  const deleteBtn = content.querySelector('[data-action="delete"]');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (confirm('Delete this entry? This cannot be undone.')) {
        state.deleteEntry(currentEntryId);
        close();
      }
    });
  }
}

// Opens the modal for starting a brand-new timer on `zoneId`.
export function openStart(zoneId) {
  currentMode = 'start';
  render('start', { zoneId, contactId: null, billable: false, description: '', notes: '' });
}

// Opens the modal to edit the currently running timer's details.
export function openEditRunning() {
  const running = state.getRunningTimer();
  if (!running) return;
  currentMode = 'edit-running';
  render('edit-running', running);
}

// Opens the modal to add a completed entry with explicit start/end.
export function openManual(defaultZoneId) {
  const now = new Date();
  const anHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  currentMode = 'manual';
  render('manual', {
    zoneId: defaultZoneId || (state.activeZones()[0] || {}).id,
    contactId: null,
    billable: false,
    description: '',
    notes: '',
    start: anHourAgo.toISOString(),
    end: now.toISOString(),
  });
}

// Opens the modal to edit an existing completed entry.
export function openEdit(entryId) {
  const entry = state.getEntry(entryId);
  if (!entry) return;
  currentMode = 'edit';
  currentEntryId = entryId;
  render('edit', entry);
}

overlay.addEventListener('click', (e) => {
  if (e.target === overlay) close();
});
