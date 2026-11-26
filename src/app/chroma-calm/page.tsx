import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ChromaCalmGame } from "@/components/chroma-calm/ChromaCalmGame";

export const metadata: Metadata = {
  title: "Chroma Calm — Coffee Break",
  description:
    "Rearrange scrambled OKLCH colour swatches to restore a harmonious daily gradient.",
};

export default function ChromaCalmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[var(--sys-color-text-muted)]">
          Mixing today&apos;s palette…
        </div>
      }
    >
      <ChromaCalmGame />
    </Suspense>
  );
}
