import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';

interface LegalLayoutProps {
  title: string;
  children: ReactNode;
}

/**
 * Public legal pages linked from the Google OAuth consent screen.
 *
 * These routes deliberately sit outside `RequireAdmin` so anyone reviewing the
 * sign-in consent can read them without an administrator account.
 */
function LegalLayout({ title, children }: LegalLayoutProps) {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <ThemeToggle className="fixed right-4 top-4 z-10" />
      <article className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-glass sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          EShop Verse
        </p>
        <h1 className="mt-2 text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">Last updated: 8 November 2026</p>
        <div className="mt-6 space-y-5 text-sm leading-6 text-muted-foreground">{children}</div>
        <div className="mt-8 border-t border-border pt-4">
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to sign in
          </Link>
        </div>
      </article>
    </main>
  );
}

function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-foreground">{heading}</h2>
      <div className="mt-1 space-y-2">{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        EShop Verse is a portfolio demonstration of an online store. This policy explains what
        information the Android customer app, the web administration panel, and the REST API handle,
        and the choices you have. It applies when you create an account with Google Sign-In or place a
        demonstration order.
      </p>

      <Section heading="Information we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium text-foreground">Google account details.</span> When you
            choose Google Sign-In, Google provides your name, email address, Google account
            identifier, and, if available, a profile picture URL. We never receive your Google
            password.
          </li>
          <li>
            <span className="font-medium text-foreground">Profile details.</span> The first and last
            name you confirm in the app.
          </li>
          <li>
            <span className="font-medium text-foreground">Order details.</span> The products,
            quantities, totals, and the contact and shipping information you submit during checkout.
          </li>
          <li>
            <span className="font-medium text-foreground">Technical data.</span> IP address, request
            timestamps, and error logs needed to operate, secure, and troubleshoot the service.
          </li>
          <li>
            <span className="font-medium text-foreground">No payment card data.</span> Payment in
            this demonstration is simulated; no card number or bank details are collected or stored.
          </li>
        </ul>
      </Section>

      <Section heading="How we use information">
        <p>
          We use this information to create and authenticate your account, display your profile and
          order history, process demonstration orders, keep the service secure, and respond to your
          requests. We do not sell personal information or use it for third-party advertising.
        </p>
      </Section>

      <Section heading="When information is shared">
        <p>
          Information is shared only with the hosting and database providers that run the
          demonstration, and only as needed to provide the service. We may also disclose information
          when required by law or to protect the service and its users. Product images and other
          content are served by the same origin as the application.
        </p>
      </Section>

      <Section heading="Retention">
        <p>
          Account and order records are kept while the demonstration account exists. Server logs are
          kept only as long as needed for security and troubleshooting. You can ask us to delete your
          account and associated data using the contact details below.
        </p>
      </Section>

      <Section heading="Security">
        <p>
          Traffic uses HTTPS. On Android, the session token is stored using platform-protected
          storage, and passwords, tokens, and full request bodies are never written to logs. No
          method of transmission or storage is completely secure, so absolute security cannot be
          guaranteed.
        </p>
      </Section>

      <Section heading="Your choices">
        <ul className="list-disc space-y-1 pl-5">
          <li>Sign out at any time from the Account screen.</li>
          <li>
            Review or revoke this app&apos;s access to your Google account at{' '}
            <a
              className="font-medium text-primary underline-offset-2 hover:underline"
              href="https://myaccount.google.com/permissions"
            >
              myaccount.google.com/permissions
            </a>
            .
          </li>
          <li>
            Request access to, correction of, or deletion of your account data by contacting the
            project maintainers.
          </li>
        </ul>
      </Section>

      <Section heading="Children">
        <p>
          The service is not directed to children under 13, and we do not knowingly collect their
          personal information.
        </p>
      </Section>

      <Section heading="Changes to this policy">
        <p>
          We may update this policy as the demonstration changes. The revised policy will be posted
          on this page with a new update date.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions or requests about this policy can be raised through the project repository at{' '}
          <a
            className="font-medium text-primary underline-offset-2 hover:underline"
            href="https://github.com/Averon-Labs/eshop-verse/issues"
          >
            github.com/Averon-Labs/eshop-verse
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p>
        These terms govern your use of EShop Verse, a portfolio demonstration of an online store. By
        creating an account or using the Android app, the web administration panel, or the REST API,
        you agree to these terms.
      </p>

      <Section heading="Demonstration service">
        <p>
          EShop Verse is a demonstration project. Products, prices, stock levels, and orders are
          fictional. Payment is simulated, nothing is sold, and no product is shipped. Do not submit
          real payment details.
        </p>
      </Section>

      <Section heading="Your account">
        <p>
          You may sign in with Google Sign-In or with the credentials you register. Keep access to
          your Google account and device secure. You are responsible for activity performed through
          your account. Provide accurate profile and order information, and tell us promptly if you
          believe your account has been misused.
        </p>
      </Section>

      <Section heading="Acceptable use">
        <ul className="list-disc space-y-1 pl-5">
          <li>Do not attempt to disrupt, overload, probe, or gain unauthorized access to the service.</li>
          <li>Do not upload unlawful, harmful, or infringing content.</li>
          <li>Do not use automated means to scrape or abuse the API beyond normal demonstration use.</li>
          <li>Do not impersonate another person or misrepresent your affiliation.</li>
        </ul>
      </Section>

      <Section heading="Orders and pricing">
        <p>
          Orders are recorded to demonstrate the checkout flow. Displayed prices and totals are
          illustrative, and no charge is made. We may cancel or reset demonstration data at any time.
        </p>
      </Section>

      <Section heading="Availability and changes">
        <p>
          The service is provided for demonstration and may be changed, suspended, or discontinued at
          any time without notice. Features may be added or removed.
        </p>
      </Section>

      <Section heading="Intellectual property">
        <p>
          The project name, interface, and content remain the property of their respective owners.
          You receive a limited, non-exclusive right to use the demonstration for evaluation. Product
          images and trademarks belong to their respective owners.
        </p>
      </Section>

      <Section heading="Disclaimer">
        <p>
          The service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties
          of any kind, express or implied, including fitness for a particular purpose,
          merchantability, and non-infringement.
        </p>
      </Section>

      <Section heading="Limitation of liability">
        <p>
          To the extent permitted by law, the project maintainers are not liable for indirect,
          incidental, or consequential damages, or for loss of data or profits, arising from use of
          the demonstration. Nothing in these terms limits liability that cannot be limited by law.
        </p>
      </Section>

      <Section heading="Ending use">
        <p>
          You may stop using the service and sign out at any time. We may suspend or end access when
          these terms are breached or when the demonstration is retired.
        </p>
      </Section>

      <Section heading="Changes to these terms">
        <p>
          We may update these terms as the demonstration changes. The revised terms will be posted on
          this page with a new update date. Continued use after a change means you accept the
          updated terms.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about these terms can be raised through the project repository at{' '}
          <a
            className="font-medium text-primary underline-offset-2 hover:underline"
            href="https://github.com/Averon-Labs/eshop-verse/issues"
          >
            github.com/Averon-Labs/eshop-verse
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
