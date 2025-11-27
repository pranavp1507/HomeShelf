import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select } from './ui';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const Pagination = ({
  page,
  totalPages,
  totalCount,
  limit,
  onPageChange,
  onLimitChange,
}: PaginationProps) => {
  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onLimitChange(Number(event.target.value));
    onPageChange(1);
  };

  const startItem = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalCount);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 p-4 border-t border-border">
      {/* Items per page selector */}
      <div className="flex items-center gap-4">
        <div className="w-40">
          <Select
            value={limit.toString()}
            onChange={handleLimitChange}
            options={[
              { value: '10', label: '10 per page' },
              { value: '25', label: '25 per page' },
              { value: '50', label: '50 per page' },
              { value: '100', label: '100 per page' },
            ]}
            fullWidth
          />
        </div>

        {/* Item count display */}
        <span className="text-sm text-text-secondary whitespace-nowrap">
          {startItem}-{endItem} of {totalCount}
        </span>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="p-2 rounded-lg text-text-primary hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="First page"
          title="First page"
        >
          <ChevronsLeft className="h-5 w-5" />
        </button>

        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-2 rounded-lg text-text-primary hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <span className="px-4 text-sm text-text-primary font-medium whitespace-nowrap">
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-2 rounded-lg text-text-primary hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-5 w-5" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg text-text-primary hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Last page"
          title="Last page"
        >
          <ChevronsRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
