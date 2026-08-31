// Reports tab: same filters as Logs, totals, donut chart (by zone or contact),
// and — for week/month — a stacked bar chart per day, stacked by zone or contact.
import * as state from './state.js';
import { renderFilterBar, filterEntries, durationHours, getRange, startOfDay, formatDuration } from './filters.js';
import { renderDoughnut, renderStackedBar } from './charts.js';
import { SWATCHES } from './colors.js';

const filterBarEl = document.getElementById('reports-filter-bar');
const groupToggleEl = document.getElementById('reports-group-toggle');
const summaryEl = document.getElementById('reports-summary');
const donutCanvas = document.getElementById('reports-donut');
const stackedWrap = document.getElementById('reports-stacked-wrap');
const stackedCanvas = document.getElementById('reports-stacked');

const filterState = {
  period: 'week',
  anchor: new Date(),
  zoneId: 'all',
  contactId: 'all',
  billable: 'all',
};
let groupBy = 'zone'; // 'zone' | 'contact'

// Zones/contacts hidden via a legend click, keyed by group id (or '__none__').
// Applies to both charts and the totals; cleared when the grouping axis changes.
let hiddenGroupIds = new Set();
let currentGroupIds = [];

function fmtHours(h) {
  return formatDuration(h);
}

function toggleGroupVisibility(index) {
  const id = currentGroupIds[index];
  if (id == null) return;
  if (hiddenGroupIds.has(id)) hiddenGroupIds.delete(id);
  else hiddenGroupIds.add(id);
  render();
}

function contactColor(contactId) {
  const contacts = state.allContacts();
  const idx = Math.max(0, contacts.findIndex((c) => c.id === contactId));
  return SWATCHES[idx % 6].hex; // cycle through the 6 full-tier brand colors
}

function groupLabel(id) {
  if (groupBy === 'zone') {
    const z = state.getZone(id);
    return z ? z.name : 'Unknown zone';
  }
  const c = state.getContact(id);
  return c ? c.name : 'No contact';
}

function groupColor(id) {
  if (groupBy === 'zone') {
    const z = state.getZone(id);
    return z ? z.color : '#999999';
  }
  return id ? contactColor(id) : '#999999';
}

function groupKey(entry) {
  return groupBy === 'zone' ? entry.zoneId : entry.contactId || '__none__';
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
  });

  const visible = filtered.filter((e) => !hiddenGroupIds.has(groupKey(e)));
  const totalHours = visible.reduce((sum, e) => sum + durationHours(e), 0);
  const billableHours = visible.filter((e) => e.billable).reduce((sum, e) => sum + durationHours(e), 0);
  const nonBillableHours = totalHours - billableHours;
  summaryEl.innerHTML = `
    <div class="report-total"><span class="report-total-value">${fmtHours(totalHours)}</span><span class="report-total-label">Total</span></div>
    <div class="report-total"><span class="report-total-value">${fmtHours(billableHours)}</span><span class="report-total-label">Billable</span></div>
    <div class="report-total"><span class="report-total-value">${fmtHours(nonBillableHours)}</span><span class="report-total-label">Non-billable</span></div>
  `;

  // Donut: totals per group
  const totalsByGroup = new Map();
  for (const e of filtered) {
    const key = groupKey(e);
    totalsByGroup.set(key, (totalsByGroup.get(key) || 0) + durationHours(e));
  }
  const groupIds = Array.from(totalsByGroup.keys());
  currentGroupIds = groupIds;
  const hiddenIndices = groupIds.reduce((acc, id, i) => {
    if (hiddenGroupIds.has(id)) acc.push(i);
    return acc;
  }, []);
  if (groupIds.length === 0) {
    donutCanvas.parentElement.classList.add('hidden');
  } else {
    donutCanvas.parentElement.classList.remove('hidden');
    const labels = groupIds.map((id) => groupLabel(id === '__none__' ? null : id));
    const values = groupIds.map((id) => totalsByGroup.get(id));
    const colors = groupIds.map((id) => groupColor(id === '__none__' ? null : id));
    renderDoughnut(donutCanvas, labels, values, colors, hiddenIndices, toggleGroupVisibility);
  }

  // Stacked bar: per-day totals, stacked by group (only for week/month)
  if (filterState.period === 'day') {
    stackedWrap.classList.add('hidden');
  } else {
    stackedWrap.classList.remove('hidden');
    const [start, end] = range;
    const days = [];
    for (let d = startOfDay(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    const dayLabels = days.map((d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

    const perGroupPerDay = new Map(); // groupId -> array parallel to days
    for (const id of groupIds) perGroupPerDay.set(id, new Array(days.length).fill(0));
    for (const e of filtered) {
      const key = groupKey(e);
      const dayIdx = days.findIndex((d) => startOfDay(new Date(e.start)).getTime() === d.getTime());
      if (dayIdx >= 0) {
        perGroupPerDay.get(key)[dayIdx] += durationHours(e);
      }
    }
    const datasets = groupIds.map((id) => ({
      label: groupLabel(id === '__none__' ? null : id),
      data: perGroupPerDay.get(id),
      color: groupColor(id === '__none__' ? null : id),
    }));
    renderStackedBar(stackedCanvas, dayLabels, datasets, hiddenIndices, toggleGroupVisibility);
  }
}

export function init() {
  groupToggleEl.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      groupBy = btn.dataset.group;
      hiddenGroupIds = new Set();
      groupToggleEl.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
      render();
    });
  });
  state.subscribe(render);
  render();
}
