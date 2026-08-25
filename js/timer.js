// Timer tab: one button per active zone, running zone shows live elapsed time,
// and a "Reorder" toggle enables drag-to-reorder via Pointer Events (touch-friendly).
import * as state from './state.js';
import * as modal from './modal.js';
import { textColorFor } from './colors.js';

const listEl = document.getElementById('zone-list');
const reorderBtn = document.getElementById('reorder-toggle');
const manualBtn = document.getElementById('manual-entry-btn');

let reorderMode = false;
let tickHandle = null;

function formatElapsed(startIso) {
  const ms = Date.now() - new Date(startIso).getTime();
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function zoneRowHtml(zone, running) {
  const isRunning = running && running.zoneId === zone.id;
  const textColor = textColorFor(zone.color);
  const style = `background:${zone.color};color:${textColor};`;

  if (reorderMode) {
    return `
      <div class="zone-row reorder" data-zone-id="${zone.id}">
        <span class="drag-handle" aria-label="Drag to reorder">&#9776;</span>
        <span class="zone-swatch" style="background:${zone.color}"></span>
        <span class="zone-name">${escapeHtml(zone.name)}</span>
      </div>`;
  }

  if (isRunning) {
    return `
      <div class="zone-row running" data-zone-id="${zone.id}">
        <button type="button" class="zone-btn zone-btn-running" style="${style}" data-action="stop" data-zone-id="${zone.id}">
          <span class="zone-name">${escapeHtml(zone.name)}</span>
          <span class="zone-elapsed" data-elapsed="${zone.id}">${formatElapsed(running.start)}</span>
          <span class="zone-stop-hint">Tap to stop</span>
        </button>
        <button type="button" class="icon-btn zone-edit" data-action="edit-running" aria-label="Edit running entry">&#9998;</button>
      </div>`;
  }

  return `
    <div class="zone-row" data-zone-id="${zone.id}">
      <button type="button" class="zone-btn" style="${style}" data-action="start" data-zone-id="${zone.id}">
        <span class="zone-name">${escapeHtml(zone.name)}</span>
      </button>
    </div>`;
}

function render() {
  const zones = state.activeZones();
  const running = state.getRunningTimer();
  listEl.innerHTML = zones.map((z) => zoneRowHtml(z, running)).join('');
  listEl.classList.toggle('reorder-mode', reorderMode);
  reorderBtn.classList.toggle('active', reorderMode);
  reorderBtn.textContent = reorderMode ? 'Done reordering' : 'Reorder';

  if (!zones.length) {
    listEl.innerHTML = '<p class="empty-state">No active zones yet. Add one in Settings.</p>';
  }

  if (reorderMode) {
    setupDragReorder();
  } else {
    listEl.querySelectorAll('[data-action="start"]').forEach((btn) => {
      btn.addEventListener('click', () => modal.openStart(btn.dataset.zoneId));
    });
    listEl.querySelectorAll('[data-action="stop"]').forEach((btn) => {
      btn.addEventListener('click', () => state.stopTimer());
    });
    listEl.querySelectorAll('[data-action="edit-running"]').forEach((btn) => {
      btn.addEventListener('click', () => modal.openEditRunning());
    });
  }

  restartTicker();
}

function restartTicker() {
  if (tickHandle) clearInterval(tickHandle);
  const running = state.getRunningTimer();
  if (!running || reorderMode) return;
  tickHandle = setInterval(() => {
    const r = state.getRunningTimer();
    if (!r) return;
    const el = listEl.querySelector(`[data-elapsed="${r.zoneId}"]`);
    if (el) el.textContent = formatElapsed(r.start);
  }, 1000);
}

// Reorders by translating the dragged row (and shifting siblings out of its way)
// with CSS transforms, and only touches the DOM/state once on release. Moving a
// captured element's ancestor via insertBefore mid-drag drops pointer capture in
// Chromium, which is what silently killed dragging after the first swap — so the
// actual DOM order (and the zones' persisted order) changes only at drag end.
function setupDragReorder() {
  const rows = Array.from(listEl.querySelectorAll('.zone-row.reorder'));

  rows.forEach((row, index) => {
    const handle = row.querySelector('.drag-handle');
    if (!handle) return;

    let dragging = false;
    let startY = 0;
    let rowStep = row.getBoundingClientRect().height + 12; // row height + 0.75rem gap
    let targetIndex = index;

    const clearTransforms = () => {
      rows.forEach((r) => {
        r.style.transform = '';
        r.classList.remove('dragging');
        r.style.zIndex = '';
      });
    };

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dragging = true;
      startY = e.clientY;
      targetIndex = index;
      rowStep = row.getBoundingClientRect().height + 12;
      row.classList.add('dragging');
      row.style.zIndex = '10';
      try {
        handle.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
    });

    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      e.preventDefault();
      const deltaY = e.clientY - startY;
      row.style.transform = `translateY(${deltaY}px)`;

      const steps = Math.round(deltaY / rowStep);
      targetIndex = Math.min(rows.length - 1, Math.max(0, index + steps));

      rows.forEach((r, i) => {
        if (r === row) return;
        let shift = 0;
        if (targetIndex > index && i > index && i <= targetIndex) shift = -1;
        else if (targetIndex < index && i >= targetIndex && i < index) shift = 1;
        r.style.transform = shift ? `translateY(${shift * rowStep}px)` : '';
      });
    });

    const finish = () => {
      if (!dragging) return;
      dragging = false;
      clearTransforms();
      if (targetIndex !== index) {
        const newOrder = rows.map((r) => r.dataset.zoneId);
        const [movedId] = newOrder.splice(index, 1);
        newOrder.splice(targetIndex, 0, movedId);
        state.reorderZones(newOrder);
      }
    };
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
  });
}

export function init() {
  reorderBtn.addEventListener('click', () => {
    reorderMode = !reorderMode;
    render();
  });
  manualBtn.addEventListener('click', () => modal.openManual());
  state.subscribe(render);
  render();
}
