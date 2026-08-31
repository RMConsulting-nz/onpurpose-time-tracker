// Thin Chart.js wrapper — destroys and recreates the chart on each render call.
// Legends show each series' total (formatted as "3h 20m") and, on click, call
// back into reports.js so it can mirror the hide/show onto the other chart and
// recompute the visible totals.
import { formatDuration } from './filters.js';

const instances = new Map();

export function renderDoughnut(canvas, labels, values, colors, hiddenIndices, onToggle) {
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
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Mulish' },
            color: '#241C16',
            generateLabels: (c) =>
              c.data.labels.map((label, i) => ({
                text: `${label} — ${formatDuration(c.data.datasets[0].data[i])}`,
                fillStyle: c.data.datasets[0].backgroundColor[i],
                strokeStyle: c.data.datasets[0].backgroundColor[i],
                hidden: !c.getDataVisibility(i),
                index: i,
              })),
          },
          onClick: (e, legendItem) => onToggle(legendItem.index),
        },
        tooltip: {
          callbacks: { label: (ctx) => ` ${ctx.label}: ${formatDuration(ctx.parsed)}` },
        },
      },
    },
  });
  // Note: hide(datasetIndex, dataIndex) sets a *different* internal flag than
  // the one getDataVisibility()/generateLabels() read for a pie/doughnut, so
  // the legend and the arc's actual visibility fall out of sync. toggleDataVisibility
  // is the correct per-slice API here, and starts every index visible.
  hiddenIndices.forEach((i) => chart.toggleDataVisibility(i));
  chart.update();
  instances.set(canvas, chart);
  return chart;
}

export function renderStackedBar(canvas, dayLabels, datasets, hiddenIndices, onToggle) {
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
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Mulish' },
            color: '#241C16',
            generateLabels: (c) =>
              c.data.datasets.map((ds, i) => ({
                text: `${ds.label} — ${formatDuration(ds.data.reduce((a, b) => a + b, 0))}`,
                fillStyle: ds.backgroundColor,
                strokeStyle: ds.backgroundColor,
                hidden: !c.isDatasetVisible(i),
                datasetIndex: i,
              })),
          },
          onClick: (e, legendItem) => onToggle(legendItem.datasetIndex),
        },
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
