import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '..';

describe('Badge Component', () => {
  it('renders badge with text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders with default variant by default', () => {
    render(<Badge data-testid="badge">Default</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('renders with success variant when specified', () => {
    render(<Badge variant="success" data-testid="badge">Success</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders with warning variant when specified', () => {
    render(<Badge variant="warning" data-testid="badge">Warning</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('renders with error variant when specified', () => {
    render(<Badge variant="error" data-testid="badge">Error</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('renders with info variant when specified', () => {
    render(<Badge variant="info" data-testid="badge">Info</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('renders with default medium size by default', () => {
    render(<Badge data-testid="badge">Medium</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-sm');
  });

  it('renders with small size when specified', () => {
    render(<Badge size="sm" data-testid="badge">Small</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
  });

  it('renders with large size when specified', () => {
    render(<Badge size="lg" data-testid="badge">Large</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('px-3', 'py-1', 'text-base');
  });

  it('merges custom className with default classes', () => {
    render(<Badge className="custom-class" data-testid="badge">Custom</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('custom-class');
    expect(badge).toHaveClass('inline-flex'); // default class should still be present
  });

  it('applies all base classes', () => {
    render(<Badge data-testid="badge">Basic Badge</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('inline-flex', 'items-center', 'font-medium', 'rounded-full');
  });

  it('combines variant, size, and custom classes correctly', () => {
    render(
      <Badge
        variant="success"
        size="lg"
        className="my-custom-class"
        data-testid="badge"
      >
        Complex Badge
      </Badge>
    );
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('bg-green-100', 'px-3', 'my-custom-class');
  });

  it('renders as a span element', () => {
    render(<Badge data-testid="badge">Span Badge</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge.tagName).toBe('SPAN');
  });

  it('passes through additional props', () => {
    render(<Badge data-testid="badge" title="Badge Title">Badge</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('title', 'Badge Title');
  });

  it('includes dark mode classes', () => {
    render(<Badge data-testid="badge">Dark Mode</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('dark:bg-gray-700', 'dark:text-gray-300');
  });
});
