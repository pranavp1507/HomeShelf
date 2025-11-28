# Mulampuzha Library Management System

**Full-stack Library Management System** - React + TypeScript, Node.js + TypeScript, Express, PostgreSQL

**Status:** Production-ready with comprehensive testing

---

## Technology Stack

### Frontend
- **React 19.2.0** + TypeScript, **Vite 7.2.2**
- **Tailwind CSS v4.1.17** for styling, **Framer Motion v11.18.2** for animations
- **Vitest 4.0.14** + **React Testing Library 16.3.0** (113 unit tests)
- **Playwright 1.57.0** (47 E2E tests across 4 suites)
- **pnpm 10.22.0** package manager

### Backend
- **Node.js 24** + **TypeScript 5.9.3**
- **Express.js 5.1.0**, **PostgreSQL 16**
- **Jest 29.7.0** + **Supertest 7.1.4** (125 tests - Phase 1 complete)
- **bcryptjs 3.0.3**, **jsonwebtoken 9.0.2**, **multer 2.0.2**
- **node-pg-migrate 8.0.3** for migrations
- **pnpm 10.22.0** package manager

### Infrastructure
- **Docker/Podman** containers
- **Traefik v3.6** reverse proxy with HTTPS
- Persistent volumes for data, uploads, backups

---

## Project Structure (Simplified)

```
E:\Mulampuzha-Library/
├── client/                    # React Frontend (TypeScript)
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ui/            # 10 reusable UI components + 113 tests
│   │   │   ├── Dashboard.tsx, BookList.tsx, MemberList.tsx, etc.
│   │   │   └── Auth, Forms, Admin components
│   │   ├── test/              # Test setup & utilities
│   │   ├── App.tsx            # Main app with routing
│   │   └── index.css          # Tailwind CSS v4 config
│   ├── vitest.config.ts       # Vitest configuration
│   └── package.json
│
├── server/                    # Node.js Backend (TypeScript)
│   ├── src/
│   │   ├── types/             # TypeScript type definitions (7 files)
│   │   ├── routes/            # API route modules (9 files)
│   │   ├── middleware/        # errorHandler, validation
│   │   ├── utils/             # authUtils, fileUpload
│   │   ├── config/            # Environment configuration
│   │   ├── db.ts              # PostgreSQL connection pool
│   │   └── index.ts           # Main Express server
│   ├── __tests__/             # 125 tests (Phase 1 complete)
│   │   ├── utils/             # authUtils, fileUpload tests
│   │   ├── middleware/        # errorHandler, validation tests
│   │   ├── fixtures/          # Test data (users, books, members, loans, categories)
│   │   ├── helpers/           # Database helpers
│   │   └── setup.ts           # Global test setup
│   ├── migrations/            # Database migrations (6 files)
│   ├── jest.config.js         # Jest configuration (80% coverage threshold)
│   └── package.json
│
├── e2e/                       # Playwright E2E tests (47 tests)
├── docs/                      # Documentation (12 files)
├── compose.yml                # Docker Compose (Traefik + HTTPS)
├── compose.dev.yml            # Simple dev setup (localhost ports)
└── compose.prod.yml           # Production (Let's Encrypt SSL)
```

---

## Database Schema

**Tables:** books, members, loans, users, categories, book_categories (junction)

**Key Relationships:**
- loans → books (FK, cascade delete)
- loans → members (FK, cascade delete)
- book_categories → books + categories (FK, cascade delete)

**Migrations:** 6 files in `server/migrations/` managed by node-pg-migrate

---

## API Endpoints (9 Route Modules)

### Authentication (`/api/auth`)
- Setup status, register, login, forgot password, reset password

### Books (`/api/books`)
- CRUD, search/filter/sort, ISBN lookup (Google Books/Open Library), bulk CSV import, cover upload

### Members (`/api/members`)
- CRUD, search, bulk CSV import

### Loans (`/api/loans`)
- Borrow (14-day due date), return, history with filters

### Categories (`/api/categories`)
- CRUD (admin-only)

### Users (`/api/users`)
- CRUD, password reset (admin-only)

### Dashboard (`/api/dashboard`)
- Statistics (total books, available, members, active loans, overdue)

### Export (`/api/export`)
- CSV export for books, members, loans with filters (admin-only)

### System (`/api/system`)
- System info and configuration status (admin-only)

---

## Core Features

**Library Management:**
- Books: CRUD, search, filter by category/availability, ISBN lookup, cover images, bulk CSV import
- Members: CRUD, search, bulk CSV import
- Loans: Borrow/return, 14-day due dates, overdue tracking (cron job)
- Categories: Multi-category organization

**Authentication & Security:**
- JWT authentication (1-hour expiry)
- Role-based access (admin/member)
- bcrypt password hashing
- Input validation & XSS sanitization

**Admin Features:**
- User management, category management
- Data export (CSV with date filters)
- System settings & configuration viewer
- Bulk import/export

**UX & Design:**
- Tailwind CSS v4 + Framer Motion animations
- Dark/light theme (localStorage)
- Responsive mobile-first design
- Pagination (10/25/50/100 per page)
- Loading skeletons, empty states, error messages
- User onboarding wizard & feature tour

---

## Testing Coverage

### Client: 160 Tests ✅
- **Unit Tests:** 113 tests (UI components)
  - Button, Card, Input, Select, Badge, Modal, MultiSelect, EmptyState, ErrorMessage, Skeleton
- **E2E Tests:** 47 tests (Playwright, multi-browser)
  - Auth flow, book management, member management, loan operations

### Server: 125 Tests (Phase 1 ✅, Phase 2-3 Pending)
**Phase 1 Complete (125 tests):**
- **Utility Tests:** authUtils (32 tests), fileUpload (22 tests)
- **Middleware Tests:** errorHandler (23 tests), validation (48 tests)

**Phase 2 Pending:** Route integration tests for all 9 API modules
**Phase 3 Pending:** Database integration tests, business logic tests

**Test Commands:**
```bash
# Client
cd client && pnpm test           # Run unit tests
pnpm test:e2e                    # Run E2E tests

# Server
cd server && pnpm test           # Run all tests
pnpm test:coverage               # With coverage report
```

---

## Development Setup

### Quick Start (Docker - Recommended)

```bash
# Simple setup (localhost ports)
docker-compose -f compose.dev.yml up

# Access:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001/api
```

### Environment Variables

**Server (.env):**
- `DATABASE_URL` (required) - PostgreSQL connection
- `JWT_SECRET` (required) - JWT signing key
- `GOOGLE_BOOKS_API_KEY` (optional) - ISBN lookup
- `ENABLE_EMAIL_NOTIFICATIONS`, `SMTP_*` (optional) - Email config
- `ENABLE_OVERDUE_CHECKS`, `OVERDUE_CHECK_INTERVAL` - Cron config

**Client (.env):**
- `VITE_API_URL` (required) - Backend API URL
- `VITE_LIBRARY_NAME`, `VITE_LIBRARY_LOGO` (optional) - Branding

See `.env.example` files for templates.

### Local Development (Without Docker)

```bash
# Install dependencies
cd client && pnpm install
cd ../server && pnpm install

# Setup database (create 'library' database in PostgreSQL)
cd server && pnpm run migrate up

# Start server
cd server && pnpm run dev      # http://localhost:3001

# Start client (new terminal)
cd client && pnpm run dev       # http://localhost:3000
```

---

## Code Guidelines

### Backend (TypeScript)
- **Routes:** Add endpoints in `server/src/routes/`, use `asyncHandler` for async routes
- **Auth:** Use `authenticateToken` middleware, `checkAdmin` for admin-only
- **Validation:** Use validation middleware from `server/src/middleware/validation.ts`
- **Errors:** Throw `AppError` for custom errors, PostgreSQL errors handled automatically
- **Database:** Use transactions for multi-step operations

### Frontend (React + TypeScript)
- **Components:** Functional components with hooks
- **Styling:** Tailwind CSS utility classes
- **UI:** Use components from `./ui` for consistency
- **State:** Use `useAuth()` for authentication state
- **Animations:** Framer Motion (`motion.*` components)
- **Errors:** Display via `ErrorMessage` component
- **Loading:** Use `Skeleton` component for loading states

### Testing
- **Server:** Jest + Supertest for unit/integration tests
- **Client:** Vitest + React Testing Library for unit tests
- **E2E:** Playwright for end-to-end tests

---

## Deployment Options

**3 Docker Compose Configurations:**

1. **`compose.dev.yml`** - Simple development (localhost:3000, localhost:3001)
2. **`compose.yml`** - Local with Traefik HTTPS (https://local.test)
3. **`compose.prod.yml`** - Production with Let's Encrypt SSL

```bash
# Development
docker-compose -f compose.dev.yml up

# Production
docker-compose -f compose.prod.yml up -d
```

**Database Backups:** `server/backup.sh` script, stores in persistent volume

---

## Development Phases

✅ **Phase 1:** Core features, transactions, accessibility
✅ **Phase 2:** Pagination, search, mobile responsiveness
✅ **Phase 3:** Modular architecture, error handling, validation
✅ **Phase 4:** Tailwind CSS migration, UI components (27% bundle reduction)
✅ **Phase 5:** UX polish, bulk import, data export, onboarding
✅ **Phase 5.5:** TypeScript migration (server)
✅ **Phase 6:** Client-side testing (160 tests)
🚧 **Phase 6.5:** Server-side testing (125/target tests - Phase 1 complete)

**Current Focus:** Server-side testing (Phase 2: Route integration tests)

---

## Common Tasks

### Run Tests
```bash
# All tests (client + server)
pnpm test:all

# Client only
cd client && pnpm test

# Server only
cd server && pnpm test

# E2E tests
pnpm test:e2e
```

### Database Migrations
```bash
cd server
pnpm run migrate up              # Run pending migrations
pnpm run migrate down            # Rollback last migration
pnpm run migrate create <name>  # Create new migration
```

### Add API Endpoint
1. Create/edit route in `server/src/routes/`
2. Add types in `server/src/types/`
3. Use validation middleware
4. Write tests in `server/__tests__/routes/`

### Add React Component
1. Create in `client/src/components/`
2. Use UI components from `./ui`
3. Add route in `App.tsx` if needed
4. Write tests in `__tests__/` subdirectory

---

## Important Notes

- **Authentication:** JWT tokens expire in 1 hour, stored in localStorage
- **File Uploads:** Book covers in `server/uploads/`, max 5MB, images only
- **Cron Jobs:** Overdue checking runs every 60 minutes (configurable)
- **Transactions:** Used for loans and bulk imports (BEGIN → COMMIT/ROLLBACK)
- **Security:** All inputs validated/sanitized, passwords bcrypt-hashed, parameterized queries

---

## Documentation

**Planning & Architecture:**
- `docs/app_plan.md` - Development roadmap
- `docs/typescript_migration_plan.md` - TypeScript migration (complete)
- `docs/server_testing_plan.md` - Server testing plan

**Testing:**
- `docs/testing_guide.md` - Comprehensive testing guide

**Deployment:**
- `docs/deployment_options.md` - Deployment comparison
- `docs/customization_guide.md` - Configuration guide

---

## Quick Reference

```bash
# Start development
docker-compose -f compose.dev.yml up

# Run migrations
cd server && pnpm run migrate up

# Run all tests
pnpm test:all

# Type check
cd server && pnpm run type-check
cd client && pnpm run type-check
```

**Default Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Create admin user on first launch

---

**Production-ready application with 285 tests (160 client + 125 server)**
