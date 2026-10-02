/**
 * OmniData High-Performance Canvas Chart Renderer
 * Custom zero-dependency visualization engine built for the Cyber-Emerald Obsidian aesthetic.
 */

class ChartRenderer {
  // -------------------------------------------------------------
  // 1. Distribution Histogram with Kernel Density Overlay (KDE)
  // -------------------------------------------------------------
  static drawHistogramWithKDE(canvas, values, columnName, options = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const valid = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    if (valid.length === 0) return;

    const min = valid[0];
    const max = valid[valid.length - 1];
    const nBins = options.bins || 18;
    const binWidth = (max - min) / nBins || 1;

    // Tally bins
    const bins = new Array(nBins).fill(0);
    valid.forEach(v => {
      let bIdx = Math.floor((v - min) / binWidth);
      if (bIdx >= nBins) bIdx = nBins - 1;
      bins[bIdx]++;
    });

    const maxBinCount = Math.max(...bins);
    const padding = { top: 30, right: 25, bottom: 40, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis label
      const val = Math.round(maxBinCount - (maxBinCount / 4) * i);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillText(val.toString(), padding.left - 30, y + 3);
    }

    // Draw Bars
    const barW = chartW / nBins;
    for (let i = 0; i < nBins; i++) {
      const bH = (bins[i] / maxBinCount) * chartH;
      const x = padding.left + (i * barW);
      const y = padding.top + chartH - bH;

      // Emerald Gradient Bar
      const grad = ctx.createLinearGradient(0, y, 0, padding.top + chartH);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.7)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.1)');

      ctx.fillStyle = grad;
      ctx.fillRect(x + 1, y, barW - 2, bH);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y, barW - 2, bH);
    }

    // Draw Smooth KDE Curve (Gaussian Kernel Simulation)
    ctx.beginPath();
    ctx.strokeStyle = '#22d3ee'; // Cyan glow line
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 8;

    for (let px = 0; px <= chartW; px += 4) {
      const xVal = min + (px / chartW) * (max - min);
      // Gaussian kernel density estimation
      let density = 0;
      const h = binWidth * 1.2; // bandwidth
      valid.forEach(v => {
        const u = (xVal - v) / h;
        density += (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
      });
      density = density / (valid.length * h);

      // Scale density to chart height
      const py = padding.top + chartH - (density * binWidth * valid.length / maxBinCount) * chartH;
      if (px === 0) ctx.moveTo(padding.left + px, py);
      else ctx.lineTo(padding.left + px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // reset glow

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Fira Code", monospace';
    ctx.fillText(`${min.toFixed(1)}`, padding.left, height - 15);
    ctx.fillText(`${max.toFixed(1)}`, width - padding.right - 35, height - 15);

    // Title Tag
    ctx.fillStyle = '#10b981';
    ctx.font = '11px "Fira Code", monospace';
    ctx.fillText(`DISTRIBUTION // ${columnName} (n=${valid.length})`, padding.left, 18);
  }

  // -------------------------------------------------------------
  // 2. Scatter Plot with Ordinary Least Squares (OLS) Trendline
  // -------------------------------------------------------------
  static drawScatterWithRegression(canvas, xArr, yArr, xName, yName, reg) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const validX = [];
    const validY = [];
    for (let i = 0; i < Math.min(xArr.length, yArr.length); i++) {
      if (typeof xArr[i] === 'number' && typeof yArr[i] === 'number' && !isNaN(xArr[i]) && !isNaN(yArr[i])) {
        validX.push(xArr[i]);
        validY.push(yArr[i]);
      }
    }

    if (validX.length === 0) return;

    const minX = Math.min(...validX);
    const maxX = Math.max(...validX);
    const minY = Math.min(...validY);
    const maxY = Math.max(...validY);

    const padding = { top: 35, right: 30, bottom: 45, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const scaleX = v => padding.left + ((v - minX) / (maxX - minX || 1)) * chartW;
    const scaleY = v => padding.top + chartH - ((v - minY) / (maxY - minY || 1)) * chartH;

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const yVal = (maxY - ((maxY - minY) / 4) * i).toFixed(1);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillText(yVal, padding.left - 45, y + 3);
    }

    // Draw Scatter Points
    ctx.fillStyle = 'rgba(251, 113, 133, 0.75)'; // Coral dots
    for (let i = 0; i < validX.length; i++) {
      const cx = scaleX(validX[i]);
      const cy = scaleY(validY[i]);

      ctx.beginPath();
      ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw OLS Regression Trendline
    if (reg) {
      const startX = minX;
      const endX = maxX;
      const startY = reg.intercept + (reg.slope * startX);
      const endY = reg.intercept + (reg.slope * endX);

      ctx.beginPath();
      ctx.moveTo(scaleX(startX), scaleY(startY));
      ctx.lineTo(scaleX(endX), scaleY(endY));

      ctx.strokeStyle = '#10b981'; // Emerald Trendline
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Fira Code", monospace';
    ctx.fillText(`${xName} →`, width / 2 - 20, height - 12);
    ctx.fillText(minX.toFixed(1), padding.left, height - 12);
    ctx.fillText(maxX.toFixed(1), width - padding.right - 35, height - 12);

    // Title Tag
    ctx.fillStyle = '#fb7185';
    ctx.font = '11px "Fira Code", monospace';
    const regLabel = reg ? ` | OLS: ${reg.equation} (R²=${reg.rSquared})` : '';
    ctx.fillText(`SCATTER & REGRESSION // ${xName} vs ${yName}${regLabel}`, padding.left, 18);
  }

  // -------------------------------------------------------------
  // 3. Correlation Heatmap Matrix
  // -------------------------------------------------------------
  static drawCorrelationHeatmap(canvas, matrix, columns) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const n = columns.length;
    if (n === 0) return;

    const padding = { top: 60, right: 30, bottom: 20, left: 110 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const cellW = chartW / n;
    const cellH = chartH / n;

    // Draw Column Headers
    ctx.font = '10px "Fira Code", monospace';
    for (let c = 0; c < n; c++) {
      ctx.save();
      ctx.translate(padding.left + (c * cellW) + (cellW / 2), padding.top - 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(columns[c].slice(0, 10), 0, 0);
      ctx.restore();
    }

    // Draw Heatmap Cells
    for (let r = 0; r < n; r++) {
      const rowName = columns[r];

      // Row Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillText(rowName.slice(0, 12), 10, padding.top + (r * cellH) + (cellH / 2) + 3);

      for (let c = 0; c < n; c++) {
        const colName = columns[c];
        const val = matrix[rowName] ? matrix[rowName][colName] : 0;
        const x = padding.left + (c * cellW);
        const y = padding.top + (r * cellH);

        // Color ramp: Cyan for positive (+1.0), Deep black for 0, Coral for negative (-1.0)
        let fillCol = '#050b08';
        if (val > 0) {
          fillCol = `rgba(34, 211, 238, ${Math.abs(val) * 0.85 + 0.05})`;
        } else if (val < 0) {
          fillCol = `rgba(251, 113, 133, ${Math.abs(val) * 0.85 + 0.05})`;
        }

        ctx.fillStyle = fillCol;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

        // Value text
        ctx.fillStyle = Math.abs(val) > 0.4 ? '#fff' : '#64748b';
        ctx.font = '9px "Fira Code", monospace';
        ctx.fillText(val.toFixed(2), x + (cellW / 2) - 12, y + (cellH / 2) + 3);
      }
    }
  }
}

window.ChartRenderer = ChartRenderer;
