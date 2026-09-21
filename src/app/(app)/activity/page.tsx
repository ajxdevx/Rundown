"use client";

import { Suspense } from "react";
import ActivityPage from "@/components/ActivityPage";
import DashboardTopBar from "@/components/DashboardTopBar";
import { ActivitySkeleton } from "@/components/skeletons";

function ActivityFallback() {
  return (
    <div className="flex min-h-full flex-col">
      <DashboardTopBar context="Activity" />
      <div className="w-full flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <h2 className="page-title">Activity</h2>
        <p className="mt-1.5 text-sm text-muted">
          See what&apos;s been happening across your workspace.
        </p>
        <div className="mt-6">
          <ActivitySkeleton />
        </div>
      </div>
    </div>
  );
}

export default function ActivityRoute() {
  return (
    <Suspense fallback={<ActivityFallback />}>
      <ActivityPage />
    </Suspense>
  );
}
