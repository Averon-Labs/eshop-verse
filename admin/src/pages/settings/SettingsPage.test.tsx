import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { mockApi } from '../../test/apiMock';
import { sessionRoute } from '../../test/adminMock';

beforeEach(() => {
  window.history.pushState({}, '', '/settings');
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SettingsPage (SET-101)', () => {
  it('renders_store_settings_sections_and_fields', async () => {
    mockApi([sessionRoute()]);

    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Store settings' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Store profile' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Regional preferences' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Admin account security' })).toBeInTheDocument();

    expect(screen.getByLabelText('Store name')).toHaveValue('Evergreen Store');
    expect(screen.getByLabelText('Support email')).toHaveValue('support@eshopverse.com');
    expect(screen.getByLabelText('Contact phone')).toHaveValue('+1 (555) 019-2834');
    expect(screen.getByLabelText('Date format')).toHaveValue('MM/DD/YYYY');
    expect(screen.getByLabelText('Timezone')).toHaveValue('UTC');
  });

  it('submits_store_profile_form_and_displays_feedback', async () => {
    mockApi([sessionRoute()]);

    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Store settings' });

    fireEvent.change(screen.getByLabelText('Store name'), { target: { value: 'EShop Verse Luxury' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save store profile' }));

    expect(await screen.findByText('Store profile updated successfully.')).toBeInTheDocument();
  });

  it('submits_regional_preferences_form_and_displays_feedback', async () => {
    mockApi([sessionRoute()]);

    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Store settings' });

    fireEvent.change(screen.getByLabelText('Timezone'), { target: { value: 'Asia/Tehran' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));

    expect(await screen.findByText('Regional preferences updated successfully.')).toBeInTheDocument();
  });

  it('validates_password_change_fields_and_reports_errors', async () => {
    mockApi([sessionRoute()]);

    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Store settings' });

    // 1. Empty current password
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(screen.getByText('Enter your current password.')).toBeInTheDocument();

    // 2. Short new password (< 8 chars)
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'Secret123' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(screen.getByText('New password must be at least 8 characters long.')).toBeInTheDocument();

    // 3. Mismatched passwords
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'NewPassword123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'DifferentPassword123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(screen.getByText('New password and confirmation do not match.')).toBeInTheDocument();

    // 4. Successful password update
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'NewPassword123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText('Admin account password updated successfully.')).toBeInTheDocument();
  });
});
