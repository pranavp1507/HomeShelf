/**
 * File Upload Utilities Tests
 *
 * Tests for file upload configuration including:
 * - Cover image upload configuration
 * - CSV file upload configuration
 * - File type validation
 * - File size limits
 */

import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { uploadsDir, coverUpload, csvUpload } from '../../src/utils/fileUpload';

describe('File Upload Utilities', () => {
  describe('uploadsDir', () => {
    it('should define uploads directory path', () => {
      expect(uploadsDir).toBeDefined();
      expect(typeof uploadsDir).toBe('string');
      expect(uploadsDir).toContain('uploads');
    });

    it('should create uploads directory if it does not exist', () => {
      expect(fs.existsSync(uploadsDir)).toBe(true);
    });
  });

  describe('coverUpload configuration', () => {
    it('should be defined', () => {
      expect(coverUpload).toBeDefined();
    });

    it('should have storage configuration', () => {
      expect(coverUpload).toHaveProperty('storage');
    });

    it('should have limits configuration', () => {
      // @ts-ignore - accessing private property for testing
      const limits = coverUpload.limits;
      expect(limits).toBeDefined();
      expect(limits?.fileSize).toBe(5 * 1024 * 1024); // 5MB
    });

    describe('fileFilter for cover images', () => {
      let mockRequest: Partial<Request>;
      let callback: jest.Mock;

      beforeEach(() => {
        mockRequest = {
          params: { id: '1' },
        };
        callback = jest.fn();
      });

      it('should accept jpeg files', () => {
        const file: Express.Multer.File = {
          fieldname: 'cover',
          originalname: 'test.jpeg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore - accessing private method for testing
        coverUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(null, true);
      });

      it('should accept jpg files', () => {
        const file: Express.Multer.File = {
          fieldname: 'cover',
          originalname: 'test.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        coverUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(null, true);
      });

      it('should accept png files', () => {
        const file: Express.Multer.File = {
          fieldname: 'cover',
          originalname: 'test.png',
          encoding: '7bit',
          mimetype: 'image/png',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        coverUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(null, true);
      });

      it('should accept gif files', () => {
        const file: Express.Multer.File = {
          fieldname: 'cover',
          originalname: 'test.gif',
          encoding: '7bit',
          mimetype: 'image/gif',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        coverUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(null, true);
      });

      it('should reject PDF files', () => {
        const file: Express.Multer.File = {
          fieldname: 'cover',
          originalname: 'test.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        coverUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Only images'),
          })
        );
      });

      it('should reject text files', () => {
        const file: Express.Multer.File = {
          fieldname: 'cover',
          originalname: 'test.txt',
          encoding: '7bit',
          mimetype: 'text/plain',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        coverUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Only images'),
          })
        );
      });

      it('should reject executable files', () => {
        const file: Express.Multer.File = {
          fieldname: 'cover',
          originalname: 'test.exe',
          encoding: '7bit',
          mimetype: 'application/octet-stream',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        coverUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Only images'),
          })
        );
      });

      it('should reject files with no extension', () => {
        const file: Express.Multer.File = {
          fieldname: 'cover',
          originalname: 'test',
          encoding: '7bit',
          mimetype: 'application/octet-stream',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        coverUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Only images'),
          })
        );
      });

      it('should handle uppercase extensions', () => {
        const file: Express.Multer.File = {
          fieldname: 'cover',
          originalname: 'test.JPG',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        coverUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(null, true);
      });
    });
  });

  describe('csvUpload configuration', () => {
    it('should be defined', () => {
      expect(csvUpload).toBeDefined();
    });

    it('should have limits configuration', () => {
      // @ts-ignore
      const limits = csvUpload.limits;
      expect(limits).toBeDefined();
      expect(limits?.fileSize).toBe(10 * 1024 * 1024); // 10MB
    });

    describe('fileFilter for CSV files', () => {
      let mockRequest: Partial<Request>;
      let callback: jest.Mock;

      beforeEach(() => {
        mockRequest = {};
        callback = jest.fn();
      });

      it('should accept CSV files with correct mimetype', () => {
        const file: Express.Multer.File = {
          fieldname: 'csv',
          originalname: 'books.csv',
          encoding: '7bit',
          mimetype: 'text/csv',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        csvUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(null, true);
      });

      it('should accept CSV files by extension', () => {
        const file: Express.Multer.File = {
          fieldname: 'csv',
          originalname: 'books.csv',
          encoding: '7bit',
          mimetype: 'application/octet-stream', // Sometimes CSV has this mimetype
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        csvUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(null, true);
      });

      it('should reject non-CSV files', () => {
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'document.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        csvUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Only CSV files'),
          })
        );
      });

      it('should reject image files', () => {
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'image.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        csvUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Only CSV files'),
          })
        );
      });

      it('should reject Excel files', () => {
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'spreadsheet.xlsx',
          encoding: '7bit',
          mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        csvUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Only CSV files'),
          })
        );
      });

      it('should handle uppercase .CSV extension', () => {
        const file: Express.Multer.File = {
          fieldname: 'csv',
          originalname: 'BOOKS.CSV',
          encoding: '7bit',
          mimetype: 'text/csv',
          size: 1024,
          destination: '',
          filename: '',
          path: '',
          buffer: Buffer.from(''),
          stream: null as any,
        };

        // @ts-ignore
        csvUpload.fileFilter(mockRequest as Request, file, callback);

        expect(callback).toHaveBeenCalledWith(null, true);
      });
    });
  });
});
