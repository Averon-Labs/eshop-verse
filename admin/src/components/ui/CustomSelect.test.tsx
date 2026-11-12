import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CustomSelect } from './CustomSelect';

const SAMPLE_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

describe('CustomSelect component', () => {
  it('renders trigger button with placeholder or selected label', () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <CustomSelect
        value=""
        onChange={handleChange}
        options={SAMPLE_OPTIONS}
        placeholder="Filter status"
        label="Order Status"
      />
    );

    expect(screen.getByRole('combobox', { name: 'Order Status' })).toHaveTextContent('All statuses');

    rerender(
      <CustomSelect
        value="delivered"
        onChange={handleChange}
        options={SAMPLE_OPTIONS}
        placeholder="Filter status"
        label="Order Status"
      />
    );

    expect(screen.getByRole('combobox', { name: 'Order Status' })).toHaveTextContent('Delivered');
  });

  it('opens options on click and selects a new option', () => {
    const handleChange = vi.fn();
    render(
      <CustomSelect
        value=""
        onChange={handleChange}
        options={SAMPLE_OPTIONS}
        label="Status"
      />
    );

    const combobox = screen.getByRole('combobox', { name: 'Status' });
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(combobox);
    expect(combobox).toHaveAttribute('aria-expanded', 'true');

    // Listbox options should now be present in document
    const deliveredOption = screen.getByRole('option', { name: /Delivered/i });
    fireEvent.click(deliveredOption);

    expect(handleChange).toHaveBeenCalledWith('delivered');
  });

  it('closes on Escape key press', () => {
    const handleChange = vi.fn();
    render(
      <CustomSelect
        value=""
        onChange={handleChange}
        options={SAMPLE_OPTIONS}
        label="Status"
      />
    );

    const combobox = screen.getByRole('combobox', { name: 'Status' });
    fireEvent.click(combobox);
    expect(combobox).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });
});
