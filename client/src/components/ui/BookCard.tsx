import { motion } from 'framer-motion';
import { BookOpen, User, Hash } from 'lucide-react';
import Badge from './Badge';
import { config } from '../../config';

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
}

interface BookCardProps {
  book: Book;
  onClick: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (bookId: number, selected: boolean) => void;
}

const BookCard = ({ book, onClick, selectable = false, selected = false, onSelectChange }: BookCardProps) => {
  const coverImageUrl = book.cover_image_path
    ? `${config.apiUrl.replace('/api', '')}${book.cover_image_path}`
    : null;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectChange) {
      onSelectChange(book.id, !selected);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-background-secondary rounded-lg overflow-hidden cursor-pointer border transition-all duration-200 ${
        selected ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-border hover:border-primary'
      } hover:shadow-lg`}
    >
      {/* Cover Image */}
      <div className="relative aspect-[2/3] bg-background-tertiary flex items-center justify-center overflow-hidden">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={`Cover of ${book.title}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <BookOpen className="h-20 w-20 text-text-tertiary" />
        )}

        {/* Selection Checkbox Overlay */}
        {selectable && (
          <div className="absolute top-2 left-2" onClick={handleCheckboxClick}>
            <input
              type="checkbox"
              checked={selected}
              onChange={() => {}} // Handled by onClick above
              className="h-5 w-5 rounded border-2 border-white cursor-pointer accent-primary"
            />
          </div>
        )}

        {/* Availability Badge Overlay */}
        <div className="absolute top-2 right-2">
          <Badge variant={book.available ? 'success' : 'warning'}>
            {book.available ? 'Available' : 'Borrowed'}
          </Badge>
        </div>
      </div>

      {/* Book Info */}
      <div className="p-4 space-y-2">
        {/* Title */}
        <h3 className="font-semibold text-text-primary line-clamp-2 min-h-[3rem]">
          {book.title}
        </h3>

        {/* Author */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">{book.author}</span>
        </div>

        {/* ISBN */}
        {book.isbn && (
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <Hash className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-1">{book.isbn}</span>
          </div>
        )}

        {/* Categories */}
        {book.categories && book.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {book.categories.slice(0, 2).map((category) => (
              <Badge key={category.id} variant="info" size="sm">
                {category.name}
              </Badge>
            ))}
            {book.categories.length > 2 && (
              <Badge variant="info" size="sm">
                +{book.categories.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BookCard;
