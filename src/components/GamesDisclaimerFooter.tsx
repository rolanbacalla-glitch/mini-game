"use client";

import React from "react";
import { Scale } from "lucide-react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";

export function GamesDisclaimerFooter() {
  return (
    <footer
      aria-label="Games section disclaimer"
      className="w-full border-t border-[var(--sys-color-border-subtle)] bg-[var(--sys-color-surface-low)]/65"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 text-xs text-[var(--sys-color-text-secondary)] leading-relaxed max-w-3xl">
          <Scale
            className="w-4 h-4 text-[var(--sys-color-text-muted)] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p>
            <strong className="font-medium text-[var(--sys-color-text-primary)]">
              Purely for fun &amp; personal use.
            </strong>{" "}
            This games section is an independent, non-commercial project created
            strictly for private entertainment — no real-money wagering, prizes,
            or commercial affiliation. Provided &ldquo;as is&rdquo; under the
            laws of England and Wales.
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 self-start sm:self-center text-xs text-[var(--sys-color-text-secondary)] hover:text-[var(--sys-color-text-primary)]"
            >
              UK Disclaimer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogTitle>Personal Use &amp; Entertainment Disclaimer (UK)</DialogTitle>
            <DialogDescription>
              This games section is created purely for fun and private,
              non-commercial enjoyment.
            </DialogDescription>

            <div className="mt-4 space-y-3.5 text-xs sm:text-sm text-[var(--sys-color-text-secondary)] leading-relaxed">
              <section>
                <h3 className="font-semibold text-[var(--sys-color-text-primary)]">
                  1. Purely for Fun — Personal &amp; Non-Commercial Use
                </h3>
                <p className="mt-1">
                  All games, puzzles, and interactive features in this games
                  section are provided strictly for personal, private, and
                  non-commercial entertainment. They are not offered as a
                  commercial service or professional advice, and may not be
                  reproduced or exploited commercially without permission.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-[var(--sys-color-text-primary)]">
                  2. No Gambling or Financial Value
                </h3>
                <p className="mt-1">
                  None of these games involve real-money betting, wagering,
                  monetary prizes, or items of financial value (outside the
                  scope of the UK Gambling Act 2005). Streaks, scores, and match
                  results are purely for personal amusement.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-[var(--sys-color-text-primary)]">
                  3. Independent Project &amp; Intellectual Property
                </h3>
                <p className="mt-1">
                  Traditional games such as Chess and Draughts are classic
                  public-domain games. Any third-party game names or trademarks
                  referenced remain the property of their respective owners
                  (Copyright, Designs and Patents Act 1988; Trade Marks Act
                  1994). This personal project is independent and is not
                  affiliated with, sponsored by, or endorsed by any commercial
                  brand or rights holder.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-[var(--sys-color-text-primary)]">
                  4. &ldquo;As Is&rdquo; Basis &amp; UK Statutory Rights
                </h3>
                <p className="mt-1">
                  This games section is provided free of charge on an &ldquo;as
                  is&rdquo; and &ldquo;as available&rdquo; basis without
                  warranties of any kind. To the fullest extent permitted by
                  law, no responsibility is accepted for bugs, interruptions, or
                  loss of local browser data. Nothing in this notice excludes or
                  limits liability for death or personal injury caused by
                  negligence (Unfair Contract Terms Act 1977), fraud, or any
                  other liability or statutory right that cannot lawfully be
                  excluded under UK law (including the Consumer Rights Act
                  2015).
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-[var(--sys-color-text-primary)]">
                  5. Local Storage &amp; Privacy (UK GDPR / PECR)
                </h3>
                <p className="mt-1">
                  No user accounts, tracking cookies, or personal data are
                  collected on external servers. Your theme preference and local
                  streaks are stored solely in your own browser&apos;s local
                  storage for personal convenience and can be cleared at any
                  time.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-[var(--sys-color-text-primary)]">
                  6. Governing Law
                </h3>
                <p className="mt-1">
                  This disclaimer is governed by and construed in accordance
                  with the laws of England and Wales.
                </p>
              </section>

              <p className="pt-2 border-t border-[var(--sys-color-border-subtle)] text-[11px] text-[var(--sys-color-text-muted)]">
                General personal-use notice for informational purposes only —
                not formal legal advice.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <DialogClose asChild>
                <Button variant="primary" size="sm">
                  Close
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </footer>
  );
}
