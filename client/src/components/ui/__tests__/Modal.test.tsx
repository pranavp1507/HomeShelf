import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '..';

describe('Modal Component', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    // Reset body overflow before each test
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    // Clean up after each test
    document.body.style.overflow = 'unset';
    vi.clearAllMocks();
  });

  it('renders modal when open is true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render modal when open is false', () => {
    render(<Modal {...defaultProps} open={false} />);
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders modal title', () => {
    render(<Modal {...defaultProps} title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders modal children', () => {
    render(
      <Modal {...defaultProps}>
        <div data-testid="custom-content">Custom content here</div>
      </Modal>
    );
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom content here')).toBeInTheDocument();
  });

  it('renders close button with aria-label', () => {
    render(<Modal {...defaultProps} />);
    const closeButton = screen.getByRole('button', { name: 'Close modal' });
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(<Modal {...defaultProps} onClose={handleClose} />);

    const closeButton = screen.getByRole('button', { name: 'Close modal' });
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Modal {...defaultProps} onClose={handleClose} />);

    // Find backdrop by class
    const backdrop = container.querySelector('.bg-black\\/50');
    expect(backdrop).toBeInTheDocument();

    if (backdrop) {
      await user.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });

  it('sets body overflow to hidden when modal opens', () => {
    render(<Modal {...defaultProps} open={true} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('resets body overflow when modal closes', () => {
    const { rerender } = render(<Modal {...defaultProps} open={true} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Modal {...defaultProps} open={false} />);
    expect(document.body.style.overflow).toBe('unset');
  });

  it('resets body overflow on unmount', () => {
    const { unmount } = render(<Modal {...defaultProps} open={true} />);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });

  it('renders with default medium size', () => {
    const { container } = render(<Modal {...defaultProps} />);
    const modalContent = container.querySelector('.max-w-2xl');
    expect(modalContent).toBeInTheDocument();
  });

  it('renders with small size when specified', () => {
    const { container } = render(<Modal {...defaultProps} size="sm" />);
    const modalContent = container.querySelector('.max-w-md');
    expect(modalContent).toBeInTheDocument();
  });

  it('renders with large size when specified', () => {
    const { container } = render(<Modal {...defaultProps} size="lg" />);
    const modalContent = container.querySelector('.max-w-4xl');
    expect(modalContent).toBeInTheDocument();
  });

  it('renders with extra-large size when specified', () => {
    const { container } = render(<Modal {...defaultProps} size="xl" />);
    const modalContent = container.querySelector('.max-w-6xl');
    expect(modalContent).toBeInTheDocument();
  });

  it('renders backdrop with correct styling', () => {
    const { container } = render(<Modal {...defaultProps} />);
    const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50.backdrop-blur-sm');
    expect(backdrop).toBeInTheDocument();
  });

  it('renders title with correct styling', () => {
    render(<Modal {...defaultProps} />);
    const title = screen.getByText('Test Modal');
    expect(title).toHaveClass('text-xl', 'font-semibold', 'text-text-primary');
  });

  it('renders close button with X icon', () => {
    render(<Modal {...defaultProps} />);
    const closeButton = screen.getByRole('button', { name: 'Close modal' });
    const xIcon = closeButton.querySelector('svg');
    expect(xIcon).toBeInTheDocument();
    expect(xIcon).toHaveClass('h-5', 'w-5');
  });

  it('renders content in scrollable container', () => {
    const { container } = render(<Modal {...defaultProps} />);
    const contentContainer = container.querySelector('.overflow-y-auto');
    expect(contentContainer).toBeInTheDocument();
    expect(contentContainer).toHaveClass('p-6');
  });

  it('has proper z-index for backdrop and modal', () => {
    const { container } = render(<Modal {...defaultProps} />);
    const backdrop = container.querySelector('.bg-black\\/50');
    const modalContainer = container.querySelector('.flex.items-center.justify-center');

    expect(backdrop).toHaveClass('z-50');
    expect(modalContainer).toHaveClass('z-50');
  });

  it('renders with elevated Card variant', () => {
    const { container } = render(<Modal {...defaultProps} />);
    const card = container.querySelector('.shadow-lg');
    expect(card).toBeInTheDocument();
  });
});
