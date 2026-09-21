"use client";

import { Check, CreditCard } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  BILLING_HISTORY,
  formatLimit,
  useBilling,
} from "@/lib/billingStore";
import {
  CancelSubscriptionModal,
  UpgradeCheckout,
} from "./BillingModals";

const FREE_FEATURES = [
  "1 active project",
  "1 client",
  "Basic client portal",
  "Tasks",
  "File sharing",
  "Payment links",
  "Dueso branding",
];

const PRO_FEATURES = [
  "Unlimited projects",
  "Unlimited clients",
  "Custom portal branding",
  "Invoice management",
  "Messaging",
  "Project analytics",
  "Remove Dueso branding",
];

function formatBillingDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BillingPanel() {
  const {
    state,
    limits,
    isPro,
    upgradeToPro,
    startCancel,
    keepPro,
  } = useBilling();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paymentBanner, setPaymentBanner] = useState<
    null | "success" | "failed" | "expired" | "canceled"
  >(null);

  const nextDate = formatBillingDate(state.nextBillingDate);

  return (
    <div className="space-y-4">
      {paymentBanner === "success" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Payment successful.
        </div>
      ) : null}
      {paymentBanner === "failed" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Your payment couldn&apos;t be processed.{" "}
          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      ) : null}
      {paymentBanner === "expired" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your payment method has expired. Update payment method.
        </div>
      ) : null}
      {paymentBanner === "canceled" || state.status === "canceling" ? (
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink">
          {state.status === "canceling" ? (
            <>
              Pro active until {formatBillingDate(state.proUntil || state.nextBillingDate)}.{" "}
              <button
                type="button"
                onClick={keepPro}
                className="font-semibold underline"
              >
                Keep Pro
              </button>
            </>
          ) : (
            "Your Pro subscription has been canceled."
          )}
        </div>
      ) : null}

      {/* Current plan */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-ink">Your Plan</h3>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-[family-name:var(--font-brand)] text-3xl font-bold text-ink">
                {isPro ? "Pro" : "Free"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {isPro ? "$9 / month" : "$0 / month"}
              </p>
              {isPro ? (
                <p className="mt-2 text-xs text-muted">
                  Next billing date: {nextDate}
                </p>
              ) : null}
            </div>
            {isPro ? (
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-border px-4 text-sm font-medium hover-soft"
              >
                Manage Subscription
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setUpgradeOpen(true)}
                className="inline-flex h-10 cursor-pointer items-center rounded-[8px] btn-accent px-4 text-sm font-semibold"
              >
                Upgrade to Pro
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Projects",
                value: formatLimit(state.usage.projects, limits.projects),
                atLimit:
                  !isPro && state.usage.projects >= limits.projects,
              },
              {
                label: "Clients",
                value: formatLimit(state.usage.clients, limits.clients),
                atLimit: !isPro && state.usage.clients >= limits.clients,
              },
              {
                label: "Storage",
                value: `${state.usage.storageGb} GB / ${limits.storageGb} GB`,
                atLimit: false,
              },
            ].map((u) => (
              <div
                key={u.label}
                className={`rounded-xl px-4 py-3 ${
                  u.atLimit ? "bg-amber-50 ring-1 ring-amber-200" : "bg-surface"
                }`}
              >
                <p className="text-xs text-muted">{u.label}</p>
                <p className="mt-1 text-sm font-semibold text-ink">{u.value}</p>
              </div>
            ))}
          </div>

          {!isPro && state.usage.projects >= limits.projects ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You&apos;ve reached your project limit.{" "}
              <button
                type="button"
                onClick={() => setUpgradeOpen(true)}
                className="font-semibold underline"
              >
                Upgrade to Pro
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* Plans comparison */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-[family-name:var(--font-brand)] text-lg font-bold text-ink">
                Free
              </h3>
              <p className="text-sm text-muted">$0 / month</p>
            </div>
          </div>
          <ul className="space-y-2.5 p-5 text-sm text-muted">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-ink" strokeWidth={2} />
                {f}
              </li>
            ))}
          </ul>
          {!isPro ? (
            <div className="border-t border-border px-5 py-4">
              <span className="inline-flex rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
                Current plan
              </span>
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-2xl border border-ink bg-card">
          <div className="border-b border-border px-5 py-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-[family-name:var(--font-brand)] text-lg font-bold text-ink">
                Pro
              </h3>
              <p className="text-sm text-muted">$9 / month</p>
            </div>
          </div>
          <ul className="space-y-2.5 p-5 text-sm text-muted">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-ink" strokeWidth={2} />
                {f}
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-5 py-4">
            {isPro ? (
              <span className="inline-flex rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-ink">
                Current plan
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setUpgradeOpen(true)}
                className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-[8px] btn-accent px-4 text-sm font-semibold"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Subscription details for Pro */}
      {isPro ? (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-ink">Subscription</h3>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">Dueso Pro</p>
                <p className="text-xs text-muted">$9 / month</p>
                <p className="mt-1 text-xs text-muted">
                  Next payment: {nextDate}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm text-ink">
                <CreditCard className="size-4 text-muted" strokeWidth={1.75} />
                •••• {state.paymentMethodLast4}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPaymentBanner("expired")}
                className="h-10 cursor-pointer rounded-xl border border-border px-4 text-sm font-medium hover-soft"
              >
                Change payment method
              </button>
              <button
                type="button"
                className="h-10 cursor-pointer rounded-xl border border-border px-4 text-sm font-medium hover-soft"
              >
                View invoices
              </button>
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="h-10 cursor-pointer rounded-xl px-4 text-sm font-medium text-red-600 hover-soft"
              >
                Cancel subscription
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Billing history */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-ink">Billing History</h3>
        </div>
        {isPro ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {BILLING_HISTORY.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-ink">{row.date}</td>
                    <td className="px-5 py-3 text-ink">{row.description}</td>
                    <td className="px-5 py-3 text-ink">{row.amount}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        className="cursor-pointer text-xs font-medium text-muted hover:text-ink"
                      >
                        View invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted">
            No billing history on the Free plan.
          </p>
        )}
      </section>

      <p className="text-xs text-muted">
        Tip: card ending in 0000 simulates a failed payment.{" "}
        <Link href="/settings" className="underline hover:text-ink">
          Back to Settings
        </Link>
      </p>

      <UpgradeCheckout
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onSuccess={() => {
          upgradeToPro();
          setPaymentBanner("success");
        }}
      />

      <CancelSubscriptionModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        untilDate={nextDate}
        onConfirmCancel={() => {
          startCancel();
          setPaymentBanner("canceled");
        }}
      />
    </div>
  );
}
