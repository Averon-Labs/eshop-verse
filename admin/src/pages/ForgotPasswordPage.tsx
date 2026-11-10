import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setEmailError('Email is required.');
      emailRef.current?.focus();
      return;
    }

    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError('Enter a valid email address.');
      emailRef.current?.focus();
      return;
    }

    setEmailError(null);
    setSubmitting(true);

    // Simulate link dispatch (backend password reset request)
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--bg-background)] p-4 sm:p-6 transition-colors">
      <ThemeToggle className="fixed right-6 top-6 z-20" />

      {/* Centered Bento Card (max-w-md) */}
      <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-[var(--border-outline)] bg-[var(--bg-surface)] p-8 sm:p-10 shadow-2xl transition-colors">
        {/* Top Badge Icon */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-primary-container)] text-[var(--brand-on-primary-container)]">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-on-background)]">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Enter the email address associated with your admin account. We&apos;ll send you a secure reset link.
        </p>

        {submitted ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-[var(--status-success)]/30 bg-[var(--status-success-container)] p-4 text-sm text-[var(--status-on-success-container)]">
              <p className="font-semibold">Reset link dispatched</p>
              <p className="mt-1 text-xs">
                If an administrator account exists for <span className="font-bold">{email}</span>, you will receive password reset instructions shortly.
              </p>
            </div>

            <Link
              to="/login"
              className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-[var(--border-outline)] bg-[var(--bg-surface-variant)] text-sm font-semibold text-[var(--text-on-background)] hover:bg-[var(--border-outline-variant)] transition-colors"
            >
              &larr; Back to sign in
            </Link>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="reset-email"
                className="block text-sm font-semibold text-[var(--text-on-background)]"
              >
                Email
              </label>
              <input
                ref={emailRef}
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@eshopverse.store"
                aria-invalid={emailError !== null}
                aria-describedby={emailError ? 'reset-email-error' : undefined}
                className="mt-1.5 min-h-12 w-full rounded-2xl border border-[var(--border-outline)] bg-[var(--bg-surface-variant)] px-4 text-sm text-[var(--text-on-background)] placeholder:text-[var(--text-disabled)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-colors"
              />
              {emailError && (
                <p id="reset-email-error" className="mt-1.5 text-xs font-medium text-[var(--status-error)]">
                  {emailError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-[var(--brand-primary)] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:opacity-60"
            >
              {submitting ? 'Sending link…' : 'Send reset link'}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-on-background)] hover:underline"
              >
                &larr; Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
