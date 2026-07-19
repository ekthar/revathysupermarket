import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${SITE.name}`,
};

export default function TermsPage() {
  const storeName = SITE.name;

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
      <h1 className="font-display text-3xl md:text-4xl font-black text-neutral-900 dark:text-white">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: July 2026</p>

      <div className="mt-8 prose prose-neutral dark:prose-invert prose-sm max-w-none">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using {storeName} (&quot;Service&quot;), you agree to be bound by these
          Terms of Service. If you do not agree, please do not use the Service.
        </p>

        <h2>2. Account Registration</h2>
        <p>
          You must provide accurate information when creating an account. You are responsible
          for maintaining the confidentiality of your login credentials.
        </p>

        <h2>3. Orders and Payments</h2>
        <ul>
          <li>All prices are in Indian Rupees (INR) and include applicable taxes unless stated otherwise.</li>
          <li>We reserve the right to cancel or modify orders due to pricing errors, stock unavailability, or suspected fraud.</li>
          <li>Payment methods include Cash on Delivery (COD), UPI on delivery, and online payment via Razorpay.</li>
          <li>Delivery fees may apply based on order value and distance.</li>
        </ul>

        <h2>4. Delivery</h2>
        <ul>
          <li>Delivery is available within our serviceable area (currently ~5km radius).</li>
          <li>Estimated delivery times are approximations and not guaranteed.</li>
          <li>A valid delivery address and contactable phone number are required.</li>
          <li>If you are unreachable at delivery time, the order may be returned to store.</li>
        </ul>

        <h2>5. Returns and Refunds</h2>
        <ul>
          <li>Return requests must be raised within 24 hours of delivery.</li>
          <li>Items must be unused and in original condition.</li>
          <li>Approved refunds are processed to your wallet or original payment method within 5-7 business days.</li>
          <li>Perishable items (fruits, vegetables, dairy) can only be returned if damaged/spoiled on arrival.</li>
        </ul>

        <h2>6. Loyalty Program</h2>
        <p>
          Points earned through our loyalty program have no cash value and may be modified
          or discontinued at any time with reasonable notice.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          {storeName} shall not be liable for any indirect, incidental, or consequential damages
          arising from use of the Service.
        </p>

        <h2>8. Changes to Terms</h2>
        <p>
          We may update these Terms at any time. Continued use of the Service after changes
          constitutes acceptance of the new Terms.
        </p>

        <h2>9. Contact</h2>
        <p>
          For questions about these Terms, contact us at support@{SITE.url.replace("https://", "")}.
        </p>
      </div>
    </main>
  );
}
