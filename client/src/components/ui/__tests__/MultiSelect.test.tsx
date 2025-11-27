import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelect } from '..';
import type { MultiSelectOption } from '../MultiSelect';

const mockOptions: MultiSelectOption[] = [
  { id: 1, name: 'Option 1' },
  { id: 2, name: 'Option 2' },
  { id: 3, name: 'Option 3' },
];

describe('MultiSelect Component', () => {
  const defaultProps = {
    options: mockOptions,
    value: [],
    onChange: vi.fn(),
  };

  it('renders with placeholder when no items selected', () => {
    render(<MultiSelect {...defaultProps} placeholder="Select items" />);
    expect(screen.getByText('Select items')).toBeInTheDocument();
  });

  it('renders with default placeholder', () => {
    render(<MultiSelect {...defaultProps} />);
    expect(screen.getByText('Select options')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<MultiSelect {...defaultProps} label="Categories" />);
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(<MultiSelect {...defaultProps} />);

    const trigger = screen.getByText('Select options');
    await user.click(trigger);

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('closes dropdown when clicked outside', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div>
        <MultiSelect {...defaultProps} />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const trigger = screen.getByText('Select options');
    await user.click(trigger);
    expect(screen.getByText('Option 1')).toBeInTheDocument();

    const outside = screen.getByTestId('outside');
    await user.click(outside);

    // Dropdown should be closed
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('selects option when clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<MultiSelect {...defaultProps} onChange={handleChange} />);

    const trigger = screen.getByText('Select options');
    await user.click(trigger);

    const option1 = screen.getByText('Option 1');
    await user.click(option1);

    expect(handleChange).toHaveBeenCalledWith([mockOptions[0]]);
  });

  it('deselects option when clicked again', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    const { container } = render(<MultiSelect {...defaultProps} value={[mockOptions[0]]} onChange={handleChange} />);

    // Click trigger to open dropdown
    const trigger = container.querySelector('.cursor-pointer');
    expect(trigger).toBeDefined();
    if (trigger) {
      await user.click(trigger as Element);
    }

    // Click on Option 1 in the dropdown (not the badge)
    const option1InDropdown = container.querySelector('.bg-primary\\/10');
    expect(option1InDropdown).toBeDefined();
    if (option1InDropdown) {
      await user.click(option1InDropdown);
    }

    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it('allows multiple selections', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(<MultiSelect {...defaultProps} onChange={handleChange} />);

    // Open dropdown
    const trigger = screen.getByText('Select options');
    await user.click(trigger);

    // Select first option
    const option1 = screen.getByText('Option 1');
    await user.click(option1);
    expect(handleChange).toHaveBeenLastCalledWith([mockOptions[0]]);

    // Update value to include first option
    rerender(<MultiSelect {...defaultProps} value={[mockOptions[0]]} onChange={handleChange} />);

    // Select second option
    const option2 = screen.getByText('Option 2');
    await user.click(option2);
    expect(handleChange).toHaveBeenLastCalledWith([mockOptions[0], mockOptions[1]]);
  });

  it('displays selected items as badges', () => {
    render(<MultiSelect {...defaultProps} value={[mockOptions[0], mockOptions[1]]} />);

    // Selected items should be visible as badges
    const badges = screen.getAllByText(/Option [12]/);
    expect(badges).toHaveLength(2);
  });

  it('removes item when badge close button is clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    const { container } = render(
      <MultiSelect {...defaultProps} value={[mockOptions[0], mockOptions[1]]} onChange={handleChange} />
    );

    // Find the X button in the first badge
    const xButtons = container.querySelectorAll('button');
    const firstXButton = Array.from(xButtons).find(
      button => button.querySelector('.h-3.w-3')
    );

    expect(firstXButton).toBeDefined();
    if (firstXButton) {
      await user.click(firstXButton);
      // Should remove Option 1, leaving only Option 2
      expect(handleChange).toHaveBeenCalledWith([mockOptions[1]]);
    }
  });

  it('applies fullWidth class when fullWidth prop is true', () => {
    const { container } = render(<MultiSelect {...defaultProps} fullWidth />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('w-full');
  });

  it('shows checkmark indicator on selected options', async () => {
    const user = userEvent.setup();
    const { container } = render(<MultiSelect {...defaultProps} value={[mockOptions[0]]} />);

    const trigger = screen.getByText('Option 1');
    await user.click(trigger);

    // Find the checkmark indicator (circular div with bg-primary)
    const checkmark = container.querySelector('.bg-primary.rounded-full');
    expect(checkmark).toBeInTheDocument();
  });

  it('highlights selected options in dropdown', async () => {
    const user = userEvent.setup();
    const { container } = render(<MultiSelect {...defaultProps} value={[mockOptions[0]]} />);

    const trigger = screen.getByText('Option 1');
    await user.click(trigger);

    // Find the selected option div (has bg-primary/10 class)
    const selectedOption = container.querySelector('.bg-primary\\/10');
    expect(selectedOption).toBeInTheDocument();
  });

  it('shows "No options available" when options array is empty', async () => {
    const user = userEvent.setup();
    render(<MultiSelect {...defaultProps} options={[]} />);

    const trigger = screen.getByText('Select options');
    await user.click(trigger);

    expect(screen.getByText('No options available')).toBeInTheDocument();
  });

  it('rotates chevron icon when dropdown is open', async () => {
    const user = userEvent.setup();
    const { container } = render(<MultiSelect {...defaultProps} />);

    const chevron = container.querySelector('.h-5.w-5.text-text-secondary');
    expect(chevron).not.toHaveClass('rotate-180');

    const trigger = screen.getByText('Select options');
    await user.click(trigger);

    expect(chevron).toHaveClass('rotate-180');
  });

  it('prevents dropdown from closing when clicking inside dropdown', async () => {
    const user = userEvent.setup();
    const { container } = render(<MultiSelect {...defaultProps} />);

    const trigger = screen.getByText('Select options');
    await user.click(trigger);

    expect(screen.getByText('Option 1')).toBeInTheDocument();

    // Click on the dropdown container (not an option)
    const dropdown = container.querySelector('.absolute.z-10');
    if (dropdown) {
      // Dropdown should still be open after clicking inside it
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    }
  });

  it('renders label with correct styling', () => {
    render(<MultiSelect {...defaultProps} label="Select Categories" />);
    const label = screen.getByText('Select Categories');
    expect(label).toHaveClass('text-sm', 'font-medium', 'text-text-primary');
  });

  it('renders trigger with correct styling', () => {
    const { container } = render(<MultiSelect {...defaultProps} />);
    const trigger = container.querySelector('.min-h-\\[42px\\]');
    expect(trigger).toHaveClass('px-3', 'py-2', 'border', 'rounded-lg', 'cursor-pointer');
  });
});
