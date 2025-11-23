import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Avatar,
  Typography,
  Autocomplete,
  Chip,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useAuth } from './AuthContext';

interface Category {
  id: number;
  name: string;
}

// Define the book type (can be shared in a types file later)
interface Book {
  id?: number;
  title: string;
  author: string;
  isbn: string;
  available?: boolean;
  cover_image_path?: string;
  categories?: Category[]; // Add categories
}

interface BookFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (book: Book) => Promise<Book>; // onSubmit should now return a Book
  bookToEdit?: Book | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const BookForm: React.FC<BookFormProps> = ({ open, onClose, onSubmit, bookToEdit }) => {
  const [book, setBook] = useState<Book>({ title: '', author: '', isbn: '' });
  const [lookupIsbn, setLookupIsbn] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    if (bookToEdit) {
      setBook(bookToEdit);
      setLookupIsbn(bookToEdit.isbn);
      setCoverPreview(bookToEdit.cover_image_path ? `${API_URL.replace('/api', '')}${bookToEdit.cover_image_path}` : null);
      setSelectedCategories(bookToEdit.categories || []);
    } else {
      setBook({ title: '', author: '', isbn: '' });
      setLookupIsbn('');
      setCoverPreview(null);
      setSelectedCategories([]);
    }
    setCoverFile(null); // Reset file input
    fetchAllCategories();
  }, [bookToEdit, open, token]);

  const handleLookup = async () => {
    try {
      const response = await fetch(`${API_URL}/books/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isbn: lookupIsbn }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || 'Failed to lookup ISBN');
      }
      const data = await response.json();
      setBook(prev => ({
        ...prev,
        title: data.title || '',
        author: data.author || '',
        isbn: lookupIsbn, // Set the isbn to what was looked up
      }));
      setCoverPreview(data.coverUrl || null);
    } catch (error) {
      console.error('Error during ISBN lookup:', error);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setAllCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBook((prevBook) => ({ ...prevBook, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    } else {
      setCoverFile(null);
      setCoverPreview(bookToEdit?.cover_image_path ? `${API_URL}${bookToEdit.cover_image_path}` : null);
    }
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setBook((prevBook) => ({ ...prevBook, cover_image_path: undefined })); // Indicate removal
  };

  const handleCombinedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bookDataWithCategories = {
        ...book,
        categoryIds: selectedCategories.map(cat => cat.id),
      };

      // Submit book metadata first
      const submittedBook = await onSubmit(bookDataWithCategories); // onSubmit should return the created/updated book with ID

      // If a new cover file is selected or existing cover is removed
      if (submittedBook && submittedBook.id && (coverFile || book.cover_image_path === undefined)) {
        if (coverFile) {
          // Upload new cover
          const formData = new FormData();
          formData.append('cover', coverFile);

          const response = await fetch(`${API_URL}/books/${submittedBook.id}/cover`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload cover image');
          }
        } else if (book.cover_image_path === undefined && bookToEdit?.cover_image_path) {
          // Remove existing cover if user cleared it by setting cover_image_path to null
          const response = await fetch(`${API_URL}/books/${submittedBook.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ ...submittedBook, cover_image_path: null }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to remove cover image');
          }
        }
      }
      onClose();
    } catch (error: any) {
      console.error('Combined submit error:', error);
      // Re-throw or handle error appropriately in App.tsx
      throw error;
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{bookToEdit ? 'Edit Book' : 'Add New Book'}</DialogTitle>
      <form onSubmit={handleCombinedSubmit}>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
              <TextField
                margin="dense"
                name="lookup-isbn"
                label="Lookup by ISBN/UPC"
                type="text"
                fullWidth
                variant="outlined"
                value={lookupIsbn}
                onChange={(e) => setLookupIsbn(e.target.value)}
              />
              <Button onClick={handleLookup} variant="outlined" sx={{ height: '56px' }}>Lookup</Button>
            </Box>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Title"
              type="text"
              fullWidth
              variant="outlined"
              value={book.title}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="author"
              label="Author"
              type="text"
              fullWidth
              variant="outlined"
              value={book.author}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="isbn"
              label="ISBN"
              type="text"
              fullWidth
              variant="outlined"
              value={book.isbn}
              onChange={handleChange}
            />
            <Autocomplete
              multiple
              id="categories-autocomplete"
              options={allCategories}
              getOptionLabel={(option) => option.name}
              value={selectedCategories}
              onChange={(_event, newValue) => {
                setSelectedCategories(newValue);
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option.name} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Categories"
                  placeholder="Select categories"
                  margin="dense"
                  fullWidth
                />
              )}
              sx={{ mt: 1 }}
            />
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              {coverPreview ? (
                <Avatar src={coverPreview} variant="square" sx={{ width: 80, height: 80 }} />
              ) : (
                <Avatar variant="square" sx={{ width: 80, height: 80 }}>
                  <PhotoCamera />
                </Avatar>
              )}
              <Box>
                <Typography variant="subtitle2">Book Cover</Typography>
                <label htmlFor="cover-upload">
                  <input
                    accept="image/*"
                    id="cover-upload"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <IconButton color="primary" component="span">
                    <PhotoCamera />
                  </IconButton>
                  <Button variant="outlined" component="span">
                    {coverFile ? 'Change Cover' : 'Upload Cover'}
                  </Button>
                </label>
                {coverPreview && (
                  <Button
                    color="error"
                    size="small"
                    onClick={handleRemoveCover}
                    sx={{ ml: 1 }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit">{bookToEdit ? 'Save Changes' : 'Add Book'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BookForm;
