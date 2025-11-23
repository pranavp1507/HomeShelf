import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Avatar,
  Chip,
  Box,
  TableSortLabel, // Import TableSortLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Category {
  id: number;
  name: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  available: boolean;
  cover_image_path?: string;
  categories?: Category[];
}

interface BookListProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
  sortBy: string; // Current sort column
  sortOrder: 'asc' | 'desc'; // Current sort order
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void; // Callback for sort change
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const BookList: React.FC<BookListProps> = ({ books, onEdit, onDelete, sortBy, sortOrder, onSortChange }) => {
  const handleSortRequest = (columnId: string) => {
    const isAsc = sortBy === columnId && sortOrder === 'asc';
    onSortChange(columnId, isAsc ? 'desc' : 'asc');
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Cover</TableCell>
            <TableCell sortDirection={sortBy === 'title' ? sortOrder : false}>
              <TableSortLabel
                active={sortBy === 'title'}
                direction={sortBy === 'title' ? sortOrder : 'asc'}
                onClick={() => handleSortRequest('title')}
              >
                Title
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortBy === 'author' ? sortOrder : false}>
              <TableSortLabel
                active={sortBy === 'author'}
                direction={sortBy === 'author' ? sortOrder : 'asc'}
                onClick={() => handleSortRequest('author')}
              >
                Author
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortBy === 'isbn' ? sortOrder : false}>
              <TableSortLabel
                active={sortBy === 'isbn'}
                direction={sortBy === 'isbn' ? sortOrder : 'asc'}
                onClick={() => handleSortRequest('isbn')}
              >
                ISBN
              </TableSortLabel>
            </TableCell>
            <TableCell>Categories</TableCell>
            <TableCell sortDirection={sortBy === 'available' ? sortOrder : false}>
              <TableSortLabel
                active={sortBy === 'available'}
                direction={sortBy === 'available' ? sortOrder : 'asc'}
                onClick={() => handleSortRequest('available')}
              >
                Status
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {books.map((book) => (
            <TableRow key={book.id}>
              <TableCell>
                <Avatar
                  src={book.cover_image_path ? `${API_URL}${book.cover_image_path}` : undefined}
                  variant="square"
                  sx={{ width: 50, height: 50 }}
                >
                  {!book.cover_image_path && book.title.charAt(0)}
                </Avatar>
              </TableCell>
              <TableCell>{book.title}</TableCell>
              <TableCell>{book.author}</TableCell>
              <TableCell>{book.isbn}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {book.categories?.map((category) => (
                    <Chip key={category.id} label={category.name} size="small" />
                  ))}
                </Box>
              </TableCell>
              <TableCell>{book.available ? 'Available' : 'Borrowed'}</TableCell>
              <TableCell align="right">
                <IconButton aria-label="edit" onClick={() => onEdit(book)}>
                  <EditIcon />
                </IconButton>
                <IconButton aria-label="delete" onClick={() => onDelete(book.id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BookList;
