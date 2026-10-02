# OmniData Studio: Enterprise Statistical Profiling & Predictive Analytics 📊🔬

An end-to-end, zero-dependency statistical data analytics workstation engineered in pure vanilla modern web technologies. Adheres strictly to high-density Obsidian Cyber-Emerald aesthetic with HTML5 Canvas visualizers and real mathematical profiling engines.

## 🚀 Live Production URL
👉 **[https://tareq0001.github.io/OmniData-Intelligence-Studio/](https://tareq0001.github.io/OmniData-Intelligence-Studio/)**

---

## 🧮 Mathematical & Algorithmic Core
1. **Descriptive Moments & Shape Parameters:**
   - Sample Mean $\\mu$, Variance $s^2$, and Standard Deviation $\\sigma$.
   - Sample Skewness (Fisher-Pearson coefficient $\\gamma_1$).
   - Excess Kurtosis (Fourth standardized moment $\\gamma_2$).
   - Interquartile Range ($IQR = Q_3 - Q_1$).
2. **Ordinary Least Squares (OLS) Linear Regression:**
   - Closed-form coefficient derivation:
     $$\\beta_1 = \\frac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sum (x_i - \\bar{x})^2}, \\quad \\beta_0 = \\bar{y} - \\beta_1 \\bar{x}$$
   - Coefficient of Determination ($R^2$) and Root Mean Squared Error ($RMSE$).
3. **Correlation Topology:**
   - Full pairwise Pearson correlation matrix $r \\in [-1.0, +1.0]$.
4. **Statistical Anomaly Detection:**
   - Tukey's Fences: Outliers flagged if $x < Q_1 - 1.5 \\cdot IQR$ or $x > Q_3 + 1.5 \\cdot IQR$.
   - Standardized Z-Score thresholding ($|Z| \\ge 2.8$).

---

## 🛠️ Features
- **Instant CSV Ingestion:** Drag and drop any custom `.csv` dataset from local disk for automated profiling in under 50ms.
- **Pre-Loaded Enterprise Datasets:** FinTech Credit Scoring (1,000 Obs), SaaS Churn Valuation (800 Obs), and Supply Chain Lead-Time Variance (650 Obs).
- **Executive Report Generation:** One-click export of comprehensive Markdown audits with model equations and statistical summaries.
- **PWA & Offline Capability:** Zero-latency execution without cloud round-trips.

---

**Lead Architect:** أ. طارق ابوعشي  
**Repository:** [github.com/Tareq0001/OmniData-Intelligence-Studio](https://github.com/Tareq0001/OmniData-Intelligence-Studio)
