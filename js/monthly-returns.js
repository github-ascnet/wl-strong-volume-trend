function buildMonthlyMatrix(equityData) {
  const monthEndMap = new Map();

  equityData.forEach((item) => {
    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    monthEndMap.set(key, item.equity);
  });

  const entries = Array.from(monthEndMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  const matrix = {};
  for (let i = 1; i < entries.length; i += 1) {
    const [key, currentEquity] = entries[i];
    const [, previousEquity] = entries[i - 1];
    if (!previousEquity) continue;

    const [yearStr, monthStr] = key.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const percent = (currentEquity / previousEquity - 1) * 100;

    if (!matrix[year]) matrix[year] = {};
    matrix[year][month] = percent;
  }

  return matrix;
}

function calcAnnual(monthlyData) {
  let compounded = 1;
  for (const pct of Object.values(monthlyData)) {
    compounded *= 1 + pct / 100;
  }
  return (compounded - 1) * 100;
}

function renderMonthlyReturns(equityData, currentState) {
  const container = document.getElementById("monthlyReturnsGrid");
  const matrix = buildMonthlyMatrix(equityData);
  const years = Object.keys(matrix)
    .map(Number)
    .sort((a, b) => a - b);

  if (years.length === 0) {
    container.innerHTML =
      '<div class="empty">Zu wenig Equity-Daten für Monatsrenditen.</div>';
    return;
  }

  const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const allValues = years.flatMap((y) => Object.values(matrix[y]));
  const avgMonthly = allValues.length
    ? allValues.reduce((a, b) => a + b, 0) / allValues.length
    : 0;
  const avgMonthlyClass = getValueClass(avgMonthly);

  const numMonths = allValues.length;
  const avgTrades =
    currentState && currentState.positionCount && numMonths > 0
      ? currentState.positionCount / numMonths
      : null;

  const headerCells = MONTH_NAMES.map((m) => `<th>${m}</th>`).join("");

  const rows = years
    .map((year) => {
      const yearData = matrix[year];
      const annual = calcAnnual(yearData);
      const annualClass = getValueClass(annual);

      const cells = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        if (yearData[m] !== undefined) {
          const cls = getValueClass(yearData[m]);
          return `<td class="mr-cell ${escapeHtml(cls)}">${escapeHtml(
            formatPercent(yearData[m])
          )}</td>`;
        }
        return `<td class="mr-cell"></td>`;
      }).join("");

      return `<tr>
        <td class="mr-year">${escapeHtml(String(year))}</td>
        ${cells}
        <td class="mr-cell mr-annual ${escapeHtml(annualClass)}">${escapeHtml(
        formatPercent(annual)
      )}</td>
      </tr>`;
    })
    .join("");

  container.innerHTML = `
    <div class="mr-summary">
      <span>Average Monthly Return:&nbsp;
        <span class="${escapeHtml(avgMonthlyClass)}">${escapeHtml(
    formatPercent(avgMonthly)
  )}</span>
      </span>
      ${
        avgTrades !== null
          ? `<span>Average Trades per Month:&nbsp;<span class="neutral-text">${escapeHtml(
              formatNumber(avgTrades)
            )}</span></span>`
          : ""
      }
    </div>
    <div class="mr-table-wrap">
      <table class="mr-table">
        <thead>
          <tr>
            <th>Year</th>${headerCells}<th>Annual</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
