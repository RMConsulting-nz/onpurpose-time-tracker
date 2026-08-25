// App entry point: tab switching + module wiring.
import * as graph from './graph.js';
import * as state from './state.js';
import * as timer from './timer.js';
import * as logs from './logs.js';
import * as reports from './reports.js';
import * as settings from './settings.js';

const tabButtons = document.querySelectorAll('.tab-nav button');
const tabPanels = document.querySelectorAll('.tab-panel');

function showTab(name) {
  tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === name));
  tabPanels.forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${name}`));
  localStorage.setItem('rmc-tt-last-tab', name);
}

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

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

  showTab(localStorage.getItem('rmc-tt-last-tab') || 'timer');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch((err) => console.warn('Service worker registration failed', err));
  }
}

boot();
