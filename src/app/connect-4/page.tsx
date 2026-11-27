import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Connect4Game } from "@/components/connect-4/Connect4Game";

export const metadata: Metadata = {
  title: "Connect 4 — Coffee Break",
  description:
    "Drop engraved symbol tokens to align four in a row — tactile Connect 4 built without relying on colour.",
};

export default function Connect4Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[var(--sys-color-text-muted)]">
          Setting up Connect 4…
        </div>
      }
    >
      <Connect4Game />
    </Suspense>
  );
}
