/**
 * Book entity and related types
 */

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  available: boolean;
  cover_image_path?: string | null;
  description?: string | null;
  created_at: Date;
}

export interface BookInput {
  title: string;
  author: string;
  isbn: string;
  description?: string;
  categoryIds?: number[];
}

export interface BookFilter {
  category?: string;
  availability?: 'all' | 'available' | 'borrowed';
  search?: string;
}

export interface BookQueryParams {
  page?: string;
  limit?: string;
  category?: string;
  categoryIds?: string;
  availability?: string;
  availableStatus?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BookWithCategories extends Book {
  categories?: string[];
}

export interface BookLookupResult {
  title?: string;
  author?: string;
  isbn?: string;
  coverImageUrl?: string;
  description?: string;
  publishedDate?: string;
}
