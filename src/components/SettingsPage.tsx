"use client";

import {
  Bell,
  Building2,
  Check,
  CreditCard,
  Loader2,
  Palette,
  Shield,
  SlidersHorizontal,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import DashboardTopBar from "./DashboardTopBar";
import Popup from "./Popup";
import BillingPanel from "./billing/BillingPanel";
import { useToastOptional } from "./ToastProvider";
import { backgroundSync } from "@/lib/optimistic";
import { useInitialLoading } from "@/hooks/useInitialLoading";
import { SettingsSkeleton } from "./skeletons";

type SectionId =
  | "profile"
  | "workspace"
  | "branding"
  | "preferences"
  | "notifications"
  | "security"
  | "billing";

type SaveState = "idle" | "saving" | "saved" | "error";

const NAV: { id: SectionId; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
];

const inputClass =
  "h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-ink";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function Card({
  title,
  children,
  danger,
}: {
  title?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-card ${
        danger ? "border-red-200" : "border-border"
      }`}
    >
      {title ? (
        <div
          className={`border-b px-5 py-4 ${
            danger ? "border-red-100" : "border-border"
          }`}
        >
          <h3
            className={`text-sm font-semibold ${
              danger ? "text-red-600" : "text-ink"
            }`}
          >
            {title}
          </h3>
        </div>
      ) : null}
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        checked ? "bg-ink" : "bg-surface-strong"
      }`}
    >
      <span
        className={`absolute size-5 rounded-full bg-card shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="font-[family-name:var(--font-brand)] text-2xl font-bold tracking-tight text-ink">
        {title}
      </h2>
      {subtitle ? <p className="mt-1.5 text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToastOptional();
  const loading = useInitialLoading(380);
  const [section, setSection] = useState<SectionId>("profile");
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [pendingSection, setPendingSection] = useState<SectionId | null>(null);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [deleteWsOpen, setDeleteWsOpen] = useState(false);
  const [deleteAcctOpen, setDeleteAcctOpen] = useState(false);

  // Profile
  const [fullName, setFullName] = useState("Alex Johnson");
  const [email] = useState("alex@example.com");
  const [role, setRole] = useState("Freelancer");

  // Workspace
  const [workspaceName, setWorkspaceName] = useState("Acme Studio");
  const [businessType, setBusinessType] = useState("Studio");
  const [wsCurrency, setWsCurrency] = useState("USD");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );

  // Branding
  const [brandColor, setBrandColor] = useState("#C8FF3D");
  const [poweredBy, setPoweredBy] = useState(true);

  // Preferences
  const [prefCurrency, setPrefCurrency] = useState("USD");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [defaultStatus, setDefaultStatus] = useState("Active");
  const [portalVisible, setPortalVisible] = useState(true);

  // Notifications
  const [notifs, setNotifs] = useState({
    portalView: { email: true, inApp: true },
    fileDownload: { email: true, inApp: true },
    taskComplete: { email: false, inApp: true },
    newMessage: { email: true, inApp: true },
    invoicePaid: { email: true, inApp: true },
    invoiceOverdue: { email: true, inApp: true },
  });

  // Security
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const markDirty = useCallback(() => {
    setDirty(true);
    setSaveState("idle");
  }, []);

  const requestSection = (id: SectionId) => {
    if (id === section) return;
    if (dirty) {
      setPendingSection(id);
      setUnsavedOpen(true);
      return;
    }
    setSection(id);
    setSaveState("idle");
  };

  const discardAndSwitch = () => {
    setDirty(false);
    setUnsavedOpen(false);
    if (pendingSection) {
      setSection(pendingSection);
      setPendingSection(null);
    }
    setSaveState("idle");
  };

  const save = async () => {
    setSaveState("saving");
    await new Promise((r) => setTimeout(r, 600));
    const ok = Math.random() > 0.05;
    if (!ok) {
      setSaveState("error");
      return;
    }
    setDirty(false);
    setSaveState("saved");
  };

  useEffect(() => {
    if (saveState !== "saved") return;
    const t = setTimeout(() => setSaveState("idle"), 2200);
    return () => clearTimeout(t);
  }, [saveState]);

  const setNotif = (
    key: keyof typeof notifs,
    channel: "email" | "inApp",
    value: boolean,
  ) => {
    setNotifs((prev) => ({
      ...prev,
      [key]: { ...prev[key], [channel]: value },
    }));
    markDirty();
  };

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar context="Settings" />

      {loading ? (
        <div className="w-full flex-1 px-6 py-8 sm:px-8">
          <SettingsSkeleton />
        </div>
      ) : (
      <div className="flex w-full flex-1 flex-col gap-6 px-6 py-8 lg:flex-row sm:px-8">
        {/* Settings nav */}
        <aside className="w-full shrink-0 lg:w-56">
          <h2 className="mb-3 font-[family-name:var(--font-brand)] text-xl font-bold tracking-tight text-ink lg:text-2xl">
            Settings
          </h2>
          <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => requestSection(item.id)}
                  className={`flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    active
                      ? "bg-ink text-card"
                      : "text-muted hover-soft"
                  }`}
                >
                  <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Status bar */}
          <div className="mb-4 flex min-h-10 flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              {saveState === "saving" ? (
                <span className="inline-flex items-center gap-2 text-muted">
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </span>
              ) : saveState === "saved" ? (
                <span className="inline-flex items-center gap-2 text-emerald-600">
                  <Check className="size-4" strokeWidth={2.25} />
                  Changes saved
                </span>
              ) : saveState === "error" ? (
                <span className="text-red-500">
                  Couldn&apos;t save changes. Please try again.
                </span>
              ) : dirty ? (
                <span className="text-muted">You have unsaved changes</span>
              ) : (
                <span className="text-transparent">—</span>
              )}
            </div>
            {(dirty || saveState === "error") &&
            section !== "billing" &&
            section !== "security" ? (
              <button
                type="button"
                onClick={save}
                disabled={saveState === "saving"}
                className="inline-flex h-10 cursor-pointer items-center rounded-xl btn-accent px-4 text-sm font-semibold disabled:opacity-60"
              >
                Save Changes
              </button>
            ) : null}
          </div>

          {section === "profile" && (
            <>
              <SectionHeader
                title="Profile"
                subtitle="Your personal account details."
              />
              <div className="space-y-4">
                <Card title="Profile picture">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex size-20 items-center justify-center rounded-2xl bg-ink text-lg font-semibold text-card">
                      AJ
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={markDirty}
                        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-ink hover-soft"
                      >
                        <Upload className="size-4" strokeWidth={1.75} />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={markDirty}
                        className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-border px-4 text-sm font-medium text-ink hover-soft"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={markDirty}
                        className="inline-flex h-10 cursor-pointer items-center rounded-xl px-4 text-sm font-medium text-red-500 hover-soft"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </Card>

                <Card>
                  <Field label="Full name">
                    <input
                      className={inputClass}
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        markDirty();
                      }}
                    />
                  </Field>
                  <Field label="Email" hint="Verified">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        className={`${inputClass} flex-1`}
                        value={email}
                        readOnly
                      />
                      <span className="inline-flex rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-600">
                        Verified
                      </span>
                    </div>
                  </Field>
                  <Field label="Role">
                    <select
                      className={inputClass}
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value);
                        markDirty();
                      }}
                    >
                      {[
                        "Freelancer",
                        "Agency owner",
                        "Designer",
                        "Developer",
                        "Consultant",
                        "Other",
                      ].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </Field>
                </Card>
              </div>
            </>
          )}

          {section === "workspace" && (
            <>
              <SectionHeader
                title="Workspace"
                subtitle="Shared details for your team and clients."
              />
              <div className="space-y-4">
                <Card>
                  <Field label="Workspace name">
                    <input
                      className={inputClass}
                      value={workspaceName}
                      onChange={(e) => {
                        setWorkspaceName(e.target.value);
                        markDirty();
                      }}
                    />
                  </Field>
                  <Field label="Business type">
                    <select
                      className={inputClass}
                      value={businessType}
                      onChange={(e) => {
                        setBusinessType(e.target.value);
                        markDirty();
                      }}
                    >
                      {[
                        "Freelancer",
                        "Agency",
                        "Studio",
                        "Consultancy",
                        "Other",
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Default currency">
                    <select
                      className={inputClass}
                      value={wsCurrency}
                      onChange={(e) => {
                        setWsCurrency(e.target.value);
                        markDirty();
                      }}
                    >
                      {["USD", "EUR", "GBP", "MAD", "CAD", "AUD"].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Timezone" hint="Detected from your browser">
                    <select
                      className={inputClass}
                      value={timezone}
                      onChange={(e) => {
                        setTimezone(e.target.value);
                        markDirty();
                      }}
                    >
                      {[
                        timezone,
                        "UTC",
                        "America/New_York",
                        "Europe/London",
                        "Africa/Casablanca",
                        "Europe/Paris",
                      ]
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                    </select>
                  </Field>
                </Card>

                <Card title="Danger Zone" danger>
                  <p className="text-sm text-muted">
                    Permanently delete this workspace and its settings. Projects
                    are not deleted from client portals until you remove them
                    separately.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDeleteWsOpen(true)}
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" strokeWidth={1.75} />
                    Delete Workspace
                  </button>
                </Card>
              </div>
            </>
          )}

          {section === "branding" && (
            <>
              <SectionHeader
                title="Client Portal Branding"
                subtitle="How your brand appears to clients."
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <Card title="Logo">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface">
                        <Image
                          src="/logo.png"
                          alt=""
                          width={48}
                          height={48}
                          className="size-12 object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={markDirty}
                          className="h-10 cursor-pointer rounded-xl border border-border px-4 text-sm font-medium hover-soft"
                        >
                          Upload
                        </button>
                        <button
                          type="button"
                          onClick={markDirty}
                          className="h-10 cursor-pointer rounded-xl border border-border px-4 text-sm font-medium hover-soft"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={markDirty}
                          className="h-10 cursor-pointer rounded-xl px-4 text-sm font-medium text-red-500 hover-soft"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </Card>

                  <Card title="Brand color">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => {
                          setBrandColor(e.target.value);
                          markDirty();
                        }}
                        className="size-12 cursor-pointer rounded-xl border border-border bg-card p-1"
                      />
                      <input
                        className={`${inputClass} flex-1 font-mono uppercase`}
                        value={brandColor}
                        onChange={(e) => {
                          setBrandColor(e.target.value);
                          markDirty();
                        }}
                      />
                    </div>
                  </Card>

                  <Card>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          Show &quot;Powered by Dueso&quot;
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          Available on Free. Hide with Pro.
                        </p>
                      </div>
                      <Toggle
                        checked={poweredBy}
                        onChange={(v) => {
                          const prev = poweredBy;
                          setPoweredBy(v);
                          void backgroundSync().then((r) => {
                            if (!r.ok) {
                              setPoweredBy(prev);
                              toast?.error("Couldn't update this setting.");
                            }
                          });
                        }}
                        label="Powered by Dueso"
                      />
                    </div>
                  </Card>
                </div>

                <Card title="Portal preview">
                  <div className="overflow-hidden rounded-xl border border-border bg-background">
                    <div className="flex items-center gap-2.5 border-b border-border bg-card px-4 py-3">
                      <Image
                        src="/logo.png"
                        alt=""
                        width={28}
                        height={28}
                        className="size-7 object-contain"
                        unoptimized
                      />
                      <span className="text-sm font-semibold text-ink">
                        {workspaceName}
                      </span>
                      <span
                        className="ml-auto size-2.5 rounded-full"
                        style={{ backgroundColor: brandColor }}
                      />
                    </div>
                    <div className="px-4 py-5">
                      <p className="text-base font-semibold text-ink">
                        Website Redesign
                      </p>
                      <p className="mt-3 text-sm font-medium text-ink">
                        75% complete
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-strong">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: "75%",
                            backgroundColor: brandColor,
                          }}
                        />
                      </div>
                      {poweredBy ? (
                        <p className="mt-5 text-center text-[10px] text-muted">
                          Powered by Dueso
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          {section === "preferences" && (
            <>
              <SectionHeader
                title="Preferences"
                subtitle="Defaults for new projects and dates."
              />
              <Card>
                <Field label="Default currency">
                  <select
                    className={inputClass}
                    value={prefCurrency}
                    onChange={(e) => {
                      setPrefCurrency(e.target.value);
                      markDirty();
                    }}
                  >
                    {["USD", "EUR", "GBP", "MAD", "CAD"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Date format">
                  <select
                    className={inputClass}
                    value={dateFormat}
                    onChange={(e) => {
                      setDateFormat(e.target.value);
                      markDirty();
                    }}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </select>
                </Field>
                <Field label="Default project status">
                  <div className="flex gap-2">
                    {["Active", "Draft"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setDefaultStatus(s);
                          markDirty();
                        }}
                        className={`h-10 flex-1 cursor-pointer rounded-xl text-sm font-medium ${
                          defaultStatus === s
                            ? "bg-ink text-card"
                            : "border border-border text-muted hover-soft"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      New projects are visible to clients
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Default client portal visibility for new projects.
                    </p>
                  </div>
                  <Toggle
                    checked={portalVisible}
                    onChange={(v) => {
                      setPortalVisible(v);
                      markDirty();
                    }}
                    label="Portal visibility default"
                  />
                </div>
              </Card>
            </>
          )}

          {section === "notifications" && (
            <>
              <SectionHeader
                title="Notifications"
                subtitle="Choose how you want to be notified."
              />
              <div className="space-y-4">
                <Card title="Project Activity">
                  {(
                    [
                      ["portalView", "Client viewed portal"],
                      ["fileDownload", "Client downloaded a file"],
                      ["taskComplete", "Task completed"],
                      ["newMessage", "New message"],
                    ] as const
                  ).map(([key, label]) => (
                    <div
                      key={key}
                      className="flex flex-col gap-3 border-b border-border pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="text-sm font-medium text-ink">{label}</p>
                      <div className="flex items-center gap-5">
                        <label className="flex items-center gap-2 text-xs text-muted">
                          Email
                          <Toggle
                            checked={notifs[key].email}
                            onChange={(v) => setNotif(key, "email", v)}
                            label={`${label} email`}
                          />
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted">
                          In-app
                          <Toggle
                            checked={notifs[key].inApp}
                            onChange={(v) => setNotif(key, "inApp", v)}
                            label={`${label} in-app`}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </Card>

                <Card title="Payments">
                  {(
                    [
                      ["invoicePaid", "Invoice paid"],
                      ["invoiceOverdue", "Invoice overdue"],
                    ] as const
                  ).map(([key, label]) => (
                    <div
                      key={key}
                      className="flex flex-col gap-3 border-b border-border pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="text-sm font-medium text-ink">{label}</p>
                      <div className="flex items-center gap-5">
                        <label className="flex items-center gap-2 text-xs text-muted">
                          Email
                          <Toggle
                            checked={notifs[key].email}
                            onChange={(v) => setNotif(key, "email", v)}
                            label={`${label} email`}
                          />
                        </label>
                        <label className="flex items-center gap-2 text-xs text-muted">
                          In-app
                          <Toggle
                            checked={notifs[key].inApp}
                            onChange={(v) => setNotif(key, "inApp", v)}
                            label={`${label} in-app`}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </>
          )}

          {section === "security" && (
            <>
              <SectionHeader
                title="Security"
                subtitle="Password and active sessions."
              />
              <div className="space-y-4">
                <Card title="Change Password">
                  <Field label="Current password">
                    <input
                      type="password"
                      className={inputClass}
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      autoComplete="current-password"
                    />
                  </Field>
                  <Field label="New password">
                    <input
                      type="password"
                      className={inputClass}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      autoComplete="new-password"
                    />
                  </Field>
                  <Field label="Confirm new password">
                    <input
                      type="password"
                      className={inputClass}
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      autoComplete="new-password"
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={async () => {
                      setSaveState("saving");
                      await new Promise((r) => setTimeout(r, 500));
                      setCurrentPw("");
                      setNewPw("");
                      setConfirmPw("");
                      setSaveState("saved");
                    }}
                    className="inline-flex h-10 cursor-pointer items-center rounded-xl btn-accent px-4 text-sm font-semibold"
                  >
                    Update Password
                  </button>
                </Card>

                <Card title="Sessions">
                  <div className="rounded-xl bg-surface px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          Current session
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          Chrome · Windows · Casablanca
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Last active: Just now
                        </p>
                      </div>
                      <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        This device
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-border px-4 text-sm font-medium text-ink hover-soft"
                  >
                    Log out of all devices
                  </button>
                </Card>

                <Card title="Delete account" danger>
                  <p className="text-sm text-muted">
                    Permanently delete your Dueso account and workspace data.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDeleteAcctOpen(true)}
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" strokeWidth={1.75} />
                    Delete Account
                  </button>
                </Card>
              </div>
            </>
          )}

          {section === "billing" && (
            <>
              <SectionHeader
                title="Billing"
                subtitle="Your plan and subscription."
              />
              <BillingPanel />
            </>
          )}
        </div>
      </div>
      )}

      {/* Unsaved changes */}
      <Popup
        open={unsavedOpen}
        onClose={() => {
          setUnsavedOpen(false);
          setPendingSection(null);
        }}
        label="Unsaved changes"
        panelClassName="w-full max-w-md bg-card"
        showCloseButton
      >
        <div className="px-6 pb-6 pt-6">
          <h2 className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold text-ink">
            You have unsaved changes
          </h2>
          <p className="mt-2 text-sm text-muted">
            Discard them, or keep editing this section.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={discardAndSwitch}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-border px-5 text-sm font-semibold hover-soft"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => {
                setUnsavedOpen(false);
                setPendingSection(null);
              }}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl btn-accent px-5 text-sm font-semibold"
            >
              Keep Editing
            </button>
          </div>
        </div>
      </Popup>

      {/* Delete workspace */}
      <Popup
        open={deleteWsOpen}
        onClose={() => setDeleteWsOpen(false)}
        label="Delete workspace"
        panelClassName="w-full max-w-md bg-card"
        showCloseButton
      >
        <div className="px-6 pb-6 pt-6">
          <h2 className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold text-ink">
            Delete this workspace?
          </h2>
          <p className="mt-2 text-sm text-muted">
            This action cannot be undone. Confirm carefully.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteWsOpen(false)}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-border px-5 text-sm font-semibold hover-soft"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setDeleteWsOpen(false)}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl bg-red-500 px-5 text-sm font-semibold text-white hover:opacity-90"
            >
              Delete Workspace
            </button>
          </div>
        </div>
      </Popup>

      {/* Delete account */}
      <Popup
        open={deleteAcctOpen}
        onClose={() => setDeleteAcctOpen(false)}
        label="Delete account"
        panelClassName="w-full max-w-md bg-card"
        showCloseButton
      >
        <div className="px-6 pb-6 pt-6">
          <h2 className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold text-ink">
            Are you sure? This action cannot be undone.
          </h2>
          <p className="mt-2 text-sm text-muted">
            Your Dueso account and workspace data will be permanently deleted.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteAcctOpen(false)}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-border px-5 text-sm font-semibold hover-soft"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setDeleteAcctOpen(false)}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl bg-red-500 px-5 text-sm font-semibold text-white hover:opacity-90"
            >
              Delete Account
            </button>
          </div>
        </div>
      </Popup>
    </div>
  );
}
