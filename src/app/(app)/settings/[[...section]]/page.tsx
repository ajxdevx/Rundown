"use client";

import SettingsPage, {
  parseSettingsSection,
} from "@/components/SettingsPage";
import { use } from "react";

export default function SettingsCatchAllRoute({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section } = use(params);
  const initial = parseSettingsSection(section?.[0]);
  return <SettingsPage initialSection={initial} />;
}
