/**
 * Test fixtures for books
 */

export const testBooks = [
  {
    id: 1,
    title: 'Test Book 1',
    author: 'Test Author 1',
    isbn: '9780123456789',
    available: true,
    cover_image_path: null,
    created_at: new Date('2024-01-01'),
  },
  {
    id: 2,
    title: 'Test Book 2',
    author: 'Test Author 2',
    isbn: '9780987654321',
    available: true,
    cover_image_path: '/uploads/book2.jpg',
    created_at: new Date('2024-01-02'),
  },
  {
    id: 3,
    title: 'Borrowed Book',
    author: 'Test Author 3',
    isbn: '9781234567890',
    available: false,
    cover_image_path: null,
    created_at: new Date('2024-01-03'),
  },
  {
    id: 4,
    title: 'TypeScript Programming',
    author: 'John Doe',
    isbn: '9781111111111',
    available: true,
    cover_image_path: null,
    created_at: new Date('2024-01-04'),
  },
  {
    id: 5,
    title: 'Node.js Cookbook',
    author: 'Jane Smith',
    isbn: '9782222222222',
    available: true,
    cover_image_path: null,
    created_at: new Date('2024-01-05'),
  },
];

export const createBookPayload = {
  valid: {
    title: 'New Book',
    author: 'New Author',
    isbn: '9783333333333',
    categoryIds: [1, 2],
  },
  validMinimal: {
    title: 'Minimal Book',
    author: 'Minimal Author',
    isbn: '9784444444444',
  },
  missingTitle: {
    author: 'Author',
    isbn: '9785555555555',
  },
  missingAuthor: {
    title: 'Book',
    isbn: '9786666666666',
  },
  missingIsbn: {
    title: 'Book',
    author: 'Author',
  },
  emptyTitle: {
    title: '',
    author: 'Author',
    isbn: '9787777777777',
  },
  duplicateIsbn: {
    title: 'Duplicate Book',
    author: 'Duplicate Author',
    isbn: '9780123456789', // Same as testBooks[0]
  },
  withCategories: {
    title: 'Book with Categories',
    author: 'Category Author',
    isbn: '9788888888888',
    categoryIds: [1, 2, 3],
  },
};

export const updateBookPayload = {
  valid: {
    title: 'Updated Book Title',
    author: 'Updated Author',
    isbn: '9789999999999',
    categoryIds: [1],
  },
  partialUpdate: {
    title: 'Only Title Updated',
  },
  removeCategories: {
    categoryIds: [],
  },
};

export const bulkImportCsvData = {
  valid: `title,author,isbn,categories
"Clean Code","Robert C. Martin","9780132350884","Programming,Software"
"The Pragmatic Programmer","Andrew Hunt","9780135957059","Programming"
"Design Patterns","Gang of Four","9780201633610","Software,Architecture"`,

  validWithCoverUrls: `title,author,isbn,coverImageUrl,categories
"Book 1","Author 1","9781111111112","https://example.com/cover1.jpg","Fiction"
"Book 2","Author 2","9781111111113","https://example.com/cover2.jpg","Non-Fiction"`,

  withDuplicates: `title,author,isbn,categories
"Clean Code","Robert C. Martin","9780132350884","Programming"
"Test Book 1","Test Author 1","9780123456789","Fiction"`,

  invalidFormat: `title,author
"Missing ISBN","Author"`,

  empty: '',

  missingHeaders: `Book Title,Book Author,Book ISBN
"Book","Author","123"`,
};

export const bookSearchQueries = {
  byTitle: 'Test Book',
  byAuthor: 'Test Author',
  byIsbn: '9780123456789',
  noResults: 'NonExistentBook',
};

export const bookFilters = {
  available: { availability: 'available' },
  borrowed: { availability: 'borrowed' },
  all: { availability: 'all' },
  byCategory: { category: 'Programming' },
};
