# Mulampuzha Library Management System

A self-hosted, open-source library management system designed for personal home libraries. Manage your book collection, track loans to family and friends, and organize your reading with an easy-to-use web interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-24-green.svg)
![React](https://img.shields.io/badge/react-19.2-blue.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue.svg)

---

## Features

### Core Functionality
- **Book Management**: Add, edit, delete, and search books with cover images
- **Member Management**: Track family members and friends who borrow books
- **Loan Tracking**: Record when books are borrowed and returned
- **Categories**: Organize books with multiple categories
- **ISBN Lookup**: Automatically fetch book information from Open Library and Google Books
- **Bulk Import**: Import multiple books from CSV files
- **Dashboard**: View statistics and overdue loans at a glance

### User Experience
- **Dark/Light Mode**: Choose your preferred theme
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Material Design**: Clean, modern UI with Material-UI components
- **Authentication**: Secure login with role-based access (admin/member)

### Technical Features
- **Self-Hosted**: Run on your own hardware, full control of your data
- **Docker Support**: Easy deployment with Docker Compose
- **PostgreSQL Database**: Reliable, robust data storage
- **RESTful API**: Well-structured backend API
- **Modern Stack**: React 19, Node.js 24, Express 5, TypeScript

---

## Screenshots

_Coming soon_

---

## Quick Start

### Prerequisites

- **Docker** or **Podman** with compose support (recommended) OR
- **Node.js 24+** and **PostgreSQL 16+** for manual installation
- **pnpm 10.22.0+** (if running without containers)

### Installation with Docker/Podman (Recommended)

**This is the simplest way to get started. Works on Windows, Mac, and Linux.**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mulampuzha-library.git
   cd mulampuzha-library
   ```

2. **Start the application**
   ```bash
   # Using Docker
   docker-compose -f compose.dev.yml up --build

   # OR using Podman
   podman-compose -f compose.dev.yml up --build

   # OR using Make (if available)
   make dev-build
   ```

3. **Access the application**
   - Frontend: **http://localhost:3000**
   - Backend API: **http://localhost:3001/api**
   - On first launch, create an admin account
   - Start adding books to your library!

**That's it!** No need to modify hosts file, generate certificates, or configure Traefik.

### Optional: Customize Library Name and Logo

1. **Edit `client/.env`** (or copy from `client/.env.example`):
   ```env
   VITE_LIBRARY_NAME=My Personal Library
   VITE_LIBRARY_LOGO=/Logo.svg
   ```

2. **Replace the logo** (optional):
   - Add your logo to `client/public/`
   - Update `VITE_LIBRARY_LOGO` to match your filename

3. **Restart the containers** for changes to take effect

See [Customization Guide](docs/customization_guide.md) for detailed instructions.

### Advanced Setup with HTTPS and Traefik

If you want a production-like local environment with HTTPS:

1. See [Advanced Setup Guide](docs/advanced_setup.md)
2. Requires Docker or Podman socket configuration
3. Requires generating SSL certificates
4. Requires modifying your hosts file

**Note:** This is only needed for advanced testing. For normal development, use the simple setup above.

### Installation without Containers

If you prefer to run without Docker/Podman:

1. **Prerequisites:**
   - PostgreSQL 16
   - Node.js 24
   - pnpm 10.22.0

2. **Setup Database:**
   ```bash
   createdb library
   ```

3. **Install and configure:**
   ```bash
   # Install dependencies
   cd server && pnpm install
   cd ../client && pnpm install

   # Configure (edit .env files)
   cd server
   cp .env.example .env  # Edit with your settings

   cd ../client
   cp .env.example .env  # Edit with your settings

   # Run migrations
   cd server
   pnpm run migrate up
   ```

4. **Run (requires 2 terminals):**
   ```bash
   # Terminal 1 - Backend
   cd server
   node index.js

   # Terminal 2 - Frontend
   cd client
   pnpm run dev
   ```

5. **Access at http://localhost:3000**

---

## Configuration

### Library Name and Logo

You can now easily customize the library name and logo through environment variables!

1. **Edit `client/.env`** (or copy from `client/.env.example`):
   ```env
   VITE_LIBRARY_NAME=My Library
   VITE_LIBRARY_LOGO=/Logo.svg
   ```

2. **Replace the logo**:
   - Add your logo file to `client/public/`
   - Update `VITE_LIBRARY_LOGO` to match your filename

3. **Restart the application** for changes to take effect

For detailed instructions, see the [Customization Guide](docs/customization_guide.md).

### Google Books API (Optional)

To enable automatic book lookup by ISBN:
1. Get a free API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the "Books API"
3. Add the key to `server/.env` as `GOOGLE_BOOKS_API_KEY`

### Email Notifications (Optional)

Email notifications for overdue books are not yet implemented but planned. See the [improvement plan](docs/improvement_plan.md) for details.

---

## Usage Guide

### First Time Setup

1. **Create Admin Account**: On first launch, you'll be prompted to create an admin user
2. **Add Categories**: Go to Categories (admin only) and add book categories (Fiction, Non-Fiction, etc.)
3. **Add Books**: Use the Books page to add your collection
   - Enter manually or use ISBN lookup
   - Upload cover images
   - Assign categories
4. **Add Members**: Add family members or friends who will borrow books

### Daily Operations

**Adding a New Book:**
1. Click "Add New Book" on the Books page
2. Enter ISBN and click "Lookup" to auto-fill details (optional)
3. Fill in title, author, and other information
4. Upload a cover image (optional)
5. Select categories
6. Click "Add Book"

**Lending a Book:**
1. Go to "Loan Manager"
2. Select the book and member
3. Click "Borrow Book"
4. Due date is automatically set to 14 days

**Returning a Book:**
1. Go to "Loan Manager"
2. Select the book
3. Click "Return Book"

**Importing Multiple Books:**
1. Click "Bulk Import" on the Books page
2. Download the CSV template
3. Fill in book details (title, author, ISBN, categories, cover URL)
4. Upload the completed CSV file

### User Roles

- **Admin**: Full access to all features including user management and categories
- **Member**: Can view books and members, manage loans (if given permission)

---

## Architecture

### Technology Stack

**Frontend:**
- React 19.2.0 with TypeScript
- Material-UI v7 for components
- Vite for build tooling
- React Router for navigation
- Recharts for data visualization

**Backend:**
- Node.js 24 (Alpine)
- Express.js 5.1.0
- PostgreSQL 16
- JWT authentication with bcryptjs
- Multer for file uploads
- node-cron for scheduled tasks

**Infrastructure:**
- Docker & Docker Compose
- Traefik reverse proxy (for HTTPS)
- Persistent volumes for data

### Project Structure

```
mulampuzha-library/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main application
│   │   └── theme.ts       # MUI theme
│   ├── public/            # Static assets
│   └── Containerfile      # Frontend Docker image
├── server/                # Node.js backend
│   ├── index.js          # Main server file
│   ├── db.js             # Database connection
│   ├── authUtils.js      # Authentication utilities
│   ├── migrations/       # Database migrations
│   └── uploads/          # Book cover uploads
├── docs/                 # Documentation
├── compose.yml           # Docker Compose (dev)
└── compose.prod.yml      # Docker Compose (production)
```

---

## Database Schema

The system uses PostgreSQL with the following main tables:

- **books**: Book metadata (title, author, ISBN, cover image)
- **members**: Library members who can borrow books
- **loans**: Borrowing records with dates
- **users**: Authentication and user accounts
- **categories**: Book categories/genres
- **book_categories**: Many-to-many relationship between books and categories

See [claude.md](claude.md) for detailed schema information.

---

## API Documentation

The backend exposes a RESTful API. Key endpoints:

### Authentication
- `POST /api/auth/register` - Register new user (admin only after initial setup)
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/setup-status` - Check if initial setup is needed

### Books
- `GET /api/books` - Get all books (with search, filter, sort)
- `POST /api/books` - Create a new book
- `PUT /api/books/:id` - Update a book
- `DELETE /api/books/:id` - Delete a book
- `POST /api/books/lookup` - Lookup book by ISBN
- `POST /api/books/bulk-import` - Import books from CSV
- `POST /api/books/:id/cover` - Upload book cover

### Members
- `GET /api/members` - Get all members
- `POST /api/members` - Create a member
- `PUT /api/members/:id` - Update a member
- `DELETE /api/members/:id` - Delete a member

### Loans
- `POST /api/loans/borrow` - Borrow a book
- `POST /api/loans/return` - Return a book
- `GET /api/loans` - Get loan history

See [claude.md](claude.md) for complete API reference.

---

## Development

### Running Tests

_Tests are not yet implemented. See [issues and gaps](docs/issues_and_gaps.md) for details._

### Contributing

Contributions are welcome! Please see our [contribution guidelines](CONTRIBUTING.md) (coming soon).

**Priority areas for contribution:**
1. Making library name and logo configurable
2. Improving responsive design and accessibility
3. Adding tests
4. Code refactoring and modularity
5. Documentation improvements

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Frontend: Follow React and TypeScript best practices
- Backend: Use ESLint configuration (to be added)
- Commits: Use conventional commit messages

---

## Deployment

### Production Deployment

For production deployment on a server:

1. **Set up a server** (Linux VPS recommended)
2. **Install Docker and Docker Compose**
3. **Clone the repository**
4. **Configure production environment variables**
   - Set strong JWT_SECRET
   - Configure database credentials
   - Set up SSL certificates (Let's Encrypt via Traefik)
5. **Run with production compose file**
   ```bash
   docker-compose -f compose.prod.yml up -d
   ```

### Backup and Restore

**Backup:**
```bash
# Using the included backup script
docker exec mulampuzha-library-server /bin/sh /app/backup.sh

# Or manually
docker exec mulampuzha-library-postgres pg_dump -U user library > backup.sql
```

**Restore:**
```bash
docker exec -i mulampuzha-library-postgres psql -U user library < backup.sql
```

### Security Considerations for Production

- Change default JWT_SECRET to a strong random value
- Use HTTPS (Traefik handles this automatically)
- Keep Docker images updated
- Regular backups
- Consider restricting access to local network only
- Review [security recommendations](docs/issues_and_gaps.md#4-security-vulnerabilities)

---

## Troubleshooting

### Common Issues

**Database connection failed:**
- Verify PostgreSQL is running: `docker ps`
- Check DATABASE_URL in server/.env
- Wait 10 seconds after starting for migrations to complete

**Can't access the application:**
- Check if all containers are running: `docker-compose ps`
- Verify ports 3000 and 3001 are not in use by other applications
- Check firewall settings

**Cover images not displaying:**
- Ensure `server/uploads/` directory has write permissions
- Check that the path in database matches the file location
- Verify images are in supported formats (JPG, PNG, GIF)

**ISBN lookup not working:**
- Verify GOOGLE_BOOKS_API_KEY is set (optional)
- Check internet connection
- Try a different ISBN (some books may not be in the databases)

### Getting Help

- Check [existing issues](https://github.com/yourusername/mulampuzha-library/issues)
- Read [issues and gaps documentation](docs/issues_and_gaps.md)
- Open a new issue with detailed information about your problem

---

## Roadmap

See [improvement_plan.md](docs/improvement_plan.md), [issues_and_gaps.md](docs/issues_and_gaps.md), and [ui_modernization_plan.md](docs/ui_modernization_plan.md) for detailed plans.

### Current Development Phase

**Phase 1: ✅ COMPLETE**
- ✅ Configurable library name and logo
- ✅ Fixed transaction handling for loans
- ✅ Fixed category filter logic
- ✅ Improved Material UI theming with WCAG 2.1 AA accessibility
- ✅ Basic testing infrastructure

**Phase 2: IN PROGRESS**
- [ ] Ensure responsive design works on all devices
- [ ] Add pagination to all lists
- [ ] Member search and filtering
- [ ] Loading states and feedback
- [ ] Fix dashboard navigation

### Planned Features

**Phase 3: Code Quality & Maintainability**
- [ ] Refactor server/index.js into modules
- [ ] Implement proper error handling
- [ ] Add comprehensive tests
- [ ] Fix CORS configuration
- [ ] Improve accessibility (ARIA labels, keyboard navigation)

**Phase 4: UI Modernization** (See [UI Modernization Plan](docs/ui_modernization_plan.md))
- [ ] Migrate from Material-UI to Tailwind CSS
- [ ] Implement Framer Motion animations
- [ ] Modern, sleek design with smooth transitions
- [ ] Mobile-first responsive layouts
- [ ] 30%+ bundle size reduction

**Phase 5: Optional Features & Polish**
- [ ] Book reservation system
- [ ] Email notifications for overdue books
- [ ] Bulk import for members
- [ ] Password reset functionality
- [ ] Empty states and better UX

**Future Possibilities (Phase 6):**
- [ ] Data export functionality (CSV, PDF)
- [ ] Advanced reporting
- [ ] API documentation
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Reading statistics and insights

---

## Known Issues

See [issues_and_gaps.md](docs/issues_and_gaps.md) for a comprehensive list of known issues and limitations.

**Critical:**
- Library name and logo are hardcoded
- Missing database transactions in loan operations
- No comprehensive tests

**Important:**
- Category filter uses AND logic instead of OR
- Dashboard navigation doesn't filter loan history correctly
- No pagination (performance issues with 1000+ books)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [React](https://react.dev/), [Express](https://expressjs.com/), and [PostgreSQL](https://www.postgresql.org/)
- UI components from [Material-UI](https://mui.com/)
- Book data from [Open Library](https://openlibrary.org/) and [Google Books](https://books.google.com/)
- Icons from [Material Icons](https://fonts.google.com/icons)

---

## Support

If you find this project useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🔀 Contributing code
- 📖 Improving documentation

---

## Author

Created with ❤️ for home library enthusiasts

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) (coming soon) for version history.

---

**Happy Reading! 📚**
