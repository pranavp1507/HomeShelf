/**
 * Books routes
 * Handles book CRUD operations, ISBN lookup, bulk import, and cover uploads
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { parse } = require('csv-parse/sync');
const db = require('../db');
const authUtils = require('../authUtils');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validateBook, validatePagination } = require('../middleware/validation');
const { coverUpload, csvUpload, uploadsDir } = require('../utils/upload');

// Get all books with pagination, search, and filters
router.get('/', validatePagination, asyncHandler(async (req, res) => {
  const { search, availableStatus, categoryIds, sortBy, sortOrder, page, limit } = req.query;

  // Pagination parameters
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 25;
  const offset = (pageNum - 1) * limitNum;

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
      conditions.push(`b.id IN (
        SELECT DISTINCT bc_filter.book_id
        FROM book_categories bc_filter
        WHERE bc_filter.category_id = ANY($${paramIndex}::int[])
      )`);
      params.push(ids);
      paramIndex += 1;
    }
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' GROUP BY b.id';

  // Get total count before pagination
  const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
  const { rows: countRows } = await db.query(countQuery, params);
  const totalCount = parseInt(countRows[0].count, 10);

  const validSortColumns = ['title', 'author', 'isbn', 'available', 'id'];
  const finalSortBy = validSortColumns.includes(String(sortBy).toLowerCase()) ? String(sortBy) : 'id';
  const finalSortOrder = String(sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  query += ` ORDER BY b.${finalSortBy} ${finalSortOrder}`;

  // Add pagination
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limitNum, offset);

  const { rows } = await db.query(query, params);

  res.json({
    data: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum)
    }
  });
}));

// ISBN lookup from Open Library and Google Books
router.post('/lookup', authUtils.authenticateToken, asyncHandler(async (req, res) => {
  const { isbn } = req.body;

  if (!isbn) {
    throw new AppError('ISBN is required', 400);
  }

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
        bookData.coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
      }
    }
  } catch (olErr) {
    console.error('Open Library lookup failed:', olErr.message);
  }

  // 2. Fallback to Google Books if data is incomplete and key is provided
  const googleApiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if ((!bookData.title || !bookData.coverUrl) && googleApiKey) {
    try {
      const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${googleApiKey}`;
      const googleBooksResponse = await axios.get(googleBooksUrl);
      const gbData = googleBooksResponse.data.items && googleBooksResponse.data.items[0];

      if (gbData) {
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
  if (!bookData.title && !bookData.author) {
    let finalErrorMessage = 'Book not found for the provided ISBN.';
    if (!googleApiKey || googleApiKey === 'YOUR_GOOGLE_BOOKS_API_KEY_HERE') {
      finalErrorMessage = 'Book not found via Open Library. Google Books API key is missing or invalid, so no fallback was attempted.';
    } else {
      finalErrorMessage = 'Book not found via Open Library and Google Books.';
    }
    throw new AppError(finalErrorMessage, 404);
  }

  res.json(bookData);
}));

// Create a new book
router.post('/', authUtils.authenticateToken, validateBook, asyncHandler(async (req, res) => {
  const { title, author, isbn, categoryIds } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'INSERT INTO books (title, author, isbn) VALUES ($1, $2, $3) RETURNING *',
      [title, author, isbn || null]
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

    await client.query('COMMIT');
    res.status(201).json(newBook);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// Update a book
router.put('/:id', authUtils.authenticateToken, validateBook, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, available, cover_image_path, categoryIds } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'UPDATE books SET title = $1, author = $2, isbn = $3, available = $4, cover_image_path = $5 WHERE id = $6 RETURNING *',
      [title, author, isbn || null, available !== undefined ? available : true, cover_image_path || null, id]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      throw new AppError('Book not found', 404);
    }

    const updatedBook = rows[0];

    // Update categories
    await client.query('DELETE FROM book_categories WHERE book_id = $1', [id]);

    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await client.query(
          'INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2)',
          [id, categoryId]
        );
      }
    }

    await client.query('COMMIT');
    res.json(updatedBook);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// Delete a book
router.delete('/:id', authUtils.authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rowCount } = await db.query('DELETE FROM books WHERE id = $1', [id]);

  if (rowCount === 0) {
    throw new AppError('Book not found', 404);
  }

  res.status(204).send();
}));

// Bulk import books from CSV
router.post('/bulk-import', authUtils.authenticateToken, csvUpload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('CSV file is required', 400);
  }

  let records;
  try {
    records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    throw new AppError('Invalid CSV file format', 400);
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

          const fileExt = path.extname(new URL(cover_image_path).pathname) || '.jpg';
          finalCoverPath = `/uploads/${uuidv4()}${fileExt}`;
          const savePath = path.join(uploadsDir, path.basename(finalCoverPath));

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
    throw new AppError('Import failed. Transaction aborted.', 500);
  } finally {
    client.release();
  }

  res.status(errors.length ? 207 : 200).json({
    message: `${importedBooks.length} books imported${errors.length ? `, ${errors.length} issues` : ''}.`,
    importedBooks,
    errors,
  });
}));

// Upload book cover image
router.post('/:id/cover', authUtils.authenticateToken, (req, res, next) => {
  if (!req.params.id) {
    return next(new AppError('Book ID required', 400));
  }
  next();
}, coverUpload.single('cover'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const cover_image_path = `/uploads/${req.file.filename}`;

  const { rows } = await db.query(
    'UPDATE books SET cover_image_path = $1 WHERE id = $2 RETURNING *',
    [cover_image_path, id]
  );

  if (rows.length === 0) {
    throw new AppError('Book not found', 404);
  }

  res.json(rows[0]);
}));

module.exports = router;
