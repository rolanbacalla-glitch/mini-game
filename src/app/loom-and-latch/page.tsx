import React, { Suspense } from "react";
import type { Metadata } from "next";
import { LoomAndLatchGame } from "@/components/loom-and-latch/LoomAndLatchGame";

export const metadata: Metadata = {
  title: "Loom & Latch — Coffee Break",
  description:
    "Snap tactile geometric tiles into a calm 5×5 daily loom. Two to three minutes of restorative spatial focus.",
};

export default function LoomAndLatchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[var(--sys-color-text-muted)]">
          Setting up today&apos;s loom…
        </div>
      }
    >
      <LoomAndLatchGame />
    </Suspense>
  );
}
