/**
 * OmniData Analytics Engine - Mathematical & Statistical Core
 * Provides vector math, statistical profiling, correlation matrices,
 * OLS regression, anomaly detection, and synthetic enterprise datasets.
 */

class AnalyticsEngine {
  // -------------------------------------------------------------
  // 1. Descriptive Statistics & Moments
  // -------------------------------------------------------------
  static calculateDescriptiveStats(values) {
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    const n = valid.length;
    if (n === 0) return null;

    const sum = valid.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    // Median & Quartiles
    const median = n % 2 === 0 ? (valid[n / 2 - 1] + valid[n / 2]) / 2 : valid[Math.floor(n / 2)];
    const q1 = valid[Math.floor(n * 0.25)];
    const q3 = valid[Math.floor(n * 0.75)];
    const iqr = q3 - q1;

    // Variance & Standard Deviation
    const sqDiffs = valid.map(v => (v - mean) ** 2);
    const variance = sqDiffs.reduce((acc, v) => acc + v, 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Math.sqrt(variance);

    // Higher Order Moments: Skewness & Kurtosis
    let skewness = 0;
    let kurtosis = 0;
    if (stdDev > 0) {
      const m3 = valid.reduce((acc, v) => acc + ((v - mean) / stdDev) ** 3, 0) / n;
      const m4 = valid.reduce((acc, v) => acc + ((v - mean) / stdDev) ** 4, 0) / n;
      skewness = m3;
      kurtosis = m4 - 3.0; // Excess kurtosis
    }

    const min = valid[0];
    const max = valid[n - 1];

    return {
      count: n,
      mean: Number(mean.toFixed(3)),
      median: Number(median.toFixed(3)),
      variance: Number(variance.toFixed(3)),
      stdDev: Number(stdDev.toFixed(3)),
      min: Number(min.toFixed(3)),
      max: Number(max.toFixed(3)),
      q1: Number(q1.toFixed(3)),
      q3: Number(q3.toFixed(3)),
      iqr: Number(iqr.toFixed(3)),
      skewness: Number(skewness.toFixed(3)),
      kurtosis: Number(kurtosis.toFixed(3))
    };
  }

  // -------------------------------------------------------------
  // 2. Correlation Matrix (Pearson's r)
  // -------------------------------------------------------------
  static calculatePearsonCorrelation(xArr, yArr) {
    const n = Math.min(xArr.length, yArr.length);
    if (n < 2) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    let validCount = 0;

    for (let i = 0; i < n; i++) {
      const x = xArr[i];
      const y = yArr[yArr.length > n ? i : i];
      if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
        sumY2 += y * y;
        validCount++;
      }
    }

    if (validCount < 2) return 0;

    const numerator = (validCount * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((validCount * sumX2) - (sumX ** 2)) * ((validCount * sumY2) - (sumY ** 2)));

    if (denominator === 0) return 0;
    return Number((numerator / denominator).toFixed(4));
  }

  static buildCorrelationMatrix(dataset, numericColumns) {
    const matrix = {};
    numericColumns.forEach(col1 => {
      matrix[col1] = {};
      numericColumns.forEach(col2 => {
        const r = this.calculatePearsonCorrelation(dataset.map(d => d[col1]), dataset.map(d => d[col2]));
        matrix[col1][col2] = r;
      });
    });
    return matrix;
  }

  // -------------------------------------------------------------
  // 3. Ordinary Least Squares (OLS) Linear Regression
  // -------------------------------------------------------------
  static fitLinearRegression(xArr, yArr) {
    const validPairs = [];
    for (let i = 0; i < Math.min(xArr.length, yArr.length); i++) {
      if (typeof xArr[i] === 'number' && typeof yArr[i] === 'number' && !isNaN(xArr[i]) && !isNaN(yArr[i])) {
        validPairs.push({ x: xArr[i], y: yArr[i] });
      }
    }

    const n = validPairs.length;
    if (n < 2) return null;

    const meanX = validPairs.reduce((acc, p) => acc + p.x, 0) / n;
    const meanY = validPairs.reduce((acc, p) => acc + p.y, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (validPairs[i].x - meanX) * (validPairs[i].y - meanY);
      den += (validPairs[i].x - meanX) ** 2;
    }

    const beta1 = den !== 0 ? num / den : 0; // Slope
    const beta0 = meanY - (beta1 * meanX);   // Intercept

    // Goodness of Fit (R-Squared & MSE)
    let ssTot = 0;
    let ssRes = 0;
    validPairs.forEach(p => {
      const pred = beta0 + (beta1 * p.x);
      ssTot += (p.y - meanY) ** 2;
      ssRes += (p.y - pred) ** 2;
    });

    const rSquared = ssTot !== 0 ? Math.max(0, 1.0 - (ssRes / ssTot)) : 0;
    const mse = ssRes / n;
    const rmse = Math.sqrt(mse);

    return {
      slope: Number(beta1.toFixed(4)),
      intercept: Number(beta0.toFixed(4)),
      rSquared: Number(rSquared.toFixed(4)),
      mse: Number(mse.toFixed(4)),
      rmse: Number(rmse.toFixed(4)),
      equation: `y = ${beta1.toFixed(3)}x + ${beta0.toFixed(3)}`
    };
  }

  // -------------------------------------------------------------
  // 4. Anomaly Detection (Tukey's IQR Fences & Z-Score)
  // -------------------------------------------------------------
  static detectOutliers(values) {
    const stats = this.calculateDescriptiveStats(values);
    if (!stats) return { count: 0, outliers: [] };

    const lowerFence = stats.q1 - (1.5 * stats.iqr);
    const upperFence = stats.q3 + (1.5 * stats.iqr);

    const outliers = [];
    values.forEach((v, idx) => {
      if (typeof v === 'number' && !isNaN(v)) {
        const isTukeyOutlier = v < lowerFence || v > upperFence;
        const zScore = stats.stdDev > 0 ? (v - stats.mean) / stats.stdDev : 0;
        const isZOutlier = Math.abs(zScore) >= 2.8;

        if (isTukeyOutlier || isZOutlier) {
          outliers.push({
            index: idx,
            value: v,
            zScore: Number(zScore.toFixed(2)),
            lowerFence,
            upperFence
          });
        }
      }
    });

    return {
      count: outliers.length,
      percentage: Number(((outliers.length / values.length) * 100).toFixed(2)),
      lowerFence: Number(lowerFence.toFixed(2)),
      upperFence: Number(upperFence.toFixed(2)),
      outliers: outliers.slice(0, 50) // limit for UI performance
    };
  }

  // -------------------------------------------------------------
  // 5. Robust In-Browser CSV Parser
  // -------------------------------------------------------------
  static parseCSV(text) {
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return null;

    // Detect delimiter (comma or semicolon)
    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(delimiter).map(h => h.replace(/['"]+/g, '').trim());

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter);
      if (parts.length === headers.length) {
        const obj = {};
        headers.forEach((h, idx) => {
          const raw = parts[idx].replace(/['"]+/g, '').trim();
          const num = Number(raw);
          obj[h] = !isNaN(num) && raw !== '' ? num : raw;
        });
        records.push(obj);
      }
    }

    // Determine numeric vs categorical columns
    const numericCols = headers.filter(h => {
      const sample = records.slice(0, 20).map(r => r[h]);
      return sample.some(v => typeof v === 'number' && !isNaN(v));
    });

    return {
      headers,
      numericColumns: numericCols,
      records
    };
  }

  // -------------------------------------------------------------
  // 6. Pre-Loaded Enterprise Real-World Datasets
  // -------------------------------------------------------------
  static getEnterpriseDatasets() {
    return {
      'fintech-credit': {
        name: 'FinTech Credit Risk & Default Scoring',
        description: '1,000 corporate debt observations tracking debt-to-income, credit score, liquidity, and default risk.',
        generator: () => {
          const records = [];
          for (let i = 1; i <= 1000; i++) {
            const creditScore = Math.round(500 + Math.random() * 320);
            const dti = Number((15 + Math.random() * 55).toFixed(2));
            const loanAmount = Math.round(10000 + (Math.random() ** 1.5) * 90000);
            const annualIncome = Math.round(35000 + (Math.random() ** 1.2) * 120000);
            // Default risk formula with noise
            const riskFactor = (1000 - creditScore) * 0.08 + (dti * 0.9) + (Math.random() * 15 - 7.5);
            const defaultProbability = Number((Math.min(99.0, Math.max(1.0, riskFactor))).toFixed(2));

            records.push({
              LoanID: `LN_${1000 + i}`,
              CreditScore: creditScore,
              AnnualIncome: annualIncome,
              DebtToIncome: dti,
              LoanAmount: loanAmount,
              DefaultRiskPct: defaultProbability
            });
          }
          return {
            headers: ['LoanID', 'CreditScore', 'AnnualIncome', 'DebtToIncome', 'LoanAmount', 'DefaultRiskPct'],
            numericColumns: ['CreditScore', 'AnnualIncome', 'DebtToIncome', 'LoanAmount', 'DefaultRiskPct'],
            records
          };
        }
      },

      'saas-retention': {
        name: 'SaaS Customer Lifetime Valuation & Churn',
        description: '800 B2B enterprise subscription accounts with usage frequency, NPS score, and retention months.',
        generator: () => {
          const records = [];
          for (let i = 1; i <= 800; i++) {
            const tenureMonths = Math.round(1 + Math.random() * 48);
            const monthlySeats = Math.round(5 + Math.random() * 120);
            const arrRevenue = monthlySeats * Math.round(45 + Math.random() * 55) * 12;
            const npsScore = Math.round(Math.min(10, Math.max(0, 5 + Math.random() * 5)));
            const churnScore = Number((Math.max(2, 85 - (npsScore * 7.5) - (tenureMonths * 0.6) + (Math.random() * 10))).toFixed(2));

            records.push({
              AccountID: `ACC_${i.toString().padStart(4, '0')}`,
              TenureMonths: tenureMonths,
              ActiveSeats: monthlySeats,
              ARR_USD: arrRevenue,
              NPS_Score: npsScore,
              ChurnRiskPct: churnScore
            });
          }
          return {
            headers: ['AccountID', 'TenureMonths', 'ActiveSeats', 'ARR_USD', 'NPS_Score', 'ChurnRiskPct'],
            numericColumns: ['TenureMonths', 'ActiveSeats', 'ARR_USD', 'NPS_Score', 'ChurnRiskPct'],
            records
          };
        }
      },

      'supply-chain': {
        name: 'Global Supply Chain Freight & Lead-Time Variance',
        description: '650 multimodal logistics shipments assessing cargo weight, transit lead time, demurrage, and variance.',
        generator: () => {
          const records = [];
          for (let i = 1; i <= 650; i++) {
            const cargoTons = Number((1.5 + Math.random() * 45).toFixed(2));
            const transitDistanceKm = Math.round(300 + Math.random() * 8500);
            const leadTimeDays = Number((transitDistanceKm / 450 + (cargoTons * 0.15) + (Math.random() * 4)).toFixed(1));
            const freightCost = Math.round(1200 + (transitDistanceKm * 1.8) + (cargoTons * 85));
            const varianceDays = Number((Math.max(-2.0, Math.random() * 6.0 - 1.5)).toFixed(1));

            records.push({
              ShipmentID: `SHP_${2000 + i}`,
              CargoTons: cargoTons,
              TransitKm: transitDistanceKm,
              LeadTimeDays: leadTimeDays,
              FreightCostUSD: freightCost,
              DelayVarianceDays: varianceDays
            });
          }
          return {
            headers: ['ShipmentID', 'CargoTons', 'TransitKm', 'LeadTimeDays', 'FreightCostUSD', 'DelayVarianceDays'],
            numericColumns: ['CargoTons', 'TransitKm', 'LeadTimeDays', 'FreightCostUSD', 'DelayVarianceDays'],
            records
          };
        }
      }
    };
  }
}

window.AnalyticsEngine = AnalyticsEngine;
