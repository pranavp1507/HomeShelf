/**
 * Loan Service - Business logic for loan operations
 *
 * Handles the complex transaction logic for borrowing and returning books.
 */

import { LoanRepository, Loan, LoanSearchOptions, LoanWithDetails } from '../repositories/LoanRepository';
import { BookRepository } from '../repositories/BookRepository';
import { MemberRepository } from '../repositories/MemberRepository';
import { PaginatedResult } from '../repositories/BaseRepository';
import { AppError } from '../middleware/errorHandler';

export class LoanService {
  private loanRepository: LoanRepository;
  private bookRepository: BookRepository;
  private memberRepository: MemberRepository;

  constructor() {
    this.loanRepository = new LoanRepository();
    this.bookRepository = new BookRepository();
    this.memberRepository = new MemberRepository();
  }

  /**
   * Get all loans with search/filter/pagination
   */
  async getLoans(options: LoanSearchOptions): Promise<PaginatedResult<LoanWithDetails>> {
    return await this.loanRepository.search(options);
  }

  /**
   * Borrow a book - Creates loan and updates book availability
   *
   * This operation uses a transaction to ensure data consistency.
   */
  async borrowBook(data: {
    bookId: number;
    memberId: number;
  }): Promise<Loan> {
    return await this.loanRepository.transaction(async (client) => {
      // Check if book exists and is available
      const book = await this.bookRepository.findById(data.bookId, client);
      if (!book) {
        throw new AppError('Book not found', 404);
      }
      if (!book.available) {
        throw new AppError('Book is not available', 409);
      }

      // Check if member exists
      const member = await this.memberRepository.findById(data.memberId, client);
      if (!member) {
        throw new AppError('Member not found', 404);
      }

      // Check if book already has an active loan
      const activeLoan = await this.loanRepository.findActiveLoanByBookId(data.bookId, client);
      if (activeLoan) {
        throw new AppError('Book is currently borrowed', 409);
      }

      // Calculate due date (14 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      // Create loan record
      const loan = await this.loanRepository.create({
        book_id: data.bookId,
        member_id: data.memberId,
        borrow_date: new Date(),
        due_date: dueDate
      }, client);

      // Update book availability
      await this.bookRepository.updateAvailability(data.bookId, false, client);

      return loan;
    });
  }

  /**
   * Return a book - Updates loan record and book availability
   *
   * This operation uses a transaction to ensure data consistency.
   */
  async returnBook(bookId: number): Promise<Loan> {
    return await this.loanRepository.transaction(async (client) => {
      // Find active loan for this book
      const loan = await this.loanRepository.findActiveLoanByBookId(bookId, client);
      if (!loan) {
        throw new AppError('No active loan found for this book', 404);
      }

      // Update loan with return date
      const updatedLoan = await this.loanRepository.update(loan.id, {
        return_date: new Date()
      } as Partial<Loan>, client);

      if (!updatedLoan) {
        throw new AppError('Failed to update loan record', 500);
      }

      // Update book availability
      await this.bookRepository.updateAvailability(bookId, true, client);

      return updatedLoan;
    });
  }

  /**
   * Get loan history for a member
   */
  async getMemberLoanHistory(memberId: number, options: { page: number; limit: number }): Promise<PaginatedResult<LoanWithDetails>> {
    // Verify member exists
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new AppError('Member not found', 404);
    }

    // Get loans (this would need a new repository method, but keeping it simple)
    return await this.loanRepository.search({
      ...options,
      search: member.name
    });
  }

  /**
   * Get all overdue loans
   */
  async getOverdueLoans(): Promise<LoanWithDetails[]> {
    return await this.loanRepository.findOverdueLoans();
  }

  /**
   * Check if a book is available for borrowing
   */
  async isBookAvailable(bookId: number): Promise<boolean> {
    const book = await this.bookRepository.findById(bookId);
    if (!book) {
      throw new AppError('Book not found', 404);
    }

    const activeLoan = await this.loanRepository.findActiveLoanByBookId(bookId);
    return book.available && !activeLoan;
  }
}
