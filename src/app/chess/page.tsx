import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ChessGame } from "@/components/chess/ChessGame";

export const metadata: Metadata = {
  title: "Chess — Coffee Break",
  description:
    "Classic chess on the familiar tactile monochrome 8×8 board with engraved ivory and grooved charcoal pieces.",
};

export default function ChessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[var(--sys-color-text-muted)]">
          Setting up the chess board…
        </div>
      }
    >
      <ChessGame />
    </Suspense>
  );
}
