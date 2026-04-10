const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

const DATA_FILES = {
  currentState: "data/wl-current-state.json",
  signals: "data/signals.json",
  positions: "data/wl-positions.json",
  equity: "data/wl-equity.json",
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    tabs.forEach((t) => t.classList.remove("active"));
    panels.forEach((p) => p.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(target).classList.add("active");
  });
});

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return new Intl.NumberFormat("de-CH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value));
}

function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${formatNumber(value, decimals)}%`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("de-CH").format(date);
}

function formatDateLong(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getValueClass(value) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function cleanStrategyName(name) {
  return String(name ?? "")
    .replace(/\s*\(.*?\)/g, "")
    .trim();
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Fehler beim Laden von ${path}: ${response.status}`);
  }
  return response.json();
}

function renderOverview(currentState, signals) {
  const overviewCards = document.getElementById("overviewCards");
  const overviewTableBody = document.getElementById("overviewTableBody");
  const overviewSubtitle = document.getElementById("overviewSubtitle");
  const lastUpdateBadge = document.getElementById("lastUpdateBadge");

  overviewSubtitle.textContent = `${cleanStrategyName(
    currentState.strategyName
  )} · ${currentState.symbolUniverse} · ${currentState.mode}`;
  lastUpdateBadge.textContent = `Stand: ${formatDate(currentState.lastUpdate)}`;

  const cards = [
    {
      label: "APR",
      value: formatPercent(currentState.apr),
      cssClass: getValueClass(currentState.apr),
    },
    {
      label: "Profit",
      value: formatNumber(currentState.profit),
      cssClass: getValueClass(currentState.profit),
    },
    {
      label: "Max Drawdown",
      value: formatPercent(currentState.maxDrawdown),
      cssClass: getValueClass(currentState.maxDrawdown),
    },
    {
      label: "Sharpe Ratio",
      value: formatNumber(currentState.sharpeRatio),
      cssClass: "neutral",
    },
    {
      label: "MAR Ratio",
      value: formatNumber(currentState.marRatio),
      cssClass: getValueClass(currentState.marRatio),
    },
    {
      label: "Risk-Return Score",
      value: formatNumber(currentState.riskReturnMetaScore),
      cssClass: "neutral",
      tooltip:
        "RRSuperScore kombiniert APR, MAR Ratio, Recovery Factor, Stabilitätskennzahlen, maximalen Drawdown und den Anteil extremer Ausreisser zu einem gewichteten Gesamtscore zwischen 0 und 100.\n\nInterpretation des Scorebereichs:\n80–100\u2002 Sehr gut – geringe Risiken, starke Resilienz\n50–79\u2002\u2002Gut – stabile Strategie mit vertretbaren Risiken\n35–49\u2002\u2002Durchschnitt – gewisse Schwächen sichtbar\n20–34\u2002\u2002Schwach – entweder ineffizient oder riskant\n\u2002 0–19\u2002\u2002Kritisch – nicht empfehlenswert",
    },
    {
      label: "Aktive Signale",
      value: String(Array.isArray(signals) ? signals.length : 0),
      cssClass: "neutral",
    },
  ];

  overviewCards.innerHTML = cards
    .map(
      (card) => `
    <div class="card">
      <div class="card-label">
        ${escapeHtml(card.label)}
        ${
          card.tooltip
            ? `<span class="card-info" data-tooltip="${escapeHtml(
                card.tooltip
              )}">&#33;</span>`
            : ""
        }
      </div>
      <div class="card-value ${escapeHtml(card.cssClass)}">${escapeHtml(
        card.value
      )}</div>
    </div>
  `
    )
    .join("");

  const metrics = [
    ["Starting Capital", formatNumber(currentState.startingCapital)],
    ["Start Date", formatDateLong(currentState.backtestStartDate)],
    ["Profit", formatNumber(currentState.profit)],
    ["Profit %", formatPercent(currentState.profitPercent)],
    ["Position Count", currentState.positionCount],
    ["Avg Return % (Year)", formatPercent(currentState.avgReturnYear)],
    ["Std. Deviation (Year)", formatNumber(currentState.stdDeviationYear)],
    ["Exposure", formatPercent(currentState.exposure, 0)],
    ["Max Exposure", formatPercent(currentState.maximumExposure, 0)],
    ["Recovery Factor", formatNumber(currentState.recoveryFactor)],
    ["Avg Profit %", formatPercent(currentState.avgProfitPercent)],
    ["Profitable %", formatPercent(currentState.profitablePercent)],
    ["Last Signal Count", Array.isArray(signals) ? signals.length : 0],
  ];

  overviewTableBody.innerHTML = metrics
    .map(
      ([label, value]) => `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${escapeHtml(value)}</td>
    </tr>
  `
    )
    .join("");
}

function renderMetricsReport(currentState) {
  const metricsTableBody = document.getElementById("metricsTableBody");

  const rows = [
    ["Starting Capital", formatNumber(currentState.startingCapital)],
    ["Start Date", formatDateLong(currentState.backtestStartDate)],
    ["APR", formatPercent(currentState.apr)],
    ["Profit", formatNumber(currentState.profit)],
    ["Profit %", formatPercent(currentState.profitPercent)],
    ["Risk-Return Meta Score", currentState.riskReturnMetaScore],
    ["Sharpe Ratio", formatNumber(currentState.sharpeRatio)],
    ["MAR Ratio", formatNumber(currentState.marRatio)],
    ["Recovery Factor", formatNumber(currentState.recoveryFactor)],
    ["Max Drawdown %", formatPercent(currentState.maxDrawdown)],
    ["Avg Return % (Year)", formatPercent(currentState.avgReturnYear)],
    ["Std. Deviation (Year)", formatNumber(currentState.stdDeviationYear)],
    ["Avg Bars Held", formatNumber(currentState.avgBarsHeld)],
    ["Exposure", formatPercent(currentState.exposure, 0)],
    ["Maximum Exposure", formatPercent(currentState.maximumExposure, 0)],
    ["Profit Factor", formatNumber(currentState.profitFactor)],
    ["Avg Profit %", formatPercent(currentState.avgProfitPercent)],
    ["Profitable %", formatPercent(currentState.profitablePercent)],
    ["NSF Position Count", formatNumber(currentState.nsfPositionCount, 0)],
    ["Max Margin Used", formatNumber(currentState.maxMarginUsed)],
    [
      "Avg Entry Efficiency %",
      formatPercent(currentState.avgEntryEfficiencyPercent),
    ],
    [
      "Avg Exit Efficiency %",
      formatPercent(currentState.avgExitEfficiencyPercent),
    ],
  ];

  metricsTableBody.innerHTML = rows
    .map(
      ([label, value]) => `
    <tr>
      <td>${escapeHtml(label)}</td>
      <td>${escapeHtml(value)}</td>
    </tr>
  `
    )
    .join("");
}

let _positionsData = [];
let _positionsSortKey = null;
let _positionsSortAsc = true;

function renderPositionsRows(positions) {
  const positionsTableBody = document.getElementById("positionsTableBody");

  positionsTableBody.innerHTML = positions
    .map((position) => {
      const plClass = getValueClass(position.pl);
      const plPercentClass = getValueClass(position.plPercent);
      const symbol = String(position.symbol ?? "").replace(/\..*$/, "");
      const plFormatted = `USD ${new Intl.NumberFormat("de-CH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(position.pl ?? 0))}`;
      const exitDateDisplay = position.exitDate
        ? formatDateLong(position.exitDate)
        : "Open";

      return `
      <tr>
        <td class="col-symbol">${escapeHtml(symbol)}</td>
        <td>${escapeHtml(formatDateLong(position.entryDate))}</td>
        <td>${escapeHtml(exitDateDisplay)}</td>
        <td>${escapeHtml(formatNumber(position.entryPrice))}</td>
        <td>${escapeHtml(formatNumber(position.exitPrice))}</td>
        <td>${escapeHtml(formatNumber(position.qty, 0))}</td>
        <td class="${escapeHtml(plClass)}">${escapeHtml(plFormatted)}</td>
        <td class="${escapeHtml(plPercentClass)}">${escapeHtml(
        formatPercent(position.plPercent)
      )}</td>
      </tr>
    `;
    })
    .join("");
}

function renderPositions(positions) {
  const positionsTableBody = document.getElementById("positionsTableBody");

  if (!Array.isArray(positions) || positions.length === 0) {
    positionsTableBody.innerHTML =
      '<tr><td colspan="8" class="empty">Keine Positionen vorhanden.</td></tr>';
    return;
  }

  _positionsData = positions;
  renderPositionsRows(_positionsData);

  document.querySelectorAll("#positions .sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (_positionsSortKey === key) {
        _positionsSortAsc = !_positionsSortAsc;
      } else {
        _positionsSortKey = key;
        _positionsSortAsc = true;
      }

      const sorted = [..._positionsData].sort((a, b) => {
        let valA = a[key] ?? "";
        let valB = b[key] ?? "";
        if (key === "entryDate" || key === "exitDate") {
          valA = valA
            ? new Date(valA).getTime()
            : key === "exitDate"
            ? Infinity
            : 0;
          valB = valB
            ? new Date(valB).getTime()
            : key === "exitDate"
            ? Infinity
            : 0;
        } else {
          valA = Number(valA);
          valB = Number(valB);
        }
        return _positionsSortAsc ? valA - valB : valB - valA;
      });

      document
        .querySelectorAll("#positions .sortable .sort-icon")
        .forEach((icon) => {
          icon.textContent = "";
        });
      th.querySelector(".sort-icon").textContent = _positionsSortAsc
        ? " ▲"
        : " ▼";

      renderPositionsRows(sorted);
    });
  });
}

function renderEquityChart(equityData) {
  const svg = document.getElementById("equityChart");

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

  const values = equityData.map((item) => Math.max(Number(item.equity), 1));
  const logMin = Math.log(Math.min(...values));
  const logMax = Math.log(Math.max(...values));
  const logRange = Math.max(logMax - logMin, 1e-9);

  const points = equityData.map((item, index) => {
    const x = margin.left + (index / (equityData.length - 1)) * chartWidth;
    const y =
      margin.top +
      ((logMax - Math.log(Math.max(Number(item.equity), 1))) / logRange) *
        chartHeight;
    return { x, y, date: item.date, equity: Number(item.equity) };
  });

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${
    height - margin.bottom
  } L ${points[0].x.toFixed(2)} ${height - margin.bottom} Z`;

  const horizontalGrid = Array.from({ length: 5 }, (_, i) => {
    const y = margin.top + (i / 4) * chartHeight;
    return `<line x1="${margin.left}" y1="${y}" x2="${
      width - margin.right
    }" y2="${y}" />`;
  }).join("");

  const verticalGrid = Array.from({ length: 6 }, (_, i) => {
    const x = margin.left + (i / 5) * chartWidth;
    return `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${
      height - margin.bottom
    }" />`;
  }).join("");

  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const logValue = logMax - (i / 4) * logRange;
    const value = Math.exp(logValue);
    const y = margin.top + (i / 4) * chartHeight + 4;
    return `<text x="10" y="${y}" fill="#aeb4be" font-size="12">${escapeHtml(
      formatNumber(value, 0)
    )}</text>`;
  }).join("");

  const xLabels = [0, 0.25, 0.5, 0.75, 1]
    .map((ratio) => {
      const index = Math.min(
        equityData.length - 1,
        Math.round((equityData.length - 1) * ratio)
      );
      const x = margin.left + ratio * chartWidth;
      const anchor = ratio === 0 ? "start" : ratio === 1 ? "end" : "middle";
      return `<text x="${x}" y="${
        height - 12
      }" text-anchor="${anchor}" fill="#aeb4be" font-size="12">${escapeHtml(
        equityData[index].date
      )}</text>`;
    })
    .join("");

  // Detect flat (cash) zones: equity unchanged for 3+ consecutive data points
  const cashZones = [];
  let zoneStart = 0;
  for (let i = 1; i <= points.length; i += 1) {
    const same =
      i < points.length &&
      Math.abs(points[i].equity - points[zoneStart].equity) < 0.01;
    if (!same) {
      if (i - zoneStart >= 3) {
        cashZones.push({ from: zoneStart, to: i - 1 });
      }
      zoneStart = i;
    }
  }

  const cashZoneRects = cashZones
    .map(({ from, to }) => {
      const x1 = points[from].x;
      const x2 = points[to].x;
      return `<rect x="${x1.toFixed(2)}" y="${margin.top}" width="${(
        x2 - x1
      ).toFixed(
        2
      )}" height="${chartHeight}" fill="#ff8080" opacity="0.18" rx="0"/>`;
    })
    .join("");

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
    ${cashZoneRects}
    <path d="${areaPath}" fill="url(#fillGreen)"></path>
    <path d="${linePath}" fill="none" stroke="#56e86c" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"></path>
    ${yLabels}
    ${xLabels}
    <g id="equityTooltipGroup" style="display:none;">
      <line id="equityTooltipLine" stroke="#ffffff" stroke-width="1" stroke-dasharray="4 2" opacity="0.35" x1="0" x2="0" y1="${
        margin.top
      }" y2="${height - margin.bottom}"/>
      <circle id="equityTooltipDot" r="5" fill="#56e86c" stroke="#1e1f22" stroke-width="2" cx="0" cy="0"/>
      <rect id="equityTooltipBox" rx="6" ry="6" fill="#2c2f34" stroke="#42464d" stroke-width="1" x="0" y="0" width="160" height="50"/>
      <text id="equityTooltipDate" fill="#b8bcc4" font-size="12" x="0" y="0"/>
      <text id="equityTooltipValue" fill="#e6e6e6" font-size="13" font-weight="600" x="0" y="0"/>
    </g>
    <rect id="equityChartOverlay" x="${margin.left}" y="${
    margin.top
  }" width="${chartWidth}" height="${chartHeight}" fill="transparent" style="cursor:crosshair;"/>
  `;

  const overlay = svg.querySelector("#equityChartOverlay");
  const tooltipGroup = svg.querySelector("#equityTooltipGroup");
  const tooltipLine = svg.querySelector("#equityTooltipLine");
  const tooltipDot = svg.querySelector("#equityTooltipDot");
  const tooltipBox = svg.querySelector("#equityTooltipBox");
  const tooltipDateEl = svg.querySelector("#equityTooltipDate");
  const tooltipValueEl = svg.querySelector("#equityTooltipValue");

  overlay.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * width;

    const ratio = Math.max(0, Math.min(1, (svgX - margin.left) / chartWidth));
    const index = Math.round(ratio * (equityData.length - 1));
    const point = points[index];

    tooltipGroup.style.display = "";

    tooltipLine.setAttribute("x1", point.x);
    tooltipLine.setAttribute("x2", point.x);

    tooltipDot.setAttribute("cx", point.x);
    tooltipDot.setAttribute("cy", point.y);

    const boxWidth = 160;
    const boxHeight = 50;
    const pad = 8;
    let boxX = point.x + 12;
    if (boxX + boxWidth > width - margin.right) {
      boxX = point.x - boxWidth - 12;
    }
    const boxY = Math.max(
      margin.top,
      Math.min(point.y - boxHeight / 2, height - margin.bottom - boxHeight)
    );

    tooltipBox.setAttribute("x", boxX);
    tooltipBox.setAttribute("y", boxY);

    tooltipDateEl.setAttribute("x", boxX + pad);
    tooltipDateEl.setAttribute("y", boxY + 18);
    tooltipDateEl.textContent = formatDate(point.date);

    tooltipValueEl.setAttribute("x", boxX + pad);
    tooltipValueEl.setAttribute("y", boxY + 37);
    tooltipValueEl.textContent = `USD ${formatNumber(point.equity, 0)}`;
  });

  overlay.addEventListener("mouseleave", () => {
    tooltipGroup.style.display = "none";
  });
}

function renderSignals(signals) {
  const badge = document.getElementById("lastUpdateBadge");
  if (Array.isArray(signals) && signals.length > 0) {
    const latest = signals[0];
    badge.textContent += ` · Letztes Signal: ${latest.symbol} ${latest.action}`;
  }
}

function renderError(error) {
  const ids = [
    "overviewCards",
    "overviewTableBody",
    "metricsTableBody",
    "monthlyReturnsGrid",
    "positionsTableBody",
  ];
  ids.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = `<div class="error">${escapeHtml(
        error.message
      )}</div>`;
    }
  });

  const equityChart = document.getElementById("equityChart");
  if (equityChart) {
    equityChart.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#ff6666" font-size="16">${escapeHtml(
      error.message
    )}</text>`;
  }
}

async function initializeDashboard() {
  try {
    const [currentState, signals, positions, equity] = await Promise.all([
      loadJson(DATA_FILES.currentState),
      loadJson(DATA_FILES.signals),
      loadJson(DATA_FILES.positions),
      loadJson(DATA_FILES.equity),
    ]);

    const cleanedName = cleanStrategyName(currentState.strategyName);

    const strategyTitleEl = document.getElementById("strategyTitle");
    if (strategyTitleEl) strategyTitleEl.textContent = cleanedName;

    if (cleanedName) document.title = cleanedName;

    const strategyDescEl = document.getElementById("strategyDescription");
    if (strategyDescEl && currentState.strategyDescription) {
      strategyDescEl.textContent = currentState.strategyDescription;
    }

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && currentState.strategyDescription) {
      metaDesc.setAttribute("content", currentState.strategyDescription);
    }

    renderOverview(currentState, signals);
    renderMetricsReport(currentState);
    renderPositions(positions);
    renderMonthlyReturns(equity, currentState);
    renderEquityChart(equity);
    renderSignals(signals);
  } catch (error) {
    console.error(error);
    renderError(error);
  }
}

initializeDashboard();

(function setupCardTooltip() {
  const tooltip = document.getElementById("cardTooltip");
  if (!tooltip) return;

  document.addEventListener("mouseover", (e) => {
    const target = e.target.closest(".card-info");
    if (!target) return;
    const text = target.dataset.tooltip;
    if (!text) return;

    tooltip.textContent = text;
    tooltip.classList.add("visible");

    const rect = target.getBoundingClientRect();
    const tipW = tooltip.offsetWidth;
    const tipH = tooltip.offsetHeight;
    const margin = 8;

    let left = rect.left + rect.width / 2 - tipW / 2;
    let top = rect.top - tipH - margin;

    if (left < margin) left = margin;
    if (left + tipW > window.innerWidth - margin)
      left = window.innerWidth - tipW - margin;
    if (top < margin) top = rect.bottom + margin;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  });

  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(".card-info")) {
      tooltip.classList.remove("visible");
    }
  });
})();
