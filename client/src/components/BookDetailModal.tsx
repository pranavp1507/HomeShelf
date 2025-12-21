import { Modal, Badge, Button } from './ui';
import { BookOpen, User, Hash, Tag, Clock, Edit, Trash2, BookPlus, BookCheck } from 'lucide-react';
import { config } from '../config';

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

interface BookDetailModalProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onBorrow?: () => void;
  onReturn?: () => void;
  isAdmin?: boolean;
}

const BookDetailModal = ({
  book,
  open,
  onClose,
  onEdit,
  onDelete,
  onBorrow,
  onReturn,
  isAdmin = false,
}: BookDetailModalProps) => {
  if (!book) return null;

  const coverImageUrl = book.cover_image_path
    ? `${config.apiUrl.replace('/api', '')}${book.cover_image_path}`
    : null;

  return (
    <Modal open={open} onClose={onClose} title="Book Details" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Cover Image */}
        <div className="md:col-span-1">
          <div className="sticky top-0">
            <div className="aspect-[2/3] bg-background-tertiary rounded-lg flex items-center justify-center overflow-hidden border border-border">
              {coverImageUrl ? (
                <img
                  src={coverImageUrl}
                  alt={`Cover of ${book.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpen className="h-24 w-24 text-text-tertiary" />
              )}
            </div>

            {/* Availability Status */}
            <div className="mt-4">
              <Badge
                variant={book.available ? 'success' : 'warning'}
                className="w-full justify-center py-2"
              >
                {book.available ? '✓ Available' : '✗ Currently Borrowed'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Right Column: Book Information */}
        <div className="md:col-span-2 space-y-6">
          {/* Title & Author */}
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">{book.title}</h2>
            <div className="flex items-center gap-2 text-text-secondary">
              <User className="h-5 w-5" />
              <span className="text-lg">{book.author}</span>
            </div>
          </div>

          {/* ISBN */}
          {book.isbn && (
            <div className="flex items-center gap-2 text-text-secondary">
              <Hash className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-xs text-text-tertiary uppercase">ISBN</p>
                <p className="font-mono">{book.isbn}</p>
              </div>
            </div>
          )}

          {/* Categories */}
          {book.categories && book.categories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <Tag className="h-5 w-5" />
                <span className="text-sm font-medium">Categories</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {book.categories.map((category) => (
                  <Badge key={category.id} variant="info">
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {book.description && (
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Description</h3>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {book.description}
              </p>
            </div>
          )}

          {/* Added Date */}
          {book.created_at && (
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <Clock className="h-4 w-4" />
              <span>Added {new Date(book.created_at).toLocaleDateString()}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            {/* Borrow/Return Button */}
            {book.available && onBorrow && (
              <Button
                variant="primary"
                icon={<BookPlus className="h-5 w-5" />}
                onClick={() => {
                  onBorrow();
                  onClose();
                }}
              >
                Borrow Book
              </Button>
            )}
            {!book.available && onReturn && (
              <Button
                variant="secondary"
                icon={<BookCheck className="h-5 w-5" />}
                onClick={() => {
                  onReturn();
                  onClose();
                }}
              >
                Return Book
              </Button>
            )}

            {/* Admin Actions */}
            {isAdmin && onEdit && (
              <Button
                variant="outline"
                icon={<Edit className="h-5 w-5" />}
                onClick={() => {
                  onEdit();
                  onClose();
                }}
              >
                Edit
              </Button>
            )}
            {isAdmin && onDelete && (
              <Button
                variant="ghost"
                icon={<Trash2 className="h-5 w-5" />}
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BookDetailModal;
