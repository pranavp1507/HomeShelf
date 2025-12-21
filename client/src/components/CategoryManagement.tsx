import { useState, useEffect } from 'react';
import { config } from '../config';
import { apiFetch } from '../utils/api';
import { Edit2, Trash2, Plus, FolderTree } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Modal, EmptyState, ErrorMessage } from './ui';

interface Category {
  id: number;
  name: string;
}


const CategoryManagement = () => {
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
      const response = await apiFetch(`${config.apiUrl}/categories`);
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
      const response = await apiFetch(`${config.apiUrl}/categories`, {
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
      const response = await apiFetch(`${config.apiUrl}/categories/${editCategory.id}`, {
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
        const response = await apiFetch(`${config.apiUrl}/categories/${id}`, {
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300 font-medium">
            Access Denied: You must be an administrator to manage categories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FolderTree className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-text-primary">Category Management</h1>
      </div>

      {/* Add Category Section */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              label="New Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              fullWidth
              placeholder="Enter category name"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="primary"
              icon={<Plus className="h-5 w-5" />}
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
              className="w-full sm:w-auto"
            >
              Add Category
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      {/* Categories Table */}
      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderTree}
            title="No Categories Yet"
            description="Create your first category using the form above to organize your book collection!"
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">Name</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-border hover:bg-background-secondary transition-colors">
                    <td className="py-3 px-4 text-sm text-text-primary">{category.id}</td>
                    <td className="py-3 px-4 text-sm text-text-primary font-medium">{category.name}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(category)}
                          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                          aria-label="Edit category"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                          aria-label="Delete category"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                }
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Dialog */}
      <Modal
        open={openDialog}
        onClose={handleEditDialogClose}
        title="Edit Category"
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEditSubmit();
          }}
          className="space-y-4"
        >
          <Input
            label="Category Name"
            value={editCategory?.name || ''}
            onChange={(e) => setEditCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
            fullWidth
            autoFocus
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handleEditDialogClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!editCategory?.name.trim()}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
