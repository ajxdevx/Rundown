"use client";

import BillingPanel from "@/components/billing/BillingPanel";
import DashboardTopBar from "@/components/DashboardTopBar";

export default function BillingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar context="Billing" />
      <div className="w-full flex-1 px-6 py-8 sm:px-8">
        <div className="mb-6">
          <h2 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Billing
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Your plan, usage, and subscription.
          </p>
        </div>
        <BillingPanel />
      </div>
    </div>
  );
}
