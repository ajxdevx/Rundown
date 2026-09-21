"use client";

import {
  AlertTriangle,
  Building2,
  CreditCard,
  ExternalLink,
  Globe,
  Loader2,
  Shield,
  SlidersHorizontal,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { appendActivity } from "@/lib/activityStore";
import { backgroundSync } from "@/lib/optimistic";
import { useInitialLoading } from "@/hooks/useInitialLoading";
import {
  getPortalSettings,
  getPreferenceSettings,
  getProfileSettings,
  updatePortalSettings,
  updatePreferenceSettings,
  updateProfileSettings,
  type PortalSettings,
  type PreferenceSettings,
  type ProfileSettings,
} from "@/lib/settingsStore";
import {
  WORKSPACE_CHANGED,
  archiveWorkspace,
  deleteWorkspace,
  getActiveWorkspace,
  getWorkspaces,
  updateWorkspaceOptimistic,
  workspaceInitials,
  type WorkspaceType,
} from "@/lib/workspaceStore";
import DashboardTopBar from "./DashboardTopBar";
import Dropdown from "./Dropdown";
import Popup, { PopupCloseButton } from "./Popup";
import { SettingsSkeleton } from "./skeletons";
import { useToastOptional } from "./ToastProvider";

export type SettingsSectionId =
  | "workspace"
  | "profile"
  | "security"
  | "business"
  | "client-portal"
  | "preferences"
  | "billing"
  | "danger";

type NavGroup = {
  label: string;
  items: { id: SettingsSectionId; label: string; href: string; icon: typeof User }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Personal",
    items: [
      { id: "profile", label: "Profile", href: "/settings/profile", icon: User },
      {
        id: "security",
        label: "Security",
        href: "/settings/security",
        icon: Shield,
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        id: "workspace",
        label: "General",
        href: "/settings",
        icon: Building2,
      },
      {
        id: "business",
        label: "Business Information",
        href: "/settings/business",
        icon: Building2,
      },
      {
        id: "client-portal",
        label: "Client Portal",
        href: "/settings/client-portal",
        icon: Globe,
      },
      {
        id: "preferences",
        label: "Preferences",
        href: "/settings/preferences",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        id: "billing",
        label: "Billing",
        href: "/settings/billing",
        icon: CreditCard,
      },
    ],
  },
  {
    label: "Danger",
    items: [
      {
        id: "danger",
        label: "Danger Zone",
        href: "/settings/danger",
        icon: AlertTriangle,
      },
    ],
  },
];

const SECTION_META: Record<
  SettingsSectionId,
  { title: string; description: string }
> = {
  workspace: {
    title: "General",
    description: "Manage the basic identity of your workspace.",
  },
  profile: {
    title: "Profile",
    description: "Manage your personal information and profile.",
  },
  security: {
    title: "Security",
    description: "Manage your account security and active sessions.",
  },
  business: {
    title: "Business Information",
    description:
      "Manage the information used for invoices, payments, and client documents.",
  },
  "client-portal": {
    title: "Client Portal",
    description: "Control how your projects appear to clients.",
  },
  preferences: {
    title: "Preferences",
    description: "Customize how Dueso works for you.",
  },
  billing: {
    title: "Billing",
    description: "Manage your Dueso subscription and workspace plan.",
  },
  danger: {
    title: "Danger Zone",
    description: "Archive or permanently delete this workspace.",
  },
};

const VALID = new Set<SettingsSectionId>(
  NAV_GROUPS.flatMap((g) => g.items.map((i) => i.id)),
);

export function parseSettingsSection(raw?: string | null): SettingsSectionId {
  if (raw && VALID.has(raw as SettingsSectionId)) {
    return raw as SettingsSectionId;
  }
  return "workspace";
}

const inputClass =
  "h-11 w-full rounded-[8px] border border-border bg-card px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-muted-soft focus:border-ink";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
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
      className={`overflow-hidden rounded-[12px] border bg-card ${
        danger ? "border-danger/30" : "border-border"
      }`}
    >
      {title ? (
        <div
          className={`border-b px-5 py-3.5 ${
            danger ? "border-danger/20" : "border-border"
          }`}
        >
          <h3
            className={`text-sm font-semibold ${
              danger ? "text-danger" : "text-ink"
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 ${
        checked ? "bg-accent" : "bg-surface-strong"
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

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

function FormFooter({
  dirty,
  saving,
  onCancel,
  onSave,
  saveLabel = "Save Changes",
}: {
  dirty: boolean;
  saving?: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={!dirty || saving}
        className="inline-flex h-10 cursor-pointer items-center rounded-[8px] btn-secondary px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!dirty || saving}
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[8px] btn-accent px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
        {saveLabel}
      </button>
    </div>
  );
}

function isValidUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SettingsPage({
  initialSection,
}: {
  initialSection?: string;
}) {
  const toast = useToastOptional();
  const router = useRouter();
  const pathname = usePathname();
  const loading = useInitialLoading(360);

  const section = useMemo(() => {
    const fromPath = pathname.replace(/^\/settings\/?/, "").split("/")[0];
    if (fromPath) return parseSettingsSection(fromPath);
    return parseSettingsSection(initialSection);
  }, [pathname, initialSection]);

  const meta = SECTION_META[section];

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [nameError, setNameError] = useState("");
  const [websiteError, setWebsiteError] = useState("");

  // Workspace
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [businessType, setBusinessType] = useState<WorkspaceType>("Studio");
  const [wsDescription, setWsDescription] = useState("");
  const [wsWebsite, setWsWebsite] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  // Business
  const [legalName, setLegalName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [wsPhone, setWsPhone] = useState("");
  const [wsLocation, setWsLocation] = useState("");
  const [taxId, setTaxId] = useState("");
  const [bizWebsite, setBizWebsite] = useState("");

  // Preferences (workspace currency/timezone live on workspace)
  const [wsCurrency, setWsCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");
  const [prefs, setPrefs] = useState<PreferenceSettings>(getPreferenceSettings);
  const [portal, setPortal] = useState<PortalSettings>(getPortalSettings);
  const [profile, setProfile] = useState<ProfileSettings>(getProfileSettings);

  const markDirty = useCallback(() => setDirty(true), []);

  const syncWorkspace = useCallback(() => {
    const ws = getActiveWorkspace();
    setWorkspaceId(ws.id);
    setWorkspaceName(ws.name);
    setBusinessType(ws.type);
    setWsDescription(ws.description);
    setWsWebsite(ws.website);
    setLogoDataUrl(ws.logoDataUrl);
    setLegalName(ws.legalName);
    setContactEmail(ws.contactEmail);
    setWsPhone(ws.phone);
    setWsLocation(ws.location);
    setTaxId(ws.taxId);
    setBizWebsite(ws.website);
    setWsCurrency(ws.currency);
    setTimezone(ws.timezone);
    setPrefs(getPreferenceSettings(ws.id));
    setPortal(getPortalSettings(ws.id));
    setProfile(getProfileSettings());
    setDirty(false);
    setNameError("");
    setWebsiteError("");
  }, []);

  useEffect(() => {
    syncWorkspace();
    window.addEventListener(WORKSPACE_CHANGED, syncWorkspace);
    return () => window.removeEventListener(WORKSPACE_CHANGED, syncWorkspace);
  }, [syncWorkspace]);

  const goTo = (href: string) => {
    const current =
      pathname === "/settings" || pathname === "/settings/workspace"
        ? "/settings"
        : pathname;
    const target =
      href === "/settings/workspace" ? "/settings" : href;
    if (target === current) return;
    if (dirty) {
      setPendingHref(target);
      setUnsavedOpen(true);
      return;
    }
    router.push(target);
  };

  const discardAndNavigate = () => {
    setUnsavedOpen(false);
    setDirty(false);
    syncWorkspace();
    if (pendingHref) {
      router.push(pendingHref);
      setPendingHref(null);
    }
    toast?.success("Changes discarded");
  };

  const saveWorkspaceGeneral = async () => {
    if (!workspaceName.trim()) {
      setNameError("Workspace name is required.");
      return;
    }
    if (!isValidUrl(wsWebsite)) {
      setWebsiteError("Enter a valid website URL.");
      return;
    }
    setNameError("");
    setWebsiteError("");
    setSaving(true);
    updateWorkspaceOptimistic(workspaceId, {
      name: workspaceName.trim(),
      type: businessType,
      description: wsDescription,
      website: wsWebsite.trim(),
      logoDataUrl,
    });
    const result = await backgroundSync();
    setSaving(false);
    if (!result.ok) {
      toast?.error("Couldn't update workspace. Try again.");
      return;
    }
    setDirty(false);
    toast?.success("Workspace updated");
    appendActivity({
      description: "You updated workspace information",
      context: workspaceName.trim(),
      category: "workspace",
      href: "/settings/workspace",
      actorKind: "you",
    });
  };

  const saveBusiness = async () => {
    if (!isValidUrl(bizWebsite)) {
      setWebsiteError("Enter a valid website URL.");
      return;
    }
    setWebsiteError("");
    setSaving(true);
    updateWorkspaceOptimistic(workspaceId, {
      legalName,
      contactEmail,
      phone: wsPhone,
      location: wsLocation,
      taxId,
      website: bizWebsite.trim() || wsWebsite,
    });
    const result = await backgroundSync();
    setSaving(false);
    if (!result.ok) {
      toast?.error("Couldn't save changes. Try again.");
      return;
    }
    setDirty(false);
    toast?.success("Business information updated");
  };

  const savePreferences = async () => {
    setSaving(true);
    updateWorkspaceOptimistic(workspaceId, {
      currency: wsCurrency,
      timezone,
    });
    updatePreferenceSettings(prefs, workspaceId);
    const result = await backgroundSync();
    setSaving(false);
    if (!result.ok) {
      toast?.error("Couldn't save changes. Try again.");
      return;
    }
    setDirty(false);
    toast?.success("Preferences updated");
    appendActivity({
      description: "You changed workspace preferences",
      context: workspaceName,
      category: "workspace",
      href: "/settings/preferences",
      actorKind: "you",
    });
  };

  const saveProfile = async () => {
    if (!profile.fullName.trim()) {
      toast?.error("Full name is required.");
      return;
    }
    setSaving(true);
    updateProfileSettings({
      ...profile,
      fullName: profile.fullName.trim(),
      username: profile.username.trim().toLowerCase(),
      bio: profile.bio.trim(),
    });
    const result = await backgroundSync();
    setSaving(false);
    if (!result.ok) {
      toast?.error("Couldn't save changes. Try again.");
      return;
    }
    setDirty(false);
    toast?.success("Profile updated");
  };

  const onPortalToggle = async (key: keyof PortalSettings, value: boolean) => {
    const previous = portal;
    const next = { ...portal, [key]: value };
    setPortal(next);
    updatePortalSettings({ [key]: value }, workspaceId);
    const result = await backgroundSync();
    if (!result.ok) {
      setPortal(previous);
      updatePortalSettings(previous, workspaceId);
      toast?.error("Couldn't update portal settings. Try again.");
      return;
    }
    toast?.success("Portal settings updated");
  };

  const updatePassword = async () => {
    setPwError("");
    if (!currentPw || !newPw || !confirmPw) {
      setPwError("All fields are required.");
      return;
    }
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwSaving(true);
    const result = await backgroundSync();
    setPwSaving(false);
    if (!result.ok) {
      setPwError("Couldn't update password. Try again.");
      return;
    }
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setPasswordOpen(false);
    toast?.success("Password updated");
  };

  const onArchive = () => {
    const ok = archiveWorkspace(workspaceId);
    setArchiveOpen(false);
    if (!ok) {
      toast?.error(
        "Couldn't archive workspace. Create another workspace first.",
      );
      return;
    }
    toast?.success("Workspace archived");
    router.push("/dashboard");
  };

  const onDelete = () => {
    const ok = deleteWorkspace(workspaceId, deleteConfirm);
    if (!ok) {
      toast?.error("Workspace name doesn't match. Try again.");
      return;
    }
    setDeleteOpen(false);
    setDeleteConfirm("");
    toast?.success("Workspace deleted");
    router.push("/dashboard");
  };

  const otherWorkspaces = getWorkspaces().filter((w) => w.id !== workspaceId);

  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar context="Settings" />

      {loading ? (
        <SettingsSkeleton />
      ) : (
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:gap-8 md:px-8 md:py-8">
          <aside className="w-full shrink-0 md:w-56">
            <div className="mb-5 md:mb-6">
              <h2 className="page-title text-2xl">Settings</h2>
              <p className="mt-1.5 text-sm text-muted">
                Manage your account, workspace, and Dueso preferences.
              </p>
            </div>

            <nav className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className="contents md:block md:mb-4">
                  <p className="mb-1.5 hidden px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-soft md:block">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const active = section === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => goTo(item.href)}
                        className={`relative flex h-9 shrink-0 cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ink/20 ${
                          active
                            ? "bg-accent text-ink"
                            : "text-muted hover:bg-bg-hover hover:text-ink"
                        }`}
                      >
                        <item.icon
                          className="size-4 shrink-0 opacity-80"
                          strokeWidth={1.75}
                        />
                        <span className="whitespace-nowrap">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-6">
              <h3 className="font-[family-name:var(--font-brand)] text-xl font-bold tracking-tight text-ink sm:text-2xl">
                {meta.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted">{meta.description}</p>
            </div>

            {section === "workspace" && (
              <div className="space-y-4">
                <Card title="Workspace Identity">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex size-16 items-center justify-center overflow-hidden rounded-[12px] border border-border bg-surface text-sm font-semibold text-ink">
                      {logoDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoDataUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        workspaceInitials(workspaceName || "WS")
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[8px] border border-border px-3.5 text-sm font-medium text-ink hover-soft">
                        <Upload className="size-4" strokeWidth={1.75} />
                        {logoDataUrl ? "Change" : "Upload"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              setLogoDataUrl(String(reader.result));
                              markDirty();
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {logoDataUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoDataUrl(null);
                            markDirty();
                          }}
                          className="inline-flex h-10 cursor-pointer items-center rounded-[8px] px-3.5 text-sm font-medium text-danger hover:bg-danger-soft"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <Field label="Workspace name" error={nameError}>
                    <input
                      className={inputClass}
                      value={workspaceName}
                      onChange={(e) => {
                        setWorkspaceName(e.target.value);
                        setNameError("");
                        markDirty();
                      }}
                    />
                  </Field>
                  <Field label="Workspace type">
                    <Dropdown
                      aria-label="Workspace type"
                      value={businessType}
                      onChange={(v) => {
                        setBusinessType(v as WorkspaceType);
                        markDirty();
                      }}
                      options={[
                        "Freelancer",
                        "Agency",
                        "Studio",
                        "Consultancy",
                        "Other",
                      ]}
                    />
                  </Field>
                </Card>

                <Card title="Workspace Profile">
                  <Field
                    label="Description"
                    hint="Optional. Used for workspace identity."
                  >
                    <textarea
                      className={`${inputClass} h-24 resize-none py-3`}
                      value={wsDescription}
                      onChange={(e) => {
                        setWsDescription(e.target.value);
                        markDirty();
                      }}
                      placeholder="Tell clients a little about your business."
                    />
                  </Field>
                  <Field label="Website" error={websiteError}>
                    <input
                      className={inputClass}
                      value={wsWebsite}
                      onChange={(e) => {
                        setWsWebsite(e.target.value);
                        setWebsiteError("");
                        markDirty();
                      }}
                      placeholder="https://yourwebsite.com"
                    />
                  </Field>
                </Card>

                <Card title="Preview">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-border bg-surface text-xs font-semibold text-ink">
                      {logoDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoDataUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        workspaceInitials(workspaceName || "WS")
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {workspaceName || "Workspace"}
                      </p>
                      {wsDescription ? (
                        <p className="mt-0.5 text-xs text-muted line-clamp-2">
                          {wsDescription}
                        </p>
                      ) : null}
                      {wsWebsite ? (
                        <p className="mt-1 truncate text-xs text-muted-soft">
                          {wsWebsite}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Card>

                <FormFooter
                  dirty={dirty}
                  saving={saving}
                  onCancel={syncWorkspace}
                  onSave={() => void saveWorkspaceGeneral()}
                />
              </div>
            )}

            {section === "business" && (
              <div className="space-y-4">
                <Card>
                  <p className="text-sm text-muted">
                    Add your business information to use it on invoices and
                    client documents.
                  </p>
                  <Field label="Legal / business name">
                    <input
                      className={inputClass}
                      value={legalName}
                      onChange={(e) => {
                        setLegalName(e.target.value);
                        markDirty();
                      }}
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Business email">
                      <input
                        className={inputClass}
                        type="email"
                        value={contactEmail}
                        onChange={(e) => {
                          setContactEmail(e.target.value);
                          markDirty();
                        }}
                      />
                    </Field>
                    <Field label="Business phone">
                      <input
                        className={inputClass}
                        value={wsPhone}
                        onChange={(e) => {
                          setWsPhone(e.target.value);
                          markDirty();
                        }}
                      />
                    </Field>
                  </div>
                  <Field label="Business website" error={websiteError}>
                    <input
                      className={inputClass}
                      value={bizWebsite}
                      onChange={(e) => {
                        setBizWebsite(e.target.value);
                        setWebsiteError("");
                        markDirty();
                      }}
                      placeholder="https://"
                    />
                  </Field>
                  <Field label="Business address">
                    <input
                      className={inputClass}
                      value={wsLocation}
                      onChange={(e) => {
                        setWsLocation(e.target.value);
                        markDirty();
                      }}
                      placeholder="Address, city, postal code, country"
                    />
                  </Field>
                  <Field
                    label="Tax / VAT"
                    hint="Kept internal unless used on invoices."
                  >
                    <input
                      className={inputClass}
                      value={taxId}
                      onChange={(e) => {
                        setTaxId(e.target.value);
                        markDirty();
                      }}
                    />
                  </Field>
                </Card>
                <FormFooter
                  dirty={dirty}
                  saving={saving}
                  onCancel={syncWorkspace}
                  onSave={() => void saveBusiness()}
                />
              </div>
            )}

            {section === "profile" && (
              <div className="space-y-4">
                <Card title="Profile photo">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex size-16 items-center justify-center overflow-hidden rounded-[12px] bg-ink text-sm font-semibold text-card">
                      {profile.photoDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.photoDataUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        profile.fullName
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join("")
                          .toUpperCase() || "U"
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[8px] border border-border px-3.5 text-sm font-medium text-ink hover-soft">
                        <Upload className="size-4" strokeWidth={1.75} />
                        {profile.photoDataUrl ? "Change" : "Upload"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              setProfile((p) => ({
                                ...p,
                                photoDataUrl: String(reader.result),
                              }));
                              markDirty();
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {profile.photoDataUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setProfile((p) => ({ ...p, photoDataUrl: null }));
                            markDirty();
                          }}
                          className="inline-flex h-10 cursor-pointer items-center rounded-[8px] px-3.5 text-sm font-medium text-danger hover:bg-danger-soft"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                </Card>
                <Card>
                  <Field label="Full name">
                    <input
                      className={inputClass}
                      value={profile.fullName}
                      onChange={(e) => {
                        setProfile((p) => ({
                          ...p,
                          fullName: e.target.value,
                        }));
                        markDirty();
                      }}
                    />
                  </Field>
                  <Field label="Username">
                    <input
                      className={inputClass}
                      value={profile.username}
                      onChange={(e) => {
                        setProfile((p) => ({
                          ...p,
                          username: e.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                        }));
                        markDirty();
                      }}
                    />
                  </Field>
                  <Field label="Email" hint="Managed through account security.">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        className={`${inputClass} flex-1`}
                        value={profile.email}
                        readOnly
                      />
                      <span className="inline-flex rounded-[6px] bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                        Verified
                      </span>
                    </div>
                  </Field>
                  <Field label="Bio">
                    <textarea
                      className={`${inputClass} h-24 resize-none py-3`}
                      value={profile.bio}
                      onChange={(e) => {
                        setProfile((p) => ({ ...p, bio: e.target.value }));
                        markDirty();
                      }}
                      placeholder="Independent designer helping brands build better digital products."
                    />
                  </Field>
                </Card>
                <FormFooter
                  dirty={dirty}
                  saving={saving}
                  onCancel={syncWorkspace}
                  onSave={() => void saveProfile()}
                />
              </div>
            )}

            {section === "security" && (
              <div className="space-y-4">
                <Card title="Email">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {profile.email}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Verified account email
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        toast?.success(
                          "Email changes will use the Auth verification flow.",
                        )
                      }
                      className="inline-flex h-9 cursor-pointer items-center rounded-[8px] border border-border px-3.5 text-sm font-medium text-ink hover-soft"
                    >
                      Change Email
                    </button>
                  </div>
                </Card>
                <Card title="Password">
                  <p className="text-sm text-muted">
                    Choose a strong password you haven&apos;t used before.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPasswordOpen(true)}
                    className="inline-flex h-10 cursor-pointer items-center rounded-[8px] btn-secondary px-4 text-sm font-semibold"
                  >
                    Change Password
                  </button>
                </Card>
                <Card title="Active Sessions">
                  <div className="rounded-[8px] bg-surface px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          Current session
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          Chrome · Windows
                        </p>
                        <p className="mt-1 text-xs text-muted-soft">
                          Last active: Just now
                        </p>
                      </div>
                      <span className="rounded-[6px] bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                        This device
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toast?.success("Signed out of other sessions")
                    }
                    className="inline-flex h-10 cursor-pointer items-center rounded-[8px] btn-secondary px-4 text-sm font-semibold"
                  >
                    Sign out of all other sessions
                  </button>
                </Card>
              </div>
            )}

            {section === "client-portal" && (
              <div className="space-y-4">
                <Card title="Workspace identity">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center overflow-hidden rounded-[10px] border border-border bg-surface text-xs font-semibold">
                      {logoDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoDataUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        workspaceInitials(workspaceName || "WS")
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {workspaceName}
                      </p>
                      <p className="text-xs text-muted">
                        {[contactEmail, wsPhone, wsWebsite]
                          .filter(Boolean)
                          .join(" · ") || "No contact details yet"}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/settings/workspace"
                    className="inline-flex text-sm font-medium text-muted hover:text-ink"
                  >
                    Edit workspace identity
                  </Link>
                </Card>

                <Card title="Portal preferences">
                  <ToggleRow
                    title="Show workspace branding"
                    description="Display your logo and workspace name in the portal."
                    checked={portal.showBranding}
                    onChange={(v) => void onPortalToggle("showBranding", v)}
                  />
                  <ToggleRow
                    title="Show contact information"
                    description="Let clients see your business contact details."
                    checked={portal.showContact}
                    onChange={(v) => void onPortalToggle("showContact", v)}
                  />
                  <ToggleRow
                    title="Allow client messages"
                    description="Clients can send messages from the portal."
                    checked={portal.allowMessages}
                    onChange={(v) => void onPortalToggle("allowMessages", v)}
                  />
                  <ToggleRow
                    title="Allow client file downloads"
                    description="Clients can download shared project files."
                    checked={portal.allowDownloads}
                    onChange={(v) => void onPortalToggle("allowDownloads", v)}
                  />
                  <ToggleRow
                    title="Show project value"
                    description="Default visibility for project financial value."
                    checked={portal.showProjectValue}
                    onChange={(v) => void onPortalToggle("showProjectValue", v)}
                  />
                  <ToggleRow
                    title="Show project deadline"
                    description="Default visibility for project deadlines."
                    checked={portal.showDeadline}
                    onChange={(v) => void onPortalToggle("showDeadline", v)}
                  />
                  <ToggleRow
                    title="Show payment information"
                    description="Default visibility for invoice and payment details."
                    checked={portal.showPayments}
                    onChange={(v) => void onPortalToggle("showPayments", v)}
                  />
                </Card>

                <Card>
                  <p className="text-sm text-muted">
                    Preview uses the real Client Portal experience.
                  </p>
                  <Link
                    href="/p/acme-website-redesign"
                    target="_blank"
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[8px] btn-secondary px-4 text-sm font-semibold"
                  >
                    Preview Client Portal
                    <ExternalLink className="size-3.5" strokeWidth={1.75} />
                  </Link>
                </Card>
              </div>
            )}

            {section === "preferences" && (
              <div className="space-y-4">
                <Card title="Workspace preferences">
                  <Field label="Currency">
                    <Dropdown
                      aria-label="Currency"
                      value={wsCurrency}
                      onChange={(v) => {
                        setWsCurrency(v);
                        markDirty();
                      }}
                      options={["USD", "EUR", "GBP", "MAD", "CAD", "AUD"]}
                    />
                  </Field>
                  <Field label="Date format">
                    <Dropdown
                      aria-label="Date format"
                      value={prefs.dateFormat}
                      onChange={(v) => {
                        setPrefs((p) => ({
                          ...p,
                          dateFormat: v as PreferenceSettings["dateFormat"],
                        }));
                        markDirty();
                      }}
                      options={[
                        { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                        { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                        { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                      ]}
                    />
                  </Field>
                  <Field
                    label="Timezone"
                    hint="Used for deadlines, activity, and invoices."
                  >
                    <Dropdown
                      aria-label="Timezone"
                      value={timezone}
                      onChange={(v) => {
                        setTimezone(v);
                        markDirty();
                      }}
                      options={[
                        timezone,
                        "UTC",
                        "America/New_York",
                        "Europe/London",
                        "Africa/Casablanca",
                        "Europe/Paris",
                      ].filter((v, i, a) => a.indexOf(v) === i)}
                    />
                  </Field>
                  <Field label="Default project status">
                    <div className="flex gap-2">
                      {(["Active", "Draft"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setPrefs((p) => ({
                              ...p,
                              defaultProjectStatus: s,
                            }));
                            markDirty();
                          }}
                          className={`h-10 flex-1 cursor-pointer rounded-[8px] text-sm font-medium ${
                            prefs.defaultProjectStatus === s
                              ? "bg-accent text-ink"
                              : "border border-border text-muted hover-soft"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </Field>
                </Card>

                <Card title="Email preferences">
                  <p className="text-sm text-muted">
                    Control how you receive email updates. In-app notifications
                    stay in Notifications.
                  </p>
                  {(
                    [
                      ["emailProduct", "Product updates"],
                      ["emailActivity", "Workspace activity"],
                      ["emailMessages", "Client messages"],
                      ["emailPayments", "Payment updates"],
                    ] as const
                  ).map(([key, label]) => (
                    <ToggleRow
                      key={key}
                      title={label}
                      description={`Email me about ${label.toLowerCase()}.`}
                      checked={prefs[key]}
                      onChange={(v) => {
                        setPrefs((p) => ({ ...p, [key]: v }));
                        markDirty();
                      }}
                    />
                  ))}
                </Card>

                <FormFooter
                  dirty={dirty}
                  saving={saving}
                  onCancel={syncWorkspace}
                  onSave={() => void savePreferences()}
                />
              </div>
            )}

            {section === "billing" && (
              <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Dueso subscription
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Plans, usage, invoices, and payment methods live in
                      Billing — separate from client project payments.
                    </p>
                  </div>
                  <Link
                    href="/billing"
                    className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[8px] btn-accent px-4 text-sm font-semibold"
                  >
                    Manage Billing
                    <ExternalLink className="size-3.5" strokeWidth={2} />
                  </Link>
                </div>
              </Card>
            )}

            {section === "danger" && (
              <div className="space-y-4">
                <Card title="Archive Workspace">
                  <p className="text-sm text-muted">
                    Archiving removes this workspace from your active workspace
                    list without permanently deleting its data.
                  </p>
                  <button
                    type="button"
                    disabled={otherWorkspaces.length === 0}
                    onClick={() => setArchiveOpen(true)}
                    className="inline-flex h-10 cursor-pointer items-center rounded-[8px] btn-secondary px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Archive Workspace
                  </button>
                  {otherWorkspaces.length === 0 ? (
                    <p className="text-xs text-muted">
                      Create another workspace before archiving this one.
                    </p>
                  ) : null}
                </Card>

                <Card title="Delete Workspace" danger>
                  <p className="text-sm text-muted">
                    This will permanently delete{" "}
                    <span className="font-medium text-ink">{workspaceName}</span>{" "}
                    and its associated data. This action cannot be undone.
                  </p>
                  <button
                    type="button"
                    disabled={otherWorkspaces.length === 0}
                    onClick={() => {
                      setDeleteConfirm("");
                      setDeleteOpen(true);
                    }}
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[8px] border border-danger/30 px-4 text-sm font-semibold text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-4" strokeWidth={1.75} />
                    Delete Workspace
                  </button>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unsaved changes */}
      <Popup
        open={unsavedOpen}
        onClose={() => setUnsavedOpen(false)}
        labelledBy="unsaved-title"
      >
        <div className="relative w-[min(100vw-2rem,26rem)] bg-card p-6">
          <div className="absolute right-3 top-3">
            <PopupCloseButton onClick={() => setUnsavedOpen(false)} />
          </div>
          <h2
            id="unsaved-title"
            className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold tracking-tight text-ink"
          >
            Discard changes?
          </h2>
          <p className="mt-2 text-sm text-muted">Your changes will be lost.</p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setUnsavedOpen(false)}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] btn-secondary px-4 text-sm font-semibold"
            >
              Continue Editing
            </button>
            <button
              type="button"
              onClick={discardAndNavigate}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] btn-danger px-4 text-sm font-semibold"
            >
              Discard
            </button>
          </div>
        </div>
      </Popup>

      {/* Change password */}
      <Popup
        open={passwordOpen}
        onClose={() => !pwSaving && setPasswordOpen(false)}
        labelledBy="pw-title"
      >
        <div className="relative w-[min(100vw-2rem,26rem)] bg-card p-6">
          <div className="absolute right-3 top-3">
            <PopupCloseButton
              onClick={() => !pwSaving && setPasswordOpen(false)}
            />
          </div>
          <h2
            id="pw-title"
            className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold tracking-tight text-ink"
          >
            Change Password
          </h2>
          <p className="mt-2 text-sm text-muted">
            Choose a strong password you haven&apos;t used before.
          </p>
          <div className="mt-5 space-y-4">
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
            <Field label="Confirm new password" error={pwError}>
              <input
                type="password"
                className={inputClass}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={pwSaving}
              onClick={() => setPasswordOpen(false)}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] btn-secondary px-4 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pwSaving}
              onClick={() => void updatePassword()}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[8px] btn-accent px-4 text-sm font-semibold disabled:opacity-60"
            >
              {pwSaving ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Update Password
            </button>
          </div>
        </div>
      </Popup>

      {/* Archive */}
      <Popup
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        labelledBy="archive-title"
      >
        <div className="relative w-[min(100vw-2rem,26rem)] bg-card p-6">
          <div className="absolute right-3 top-3">
            <PopupCloseButton onClick={() => setArchiveOpen(false)} />
          </div>
          <h2
            id="archive-title"
            className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold tracking-tight text-ink"
          >
            Archive workspace?
          </h2>
          <p className="mt-2 text-sm text-muted">
            {workspaceName} will be removed from your active list. You can
            restore it later.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setArchiveOpen(false)}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] btn-secondary px-4 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onArchive}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] btn-secondary px-4 text-sm font-semibold"
            >
              Archive Workspace
            </button>
          </div>
        </div>
      </Popup>

      {/* Delete */}
      <Popup
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        labelledBy="delete-ws-title"
      >
        <div className="relative w-[min(100vw-2rem,26rem)] bg-card p-6">
          <div className="absolute right-3 top-3">
            <PopupCloseButton onClick={() => setDeleteOpen(false)} />
          </div>
          <h2
            id="delete-ws-title"
            className="pr-10 font-[family-name:var(--font-brand)] text-xl font-bold tracking-tight text-ink"
          >
            Delete workspace?
          </h2>
          <p className="mt-2 text-sm text-muted">
            This will permanently delete this workspace and its associated data.
            This action cannot be undone.
          </p>
          <Field
            label={`Type ${workspaceName} to confirm`}
            hint="Confirmation is required."
          >
            <input
              className={inputClass}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={workspaceName}
            />
          </Field>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] btn-secondary px-4 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteConfirm.trim() !== workspaceName.trim()}
              onClick={onDelete}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] btn-danger px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete Workspace
            </button>
          </div>
        </div>
      </Popup>
    </div>
  );
}
