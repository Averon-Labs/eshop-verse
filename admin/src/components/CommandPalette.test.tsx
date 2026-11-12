import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import * as catalogApi from '../api/catalog';
import * as ordersApi from '../api/orders';

vi.mock('../api/catalog', () => ({
  listAdminProducts: vi.fn(),
}));

vi.mock('../api/orders', () => ({
  listAdminOrders: vi.fn(),
}));

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('CommandPalette (SEARCH-903)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog and search input when open', () => {
    render(
      <BrowserRouter>
        <CommandPalette open={true} onClose={vi.fn()} />
      </BrowserRouter>,
    );

    expect(screen.getByRole('dialog', { name: 'Command Palette' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search products, orders, pages/)).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
  });

  it('filters static pages based on input query', () => {
    render(
      <BrowserRouter>
        <CommandPalette open={true} onClose={vi.fn()} />
      </BrowserRouter>,
    );

    const input = screen.getByPlaceholderText(/Search products, orders, pages/);
    fireEvent.change(input, { target: { value: 'Inventory' } });

    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });

  it('fetches matching products and orders when query >= 2 chars', async () => {
    vi.mocked(catalogApi.listAdminProducts).mockResolvedValue({
      data: [
        {
          id: 42,
          name: 'Leather Bag',
          sku: 'BAG-42',
          price: '89.99',
          status: 'active',
          categoryId: 1,
        } as any,
      ],
      pagination: { currentPage: 1, perPage: 5, totalItems: 1, totalPages: 1 },
    });

    vi.mocked(ordersApi.listAdminOrders).mockResolvedValue({
      data: [
        {
          id: 101,
          reference: 'EVG-1001',
          customer: { email: 'customer@example.com' },
          total: '89.99',
          status: 'processing',
        } as any,
      ],
      pagination: { currentPage: 1, perPage: 5, totalItems: 1, totalPages: 1 },
    });

    render(
      <BrowserRouter>
        <CommandPalette open={true} onClose={vi.fn()} />
      </BrowserRouter>,
    );

    const input = screen.getByPlaceholderText(/Search products, orders, pages/);
    fireEvent.change(input, { target: { value: 'leather' } });

    await waitFor(() => {
      expect(screen.getByText('Leather Bag')).toBeInTheDocument();
      expect(screen.getByText('EVG-1001')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Leather Bag'));
    expect(mockedNavigate).toHaveBeenCalledWith('/products/42');
  });

  it('navigates with keyboard ArrowDown and Enter', () => {
    const onClose = vi.fn();
    render(
      <BrowserRouter>
        <CommandPalette open={true} onClose={onClose} />
      </BrowserRouter>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Command Palette' });
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    fireEvent.keyDown(dialog, { key: 'Enter' });

    expect(mockedNavigate).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape key or close button', () => {
    const onClose = vi.fn();
    render(
      <BrowserRouter>
        <CommandPalette open={true} onClose={onClose} />
      </BrowserRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Esc' }));
    expect(onClose).toHaveBeenCalled();

    const dialog = screen.getByRole('dialog', { name: 'Command Palette' });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
