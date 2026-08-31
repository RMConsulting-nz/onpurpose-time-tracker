// App entry point: tab switching + module wiring.
import * as graph from './graph.js';
import * as state from './state.js';
import * as timer from './timer.js';
import * as logs from './logs.js';
import * as reports from './reports.js';
import * as settings from './settings.js';
import * as pullToRefresh from './pull-to-refresh.js';

const tabButtons = document.querySelectorAll('.tab-nav button');
const tabPanels = document.querySelectorAll('.tab-panel');

export function showTab(name) {
  tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === name));
  tabPanels.forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${name}`));
}

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});
window.addEventListener('switch-tab', (e) => showTab(e.detail));

async function boot() {
  try {
    await graph.initAuth();
  } catch (err) {
    console.error('Auth init failed', err);
  }
  await state.init();

  timer.init();
  logs.init();
  reports.init();
  settings.init();
  pullToRefresh.init();

  showTab(graph.isSignedIn() ? 'timer' : 'settings');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch((err) => console.warn('Service worker registration failed', err));
  }
}

boot();
