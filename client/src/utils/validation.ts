/**
 * Validation utilities for form inputs
 */

export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validateRequired = (value: string, fieldName: string = 'This field'): string | null => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string = 'This field'): string | null => {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string = 'This field'): string | null => {
  if (value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`;
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return null; // Phone is optional
  const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }
  if (phone.replace(/[^0-9]/g, '').length < 10) {
    return 'Phone number must be at least 10 digits';
  }
  return null;
};

export const validateISBN = (isbn: string): string | null => {
  if (!isbn) return null; // ISBN is optional
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
    return 'ISBN must be 10 or 13 digits';
  }
  if (!/^\d+$/.test(cleanISBN)) {
    return 'ISBN must contain only numbers';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const validateUsername = (username: string): string | null => {
  if (!username) {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (username.length > 50) {
    return 'Username must not exceed 50 characters';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, hyphens, and underscores';
  }
  return null;
};

export const validateBookTitle = (title: string): string | null => {
  const error = validateRequired(title, 'Title');
  if (error) return error;
  return validateMaxLength(title, 500, 'Title');
};

export const validateAuthor = (author: string): string | null => {
  const error = validateRequired(author, 'Author');
  if (error) return error;
  return validateMaxLength(author, 255, 'Author');
};

export const validateMemberName = (name: string): string | null => {
  const error = validateRequired(name, 'Name');
  if (error) return error;
  return validateMaxLength(name, 255, 'Name');
};
