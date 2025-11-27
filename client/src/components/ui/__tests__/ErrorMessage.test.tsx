import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessage } from '..';

describe('ErrorMessage Component', () => {
  it('renders error message', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders with error variant by default', () => {
    const { container } = render(<ErrorMessage message="Error" data-testid="error" />);
    const errorDiv = container.firstChild as HTMLElement;
    expect(errorDiv).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
  });

  it('renders with warning variant when specified', () => {
    const { container } = render(<ErrorMessage message="Warning" variant="warning" />);
    const errorDiv = container.firstChild as HTMLElement;
    expect(errorDiv).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
  });

  it('renders with info variant when specified', () => {
    const { container } = render(<ErrorMessage message="Info" variant="info" />);
    const errorDiv = container.firstChild as HTMLElement;
    expect(errorDiv).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
  });

  it('renders AlertCircle icon', () => {
    const { container } = render(<ErrorMessage message="Error" />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-5', 'w-5');
  });

  it('does not render close button when onClose is not provided', () => {
    render(<ErrorMessage message="Error" />);
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('renders close button when onClose is provided', () => {
    const handleClose = vi.fn();
    render(<ErrorMessage message="Error" onClose={handleClose} />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(<ErrorMessage message="Error" onClose={handleClose} />);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(<ErrorMessage message="Error" className="custom-class" />);
    const errorDiv = container.firstChild as HTMLElement;
    expect(errorDiv).toHaveClass('custom-class');
  });

  it('applies base layout classes', () => {
    const { container } = render(<ErrorMessage message="Error" />);
    const errorDiv = container.firstChild as HTMLElement;
    expect(errorDiv).toHaveClass('border', 'rounded-lg', 'p-4', 'flex', 'items-start', 'gap-3');
  });

  it('renders message with correct styling', () => {
    render(<ErrorMessage message="Error message" />);
    const message = screen.getByText('Error message');
    expect(message).toHaveClass('font-medium');
  });

  it('renders close button with X icon', () => {
    const handleClose = vi.fn();
    const { container } = render(<ErrorMessage message="Error" onClose={handleClose} />);
    const closeButton = screen.getByRole('button', { name: 'Close' });
    const xIcon = closeButton.querySelector('svg');
    expect(xIcon).toBeInTheDocument();
    expect(xIcon).toHaveClass('h-4', 'w-4');
  });

  it('applies correct icon color for error variant', () => {
    const { container } = render(<ErrorMessage message="Error" variant="error" />);
    const icon = container.querySelector('.text-red-600');
    expect(icon).toBeInTheDocument();
  });

  it('applies correct icon color for warning variant', () => {
    const { container } = render(<ErrorMessage message="Warning" variant="warning" />);
    const icon = container.querySelector('.text-yellow-600');
    expect(icon).toBeInTheDocument();
  });

  it('applies correct icon color for info variant', () => {
    const { container } = render(<ErrorMessage message="Info" variant="info" />);
    const icon = container.querySelector('.text-blue-600');
    expect(icon).toBeInTheDocument();
  });
});
