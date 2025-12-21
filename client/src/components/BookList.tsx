import { useState } from 'react';
import { motion } from 'framer-motion';
import { config } from '../config';
import { Edit2, Trash2, ChevronUp, ChevronDown, BookOpen, Plus, Grid3x3, List } from 'lucide-react';
import { Badge, EmptyState, BookCard } from './ui';
import BookDetailModal from './BookDetailModal';
import { useAuth } from './AuthContext';

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
  description?: string;
  categories?: Category[];
  created_at?: string;
}

interface BookListProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}


interface SortableHeaderProps {
  label: string;
  columnId: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (columnId: string) => void;
}

const SortableHeader = ({ label, columnId, sortBy, sortOrder, onSort }: SortableHeaderProps) => {
  const isActive = sortBy === columnId;

  return (
    <button
      onClick={() => onSort(columnId)}
      className="flex items-center gap-1 font-semibold text-text-primary hover:text-primary transition-colors"
    >
      {label}
      {isActive ? (
        sortOrder === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      ) : (
        <ChevronDown className="h-4 w-4 opacity-30" />
      )}
    </button>
  );
};

const BookList = ({ books, onEdit, onDelete, onAdd, sortBy, sortOrder, onSortChange }: BookListProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // View mode state - default to grid view
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    const saved = localStorage.getItem('bookViewMode');
    return (saved === 'table' || saved === 'grid') ? saved : 'grid';
  });

  // Selected book for detail modal
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const handleSortRequest = (columnId: string) => {
    const isAsc = sortBy === columnId && sortOrder === 'asc';
    onSortChange(columnId, isAsc ? 'desc' : 'asc');
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'table' ? 'grid' : 'table';
    setViewMode(newMode);
    localStorage.setItem('bookViewMode', newMode);
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setDetailModalOpen(true);
  };

  const handleDetailModalClose = () => {
    setDetailModalOpen(false);
    setTimeout(() => setSelectedBook(null), 200); // Delay to allow modal animation to complete
  };

  if (books.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-md">
        <EmptyState
          icon={BookOpen}
          title="No Books Found"
          description="Your library is empty. Start building your collection by adding your first book!"
          action={{
            label: 'Add Your First Book',
            onClick: onAdd,
            icon: <Plus className="h-5 w-5" />,
          }}
        />
      </div>
    );
  }

  return (
    <>
      {/* View Toggle Button */}
      <div className="flex justify-end mb-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleViewMode}
          className="flex items-center gap-2 px-4 py-2 bg-background-secondary border border-border rounded-lg hover:bg-background-tertiary transition-colors text-text-primary"
        >
          {viewMode === 'table' ? (
            <>
              <Grid3x3 className="h-5 w-5" />
              <span>Grid View</span>
            </>
          ) : (
            <>
              <List className="h-5 w-5" />
              <span>Table View</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {books.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
            >
              <BookCard book={book} onClick={() => handleBookClick(book)} />
            </motion.div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-surface rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
        <table className="w-full min-w-[650px]">
          <thead className="bg-background-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Cover</th>
              <th className="px-4 py-3 text-left text-sm">
                <SortableHeader
                  label="Title"
                  columnId="title"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSortRequest}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm">
                <SortableHeader
                  label="Author"
                  columnId="author"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSortRequest}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm">
                <SortableHeader
                  label="ISBN"
                  columnId="isbn"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSortRequest}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Categories</th>
              <th className="px-4 py-3 text-left text-sm">
                <SortableHeader
                  label="Status"
                  columnId="available"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSortRequest}
                />
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-text-primary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {books.map((book, index) => (
                <motion.tr
                  key={book.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className="hover:bg-background-secondary transition-colors"
                >
                  <td className="px-4 py-3">
                    {book.cover_image_path ? (
                      <img
                        src={`${config.apiUrl.replace('/api', '')}${book.cover_image_path}`}
                        alt={`Cover of ${book.title}`}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                        <span className="text-primary font-semibold text-lg">
                          {book.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-primary font-medium">{book.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{book.author}</td>
                  <td className="px-4 py-3 text-text-secondary font-mono text-sm">{book.isbn}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {book.categories && book.categories.length > 0 ? (
                        book.categories.map((category) => (
                          <Badge key={category.id} variant="info" size="sm">
                            {category.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-text-tertiary text-sm">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={book.available ? 'success' : 'warning'} size="sm">
                      {book.available ? 'Available' : 'Borrowed'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEdit(book)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        aria-label="Edit book"
                      >
                        <Edit2 className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDelete(book.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        aria-label="Delete book"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )}

      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        open={detailModalOpen}
        onClose={handleDetailModalClose}
        onEdit={selectedBook ? () => onEdit(selectedBook) : undefined}
        onDelete={selectedBook ? () => onDelete(selectedBook.id) : undefined}
        isAdmin={isAdmin}
      />
    </>
  );
};

export default BookList;
