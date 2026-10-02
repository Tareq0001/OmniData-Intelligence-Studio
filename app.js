/**
 * OmniData Studio Master Controller
 * Ingests datasets, drives statistical profiling, renders Canvas charts,
 * computes correlations, OLS regressions, and generates executive reports.
 */

// -------------------------------------------------------------
// 1. Web Audio Synthesizer
// -------------------------------------------------------------
class CyberAudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.035);
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

window.soundFX = new CyberAudioSynthesizer();

// -------------------------------------------------------------
// 2. State & Data Models
// -------------------------------------------------------------
let currentDataset = null;
let currentDatasetKey = 'fintech-credit';
let activeChartType = 'histogram'; // 'histogram', 'scatter', 'heatmap'
let primaryDimension = '';
let scatterX = '';
let scatterY = '';

// -------------------------------------------------------------
// 3. Application Lifecycle
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  setupEventHandlers();
  loadDataset('fintech-credit');
  console.log("OmniData Intelligence Studio Core Engine Active.");
});

function setupEventHandlers() {
  // Dataset Dropdown
  const dsSelect = document.getElementById('dataset-select');
  dsSelect.addEventListener('change', (e) => {
    loadDataset(e.target.value);
    if (window.soundFX) window.soundFX.playClick();
  });

  // Primary Dimension Dropdown (Histogram)
  const dimSelect = document.getElementById('primary-dim-select');
  dimSelect.addEventListener('change', (e) => {
    primaryDimension = e.target.value;
    updateAnalyticsAndRender();
    if (window.soundFX) window.soundFX.playClick();
  });

  // Scatter X & Y Dropdowns
  const scX = document.getElementById('scatter-x-select');
  const scY = document.getElementById('scatter-y-select');
  scX.addEventListener('change', (e) => {
    scatterX = e.target.value;
    updateAnalyticsAndRender();
  });
  scY.addEventListener('change', (e) => {
    scatterY = e.target.value;
    updateAnalyticsAndRender();
  });

  // Chart Tabs
  const chartTabs = document.querySelectorAll('.chart-tab');
  chartTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      chartTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeChartType = tab.dataset.chart;

      const scatterControls = document.getElementById('scatter-controls');
      scatterControls.style.display = activeChartType === 'scatter' ? 'flex' : 'none';

      renderCurrentChart();
      if (window.soundFX) window.soundFX.playClick();
    });
  });

  // Custom CSV Upload
  const btnUpload = document.getElementById('btn-upload-csv');
  const csvInput = document.getElementById('csv-file-input');
  btnUpload.addEventListener('click', () => csvInput.click());

  csvInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const parsed = AnalyticsEngine.parseCSV(event.target.result);
      if (parsed && parsed.numericColumns.length > 0) {
        currentDataset = parsed;
        const optCustom = document.querySelector('#dataset-select option[value="custom"]');
        optCustom.disabled = false;
        optCustom.selected = true;
        optCustom.textContent = `Custom: ${file.name.slice(0, 16)} (${parsed.records.length} Obs)`;

        initializeDatasetView();
        alert(`Successfully ingested ${parsed.records.length} records across ${parsed.headers.length} attributes.`);
      } else {
        alert("Unable to parse CSV. Please ensure it contains header columns and numeric data.");
      }
    };
    reader.readAsText(file);
  });

  // Export Executive Report
  const btnExport = document.getElementById('btn-export-report');
  btnExport.addEventListener('click', exportAnalyticalReport);

  // Sound Toggle
  const btnSound = document.getElementById('btn-sound-toggle');
  btnSound.addEventListener('click', () => {
    const isAudioOn = window.soundFX.toggle();
    btnSound.textContent = isAudioOn ? '🔊' : '🔇';
  });

  // Recalculate
  const btnRun = document.getElementById('btn-refresh-run');
  btnRun.addEventListener('click', () => {
    updateAnalyticsAndRender();
    if (window.soundFX) window.soundFX.playClick();
  });

  // Window resize observer for crisp canvas
  window.addEventListener('resize', () => {
    resizeCanvas();
    renderCurrentChart();
  });
}

// -------------------------------------------------------------
// 4. Data Loading & Initialization
// -------------------------------------------------------------
function loadDataset(key) {
  currentDatasetKey = key;
  const datasets = AnalyticsEngine.getEnterpriseDatasets();

  if (datasets[key]) {
    currentDataset = datasets[key].generator();
    initializeDatasetView();
  }
}

function initializeDatasetView() {
  if (!currentDataset) return;

  const numCols = currentDataset.numericColumns;
  primaryDimension = numCols[0];
  scatterX = numCols[0];
  scatterY = numCols[1] || numCols[0];

  // Populate Primary Dim Dropdown
  const dimSelect = document.getElementById('primary-dim-select');
  dimSelect.innerHTML = '';
  numCols.forEach(col => {
    const opt = document.createElement('option');
    opt.value = col;
    opt.textContent = col;
    dimSelect.appendChild(opt);
  });

  // Populate Scatter Dropdowns
  const scX = document.getElementById('scatter-x-select');
  const scY = document.getElementById('scatter-y-select');
  scX.innerHTML = '';
  scY.innerHTML = '';
  numCols.forEach((col, idx) => {
    const opt1 = document.createElement('option');
    opt1.value = col;
    opt1.textContent = col;
    if (idx === 0) opt1.selected = true;
    scX.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = col;
    opt2.textContent = col;
    if (idx === 1 || (idx === 0 && numCols.length === 1)) opt2.selected = true;
    scY.appendChild(opt2);
  });

  // Render Schema List
  renderSchemaList();
  resizeCanvas();
  updateAnalyticsAndRender();
}

function renderSchemaList() {
  const list = document.getElementById('schema-list');
  list.innerHTML = '';

  currentDataset.headers.forEach(h => {
    const isNum = currentDataset.numericColumns.includes(h);
    const item = document.createElement('div');
    item.className = 'schema-item';
    item.innerHTML = `
      <span class="schema-col-name">${h}</span>
      <span class="schema-col-type">${isNum ? 'Float64 / Int' : 'Categorical'}</span>
    `;
    list.appendChild(item);
  });

  document.getElementById('row-count-badge').textContent = `${currentDataset.records.length.toLocaleString()} Rows`;
  document.getElementById('kpi-rows').textContent = currentDataset.records.length.toLocaleString();
}

// -------------------------------------------------------------
// 5. Statistical Calculations & Viewport Rendering
// -------------------------------------------------------------
function updateAnalyticsAndRender() {
  if (!currentDataset) return;

  const values = currentDataset.records.map(r => r[primaryDimension]);
  const stats = AnalyticsEngine.calculateDescriptiveStats(values);
  const outliers = AnalyticsEngine.detectOutliers(values);

  // 1. Update Moments Grid
  renderMomentsGrid(stats);

  // 2. Compute Max Correlation
  const corrMatrix = AnalyticsEngine.buildCorrelationMatrix(currentDataset.records, currentDataset.numericColumns);
  let maxCorr = 0;
  currentDataset.numericColumns.forEach(c1 => {
    currentDataset.numericColumns.forEach(c2 => {
      if (c1 !== c2) {
        const r = Math.abs(corrMatrix[c1][c2]);
        if (r > maxCorr) maxCorr = r;
      }
    });
  });
  document.getElementById('kpi-corr').textContent = maxCorr ? `+${maxCorr.toFixed(3)}` : '0.000';
  document.getElementById('kpi-anomalies').textContent = outliers.count;

  // 3. Compute OLS Regression for Scatter
  const xValues = currentDataset.records.map(r => r[scatterX]);
  const yValues = currentDataset.records.map(r => r[scatterY]);
  const reg = AnalyticsEngine.fitLinearRegression(xValues, yValues);

  if (reg) {
    document.getElementById('kpi-r2').textContent = reg.rSquared.toFixed(3);
    renderRegressionDiagnostics(reg);
  }

  // 4. Update Anomaly List
  renderAnomalyList(outliers);

  // 5. Automated Executive Insights (NLG)
  renderExecutiveInsights(stats, maxCorr, reg, outliers);

  // 6. Draw Chart
  renderCurrentChart();
}

function renderMomentsGrid(s) {
  const container = document.getElementById('moments-container');
  if (!s) { container.innerHTML = ''; return; }

  const items = [
    { label: 'Sample Mean (μ)', val: s.mean },
    { label: 'Median (Q2)', val: s.median },
    { label: 'Std Deviation (σ)', val: s.stdDev },
    { label: 'Interquartile (IQR)', val: s.iqr },
    { label: 'Skewness (γ1)', val: s.skewness },
    { label: 'Kurtosis (γ2)', val: s.kurtosis }
  ];

  container.innerHTML = items.map(i => `
    <div class="moment-item">
      <span class="moment-label">${i.label}</span>
      <span class="moment-val">${i.val}</span>
    </div>
  `).join('');
}

function renderRegressionDiagnostics(reg) {
  const container = document.getElementById('reg-parameters');
  container.innerHTML = `
    <div class="reg-row"><span>Equation</span> <span class="reg-val">${reg.equation}</span></div>
    <div class="reg-row"><span>Coefficient (β1)</span> <span class="reg-val">${reg.slope}</span></div>
    <div class="reg-row"><span>Intercept (β0)</span> <span class="reg-val">${reg.intercept}</span></div>
    <div class="reg-row"><span>R² Goodness of Fit</span> <span class="reg-val">${reg.rSquared}</span></div>
    <div class="reg-row"><span>Root Mean Sq Error</span> <span class="reg-val">${reg.rmse}</span></div>
  `;
}

function renderAnomalyList(outliers) {
  const container = document.getElementById('anomaly-list');
  if (outliers.count === 0) {
    container.innerHTML = '<div style="color: #64748b; font-size: 11px;">Zero structural anomalies detected. All points within Tukey fences.</div>';
    return;
  }

  container.innerHTML = outliers.outliers.slice(0, 8).map(o => `
    <div class="anomaly-item">
      <span>Obs #${o.index + 1}: Value ${o.value}</span>
      <span>Z=${o.zScore}σ</span>
    </div>
  `).join('');
}

function renderExecutiveInsights(stats, maxCorr, reg, outliers) {
  const container = document.getElementById('insights-body');
  const points = [];

  // Distribution insight
  if (Math.abs(stats.skewness) < 0.5) {
    points.push(`Distribution of <b>${primaryDimension}</b> exhibits near-Gaussian symmetry (Skewness: ${stats.skewness}).`);
  } else if (stats.skewness > 0.5) {
    points.push(`Distribution of <b>${primaryDimension}</b> has a strong rightward positive tail (Skewness: ${stats.skewness}).`);
  } else {
    points.push(`Distribution of <b>${primaryDimension}</b> is negatively skewed with a heavy left tail.`);
  }

  // Regression insight
  if (reg) {
    const fitQuality = reg.rSquared > 0.75 ? "High Predictive Power" : (reg.rSquared > 0.4 ? "Moderate Association" : "Weak Linear Fit");
    points.push(`OLS model predicts <b>${scatterY}</b> from <b>${scatterX}</b> with ${fitQuality} (R² = ${reg.rSquared}).`);
  }

  // Outlier insight
  if (outliers.count > 0) {
    points.push(`Tukey's IQR filter identified <b>${outliers.count} anomalies</b> (${outliers.percentage}% of corpus) exceeding 1.5×IQR fences.`);
  }

  container.innerHTML = points.map(p => `
    <div class="insight-point">
      <span class="insight-bullet">▶</span>
      <span>${p}</span>
    </div>
  `).join('');
}

// -------------------------------------------------------------
// 6. Canvas Chart Dispatcher
// -------------------------------------------------------------
function resizeCanvas() {
  const canvas = document.getElementById('main-analytics-canvas');
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth * (window.devicePixelRatio || 1);
  canvas.height = parent.clientHeight * (window.devicePixelRatio || 1);
}

function renderCurrentChart() {
  const canvas = document.getElementById('main-analytics-canvas');
  if (!currentDataset) return;

  if (activeChartType === 'histogram') {
    const values = currentDataset.records.map(r => r[primaryDimension]);
    ChartRenderer.drawHistogramWithKDE(canvas, values, primaryDimension);
  } else if (activeChartType === 'scatter') {
    const xArr = currentDataset.records.map(r => r[scatterX]);
    const yArr = currentDataset.records.map(r => r[scatterY]);
    const reg = AnalyticsEngine.fitLinearRegression(xArr, yArr);
    ChartRenderer.drawScatterWithRegression(canvas, xArr, yArr, scatterX, scatterY, reg);
  } else if (activeChartType === 'heatmap') {
    const matrix = AnalyticsEngine.buildCorrelationMatrix(currentDataset.records, currentDataset.numericColumns);
    ChartRenderer.drawCorrelationHeatmap(canvas, matrix, currentDataset.numericColumns);
  }
}

// -------------------------------------------------------------
// 7. Executive Report Exporter
// -------------------------------------------------------------
function exportAnalyticalReport() {
  if (!currentDataset) return;

  const values = currentDataset.records.map(r => r[primaryDimension]);
  const stats = AnalyticsEngine.calculateDescriptiveStats(values);
  const outliers = AnalyticsEngine.detectOutliers(values);
  const xArr = currentDataset.records.map(r => r[scatterX]);
  const yArr = currentDataset.records.map(r => r[scatterY]);
  const reg = AnalyticsEngine.fitLinearRegression(xArr, yArr);

  const report = `# OMNIDATA EXECUTIVE STATISTICAL REPORT
Generated on: ${new Date().toISOString()}
Active Corpus: ${currentDatasetKey} (n=${currentDataset.records.length})

## 1. Primary Dimension: ${primaryDimension}
- Mean (μ): ${stats.mean}
- Median: ${stats.median}
- Standard Deviation (σ): ${stats.stdDev}
- Variance: ${stats.variance}
- Interquartile Range (IQR): ${stats.iqr}
- Skewness: ${stats.skewness}
- Excess Kurtosis: ${stats.kurtosis}

## 2. Ordinary Least Squares (OLS) Regression
- Dependent Variable (Y): ${scatterY}
- Independent Predictor (X): ${scatterX}
- Fitted Equation: ${reg ? reg.equation : 'N/A'}
- Coefficient of Determination (R²): ${reg ? reg.rSquared : 'N/A'}
- Root Mean Squared Error (RMSE): ${reg ? reg.rmse : 'N/A'}

## 3. Anomaly & Outlier Audit
- Outlier Count: ${outliers.count} (${outliers.percentage}% of sample)
- Lower Tukey Fence: ${outliers.lowerFence}
- Upper Tukey Fence: ${outliers.upperFence}

Certified by: OmniData Intelligence Studio Engine
`;

  const blob = new Blob([report], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `OmniData_Executive_Report_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);

  if (window.soundFX) window.soundFX.playClick();
}
