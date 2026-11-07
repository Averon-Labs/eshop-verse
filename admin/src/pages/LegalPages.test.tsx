import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { jsonResponse, mockApi } from '../test/apiMock';

function mockGuestSession() {
  mockApi([
    {
      method: 'GET',
      path: '/admin/auth/session',
      handler: () =>
        jsonResponse(401, {
          error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' },
        }),
    },
  ]);
}

beforeEach(() => {
  window.history.pushState({}, '', '/');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Legal pages', () => {
  it('privacy_policy_is_public_and_does_not_require_admin_sign_in', async () => {
    window.history.pushState({}, '', '/privacy');
    mockGuestSession();

    render(<App />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Privacy Policy' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Admin sign in' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Information we collect' })).toBeInTheDocument();
  });

  it('terms_of_service_is_public_and_does_not_require_admin_sign_in', async () => {
    window.history.pushState({}, '', '/terms');
    mockGuestSession();

    render(<App />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Terms of Service' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Admin sign in' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Acceptable use' })).toBeInTheDocument();
  });
});
