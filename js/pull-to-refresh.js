// Custom pull-to-refresh gesture for the installed (standalone) PWA — Safari
// suppresses its native pull-to-refresh once a site is added to the home
// screen, so this recreates it for that case only. In a normal browser tab
// the native gesture already works, so this stays inactive there.
import * as state from './state.js';

const THRESHOLD = 70;
const MAX_PULL = 110;

export function init() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (!isStandalone) return;

  const indicator = document.createElement('div');
  indicator.id = 'pull-refresh-indicator';
  indicator.textContent = 'Pull to refresh';
  document.body.prepend(indicator);

  let startY = null;
  let dist = 0;

  document.addEventListener(
    'touchstart',
    (e) => {
      startY = window.scrollY <= 0 ? e.touches[0].clientY : null;
      dist = 0;
    },
    { passive: true }
  );

  document.addEventListener(
    'touchmove',
    (e) => {
      if (startY == null) return;
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY <= 0) {
        dist = 0;
        indicator.style.transform = 'translateY(0)';
        return;
      }
      dist = Math.min(deltaY, MAX_PULL);
      indicator.style.transform = `translateY(${dist}px)`;
      indicator.textContent = dist >= THRESHOLD ? 'Release to refresh' : 'Pull to refresh';
    },
    { passive: true }
  );

  document.addEventListener('touchend', async () => {
    if (startY == null) return;
    const shouldRefresh = dist >= THRESHOLD;
    startY = null;
    if (shouldRefresh) {
      indicator.textContent = 'Refreshing…';
      indicator.style.transform = `translateY(${THRESHOLD}px)`;
      await state.syncFromRemote();
    }
    indicator.style.transform = 'translateY(0)';
    dist = 0;
  });
}
