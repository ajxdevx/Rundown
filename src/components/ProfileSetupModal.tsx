"use client";

import { Plus } from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { mapAuthError, mapProfileError } from "@/lib/authErrors";
import { useAuth, type Profile } from "./AuthProvider";
import Dropdown from "./Dropdown";
import Popup from "./Popup";

type ProfileSetupModalProps = {
  open: boolean;
  onClose: () => void;
};

const BIO_MAX = 160;

const ROLE_OPTIONS = [
  "Developer",
  "Designer",
  "Marketer",
  "Founder",
  "Student",
  "Researcher",
  "Creator",
  "Writer",
  "Other",
] as const;

const inputClassName =
  "h-12 w-full rounded-xl border border-zinc-700/70 bg-[#111111] px-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500 disabled:opacity-60";

const labelClassName =
  "mb-1.5 block text-left text-sm font-medium text-zinc-300";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function resolveAvatarExtension(file: File): "jpg" | "jpeg" | "png" | "webp" {
  const rawExt = file.name.split(".").pop()?.toLowerCase();
  if (rawExt === "png" || rawExt === "jpg" || rawExt === "jpeg" || rawExt === "webp") {
    return rawExt;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/jpeg" || file.type === "image/jpg") return "jpg";
  return "jpg";
}

function resolveAvatarContentType(
  file: File,
  ext: "jpg" | "jpeg" | "png" | "webp",
): string {
  if (file.type && ACCEPTED_TYPES.has(file.type)) {
    return file.type === "image/jpg" ? "image/jpeg" : file.type;
  }
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/**
 * Uploads to the existing `avatars` bucket at:
 *   {authenticated_user_id}/profile.{extension}
 * which Storage sees as: avatars/{user_id}/profile.{extension}
 */
async function uploadAvatar(file: File): Promise<string> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(mapAuthError(sessionError));
  }

  const userId = session?.user?.id;
  const accessToken = session?.access_token;

  if (!userId || !accessToken) {
    throw new Error("Your session expired. Please sign in again.");
  }

  const ext = resolveAvatarExtension(file);
  // First folder MUST be auth.uid() — required by existing Storage RLS.
  const path = `${userId}/profile.${ext}`;
  const contentType = resolveAvatarContentType(file, ext);

  // Do not use upsert:true here — upsert also requires UPDATE (+ SELECT).
  // First upload only needs INSERT; overwrites use update() below.
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: false,
      contentType,
      cacheControl: "3600",
    });

  if (uploadError) {
    const statusCode = String(
      (uploadError as { statusCode?: string | number }).statusCode ?? "",
    );
    const alreadyExists =
      statusCode === "409" ||
      /already exists|duplicate|resource already/i.test(uploadError.message);

    if (!alreadyExists) {
      throw new Error(mapAuthError(uploadError));
    }

    const { error: updateError } = await supabase.storage
      .from("avatars")
      .update(path, file, {
        contentType,
        cacheControl: "3600",
      });

    if (updateError) {
      throw new Error(mapAuthError(updateError));
    }
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

type ProfileDraft = {
  username: string;
  displayName: string;
  bio: string;
  role: string;
  avatarPreview: string | null;
  avatarFile: File | null;
  error: string | null;
};

export default function ProfileSetupModal({
  open,
  onClose,
}: ProfileSetupModalProps) {
  const {
    user,
    profile,
    refreshProfile,
    applyOptimisticProfile,
    applyOptimisticSetupComplete,
    markProfileSetupComplete,
  } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState("");
  const [usernameStatus, setUsernameStatus] =
    useState<UsernameStatus>("idle");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAutofillLock, setUsernameAutofillLock] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const checkSeq = useRef(0);
  const prevOpen = useRef(false);
  const submittingRef = useRef(false);
  const draftRef = useRef<ProfileDraft | null>(null);
  const confirmedAvatarRef = useRef<string | null>(null);

  useEffect(() => {
    if (open && !prevOpen.current) {
      setUsernameAutofillLock(true);
      const draft = draftRef.current;
      if (draft) {
        setUsername(draft.username);
        setDisplayName(draft.displayName);
        setBio(draft.bio);
        setRole(draft.role);
        setAvatarFile(draft.avatarFile);
        setAvatarPreview(draft.avatarPreview);
        setUsernameStatus(
          draft.username && /^[a-z0-9_]{3,20}$/.test(normalizeUsername(draft.username))
            ? "available"
            : draft.username
              ? "idle"
              : "idle",
        );
        setError(draft.error);
        draftRef.current = null;
      } else {
        const initialUsername = profile?.username ?? "";
        setUsername(initialUsername);
        setDisplayName(profile?.display_name ?? "");
        setBio(profile?.bio ?? "");
        setRole(profile?.role ?? "");
        setUsernameStatus(initialUsername ? "available" : "idle");
        setAvatarFile(null);
        setAvatarPreview(profile?.avatar_url ?? null);
        setError(null);
        confirmedAvatarRef.current = profile?.avatar_url ?? null;
      }
      setLoading(false);
      submittingRef.current = false;
      prevOpen.current = true;
    }
    if (!open) {
      prevOpen.current = false;
    }
    // Only hydrate when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Browsers often autofill login emails into "username" fields — strip those.
  useEffect(() => {
    if (!open) return;
    if (username.includes("@")) {
      setUsername("");
      setUsernameStatus("idle");
    }
  }, [username, open]);

  useEffect(() => {
    if (!open) return;

    const normalized = normalizeUsername(username);
    const currentUsername = profile?.username
      ? normalizeUsername(profile.username)
      : "";

    if (!normalized) {
      setUsernameStatus("idle");
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      setUsernameStatus("invalid");
      return;
    }

    // Same as already saved — treat as available without a network check.
    if (normalized === currentUsername) {
      setUsernameStatus("available");
      return;
    }

    setUsernameStatus("checking");
    const seq = ++checkSeq.current;

    const timer = setTimeout(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        if (!currentUser || seq !== checkSeq.current) return;

        const { data: taken, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", normalized)
          .neq("id", currentUser.id)
          .maybeSingle();

        if (seq !== checkSeq.current) return;

        if (checkError) {
          setUsernameStatus("idle");
          setError(mapProfileError(checkError));
          return;
        }

        setError(null);
        setUsernameStatus(taken ? "taken" : "available");
      } catch (err) {
        if (seq !== checkSeq.current) return;
        setUsernameStatus("idle");
        setError(mapAuthError(err instanceof Error ? err : "Network error"));
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, open, profile?.username]);

  function handleAvatarPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function validateUsernameForSubmit(
    emptyMessage = "Username is required.",
  ): string | null {
    const normalized = normalizeUsername(username);
    if (!normalized) {
      setError(emptyMessage);
      return null;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      setError("Use 3–20 characters: letters, numbers, or underscores.");
      return null;
    }

    if (usernameStatus === "taken") {
      setError("Username already taken");
      return null;
    }

    if (usernameStatus === "checking" || usernameStatus === "invalid") {
      setError("Please choose a valid available username.");
      return null;
    }

    return normalized;
  }

  async function persistProfile(options: {
    normalized: string;
    includeOptional: boolean;
    previousProfile: Profile | null;
  }) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;

    if (!currentUser) {
      throw new Error("Your session expired. Please sign in again.");
    }

    let avatarUrl = options.previousProfile?.avatar_url ?? null;

    if (options.includeOptional && avatarFile) {
      try {
        avatarUrl = await uploadAvatar(avatarFile);
      } catch (err) {
        // Keep local preview; restore confirmed avatar URL for rollback messaging.
        if (avatarPreview?.startsWith("blob:")) {
          // preview stays; confirmed avatar restored by caller on full failure
        }
        throw err;
      }
    }

    const payload = options.includeOptional
      ? {
          id: currentUser.id,
          username: options.normalized,
          avatar_url: avatarUrl,
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          role: role || null,
        }
      : {
          id: currentUser.id,
          username: options.normalized,
        };

    const { error: saveError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (saveError) {
      throw saveError;
    }

    await markProfileSetupComplete();
    await refreshProfile();
    confirmedAvatarRef.current = avatarUrl;
    return avatarUrl;
  }

  async function handleComplete(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || submittingRef.current) return;
    setError(null);

    const normalized = validateUsernameForSubmit();
    if (!normalized) return;

    const previousProfile = profile;
    const optimisticAvatar =
      avatarPreview && !avatarPreview.startsWith("blob:")
        ? avatarPreview
        : avatarPreview?.startsWith("blob:")
          ? avatarPreview
          : (profile?.avatar_url ?? null);

    const optimisticProfile: Profile = {
      username: normalized,
      avatar_url: optimisticAvatar,
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      role: role || null,
    };

    draftRef.current = {
      username,
      displayName,
      bio,
      role,
      avatarPreview,
      avatarFile,
      error: null,
    };

    submittingRef.current = true;
    setLoading(true);

    // Optimistic: enter Rundown immediately; persist in background.
    applyOptimisticProfile(optimisticProfile);
    applyOptimisticSetupComplete(true);
    onClose();

    try {
      await persistProfile({
        normalized,
        includeOptional: true,
        previousProfile,
      });
      draftRef.current = null;
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarFile(null);
    } catch (err) {
      applyOptimisticProfile(
        previousProfile ?? {
          username: null,
          avatar_url: null,
          bio: null,
          display_name: null,
          role: null,
        },
      );
      applyOptimisticSetupComplete(false);

      const message =
        err && typeof err === "object" && "code" in err
          ? mapProfileError(err as { message?: string; code?: string })
          : mapAuthError(err instanceof Error ? err : "Something went wrong.");

      if (avatarPreview?.startsWith("blob:")) {
        // Keep blob preview in draft for retry; confirmed avatar restored in state.
      }

      draftRef.current = {
        username,
        displayName,
        bio,
        role,
        avatarPreview,
        avatarFile,
        error: message,
      };

      if (
        message === "Username already taken" ||
        (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "23505")
      ) {
        setUsernameStatus("taken");
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  const canComplete =
    !!normalizeUsername(username) &&
    usernameStatus === "available" &&
    !loading;

  const usernameHint =
    usernameStatus === "checking"
      ? "Checking..."
      : usernameStatus === "available"
        ? "Username available"
        : usernameStatus === "taken"
          ? "Username already taken"
          : usernameStatus === "invalid"
            ? "Use 3–20 characters: letters, numbers, or underscores."
            : null;

  if (!user) return null;

  return (
    <Popup
      open={open}
      onClose={() => {
        /* Optional fields can be skipped via the button, not dismissed */
      }}
      labelledBy="profile-setup-title"
      showCloseButton={false}
      panelClassName="w-full max-w-3xl overflow-visible bg-[#0a0a0a] shadow-[0_40px_120px_rgba(0,0,0,0.75)]"
    >
      <div className="px-8 py-7 sm:px-10 sm:py-8">
        <h2
          id="profile-setup-title"
          className="mb-1.5 text-center font-[family-name:var(--font-brand)] text-[1.5rem] font-bold tracking-tight text-white"
        >
          Complete your profile
        </h2>
        <p className="mb-6 text-center text-sm leading-relaxed text-zinc-500">
          Personalize your Rundown profile.
        </p>

        <form
          onSubmit={handleComplete}
          autoComplete="off"
          className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8"
        >
          <div className="flex shrink-0 flex-col items-center gap-2.5 sm:w-[140px] sm:pt-1">
            <button
              type="button"
              aria-label="Add photo"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-600 bg-transparent hover-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Profile preview"
                  className="size-full object-cover"
                />
              ) : (
                <Plus
                  className="size-7 text-zinc-500"
                  strokeWidth={1.75}
                />
              )}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="cursor-pointer rounded-lg px-2 py-1 text-sm font-medium hover-soft-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add photo
            </button>
            <p className="text-center text-xs text-zinc-600">
              JPG, PNG or WebP
              <br />
              Square recommended · Max 5 MB image
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onClick={(e) => e.stopPropagation()}
              onChange={handleAvatarPick}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3.5">
            {/* Absorb browser credential autofill so the handle field stays empty. */}
            <div
              aria-hidden
              className="h-px w-px overflow-hidden opacity-0"
            >
              <input
                type="email"
                name="email"
                autoComplete="email"
                tabIndex={-1}
                defaultValue=""
              />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                tabIndex={-1}
                defaultValue=""
              />
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label htmlFor="rundown-handle" className={labelClassName}>
                  Username <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm text-zinc-500">
                    @
                  </span>
                  <input
                    ref={usernameInputRef}
                    id="rundown-handle"
                    name="rundown-handle"
                    type="text"
                    required
                    readOnly={usernameAutofillLock}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="text"
                    data-1p-ignore
                    data-lpignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    value={username}
                    disabled={loading}
                    onFocus={() => setUsernameAutofillLock(false)}
                    onChange={(e) => {
                      setUsernameAutofillLock(false);
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    className={`${inputClassName} pl-8`}
                    placeholder="username"
                    maxLength={20}
                  />
                </div>
                {usernameHint && (
                  <p
                    className={`mt-1.5 text-left text-xs ${
                      usernameStatus === "available"
                        ? "text-emerald-400"
                        : usernameStatus === "taken" ||
                            usernameStatus === "invalid"
                          ? "text-red-400"
                          : "text-zinc-500"
                    }`}
                    role="status"
                  >
                    {usernameHint}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="profile-display-name" className={labelClassName}>
                  Display name
                </label>
                <input
                  id="profile-display-name"
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  disabled={loading}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClassName}
                  placeholder="Your name"
                  maxLength={60}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label
                  htmlFor="profile-bio"
                  className="text-sm font-medium text-zinc-300"
                >
                  Bio
                </label>
                <span className="text-xs text-zinc-600">
                  {bio.length}/{BIO_MAX}
                </span>
              </div>
              <textarea
                id="profile-bio"
                value={bio}
                disabled={loading}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                className="min-h-[72px] w-full resize-none rounded-xl border border-zinc-700/70 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500 disabled:opacity-60"
                placeholder="Tell people a little about yourself..."
                maxLength={BIO_MAX}
              />
            </div>

            <div>
              <label htmlFor="profile-role" className={labelClassName}>
                What do you do?
              </label>
              <Dropdown
                id="profile-role"
                options={ROLE_OPTIONS}
                value={role}
                onChange={setRole}
                placeholder="Select a role"
                disabled={loading}
                aria-label="What do you do?"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="submit"
                disabled={!canComplete}
                className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-white text-sm font-semibold text-[#050505] transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[160px] sm:px-6"
              >
                {loading ? "Saving…" : "Complete profile"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Popup>
  );
}
