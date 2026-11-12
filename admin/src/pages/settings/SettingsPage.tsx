import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { FeedbackBanner } from '../../components/StatePanels';
import { CustomSelect } from '../../components/ui';
import {
  cardClass,
  fieldErrorClass,
  helperTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '../../lib/ui';

/**
 * SET-101 — Streamlined Store Settings & Profile.
 * Bento Grid configuration: Store Profile, Regional Preferences, and Admin Account Security.
 */
export default function SettingsPage() {
  const { user } = useAuth();

  // Store Profile State
  const [storeName, setStoreName] = useState('Evergreen Store');
  const [supportEmail, setSupportEmail] = useState('support@eshopverse.com');
  const [contactPhone, setContactPhone] = useState('+1 (555) 019-2834');
  const [profileSaved, setProfileSaved] = useState(false);

  // Regional Preferences State
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timezone, setTimezone] = useState('UTC');
  const [regionalSaved, setRegionalSaved] = useState(false);

  // Admin Account Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 4000);
  }

  function handleRegionalSubmit(event: FormEvent) {
    event.preventDefault();
    setRegionalSaved(true);
    setTimeout(() => setRegionalSaved(false), 4000);
  }

  function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (currentPassword.trim() === '') {
      setPasswordError('Enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess('Admin account password updated successfully.');
  }

  return (
    <section aria-labelledby="settings-title" className="space-y-6">
      {/* Header */}
      <div>
        <h1 id="settings-title" className="text-2xl font-bold tracking-tight text-text-on-surface">
          Store settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configure your store profile, regional preferences, and administrative security.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bento Card 1: Store Profile */}
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center gap-3 border-b border-border-outline/30 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-bold text-text-on-surface">Store profile</h2>
              <p className="text-xs text-text-secondary">Store identity and primary customer support channels.</p>
            </div>
          </div>

          {profileSaved && (
            <div className="mt-4">
              <FeedbackBanner message="Store profile updated successfully." />
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4" aria-label="Store profile form">
            <div>
              <label htmlFor="settings-store-name" className={labelClass}>
                Store name
              </label>
              <input
                id="settings-store-name"
                type="text"
                className={`${inputClass} mt-1`}
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="settings-support-email" className={labelClass}>
                Support email
              </label>
              <input
                id="settings-support-email"
                type="email"
                className={`${inputClass} mt-1`}
                value={supportEmail}
                onChange={(event) => setSupportEmail(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="settings-contact-phone" className={labelClass}>
                Contact phone
              </label>
              <input
                id="settings-contact-phone"
                type="tel"
                className={`${inputClass} mt-1`}
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="settings-currency" className={labelClass}>
                Store currency
              </label>
              <input
                id="settings-currency"
                type="text"
                disabled
                className={`${inputClass} mt-1 bg-bg-surface-variant/50 text-text-secondary cursor-not-allowed`}
                value="USD ($) — United States Dollar"
              />
              <p className={helperTextClass}>Currency is synchronized with catalog billing contracts.</p>
            </div>

            <div className="pt-2">
              <button type="submit" className={primaryButtonClass}>
                Save store profile
              </button>
            </div>
          </form>
        </div>

        {/* Bento Card 2: Regional Preferences */}
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center gap-3 border-b border-border-outline/30 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-success-container text-status-success">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-bold text-text-on-surface">Regional preferences</h2>
              <p className="text-xs text-text-secondary">Date formats and display timezones for logs and timestamps.</p>
            </div>
          </div>

          {regionalSaved && (
            <div className="mt-4">
              <FeedbackBanner message="Regional preferences updated successfully." />
            </div>
          )}

          <form onSubmit={handleRegionalSubmit} className="mt-5 space-y-4" aria-label="Regional preferences form">
            <div>
              <label htmlFor="settings-date-format" className={labelClass}>
                Date format
              </label>
              <div className="mt-1">
                <CustomSelect
                  id="settings-date-format-custom"
                  value={dateFormat}
                  onChange={(val) => setDateFormat(val)}
                  options={[
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 11/10/2026)' },
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 10/11/2026)' },
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO 8601)' },
                  ]}
                />
              </div>
              <select
                id="settings-date-format"
                className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
                value={dateFormat}
                onChange={(event) => setDateFormat(event.target.value)}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/10/2026)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 10/11/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
              </select>
            </div>

            <div>
              <label htmlFor="settings-timezone" className={labelClass}>
                Timezone
              </label>
              <div className="mt-1">
                <CustomSelect
                  id="settings-timezone-custom"
                  value={timezone}
                  onChange={(val) => setTimezone(val)}
                  options={[
                    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                    { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
                    { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
                    { value: 'Asia/Tehran', label: 'Asia/Tehran (+03:30)' },
                  ]}
                />
              </div>
              <select
                id="settings-timezone"
                className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (Eastern Time)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Tehran">Asia/Tehran (+03:30)</option>
              </select>
            </div>

            <div>
              <label htmlFor="settings-locale" className={labelClass}>
                Primary language
              </label>
              <input
                id="settings-locale"
                type="text"
                disabled
                className={`${inputClass} mt-1 bg-bg-surface-variant/50 text-text-secondary cursor-not-allowed`}
                value="English (United States)"
              />
            </div>

            <div className="pt-2">
              <button type="submit" className={primaryButtonClass}>
                Save preferences
              </button>
            </div>
          </form>
        </div>

        {/* Bento Card 3: Admin Account Security (Full width on lg) */}
        <div className={`${cardClass} p-6 lg:col-span-2`}>
          <div className="flex items-center gap-3 border-b border-border-outline/30 pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-warning-container text-status-warning">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-bold text-text-on-surface">Admin account security</h2>
              <p className="text-xs text-text-secondary">
                Signed in as <span className="font-semibold text-text-on-surface">{user?.email ?? 'admin@example.com'}</span>
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="mt-4">
              <FeedbackBanner message={passwordSuccess} />
            </div>
          )}

          {passwordError && (
            <div className="mt-4">
              <p role="alert" className={fieldErrorClass}>
                {passwordError}
              </p>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end" aria-label="Change password form">
            <div>
              <label htmlFor="settings-current-password" className={labelClass}>
                Current password
              </label>
              <input
                id="settings-current-password"
                type="password"
                className={`${inputClass} mt-1`}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div>
              <label htmlFor="settings-new-password" className={labelClass}>
                New password
              </label>
              <input
                id="settings-new-password"
                type="password"
                className={`${inputClass} mt-1`}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="settings-confirm-password" className={labelClass}>
                Confirm new password
              </label>
              <input
                id="settings-confirm-password"
                type="password"
                className={`${inputClass} mt-1`}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="sm:col-span-3 pt-2">
              <button type="submit" className={primaryButtonClass}>
                Update password
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
