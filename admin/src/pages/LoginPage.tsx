import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import { FullPageLoading } from '../components/FullPageLoading';
import { ThemeToggle } from '../components/ThemeToggle';

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function describeFailure(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return 'The email or password is incorrect.';
      case 403:
        return 'The sign-in request was rejected. Reload the page and try again.';
      case 429:
        return error.retryAfterSeconds !== null
          ? `Too many sign-in attempts. Try again in ${error.retryAfterSeconds} seconds.`
          : 'Too many sign-in attempts. Try again shortly.';
      default:
        return error.status >= 500
          ? 'The server could not complete the sign-in. Try again.'
          : error.message;
    }
  }
  return 'The API could not be reached. Check your connection and try again.';
}

/**
 * AUTH-101 — Evergreen Commerce Split-Screen Login Page.
 *
 * Left column: Brand storytelling card in royal purple (#6938D3).
 * Right column: High-conversion admin sign-in form with full keyboard accessibility.
 */
export default function LoginPage() {
  const { status, notice, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  if (status === 'checking') {
    return <FullPageLoading />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/products" replace />;
  }

  function validate(): boolean {
    const errors: FieldErrors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);

    if (errors.email) {
      emailRef.current?.focus();
      return false;
    }

    if (errors.password) {
      passwordRef.current?.focus();
      return false;
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
      navigate('/products', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const mapped: FieldErrors = {};
        for (const detail of error.details) {
          if (detail.field === 'email' || detail.field === 'password') {
            mapped[detail.field] = detail.message;
          }
        }

        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
          setFormError('Check the highlighted fields and try again.');
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError(describeFailure(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--bg-background)] p-4 sm:p-6 lg:p-10 transition-colors">
      <ThemeToggle className="fixed right-6 top-6 z-20" />

      {/* Split-Screen Bento Container (max-width: 1080px) */}
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[var(--border-outline)] bg-[var(--bg-surface)] shadow-2xl lg:grid-cols-12 transition-colors">
        {/* Left Column — Royal Purple Brand Panel (5 cols on lg) */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-[var(--brand-primary)] p-8 text-white sm:p-12 lg:col-span-5">
          {/* Subtle Aurora Ambient Radial Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-black/20 blur-3xl"
          />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Production Workspace
            </div>
            <h2 className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              EVERGREEN
            </h2>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
              COMMERCE ADMIN
            </p>
          </div>

          {/* Center Storytelling Headline */}
          <div className="relative z-10 my-10 lg:my-0">
            <blockquote className="text-xl font-medium leading-relaxed tracking-tight text-white/95 sm:text-2xl">
              &ldquo;A calmer way to run your store. Your operations, customers and growth &mdash; all in one considered workspace.&rdquo;
            </blockquote>
          </div>

          {/* Bottom Security Badge */}
          <div className="relative z-10 flex items-center gap-3 text-xs text-white/80">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 text-white/90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Sanctum-authenticated administrative boundary</span>
          </div>
        </div>

        {/* Right Column — Focused Form Container (7 cols on lg) */}
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:col-span-7">
          <div className="mx-auto w-full max-w-md">
            {/* Form Heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-on-background)] sm:text-3xl">
                Admin sign in
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Welcome back. Sign in to continue to your admin workspace.
              </p>
            </div>

            {/* Form Box */}
            <form
              noValidate
              aria-label="Admin sign in"
              onSubmit={(event) => void handleSubmit(event)}
              className="space-y-5"
            >
              {notice && (
                <p
                  role="status"
                  className="rounded-2xl border border-[var(--border-outline)] bg-[var(--bg-surface-variant)] px-4 py-3 text-sm text-[var(--text-on-background)]"
                >
                  {notice}
                </p>
              )}

              {formError && (
                <p
                  role="alert"
                  className="rounded-2xl border border-[var(--status-error)]/30 bg-[var(--status-error-container)] px-4 py-3 text-sm text-[var(--status-on-error-container)]"
                >
                  {formError}
                </p>
              )}

              {/* Email Input */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-semibold text-[var(--text-on-background)]"
                >
                  Email
                </label>
                <input
                  ref={emailRef}
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={fieldErrors.email !== undefined}
                  aria-describedby={fieldErrors.email ? 'admin-email-error' : undefined}
                  placeholder="admin@eshopverse.store"
                  className="mt-1.5 min-h-12 w-full rounded-2xl border border-[var(--border-outline)] bg-[var(--bg-surface-variant)] px-4 text-sm text-[var(--text-on-background)] placeholder:text-[var(--text-disabled)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-colors"
                />
                {fieldErrors.email && (
                  <p id="admin-email-error" className="mt-1.5 text-xs font-medium text-[var(--status-error)]">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-semibold text-[var(--text-on-background)]"
                >
                  Password
                </label>
                <input
                  ref={passwordRef}
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={fieldErrors.password !== undefined}
                  aria-describedby={fieldErrors.password ? 'admin-password-error' : undefined}
                  placeholder="••••••••••••"
                  className="mt-1.5 min-h-12 w-full rounded-2xl border border-[var(--border-outline)] bg-[var(--bg-surface-variant)] px-4 text-sm text-[var(--text-on-background)] placeholder:text-[var(--text-disabled)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-colors"
                />
                {fieldErrors.password && (
                  <p id="admin-password-error" className="mt-1.5 text-xs font-medium text-[var(--status-error)]">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Controls Row: Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded-md border-[var(--border-outline)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                  />
                  <span className="text-xs text-[var(--text-secondary)]">Remember me</span>
                </label>

                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[var(--brand-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Full-Width Sign In Button */}
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[var(--brand-primary)] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            {/* Footer Notice & Public Links */}
            <div className="mt-8 border-t border-[var(--border-outline-variant)] pt-6 text-center text-xs text-[var(--text-secondary)] space-y-2">
              <p>No admin self-registration &mdash; accounts are provisioned by the backend.</p>
              <div className="flex justify-center gap-4 text-xs font-medium text-[var(--brand-primary)]">
                <Link to="/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
                <span>&bull;</span>
                <Link to="/terms" className="hover:underline">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
