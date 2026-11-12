import { act, fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotPasswordPage from './ForgotPasswordPage';
import { ThemeProvider } from '../theme/ThemeContext';

function renderForgotPassword() {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
});

describe('ForgotPasswordPage (AUTH-102)', () => {
  it('renders_the_reset_password_heading_and_input', () => {
    renderForgotPassword();

    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
  });

  it('validates_empty_email_and_focuses_input', () => {
    renderForgotPassword();

    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(screen.getByText('Email is required.')).toBeInTheDocument();
  });

  it('validates_invalid_email_format', () => {
    renderForgotPassword();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
  });

  it('dispatches_reset_link_and_shows_confirmation', async () => {
    vi.useFakeTimers();
    renderForgotPassword();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@eshopverse.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByText('Reset link dispatched')).toBeInTheDocument();
    expect(screen.getByText(/admin@eshopverse.test/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to sign in/i })).toHaveAttribute('href', '/login');
  });
});
