/**
 * Category entity and related types
 */

export interface Category {
  id: number;
  name: string;
  created_at: Date;
}

export interface CategoryInput {
  name: string;
}

export interface CategoryWithCount extends Category {
  bookCount?: number;
}
