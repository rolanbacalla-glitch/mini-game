import React, { Suspense } from "react";
import type { Metadata } from "next";
import { DailyPourGame } from "@/components/daily-pour/DailyPourGame";

export const metadata: Metadata = {
  title: "Daily Pour — Coffee Break",
  description:
    "Grind, bloom, and pour a steady spiral to unlock your daily coffee tasting card.",
};

export default function DailyPourPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[var(--sys-color-text-muted)]">
          Warming the kettle…
        </div>
      }
    >
      <DailyPourGame />
    </Suspense>
  );
}
