// Thin Chart.js wrapper — destroys and recreates the chart on each render call.
const instances = new Map();

export function renderDoughnut(canvas, labels, values, colors) {
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
        legend: { position: 'bottom', labels: { font: { family: 'Mulish' }, color: '#241C16' } },
      },
    },
  });
  instances.set(canvas, chart);
  return chart;
}

export function renderStackedBar(canvas, dayLabels, datasets) {
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
        y: { stacked: true, beginAtZero: true, ticks: { font: { family: 'Mulish' }, color: '#4A3F35' } },
      },
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Mulish' }, color: '#241C16' } },
      },
    },
  });
  instances.set(canvas, chart);
  return chart;
}
