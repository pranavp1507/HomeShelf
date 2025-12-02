/**
 * Book Service - Business logic for book operations
 *
 * This service layer contains all business logic for books,
 * keeping routes thin and focused on HTTP concerns.
 */

import { BookRepository, Book, BookSearchOptions } from '../repositories/BookRepository';
import { PaginatedResult } from '../repositories/BaseRepository';
import { AppError } from '../middleware/errorHandler';

export class BookService {
  private bookRepository: BookRepository;

  constructor() {
    this.bookRepository = new BookRepository();
  }

  /**
   * Get all books with search/filter/pagination
   */
  async getBooks(options: BookSearchOptions): Promise<PaginatedResult<Book>> {
    return await this.bookRepository.search(options);
  }

  /**
   * Get a single book by ID
   */
  async getBookById(id: number): Promise<Book> {
    const book = await this.bookRepository.findById(id);
    if (!book) {
      throw new AppError('Book not found', 404);
    }
    return book;
  }

  /**
   * Get book with its categories
   */
  async getBookWithCategories(id: number): Promise<Book & { categories: any[] }> {
    const book = await this.bookRepository.findByIdWithCategories(id);
    if (!book) {
      throw new AppError('Book not found', 404);
    }
    return book;
  }

  /**
   * Create a new book
   */
  async createBook(data: {
    title: string;
    author: string;
    isbn?: string;
    cover_image_path?: string;
    categories?: number[];
  }): Promise<Book> {
    // Check for duplicate ISBN
    if (data.isbn) {
      const existing = await this.bookRepository.findByIsbn(data.isbn);
      if (existing) {
        throw new AppError('A book with this ISBN already exists', 409);
      }
    }

    // Create book
    const book = await this.bookRepository.create({
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      cover_image_path: data.cover_image_path,
      available: true
    });

    // Add categories if provided
    if (data.categories && data.categories.length > 0) {
      await this.addCategoriesToBook(book.id, data.categories);
    }

    return book;
  }

  /**
   * Update a book
   */
  async updateBook(id: number, data: {
    title?: string;
    author?: string;
    isbn?: string;
    available?: boolean;
    cover_image_path?: string;
    categories?: number[];
  }): Promise<Book> {
    // Check book exists
    const existing = await this.bookRepository.findById(id);
    if (!existing) {
      throw new AppError('Book not found', 404);
    }

    // Check ISBN uniqueness if changed
    if (data.isbn && data.isbn !== existing.isbn) {
      const duplicate = await this.bookRepository.findByIsbn(data.isbn);
      if (duplicate && duplicate.id !== id) {
        throw new AppError('A book with this ISBN already exists', 409);
      }
    }

    // Update book
    const updateData: Partial<Book> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.author !== undefined) updateData.author = data.author;
    if (data.isbn !== undefined) updateData.isbn = data.isbn;
    if (data.available !== undefined) updateData.available = data.available;
    if (data.cover_image_path !== undefined) updateData.cover_image_path = data.cover_image_path;

    const book = await this.bookRepository.update(id, updateData);
    if (!book) {
      throw new AppError('Failed to update book', 500);
    }

    // Update categories if provided
    if (data.categories !== undefined) {
      await this.replaceBookCategories(id, data.categories);
    }

    return book;
  }

  /**
   * Delete a book
   */
  async deleteBook(id: number): Promise<void> {
    const book = await this.bookRepository.findById(id);
    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const deleted = await this.bookRepository.delete(id);
    if (!deleted) {
      throw new AppError('Failed to delete book', 500);
    }
  }

  /**
   * Bulk import books from CSV
   */
  async bulkImportBooks(books: Array<{ title: string; author: string; isbn?: string }>): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const result = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    };

    const booksToImport: Partial<Book>[] = [];

    for (const bookData of books) {
      // Validate required fields
      if (!bookData.title || !bookData.author) {
        result.skipped++;
        result.errors.push(`Missing required fields for: ${JSON.stringify(bookData)}`);
        continue;
      }

      // Check for duplicate ISBN
      if (bookData.isbn) {
        const existing = await this.bookRepository.findByIsbn(bookData.isbn);
        if (existing) {
          result.skipped++;
          result.errors.push(`Duplicate ISBN: ${bookData.isbn}`);
          continue;
        }
      }

      booksToImport.push({
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
        available: true
      });
    }

    if (booksToImport.length > 0) {
      await this.bookRepository.bulkCreate(booksToImport);
      result.imported = booksToImport.length;
    }

    return result;
  }

  /**
   * Add categories to a book
   */
  private async addCategoriesToBook(bookId: number, categoryIds: number[]): Promise<void> {
    const { query } = await import('../db');

    for (const categoryId of categoryIds) {
      await query(
        'INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [bookId, categoryId]
      );
    }
  }

  /**
   * Replace book categories
   */
  private async replaceBookCategories(bookId: number, categoryIds: number[]): Promise<void> {
    const { query } = await import('../db');

    await this.bookRepository.transaction(async (client) => {
      // Remove existing categories
      await client.query('DELETE FROM book_categories WHERE book_id = $1', [bookId]);

      // Add new categories
      for (const categoryId of categoryIds) {
        await client.query(
          'INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2)',
          [bookId, categoryId]
        );
      }
    });
  }
}
