import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

interface Category {
  id: number;
  name: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const CategoryManagement: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard'); // Redirect if not admin
    } else {
      fetchCategories();
    }
  }, [token, user, navigate]);

  const fetchCategories = async () => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddCategory = async () => {
    setError(null);
    if (!newCategoryName.trim()) {
      setError('Category name cannot be empty');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to add category');
      }
      setNewCategoryName('');
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditClick = (category: Category) => {
    setEditCategory(category);
    setOpenDialog(true);
  };

  const handleEditDialogClose = () => {
    setOpenDialog(false);
    setEditCategory(null);
  };

  const handleEditSubmit = async () => {
    setError(null);
    if (!editCategory || !editCategory.name.trim()) {
      setError('Category name cannot be empty');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/categories/${editCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editCategory.name }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update category');
      }
      handleEditDialogClose();
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    setError(null);
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const response = await fetch(`${API_URL}/categories/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to delete category');
        }
        fetchCategories();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Container>
        <Alert severity="error">Access Denied: You must be an administrator to manage categories.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h2" gutterBottom>
        Category Management
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          label="New Category Name"
          variant="outlined"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCategory}
          disabled={!newCategoryName.trim()}
        >
          Add Category
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.id}</TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEditClick(category)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteCategory(category.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleEditDialogClose}>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editCategory?.name || ''}
            onChange={(e) => setEditCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button onClick={handleEditSubmit} disabled={!editCategory?.name.trim()}>Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CategoryManagement;
