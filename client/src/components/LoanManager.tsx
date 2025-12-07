import { useState } from 'react';
import { config } from '../config';
import { BookPlus, BookCheck } from 'lucide-react';
import { Card, Button, Select } from './ui';
import { useAuth } from './AuthContext';

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  available: boolean;
}

interface Member {
  id: number;
  name: string;
  email: string;
}

interface LoanManagerProps {
  books: Book[];
  members: Member[];
  onLoanChange: () => void;
  setNotification: (notification: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }) => void;
}


const LoanManager = ({ books, members, onLoanChange, setNotification }: LoanManagerProps) => {
  const { token } = useAuth();
  const [selectedBookToBorrow, setSelectedBookToBorrow] = useState<number | ''>('');
  const [selectedMember, setSelectedMember] = useState<number | ''>('');
  const [selectedBookToReturn, setSelectedBookToReturn] = useState<number | ''>('');

  const availableBooks = books.filter(book => book.available);
  const borrowedBooks = books.filter(book => !book.available);

  const handleBorrow = async () => {
    if (!selectedBookToBorrow || !selectedMember) {
      setNotification({ open: true, message: 'Please select a book and a member to borrow.', severity: 'warning' });
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/loans/borrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ book_id: selectedBookToBorrow, member_id: selectedMember }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to borrow book');
      }

      setNotification({ open: true, message: 'Book borrowed successfully!', severity: 'success' });
      setSelectedBookToBorrow('');
      setSelectedMember('');
      onLoanChange();
    } catch (err: any) {
      setNotification({ open: true, message: err.message, severity: 'error' });
    }
  };

  const handleReturn = async () => {
    if (!selectedBookToReturn) {
      setNotification({ open: true, message: 'Please select a book to return.', severity: 'warning' });
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/loans/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ book_id: selectedBookToReturn }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to return book');
      }

      setNotification({ open: true, message: 'Book returned successfully!', severity: 'success' });
      setSelectedBookToReturn('');
      onLoanChange();
    } catch (err: any) {
      setNotification({ open: true, message: err.message, severity: 'error' });
    }
  };

  // Prepare options for Select components
  const bookBorrowOptions = [
    { value: '', label: 'Select a book' },
    ...availableBooks.map(book => ({
      value: book.id,
      label: `${book.title} by ${book.author}`
    }))
  ];

  const memberOptions = [
    { value: '', label: 'Select a member' },
    ...members.map(member => ({
      value: member.id,
      label: `${member.name} (${member.email})`
    }))
  ];

  const bookReturnOptions = [
    { value: '', label: 'Select a book' },
    ...borrowedBooks.map(book => ({
      value: book.id,
      label: `${book.title} by ${book.author}`
    }))
  ];

  return (
    <div className="space-y-6 mt-6">
      {/* Borrow Book Section */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BookPlus className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-text-primary">Borrow Book</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Select
              label="Book"
              value={selectedBookToBorrow}
              onChange={(e) => setSelectedBookToBorrow(Number(e.target.value) || '')}
              options={bookBorrowOptions}
              fullWidth
            />
          </div>

          <div className="flex-1 w-full">
            <Select
              label="Member"
              value={selectedMember}
              onChange={(e) => setSelectedMember(Number(e.target.value) || '')}
              options={memberOptions}
              fullWidth
            />
          </div>

          <Button
            variant="primary"
            onClick={handleBorrow}
            className="w-full sm:w-auto"
          >
            Borrow
          </Button>
        </div>
      </Card>

      {/* Return Book Section */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BookCheck className="h-6 w-6 text-secondary" />
          <h2 className="text-xl font-semibold text-text-primary">Return Book</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Select
              label="Book"
              value={selectedBookToReturn}
              onChange={(e) => setSelectedBookToReturn(Number(e.target.value) || '')}
              options={bookReturnOptions}
              fullWidth
            />
          </div>

          <Button
            variant="secondary"
            onClick={handleReturn}
            className="w-full sm:w-auto"
          >
            Return
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LoanManager;
