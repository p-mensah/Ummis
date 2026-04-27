# Ummis Lane Enterprise

A full-stack business management system for inventory tracking, point-of-sale (POS), sales analytics, customer relationship management (CRM), and real-time business performance monitoring. Built for small-to-medium retail and wholesale operations.

---

## ✨ Features

### Dashboard & Analytics
- **Real-time KPIs** — total products, low-stock alerts, lifetime sales, and today's revenue at a glance
- **Interactive charts** — 7-day sales chart, monthly trends, and best-seller rankings powered by Recharts
- **Sales trend reports** — filter by weekly, monthly, or yearly timeframes

### Inventory Management
- **Product catalog** — manage SKUs, barcodes, brands, units of measure, and categories
- **Stock control** — automatic stock deduction on sales and replenishment on purchases
- **Low-stock alerts** — configurable threshold with a dedicated low-stock report
- **Stock adjustments** — single or bulk adjustments with reason tracking and audit trail
- **Price history** — automatic logging of selling-price changes per product

### Point of Sale (POS)
- **Sales transactions** — create sales with multiple items, customer linking, and payment method tracking
- **Refunds** — full sale refunds with reason capture and automatic stock restoration
- **Shift management** — open/close cashier shifts with starting cash, ending cash, and expected cash reconciliation
- **Loyalty points** — customers earn points based on purchase totals

### Purchases & Suppliers
- **Purchase orders** — record supplier purchases with itemized breakdowns
- **Supplier directory** — manage supplier contacts and details
- **Automatic stock intake** — inventory updates on purchase creation

### Customer & User Management
- **Customer database** — profiles, contact info, purchase history, and loyalty points
- **Role-based access control** — `admin` and `staff` roles with route-level and API-level protection
- **User management** — admins can add users and toggle active status

### Additional Modules
- **Expense tracking** — log and categorize operational expenses
- **Categories** — hierarchical product categories with parent/child support
- **Transactions report** — unified view of sales, purchases, and expenses
- **Settings** — configure low-stock thresholds and other business rules

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7 |
| UI & Charts | Lucide React, Recharts, Motion |
| Backend | Express 4, TypeScript, CORS |
| Database | SQLite (better-sqlite3) — file-based, zero external DB setup |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| AI Integration | Google GenAI SDK |
| Build Tool | tsx (dev), Node.js with experimental strip-types (prod start) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (recommended: latest LTS)
- **npm** (comes with Node.js)

### Installation

1. **Clone or download the repository** and navigate into the project folder:
   ```bash
   cd Ummis-Lane-enterprise
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **(Optional) Configure environment variables:**
   Create a `.env` file in the project root if you need to customize secrets or API keys:
   ```bash
   # Example .env
   JWT_SECRET=your_super_secret_key_change_me
   GEMINI_API_KEY=your_google_genai_key
   ```
   > If `.env` is omitted, the app uses sensible defaults for local development.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Visit [http://localhost:3000](http://localhost:3000)

---

## 🔐 Default Login Credentials

The database is auto-seeded on first run with two default accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin email` | `Password` |
| Staff | `staff email` | `Password` |

> **Security note:** Change these credentials immediately in production.

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the full-stack dev server (Express + Vite HMR) on port `3000` |
| `npm run start` | Start production server using Node.js experimental strip-types |
| `npm run build` | Build the React frontend for production (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run TypeScript type-checking (`tsc --noEmit`) |
| `npm run clean` | Remove the `dist/` build folder |

---

## 📁 Project Structure

```
Ummis-Lane-enterprise/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components (Layout, etc.)
│   ├── context/             # React context providers (AuthContext)
│   ├── lib/                 # Utility libraries and helpers
│   ├── pages/               # Route-level page components
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Sales.tsx
│   │   ├── Purchases.tsx
│   │   ├── Adjustments.tsx
│   │   ├── Customers.tsx
│   │   ├── Suppliers.tsx
│   │   ├── Categories.tsx
│   │   ├── Users.tsx
│   │   ├── Expenses.tsx
│   │   ├── Shifts.tsx
│   │   ├── Transactions.tsx
│   │   ├── Settings.tsx
│   │   └── Login.tsx
│   ├── App.tsx              # Root router and route definitions
│   ├── main.tsx             # React DOM entry point
│   └── index.css            # Global styles + Tailwind directives
├── server.ts                # Express backend (API + DB + auth)
├── index.html               # HTML entry point
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── package.json
└── README.md
```

---

## 🗄️ Database

The application uses **SQLite** via `better-sqlite3`. The database file (`retailos.db`) is created automatically in the project root when the server starts for the first time.

### Key Tables
- `users` — system users with roles
- `products` — catalog items with stock levels
- `categories` — product categories (supports parent/child)
- `suppliers_list` — supplier directory
- `customers` — customer profiles with loyalty points
- `sales` / `sale_items` — sales transactions and line items
- `purchases` / `purchase_items` — purchase orders and line items
- `stock_adjustments` — inventory adjustment audit log
- `expenses` — operational expense records
- `shifts` — cashier shift tracking
- `price_history` — historical selling-price changes
- `settings` — configurable business rules

Schema migrations and default seed data are handled automatically in `server.ts`.

---

## 🔌 API Overview

All API routes are prefixed with `/api` and require a valid JWT token in the `Authorization: Bearer <token>` header (except `/api/auth/login`).

### Authentication
- `POST /api/auth/login` — authenticate and receive JWT
- `GET /api/auth/me` — get current user info

### Core Resources
- `GET|POST /api/products` — list / create products
- `GET|PUT|DELETE /api/products/:id` — read / update / delete product
- `GET /api/products/:id/price-history` — price change history
- `POST /api/products/bulk-stock-update` — bulk stock update

### Inventory
- `POST /api/inventory/adjust` — single stock adjustment
- `POST /api/inventory/adjust-bulk` — bulk stock adjustment (admin)
- `GET /api/inventory/adjustments` — adjustment audit log

### Sales & Purchases
- `POST /api/sales` — create a sale
- `GET /api/sales` — list sales (supports date, user, customer, category filters)
- `GET /api/sales/:id` — sale detail with line items
- `POST /api/sales/:id/refund` — process a refund
- `POST /api/purchases` — create a purchase
- `GET /api/purchases` — list purchases

### Customers, Suppliers, Categories, Users
- `GET|POST /api/customers`
- `GET|POST /api/suppliers`
- `GET|POST|PUT|DELETE /api/categories`
- `GET /api/users`
- `POST /api/users` — create user (admin only)
- `PUT /api/users/:id/status` — toggle user active status (admin only)

### Expenses & Shifts
- `GET|POST /api/expenses`
- `GET /api/shifts/current`
- `POST /api/shifts/open`
- `POST /api/shifts/close`

### Reports
- `GET /api/reports/summary` — dashboard KPIs
- `GET /api/reports/chart` — last 7 days sales data
- `GET /api/reports/best-sellers` — top 10 selling products
- `GET /api/reports/sales-trends?timeframe=weekly|monthly|yearly`
- `GET /api/reports/monthly-trends` — last 6 months
- `GET /api/reports/low-stock` — products below threshold
- `GET /api/reports/transactions` — unified transactions list

### Settings
- `GET /api/settings` — get all settings (admin)
- `PUT /api/settings` — update settings (admin)

---

## ⚙️ Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `JWT_SECRET` | Signing secret for auth tokens | `supersecret_retailos_key_change_me` |
| `GEMINI_API_KEY` | Google GenAI API key | *(none)* |
| `NODE_ENV` | Runtime environment | `development` |

---

## 📝 License

Private Enterprise Software — Ummis Lane Enterprise. All rights reserved.

