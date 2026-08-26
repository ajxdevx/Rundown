"use client";

import { Rocket } from "lucide-react";

export default function SubmitToolBar() {
  return (
    <div className="flex flex-col items-stretch gap-4 rounded-2xl border border-zinc-700/60 bg-[#141414] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-5">
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-white">
          <Rocket className="size-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            Make your tool promoted
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            Get your AI tool in front of thousands of makers — submit it and get
            featured.
          </p>
        </div>
      </div>

      <button
        type="button"
        className="h-11 shrink-0 cursor-pointer rounded-xl bg-white px-5 text-sm font-semibold text-black hover-primary"
      >
        Submit your tool
      </button>
    </div>
  );
}
