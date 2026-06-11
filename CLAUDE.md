# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KRUNCUY POS — a Point of Sale and ERP system for food outlets. Monorepo with two apps:

- **Backend** (`backend/`): Express REST API + Prisma ORM + PostgreSQL
- **Frontend** (`frontend/`): React + Vite + Tailwind CSS v4 + React Router v7

Two user-facing apps live in the frontend:
- **ERP Dashboard** (`/erp/*`) — admin/owner/purchasing role, full CRUD management
- **Crew App** (`/crew/*`) — outlet crew, POS terminal, attendance, stock opname

All API routes are under `/api/*` and require a `Bearer` JWT token.

## Architecture

### Backend — Modular Express API

```
backend/src/
├── app.js                          # Express app setup, middleware, route mounting
├── server.js                       # Entry point, starts server after syncing access control
├── core/
│   ├── config/                     # env.js (env vars), prisma.js (Prisma client singleton)
│   ├── middleware/                  # auth.middleware (JWT), permission.middleware (RBAC), branchContext.middleware, error.middleware
│   ├── services/                   # accessControl.service (RBAC engine), auditLog.service, branchAccess.service, inventoryCost.service
│   ├── constants/                  # accessControlCatalog.js (role/permission definitions)
│   └── utils/                      # jwt.js, password.js
├── modules/                        # Feature modules grouped by domain
│   ├── auth/                       # Login, session
│   ├── users/                      # User CRUD
│   ├── branches/                   # Branch CRUD
│   ├── products/                   # Product (menu) CRUD
│   ├── product-categories/
│   ├── branch-products/            # Per-branch pricing & availability
│   ├── branch-assignments/         # Crew-to-branch assignment
│   ├── inventory/                  # Inventory items, movements, costing
│   ├── warehouses/                 # Warehouse stock & movements
│   ├── crew/                       # Crew-specific endpoints
│   ├── pos/                        # POS catalog & checkout
│   ├── transactions/               # Transaction history
│   ├── cash-sessions/              # Open/close shift
│   ├── cash-withdrawals/           # Withdrawal with OTP flow
│   ├── purchasing/                 # Purchasing & outlet expenses
│   ├── depot-transfers/            # Inter-branch stock transfer
│   ├── reports/                    # 30+ report generators + helpers
│   ├── erp/                        # ERP dashboard data
│   ├── settings/                   # System settings & feature flags
│   ├── master-data/                # Reference data (units, channels, etc.)
│   ├── audit-logs/                 # Audit trail
│   └── access-control/             # Permission matrix management
└── prisma/
    ├── schema.prisma               # Full DB schema (30+ models)
    ├── migrations/                 # Timestamped migrations
    └── seed.js                     # Dev seed data
```

Each module follows: `*.routes.js` → `*.controller.js` → `*.service.js`

Controllers catch errors and forward to the global `errorHandler`. Services throw with optional `statusCode` for HTTP error mapping.

### Middleware chain

All secure routes run through:
1. `requireAuth` — JWT verification, sets `req.user`
2. `resolveBranchContext` — resolves user's active branch (global roles see all, crew see assigned)
3. `requirePermission(...)` / `requireRole(...)` — optional per-route RBAC gate

### Backend — Data layer

- **Prisma 6** with `output = "../generated/prisma"` (client generated outside node_modules)
- PostgreSQL with enums for status/type fields (no boolean flags where state machines exist)
- Composite unique constraints used extensively (e.g., `@@unique([branchId, inventoryItemId])`)
- `@@index` on common query patterns (date ranges, status filters, foreign keys)
- Inventory costing via `ItemPurchaseLot` + `InventoryCostHistory` tables (FIFO-like tracking)
- Cash withdrawal flow uses OTP with bcrypt hash+salt stored on the record

### Frontend — Feature-based React

```
frontend/src/
├── main.jsx                        # Vite entry point
├── App.jsx                         # Router setup, all routes defined here
├── index.css                       # Tailwind v4 entry + theme variables
├── core/
│   ├── api/api.js                  # Axios instance (base URL, interceptors for token + auto-logout on 401)
│   ├── auth/session.js             # localStorage session management (token, user, access)
│   └── components/                 # ProtectedRoute, ThemeToggle
├── components/ui/                  # Shared UI kit (Button, Card, Input, Modal, Badge, StatCard, SectionHeader, EmptyState)
│
├── features/
│   ├── auth/pages/LoginPage.jsx
│   ├── crew/                       # Crew App pages & services
│   │   ├── components/CrewShell.jsx
│   │   ├── pages/                  # Sales, POS, Attendance, Stock Opname, Withdrawals, Approvals, Performance
│   │   └── services/               # posApi, cashSessionApi, cashWithdrawalApi, crewApi, depotTransferApi
│   └── dashboard/                  # ERP Dashboard pages & services
│       ├── components/
│       │   ├── ErpShell.jsx        # ERP sidebar layout with permission-filtered nav
│       │   ├── table/ManagementTable.jsx  # Generic CRUD table
│       │   └── report/             # ReportTable, ReportFiltersBar, ReportMetricGrid, ReportPagination, reportExport (Excel/PDF)
│       ├── pages/                  # ~20 ERP pages
│       ├── services/               # One API service per module
│       ├── erpNavigation.config.js # Sidebar nav tree (groups + items with permission keys)
│       ├── reportCatalog.js        # Report registry (groups + report definitions)
│       ├── reportViewConfig.js     # Dynamic report column/formatter config
│       └── utils/reportFormatters.js # Currency, date, cell format helpers
```

### Routing — Frontend

Routes are defined in `App.jsx`:
- **Public**: `/login`
- **ERP** (`/erp/*`): Gated by `allowedPermissions` (read-access checks)
- **Crew** (`/crew/*`): Gated by `allowedRoles={["CREW"]}`
- Placeholder routes for future pages render `ErpFeaturePage` with description + ideas

### RBAC Model

- Roles (`Role` table), permissions (`Permission` table), and `RolePermission` junction table
- **Default roles**: SUPERADMIN, ADMIN, PURCHASING, OWNER, CREW (from seed + accessControlCatalog)
- `syncDefaultAccessCatalog()` runs on server start (via `server.js`) — upserts modules, permissions, roles, and ensures default permissions exist
- `resetRolePermissions: false` by default (existing custom permissions preserved)
- Frontend shows/hides sidebar nav items based on `getStoredAccess().permissions`

### Branch Context

- ERP roles (SUPERADMIN, ADMIN, OWNER, PURCHASING) have `branchScope: "ALL"` — see all branches
- CREW has `branchScope: "SINGLE"` — only their assigned branch via `BranchAssignment` table
- `branchContext.middleware` resolves effective branch per request, stored as `req.branchContext`

## Key Commands

### Backend
```bash
cd backend
npm install            # Install dependencies
cp .env.example .env   # Configure DATABASE_URL and JWT_SECRET
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
node prisma/seed.js     # Seed dev data
npm run dev             # Dev server with nodemon (port 5000)
npm start               # Production start
npm test                # Run tests (node --test)
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev             # Vite dev server (port 5173)
npm run build           # Production build
npm run lint            # ESLint
npm test                # Vitest run
npm run test:watch      # Vitest watch mode
```

### Running a single test
```bash
node --test backend/tests/path/to/test.test.js     # Backend (node --test)
cd frontend && npx vitest run path/to/test.test.js  # Frontend (vitest)
```

## Testing Patterns

- **Backend**: Node.js native test runner (`node --test`), file matching `tests/**/*.test.js`
- **Frontend**: Vitest, files matching `*.test.js` alongside source
- Test files live in the same directory as the module they test (e.g., `reportFormatters.test.js` next to `reportFormatters.js`)

## Key Data Models

- **User** → Branch (home base), Role (RBAC), BranchAssignment (active placements)
- **Transaction/TransactionItem** → Branch, CashSession, Product, PaymentMethod/Cash/Split/QRIS
- **CashSession** → per-user-per-branch shift tracking with opening/closing/expected cash
- **CashWithdrawal** → OTP-verified cash takeout from outlet
- **InventoryItem** → BranchInventoryItem (stock per branch), WarehouseStock
- **MenuRecipe/MenuRecipeItem** → product-to-inventory linkage
- **DepotTransfer** → inter-branch or warehouse-to-branch stock movement
- **OutletExpense** → operational purchases with receipt photo and cash impact
- **AuditLog** → immutable action log with JSON metadata

## Report System

30+ dynamic reports driven by `reportCatalog.js` (registry) + `reportGenerators.js` (backend SQL aggregations) + `reportViewConfig.js` (frontend column definitions + renderers). Reports support filters (branch, date range, channel) and export (Excel via xlsx, PDF via jsPDF).

## Environment Variables

See `README.md` for full list. Key ones:
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET`
- `PORT` (default 5000)
- `VITE_API_URL` (frontend API base URL, auto-detected from hostname if omitted)
