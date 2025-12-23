import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, CheckCircle, XCircle, Tag, Download } from 'lucide-react';
import { Button } from './ui';
import { useState } from 'react';
import { Modal, MultiSelect } from './ui';

interface Category {
  id: number;
  name: string;
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onMarkAvailable: () => void;
  onMarkBorrowed: () => void;
  onAddCategories: (categoryIds: number[]) => void;
  onRemoveCategories: (categoryIds: number[]) => void;
  onExport: () => void;
  allCategories: Category[];
}

const BulkActionsToolbar = ({
  selectedCount,
  onClearSelection,
  onDelete,
  onMarkAvailable,
  onMarkBorrowed,
  onAddCategories,
  onRemoveCategories,
  onExport,
  allCategories
}: BulkActionsToolbarProps) => {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryAction, setCategoryAction] = useState<'add' | 'remove'>('add');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  const handleCategoryAction = (action: 'add' | 'remove') => {
    setCategoryAction(action);
    setSelectedCategories([]);
    setCategoryModalOpen(true);
  };

  const handleCategorySubmit = () => {
    const categoryIds = selectedCategories.map(c => c.id);
    if (categoryAction === 'add') {
      onAddCategories(categoryIds);
    } else {
      onRemoveCategories(categoryIds);
    }
    setCategoryModalOpen(false);
    setSelectedCategories([]);
  };

  return (
    <>
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-primary text-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4">
              {/* Selection count */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">{selectedCount}</span>
                <span className="text-sm">selected</span>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-white/30" />

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<CheckCircle className="h-4 w-4" />}
                  onClick={onMarkAvailable}
                  title="Mark as Available"
                >
                  <span className="hidden sm:inline">Available</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<XCircle className="h-4 w-4" />}
                  onClick={onMarkBorrowed}
                  title="Mark as Borrowed"
                >
                  <span className="hidden sm:inline">Borrowed</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Tag className="h-4 w-4" />}
                  onClick={() => handleCategoryAction('add')}
                  title="Add Categories"
                >
                  <span className="hidden sm:inline">Add Tags</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Tag className="h-4 w-4" />}
                  onClick={() => handleCategoryAction('remove')}
                  title="Remove Categories"
                >
                  <span className="hidden sm:inline">Remove Tags</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download className="h-4 w-4" />}
                  onClick={onExport}
                  title="Export Selected"
                >
                  <span className="hidden sm:inline">Export</span>
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={onDelete}
                  title="Delete Selected"
                >
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-white/30" />

              {/* Clear selection button */}
              <button
                onClick={onClearSelection}
                className="hover:bg-white/20 rounded p-1 transition-colors"
                title="Clear Selection"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <Modal
        open={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setSelectedCategories([]);
        }}
        title={categoryAction === 'add' ? 'Add Categories' : 'Remove Categories'}
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            {categoryAction === 'add'
              ? `Select categories to add to ${selectedCount} selected book${selectedCount > 1 ? 's' : ''}`
              : `Select categories to remove from ${selectedCount} selected book${selectedCount > 1 ? 's' : ''}`
            }
          </p>

          <MultiSelect
            label="Categories"
            options={allCategories}
            value={selectedCategories}
            onChange={setSelectedCategories}
            placeholder="Select categories"
            fullWidth
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setCategoryModalOpen(false);
                setSelectedCategories([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCategorySubmit}
              disabled={selectedCategories.length === 0}
            >
              {categoryAction === 'add' ? 'Add Categories' : 'Remove Categories'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BulkActionsToolbar;
