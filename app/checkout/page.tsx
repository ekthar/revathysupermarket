import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Place your Revathy Supermarket order with COD or UPI on delivery."
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,rgba(15,138,95,0.12),rgba(167,209,41,0.16))] p-5 sm:p-7">
        <p className="text-xs font-black uppercase text-primary">Secure local order</p>
        <h1 className="mt-2 font-display text-4xl font-black leading-tight">Checkout</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
        Add your delivery details. Your location is checked against the 5 KM delivery radius before the order is submitted.
        </p>
      </section>
      <CheckoutForm />
    </main>
  );
}
