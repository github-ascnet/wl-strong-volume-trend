const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

const DATA_FILES = {
  currentState: 'data/current-state.json',
  signals: 'data/signals.json',
  positions: 'data/positions.json',
  equity: 'data/equity.json'
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    tabs.forEach((t) => t.classList.remove('active'));
    panels.forEach((p) => p.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(target).classList.add('active');
  });
});

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return new Intl.NumberFormat('de-CH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(Number(value));
}

function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return `${formatNumber(value, decimals)}%`;
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('de-CH').format(date);
}

function getValueClass(value) {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}

async function loadJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Fehler beim Laden von ${path}: ${response.status}`);
  }
  return response.json();
}

function renderOverview(currentState, signals) {
  const overviewCards = document.getElementById('overviewCards');
  const overviewTableBody = document.getElementById('overviewTableBody');
  const overviewSubtitle = document.getElementById('overviewSubtitle');
  const lastUpdateBadge = document.getElementById('lastUpdateBadge');

  overviewSubtitle.textContent = `${currentState.strategyName} · ${currentState.symbolUniverse} · ${currentState.mode}`;
  lastUpdateBadge.textContent = `Stand: ${formatDate(currentState.lastUpdate)}`;

  const cards = [
    { label: 'APR', value: formatPercent(currentState.apr), cssClass: getValueClass(currentState.apr) },
    { label: 'Profit', value: formatNumber(currentState.profit), cssClass: getValueClass(currentState.profit) },
    { label: 'Max Drawdown', value: formatPercent(currentState.maxDrawdown), cssClass: getValueClass(currentState.maxDrawdown) },
    { label: 'Sharpe Ratio', value: formatNumber(currentState.sharpeRatio), cssClass: 'neutral' },
    { label: 'MAR Ratio', value: formatNumber(currentState.marRatio), cssClass: getValueClass(currentState.marRatio) },
    { label: 'Aktive Signale', value: String(Array.isArray(signals) ? signals.length : 0), cssClass: 'neutral' }
  ];

  overviewCards.innerHTML = cards.map((card) => `
    <div class="card">
      <div class="card-label">${escapeHtml(card.label)}</div>
      <div class="card-value ${escapeHtml(card.cssClass)}">${escapeHtml(card.value)}</div>
    </div>
  `).join('');

  const metrics = [
    ['Starting Capital', formatNumber(currentState.startingCapital)],
    ['Profit', formatNumber(currentState.profit)],
    ['Profit %', formatPercent(currentState.profitPercent)],
    ['Position Count', currentState.positionCount],
    ['Exposure', formatPercent(currentState.exposure, 0)],
    ['Max Exposure', formatPercent(currentState.maximumExposure, 0)],
    ['Recovery Factor', formatNumber(currentState.recoveryFactor)],
    ['Avg Profit %', formatPercent(currentState.avgProfitPercent)],
    ['Profitable %', formatPercent(currentState.profitablePercent)],
    ['Last Signal Count', Array.isArray(signals) ? signals.length : 0]
  ];

  overviewTableBody.innerHTML = metrics.map(([label, value]) => `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${escapeHtml(value)}</td>
    </tr>
  `).join('');
}

function renderMetricsReport(currentState) {
  const metricsTableBody = document.getElementById('metricsTableBody');

  const rows = [
    ['Strategy Name', currentState.strategyName],
    ['Benchmark', currentState.benchmark],
    ['Mode', currentState.mode],
    ['Starting Capital', formatNumber(currentState.startingCapital)],
    ['APR', formatPercent(currentState.apr)],
    ['Profit', formatNumber(currentState.profit)],
    ['Profit %', formatPercent(currentState.profitPercent)],
    ['Risk-Return Meta Score', currentState.riskReturnMetaScore],
    ['Sharpe Ratio', formatNumber(currentState.sharpeRatio)],
    ['MAR Ratio', formatNumber(currentState.marRatio)],
    ['Recovery Factor', formatNumber(currentState.recoveryFactor)],
    ['Max Drawdown %', formatPercent(currentState.maxDrawdown)],
    ['Avg Return % (Year)', formatPercent(currentState.avgReturnYear)],
    ['Std. Deviation (Year)', formatNumber(currentState.stdDeviationYear)],
    ['Avg Bars Held', formatNumber(currentState.avgBarsHeld)],
    ['Exposure', formatPercent(currentState.exposure, 0)],
    ['Maximum Exposure', formatPercent(currentState.maximumExposure, 0)],
    ['Profit Factor', formatNumber(currentState.profitFactor)],
    ['Avg Profit %', formatPercent(currentState.avgProfitPercent)],
    ['Profitable %', formatPercent(currentState.profitablePercent)],
    ['NSF Position Count', formatNumber(currentState.nsfPositionCount, 0)],
    ['Max Margin Used', formatNumber(currentState.maxMarginUsed)],
    ['Avg Entry Efficiency %', formatPercent(currentState.avgEntryEfficiencyPercent)],
    ['Avg Exit Efficiency %', formatPercent(currentState.avgExitEfficiencyPercent)]
  ];

  metricsTableBody.innerHTML = rows.map(([label, value]) => `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${escapeHtml(value)}</td>
    </tr>
  `).join('');
}

function renderPositions(positions) {
  const positionsTableBody = document.getElementById('positionsTableBody');

  if (!Array.isArray(positions) || positions.length === 0) {
    positionsTableBody.innerHTML = '<tr><td colspan="8" class="empty">Keine Positionen vorhanden.</td></tr>';
    return;
  }

  positionsTableBody.innerHTML = positions.map((position) => {
    const plClass = getValueClass(position.pl);
    const plPercentClass = getValueClass(position.plPercent);

    return `
      <tr>
        <td>${escapeHtml(position.symbol)}</td>
        <td>${escapeHtml(formatDate(position.entryDate))}</td>
        <td>${escapeHtml(formatDate(position.exitDate))}</td>
        <td>${escapeHtml(formatNumber(position.entryPrice))}</td>
        <td>${escapeHtml(formatNumber(position.exitPrice))}</td>
        <td>${escapeHtml(formatNumber(position.qty, 0))}</td>
        <td class="${escapeHtml(plClass)}">${escapeHtml(formatNumber(position.pl))}</td>
        <td class="${escapeHtml(plPercentClass)}">${escapeHtml(formatPercent(position.plPercent))}</td>
      </tr>
    `;
  }).join('');
}

function buildMonthlyReturns(equityData) {
  const monthlyMap = new Map();

  equityData.forEach((item) => {
    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, item.equity);
  });

  const entries = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const monthlyReturns = [];

  for (let i = 1; i < entries.length; i += 1) {
    const [key, currentEquity] = entries[i];
    const [, previousEquity] = entries[i - 1];

    if (!previousEquity) continue;

    const percent = ((currentEquity / previousEquity) - 1) * 100;
    monthlyReturns.push({ month: key, percent });
  }

  return monthlyReturns.slice(-12);
}

function renderMonthlyReturns(equityData) {
  const monthlyReturnsGrid = document.getElementById('monthlyReturnsGrid');
  const monthlyReturns = buildMonthlyReturns(equityData);

  if (monthlyReturns.length === 0) {
    monthlyReturnsGrid.innerHTML = '<div class="empty">Zu wenig Equity-Daten für Monatsrenditen.</div>';
    return;
  }

  monthlyReturnsGrid.innerHTML = monthlyReturns.map((item) => {
    const cssClass = getValueClass(item.percent);
    return `
      <div class="month-cell">
        <div class="month-name">${escapeHtml(item.month)}</div>
        <div class="month-value ${escapeHtml(cssClass)}">${escapeHtml(formatPercent(item.percent))}</div>
      </div>
    `;
  }).join('');
}

function renderEquityChart(equityData) {
  const svg = document.getElementById('equityChart');

  if (!Array.isArray(equityData) || equityData.length < 2) {
    svg.innerHTML = `
      <text x="50%" y="50%" text-anchor="middle" fill="#b8bcc4" font-size="16">Zu wenig Equity-Daten vorhanden</text>
    `;
    return;
  }

  const width = 1000;
  const height = 340;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const values = equityData.map((item) => Number(item.equity));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(maxValue - minValue, 1);

  const points = equityData.map((item, index) => {
    const x = margin.left + (index / (equityData.length - 1)) * chartWidth;
    const y = margin.top + ((maxValue - Number(item.equity)) / range) * chartHeight;
    return { x, y, date: item.date, equity: Number(item.equity) };
  });

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${height - margin.bottom} L ${points[0].x.toFixed(2)} ${height - margin.bottom} Z`;

  const horizontalGrid = Array.from({ length: 5 }, (_, i) => {
    const y = margin.top + (i / 4) * chartHeight;
    return `<line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" />`;
  }).join('');

  const verticalGrid = Array.from({ length: 6 }, (_, i) => {
    const x = margin.left + (i / 5) * chartWidth;
    return `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${height - margin.bottom}" />`;
  }).join('');

  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const value = maxValue - (i / 4) * range;
    const y = margin.top + (i / 4) * chartHeight + 4;
    return `<text x="10" y="${y}" fill="#aeb4be" font-size="12">${escapeHtml(formatNumber(value, 0))}</text>`;
  }).join('');

  const xLabels = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const index = Math.min(equityData.length - 1, Math.round((equityData.length - 1) * ratio));
    const x = margin.left + ratio * chartWidth;
    return `<text x="${x}" y="${height - 12}" text-anchor="middle" fill="#aeb4be" font-size="12">${escapeHtml(equityData[index].date)}</text>`;
  }).join('');

  svg.innerHTML = `
    <defs>
      <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#49df68" stop-opacity="0.35"></stop>
        <stop offset="100%" stop-color="#49df68" stop-opacity="0.02"></stop>
      </linearGradient>
    </defs>
    <g opacity="0.28" stroke="#5a5f67" stroke-width="1">
      ${horizontalGrid}
      ${verticalGrid}
    </g>
    <path d="${areaPath}" fill="url(#fillGreen)"></path>
    <path d="${linePath}" fill="none" stroke="#56e86c" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"></path>
    ${yLabels}
    ${xLabels}
  `;
}

function renderSignals(signals) {
  const badge = document.getElementById('lastUpdateBadge');
  if (Array.isArray(signals) && signals.length > 0) {
    const latest = signals[0];
    badge.textContent += ` · Letztes Signal: ${latest.symbol} ${latest.action}`;
  }
}

function renderError(error) {
  const ids = ['overviewCards', 'overviewTableBody', 'metricsTableBody', 'monthlyReturnsGrid', 'positionsTableBody'];
  ids.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
    }
  });

  const equityChart = document.getElementById('equityChart');
  if (equityChart) {
    equityChart.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#ff6666" font-size="16">${escapeHtml(error.message)}</text>`;
  }
}

async function initializeDashboard() {
  try {
    const [currentState, signals, positions, equity] = await Promise.all([
      loadJson(DATA_FILES.currentState),
      loadJson(DATA_FILES.signals),
      loadJson(DATA_FILES.positions),
      loadJson(DATA_FILES.equity)
    ]);

    renderOverview(currentState, signals);
    renderMetricsReport(currentState);
    renderPositions(positions);
    renderMonthlyReturns(equity);
    renderEquityChart(equity);
    renderSignals(signals);
  } catch (error) {
    console.error(error);
    renderError(error);
  }
}

initializeDashboard();