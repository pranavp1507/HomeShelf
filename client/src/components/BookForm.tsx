import { useState, useEffect } from 'react';
import { config } from '../config';
import { Upload, Search, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Modal, Button, Input, MultiSelect, type MultiSelectOption } from './ui';
import { apiFetch } from '../utils/api';

interface Category {
  id: number;
  name: string;
}

interface Book {
  id?: number;
  title: string;
  author: string;
  isbn: string;
  available?: boolean;
  cover_image_path?: string;
  categories?: Category[];
}

interface BookFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (book: Book) => Promise<Book>;
  bookToEdit?: Book | null;
}


const BookForm = ({ open, onClose, onSubmit, bookToEdit }: BookFormProps) => {
  const [book, setBook] = useState<Book>({ title: '', author: '', isbn: '' });
  const [lookupIsbn, setLookupIsbn] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (bookToEdit) {
      setBook(bookToEdit);
      setLookupIsbn(bookToEdit.isbn);
      setCoverPreview(bookToEdit.cover_image_path ? `${config.apiUrl.replace('/api', '')}${bookToEdit.cover_image_path}` : null);
      setSelectedCategories(bookToEdit.categories || []);
    } else {
      setBook({ title: '', author: '', isbn: '' });
      setLookupIsbn('');
      setCoverPreview(null);
      setSelectedCategories([]);
    }
    setCoverFile(null);
    fetchAllCategories();
  }, [bookToEdit, open, token]);

  const handleLookup = async () => {
    if (!lookupIsbn) return;

    setLookupLoading(true);
    try {
      const response = await apiFetch(`${config.apiUrl}/books/lookup`, {
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
        isbn: lookupIsbn,
      }));
      setCoverPreview(data.coverUrl || null);
    } catch (error) {
      console.error('Error during ISBN lookup:', error);
    } finally {
      setLookupLoading(false);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const response = await apiFetch(`${config.apiUrl}/categories`);
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
      setCoverPreview(bookToEdit?.cover_image_path ? `${config.apiUrl.replace('/api', '')}${bookToEdit.cover_image_path}` : null);
    }
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setBook((prevBook) => ({ ...prevBook, cover_image_path: undefined }));
  };

  const handleCombinedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const bookDataWithCategories = {
        ...book,
        categoryIds: selectedCategories.map(cat => cat.id),
      };

      const submittedBook = await onSubmit(bookDataWithCategories);

      if (submittedBook && submittedBook.id && (coverFile || book.cover_image_path === undefined)) {
        if (coverFile) {
          const formData = new FormData();
          formData.append('cover', coverFile);

          const response = await apiFetch(`${config.apiUrl}/books/${submittedBook.id}/cover`, {
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

          // Get the updated book with new cover path and update preview
          const updatedBook = await response.json();
          if (updatedBook.cover_image_path) {
            setCoverPreview(`${config.apiUrl.replace('/api', '')}${updatedBook.cover_image_path}`);
          }
        } else if (book.cover_image_path === undefined && bookToEdit?.cover_image_path) {
          const response = await apiFetch(`${config.apiUrl}/books/${submittedBook.id}`, {
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
      throw error;
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={bookToEdit ? 'Edit Book' : 'Add New Book'}
      size="md"
    >
      <form onSubmit={handleCombinedSubmit} className="space-y-6">
        {/* ISBN Lookup */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              label="Lookup by ISBN/UPC"
              value={lookupIsbn}
              onChange={(e) => setLookupIsbn(e.target.value)}
              placeholder="Enter ISBN to lookup book details"
              fullWidth
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleLookup}
              variant="outline"
              loading={lookupLoading}
              icon={<Search className="h-5 w-5" />}
            >
              Lookup
            </Button>
          </div>
        </div>

        {/* Book Details */}
        <Input
          label="Title"
          name="title"
          value={book.title}
          onChange={handleChange}
          required
          fullWidth
          autoFocus
        />

        <Input
          label="Author"
          name="author"
          value={book.author}
          onChange={handleChange}
          required
          fullWidth
        />

        <Input
          label="ISBN"
          name="isbn"
          value={book.isbn}
          onChange={handleChange}
          fullWidth
        />

        {/* Categories */}
        <MultiSelect
          label="Categories"
          options={allCategories as MultiSelectOption[]}
          value={selectedCategories as MultiSelectOption[]}
          onChange={setSelectedCategories}
          placeholder="Select categories"
          fullWidth
        />

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Book Cover
          </label>
          <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="w-24 h-32 border-2 border-dashed border-border rounded-lg overflow-hidden flex items-center justify-center bg-background-secondary">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Book cover preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-text-tertiary" />
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-2">
              <label htmlFor="cover-upload" className="block">
                <input
                  accept="image/*"
                  id="cover-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Upload className="h-4 w-4" />}
                  className="cursor-pointer"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                >
                  {coverFile ? 'Change Cover' : 'Upload Cover'}
                </Button>
              </label>

              {coverPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCover}
                  icon={<X className="h-4 w-4" />}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Remove Cover
                </Button>
              )}

              <p className="text-xs text-text-secondary">
                Recommended: 300x400px, max 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={submitLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitLoading}
          >
            {bookToEdit ? 'Save Changes' : 'Add Book'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BookForm;
