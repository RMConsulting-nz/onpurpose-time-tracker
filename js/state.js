// App data model + sync orchestration.
// `data` (zones/contacts/entries) mirrors to localStorage on every change so an
// in-progress timer or offline edit survives a refresh, and pushes to OneDrive
// (via graph.js) with ETag optimistic concurrency whenever signed in.
import * as graph from './graph.js';

const LS_DATA_KEY = 'rmc-tt-data';
const LS_RUNNING_KEY = 'rmc-tt-running';

let data = { zones: [], contacts: [], entries: [] };
let etag = null;
let runningTimer = null; // { zoneId, contactId, billable, description, notes, start }
let syncing = false;
let lastSyncError = null;

const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  for (const fn of listeners) fn();
}

export function getData() {
  return data;
}
export function getRunningTimer() {
  return runningTimer;
}
export function isSyncing() {
  return syncing;
}
export function getLastSyncError() {
  return lastSyncError;
}

function uuid() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function mirrorToLocalStorage() {
  localStorage.setItem(LS_DATA_KEY, JSON.stringify({ data, etag }));
  if (runningTimer) {
    localStorage.setItem(LS_RUNNING_KEY, JSON.stringify(runningTimer));
  } else {
    localStorage.removeItem(LS_RUNNING_KEY);
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      data = parsed.data || data;
      etag = parsed.etag || null;
    }
  } catch (e) {
    console.warn('Failed to parse local data mirror', e);
  }
  try {
    const raw = localStorage.getItem(LS_RUNNING_KEY);
    if (raw) runningTimer = JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse running timer mirror', e);
  }
}

function mergeById(remoteList, localList, hasUpdatedAt) {
  const map = new Map();
  for (const item of remoteList) map.set(item.id, item);
  for (const item of localList) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else if (hasUpdatedAt) {
      const a = new Date(existing.updatedAt || 0).getTime();
      const b = new Date(item.updatedAt || 0).getTime();
      if (b > a) map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

function mergeData(remote, local) {
  return {
    zones: mergeById(remote.zones || [], local.zones || [], false),
    contacts: mergeById(remote.contacts || [], local.contacts || [], false),
    entries: mergeById(remote.entries || [], local.entries || [], true),
    // This device's own active timer always wins; otherwise keep whatever
    // OneDrive last knew about (another device's running timer), purely so it
    // can be detected as a conflict when this device tries to start one.
    runningTimer: local.runningTimer || remote.runningTimer || null,
  };
}

export async function init() {
  loadFromLocalStorage();
  data.runningTimer = runningTimer;
  emit();
  if (graph.isSignedIn()) {
    await syncFromRemote();
  }
}

export async function syncFromRemote() {
  syncing = true;
  lastSyncError = null;
  emit();
  try {
    const remote = await graph.fetchRemote();
    if (remote.data == null) {
      const base = graph.seedData();
      const merged = mergeData(base, data);
      const created = await graph.createRemote(merged);
      data = created.data;
      etag = created.etag;
    } else {
      const merged = mergeData(remote.data, data);
      const changed = JSON.stringify(merged) !== JSON.stringify(remote.data);
      if (changed) {
        const saved = await graph.saveRemote(merged, remote.etag);
        data = saved.data;
        etag = saved.etag;
      } else {
        data = remote.data;
        etag = remote.etag;
      }
    }
    mirrorToLocalStorage();
  } catch (err) {
    console.error('Sync failed', err);
    lastSyncError = err.message || String(err);
  } finally {
    syncing = false;
    emit();
  }
}

async function persist() {
  mirrorToLocalStorage();
  emit();
  if (!graph.isSignedIn()) return;
  syncing = true;
  lastSyncError = null;
  emit();
  try {
    if (etag == null) {
      const remote = await graph.fetchRemote();
      if (remote.data != null) {
        data = mergeData(remote.data, data);
        etag = remote.etag;
      }
    }
    if (etag == null) {
      const created = await graph.createRemote(data);
      data = created.data;
      etag = created.etag;
    } else {
      const saved = await graph.saveRemote(data, etag);
      etag = saved.etag;
    }
    mirrorToLocalStorage();
  } catch (err) {
    if (err.isConflict) {
      try {
        const remote = await graph.fetchRemote();
        data = mergeData(remote.data, data);
        const saved = await graph.saveRemote(data, remote.etag);
        etag = saved.etag;
        mirrorToLocalStorage();
      } catch (err2) {
        console.error('Conflict retry failed', err2);
        lastSyncError = err2.message || String(err2);
      }
    } else {
      console.error('Save failed', err);
      lastSyncError = err.message || String(err);
    }
  } finally {
    syncing = false;
    emit();
  }
}

// ---------- Zones ----------
export function activeZones() {
  return data.zones.filter((z) => !z.archived).sort((a, b) => a.order - b.order);
}
export function allZones() {
  return data.zones.slice().sort((a, b) => a.order - b.order);
}
export function getZone(id) {
  return data.zones.find((z) => z.id === id);
}
export function addZone({ name, color }) {
  const maxOrder = data.zones.reduce((m, z) => Math.max(m, z.order), -1);
  data.zones.push({ id: uuid(), name, color, order: maxOrder + 1, archived: false });
  persist();
}
export function updateZone(id, fields) {
  const zone = getZone(id);
  if (!zone) return;
  Object.assign(zone, fields);
  persist();
}
export function archiveZone(id, archived = true) {
  updateZone(id, { archived });
}
export function reorderZones(orderedIds) {
  orderedIds.forEach((id, idx) => {
    const zone = getZone(id);
    if (zone) zone.order = idx;
  });
  persist();
}

// ---------- Contacts ----------
export function activeContacts() {
  return data.contacts.filter((c) => !c.archived);
}
export function allContacts() {
  return data.contacts;
}
export function getContact(id) {
  return data.contacts.find((c) => c.id === id);
}
export function addContact({ name }) {
  const contact = { id: uuid(), name, archived: false };
  data.contacts.push(contact);
  persist();
  return contact;
}
export function updateContact(id, fields) {
  const contact = getContact(id);
  if (!contact) return;
  Object.assign(contact, fields);
  persist();
}
export function archiveContact(id, archived = true) {
  updateContact(id, { archived });
}

// ---------- Entries ----------
export function getEntry(id) {
  return data.entries.find((e) => e.id === id);
}
export function addEntry(fields) {
  const now = new Date().toISOString();
  const entry = Object.assign(
    {
      id: uuid(),
      zoneId: null,
      contactId: null,
      billable: false,
      description: '',
      notes: '',
      start: now,
      end: now,
      createdAt: now,
      updatedAt: now,
    },
    fields
  );
  data.entries.push(entry);
  persist();
  return entry;
}
export function updateEntry(id, fields) {
  const entry = getEntry(id);
  if (!entry) return;
  Object.assign(entry, fields, { updatedAt: new Date().toISOString() });
  persist();
}
export function deleteEntry(id) {
  data.entries = data.entries.filter((e) => e.id !== id);
  persist();
}

// ---------- Running timer ----------
// Starting a new zone's timer auto-stops/logs whichever zone is currently running
// *on this device*. The running timer is mirrored into `data.runningTimer` and
// synced to OneDrive (via the normal persist() path) so other devices can detect
// one already running elsewhere.
export function startTimer(zoneId, draft = {}) {
  if (runningTimer) {
    stopTimer();
  }
  runningTimer = Object.assign(
    { zoneId, contactId: null, billable: false, description: '', notes: '', start: new Date().toISOString(), pausedAt: null },
    draft
  );
  data.runningTimer = runningTimer;
  persist();
}

// Checks OneDrive for a timer already running on another device before starting
// a new one; if found, confirms with the user whether to stop it (logging it as
// a completed entry with its own details) and proceed. Returns false if the
// user declines, true otherwise (including when the check itself couldn't run,
// e.g. offline — starting a timer should never be blocked by a failed check).
export async function startTimerChecked(zoneId, draft = {}) {
  if (!runningTimer && graph.isSignedIn()) {
    try {
      const remote = await graph.fetchRemote();
      if (remote.data) {
        const remoteRunning = remote.data.runningTimer;
        data = mergeData(remote.data, data);
        etag = remote.etag;
        if (remoteRunning) {
          const remoteZone = data.zones.find((z) => z.id === remoteRunning.zoneId);
          const startTime = new Date(remoteRunning.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const proceed = confirm(
            `A timer is already running elsewhere: ${remoteZone ? remoteZone.name : 'Unknown zone'}, started at ${startTime}.\n\nStop it and start this one?`
          );
          if (!proceed) return false;
          addEntry({
            zoneId: remoteRunning.zoneId,
            contactId: remoteRunning.contactId,
            billable: remoteRunning.billable,
            description: remoteRunning.description,
            notes: remoteRunning.notes,
            start: remoteRunning.start,
            end: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Remote timer conflict check failed, starting without it', err);
    }
  }
  startTimer(zoneId, draft);
  return true;
}

export function updateRunningDraft(fields) {
  if (!runningTimer) return;
  Object.assign(runningTimer, fields);
  data.runningTimer = runningTimer;
  persist();
}

// Freezes the running timer's elapsed time at this moment; Stop or "log and
// restart" afterwards both use this moment as the boundary, so time spent
// paused/interrupted is never logged either side of it.
export function pauseTimer() {
  if (!runningTimer || runningTimer.pausedAt) return;
  runningTimer.pausedAt = new Date().toISOString();
  data.runningTimer = runningTimer;
  persist();
}

export function stopTimer(endOverride) {
  if (!runningTimer) return null;
  const finished = runningTimer;
  runningTimer = null;
  data.runningTimer = null;
  const entry = addEntry({
    zoneId: finished.zoneId,
    contactId: finished.contactId,
    billable: finished.billable,
    description: finished.description,
    notes: finished.notes,
    start: finished.start,
    end: endOverride || finished.pausedAt || new Date().toISOString(),
  });
  return entry;
}

// Logs the currently paused segment as a completed entry, then immediately
// starts a fresh timer with the same draft details (contact/billable/
// description/notes) so a short interruption doesn't need re-entering them.
export function logAndRestart() {
  if (!runningTimer) return null;
  const draft = runningTimer;
  const boundary = draft.pausedAt || new Date().toISOString();
  runningTimer = {
    zoneId: draft.zoneId,
    contactId: draft.contactId,
    billable: draft.billable,
    description: draft.description,
    notes: draft.notes,
    start: new Date().toISOString(),
    pausedAt: null,
  };
  data.runningTimer = runningTimer;
  return addEntry({
    zoneId: draft.zoneId,
    contactId: draft.contactId,
    billable: draft.billable,
    description: draft.description,
    notes: draft.notes,
    start: draft.start,
    end: boundary,
  });
}

export function discardTimer() {
  runningTimer = null;
  data.runningTimer = null;
  persist();
}
