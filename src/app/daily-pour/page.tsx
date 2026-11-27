import React, { Suspense } from "react";
import type { Metadata } from "next";
import { DailyPourGame } from "@/components/daily-pour/DailyPourGame";

export const metadata: Metadata = {
  title: "Daily Four — Coffee Break",
  description:
    "Drop engraved symbol tokens to align four in a row — tactile Connect 4 built without relying on colour.",
};

export default function DailyPourPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[var(--sys-color-text-muted)]">
          Setting up the board…
        </div>
      }
    >
      <DailyPourGame />
    </Suspense>
  );
}
