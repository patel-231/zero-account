# ZeroBooks - Indian Accounting, ERP & GST SaaS

A modern, high-performance double-entry accounting, inventory management, and GST invoicing web application built with React, TypeScript, and Tailwind CSS.

---

## 🚀 GitHub Pages Deployment Guide

ZeroBooks is configured to deploy directly to **GitHub Pages** with zero manual server configuration. It includes:
- **Relative Asset Paths (`base: './'`)**: Works out-of-the-box regardless of whether your repository is hosted at root or a subpath (e.g., `https://<username>.github.io/<repo-name>/`).
- **`.nojekyll` Included**: Prevents GitHub Pages' Jekyll processing from interfering with Vite assets.
- **`404.html` SPA Fallback**: Automatically duplicates `index.html` on build to prevent 404s when navigating or refreshing.
- **Automated GitHub Actions CI/CD Workflow**: Pre-configured in `.github/workflows/deploy.yml`.

---

### Method 1: Automatic GitHub Actions (Recommended)

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```
2. On GitHub, go to your repository **Settings** → **Pages** (in the left sidebar).
3. Under **Build and deployment** → **Source**, select **GitHub Actions**.
4. GitHub will automatically trigger the workflow in `.github/workflows/deploy.yml`, build the project, and deploy your site to:
   ```
   https://<your-username>.github.io/<your-repo-name>/
   ```

---

### Method 2: 1-Click CLI Deployment (`gh-pages`)

If you prefer deploying via the `gh-pages` branch instead of GitHub Actions:

1. Run the deploy script in your terminal:
   ```bash
   npm run deploy
   ```
   *(This runs `npm run build` and automatically pushes the compiled `dist/` directory to the `gh-pages` branch).*
2. On GitHub, go to **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **Deploy from a branch**.
4. Choose the `gh-pages` branch and `/ (root)` directory, then click **Save**.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🛠️ Key Features

- **Double-Entry Accounting**: General Ledger, Chart of Accounts, Journal Entries with debit/credit balance enforcement, Trial Balance, Profit & Loss, and Balance Sheet.
- **GST Invoicing**: Intra-State (CGST + SGST) vs. Inter-State (IGST) calculation based on Place of Supply (POS).
- **Inventory & Multi-Warehouse**: Real-time stock movements, low-stock warnings, and warehouse locations.
- **Quotations & Sales Orders**: Conversion workflows into Tax Invoices.
- **Payments & Receipts**: Multi-mode receipt tracking (Bank Transfer, UPI, Cheque, Cash).
- **Audit Logs & Test Suite**: In-app test runner for accounting invariants and verifiable audit trails.
- **100% Client-Side Persistence**: Saves data safely to the browser's `localStorage` with export and reset options.
