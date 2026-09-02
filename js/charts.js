// Thin Chart.js wrapper — destroys and recreates the chart on each render call.
// Both charts share a single HTML legend (see renderHtmlLegend below) instead
// of Chart.js's own canvas-drawn one, so their built-in legends stay off.
import { formatDuration } from './filters.js';

const instances = new Map();

export function renderDoughnut(canvas, labels, values, colors, hiddenIndices) {
  const prev = instances.get(canvas);
  if (prev) prev.destroy();
  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors, borderColor: '#FBF7F1', borderWidth: 2 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => ` ${ctx.label}: ${formatDuration(ctx.parsed)}` },
        },
      },
    },
  });
  // Note: hide(datasetIndex, dataIndex) sets a *different* internal flag than
  // the one getDataVisibility() reads for a pie/doughnut, so toggleDataVisibility
  // is the correct per-slice API here, and starts every index visible.
  hiddenIndices.forEach((i) => chart.toggleDataVisibility(i));
  chart.update();
  instances.set(canvas, chart);
  return chart;
}

export function renderStackedBar(canvas, dayLabels, datasets, hiddenIndices) {
  const prev = instances.get(canvas);
  if (prev) prev.destroy();
  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: dayLabels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.color,
        stack: 'hours',
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, ticks: { font: { family: 'Mulish' }, color: '#4A3F35' } },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { font: { family: 'Mulish' }, color: '#4A3F35', callback: (v) => formatDuration(v) },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatDuration(ctx.parsed.y)}` },
        },
      },
    },
  });
  hiddenIndices.forEach((i) => chart.setDatasetVisibility(i, false));
  chart.update();
  instances.set(canvas, chart);
  return chart;
}

// Renders a single HTML legend shared by both charts. `items` is
// [{ label, color, total, hidden }], in the same order/index as the charts'
// groups, so onToggle(index) maps straight back to toggleGroupVisibility.
export function renderHtmlLegend(container, items, onToggle) {
  container.innerHTML = '';
  items.forEach((item, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chart-legend-item' + (item.hidden ? ' chart-legend-item-hidden' : '');

    const swatch = document.createElement('span');
    swatch.className = 'chart-legend-swatch';
    swatch.style.background = item.color;

    const label = document.createElement('span');
    label.className = 'chart-legend-label';
    label.textContent = `${item.label} — ${formatDuration(item.total)}`;

    btn.append(swatch, label);
    btn.addEventListener('click', () => onToggle(i));
    container.appendChild(btn);
  });
}
