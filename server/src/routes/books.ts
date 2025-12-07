/**
 * Books routes
 * Handles book CRUD operations, ISBN lookup, bulk import, and cover uploads
 */

import express, { Response, NextFunction } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'csv-parse/sync';
import { query, pool } from '../db';
import * as authUtils from '../utils/authUtils';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateBook, validatePagination } from '../middleware/validation';
import { coverUpload, csvUpload, uploadsDir } from '../utils/fileUpload';
import { AuthRequest } from '../types/express';
import { Book, BookWithCategories, BookQueryParams } from '../types/book';
import config from '../config';

const router = express.Router();

interface Category {
  id: number;
  name: string;
}

interface BookWithCategoriesDB extends Book {
  categories: Category[];
}

// Get all books with pagination, search, and filters
router.get('/', validatePagination, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, availableStatus, categoryIds, sortBy, sortOrder, page, limit } = req.query as BookQueryParams;

  // Pagination parameters
  const pageNum = parseInt(page || '1', 10);
  const limitNum = parseInt(limit || '25', 10);
  const offset = (pageNum - 1) * limitNum;

  let queryText = `
    SELECT
      b.*,
      COALESCE(json_agg(json_build_object('id', c.id, 'name', c.name) ORDER BY c.name) FILTER (WHERE c.id IS NOT NULL), '[]') AS categories
    FROM books b
    LEFT JOIN book_categories bc ON b.id = bc.book_id
    LEFT JOIN categories c ON bc.category_id = c.id
  `;
  const params: any[] = [];
  const conditions: string[] = [];
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
    queryText += ` WHERE ${conditions.join(' AND ')}`;
  }

  queryText += ' GROUP BY b.id';

  // Get total count before pagination
  const countQuery = `SELECT COUNT(*) FROM (${queryText}) AS count_query`;
  const { rows: countRows } = await query<{ count: string }>(countQuery, params);
  const totalCount = parseInt(countRows[0].count, 10);

  const validSortColumns = ['title', 'author', 'isbn', 'available', 'id'];
  const finalSortBy = validSortColumns.includes(String(sortBy).toLowerCase()) ? String(sortBy) : 'id';
  const finalSortOrder = String(sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  queryText += ` ORDER BY b.${finalSortBy} ${finalSortOrder}`;

  // Add pagination
  queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limitNum, offset);

  const { rows } = await query<BookWithCategoriesDB>(queryText, params);

  res.json({
    data: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limitNum)
    }
  });
}));

// ISBN lookup from Open Library and Google Books
router.post('/lookup', authUtils.authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
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
      bookData.author = olData.authors ? olData.authors.map((a: any) => a.name).join(', ') : '';
      if (olData.cover && olData.cover.large) {
        bookData.coverUrl = olData.cover.large;
      } else {
        bookData.coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
      }
    }
  } catch (olErr: any) {
    console.error('Open Library lookup failed:', olErr.message);
  }

  // 2. Fallback to Google Books if data is incomplete and key is provided
  const googleApiKey = config.googleBooksApiKey;
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
    } catch (gbErr: any) {
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
router.post('/', authUtils.authenticateToken, validateBook, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, author, isbn, categoryIds } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query<Book>(
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
router.put('/:id', authUtils.authenticateToken, validateBook, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, author, isbn, available, cover_image_path, categoryIds } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the old book data to check for old cover image
    const { rows: oldBookRows } = await client.query<Book>('SELECT cover_image_path FROM books WHERE id = $1', [id]);

    if (oldBookRows.length === 0) {
      await client.query('ROLLBACK');
      throw new AppError('Book not found', 404);
    }

    const oldCoverPath = oldBookRows[0].cover_image_path;

    const { rows } = await client.query<Book>(
      'UPDATE books SET title = $1, author = $2, isbn = $3, available = $4, cover_image_path = $5 WHERE id = $6 RETURNING *',
      [title, author, isbn || null, available !== undefined ? available : true, cover_image_path || null, id]
    );

    const updatedBook = rows[0];

    // Delete old cover image file if it was removed or changed
    if (oldCoverPath && oldCoverPath !== cover_image_path) {
      const filePath = path.join(uploadsDir, path.basename(oldCoverPath));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old cover image: ${filePath}`);
      }
    }

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
router.delete('/:id', authUtils.authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Get the book to check if it has a cover image
  const { rows: bookRows } = await query<Book>('SELECT cover_image_path FROM books WHERE id = $1', [id]);

  if (bookRows.length === 0) {
    throw new AppError('Book not found', 404);
  }

  const { rowCount } = await query('DELETE FROM books WHERE id = $1', [id]);

  if (!rowCount || rowCount === 0) {
    throw new AppError('Book not found', 404);
  }

  // Delete the cover image file if it exists
  if (bookRows[0].cover_image_path) {
    const filePath = path.join(uploadsDir, path.basename(bookRows[0].cover_image_path));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted cover image: ${filePath}`);
    }
  }

  res.status(204).send();
}));

// Bulk import books from CSV
router.post('/bulk-import', authUtils.authenticateToken, csvUpload.single('file'), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new AppError('CSV file is required', 400);
  }

  // Log file details for debugging
  console.log('CSV Upload Details:', {
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    bufferLength: req.file.buffer?.length,
  });

  let records: any[];
  try {
    records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle UTF-8 BOM (Byte Order Mark) from Excel
      relax_column_count: true, // Allow rows with different column counts
      skip_records_with_error: true, // Skip malformed rows instead of failing
    });
    console.log(`Parsed ${records.length} records from CSV`);
  } catch (error) {
    console.error('CSV Parse Error:', error);
    throw new AppError(`Invalid CSV file format: ${error instanceof Error ? error.message : 'Unknown error'}`, 400);
  }

  if (!records || records.length === 0) {
    throw new AppError('CSV file is empty or contains no valid data rows', 400);
  }

  const importedBooks: any[] = [];
  const errors: string[] = [];
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const [index, record] of records.entries()) {
      const { title, author, isbn, cover_image_path, cover_image_url, categories } = record;

      if (!title || !author) {
        errors.push(`Row ${index + 1}: Missing required field (title/author)`);
        continue;
      }

      let finalCoverPath: string | null = cover_image_path || null;

      // If cover_image_url is provided, download it
      const coverUrl = cover_image_url || cover_image_path;
      if (coverUrl && /^https?:\/\/.+/i.test(coverUrl)) {
        try {
          const imageResponse = await axios.get(coverUrl, {
            responseType: 'arraybuffer',
            timeout: 10000, // 10 second timeout
          });

          const fileExt = path.extname(new URL(coverUrl).pathname) || '.jpg';
          finalCoverPath = `/uploads/${uuidv4()}${fileExt}`;
          const savePath = path.join(uploadsDir, path.basename(finalCoverPath));

          fs.writeFileSync(savePath, imageResponse.data);
        } catch (err) {
          errors.push(`Row ${index + 1}: Failed to download cover image from URL - ${err instanceof Error ? err.message : 'Unknown error'}`);
          finalCoverPath = null;
        }
      }

      // Try inserting book record
      try {
        const result = await client.query<{ id: number }>(
          `INSERT INTO books (title, author, isbn, cover_image_path)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (isbn) DO NOTHING
          RETURNING id`,
          [title.trim(), author.trim(), isbn || null, finalCoverPath]
        );

        if (result.rows.length) {
          const bookId = result.rows[0].id;
          importedBooks.push(result.rows[0]);

          // Handle categories if provided (comma-separated)
          if (categories && typeof categories === 'string' && categories.trim()) {
            const categoryNames = categories.split(',').map((c: string) => c.trim()).filter(Boolean);

            for (const categoryName of categoryNames) {
              try {
                // Get or create category
                let categoryId: number;
                const existingCategory = await client.query<{ id: number }>(
                  'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)',
                  [categoryName]
                );

                if (existingCategory.rows.length > 0) {
                  categoryId = existingCategory.rows[0].id;
                } else {
                  // Create new category
                  const newCategory = await client.query<{ id: number }>(
                    'INSERT INTO categories (name) VALUES ($1) RETURNING id',
                    [categoryName]
                  );
                  categoryId = newCategory.rows[0].id;
                }

                // Associate category with book
                await client.query(
                  'INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                  [bookId, categoryId]
                );
              } catch (catErr: any) {
                errors.push(`Row ${index + 1}: Failed to add category '${categoryName}' - ${catErr.message}`);
              }
            }
          }
        } else {
          errors.push(`Row ${index + 1}: Duplicate ISBN (${isbn})`);
        }
      } catch (err: any) {
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
router.post('/:id/cover',
  authUtils.authenticateToken,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.params.id) {
      return next(new AppError('Book ID required', 400));
    }
    next();
  },
  coverUpload.single('cover'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Get the old cover path before updating
    const { rows: oldBookRows } = await query<Book>('SELECT cover_image_path FROM books WHERE id = $1', [id]);

    if (oldBookRows.length === 0) {
      // Delete the newly uploaded file since book doesn't exist
      const uploadedFilePath = path.join(uploadsDir, req.file.filename);
      if (fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      throw new AppError('Book not found', 404);
    }

    const oldCoverPath = oldBookRows[0].cover_image_path;
    const cover_image_path = `/uploads/${req.file.filename}`;

    const { rows } = await query<Book>(
      'UPDATE books SET cover_image_path = $1 WHERE id = $2 RETURNING *',
      [cover_image_path, id]
    );

    // Delete old cover image file if it exists
    if (oldCoverPath) {
      const filePath = path.join(uploadsDir, path.basename(oldCoverPath));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old cover image: ${filePath}`);
      }
    }

    res.json(rows[0]);
  })
);

export default router;
