import React, { Suspense } from "react";
import type { Metadata } from "next";
import { CauseEffectGame } from "@/components/cause-and-effect/CauseEffectGame";

export const metadata: Metadata = {
  title: "Cause & Effect — Coffee Break",
  description:
    "Match asymmetrical Cause and Effect cards across a 4×5 grid to build cascading multiplier chains.",
};

export default function CauseEffectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[var(--sys-color-text-muted)]">
          Shuffling today&apos;s deck…
        </div>
      }
    >
      <CauseEffectGame />
    </Suspense>
  );
}
