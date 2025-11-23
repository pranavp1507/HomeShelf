const express = require('express');
require('dotenv').config(); // Load environment variables from .env file
const cors = require('cors'); // Import cors
const db = require('./db'); // Import the new db module
const authUtils = require('./authUtils'); // Import auth utilities
const { schedule } = require('node-cron'); // Import node-cron
const axios = require('axios'); // For making HTTP requests
const fs = require('fs'); // For file system operations
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors()); // Use cors middleware

app.get('/', (req, res) => {
  res.send('Hello from the server!');
});

// New endpoint for book lookup
app.post('/api/books/lookup', authUtils.authenticateToken, async (req, res) => {
  const { isbn } = req.body;
  if (!isbn) {
    return res.status(400).json({ error: 'ISBN is required' });
  }

  try {
    let bookData = {
      title: '',
      author: '',
      coverUrl: '',
    };

    // 1. Try Open Library
    try {
      const openLibraryUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
      const openLibraryResponse = await axios.get(openLibraryUrl);
      const olData = openLibraryResponse.data[`ISBN:${isbn}`];
      
      if (olData) {
        bookData.title = olData.title || '';
        bookData.author = olData.authors ? olData.authors.map(a => a.name).join(', ') : '';
        if (olData.cover && olData.cover.large) {
          bookData.coverUrl = olData.cover.large;
        } else {
            // Construct cover URL manually if not provided directly
            bookData.coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
        }
      }
    } catch (olErr) {
      console.error('Open Library lookup failed:', olErr.message);
      // Don't fail, just proceed to Google Books if available
    }

    // 2. Fallback to Google Books if data is incomplete and key is provided
    const googleApiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if ((!bookData.title || !bookData.coverUrl) && googleApiKey) {
      try {
        const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${googleApiKey}`;
        const googleBooksResponse = await axios.get(googleBooksUrl);
        const gbData = googleBooksResponse.data.items && googleBooksResponse.data.items[0];

        if (gbData) {
          // Fill in missing data from Google Books
          if (!bookData.title) {
            bookData.title = gbData.volumeInfo.title || '';
          }
          if (!bookData.author && gbData.volumeInfo.authors) {
            bookData.author = gbData.volumeInfo.authors.join(', ');
          }
          if (!bookData.coverUrl && gbData.volumeInfo.imageLinks) {
            bookData.coverUrl = gbData.volumeInfo.imageLinks.thumbnail || gbData.volumeInfo.imageLinks.smallThumbnail || '';
          }
        }
      } catch (gbErr) {
        console.error('Google Books lookup failed:', gbErr.message);
      }
    }
    
    // Check if we found any data
    let finalErrorMessage = 'Book not found for the provided ISBN.';
    if (!bookData.title && !bookData.author) {
      if (!process.env.GOOGLE_BOOKS_API_KEY || process.env.GOOGLE_BOOKS_API_KEY === 'YOUR_GOOGLE_BOOKS_API_KEY_HERE') {
        finalErrorMessage = 'Book not found via Open Library. Google Books API key is missing or invalid, so no fallback was attempted.';
      } else {
        finalErrorMessage = 'Book not found via Open Library and Google Books.';
      }
      return res.status(404).json({ error: finalErrorMessage });
    }

    res.json(bookData);

  } catch (err) {
    console.error('Book lookup error:', err.stack);
    res.status(500).json({ error: 'Internal server error during book lookup' });
  }
});


// API endpoints for books
app.get('/api/books', async (req, res) => {
  try {
    const { search, availableStatus, categoryIds, sortBy, sortOrder } = req.query;
    let query = `
      SELECT
        b.*,
        COALESCE(json_agg(json_build_object('id', c.id, 'name', c.name) ORDER BY c.name) FILTER (WHERE c.id IS NOT NULL), '[]') AS categories
      FROM books b
      LEFT JOIN book_categories bc ON b.id = bc.book_id
      LEFT JOIN categories c ON bc.category_id = c.id
    `;
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(LOWER(b.title) LIKE $${paramIndex} OR LOWER(b.author) LIKE $${paramIndex} OR LOWER(b.isbn) LIKE $${paramIndex})`);
      params.push(`%${String(search).toLowerCase()}%`);
      paramIndex++;
    }

    if (availableStatus !== undefined) {
      const isAvailable = availableStatus === 'true';
      conditions.push(`b.available = $${paramIndex}`);
      params.push(isAvailable);
      paramIndex++;
    }

    if (categoryIds) {
      const ids = String(categoryIds).split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        // Filter by categories using a subquery that ensures all selected categories are present
        conditions.push(`b.id IN (
          SELECT bc_filter.book_id
          FROM book_categories bc_filter
          WHERE bc_filter.category_id = ANY($${paramIndex}::int[])
          GROUP BY bc_filter.book_id
          HAVING COUNT(DISTINCT bc_filter.category_id) = $${paramIndex + 1}
        )`);
        params.push(ids);
        params.push(ids.length);
        paramIndex += 2;
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' GROUP BY b.id';

    const validSortColumns = ['title', 'author', 'isbn', 'available', 'id'];
    const finalSortBy = validSortColumns.includes(String(sortBy).toLowerCase()) ? String(sortBy) : 'id';
    const finalSortOrder = String(sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    query += ` ORDER BY b.${finalSortBy} ${finalSortOrder}`;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to check if the initial admin setup has been completed
app.get('/api/auth/setup-status', async (req, res) => {
  try {
    const { rows } = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    const adminCount = parseInt(rows[0].count, 10);
    res.json({ isSetupNeeded: adminCount === 0 });
  } catch (err) {
    console.error('Error checking setup status:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', authUtils.protectRegisterEndpoint, async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const hashedPassword = await authUtils.hashPassword(password);
    const userResult = await client.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, hashedPassword, role || 'member']
    );
    const newUser = userResult.rows[0];

    // Also create a corresponding member entry
    await client.query(
      'INSERT INTO members (name, email) VALUES ($1, $2)',
      [newUser.username, `${newUser.username}@library.app`]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'User and member registered successfully', user: newUser });

  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

app.post('/api/books', authUtils.authenticateToken, async (req, res) => {
  const { title, author, isbn, categoryIds } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required' });
  }

  const client = await db.pool.connect(); // Get a client from the pool for transaction
  try {
    await client.query('BEGIN'); // Start transaction

    const { rows } = await client.query(
      'INSERT INTO books (title, author, isbn) VALUES ($1, $2, $3) RETURNING *',
      [title, author, isbn]
    );
    const newBook = rows[0];

    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await client.query(
          'INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2)',
          [newBook.id, categoryId]
        );
      }
    }

    await client.query('COMMIT'); // Commit transaction
    res.status(201).json(newBook);
  } catch (err) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release(); // Release the client back to the pool
  }
});

app.put('/api/books/:id', authUtils.authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, available, cover_image_path, categoryIds } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required' });
  }

  const client = await db.pool.connect(); // Get a client from the pool for transaction
  try {
    await client.query('BEGIN'); // Start transaction

    const { rows } = await client.query(
      'UPDATE books SET title = $1, author = $2, isbn = $3, available = $4, cover_image_path = $5 WHERE id = $6 RETURNING *',
      [title, author, isbn, available, cover_image_path, id]
    );
    const updatedBook = rows[0];

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Book not found' });
    }

    // Update categories
    await client.query('DELETE FROM book_categories WHERE book_id = $1', [id]); // Remove existing associations

    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await client.query(
          'INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2)',
          [id, categoryId]
        );
      }
    }

    await client.query('COMMIT'); // Commit transaction
    res.json(updatedBook);
  } catch (err) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release(); // Release the client back to the pool
  }
});

app.delete('/api/books/:id', authUtils.authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await db.query('DELETE FROM books WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.status(204).send(); // No Content
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await authUtils.comparePasswords(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Pass sensitive information like user ID and role to the token payload
    const token = authUtils.generateToken({ id: user.id, username: user.username, role: user.role });
    // Send back token and user information
    res.json({
      message: 'Logged in successfully',
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoints for categories
app.get('/api/categories', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/categories', authUtils.authenticateToken, authUtils.checkAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  try {
    const { rows } = await db.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation error code
      return res.status(409).json({ error: 'Category with this name already exists' });
    }
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/categories/:id', authUtils.authenticateToken, authUtils.checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  try {
    const { rows } = await db.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique violation error code
      return res.status(409).json({ error: 'Category with this name already exists' });
    }
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/categories/:id', authUtils.authenticateToken, authUtils.checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM categories WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(204).send(); // No Content
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoints for members
app.get('/api/users', authUtils.authenticateToken, authUtils.checkAdmin, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, username, role, created_at FROM users ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const { sortBy, sortOrder } = req.query;
    let query = 'SELECT * FROM members';
    const params = [];

    const validSortColumns = ['name', 'email', 'id'];
    const finalSortBy = validSortColumns.includes(String(sortBy).toLowerCase()) ? String(sortBy) : 'id';
    const finalSortOrder = String(sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    query += ` ORDER BY ${finalSortBy} ${finalSortOrder}`;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query('SELECT * FROM members WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/members', authUtils.authenticateToken, async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  try {
    const { rows } = await db.query(
      'INSERT INTO members (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
      [name, email, phone]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/members/:id', authUtils.authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  try {
    const { rows } = await db.query(
      'UPDATE members SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
      [name, email, phone, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/members/:id', authUtils.authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM members WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.status(204).send(); // No Content
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to update a user (e.g., change their role)
app.put('/api/users/:id', authUtils.authenticateToken, authUtils.checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, role } = req.body;
  const currentUserId = req.user.id;

  if (!username || !role) {
    return res.status(400).json({ error: 'Username and role are required' });
  }

  try {
    // Prevent the last admin from removing their own admin role
    if (String(currentUserId) === id && role !== 'admin') {
      const { rows } = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
      const adminCount = parseInt(rows[0].count, 10);
      if (adminCount <= 1) {
        return res.status(403).json({ error: 'Cannot remove the last administrator role.' });
      }
    }

    const { rows } = await db.query(
      'UPDATE users SET username = $1, role = $2 WHERE id = $3 RETURNING id, username, role',
      [username, role, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique username violation
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to delete a user
app.delete('/api/users/:id', authUtils.authenticateToken, authUtils.checkAdmin, async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  if (String(currentUserId) === id) {
    return res.status(403).json({ error: 'You cannot delete yourself.' });
  }

  try {
    // Optional: Check if the user is the last admin
    const { rows } = await db.query("SELECT role FROM users WHERE id = $1", [id]);
    if (rows.length > 0 && rows[0].role === 'admin') {
        const adminCountRes = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
        if (parseInt(adminCountRes.rows[0].count, 10) <= 1) {
            return res.status(403).json({ error: 'Cannot delete the last administrator.' });
        }
    }

    const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send(); // No Content
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to change a user's password (admin only)
app.put('/api/users/:id/password', authUtils.authenticateToken, authUtils.checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    const hashedPassword = await authUtils.hashPassword(password);
    const { rowCount } = await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoints for loans
app.post('/api/loans/borrow', authUtils.authenticateToken, async (req, res) => {
  const { book_id, member_id } = req.body;
  if (!book_id || !member_id) {
    return res.status(400).json({ error: 'Book ID and Member ID are required' });
  }

  try {
    // Check if book is available
    const bookResult = await db.query('SELECT available FROM books WHERE id = $1', [book_id]);
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    if (!bookResult.rows[0].available) {
      return res.status(409).json({ error: 'Book is currently not available' });
    }

    // Record the loan with a due date 14 days from now
    const loanResult = await db.query(
      'INSERT INTO loans (book_id, member_id, due_date) VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL \'14 days\') RETURNING *',
      [book_id, member_id]
    );

    // Update book availability
    await db.query('UPDATE books SET available = FALSE WHERE id = $1', [book_id]);

    res.status(201).json(loanResult.rows[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/loans/return', authUtils.authenticateToken, async (req, res) => {
  const { book_id, member_id } = req.body; // member_id is optional here, for verification if needed
  if (!book_id) {
    return res.status(400).json({ error: 'Book ID is required' });
  }

  try {
    // Find the active loan for the book (assuming one active loan per book)
    const loanResult = await db.query(
      'SELECT * FROM loans WHERE book_id = $1 AND return_date IS NULL ORDER BY borrow_date DESC LIMIT 1',
      [book_id]
    );

    if (loanResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active loan found for this book' });
    }

    const loan_id = loanResult.rows[0].id;

    // Update the loan with return date
    await db.query('UPDATE loans SET return_date = CURRENT_TIMESTAMP WHERE id = $1', [loan_id]);

    // Update book availability
    await db.query('UPDATE books SET available = TRUE WHERE id = $1', [book_id]);

    res.status(200).json({ message: 'Book returned successfully' });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/loans', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        loans.id,
        loans.borrow_date,
        loans.due_date,
        loans.return_date,
        books.title AS book_title,
        members.name AS member_name
      FROM loans
      JOIN books ON loans.book_id = books.id
      JOIN members ON loans.member_id = members.id
      ORDER BY loans.borrow_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint for dashboard stats
app.get('/api/dashboard', async (req, res) => {
  try {
    const totalBooksRes = await db.query('SELECT COUNT(*) FROM books');
    const totalMembersRes = await db.query('SELECT COUNT(*) FROM members');
    const activeLoansRes = await db.query('SELECT COUNT(*) FROM loans WHERE return_date IS NULL');
    const overdueLoansRes = await db.query('SELECT COUNT(*) FROM loans WHERE return_date IS NULL AND due_date < CURRENT_TIMESTAMP');
    
    const stats = {
      total_books: parseInt(totalBooksRes.rows[0].count, 10),
      total_members: parseInt(totalMembersRes.rows[0].count, 10),
      active_loans: parseInt(activeLoansRes.rows[0].count, 10),
      overdue_loans: parseInt(overdueLoansRes.rows[0].count, 10),
    };

    res.json(stats);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import multer for file uploads
const multer = require('multer');
// Import csv-parse for parsing CSV data
const { parse } = require('csv-parse/sync');

// Configure multer for file storage in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // Prevent huge CSV uploads
  fileFilter: (req, file, cb) => {
    if (['text/csv', 'application/vnd.ms-excel'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('INVALID_CSV_TYPE'));
  }
});

app.post('/api/books/bulk-import', authUtils.authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file is required.' });
  }

  let records;
  try {
    records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return res.status(400).json({ error: 'Invalid CSV file format.' });
  }

  const importedBooks = [];
  const errors = [];
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    for (const [index, record] of records.entries()) {
      const { title, author, isbn, cover_image_path } = record;

      if (!title || !author) {
        errors.push(`Row ${index + 1}: Missing required field (title/author)`);
        continue;
      }

      let finalCoverPath = cover_image_path || null;

      // If cover image is a URL → download
      if (cover_image_path && /^https?:\/\/.+/i.test(cover_image_path)) {
        try {
          const imageResponse = await axios.get(cover_image_path, { responseType: 'arraybuffer' });

          // Create uploads directory if not exists
          if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
            fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
          }

          const fileExt = path.extname(new URL(cover_image_path).pathname) || '.jpg';
          finalCoverPath = `/uploads/${uuidv4()}${fileExt}`;
          const savePath = path.join(__dirname, finalCoverPath);

          fs.writeFileSync(savePath, imageResponse.data);
        } catch {
          errors.push(`Row ${index + 1}: Failed to download cover image from URL`);
        }
      }

      // Try inserting record
      try {
        const result = await client.query(
          `INSERT INTO books (title, author, isbn, cover_image_path)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (isbn) DO NOTHING
          RETURNING id`,
          [title.trim(), author.trim(), isbn || null, finalCoverPath]
        );

        if (result.rows.length) {
          importedBooks.push(result.rows[0]);
        } else {
          errors.push(`Row ${index + 1}: Duplicate ISBN (${isbn})`);
        }
      } catch (err) {
        errors.push(`Row ${index + 1} insert failed: ${err.message}`);
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: 'Import failed. Transaction aborted.' });
  } finally {
    client.release();
  }

  res.status(errors.length ? 207 : 200).json({
    message: `${importedBooks.length} books imported${errors.length ? `, ${errors.length} issues` : ''}.`,
    importedBooks,
    errors,
  });
});

// Setup for file uploads (book covers)
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    console.log(`Multer destination: ${uploadsDir}`);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // req.params.id is available here because the route pattern is /api/books/:id/cover
    const bookId = req.params.id; // Extract bookId
    const newFilename = `${bookId}-${Date.now()}${path.extname(file.originalname)}`;
    console.log(`Multer filename generated: ${newFilename} for bookId: ${bookId}`);
    cb(null, newFilename);
  },
});

const coverUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
  },
});

// Endpoint to upload a book cover
app.post('/api/books/:id/cover', authUtils.authenticateToken, (req, res, next) => {
  // Prevent missing ID
  if (!req.params.id) return res.status(400).json({ error: 'Book ID required' });
  next();
}, coverUpload.single('cover'), async (req, res) => {
  const { id } = req.params;
  console.log(`Received cover upload request for book ID: ${id}`);
  if (!req.file) {
    console.error('No file uploaded in the request.');
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  console.log(`File received: ${req.file.originalname}, stored as: ${req.file.filename}`);
  const cover_image_path = `/uploads/${req.file.filename}`;
  console.log(`Cover image path to be saved to DB: ${cover_image_path}`);

  try {
    const { rows } = await db.query(
      'UPDATE books SET cover_image_path = $1 WHERE id = $2 RETURNING *',
      [cover_image_path, id]
    );
    if (rows.length === 0) {
      console.error(`Book with ID ${id} not found for cover update.`);
      return res.status(404).json({ error: 'Book not found' });
    }
    console.log(`Successfully updated cover_image_path for book ID ${id}. New path: ${cover_image_path}`);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error during cover image update:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => {
  if (err.message === 'INVALID_CSV_TYPE') {
    return res.status(400).json({ error: 'Only CSV files allowed.' });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  next(err);
});


// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log(`Creating uploads directory: ${uploadsDir}`);
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Function to check and ensure at least one admin user exists
const ensureAdminUserExists = async () => {
  try {
    const { rows } = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    const adminCount = parseInt(rows[0].count, 10);

    if (adminCount === 0) {
      console.log('No admin user found. Initial setup via frontend is required.');
    } else {
      console.log(`Found ${adminCount} admin user(s).`);
    }
  } catch (err) {
    console.error('Error checking for admin user on startup:', err.stack);
  }
};


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  ensureAdminUserExists();

  // Function to check for overdue loans
  const checkOverdueLoans = async () => {
    try {
      const { rows } = await db.query(
        `SELECT
          l.id AS loan_id,
          b.title AS book_title,
          m.name AS member_name,
          l.due_date
        FROM loans l
        JOIN books b ON l.book_id = b.id
        JOIN members m ON l.member_id = m.id
        WHERE l.return_date IS NULL AND l.due_date < CURRENT_TIMESTAMP`
      );

      if (rows.length > 0) {
        console.warn(`[OVERDUE REMINDER] Found ${rows.length} overdue loans:`);
        rows.forEach(loan => {
          console.warn(
            `  - Loan ID: ${loan.loan_id}, Book: "${loan.book_title}", Member: ${loan.member_name}, Due Date: ${new Date(loan.due_date).toLocaleDateString()}`
          );
        });
        // Here you would typically implement a notification mechanism (e.g., email, push notification, in-app alert)
      } else {
        console.log('[OVERDUE REMINDER] No overdue loans found.');
      }
    } catch (err) {
      console.error('[OVERDUE REMINDER ERROR]', err.stack);
    }
  };

  // Schedule the cron job to run every minute
  schedule('* * * * *', () => {
    console.log('[CRON JOB] Checking for overdue loans...');
    checkOverdueLoans();
  });
});
