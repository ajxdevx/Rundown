"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Alias → Settings Billing section via dedicated billing page */
export default function SettingsBillingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/billing");
  }, [router]);
  return null;
}
