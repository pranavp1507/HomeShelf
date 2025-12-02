# Contributing to Mulampuzha Library Management System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## 🤝 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## 🎯 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, Node version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please include:

- **Clear use case** for the feature
- **Why this would be useful** to most users
- **Possible implementation** approach (optional)

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `master`:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes** with clear, descriptive commits
4. **Add tests** for new functionality
5. **Ensure all tests pass**:
   ```bash
   pnpm test:all
   ```
6. **Update documentation** if needed
7. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

## 💻 Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- pnpm 10+
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/mulampuzha-library.git
cd mulampuzha-library

# Install dependencies
cd server && pnpm install
cd ../client && pnpm install

# Setup database
createdb library
cd server && pnpm run migrate up

# Configure environment
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit .env files with your configuration

# Start development servers
cd server && pnpm run dev    # Terminal 1
cd client && pnpm run dev    # Terminal 2
```

## 📝 Coding Guidelines

### TypeScript

- **Use TypeScript** for all new code
- **Define interfaces** for all data structures
- **Avoid `any` type** - use proper typing
- **Use strict mode** - enabled by default

### Code Style

- **2 spaces** for indentation
- **Semicolons** required
- **Single quotes** for strings
- **Trailing commas** in objects/arrays
- Follow **existing patterns** in the codebase

### Testing

- **Write tests** for all new features
- **Unit tests** for services and utilities
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows
- Maintain **100% test pass rate**

Example test structure:

```typescript
describe('BookService', () => {
  describe('createBook', () => {
    it('should create a book successfully', async () => {
      // Arrange
      const bookData = { title: 'Test Book', author: 'Test Author' };

      // Act
      const result = await bookService.createBook(bookData);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Test Book');
    });
  });
});
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(books): add ISBN-13 validation
fix(auth): prevent timing attack on login
docs(readme): update installation instructions
refactor(loans): extract service layer
test(members): add bulk import tests
```

## 🗂️ Project Structure

```
server/
├── src/
│   ├── routes/         # API endpoints
│   ├── services/       # Business logic
│   ├── repositories/   # Database access
│   ├── middleware/     # Express middleware
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   └── config/         # Configuration
├── __tests__/          # Test files
└── migrations/         # Database migrations

client/
├── src/
│   ├── components/     # React components
│   │   ├── ui/         # Reusable UI components
│   │   └── ...         # Feature components
│   ├── test/           # Test utilities
│   └── App.tsx         # Main application
└── e2e/                # Playwright E2E tests
```

## 🧪 Running Tests

```bash
# All tests
pnpm test:all

# Server tests
cd server && pnpm test

# Client tests
cd client && pnpm test

# E2E tests
pnpm test:e2e

# Load tests
cd server && pnpm test:smoke
```

## 📚 Adding New Features

### Backend Feature Checklist

- [ ] Create/update **repository** for data access
- [ ] Create/update **service** for business logic
- [ ] Create/update **route** for API endpoint
- [ ] Add **validation** middleware
- [ ] Add **types** in `types/` directory
- [ ] Write **unit tests** for service
- [ ] Write **integration tests** for route
- [ ] Update **API documentation**

### Frontend Feature Checklist

- [ ] Create **component(s)** in appropriate directory
- [ ] Add **TypeScript types** for props/state
- [ ] Implement **responsive design**
- [ ] Add **loading** and **error states**
- [ ] Ensure **accessibility** (ARIA labels, keyboard nav)
- [ ] Write **unit tests** with Testing Library
- [ ] Add **E2E tests** if user-facing
- [ ] Update **documentation**

## 🐛 Debugging

### Backend

```bash
# Run with debugger
cd server && pnpm run dev

# View logs
docker-compose logs -f server

# Check database
psql -U postgres -d library
```

### Frontend

- Use **React DevTools** browser extension
- Check **Network tab** for API calls
- Use **console.log** strategically
- Check **Redux DevTools** (if using Redux)

## 📖 Documentation

Update documentation when:

- Adding new features
- Changing existing behavior
- Adding configuration options
- Updating dependencies

Documentation files to update:

- `README.md` - High-level overview
- `CLAUDE.md` - Technical details
- `docs/` - Specific guides
- Code comments - Complex logic

## ❓ Questions?

- Open a [Discussion](https://github.com/yourusername/mulampuzha-library/discussions)
- Comment on related issues
- Check existing documentation

## 🎉 Recognition

Contributors will be:

- Listed in release notes
- Mentioned in the README
- Credited in commit history

Thank you for making this project better! 🚀
