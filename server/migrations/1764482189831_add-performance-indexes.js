/**
 * Migration: Add Performance Indexes
 *
 * Adds 9 database indexes to improve query performance:
 * - Books: title, author, available
 * - Members: email, name
 * - Loans: return_date, due_date
 * - Book Categories: book_id, category_id
 *
 * Expected performance improvement: 10-100x faster for search/filter queries
 */

exports.up = (pgm) => {
  // Books table indexes
  pgm.createIndex('books', 'title', {
    name: 'idx_books_title',
  });

  pgm.createIndex('books', 'author', {
    name: 'idx_books_author',
  });

  pgm.createIndex('books', 'available', {
    name: 'idx_books_available',
  });

  // Members table indexes
  pgm.createIndex('members', 'email', {
    name: 'idx_members_email',
  });

  pgm.createIndex('members', 'name', {
    name: 'idx_members_name',
  });

  // Loans table indexes
  pgm.createIndex('loans', 'return_date', {
    name: 'idx_loans_return_date',
  });

  pgm.createIndex('loans', 'due_date', {
    name: 'idx_loans_due_date',
  });

  // Book categories junction table indexes
  pgm.createIndex('book_categories', 'book_id', {
    name: 'idx_book_categories_book_id',
  });

  pgm.createIndex('book_categories', 'category_id', {
    name: 'idx_book_categories_category_id',
  });
};

exports.down = (pgm) => {
  // Drop indexes in reverse order
  pgm.dropIndex('book_categories', 'category_id', {
    name: 'idx_book_categories_category_id',
  });

  pgm.dropIndex('book_categories', 'book_id', {
    name: 'idx_book_categories_book_id',
  });

  pgm.dropIndex('loans', 'due_date', {
    name: 'idx_loans_due_date',
  });

  pgm.dropIndex('loans', 'return_date', {
    name: 'idx_loans_return_date',
  });

  pgm.dropIndex('members', 'name', {
    name: 'idx_members_name',
  });

  pgm.dropIndex('members', 'email', {
    name: 'idx_members_email',
  });

  pgm.dropIndex('books', 'available', {
    name: 'idx_books_available',
  });

  pgm.dropIndex('books', 'author', {
    name: 'idx_books_author',
  });

  pgm.dropIndex('books', 'title', {
    name: 'idx_books_title',
  });
};
