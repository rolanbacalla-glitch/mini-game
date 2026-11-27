import React, { Suspense } from "react";
import type { Metadata } from "next";
import { DraughtsGame } from "@/components/draughts/DraughtsGame";

export const metadata: Metadata = {
  title: "Draughts — Coffee Break",
  description:
    "Outmanoeuvre an Advanced AI across a tactile 8×8 English Draughts board with forced captures and crowned kings.",
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
