import React, { Suspense } from "react";
import type { Metadata } from "next";
import { DraughtsGame } from "@/components/draughts/DraughtsGame";

export const metadata: Metadata = {
  title: "Draughts — Coffee Break",
  description:
    "Play classic English Draughts across a tactile 8×8 board with forced captures, multi-jumps, and crowned kings.",
};

export default function DraughtsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[var(--sys-color-text-muted)]">
          Setting up the draughts board…
        </div>
      }
    >
      <DraughtsGame />
    </Suspense>
  );
}
