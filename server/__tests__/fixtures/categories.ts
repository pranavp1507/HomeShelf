/**
 * Test fixtures for categories
 */

export const testCategories = [
  {
    id: 1,
    name: 'Programming',
    created_at: new Date('2024-01-01'),
  },
  {
    id: 2,
    name: 'Software',
    created_at: new Date('2024-01-02'),
  },
  {
    id: 3,
    name: 'Architecture',
    created_at: new Date('2024-01-03'),
  },
  {
    id: 4,
    name: 'Fiction',
    created_at: new Date('2024-01-04'),
  },
  {
    id: 5,
    name: 'Non-Fiction',
    created_at: new Date('2024-01-05'),
  },
];

export const createCategoryPayload = {
  valid: {
    name: 'New Category',
  },
  validWithSpace: {
    name: 'Science Fiction',
  },
  missingName: {},
  emptyName: {
    name: '',
  },
  duplicateName: {
    name: 'Programming', // Same as testCategories[0]
  },
  whitespaceOnly: {
    name: '   ',
  },
};

export const updateCategoryPayload = {
  valid: {
    name: 'Updated Category',
  },
  duplicateName: {
    name: 'Software', // Duplicate of another category
  },
};

// Book-Category associations
export const bookCategories = [
  { book_id: 1, category_id: 1 }, // Test Book 1 -> Programming
  { book_id: 1, category_id: 2 }, // Test Book 1 -> Software
  { book_id: 2, category_id: 1 }, // Test Book 2 -> Programming
  { book_id: 3, category_id: 4 }, // Borrowed Book -> Fiction
  { book_id: 4, category_id: 1 }, // TypeScript Programming -> Programming
  { book_id: 4, category_id: 2 }, // TypeScript Programming -> Software
  { book_id: 5, category_id: 1 }, // Node.js Cookbook -> Programming
];
