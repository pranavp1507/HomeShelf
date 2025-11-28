/**
 * Test fixtures for loans
 */

export const testLoans = [
  {
    id: 1,
    book_id: 3,
    member_id: 1,
    borrow_date: new Date('2024-01-01'),
    due_date: new Date('2024-01-15'),
    return_date: null,
    created_at: new Date('2024-01-01'),
  },
  {
    id: 2,
    book_id: 1,
    member_id: 2,
    borrow_date: new Date('2023-12-01'),
    due_date: new Date('2023-12-15'),
    return_date: new Date('2023-12-14'),
    created_at: new Date('2023-12-01'),
  },
  {
    id: 3,
    book_id: 2,
    member_id: 1,
    borrow_date: new Date('2023-11-01'),
    due_date: new Date('2023-11-15'),
    return_date: new Date('2023-11-20'),
    created_at: new Date('2023-11-01'),
  },
];

// Create overdue loan (due date in the past)
export const overdueLoan = {
  id: 4,
  book_id: 4,
  member_id: 3,
  borrow_date: new Date('2023-12-01'),
  due_date: new Date('2023-12-15'), // Past date
  return_date: null,
  created_at: new Date('2023-12-01'),
};

export const borrowBookPayload = {
  valid: {
    bookId: 1,
    memberId: 1,
  },
  unavailableBook: {
    bookId: 3, // This book is already borrowed
    memberId: 2,
  },
  nonExistentBook: {
    bookId: 999,
    memberId: 1,
  },
  nonExistentMember: {
    bookId: 1,
    memberId: 999,
  },
  missingBookId: {
    memberId: 1,
  },
  missingMemberId: {
    bookId: 1,
  },
};

export const returnBookPayload = {
  valid: {
    loanId: 1,
  },
  alreadyReturned: {
    loanId: 2,
  },
  nonExistentLoan: {
    loanId: 999,
  },
  missingLoanId: {},
};

export const loanFilters = {
  active: { status: 'active' },
  overdue: { status: 'overdue' },
  returned: { status: 'returned' },
  all: {},
  byBook: { search: 'Test Book' },
  byMember: { search: 'John Doe' },
};

export const loanDates = {
  // Helper to calculate due date (14 days from borrow date)
  calculateDueDate: (borrowDate: Date): Date => {
    const dueDate = new Date(borrowDate);
    dueDate.setDate(dueDate.getDate() + 14);
    return dueDate;
  },

  // Check if loan is overdue
  isOverdue: (dueDate: Date, returnDate: Date | null): boolean => {
    if (returnDate) return false;
    return new Date() > new Date(dueDate);
  },
};
