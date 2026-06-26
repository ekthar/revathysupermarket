"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white"
    >
      Print Invoice
    </button>
  );
}
