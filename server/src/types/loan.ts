/**
 * Loan entity and related types
 */

export interface Loan {
  id: number;
  book_id: number;
  member_id: number;
  borrow_date: Date;
  due_date: Date;
  return_date: Date | null;
  created_at: Date;
}

export interface LoanWithDetails extends Loan {
  book_title?: string;
  book_author?: string;
  member_name?: string;
  member_email?: string;
  is_overdue?: boolean;
}

export interface BorrowRequest {
  bookId: number;
  memberId: number;
}

export interface ReturnRequest {
  loanId: number;
}

export interface LoanQueryParams {
  page?: string;
  limit?: string;
  status?: 'all' | 'active' | 'returned' | 'overdue';
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export type LoanStatus = 'active' | 'returned' | 'overdue';

export interface LoanStats {
  totalLoans: number;
  activeLoans: number;
  returnedLoans: number;
  overdueLoans: number;
}
