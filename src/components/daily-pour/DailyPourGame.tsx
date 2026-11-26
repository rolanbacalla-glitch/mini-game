"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Coffee,
  Copy,
  Droplets,
  Flame,
  HelpCircle,
  RotateCcw,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  ProgressBar,
  Tabs,
  TabsList,
  TabsTrigger,
  ToastStack,
  type ToastItem,
} from "@/components/ui";
import { soundEngine } from "@/lib/audio";
import {
  buildPourShareCard,
  getDailyBean,
  getExtractionVerdict,
} from "@/lib/daily-pour/beans";
import { formatShortBritishDate, getTodayKey } from "@/lib/games";
import {
  formatDuration,
  loadPourStats,
  recordPourDailyCompletion,
  recordPourZenCompletion,
  type PourStats,
} from "@/lib/storage";

type GameMode = "daily" | "zen";
type RitualPhase = "grind" | "bloom" | "rest" | "pour" | "complete";

const TARGET_GRAMS = 18;
const REST_DURATION_SECONDS = 4;

export function DailyPourGame() {
  const searchParams = useSearchParams();
  const initialMode: GameMode =
    searchParams.get("mode") === "zen" ? "zen" : "daily";

  const [mode, setMode] = useState<GameMode>(initialMode);
  const [todayKey] = useState<string>(() => getTodayKey());
  const [zenCounter, setZenCounter] = useState<number>(1);

  const seed = mode === "daily" ? todayKey : `zen-${todayKey}-${zenCounter}`;
  const bean = useMemo(() => getDailyBean(seed), [seed]);

  const [phase, setPhase] = useState<RitualPhase>("grind");
  const [gramsGround, setGramsGround] = useState<number>(0);
  const [grinderAngle, setGrinderAngle] = useState<number>(0);
  const [isGrinding, setIsGrinding] = useState<boolean>(false);

  const [waterMl, setWaterMl] = useState<number>(0);
  const [restRemaining, setRestRemaining] = useState<number>(REST_DURATION_SECONDS);
  const [isPouring, setIsPouring] = useState<boolean>(false);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>({
    x: 140,
    y: 140,
  });
  const [guideAngle, setGuideAngle] = useState<number>(0);
  const [inSweetSpot, setInSweetSpot] = useState<boolean>(true);

  const steadyTicksRef = useRef<number>(0);
  const totalPourTicksRef = useRef<number>(0);
  const [extractionPct, setExtractionPct] = useState<number>(94);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [stats, setStats] = useState<PourStats | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const pushToast = useCallback(
    (title: string, description?: string, tone: ToastItem["tone"] = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const timestamp = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setToasts((prev) => [
        ...prev.slice(-2),
        { id, title, description, tone, timestamp },
      ]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const resetRitual = useCallback(() => {
    soundEngine.stopPourSound();
    setPhase("grind");
    setGramsGround(0);
    setGrinderAngle(0);
    setIsGrinding(false);
    setWaterMl(0);
    setRestRemaining(REST_DURATION_SECONDS);
    setIsPouring(false);
    setPointerPos({ x: 140, y: 140 });
    setGuideAngle(0);
    setInSweetSpot(true);
    steadyTicksRef.current = 0;
    totalPourTicksRef.current = 0;
    setExtractionPct(94);
    setElapsedSeconds(0);
    setCopied(false);
  }, []);

  useEffect(() => {
    resetRitual();
  }, [bean, resetRitual]);

  useEffect(() => {
    setStats(loadPourStats());
    return () => {
      soundEngine.stopPourSound();
    };
  }, []);

  // Elapsed timer (Daily mode, paused once complete)
  useEffect(() => {
    if (mode !== "daily" || phase === "complete") return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode, phase]);

  // Step 1: Grind loop
  useEffect(() => {
    if (phase !== "grind" || !isGrinding) return;
    let tickCount = 0;
    const interval = window.setInterval(() => {
      tickCount++;
      if (tickCount % 2 === 0) {
        soundEngine.playGrindTick();
      }
      setGrinderAngle((a) => (a + 18) % 360);
      setGramsGround((g) => {
        const next = Math.min(TARGET_GRAMS, +(g + 0.55).toFixed(2));
        if (next >= TARGET_GRAMS) {
          setIsGrinding(false);
          soundEngine.playLatch();
          setPhase("bloom");
        }
        return next;
      });
    }, 60);
    return () => window.clearInterval(interval);
  }, [phase, isGrinding]);

  // Step 2b: Gentle CO2 bloom rest countdown
  useEffect(() => {
    if (phase !== "rest") return;
    soundEngine.stopPourSound();
    const interval = window.setInterval(() => {
      setRestRemaining((r) => {
        if (r <= 1) {
          soundEngine.playLatch();
          setPhase("pour");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase]);

  // Compute current spiral guide target coordinates (SVG 280x280, centre 140,140)
  const guidePoint = useMemo(() => {
    if (phase === "bloom") {
      return { x: 140, y: 140, radius: 42 };
    }
    const progress = Math.max(
      0,
      Math.min(1, (waterMl - bean.bloomMl) / (bean.targetMl - bean.bloomMl))
    );
    const orbitRadius = 26 + Math.sin(progress * Math.PI * 2) * 26 + 18;
    const x = 140 + Math.cos(guideAngle) * orbitRadius;
    const y = 140 + Math.sin(guideAngle) * orbitRadius;
    return { x, y, radius: 34 };
  }, [bean.bloomMl, bean.targetMl, guideAngle, phase, waterMl]);

  // Step 2 & Step 3: Pouring water loop
  useEffect(() => {
    if ((phase !== "bloom" && phase !== "pour") || !isPouring) {
      soundEngine.stopPourSound();
      return;
    }

    const interval = window.setInterval(() => {
      setGuideAngle((a) => a + 0.085);

      const dx = pointerPos.x - guidePoint.x;
      const dy = pointerPos.y - guidePoint.y;
      const dist = Math.hypot(dx, dy);
      const sweet = dist <= guidePoint.radius + 14;
      setInSweetSpot(sweet);

      totalPourTicksRef.current += 1;
      if (sweet) steadyTicksRef.current += 1;

      const flowRate = sweet ? 1.85 : 1.35;

      setWaterMl((ml) => {
        const nextMl = +(ml + flowRate).toFixed(1);
        soundEngine.startPourSound(nextMl / bean.targetMl);

        if (phase === "bloom" && nextMl >= bean.bloomMl) {
          setIsPouring(false);
          soundEngine.stopPourSound();
          soundEngine.playSnap();
          setRestRemaining(REST_DURATION_SECONDS);
          setPhase("rest");
          return bean.bloomMl;
        }

        if (phase === "pour" && nextMl >= bean.targetMl) {
          setIsPouring(false);
          soundEngine.stopPourSound();
          soundEngine.playComplete();

          const ratio =
            totalPourTicksRef.current > 0
              ? steadyTicksRef.current / totalPourTicksRef.current
              : 0.9;
          const finalScore = Math.max(
            82,
            Math.min(99, Math.round(82 + ratio * 17))
          );
          setExtractionPct(finalScore);
          setPhase("complete");

          if (mode === "daily") {
            const shareText = buildPourShareCard(
              bean,
              formatShortBritishDate(todayKey),
              finalScore,
              formatDuration(elapsedSeconds)
            );
            const updated = recordPourDailyCompletion({
              dateKey: todayKey,
              beanName: bean.name,
              extractionPct: finalScore,
              elapsedSeconds,
              shareText,
              completedAt: new Date().toISOString(),
            });
            setStats(updated);
            pushToast(
              "Tasting card unlocked",
              `${bean.name} · ${finalScore}% extraction.`,
              "success"
            );
          } else {
            const updated = recordPourZenCompletion();
            setStats(updated);
            pushToast(
              "Zen brew complete",
              `${bean.name} · ${finalScore}% extraction.`,
              "success"
            );
          }
          return bean.targetMl;
        }

        return nextMl;
      });
    }, 55);

    return () => window.clearInterval(interval);
  }, [
    bean,
    elapsedSeconds,
    guidePoint.radius,
    guidePoint.x,
    guidePoint.y,
    isPouring,
    mode,
    phase,
    pointerPos.x,
    pointerPos.y,
    pushToast,
    todayKey,
  ]);

  // Keyboard support: hold Spacebar to grind or pour (auto-tracking guide ring for accessibility!)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      if (phase === "grind") {
        e.preventDefault();
        setIsGrinding(true);
      } else if (phase === "bloom" || phase === "pour") {
        e.preventDefault();
        setPointerPos({ x: guidePoint.x, y: guidePoint.y });
        setIsPouring(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      setIsGrinding(false);
      setIsPouring(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [guidePoint.x, guidePoint.y, phase]);

  const updatePointerFromEvent = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = 280 / rect.width;
    const scaleY = 280 / rect.height;
    const x = Math.max(24, Math.min(256, (e.clientX - rect.left) * scaleX));
    const y = Math.max(24, Math.min(256, (e.clientY - rect.top) * scaleY));
    setPointerPos({ x, y });
  };

  const handleCopyTastingCard = async () => {
    const text = buildPourShareCard(
      bean,
      mode === "daily" ? formatShortBritishDate(todayKey) : "Zen Brew",
      extractionPct,
      mode === "daily" ? formatDuration(elapsedSeconds) : "Untimed"
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      soundEngine.playPickup();
      pushToast("Tasting card copied", "Ready to share your brew.", "success");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      pushToast("Copy unavailable", "Clipboard access was blocked.", "warning");
    }
  };

  const overallProgress =
    phase === "grind"
      ? (gramsGround / TARGET_GRAMS) * 25
      : phase === "bloom"
        ? 25 + (waterMl / bean.bloomMl) * 20
        : phase === "rest"
          ? 45 + ((REST_DURATION_SECONDS - restRemaining) / REST_DURATION_SECONDS) * 10
          : phase === "pour"
            ? 55 + ((waterMl - bean.bloomMl) / (bean.targetMl - bean.bloomMl)) * 45
            : 100;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar backHref="/" title="Daily Pour" />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-16 flex flex-col items-center">
        {/* Mode Switcher & Status Badges */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-5">
          <Tabs value={mode} onValueChange={(v) => setMode(v as GameMode)}>
            <TabsList aria-label="Brew mode">
              <TabsTrigger value="daily">Daily Ritual</TabsTrigger>
              <TabsTrigger value="zen">Zen Brew</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2">
            {mode === "daily" ? (
              <>
                <Badge tone="neutral">{formatShortBritishDate(todayKey)}</Badge>
                <Badge tone="accent" className="font-mono tabular-nums">
                  {formatDuration(elapsedSeconds)}
                </Badge>
                {stats && stats.currentStreak > 0 && (
                  <Badge tone="success" className="font-mono tabular-nums">
                    <Flame className="w-3.5 h-3.5" />
                    {stats.currentStreak}
                  </Badge>
                )}
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  soundEngine.playPickup();
                  setZenCounter((n) => n + 1);
                }}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Different roast</span>
              </Button>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="How to play Daily Pour"
                  className="w-10 px-0"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>How to brew Daily Pour</DialogTitle>
                <DialogDescription>
                  A calm three-step pour-over ritual taking roughly 90 seconds.
                </DialogDescription>
                <ol className="mt-4 space-y-2.5 text-sm text-[var(--sys-color-text-secondary)] list-decimal pl-5">
                  <li>
                    <strong>Grind:</strong> Hold the grinder button (or Spacebar) until
                    18g of fresh beans are ground.
                  </li>
                  <li>
                    <strong>Bloom:</strong> Press and hold inside the centre ring to pour
                    45 ml, then pause briefly as the grounds bloom.
                  </li>
                  <li>
                    <strong>Spiral Pour:</strong> Follow the drifting target ring smoothly
                    to 250 ml to unlock today&apos;s tasting card.
                  </li>
                </ol>
                <div className="mt-6 flex justify-end">
                  <DialogClose asChild>
                    <Button variant="primary">Start brewing</Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bean Origin Strip */}
        <div className="w-full tonal-card p-4 mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-[var(--sys-color-action-primary)]" />
              <h1 className="text-base font-semibold text-[var(--sys-color-text-primary)]">
                {bean.name}
              </h1>
              <Badge tone="neutral">{bean.roast}</Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--sys-color-text-secondary)]">
              {bean.origin} · {bean.elevation} · {bean.grindLabel} grind ·{" "}
              <span className="font-mono tabular-nums">{bean.waterTempC}°C</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {bean.notes.map((note) => (
              <Badge key={note} tone="accent">
                {note}
              </Badge>
            ))}
          </div>
        </div>

        {/* Ritual Progress Bar */}
        <div className="w-full mb-5">
          <ProgressBar
            value={Math.round(overallProgress)}
            max={100}
            label={
              phase === "grind"
                ? "Step 1 of 3 · Grind fresh beans"
                : phase === "bloom"
                  ? "Step 2 of 3 · Saturate for the bloom"
                  : phase === "rest"
                    ? "Step 2 of 3 · Resting for CO₂ bloom"
                    : phase === "pour"
                      ? "Step 3 of 3 · Steady spiral pour"
                      : "Ritual complete"
            }
          />
        </div>

        {/* Interactive Stage */}
        <AnimatePresence mode="wait">
          {phase === "grind" && (
            <motion.section
              key="grind"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="w-full max-w-[400px] tonal-card-elevated rounded-[24px] p-6 flex flex-col items-center text-center"
            >
              <div className="relative w-44 h-44 rounded-full bg-[var(--sys-color-surface-lowest)] border border-[var(--sys-color-border-subtle)] flex items-center justify-center mb-5">
                <svg viewBox="0 0 160 160" className="w-36 h-36">
                  <circle
                    cx="80"
                    cy="80"
                    r="62"
                    fill="none"
                    stroke="var(--sys-color-border-subtle)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="62"
                    fill="none"
                    stroke="var(--tile-terracotta-fill)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 62}
                    strokeDashoffset={
                      2 * Math.PI * 62 * (1 - gramsGround / TARGET_GRAMS)
                    }
                    transform="rotate(-90 80 80)"
                  />
                  <g transform={`rotate(${grinderAngle} 80 80)`}>
                    <line
                      x1="80"
                      y1="80"
                      x2="122"
                      y2="80"
                      stroke="var(--sys-color-text-primary)"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="124"
                      cy="80"
                      r="9"
                      fill="var(--tile-terracotta-fill)"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="10"
                      fill="var(--sys-color-surface-container)"
                      stroke="var(--sys-color-text-primary)"
                      strokeWidth="3"
                    />
                  </g>
                </svg>
              </div>

              <div className="font-mono text-2xl font-semibold tabular-nums text-[var(--sys-color-text-primary)]">
                {gramsGround.toFixed(1)}g{" "}
                <span className="text-sm font-normal text-[var(--sys-color-text-muted)]">
                  / {TARGET_GRAMS}g
                </span>
              </div>
              <p className="mt-1.5 text-sm text-[var(--sys-color-text-secondary)]">
                Hold to hand-grind to {bean.grindLabel.toLowerCase()} coarseness.
              </p>

              <Button
                variant="primary"
                size="lg"
                className="mt-5 w-full select-none"
                onPointerDown={() => setIsGrinding(true)}
                onPointerUp={() => setIsGrinding(false)}
                onPointerLeave={() => setIsGrinding(false)}
                onPointerCancel={() => setIsGrinding(false)}
              >
                {isGrinding ? "Grinding…" : "Hold to grind (or Space)"}
              </Button>
            </motion.section>
          )}

          {(phase === "bloom" || phase === "rest" || phase === "pour") && (
            <motion.section
              key="dripper"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="w-full max-w-[420px] tonal-card-elevated rounded-[24px] p-5 flex flex-col items-center"
            >
              <div className="w-full flex items-center justify-between mb-3">
                <Badge tone="neutral" className="font-mono tabular-nums">
                  <Droplets className="w-3.5 h-3.5" />
                  {Math.round(waterMl)} /{" "}
                  {phase === "bloom" ? bean.bloomMl : bean.targetMl} ml
                </Badge>

                {phase === "rest" ? (
                  <Badge tone="warning" className="font-mono tabular-nums">
                    Blooming · {restRemaining}s
                  </Badge>
                ) : isPouring ? (
                  <Badge tone={inSweetSpot ? "success" : "warning"}>
                    {inSweetSpot ? "Steady sweet spot" : "Guide back to ring"}
                  </Badge>
                ) : (
                  <Badge tone="accent">Hold inside ring to pour</Badge>
                )}
              </div>

              <svg
                ref={svgRef}
                viewBox="0 0 280 280"
                className="w-full max-w-[280px] aspect-square touch-none select-none cursor-crosshair"
                onPointerDown={(e) => {
                  if (phase === "rest") return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  updatePointerFromEvent(e);
                  setIsPouring(true);
                }}
                onPointerMove={(e) => {
                  updatePointerFromEvent(e);
                }}
                onPointerUp={() => setIsPouring(false)}
                onPointerCancel={() => setIsPouring(false)}
              >
                {/* Ceramic V60 Outer Rim */}
                <circle
                  cx="140"
                  cy="140"
                  r="128"
                  fill="var(--sys-color-surface-lowest)"
                  stroke="var(--sys-color-border-default)"
                  strokeWidth="3"
                />
                {/* Paper Filter Ring */}
                <circle
                  cx="140"
                  cy="140"
                  r="112"
                  fill="var(--sys-color-surface-low)"
                  stroke="var(--sys-color-border-subtle)"
                  strokeWidth="1.5"
                />
                {/* Coffee Grounds Bed (saturates gently as water rises) */}
                <circle
                  cx="140"
                  cy="140"
                  r={88 + Math.min(14, (waterMl / bean.targetMl) * 14)}
                  fill="var(--tile-terracotta-stroke)"
                  opacity={0.28 + Math.min(0.45, (waterMl / bean.targetMl) * 0.45)}
                />

                {/* Bloom Expansion Rings during Rest */}
                {phase === "rest" && (
                  <motion.circle
                    cx="140"
                    cy="140"
                    r="46"
                    fill="none"
                    stroke="var(--tile-ochre-fill)"
                    strokeWidth="2.5"
                    initial={{ r: 30, opacity: 0.85 }}
                    animate={{ r: 88, opacity: 0.15 }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                )}

                {/* Target Spiral Guide Ring */}
                {phase !== "rest" && (
                  <g>
                    <circle
                      cx={guidePoint.x}
                      cy={guidePoint.y}
                      r={guidePoint.radius}
                      fill="none"
                      stroke={
                        isPouring && inSweetSpot
                          ? "var(--tile-emerald-fill)"
                          : "var(--tile-terracotta-fill)"
                      }
                      strokeWidth="2.5"
                      strokeDasharray="6 5"
                    />
                    <circle
                      cx={guidePoint.x}
                      cy={guidePoint.y}
                      r="5"
                      fill="var(--tile-terracotta-fill)"
                    />
                  </g>
                )}

                {/* Active Kettle Water Stream Indicator */}
                {isPouring && (
                  <g>
                    <circle
                      cx={pointerPos.x}
                      cy={pointerPos.y}
                      r="14"
                      fill="var(--sys-color-action-primary)"
                      opacity="0.22"
                    />
                    <circle
                      cx={pointerPos.x}
                      cy={pointerPos.y}
                      r="6"
                      fill="var(--sys-color-action-primary)"
                    />
                  </g>
                )}
              </svg>

              <p className="mt-3 text-xs text-center text-[var(--sys-color-text-muted)]">
                {phase === "rest"
                  ? "Pause and take a slow breath while the fresh grounds release CO₂."
                  : "Press and hold inside the dripper (or hold Spacebar) to pour a calm, steady stream."}
              </p>
            </motion.section>
          )}

          {phase === "complete" && (
            <motion.section
              key="complete"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="w-full max-w-[440px] tonal-card p-6 border-[var(--sys-color-feedback-success)] text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--sys-color-feedback-success-bg)] text-[var(--sys-color-feedback-success)] flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>

              <Badge tone="success" className="mb-2 font-mono tabular-nums">
                {extractionPct}% Extraction
              </Badge>

              <h2 className="text-2xl font-semibold text-[var(--sys-color-text-primary)]">
                {getExtractionVerdict(extractionPct)}
              </h2>
              <p className="mt-1.5 text-sm text-[var(--sys-color-text-secondary)]">
                {bean.name} ({bean.origin}) ·{" "}
                <span className="font-mono tabular-nums">
                  {bean.targetMl} ml
                </span>
                {mode === "daily"
                  ? ` in ${formatDuration(elapsedSeconds)}`
                  : ""}
                .
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                {bean.notes.map((n) => (
                  <Badge key={n} tone="accent">
                    {n}
                  </Badge>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <Button variant="primary" onClick={handleCopyTastingCard}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied tasting card</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy tasting card</span>
                    </>
                  )}
                </Button>

                {mode === "daily" ? (
                  <Button variant="secondary" onClick={() => setMode("zen")}>
                    <Shuffle className="w-4 h-4" />
                    <span>Try Zen Brew</span>
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => setZenCounter((n) => n + 1)}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Brew another</span>
                  </Button>
                )}

                <Link href="/">
                  <Button variant="ghost">Back to Hub</Button>
                </Link>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
