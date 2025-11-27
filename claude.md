# Mulampuzha Library Management System - Claude Code Instructions

## Project Overview

This is a **full-stack Library Management System** built with React, Node.js, Express, and PostgreSQL. The application provides comprehensive book, member, and loan management capabilities with authentication, role-based access control, and advanced features like bulk import and category management.

**Status:** Production-ready and fully operational

---

## Technology Stack

### Frontend
- **React 19.2.0** with TypeScript
- **Vite 7.2.2** for build tooling
- **Tailwind CSS v4.1.17** with `@tailwindcss/vite` for styling
- **Framer Motion v11.18.2** for animations
- **Lucide React v0.309.0** for modern icons
- **React Router DOM 7.9.6** for routing
- **Recharts 3.4.1** for data visualization
- **pnpm 10.22.0** as package manager

### Backend
- **Node.js 24** (Alpine)
- **Express.js 5.1.0** for API server
- **PostgreSQL 16** database
- **node-pg-migrate 8.0.3** for migrations
- **bcryptjs 3.0.3** for password hashing
- **jsonwebtoken 9.0.2** for authentication
- **multer 2.0.2** for file uploads
- **node-cron 3.0.3** for scheduled tasks
- **pnpm 10.22.0** as package manager

### Infrastructure
- **Podman/Docker** for containerization
- **Traefik v3.6** as reverse proxy with HTTPS support
- Persistent volumes for data, uploads, and backups

---

## Project Structure

```
E:\Mulampuzha-Library/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/              # All React components
│   │   │   ├── ui/                  # Reusable UI components
│   │   │   │   ├── Button.tsx       # Animated button with variants
│   │   │   │   ├── Card.tsx         # Card container
│   │   │   │   ├── Input.tsx        # Form input field
│   │   │   │   ├── Select.tsx       # Dropdown select
│   │   │   │   ├── Badge.tsx        # Status badges
│   │   │   │   ├── Modal.tsx        # Modal dialog
│   │   │   │   ├── MultiSelect.tsx  # Multi-selection dropdown
│   │   │   │   ├── EmptyState.tsx   # Empty state component
│   │   │   │   ├── ErrorMessage.tsx # Error message component
│   │   │   │   ├── Skeleton.tsx     # Loading skeleton
│   │   │   │   └── index.ts         # Barrel exports
│   │   │   ├── AuthContext.tsx      # Auth state management
│   │   │   ├── Dashboard.tsx        # Main dashboard with stats
│   │   │   ├── BookList.tsx         # Book listing and management
│   │   │   ├── BookForm.tsx         # Book create/edit form
│   │   │   ├── MemberList.tsx       # Member listing
│   │   │   ├── MemberForm.tsx       # Member create/edit form
│   │   │   ├── LoanManager.tsx      # Borrow/return interface
│   │   │   ├── LoanHistory.tsx      # Loan records display
│   │   │   ├── CategoryManagement.tsx # Category CRUD (admin)
│   │   │   ├── UserManagement.tsx   # User CRUD (admin)
│   │   │   ├── BulkImportDialog.tsx # CSV book import interface
│   │   │   ├── MemberBulkImportDialog.tsx # CSV member import
│   │   │   ├── DataExport.tsx       # CSV data export (admin)
│   │   │   ├── Settings.tsx         # Admin settings page
│   │   │   ├── WelcomeWizard.tsx    # User onboarding wizard
│   │   │   ├── FeatureTour.tsx      # Interactive feature tour
│   │   │   ├── ForgotPassword.tsx   # Password reset request
│   │   │   ├── ResetPassword.tsx    # Password reset form
│   │   │   ├── Navbar.tsx           # Navigation component
│   │   │   ├── Login.tsx            # Login form
│   │   │   ├── Setup.tsx            # Initial admin setup
│   │   │   ├── Notification.tsx     # Toast notifications
│   │   │   ├── Pagination.tsx       # Pagination component
│   │   │   ├── OnboardingContext.tsx # Onboarding state
│   │   │   └── *Skeleton.tsx        # Loading skeletons
│   │   ├── App.tsx                  # Main app with routing & state
│   │   ├── main.tsx                 # Entry point
│   │   ├── index.css                # Tailwind CSS v4 config
│   │   └── assets/                  # Static assets
│   ├── Containerfile                # Frontend Docker image
│   ├── vite.config.ts               # Vite configuration
│   ├── package.json                 # Dependencies
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Environment template
│   └── config.ts                    # Configuration reader
│
├── server/                          # Node.js Backend
│   ├── index.js                     # Main Express server (~200 lines)
│   ├── db.js                        # PostgreSQL connection pool
│   ├── authUtils.js                 # Auth middleware & utilities
│   ├── routes/                      # API route modules
│   │   ├── auth.js                  # Authentication routes
│   │   ├── books.js                 # Book management routes
│   │   ├── members.js               # Member management routes
│   │   ├── loans.js                 # Loan management routes
│   │   ├── categories.js            # Category routes
│   │   ├── users.js                 # User management routes
│   │   ├── dashboard.js             # Dashboard statistics
│   │   ├── export.js                # Data export routes (CSV)
│   │   └── system.js                # System information
│   ├── middleware/                  # Middleware modules
│   │   ├── errorHandler.js          # Error handling middleware
│   │   └── validation.js            # Input validation middleware
│   ├── utils/                       # Utility modules
│   │   └── fileUpload.js            # File upload configuration
│   ├── migrations/                  # Database migrations (6 files)
│   ├── uploads/                     # Book cover images storage
│   ├── start.sh                     # Startup script (migrations + server)
│   ├── backup.sh                    # Database backup script
│   ├── Containerfile                # Backend Docker image
│   ├── package.json                 # Dependencies
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Environment template
│   └── README.md                    # API documentation
│
├── traefik/                         # Reverse proxy config
│   ├── acme.json                    # Let's Encrypt certificates
│   └── certs/                       # TLS certificates
│
├── docs/                            # Documentation
│   ├── app_plan.md                  # Development plan
│   ├── app_status.md                # Status report
│   ├── improvement_plan.md          # Future improvements
│   ├── issues_and_gaps.md           # Technical debt & issue analysis
│   ├── ui_modernization_plan.md     # Tailwind CSS migration plan (Phase 4 - COMPLETE)
│   ├── phase_5_implementation_plan.md # UX Polish & Features (Phase 5 - IN PROGRESS)
│   ├── typescript_migration_plan.md # Server TypeScript migration (Phase 5.5 - PLANNED)
│   ├── customization_guide.md       # User customization guide
│   ├── testing_guide.md             # Testing documentation
│   ├── platform_compatibility_analysis.md  # Cross-platform issues
│   ├── troubleshooting_platforms.md # Platform-specific troubleshooting
│   ├── deployment_options.md        # Deployment comparison
│   └── advanced_setup.md            # Traefik setup guide
│
├── compose.yml                      # Docker Compose with Traefik (local.test)
├── compose.dev.yml                  # Simple dev setup (localhost ports)
├── compose.prod.yml                 # Production Docker Compose (Let's Encrypt)
├── Makefile                         # Build and deployment shortcuts
├── README.md                        # Project README
└── claude.md                        # This file - Claude Code instructions
```

---

## Database Schema

### Tables

**books**
- `id` - Primary key
- `title`, `author`, `isbn` - Book information
- `available` - Boolean availability status
- `cover_image_path` - Path to uploaded cover image
- `created_at` - Timestamp

**members**
- `id` - Primary key
- `name`, `email`, `phone` - Member information
- `created_at` - Timestamp

**loans**
- `id` - Primary key
- `book_id` - FK to books (cascade delete)
- `member_id` - FK to members (cascade delete)
- `borrow_date`, `due_date`, `return_date` - Loan tracking
- `created_at` - Timestamp

**users**
- `id` - Primary key
- `username` - Unique username
- `password_hash` - bcrypt hashed password
- `role` - 'admin' or 'member'
- `created_at` - Timestamp

**categories**
- `id` - Primary key
- `name` - Unique category name
- `created_at` - Timestamp

**book_categories** (Junction table)
- `id` - Primary key
- `book_id` - FK to books (cascade delete)
- `category_id` - FK to categories (cascade delete)
- Unique constraint on (book_id, category_id)

---

## API Endpoints

### Authentication
- `GET /api/auth/setup-status` - Check if initial admin setup needed
- `POST /api/auth/register` - Register new user (admin-only after setup)
- `POST /api/auth/login` - Login and get JWT token

### Books
- `GET /api/books` - Get all books (supports search, filter, sort)
- `POST /api/books` - Create book (auth required)
- `PUT /api/books/:id` - Update book (auth required)
- `DELETE /api/books/:id` - Delete book (auth required)
- `POST /api/books/lookup` - Lookup book by ISBN via external APIs
- `POST /api/books/bulk-import` - Bulk import from CSV
- `POST /api/books/:id/cover` - Upload book cover image

### Members
- `GET /api/members` - Get all members (supports sorting)
- `GET /api/members/:id` - Get specific member
- `POST /api/members` - Create member (auth required)
- `PUT /api/members/:id` - Update member (auth required)
- `DELETE /api/members/:id` - Delete member (auth required)

### Loans
- `POST /api/loans/borrow` - Borrow a book (14-day due date)
- `POST /api/loans/return` - Return a book
- `GET /api/loans` - Get loan history

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin-only)
- `PUT /api/categories/:id` - Update category (admin-only)
- `DELETE /api/categories/:id` - Delete category (admin-only)

### Users
- `GET /api/users` - Get all users (admin-only)
- `PUT /api/users/:id` - Update user role (admin-only)
- `DELETE /api/users/:id` - Delete user (admin-only)
- `PUT /api/users/:id/password` - Change user password (admin-only)

### Dashboard
- `GET /api/dashboard` - Get statistics for dashboard

### Export
- `GET /api/export/books` - Export all books to CSV (admin-only, supports date range filtering)
- `GET /api/export/members` - Export all members to CSV (admin-only, supports date range filtering)
- `GET /api/export/loans` - Export all loans to CSV (admin-only, supports date range and status filtering)

### System
- `GET /api/system/info` - Get system information and configuration status (admin-only)

### Static Files
- `/uploads/*` - Serve uploaded book cover images

---

## Key Features

### Core Functionality
- **Book Management**: Full CRUD with search, filter, sort
- **Member Management**: Complete member lifecycle
- **Loan System**: Borrow/return with automatic due dates (14 days)
- **Authentication**: JWT-based with bcrypt password hashing
- **Role-Based Access**: Admin and member roles
- **Dashboard**: Statistics and visualizations
- **Category System**: Multi-category book organization

### Advanced Features
- **CSV Bulk Import**: Upload CSV files to import multiple books and members
- **Data Export**: Export books, members, and loans to CSV with date range filtering (admin-only)
- **Book Cover Images**: Upload and display book covers
- **ISBN Lookup**: Automatic book info from Open Library & Google Books APIs
- **Overdue Tracking**: Cron job checks for overdue loans every minute
- **Admin Settings Page**: View system configuration, branding, email status, and API settings
- **Environment Configuration**: Comprehensive env var support for Docker deployment
- **Dark/Light Theme**: User preference with localStorage persistence
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS v4 and Framer Motion
- **Global Notifications**: Toast notifications for user feedback
- **Animated UI**: Smooth animations and transitions using Framer Motion
- **User Onboarding**: Welcome wizard and feature tour for new users
- **Password Reset**: Complete forgot password and reset flow

### Pagination, Search & UX Enhancements (Phase 2 - Complete!)
- **Pagination**: All lists support pagination (10, 25, 50, 100 items per page)
- **Books**: Search by title/author/ISBN, filter by category and availability
- **Members**: Search by name/email/phone
- **Loans**: Search by book/member, filter by status (active, overdue, returned)
- **Performance**: Efficient database queries with LIMIT/OFFSET
- **Reusable Component**: Single Pagination component used across all lists
- **Loading States**: CircularProgress indicators during data fetching
- **Mobile Responsive**: Tables with horizontal scroll, responsive filters, mobile-optimized forms
- **Dashboard Navigation**: Clickable stat cards navigate to filtered views

---

## Development Setup

### Prerequisites
- Node.js 24+
- pnpm 10.22.0+
- PostgreSQL 16 (or use Docker)
- Docker/Podman (for containerized setup)

### Local Development (with Docker)

1. **Clone the repository** (already done)

2. **Set up environment variables**:
   ```bash
   # Server .env (server/.env)
   GOOGLE_BOOKS_API_KEY=YOUR_API_KEY_HERE
   JWT_SECRET=1ab773f62875b39683177b36ce4bbb18fed5bd539618c53b732c07e2eb941f29
   DATABASE_URL=postgres://user:password@postgres:5432/library

   # Client .env (client/.env)
   VITE_API_URL=https://local.test/api
   ```

3. **Start all services**:
   ```bash
   podman-compose up --build
   # or
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: https://local.test (or http://localhost:3000)
   - Backend API: https://local.test/api (or http://localhost:3001)
   - Traefik Dashboard: http://localhost:8080

5. **Initial Setup**:
   - Navigate to the app
   - Create an admin user on the setup page
   - Login with admin credentials

### Local Development (without Docker)

1. **Install dependencies**:
   ```bash
   cd client && pnpm install
   cd ../server && pnpm install
   ```

2. **Set up PostgreSQL** and create database `library`

3. **Run migrations**:
   ```bash
   cd server
   pnpm run migrate up
   ```

4. **Start backend**:
   ```bash
   cd server
   node index.js
   ```

5. **Start frontend** (in new terminal):
   ```bash
   cd client
   pnpm run dev
   ```

---

## Database Migrations

Located in `server/migrations/`, managed by `node-pg-migrate`.

### Commands
```bash
# Run all pending migrations
pnpm run migrate up

# Rollback last migration
pnpm run migrate down

# Create new migration
pnpm run migrate create migration-name
```

### Migration Files (in order)
1. `20251120093500_create_books_table.js`
2. `20251120093501_create_members_table.js`
3. `20251120093502_create_loans_table.js`
4. `20251120093803_create_users_table.js`
5. `20251120100000_add_cover_image_path_to_books.js`
6. `20251120100500_create_categories_and_book_categories_table.js`

---

## Important Code Locations

### Frontend State Management
- **Global Auth State**: `client/src/components/AuthContext.tsx`
- **Main App State**: `client/src/App.tsx` (books, members, categories, dialogs)
- **Theme State**: `client/src/App.tsx` (localStorage-persisted)

### Backend Core Files
- **Main Server**: `server/index.js` (~200 lines, modular architecture)
- **API Routes**: `server/routes/` (auth, books, members, loans, categories, users, dashboard, export, system)
- **Middleware**: `server/middleware/` (errorHandler, validation)
- **Utilities**: `server/utils/` (fileUpload)
- **Database Connection**: `server/db.js`
- **Auth Utilities**: `server/authUtils.js`

### Critical Components
- **Dashboard**: `client/src/components/Dashboard.tsx`
- **Book Management**: `client/src/components/BookList.tsx`, `BookForm.tsx`, `BulkImportDialog.tsx`
- **Member Management**: `client/src/components/MemberList.tsx`, `MemberForm.tsx`, `MemberBulkImportDialog.tsx`
- **Loan Management**: `client/src/components/LoanManager.tsx`, `LoanHistory.tsx`
- **Admin Features**: `client/src/components/UserManagement.tsx`, `CategoryManagement.tsx`
- **Data Export**: `client/src/components/DataExport.tsx`
- **Settings**: `client/src/components/Settings.tsx`
- **Onboarding**: `client/src/components/WelcomeWizard.tsx`, `FeatureTour.tsx`
- **UI Components**: `client/src/components/ui/` (10 reusable components)

---

## Authentication & Authorization

### JWT Authentication
- **Token Expiry**: 1 hour
- **Storage**: localStorage (key: 'token')
- **Header**: `Authorization: Bearer <token>`

### Roles
- **admin**: Full access to all features
- **member**: Limited access (no user management, category management)

### Protected Routes (Frontend)
- Dashboard, Book Management, Member Management, Loan Management require auth
- User Management, Category Management require admin role

### Protected Endpoints (Backend)
- Most POST/PUT/DELETE endpoints require authentication
- Admin-only endpoints protected by `checkAdmin` middleware

---

## Common Development Tasks

### Adding a New Book
1. Use the "Add Book" button on Books page
2. Fill in title, author, ISBN (optional)
3. Optionally lookup book info by ISBN
4. Upload cover image
5. Select categories
6. Submit form

### Importing Books via CSV
1. Click "Bulk Import" on Books page
2. Download template if needed
3. Upload CSV file with columns: title, author, isbn, coverImageUrl, categories
4. System validates and imports, skipping duplicates

### Creating a New User (Admin)
1. Navigate to User Management (admin-only)
2. Click "Add User"
3. Enter username, password, select role
4. System hashes password and stores user

### Managing Loans
1. Go to Loan Manager
2. Select book and member from dropdowns
3. Click "Borrow Book" (sets 14-day due date)
4. To return: select loan and click "Return Book"

### Checking for Overdue Loans
- Backend cron job runs every minute
- Logs warning when overdue loans detected
- Dashboard shows overdue count
- Ready for email notification integration (future)

---

## Configuration & Environment

### Server Environment Variables (`server/.env`)
All server configuration is available via environment variables. See `server/.env.example` for a complete template.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (e.g., `postgres://user:password@host:port/dbname`)
- `JWT_SECRET` - Secret key for JWT tokens (generate with: `openssl rand -hex 32`)

**Optional:**
- `NODE_ENV` - Environment mode (development/production, default: development)
- `PORT` - Server port (default: 3001)
- `GOOGLE_BOOKS_API_KEY` - Google Books API key for ISBN lookup
- `CLIENT_URL` - Client URL for CORS configuration (default: http://localhost:3000)

**Email Configuration (Optional):**
- `ENABLE_EMAIL_NOTIFICATIONS` - Enable email notifications (true/false, default: false)
- `SMTP_HOST` - SMTP server host (e.g., smtp.gmail.com)
- `SMTP_PORT` - SMTP server port (default: 587)
- `SMTP_SECURE` - Use TLS (true/false, default: false)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASSWORD` - SMTP password or app password
- `SMTP_FROM` - From email address

**Overdue Checks:**
- `ENABLE_OVERDUE_CHECKS` - Enable overdue loan checks (true/false, default: true)
- `OVERDUE_CHECK_INTERVAL` - Check interval in minutes (default: 60)

### Client Environment Variables (`client/.env`)
All client configuration uses the `VITE_` prefix. See `client/.env.example` for a template.

**Required:**
- `VITE_API_URL` - Backend API URL (e.g., `http://localhost:3001/api` or `https://your-domain.com/api`)

**Library Branding:**
- `VITE_LIBRARY_NAME` - Library name displayed in the UI (default: "My Library")
- `VITE_LIBRARY_LOGO` - Logo path or URL (default: "/Logo.svg")

### Default Ports
- Frontend dev server: 3000
- Backend API: 3001
- PostgreSQL: 5432
- Traefik dashboard: 8080

---

## Deployment

### Deployment Options

The application provides three Docker Compose configurations for different deployment scenarios:

#### 1. Simple Development Setup (`compose.dev.yml`)
**Recommended for local development and testing.**

```bash
docker-compose -f compose.dev.yml up
# or
podman-compose -f compose.dev.yml up
```

**Features:**
- Direct port exposure (no reverse proxy needed)
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api
- PostgreSQL: localhost:5432
- Hot-reload enabled for development
- Works on all platforms (Windows, Mac, Linux)
- Environment variables with sensible defaults
- Can override with `.env` file or shell environment

#### 2. Local Development with Traefik (`compose.yml`)
**For testing HTTPS and production-like environment locally.**

```bash
# Docker:
docker-compose up --build

# Podman (set socket path first):
export DOCKER_SOCKET=/run/podman/podman.sock
podman-compose up --build
```

**Features:**
- Traefik reverse proxy with HTTPS
- Access at https://local.test
- Self-signed certificates (in `traefik/certs/`)
- Requires local DNS setup (hosts file or dnsmasq)
- Automatically detects Docker or Podman socket
- Comprehensive environment variable configuration
- All features enabled for testing

#### 3. Production Deployment (`compose.prod.yml`)
**For production deployment with Let's Encrypt.**

```bash
docker-compose -f compose.prod.yml up -d
# or
podman-compose -f compose.prod.yml up -d
```

**Features:**
- Let's Encrypt SSL certificates (automatic)
- Automatic certificate renewal via Traefik
- Pre-built container images (no local build)
- Persistent volumes for data durability
- Environment variables for full customization
- Ready for cloud deployment

### Environment Configuration

All deployment options support comprehensive environment variable configuration:

**Via Docker Compose:**
Edit the `environment:` section in the compose file to customize settings.

**Via .env file:**
Create a `.env` file in the project root:
```bash
# Use templates as starting point
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit with your values
nano server/.env
nano client/.env
```

**Via shell environment:**
Export environment variables before running docker-compose:
```bash
export VITE_LIBRARY_NAME="My Awesome Library"
export DATABASE_URL="postgres://user:pass@db:5432/library"
docker-compose -f compose.dev.yml up
```

### Customization Examples

**Change library branding:**
```yaml
# In compose file, update client environment:
environment:
  VITE_LIBRARY_NAME: "City Public Library"
  VITE_LIBRARY_LOGO: "https://example.com/logo.png"
```

**Enable email notifications:**
```yaml
# In compose file, update server environment:
environment:
  ENABLE_EMAIL_NOTIFICATIONS: "true"
  SMTP_HOST: "smtp.gmail.com"
  SMTP_PORT: "587"
  SMTP_USER: "your-email@gmail.com"
  SMTP_PASSWORD: "your-app-password"
  SMTP_FROM: "library@yourdomain.com"
```

**Change database credentials:**
```yaml
# Update both postgres and server services:
postgres:
  environment:
    POSTGRES_USER: myuser
    POSTGRES_PASSWORD: mypassword
    POSTGRES_DB: mylibrary

server:
  environment:
    DATABASE_URL: postgres://myuser:mypassword@postgres:5432/mylibrary
```

### Database Backups
- Script: `server/backup.sh`
- Uses `pg_dump` for full database backup
- Stored in persistent volume `db_backups`
- Can be scheduled via system cron or Kubernetes CronJob

---

## Code Guidelines

### When Adding Features
1. **Frontend**: Create component in `client/src/components/`, add route in `App.tsx`
2. **Backend**: Add endpoint in appropriate route module in `server/routes/`, use transactions for data modifications
3. **Database**: Create migration in `server/migrations/` with `pnpm run migrate create`
4. **Auth**: Use `authenticateToken` middleware for protected endpoints
5. **Admin**: Use `checkAdmin` middleware for admin-only endpoints
6. **Validation**: Use validation middleware from `server/middleware/validation.js` for input validation
7. **Error Handling**: Use `asyncHandler` wrapper for async routes to automatically catch errors

### Component Patterns
- Use functional components with hooks
- Leverage `useAuth()` for authentication state
- Use reusable UI components from `./ui` for consistency
- Leverage Tailwind CSS utility classes for styling
- Use Framer Motion for animations (`motion.*` components)
- Handle errors with try-catch and display via ErrorMessage component
- Show empty states using EmptyState component
- Use Skeleton component for loading states

### API Patterns
- Return JSON responses with consistent structure
- Use HTTP status codes appropriately (200, 201, 400, 401, 404, 500)
- Implement input validation
- Use database transactions for multi-step operations
- Log errors to console

### Security Considerations
- Never store plain text passwords (use bcryptjs)
- Validate and sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Implement CORS properly
- Use HTTPS in production (via Traefik)
- Set appropriate JWT expiry times

---

## Testing & Debugging

### Frontend Debugging
- Use React DevTools browser extension
- Check browser console for errors
- Use Network tab to inspect API calls
- Verify localStorage for token and theme

### Backend Debugging
- Check server logs in terminal/container logs
- Test API endpoints with curl or Postman
- Verify database state with psql or GUI client
- Check JWT token validity at jwt.io

### Common Issues
1. **CORS errors**: Check CORS configuration in `server/index.js`
2. **Auth failures**: Verify JWT_SECRET matches in .env and token validity
3. **Database connection**: Check DATABASE_URL and PostgreSQL status
4. **Upload failures**: Verify `server/uploads/` directory exists with write permissions
5. **Migration errors**: Check migration files and database state

---

## Future Improvements

See detailed documentation in `docs/`:
- **`improvement_plan.md`** - Overall improvement roadmap
- **`issues_and_gaps.md`** - Technical debt and issue analysis with 6 phases
- **`ui_modernization_plan.md`** - Complete Tailwind CSS migration plan (Phase 4)

### Development Phases

**Phase 1: ✅ COMPLETE**
- Configurable library name and logo
- Transaction handling for loans
- Category filter logic fix
- WCAG 2.1 AA accessibility
- Basic testing infrastructure

**Phase 2: ✅ COMPLETE (11/11 tasks complete)**
- ✅ Pagination for all lists (Books, Members, Loans)
- ✅ Backend pagination endpoints with search and filters
- ✅ Reusable Pagination component
- ✅ Member search and filtering UI
- ✅ Loan search and status filtering
- ✅ Dashboard cards clickable with navigation
- ✅ Loading states for all data fetching
- ✅ Mobile responsive design improvements
  - Tables with horizontal scroll on mobile
  - Responsive filter controls
  - Mobile-optimized forms in LoanManager
  - Navbar drawer menu for mobile
  - Responsive Grid layout in Dashboard

**Phase 3: ✅ COMPLETE - Code Quality & Maintainability**
- ✅ Refactored server/index.js into modular architecture
  - 7 route modules (auth, books, members, loans, categories, users, dashboard)
  - 2 middleware modules (error handling + validation)
  - 1 utility module (file uploads)
  - Reduced main file from 1099 lines to ~200 lines
- ✅ Centralized error handling middleware
  - `asyncHandler` for async route error catching
  - Global `errorHandler` with consistent error responses
  - PostgreSQL-specific error handling
  - `notFound` handler for undefined routes
- ✅ Input validation middleware
  - Validation for all input types (books, members, users, categories, loans)
  - XSS prevention with input sanitization
  - Email and ISBN format validation
  - Pagination parameter validation
- ✅ Improved CORS configuration
  - Configurable allowed origins
  - Credentials support
  - Environment-based configuration
- ✅ Comprehensive API documentation
  - Full endpoint documentation in server/README.md
  - Request/response examples
  - Error code reference
  - Security best practices
- ✅ Graceful shutdown handling
  - SIGTERM and SIGINT handlers
  - Database pool cleanup on shutdown

**Phase 4: ✅ COMPLETE - UI Modernization**
- ✅ Migrated Material-UI to Tailwind CSS v4 + Framer Motion
- ✅ Created 10 reusable UI components (Button, Card, Input, Select, Badge, Modal, MultiSelect, EmptyState, ErrorMessage, Skeleton)
- ✅ Modern design with smooth animations using Framer Motion
- ✅ Mobile-first responsive layouts
- ✅ 27% bundle size reduction (988 kB → 726 kB uncompressed, 305 kB → 222 kB gzipped)
- ✅ CSS-based theming with dark mode support
- ✅ All 16 components migrated successfully
- Completion: 100% (3 sprints)

**Phase 5: 🚧 IN PROGRESS - UX Polish & Optional Features (See `docs/phase_5_implementation_plan.md`)**
- **Sprint 10: UX Polish** (In Progress)
  - ✅ Sprint 10.1: Empty State Components (100% complete)
    - Created EmptyState component with animations
    - Implemented in BookList, MemberList, LoanHistory, CategoryManagement, UserManagement
  - ✅ Sprint 10.2: Error Messages & Skeleton Loaders (Components created)
    - Created ErrorMessage component with 3 variants (error, warning, info)
    - Created Skeleton component with shimmer animation
    - Integrated ErrorMessage in UserManagement, CategoryManagement
  - 🔄 Sprint 10.3: Skeleton Loader Integration (Next)
  - Sprint 10.4: Form Validation Improvements
- **Sprint 11: ✅ COMPLETE - Enhanced Features**
  - ✅ Member bulk import with CSV template
  - ✅ Password reset flow (forgot password + email reset)
  - ✅ User onboarding wizard with feature tour
  - ✅ Contextual help system
- **Sprint 12: ✅ COMPLETE - Production Readiness & Configuration**
  - ✅ Data export functionality (Books, Members, Loans to CSV)
  - ✅ Admin Settings page showing system configuration
  - ✅ Environment variable configuration system
  - ✅ Comprehensive .env.example files (client + server)
  - ✅ Updated Docker Compose files with all env vars (compose.yml, compose.dev.yml, compose.prod.yml)
  - ✅ System information API endpoint (/api/system/info)
  - ⏭️ Book reservations (skipped - not needed for family library use case)
  - ⏭️ Email notification framework (deferred to future phase)

**Phase 5.5: PLANNED - TypeScript Migration (See `docs/typescript_migration_plan.md`)**
- Server-side TypeScript migration
- Shared types package
- End-to-end type safety
- Estimated: 2-3 weeks (8 phases)

**Phase 6: PLANNED - Testing & Quality Assurance**
- Client-side unit tests (Jest/Vitest)
- Integration tests (React Testing Library)
- E2E tests (Playwright/Cypress)
- Advanced reporting and analytics
- Data export functionality

---

## Important Notes

### File Upload Handling
- Book covers stored in `server/uploads/`
- Served via `/uploads/*` route
- Volume-mounted in Docker for persistence
- Accepted formats: image files (jpg, png, etc.)

### Cron Jobs
- Overdue check runs every minute (see `server/index.js:912`)
- Currently logs warnings only
- Ready for email integration

### Database Transactions
- Used for loan operations to ensure data consistency
- Used for bulk import to handle failures gracefully
- Pattern: BEGIN → operations → COMMIT/ROLLBACK

### Initial Setup Flow
1. App checks `/api/auth/setup-status` on load
2. If no admin exists, shows Setup page
3. First user created becomes admin
4. Subsequent users require admin authentication

---

## Contact & Documentation

### Planning & Roadmap
- **Full Development Plan**: `docs/app_plan.md`
- **Current Status**: `docs/app_status.md`
- **Improvement Plan**: `docs/improvement_plan.md`
- **Issues & Gaps Analysis**: `docs/issues_and_gaps.md`
- **UI Modernization Plan**: `docs/ui_modernization_plan.md` (Phase 4)

### Setup & Configuration
- **Customization Guide**: `docs/customization_guide.md`
- **Platform Compatibility**: `docs/platform_compatibility_analysis.md`
- **Troubleshooting**: `docs/troubleshooting_platforms.md`
- **Deployment Options**: `docs/deployment_options.md`
- **Advanced Setup**: `docs/advanced_setup.md` (Traefik)

### Testing
- **Testing Guide**: `docs/testing_guide.md`

### Other
- **File Structure**: `filestructure.txt`

---

## Quick Reference

### Start Development Environment

**Simple setup (recommended):**
```bash
docker-compose -f compose.dev.yml up
# Access: http://localhost:3000
```

**With Traefik (HTTPS):**
```bash
# Docker:
docker-compose up --build

# Podman (set socket path first):
export DOCKER_SOCKET=/run/podman/podman.sock
podman-compose up --build

# Access: https://local.test
```

### Run Migrations
```bash
cd server && pnpm run migrate up
```

### Access Application
- **Dev (simple)**: http://localhost:3000 (frontend), http://localhost:3001/api (backend)
- **Dev (Traefik)**: https://local.test
- **Production**: https://your-domain.com
- **Default admin**: (created during initial setup)

### Key Files for Common Tasks
- **Add API endpoint**: Create/edit route in `server/routes/` (e.g., `books.js`)
- **Add React component**: `client/src/components/`
- **Add reusable UI component**: `client/src/components/ui/`
- **Add route**: `client/src/App.tsx`
- **Modify theme/colors**: `client/src/index.css` (Tailwind CSS v4 @theme directive)
- **Database schema change**: Create migration in `server/migrations/`
- **Add middleware**: `server/middleware/`
- **Configure environment**: Edit `.env` files or compose file `environment:` sections

### Common Admin Tasks
- **Export data**: Navigate to Data Export page (admin-only), select type (books/members/loans), set filters, download CSV
- **View system info**: Navigate to Settings page (admin-only), view system status and configuration
- **Change branding**: Update `VITE_LIBRARY_NAME` and `VITE_LIBRARY_LOGO` environment variables, restart containers
- **Enable email**: Set `ENABLE_EMAIL_NOTIFICATIONS=true` and configure SMTP settings in server environment

---

**This application is production-ready and fully functional. All core features are implemented and tested.**
