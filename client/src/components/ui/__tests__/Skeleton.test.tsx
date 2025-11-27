import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '..';

describe('Skeleton Component', () => {
  it('renders skeleton element', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toBeInTheDocument();
  });

  it('renders with text variant by default', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded', 'h-4');
  });

  it('renders with circular variant when specified', () => {
    const { container } = render(<Skeleton variant="circular" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('renders with rectangular variant when specified', () => {
    const { container } = render(<Skeleton variant="rectangular" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded-lg');
  });

  it('applies custom width as number', () => {
    const { container } = render(<Skeleton width={200} />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveStyle({ width: '200px' });
  });

  it('applies custom width as string', () => {
    const { container } = render(<Skeleton width="50%" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveStyle({ width: '50%' });
  });

  it('applies custom height as number', () => {
    const { container } = render(<Skeleton height={100} />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveStyle({ height: '100px' });
  });

  it('applies custom height as string', () => {
    const { container } = render(<Skeleton height="100%" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveStyle({ height: '100%' });
  });

  it('applies both width and height', () => {
    const { container } = render(<Skeleton width={200} height={100} />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('custom-class');
  });

  it('applies base animation classes', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('bg-gradient-to-r', 'from-background-secondary', 'via-border', 'to-background-secondary');
  });

  it('renders circular skeleton with custom size', () => {
    const { container } = render(<Skeleton variant="circular" width={50} height={50} />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded-full');
    expect(skeleton).toHaveStyle({ width: '50px', height: '50px' });
  });

  it('renders rectangular skeleton with custom dimensions', () => {
    const { container } = render(<Skeleton variant="rectangular" width={300} height={200} />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded-lg');
    expect(skeleton).toHaveStyle({ width: '300px', height: '200px' });
  });

  it('combines variant, dimensions, and custom className correctly', () => {
    const { container } = render(
      <Skeleton
        variant="rectangular"
        width={400}
        height={150}
        className="my-custom-class"
      />
    );
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded-lg', 'my-custom-class');
    expect(skeleton).toHaveStyle({ width: '400px', height: '150px' });
  });

  it('renders as a div element', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.tagName).toBe('DIV');
  });
});
