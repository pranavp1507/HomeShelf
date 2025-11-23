import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

// Define types for Book and Member
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const LoanManager: React.FC<LoanManagerProps> = ({ books, members, onLoanChange, setNotification }) => {
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
      const response = await fetch(`${API_URL}/loans/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: selectedBookToBorrow, member_id: selectedMember }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to borrow book');
      }

      setNotification({ open: true, message: 'Book borrowed successfully!', severity: 'success' });
      setSelectedBookToBorrow('');
      setSelectedMember('');
      onLoanChange(); // Refresh data in the parent component
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
      const response = await fetch(`${API_URL}/loans/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: selectedBookToReturn }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to return book');
      }

      setNotification({ open: true, message: 'Book returned successfully!', severity: 'success' });
      setSelectedBookToReturn('');
      onLoanChange(); // Refresh data in the parent component
    } catch (err: any) {
      setNotification({ open: true, message: err.message, severity: 'error' });
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Borrow Book</Typography>
      <Box component="form" sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center' }}>
        <FormControl fullWidth>
          <InputLabel id="book-borrow-label">Book</InputLabel>
          <Select
            labelId="book-borrow-label"
            value={selectedBookToBorrow}
            label="Book"
            onChange={(e) => setSelectedBookToBorrow(e.target.value as number)}
          >
            {availableBooks.map((book) => (
              <MenuItem key={book.id} value={book.id}>{book.title} by {book.author}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="member-borrow-label">Member</InputLabel>
          <Select
            labelId="member-borrow-label"
            value={selectedMember}
            label="Member"
            onChange={(e) => setSelectedMember(e.target.value as number)}
          >
            {members.map((member) => (
              <MenuItem key={member.id} value={member.id}>{member.name} ({member.email})</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleBorrow} sx={{ padding: '15px 24px' }}>Borrow</Button>
      </Box>

      <Typography variant="h5" gutterBottom>Return Book</Typography>
      <Box component="form" sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl fullWidth>
          <InputLabel id="book-return-label">Book</InputLabel>
          <Select
            labelId="book-return-label"
            value={selectedBookToReturn}
            label="Book"
            onChange={(e) => setSelectedBookToReturn(e.target.value as number)}
          >
            {borrowedBooks.map((book) => (
              <MenuItem key={book.id} value={book.id}>{book.title} by {book.author}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" color="secondary" onClick={handleReturn} sx={{ padding: '15px 24px' }}>Return</Button>
      </Box>
    </Box>
  );
};

export default LoanManager;
