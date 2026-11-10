import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DateRangePicker } from './DateRangePicker';

describe('DateRangePicker component', () => {
  it('renders with placeholder when values are empty', () => {
    const handleChange = vi.fn();
    render(
      <DateRangePicker
        fromValue=""
        toValue=""
        onChange={handleChange}
        placeholder="Pick dates"
        label="Date filter"
      />
    );

    expect(screen.getByRole('button', { name: /Date filter/i })).toHaveTextContent('Pick dates');
  });

  it('renders formatted human-readable date range when dates are supplied', () => {
    const handleChange = vi.fn();
    render(
      <DateRangePicker
        fromValue="2026-03-01"
        toValue="2026-03-10"
        onChange={handleChange}
        placeholder="Pick dates"
        label="Date filter"
      />
    );

    const trigger = screen.getByRole('button', { name: /Date filter/i });
    expect(trigger).toHaveTextContent(/Mar 01, 2026/);
    expect(trigger).toHaveTextContent(/Mar 10, 2026/);
  });

  it('opens modal on click and selects a quick preset', () => {
    const handleChange = vi.fn();
    render(
      <DateRangePicker
        fromValue=""
        toValue=""
        onChange={handleChange}
        label="Order dates"
      />
    );

    const trigger = screen.getByRole('button', { name: /Order dates/i });
    fireEvent.click(trigger);

    // Dialog should be open
    expect(screen.getByRole('dialog', { name: 'Choose date range' })).toBeInTheDocument();

    // Click "Last 7 days" preset
    const presetBtn = screen.getByRole('button', { name: 'Last 7 days' });
    fireEvent.click(presetBtn);

    expect(handleChange).toHaveBeenCalled();
  });

  it('clears dates when the clear button is clicked', () => {
    const handleChange = vi.fn();
    const handleClear = vi.fn();
    render(
      <DateRangePicker
        fromValue="2026-03-01"
        toValue="2026-03-10"
        onChange={handleChange}
        onClear={handleClear}
        label="Order dates"
      />
    );

    const clearBtn = screen.getByLabelText('Clear date range');
    fireEvent.click(clearBtn);

    expect(handleChange).toHaveBeenCalledWith('', '');
    expect(handleClear).toHaveBeenCalled();
  });
});
