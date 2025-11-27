/**
 * Input validation middleware
 * Provides reusable validation functions for request data
 */

const { AppError } = require('./errorHandler');

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate ISBN format (ISBN-10 or ISBN-13)
const isValidISBN = (isbn) => {
  const isbn10Regex = /^(?:\d{9}X|\d{10})$/;
  const isbn13Regex = /^\d{13}$/;
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  return isbn10Regex.test(cleanISBN) || isbn13Regex.test(cleanISBN);
};

// Sanitize string input (trim and prevent XSS)
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

// Validation middleware for book creation/update
const validateBook = (req, res, next) => {
  const { title, author, isbn } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return next(new AppError('Title is required and must be a non-empty string', 400));
  }

  if (!author || typeof author !== 'string' || author.trim().length === 0) {
    return next(new AppError('Author is required and must be a non-empty string', 400));
  }

  if (isbn && !isValidISBN(isbn)) {
    return next(new AppError('Invalid ISBN format. Must be ISBN-10 or ISBN-13', 400));
  }

  // Sanitize inputs
  req.body.title = sanitizeString(title);
  req.body.author = sanitizeString(author);
  if (isbn) req.body.isbn = sanitizeString(isbn);

  next();
};

// Validation middleware for member creation/update
const validateMember = (req, res, next) => {
  const { name, email, phone } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return next(new AppError('Name is required and must be a non-empty string', 400));
  }

  if (!email || !isValidEmail(email)) {
    return next(new AppError('Valid email is required', 400));
  }

  if (phone && typeof phone !== 'string') {
    return next(new AppError('Phone must be a string', 400));
  }

  // Sanitize inputs
  req.body.name = sanitizeString(name);
  req.body.email = sanitizeString(email).toLowerCase();
  if (phone) req.body.phone = sanitizeString(phone);

  next();
};

// Validation middleware for user registration/creation
const validateUser = (req, res, next) => {
  const { username, password, role } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return next(new AppError('Username is required and must be at least 3 characters', 400));
  }

  if (req.method === 'POST' && (!password || typeof password !== 'string' || password.length < 6)) {
    return next(new AppError('Password is required and must be at least 6 characters', 400));
  }

  if (role && !['admin', 'member'].includes(role)) {
    return next(new AppError('Role must be either "admin" or "member"', 400));
  }

  // Sanitize inputs
  req.body.username = sanitizeString(username);

  next();
};

// Validation middleware for category creation/update
const validateCategory = (req, res, next) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return next(new AppError('Category name is required and must be a non-empty string', 400));
  }

  // Sanitize input
  req.body.name = sanitizeString(name);

  next();
};

// Validation middleware for loan operations
const validateLoan = (req, res, next) => {
  const { book_id, member_id } = req.body;

  if (!book_id || typeof book_id !== 'number' || book_id <= 0) {
    return next(new AppError('Valid book_id is required', 400));
  }

  if (req.path.includes('borrow') && (!member_id || typeof member_id !== 'number' || member_id <= 0)) {
    return next(new AppError('Valid member_id is required for borrowing', 400));
  }

  next();
};

// Validation middleware for pagination parameters
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return next(new AppError('Page must be a positive integer', 400));
    }
  }

  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return next(new AppError('Limit must be between 1 and 1000', 400));
    }
  }

  next();
};

module.exports = {
  validateBook,
  validateMember,
  validateUser,
  validateCategory,
  validateLoan,
  validatePagination,
  isValidEmail,
  isValidISBN,
  sanitizeString
};
