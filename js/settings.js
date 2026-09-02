// Settings tab: manage zones (add/rename/colour/archive) and contacts
// (add/rename/archive), plus Microsoft sign-in/out status.
import * as state from './state.js';
import * as graph from './graph.js';
import { SWATCHES } from './colors.js';

const authStatusEl = document.getElementById('settings-auth-status');
const signInBtn = document.getElementById('settings-signin-btn');
const signOutBtn = document.getElementById('settings-signout-btn');
const signinCalloutEl = document.getElementById('settings-signin-callout');
const zonesListEl = document.getElementById('settings-zones-list');
const zoneAddForm = document.getElementById('zone-add-form');
const contactsListEl = document.getElementById('settings-contacts-list');
const contactAddForm = document.getElementById('contact-add-form');

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function swatchGridHtml(name, selectedHex) {
  return `
    <div class="swatch-grid" data-swatch-for="${name}">
      ${SWATCHES.map(
        (s) => `<button type="button" class="swatch ${s.hex.toLowerCase() === selectedHex.toLowerCase() ? 'selected' : ''}"
          style="background:${s.hex}" data-hex="${s.hex}" title="${s.label}" aria-label="${s.label}"></button>`
      ).join('')}
    </div>`;
}

// A plain-language stand-in for whatever MSAL/Graph actually threw, since that
// raw error text (a popup-blocked message, an HTTP status, etc.) means nothing
// to someone who isn't following the code.
const SYNC_ERROR_MESSAGE = "Your changes are saved on this device, but the sync to OneDrive didn't go through. This usually clears up next time you use the app. If it keeps happening, try signing out and back in.";

function renderAuth() {
  const account = graph.getAccount();
  const syncing = state.isSyncing();
  const err = state.getLastSyncError();
  signinCalloutEl.classList.toggle('hidden', !!account);
  if (account) {
    authStatusEl.innerHTML = `Signed in as <strong>${escapeHtml(account.username)}</strong>${syncing ? ' &middot; syncing…' : ''}${err ? `<div class="sync-error">${SYNC_ERROR_MESSAGE}</div>` : ''}`;
    signInBtn.classList.add('hidden');
    signOutBtn.classList.remove('hidden');
  } else {
    authStatusEl.textContent = 'Not signed in, data is only stored on this device.';
    signInBtn.classList.remove('hidden');
    signOutBtn.classList.add('hidden');
  }
}

function renderZones() {
  const zones = state.allZones();
  zonesListEl.innerHTML = zones
    .map(
      (z) => `
      <div class="settings-row ${z.archived ? 'archived' : ''}" data-zone-id="${z.id}">
        <input type="text" class="settings-name-input" value="${escapeHtml(z.name)}" data-field="name">
        ${swatchGridHtml(z.id, z.color)}
        <button type="button" class="btn btn-secondary btn-small" data-action="archive">${z.archived ? 'Unarchive' : 'Archive'}</button>
      </div>`
    )
    .join('');

  zonesListEl.querySelectorAll('.settings-row').forEach((row) => {
    const id = row.dataset.zoneId;
    row.querySelector('[data-field="name"]').addEventListener('change', (e) => {
      state.updateZone(id, { name: e.target.value.trim() || 'Untitled zone' });
    });
    row.querySelectorAll('.swatch').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.updateZone(id, { color: btn.dataset.hex });
      });
    });
    row.querySelector('[data-action="archive"]').addEventListener('click', () => {
      const zone = state.getZone(id);
      state.archiveZone(id, !zone.archived);
    });
  });
}

function renderContacts() {
  const contacts = state.allContacts();
  contactsListEl.innerHTML = contacts
    .map(
      (c) => `
      <div class="settings-row ${c.archived ? 'archived' : ''}" data-contact-id="${c.id}">
        <input type="text" class="settings-name-input" value="${escapeHtml(c.name)}" data-field="name">
        <button type="button" class="btn btn-secondary btn-small" data-action="archive">${c.archived ? 'Unarchive' : 'Archive'}</button>
      </div>`
    )
    .join('');

  contactsListEl.querySelectorAll('.settings-row').forEach((row) => {
    const id = row.dataset.contactId;
    row.querySelector('[data-field="name"]').addEventListener('change', (e) => {
      state.updateContact(id, { name: e.target.value.trim() || 'Untitled tag' });
    });
    row.querySelector('[data-action="archive"]').addEventListener('click', () => {
      const contact = state.getContact(id);
      state.archiveContact(id, !contact.archived);
    });
  });
}

function render() {
  renderAuth();
  renderZones();
  renderContacts();
}

export function init() {
  signInBtn.addEventListener('click', async () => {
    try {
      await graph.signIn();
      await state.syncFromRemote();
    } catch (err) {
      alert('Sign-in failed: ' + err.message);
    }
  });
  signOutBtn.addEventListener('click', async () => {
    await graph.signOut();
    render();
  });

  zoneAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = zoneAddForm.querySelector('[name="name"]');
    const name = input.value.trim();
    if (!name) return;
    const usedCount = state.allZones().length;
    state.addZone({ name, color: SWATCHES[usedCount % 6].hex });
    input.value = '';
  });

  contactAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = contactAddForm.querySelector('[name="name"]');
    const name = input.value.trim();
    if (!name) return;
    state.addContact({ name });
    input.value = '';
  });

  state.subscribe(render);
  render();
}
