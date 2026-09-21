"use client";

import Popup from "@/components/Popup";
import { useToast } from "@/components/ToastProvider";
import {
  formatDemoMoney,
  paymentAmountClass,
} from "@/data/demoWorkspace";
import {
  StatusBadge,
  paymentStatusIcon,
  paymentStatusTone,
} from "@/components/ui/StatusBadge";
import { useDemoState } from "./DemoStateProvider";

export function DemoInvoiceModal() {
  const {
    invoiceModalId,
    closeInvoiceModal,
    invoices,
    selectedProject,
    workspace,
    markInvoicePaid,
  } = useDemoState();
  const toast = useToast();

  const invoice = invoices.find((i) => i.id === invoiceModalId) ?? null;
  if (!invoice) return null;

  const paid = invoice.status === "paid";

  return (
    <Popup
      open
      onClose={closeInvoiceModal}
      labelledBy="demo-invoice-title"
      panelClassName="w-full max-w-md bg-card"
      showCloseButton
    >
      <div className="p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-soft">
          Invoice
        </p>
        <h2
          id="demo-invoice-title"
          className="mt-1 text-lg font-semibold tracking-tight text-ink"
        >
          {invoice.number}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {selectedProject?.name ?? "Project"} · {selectedProject?.clientName}
        </p>

        <div className="mt-5 rounded-[var(--radius-md)] border border-border bg-background p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Amount</p>
              <p
                className={`mt-1 text-2xl font-semibold tracking-tight ${paymentAmountClass(invoice.status)}`}
              >
                {formatDemoMoney(invoice.amount, workspace.currency)}
              </p>
            </div>
            <StatusBadge
              label={invoice.status}
              tone={paymentStatusTone(invoice.status)}
              icon={paymentStatusIcon(invoice.status)}
            />
          </div>
          <p className="mt-3 text-xs text-muted">{invoice.dateLabel}</p>
          <p className="mt-4 text-xs leading-relaxed text-muted-soft">
            Demo payment only — no Stripe or real charges. Paying updates local
            demo state in both the portal and workspace.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={closeInvoiceModal}
            className="btn-secondary h-10 px-4 text-sm font-medium"
          >
            Close
          </button>
          {!paid ? (
            <button
              type="button"
              onClick={() => {
                markInvoicePaid(invoice.id);
                toast.success("Invoice marked as paid");
                closeInvoiceModal();
              }}
              className="btn-accent h-10 px-4 text-sm font-medium"
            >
              Pay Invoice
            </button>
          ) : null}
        </div>
      </div>
    </Popup>
  );
}
