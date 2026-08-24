"use client";

import {
  Bell,
  Bookmark,
  History,
  Info,
  LayoutGrid,
  Mail,
  Plus,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import AccountMenu from "./AccountMenu";
import { useAuth } from "./AuthProvider";
import InfoPanel from "./InfoPanel";
import SidebarIconButton from "./SidebarIconButton";
import Tooltip from "./Tooltip";

const midItems = [
  { icon: Bell, label: "Notifications" },
  { icon: Bookmark, label: "Saved" },
  { icon: History, label: "History" },
  { icon: LayoutGrid, label: "Collections" },
  { icon: Mail, label: "Newsletter" },
] as const;

function usernameInitials(username: string | null | undefined) {
  const cleaned = (username ?? "").trim().replace(/[^a-zA-Z0-9]/g, "");
  if (cleaned.length >= 2) return cleaned.slice(0, 2).toUpperCase();
  if (cleaned.length === 1) return cleaned.toUpperCase();
  return "?";
}

type RightSidebarProps = {
  onSignUpOpen?: () => void;
};

export default function RightSidebar({ onSignUpOpen }: RightSidebarProps) {
  const { user, profile, authLoading } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const avatarUrl = profile?.avatar_url ?? null;

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  const displayName =
    profile?.username ||
    profile?.display_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email ||
    "Account";

  const showAvatar = Boolean(user && avatarUrl) && !avatarFailed;
  const initials = usernameInitials(profile?.username);

  const onAccountClick = () => {
    if (authLoading) return;
    if (!user) {
      onSignUpOpen?.();
      return;
    }
    setAccountOpen((v) => !v);
  };

  return (
    <aside className="relative flex h-full w-20 shrink-0 flex-col items-center overflow-visible border-l border-zinc-700/60 bg-[#0a0a0a]">
      <div className="flex h-20 w-full shrink-0 items-center justify-center">
        {authLoading ? (
          <div className="auth-skeleton size-12 shrink-0 rounded-2xl" aria-hidden />
        ) : (
          <button
            id="account-menu-trigger"
            type="button"
            aria-label={user ? "Account menu" : "Sign up or log in"}
            aria-expanded={user ? accountOpen : undefined}
            aria-haspopup={user ? "menu" : undefined}
            onClick={onAccountClick}
            className={`group relative flex size-12 cursor-pointer items-center justify-center overflow-hidden rounded-2xl transition-colors duration-200 ${
              accountOpen
                ? "bg-zinc-800 text-white"
                : showAvatar
                  ? "hover:bg-zinc-800"
                  : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {showAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl!}
                alt=""
                className="size-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : user ? (
              <span
                className="text-sm font-semibold tracking-tight"
                aria-hidden
              >
                {initials}
              </span>
            ) : (
              <User className="size-6 shrink-0" strokeWidth={1.75} aria-hidden />
            )}
            <Tooltip
              label={user ? displayName : "Sign up / Log in"}
              side="left"
            />
          </button>
        )}

        {user && !authLoading ? (
          <AccountMenu
            open={accountOpen}
            onClose={() => setAccountOpen(false)}
            displayName={displayName}
            placement="sidebar"
          />
        ) : null}
      </div>

      <div className="flex w-full shrink-0 flex-col items-center gap-2">
        {authLoading
          ? Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="auth-skeleton size-12 shrink-0 rounded-2xl"
                aria-hidden
              />
            ))
          : (
            <>
              {midItems.map(({ icon, label }) => (
                <SidebarIconButton
                  key={label}
                  icon={icon}
                  label={label}
                  tooltipSide="left"
                />
              ))}
              <button
                id="info-panel-trigger"
                type="button"
                aria-label="Help"
                aria-expanded={helpOpen}
                onClick={() => setHelpOpen((v) => !v)}
                className={`group relative flex size-12 cursor-pointer items-center justify-center rounded-2xl transition-colors duration-200 ${
                  helpOpen
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Info className="size-6 shrink-0" strokeWidth={1.75} />
                <Tooltip label="Help" side="left" />
              </button>
              <InfoPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
            </>
          )}
      </div>

      <div className="mt-auto flex flex-col items-center pb-6">
        {authLoading ? (
          <div className="auth-skeleton size-12 shrink-0 rounded-2xl" aria-hidden />
        ) : (
          <SidebarIconButton
            icon={Plus}
            label="Submit a tool"
            variant="create"
            tooltipSide="left"
          />
        )}
      </div>
    </aside>
  );
}
