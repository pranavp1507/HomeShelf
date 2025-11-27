# Server API Documentation

## Architecture Overview

The server has been refactored into a modular architecture for better maintainability, scalability, and code organization.

### Directory Structure

```
server/
├── index.js                 # Main entry point with server configuration
├── db.js                    # Database connection pool
├── authUtils.js             # Authentication utilities (JWT, bcrypt)
├── middleware/              # Reusable middleware
│   ├── errorHandler.js     # Centralized error handling
│   └── validation.js       # Input validation middleware
├── routes/                  # API route modules
│   ├── auth.js             # Authentication routes
│   ├── books.js            # Book management routes
│   ├── members.js          # Member management routes
│   ├── loans.js            # Loan management routes
│   ├── categories.js       # Category management routes
│   ├── users.js            # User management routes
│   └── dashboard.js        # Dashboard statistics routes
├── utils/                   # Utility modules
│   └── upload.js           # File upload configuration (multer)
└── uploads/                 # Uploaded files storage
```

## API Endpoints

### Base URL
- Development: `http://localhost:3001/api`
- Production: `https://your-domain.com/api`

### Authentication

#### POST /auth/register
Register a new user (protected after initial setup).

**Request Body:**
```json
{
  "username": "string (min 3 chars)",
  "password": "string (min 6 chars)",
  "role": "admin | member"
}
```

**Response:** `201 Created`
```json
{
  "message": "User and member registered successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "role": "member"
  }
}
```

#### POST /auth/login
Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:** `200 OK`
```json
{
  "message": "Logged in successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "johndoe",
    "role": "member"
  }
}
```

#### GET /auth/setup-status
Check if initial admin setup is needed.

**Response:** `200 OK`
```json
{
  "isSetupNeeded": false
}
```

---

### Books

#### GET /books
Get all books with pagination, search, and filters.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 25, max: 1000)
- `search` (string) - Search in title, author, or ISBN
- `availableStatus` (boolean) - Filter by availability
- `categoryIds` (comma-separated IDs) - Filter by categories
- `sortBy` (string: title|author|isbn|available|id)
- `sortOrder` (string: asc|desc)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "title": "Book Title",
      "author": "Author Name",
      "isbn": "1234567890",
      "available": true,
      "cover_image_path": "/uploads/cover.jpg",
      "categories": [
        {"id": 1, "name": "Fiction"}
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "totalCount": 100,
    "totalPages": 4
  }
}
```

#### POST /books
Create a new book (requires authentication).

**Request Body:**
```json
{
  "title": "string (required)",
  "author": "string (required)",
  "isbn": "string (optional, ISBN-10 or ISBN-13)",
  "categoryIds": [1, 2]
}
```

**Response:** `201 Created`

#### PUT /books/:id
Update a book (requires authentication).

#### DELETE /books/:id
Delete a book (requires authentication).

**Response:** `204 No Content`

#### POST /books/lookup
Lookup book information by ISBN from Open Library and Google Books.

**Request Body:**
```json
{
  "isbn": "9780134685991"
}
```

**Response:** `200 OK`
```json
{
  "title": "Effective Java",
  "author": "Joshua Bloch",
  "coverUrl": "https://..."
}
```

#### POST /books/bulk-import
Bulk import books from CSV file (requires authentication).

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (CSV file)
- CSV columns: title, author, isbn, cover_image_path (optional)

**Response:** `200 OK` or `207 Multi-Status`
```json
{
  "message": "10 books imported, 2 issues.",
  "importedBooks": [...],
  "errors": [...]
}
```

#### POST /books/:id/cover
Upload a cover image for a book (requires authentication).

**Request:**
- Content-Type: `multipart/form-data`
- Field: `cover` (image file: jpg, png, gif, max 5MB)

---

### Members

#### GET /members
Get all members with pagination and search.

**Query Parameters:**
- `page`, `limit`, `search`, `sortBy`, `sortOrder`

#### GET /members/:id
Get a specific member by ID.

#### POST /members
Create a new member (requires authentication).

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "phone": "string (optional)"
}
```

#### PUT /members/:id
Update a member (requires authentication).

#### DELETE /members/:id
Delete a member (requires authentication).

---

### Loans

#### POST /loans/borrow
Borrow a book (requires authentication).

**Request Body:**
```json
{
  "book_id": 1,
  "member_id": 2
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "book_id": 1,
  "member_id": 2,
  "borrow_date": "2025-11-25T08:00:00Z",
  "due_date": "2025-12-09T08:00:00Z",
  "return_date": null
}
```

#### POST /loans/return
Return a borrowed book (requires authentication).

**Request Body:**
```json
{
  "book_id": 1
}
```

#### GET /loans
Get loan history with pagination and filters.

**Query Parameters:**
- `page`, `limit`, `search`
- `status` (string: active|returned|overdue)

---

### Categories

#### GET /categories
Get all categories.

#### POST /categories
Create a category (admin-only).

#### PUT /categories/:id
Update a category (admin-only).

#### DELETE /categories/:id
Delete a category (admin-only).

---

### Users

#### GET /users
Get all users (admin-only).

#### PUT /users/:id
Update a user's role (admin-only).

#### DELETE /users/:id
Delete a user (admin-only).

#### PUT /users/:id/password
Change a user's password (admin-only).

---

### Dashboard

#### GET /dashboard
Get dashboard statistics.

**Response:** `200 OK`
```json
{
  "total_books": 150,
  "total_members": 50,
  "active_loans": 25,
  "overdue_loans": 3
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### HTTP Status Codes

- `200 OK` - Successful GET/PUT request
- `201 Created` - Successful POST request
- `204 No Content` - Successful DELETE request
- `400 Bad Request` - Invalid input or validation error
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource or constraint violation
- `500 Internal Server Error` - Server error

---

## Middleware

### Authentication Middleware
- `authenticateToken` - Validates JWT token in Authorization header
- `checkAdmin` - Ensures user has admin role
- `protectRegisterEndpoint` - Protects register endpoint after initial setup

### Validation Middleware
- `validateBook` - Validates book creation/update
- `validateMember` - Validates member creation/update
- `validateUser` - Validates user creation/update
- `validateCategory` - Validates category creation/update
- `validateLoan` - Validates loan operations
- `validatePagination` - Validates pagination parameters

### Error Handling Middleware
- `asyncHandler` - Wraps async route handlers to catch errors
- `errorHandler` - Global error handler
- `notFound` - 404 handler for undefined routes

---

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgres://user:password@localhost:5432/library

# Authentication
JWT_SECRET=your_jwt_secret_here

# External APIs
GOOGLE_BOOKS_API_KEY=your_google_books_api_key

# Client
CLIENT_URL=http://localhost:3000
```

---

## CORS Configuration

The server implements CORS with the following allowed origins:
- `http://localhost:3000` (React dev server)
- `http://localhost:5173` (Vite dev server)
- `https://local.test` (Local development with SSL)
- Custom origin from `CLIENT_URL` environment variable

---

## Scheduled Tasks

### Overdue Loan Checker
Runs every minute via node-cron to check for overdue loans.

**Location:** `index.js`
**Schedule:** `* * * * *` (every minute)
**Action:** Logs overdue loans to console (ready for email integration)

---

## Testing

To start the server:

```bash
cd server
node index.js
```

For development with auto-reload:

```bash
pnpm run dev  # If you have nodemon configured
```

---

## Security Best Practices

1. **Input Validation**: All user inputs are validated and sanitized
2. **SQL Injection Prevention**: All queries use parameterized statements
3. **Password Security**: Passwords hashed with bcrypt (10 salt rounds)
4. **JWT Security**: Tokens expire after 1 hour
5. **CORS**: Restricted to allowed origins
6. **Error Handling**: Sensitive information not exposed in error messages
7. **File Upload**: File type and size restrictions enforced

---

## Migration from Monolithic Structure

The old `index.js` (1099 lines) has been refactored into:
- **7 route modules** (~150 lines each)
- **2 middleware modules** (error handling + validation)
- **1 utility module** (file uploads)
- **1 main file** (~200 lines)

**Benefits:**
- Better code organization and separation of concerns
- Easier to test individual modules
- Simplified maintenance and debugging
- Consistent error handling across all endpoints
- Reusable validation logic
- Improved CORS configuration
- Graceful shutdown handling
