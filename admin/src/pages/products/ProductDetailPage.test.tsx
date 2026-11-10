import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { jsonResponse, mockApi } from '../../test/apiMock';
import { product, sessionRoute } from '../../test/adminMock';

beforeEach(() => {
  window.history.pushState({}, '', '/products/5');
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ProductDetailPage (PROD-103)', () => {
  it('product_detail_renders_overview_price_stock_and_images', async () => {
    mockApi([
      sessionRoute(),
      {
        method: 'GET',
        path: '/admin/products/5',
        handler: () =>
          jsonResponse(200, {
            data: product({
              id: 5,
              name: 'Aurora Desk Lamp',
              price: '39.99',
              sku: 'AUR-01',
              categoryName: 'Lighting',
              stockQuantity: 7,
              inStock: true,
              description: 'Handcrafted brushed metal finish.',
              images: [
                { id: 1, url: 'https://cdn.example.test/main.jpg', sortOrder: 0 },
                { id: 2, url: 'https://cdn.example.test/alt.jpg', sortOrder: 1 },
              ],
            }),
          }),
      },
    ]);
    window.history.pushState({}, '', '/products/5');

    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Aurora Desk Lamp' })).toBeInTheDocument();
    expect(screen.getByText('$39.99')).toBeInTheDocument();
    expect(screen.getByText('SKU: AUR-01')).toBeInTheDocument();
    expect(screen.getByText('Lighting')).toBeInTheDocument();
    expect(screen.getByText('In stock')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Handcrafted brushed metal finish.')).toBeInTheDocument();

    const editLink = screen.getByRole('link', { name: 'Edit Aurora Desk Lamp' });
    expect(editLink).toHaveAttribute('href', '/products/5/edit');
  });

  it('product_detail_out_of_stock_state', async () => {
    mockApi([
      sessionRoute(),
      {
        method: 'GET',
        path: '/admin/products/5',
        handler: () =>
          jsonResponse(200, {
            data: product({
              id: 5,
              inStock: false,
              stockQuantity: 0,
            }),
          }),
      },
    ]);
    window.history.pushState({}, '', '/products/5');

    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Aurora Desk Lamp' })).toBeInTheDocument();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('product_detail_not_found_offers_back_to_products', async () => {
    mockApi([
      sessionRoute(),
      {
        method: 'GET',
        path: '/admin/products/999',
        handler: () =>
          jsonResponse(404, {
            error: { code: 'NOT_FOUND', message: 'The product does not exist.' },
          }),
      },
    ]);
    window.history.pushState({}, '', '/products/999');

    render(<App />);

    expect(await screen.findByText('Product not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to products' })).toHaveAttribute(
      'href',
      '/products',
    );
  });

  it('product_detail_error_state_retries_and_recovers', async () => {
    let calls = 0;
    mockApi([
      sessionRoute(),
      {
        method: 'GET',
        path: '/admin/products/5',
        handler: () => {
          calls += 1;
          return calls === 1
            ? jsonResponse(500, {
                error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve product details.' },
              })
            : jsonResponse(200, { data: product({ id: 5, name: 'Recovered Lamp' }) });
        },
      },
    ]);
    window.history.pushState({}, '', '/products/5');

    render(<App />);

    expect(await screen.findByText('Product could not be loaded')).toBeInTheDocument();
    expect(screen.getByText('Failed to retrieve product details.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Recovered Lamp' })).toBeInTheDocument();
  });
});
