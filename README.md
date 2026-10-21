# AuricLens — MCX Gold Futures Relative-Value Intelligence Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e.svg)](https://supabase.com/)
[![Automated Tests](https://img.shields.io/badge/Tests-36%20Passed%20%7C%200%20Failed-emerald.svg)]()

> **AuricLens** is an institutional-grade, responsive relative-value quantitative intelligence web application for Multi Commodity Exchange of India (MCX) gold futures. It features a bespoke dark navy-and-gold fintech UI, contract normalization for quotation units and purity fineness, cost-of-carry fair value modeling, explainable signals with explicit rejection reasons, and walk-forward backtesting without look-ahead bias.

---

## 🌟 Key Highlights & Architectural Advantages

- **Zero Complex Infrastructure**: Built entirely on Next.js, TypeScript, Tailwind CSS, and Supabase hosted PostgreSQL. No separate backend servers, Docker daemon requirements, or brittle microservices needed.
- **Deep Navy & Gold Fintech Aesthetic**: Designed with an authentic bullion trading theme (`#071328` midnight sapphire navy, `#0B1E38` card surfaces, `#F59E0B` amber gold accents, and `#FBBF24` champagne highlights). Compatible across mobile phones, tablets, laptops, and ultra-wide desktops.
- **Contract Normalization Engine**: Standardizes all MCX gold contracts (`GOLD` 1kg, `GOLDM` 100g, `GOLDGUINEA` 8g, and `GOLDPETAL` 1g) into the Indian benchmark: **₹ per 10 grams @ 995 purity fineness**.
- **Public MCX Bhavcopy Ingestion**: Ingests public daily Bhavcopy CSV files with rigorous validation of dates, symbols, quotation units, purity, and OHLC data sanity. Includes a pre-loaded multi-month verified historical dataset.
- **Explainable Signals & Rejection Engine**: Translates statistical deviations into actionable spreads or explicit **"NO TRADE"** states with transparent rejection reasons (Tender delivery window, Insufficient liquidity, or Sub-economic friction).
- **Institutional Transaction Cost Model**: Models real-world MCX fees (0.0021% exchange fee, 0.01% CTT, 18% GST, 0.002% Stamp Duty, ₹20 flat brokerage, and customizable slippage ticks).
- **Zero Look-Ahead Bias Walk-Forward Backtester**: Rolling calibration windows strictly use data up to $t-1$. Features mark-to-market daily equity curves, benchmark comparisons (Buy & Hold front-month roll), drawdown waterfalls, and trade execution logs.
- **Resilient Hybrid Storage**: Seamlessly connects to Supabase hosted PostgreSQL via environment variables, with an automatic in-memory/localStorage fallback so the application works 100% out of the box even without cloud credentials.

---

## 📐 Quantitative & Financial Methodology

### 1. Quotation Unit and Purity Normalization
MCX gold contracts trade in different quotation sizes and purities:
- **GOLD (Big 1 Kg)**: Quoted in ₹ per 10 grams, 995 purity $\rightarrow$ Factor: $1.0$
- **GOLDM (Mini 100g)**: Quoted in ₹ per 10 grams, 995 purity $\rightarrow$ Factor: $1.0$
- **GOLDGUINEA (8g)**: Quoted in ₹ per 8 grams, 995 purity $\rightarrow$ Factor: $10 / 8 = 1.25$
- **GOLDPETAL (1g)**: Quoted in ₹ per 1 gram, 999 fine gold (24K) $\rightarrow$ Factor: $(10 / 1) \times (995 / 999) = 9.95996$

$$\text{Price}_{\text{normalized}} = \text{Price}_{\text{raw}} \times \left(\frac{10}{\text{Quotation Unit (g)}}\right) \times \left(\frac{995}{\text{Contract Purity}}\right)$$

### 2. Cost-of-Carry Theoretical Fair Value Model
In gold futures, physical contango reflects the interest cost of capital (RBI Repo rate $r = 6.50\%$) plus vaulted physical storage and insurance ($c = 0.25\%$ p.a.) minus convenience yield ($y = 0.0\%$):

$$F_{\text{fair}} = P_1 \times \exp\left((r + c - y) \times \frac{\Delta T}{365}\right)$$

$$\text{Fair Spread} = F_{\text{fair}} - P_1$$

$$\text{Dislocation} = \text{Spread}_{\text{actual}} - \text{Spread}_{\text{fair}}$$

### 3. Annualized Implied Carry Return
$$\text{Carry Rate} = \left(\frac{P_2 - P_1}{P_1}\right) \times \left(\frac{365}{\Delta T}\right) \times 100\%$$

- **Super Contango**: Carry yield $\ge 9.5\%$ p.a. (Risk-free carry arbitrage above institutional repo + storage)
- **Normal Contango**: $4.0\% \le \text{Carry yield} < 9.5\%$ p.a. (Standard carrying equilibrium)
- **Compressed Carry**: $0\% \le \text{Carry yield} < 4.0\%$ p.a.
- **Physical Backwardation**: Spread $< 0$ (Spot tightness / delivery premium)

### 4. 4-Stage Quantitative Gateways & Explicit "NO TRADE"
Every potential spread is evaluated through strict institutional filters:
1. **Statistical Z-Score**: Requires $|Z| \ge 1.80\sigma$ deviation from rolling 20-day mean.
2. **Friction Hurdle**: Expected gross edge must exceed $2.0 \times \text{total round-trip friction}$ (Brokerage + MCX fee + CTT + GST + Stamp duty + Slippage).
3. **Tender Notice Period Protection**: Disallows initiating spreads within 5 trading days of front contract expiry to eliminate compulsory physical delivery assignment risk.
4. **Liquidity Minimums**: Rejects contracts with $< 100$ lots open interest or $< 50$ lots daily turnover.

---

## 🗄️ Supabase Hosted Database Setup

AuricLens includes a single copy-paste SQL setup script: [`supabase_schema.sql`](supabase_schema.sql).

### Setup in 4 Easy Steps:
1. Log in to [supabase.com](https://supabase.com) and create a free project.
2. Open the **SQL Editor** from the left navigation bar, create a **New Query**, paste the contents of [`supabase_schema.sql`](supabase_schema.sql), and click **Run**.
3. Go to **Project Settings** $\rightarrow$ **API**. Copy your **Project URL** and **Anon Public Key**.
4. Create a `.env.local` file (or edit `frontend/.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. Restart the application. AuricLens will automatically sync contracts, market data, signals, and backtest reports with your cloud database!

### Tables Created:
- `contracts`: Official MCX specifications for `GOLD`, `GOLDM`, `GOLDGUINEA`, and `GOLDPETAL`.
- `market_data`: Historical MCX Bhavcopy records with normalized benchmark prices.
- `spread_analyses`: Saved relative-value calculations, implied carry rates, and explainable thesis.
- `backtest_reports`: Walk-forward backtest results, parameter logs, equity curves, and trade records.

---

## 🚀 Quickstart & Minimal Run Commands

### Prerequisites:
- Node.js v18+ (tested on Node v24)
- npm v9+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Thanya113/ManaliHackathon.git
cd ManaliHackathon
npm install
```

### 2. Run Automated Test Suite (36 Tests)
```bash
npm test
```

### 3. Launch the Application Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Application Modules & User Journey

1. **Executive Dashboard (`/`)**:
   - Live MCX market session ticker, RBI repo rate, vaulted storage cost, and market regime banner.
   - Key KPI metric cards (Front Benchmark price, Top Calendar Roll yield, Quantitative Signals, MCX Active OI).
   - Opportunity Radar with instant Action Badges (`LONG SPREAD`, `SHORT SPREAD`, `NO TRADE`).
   - Active Calendar Spreads Matrix table.

2. **Relative-Value Spread Analyzer (`/spreads`)**:
   - Interactive pair switcher: `GOLD APR-JUN`, `GOLD JUN-AUG`, `GOLD AUG-OCT`, `GOLD vs GOLDM`, `GOLD vs PETAL`.
   - Real-time parameter sliders for RBI Repo Rate (4.0% - 10.0%) and Storage Cost (0.10% - 1.00%).
   - Synchronized SVG chart comparing Actual Spread against Theoretical Fair Value line with crosshairs.
   - Dual-line Normalized Futures Price chart in standardized ₹/10g @ 995 purity.
   - Anomaly detection alerts (Statistical extreme Z, Physical backwardation, Liquidity deficits).

3. **Explainable Signals & Rejection Engine (`/signals`)**:
   - Comprehensive SignalCards detailing pair names, expiry cycles, actual vs fair spread, carry yield, and confidence scores.
   - Filter by Actionable Alpha, No Trade State, or Filtered Rejections.
   - Explicit **"NO TRADE"** cards detailing the exact rejection reason (e.g. Tender Notice Delivery Window Active, Expected Edge Below Cost Hurdle).
   - Itemized 4-leg institutional transaction friction audit modal (Exchange fee, CTT, GST, Stamp duty, Brokerage, Slippage).

4. **MCX Contract Specifications & Purity Normalizer (`/contracts`)**:
   - Complete official MCX specifications table comparing trading units, quotation units, fineness, tick sizes, lot multipliers, tender windows, and delivery units.
   - Interactive **Purity & Weight Arbitrage Calculator**: Convert any custom weight (grams, tola, sovereign, troy ounce, kg) and purity (24K 999, 22K 916, 18K 750, 995) to the MCX benchmark equivalent with real-time valuation.

5. **Expiry Calendar & Roll Tracker (`/calendar`)**:
   - Bi-monthly MCX gold contract schedule timeline.
   - Tender notice delivery period danger zones ($T-5$ days) with countdown badges.
   - Open interest liquidity migration tracking (% OI rolling from front to next month).

6. **Walk-Forward Backtesting Lab (`/backtest`)**:
   - Configurable strategy hyperparameters: Lookback window, Entry Z-score, Exit Z-score, Stop loss, Brokerage, Slippage, Capital, and Lot sizing.
   - Walk-forward simulation engine with verified zero look-ahead bias.
   - Interactive SVG Equity Curve: Strategy Net (after fees) vs Strategy Gross vs Buy-and-Hold front-month Gold baseline.
   - Complete trade execution log table with holding periods, entry/exit spreads, fees, net P&L, and exit triggers.
   - 1-Click "Save Report to Supabase" button and past report archive.

7. **Data Ingestion & Bhavcopy Inspector (`/data`)**:
   - Public MCX Bhavcopy CSV file uploader with drag-and-drop and validation summary.
   - 1-Click "Load Verified MCX Gold Archive" button to pre-seed authentic historical data.
   - Filterable data inspector table by contract symbol, expiry date, and trade date.
   - CSV export feature.

8. **Supabase Setup & Diagnostics (`/settings`)**:
   - Live database connection health check and table row count diagnostics.
   - Single copy-paste SQL setup script viewer with 1-click clipboard copy.
   - Step-by-step configuration instructions.

---

## 🧪 Automated Test Verification

The automated test runner (`npm test`) tests all quantitative and storage modules with 36 assertions:
- **Contract Normalization**: Verified exact quotation multipliers and purity conversions for `GOLD`, `GOLDM`, `GOLDGUINEA`, and `GOLDPETAL`.
- **Transaction Costs**: Verified brokerage, MCX turnover charges, CTT, GST, stamp duty, and slippage calculations.
- **Spread & Carry Math**: Verified calendar spreads, theoretical fair values, implied carry rates, and market regime classifications.
- **Anomaly Detection**: Verified extreme Z-scores, physical backwardation, and liquidity squeeze alerts.
- **Signal Engine**: Verified `LONG_SPREAD`, `SHORT_SPREAD`, tender period rejections, liquidity rejections, and equilibrium `NO_TRADE` states.
- **Walk-Forward Backtesting**: Verified zero look-ahead bias, friction deduction, equity curves, Sharpe ratio ($R_f = 6.5\%$), and max drawdowns.
- **Storage Layer**: Verified contract specifications and database connection diagnostics.

```bash
=======================================================
       AURICLENS QUANTITATIVE ENGINE TEST SUITE        
=======================================================
[1] Testing Contract Normalization Engine...        ✓ All Passed
[2] Testing Institutional MCX Cost Model...         ✓ All Passed
[3] Testing Spread Engine & Cost of Carry...        ✓ All Passed
[4] Testing Anomaly Detection Engine...             ✓ All Passed
[5] Testing Signal Evaluation & Rejections...       ✓ All Passed
[6] Testing Walk-Forward Backtester...              ✓ All Passed
[7] Testing Storage Service & Supabase Layer...     ✓ All Passed
=======================================================
TEST RESULTS: 36 PASSED, 0 FAILED
=======================================================
```

---

## ⚖️ Risk & Compliance Disclaimers

1. **No Claims of Guaranteed Profit**: Relative-value spread strategies carry market and basis risks. Historical roll yields and cost-of-carry dislocations do not guarantee future profitability.
2. **Physical Delivery Notice Period**: MCX gold futures are compulsory delivery contracts. Traders not seeking physical delivery must roll or square off positions prior to the tender notice period (5 trading days before expiry).
3. **Regulatory Compliance**: All contract specifications, quotation units, and transaction fee models reflect official MCX circulars and SEBI guidelines.

---

## 👥 Contributors & License

Developed for the **Graph-Based AI Agents / Manali Hackathon** by **Thanya113**.
Licensed under the [MIT License](LICENSE).
