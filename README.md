# 📚 HomeShelf - Personal Library Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-486%2F486%20passing-brightgreen)](./docs/testing_guide.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)

A modern, full-stack library management system built with **React**, **TypeScript**, **Node.js**, and **PostgreSQL**. Perfect for small to medium-sized libraries, schools, community centers, or personal book collections.

**🎯 Production-Ready** • **✅ 486 Tests Passing** • **🚀 Docker-Ready** • **📖 Well-Documented**

---

## ✨ Features

### 📚 Core Library Management
- **Book Management**: Add, edit, search books with ISBN lookup (Google Books/Open Library API)
- **Member Management**: Track library members with contact information
- **Loan System**: Automated 14-day loan periods with overdue tracking
- **Categories**: Organize books with multi-category support
- **Cover Images**: Upload and display book covers

### 🔐 Security & Authentication
- JWT-based authentication with role-based access (Admin/Member)
- Bcrypt password hashing with timing-attack protection
- Rate limiting (5 req/15min for auth, 100 req/15min for API)
- Helmet security headers with Content Security Policy
- XSS protection with comprehensive input sanitization
- CORS configuration for production security

### 📊 Admin Features
- **Dashboard**: Real-time statistics (books, members, active loans, overdue)
- **User Management**: Create and manage admin/member accounts
- **Data Export**: CSV exports with date filters
- **Bulk Import**: CSV import for books and members
- **System Info**: View configuration and database status

### 🎨 User Experience
- **Responsive Design**: Mobile-first with Tailwind CSS v4
- **Dark/Light Theme**: User preference saved to localStorage
- **Smooth Animations**: Framer Motion for delightful interactions
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Loading States**: Skeletons and loading indicators
- **User Onboarding**: Feature tour for new users

### ⚡ Performance & Quality
- **Database Optimization**: 9 indexes for 10-100x query performance
- **Optimized Queries**: Dashboard uses single query (75% faster)
- **Connection Pool**: Tuned for production workloads
- **Load Tested**: Validated for 100+ concurrent users
- **Error Monitoring**: Sentry integration ready (optional)
- **Request Tracing**: UUID-based request IDs for debugging

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 14+
- **pnpm** 10+ (or npm/yarn)
- **Docker** (optional, recommended)

### Option 1: Docker (Recommended)

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/homeshelf.git
cd homeshelf

# Start with Docker Compose
docker-compose -f compose.dev.yml up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api
\`\`\`

First-time setup will prompt you to create an admin account.

### Option 2: Local Development

\`\`\`bash
# 1. Clone and install dependencies
git clone https://github.com/yourusername/homeshelf.git
cd homeshelf

# Install server dependencies
cd server
pnpm install

# Install client dependencies
cd ../client
pnpm install

# 2. Setup PostgreSQL database
createdb library

# 3. Configure environment variables
cd ../server
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# 4. Run database migrations
pnpm run migrate up

# 5. Start the backend server
pnpm run dev  # Runs on http://localhost:3001

# 6. Start the frontend (new terminal)
cd ../client
pnpm run dev  # Runs on http://localhost:3000
\`\`\`

Visit \`http://localhost:3000\` and create your admin account!

---

## 📖 Documentation

- **[Getting Started Guide](./docs/deployment_options.md)** - Detailed setup instructions
- **[Customization Guide](./docs/customization_guide.md)** - Configure branding, features, and settings
- **[API Documentation](./docs/app_plan.md)** - REST API endpoints reference
- **[Testing Guide](./docs/testing_guide.md)** - Running and writing tests
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to this project
- **[Technical Documentation](./CLAUDE.md)** - Architecture and development details

---

## 🛠️ Technology Stack

### Frontend
- **React 19.0** + TypeScript
- **Vite 7.2** - Lightning-fast build tool
- **Tailwind CSS v4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Vitest** + React Testing Library - Unit testing
- **Playwright** - E2E testing

### Backend
- **Node.js 24** + TypeScript
- **Express 5.1** - Web framework
- **PostgreSQL 16** - Relational database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Jest** + Supertest - Testing

### DevOps
- **Docker** + Docker Compose - Containerization
- **Traefik** - Reverse proxy with HTTPS
- **k6** - Load testing
- **Sentry** - Error monitoring (optional)
- **GitHub Actions** - CI/CD ready

---

## 🧪 Testing

This project has comprehensive test coverage:

\`\`\`bash
# Run all tests
pnpm test:all

# Client tests (160 tests)
cd client && pnpm test

# Server tests (326 tests)
cd server && pnpm test

# E2E tests (47 tests)
pnpm test:e2e

# Load testing
cd server && pnpm test:smoke  # 30-second smoke test
cd server && pnpm test:load   # 16-minute load test
\`\`\`

**Total Coverage**: 486 tests (100% passing) ✅

---

## 🐳 Deployment

### Docker Compose Options

1. **Development** (\`compose.dev.yml\`) - Simple localhost setup, build locally
2. **Local HTTPS** (\`compose.yml\`) - Traefik with self-signed certs, build locally
3. **Production** (\`compose.prod.yml\`) - Let's Encrypt SSL, build locally
4. **GitHub Container Registry** (\`compose.ghcr.yml\`) - Pre-built images, no build needed! ⚡

\`\`\`bash
# Production deployment (build locally)
docker-compose -f compose.prod.yml up -d

# Or use pre-built images from GitHub Container Registry
cp .env.ghcr.example .env
# Edit .env with your configuration
docker-compose -f compose.ghcr.yml up -d
\`\`\`

### 📦 Using Pre-built Docker Images

The easiest way to deploy HomeShelf is using pre-built images from GitHub Container Registry:

\`\`\`bash
# 1. Copy and configure environment file
cp .env.ghcr.example .env
# Edit .env - set JWT_SECRET and database password

# 2. Start the application
docker-compose -f compose.ghcr.yml up -d

# 3. Access at http://localhost:3000
\`\`\`

**Available Images:**
- \`ghcr.io/yourusername/homeshelf-client:latest\` - React frontend
- \`ghcr.io/yourusername/homeshelf-server:latest\` - Node.js backend

Images are automatically built and published via GitHub Actions on every release.

### Environment Variables

Key environment variables to configure:

**Server (.env)**:
\`\`\`bash
DATABASE_URL=postgresql://user:password@localhost:5432/library
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
GOOGLE_BOOKS_API_KEY=optional-for-isbn-lookup
\`\`\`

**Client (.env)**:
\`\`\`bash
VITE_API_URL=http://localhost:3001
VITE_LIBRARY_NAME=Your Library Name
VITE_LIBRARY_LOGO=/logo.png
\`\`\`

See \`.env.example\` files for all options.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Contribution Steps:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Make your changes with tests
4. Run tests (\`pnpm test:all\`)
5. Commit with conventional commits (\`git commit -m 'feat: add amazing feature'\`)
6. Push to your fork (\`git push origin feature/amazing-feature\`)
7. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Icons from [Heroicons](https://heroicons.com/)
- UI inspired by modern library systems

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/homeshelf/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/homeshelf/discussions)
- **Documentation**: [Full Documentation](./CLAUDE.md)

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Book reservations system
- [ ] Fine management for overdue books
- [ ] Email notifications (SMTP configured)
- [ ] Barcode scanner support
- [ ] Multi-language support
- [ ] Analytics dashboard
- [ ] API versioning (v2)

---

**Made with ❤️ for libraries everywhere**
