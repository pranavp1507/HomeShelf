import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '..';

describe('Card Component', () => {
  it('renders card with children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with default variant by default', () => {
    render(<Card data-testid="card">Default Card</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('border', 'border-border');
  });

  it('renders with bordered variant when specified', () => {
    render(<Card variant="bordered" data-testid="card">Bordered Card</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('border-2', 'border-border');
  });

  it('renders with elevated variant when specified', () => {
    render(<Card variant="elevated" data-testid="card">Elevated Card</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('shadow-lg');
  });

  it('renders with default medium padding by default', () => {
    render(<Card data-testid="card">Padded Card</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('p-4');
  });

  it('renders with no padding when padding="none"', () => {
    render(<Card padding="none" data-testid="card">No Padding</Card>);
    const card = screen.getByTestId('card');
    expect(card).not.toHaveClass('p-3', 'p-4', 'p-6');
  });

  it('renders with small padding when padding="sm"', () => {
    render(<Card padding="sm" data-testid="card">Small Padding</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('p-3');
  });

  it('renders with large padding when padding="lg"', () => {
    render(<Card padding="lg" data-testid="card">Large Padding</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('p-6');
  });

  it('applies cursor-pointer when clickable', () => {
    render(<Card clickable data-testid="card">Clickable Card</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('renders as motion.div when hover is true', () => {
    render(<Card hover data-testid="card">Hover Card</Card>);
    const card = screen.getByTestId('card');
    // Motion div should have the same classes
    expect(card).toHaveClass('bg-surface', 'rounded-lg', 'transition-all');
  });

  it('renders as motion.div when clickable is true', () => {
    render(<Card clickable data-testid="card">Clickable Card</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-surface', 'rounded-lg', 'cursor-pointer');
  });

  it('merges custom className with default classes', () => {
    render(<Card className="custom-class" data-testid="card">Custom Card</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveClass('bg-surface'); // default class should still be present
  });

  it('applies all base classes', () => {
    render(<Card data-testid="card">Basic Card</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-surface', 'rounded-lg', 'transition-all');
  });

  it('combines variant, padding, and custom classes correctly', () => {
    render(
      <Card
        variant="elevated"
        padding="lg"
        className="my-custom-class"
        data-testid="card"
      >
        Complex Card
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('shadow-lg', 'p-6', 'my-custom-class');
  });
});
