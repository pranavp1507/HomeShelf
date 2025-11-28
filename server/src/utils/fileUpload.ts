/**
 * File upload configuration using Multer
 * Handles book cover uploads and CSV imports
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure uploads directory exists
export const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage configuration for book cover images
const coverStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const bookId = req.params.id;
    const newFilename = `${bookId}-${Date.now()}${path.extname(file.originalname)}`;
    console.log(`Multer filename generated: ${newFilename} for bookId: ${bookId}`);
    cb(null, newFilename);
  },
});

// Multer config for cover images
export const coverUpload = multer({
  storage: coverStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: Request, file: Express.Multer.File, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      cb(null, true);
      return;
    }
    cb(new Error('Only images (jpeg, jpg, png, gif) are allowed!'));
  },
});

// Multer config for CSV files (bulk import)
export const csvUpload = multer({
  storage: multer.memoryStorage(), // Store in memory for parsing
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: Request, file: Express.Multer.File, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only CSV files are allowed!'));
  },
});
