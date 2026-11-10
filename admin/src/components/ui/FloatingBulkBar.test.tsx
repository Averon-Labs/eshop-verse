import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FloatingBulkBar } from './FloatingBulkBar';

describe('FloatingBulkBar component (PROD-902)', () => {
  it('renders nothing when selectedCount is zero', () => {
    render(
      <FloatingBulkBar
        selectedCount={0}
        onActivate={vi.fn()}
        onArchive={vi.fn()}
        onDelete={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.queryByRole('region', { name: 'Bulk actions toolbar' })).not.toBeInTheDocument();
  });

  it('renders toolbar with counter and triggers actions', () => {
    const onActivate = vi.fn();
    const onArchive = vi.fn();
    const onDelete = vi.fn();
    const onClear = vi.fn();

    render(
      <FloatingBulkBar
        selectedCount={3}
        onActivate={onActivate}
        onArchive={onArchive}
        onDelete={onDelete}
        onClear={onClear}
      />,
    );

    expect(screen.getByRole('region', { name: 'Bulk actions toolbar' })).toBeInTheDocument();
    expect(screen.getByText(/3.*selected/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Activate' }));
    expect(onActivate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    expect(onArchive).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('disables action buttons when busy is true', () => {
    render(
      <FloatingBulkBar
        selectedCount={2}
        busy={true}
        onActivate={vi.fn()}
        onArchive={vi.fn()}
        onDelete={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Activate' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeDisabled();
  });
});
