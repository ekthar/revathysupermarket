import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${SITE.name}`,
};

export default function PrivacyPage() {
  const storeName = SITE.name;

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
      <h1 className="font-display text-3xl md:text-4xl font-black text-neutral-900 dark:text-white">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: July 2026</p>

      <div className="mt-8 prose prose-neutral dark:prose-invert prose-sm max-w-none">
        <h2>1. Information We Collect</h2>
        <ul>
          <li><strong>Account data:</strong> Name, email, phone number, delivery addresses</li>
          <li><strong>Order data:</strong> Purchase history, payment method preferences, delivery instructions</li>
          <li><strong>Device data:</strong> Push notification tokens, app version, device type</li>
          <li><strong>Location data:</strong> Delivery address coordinates (only when you provide an address)</li>
        </ul>

        <h2>2. How We Use Your Data</h2>
        <ul>
          <li>Processing and delivering your orders</li>
          <li>Sending order status notifications (WhatsApp, SMS, Telegram, push, email)</li>
          <li>Providing customer support</li>
          <li>Managing your loyalty points and wallet</li>
          <li>Personalizing your shopping experience (recommendations, offers)</li>
          <li>Preventing fraud and ensuring security</li>
        </ul>

        <h2>3. Data Sharing</h2>
        <p>We share your data only with:</p>
        <ul>
          <li><strong>Delivery partners:</strong> Name, address, phone (for delivery purposes only)</li>
          <li><strong>Payment processors:</strong> Razorpay (for online payments)</li>
          <li><strong>Communication providers:</strong> WhatsApp Business API, SMS gateway, Firebase (for notifications)</li>
        </ul>
        <p>We never sell your personal data to third parties.</p>

        <h2>4. Data Security</h2>
        <ul>
          <li>Passwords are hashed using bcrypt (never stored in plain text)</li>
          <li>OTP codes expire after 5 minutes</li>
          <li>Account locks after 5 failed login attempts</li>
          <li>All data is encrypted in transit (HTTPS/TLS)</li>
          <li>Database access is restricted to authorized services only</li>
        </ul>

        <h2>5. Data Retention</h2>
        <ul>
          <li>Account data: retained while account is active</li>
          <li>Order history: retained for 3 years (tax/legal requirements)</li>
          <li>OTP tokens: automatically deleted after 24 hours</li>
          <li>Session data: expires after 30 days of inactivity</li>
        </ul>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li><strong>Access:</strong> View all data we have about you (via Account settings)</li>
          <li><strong>Correction:</strong> Update your profile information</li>
          <li><strong>Deletion:</strong> Request account deletion (see Account &gt; Settings &gt; Delete Account)</li>
          <li><strong>Portability:</strong> Export your order history in CSV format</li>
          <li><strong>Opt-out:</strong> Disable promotional notifications in Settings</li>
        </ul>

        <h2>7. Cookies and Local Storage</h2>
        <p>
          We use essential cookies for authentication and session management.
          Local storage is used for cart persistence and theme preferences.
          No third-party tracking cookies are used.
        </p>

        <h2>8. Children&#39;s Privacy</h2>
        <p>
          Our Service is not intended for children under 16. We do not knowingly
          collect data from minors.
        </p>

        <h2>9. Contact</h2>
        <p>
          For privacy concerns or data requests, contact us at privacy@{SITE.url.replace("https://", "")}.
        </p>
      </div>
    </main>
  );
}
