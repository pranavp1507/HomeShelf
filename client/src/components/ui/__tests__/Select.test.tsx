import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '..';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select Component', () => {
  it('renders select with options', () => {
    render(<Select options={mockOptions} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
  });

  it('renders with label when provided', () => {
    render(<Select label="Choose an option" options={mockOptions} />);
    expect(screen.getByLabelText('Choose an option')).toBeInTheDocument();
  });

  it('renders error message when error prop is provided', () => {
    render(<Select error="Selection is required" options={mockOptions} />);
    expect(screen.getByText('Selection is required')).toBeInTheDocument();
  });

  it('applies error styling when error prop is provided', () => {
    render(<Select error="Error" options={mockOptions} data-testid="select" />);
    const select = screen.getByTestId('select');
    expect(select).toHaveClass('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
  });

  it('renders helper text when provided', () => {
    render(<Select helperText="Please select an option" options={mockOptions} />);
    expect(screen.getByText('Please select an option')).toBeInTheDocument();
  });

  it('does not render helper text when error is present', () => {
    render(<Select error="Error message" helperText="Helper text" options={mockOptions} />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('applies fullWidth class when fullWidth prop is true', () => {
    const { container } = render(<Select fullWidth options={mockOptions} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('w-full');
  });

  it('handles selection change correctly', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Select options={mockOptions} onChange={handleChange} />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'option2');

    expect(handleChange).toHaveBeenCalled();
    expect(select).toHaveValue('option2');
  });

  it('merges custom className with default classes', () => {
    render(<Select className="custom-class" options={mockOptions} data-testid="select" />);
    const select = screen.getByTestId('select');
    expect(select).toHaveClass('custom-class');
    expect(select).toHaveClass('px-3'); // default class should still be present
  });

  it('applies base select classes', () => {
    render(<Select options={mockOptions} data-testid="select" />);
    const select = screen.getByTestId('select');
    expect(select).toHaveClass('px-3', 'py-2', 'border', 'rounded-lg', 'transition-all');
  });

  it('associates label with select using htmlFor and id', () => {
    render(<Select label="Status" id="status-select" options={mockOptions} />);
    const label = screen.getByText('Status');
    const select = screen.getByLabelText('Status');
    expect(label).toHaveAttribute('for', 'status-select');
    expect(select).toHaveAttribute('id', 'status-select');
  });

  it('can be disabled', () => {
    render(<Select disabled options={mockOptions} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('renders all option values correctly', () => {
    render(<Select options={mockOptions} />);
    const option1 = screen.getByRole('option', { name: 'Option 1' }) as HTMLOptionElement;
    const option2 = screen.getByRole('option', { name: 'Option 2' }) as HTMLOptionElement;
    const option3 = screen.getByRole('option', { name: 'Option 3' }) as HTMLOptionElement;

    expect(option1.value).toBe('option1');
    expect(option2.value).toBe('option2');
    expect(option3.value).toBe('option3');
  });

  it('handles numeric option values', () => {
    const numericOptions = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' },
    ];

    render(<Select options={numericOptions} />);
    expect(screen.getByRole('option', { name: 'One' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Two' })).toBeInTheDocument();
  });

  it('renders chevron down icon', () => {
    const { container } = render(<Select options={mockOptions} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('h-5', 'w-5');
  });

  it('renders with default value when provided', () => {
    render(<Select options={mockOptions} defaultValue="option2" />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('option2');
  });
});
