import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';

interface Loan {
  id: number;
  book_title: string;
  member_name: string;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const LoanHistory: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/loans`);
        if (!response.ok) {
          throw new Error('Failed to fetch loan history');
        }
        const data = await response.json();
        setLoans(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusChip = (loan: Loan) => {
    if (loan.return_date) {
      return <Chip label="Returned" color="success" size="small" />;
    }
    if (new Date(loan.due_date) < new Date()) {
      return <Chip label="Overdue" color="error" size="small" />;
    }
    return <Chip label="On Loan" color="primary" size="small" />;
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error" align="center" sx={{ mt: 4 }}>{error}</Typography>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Book Title</TableCell>
            <TableCell>Member Name</TableCell>
            <TableCell>Borrowed Date</TableCell>
            <TableCell>Due Date</TableCell>
            <TableCell>Returned Date</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loans.map((loan) => (
            <TableRow key={loan.id}>
              <TableCell>{loan.book_title}</TableCell>
              <TableCell>{loan.member_name}</TableCell>
              <TableCell>{formatDate(loan.borrow_date)}</TableCell>
              <TableCell>{formatDate(loan.due_date)}</TableCell>
              <TableCell>{formatDate(loan.return_date)}</TableCell>
              <TableCell>{getStatusChip(loan)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LoanHistory;
