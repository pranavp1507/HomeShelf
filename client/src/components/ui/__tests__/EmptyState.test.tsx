import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '..';
import { BookOpen, Plus } from 'lucide-react';

describe('EmptyState Component', () => {
  const defaultProps = {
    icon: BookOpen,
    title: 'No books found',
    description: 'Start by adding your first book to the library',
  };

  it('renders empty state with icon, title, and description', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.getByText('No books found')).toBeInTheDocument();
    expect(screen.getByText('Start by adding your first book to the library')).toBeInTheDocument();
  });

  it('renders icon correctly', () => {
    const { container } = render(<EmptyState {...defaultProps} />);
    const icon = container.querySelector('.text-primary');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-16', 'w-16');
  });

  it('renders without action button when action is not provided', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders action button when action is provided', () => {
    const action = {
      label: 'Add Book',
      onClick: vi.fn(),
    };

    render(<EmptyState {...defaultProps} action={action} />);
    expect(screen.getByRole('button', { name: 'Add Book' })).toBeInTheDocument();
  });

  it('calls action onClick when button is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    const action = {
      label: 'Add Book',
      onClick: handleClick,
    };

    render(<EmptyState {...defaultProps} action={action} />);

    const button = screen.getByRole('button', { name: 'Add Book' });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders action button with icon when provided', () => {
    const action = {
      label: 'Add Book',
      onClick: vi.fn(),
      icon: <Plus data-testid="plus-icon" />,
    };

    render(<EmptyState {...defaultProps} action={action} />);
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState {...defaultProps} className="custom-class" />);
    const emptyState = container.firstChild as HTMLElement;
    expect(emptyState).toHaveClass('custom-class');
  });

  it('applies default layout classes', () => {
    const { container } = render(<EmptyState {...defaultProps} />);
    const emptyState = container.firstChild as HTMLElement;
    expect(emptyState).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
  });

  it('renders title with correct styling', () => {
    render(<EmptyState {...defaultProps} />);
    const title = screen.getByText('No books found');
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'text-text-primary');
  });

  it('renders description with correct styling', () => {
    render(<EmptyState {...defaultProps} />);
    const description = screen.getByText('Start by adding your first book to the library');
    expect(description).toHaveClass('text-text-secondary');
  });
});
