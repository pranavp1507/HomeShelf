import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import Badge from './Badge';

export interface MultiSelectOption {
  id: number;
  name: string;
}

export interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: MultiSelectOption[];
  onChange: (selected: MultiSelectOption[]) => void;
  placeholder?: string;
  fullWidth?: boolean;
}

const MultiSelect = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select options',
  fullWidth = false,
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: MultiSelectOption) => {
    const isSelected = value.some((v) => v.id === option.id);
    if (isSelected) {
      onChange(value.filter((v) => v.id !== option.id));
    } else {
      onChange([...value, option]);
    }
  };

  const handleRemove = (option: MultiSelectOption) => {
    onChange(value.filter((v) => v.id !== option.id));
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <div className={widthClass} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Selected items display */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="min-h-[42px] px-3 py-2 border border-border rounded-lg bg-white dark:bg-surface cursor-pointer hover:border-primary transition-colors"
        >
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.map((item) => (
                <Badge
                  key={item.id}
                  variant="info"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {item.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item);
                    }}
                    className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-text-tertiary">{placeholder}</span>
          )}
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown
            className={`h-5 w-5 text-text-secondary transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="p-3 text-sm text-text-secondary text-center">
                No options available
              </div>
            ) : (
              options.map((option) => {
                const isSelected = value.some((v) => v.id === option.id);
                return (
                  <div
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className={`px-3 py-2 cursor-pointer hover:bg-background-secondary transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <span className="text-sm text-text-primary">{option.name}</span>
                    {isSelected && (
                      <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;
