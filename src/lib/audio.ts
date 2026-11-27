"use client";

const MUTE_STORAGE_KEY = "coffee-break:muted";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private initialised: boolean = false;
  private pourNodes: {
    source: AudioBufferSourceNode;
    filter: BiquadFilterNode;
    gain: GainNode;
  } | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.initialised) {
      this.muted = window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
      this.initialised = true;
    }
    if (this.muted) return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    if (typeof window === "undefined") return false;
    if (!this.initialised) {
      this.muted = window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
      this.initialised = true;
    }
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.initialised = true;
    if (muted) {
      this.stopPourSound();
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
    }
  }

  /** Soft tactile coffee-grinder burr crunch */
  public playGrindTick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.045);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(680 + Math.random() * 240, now);
    filter.Q.setValueAtTime(1.6, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.048);
  }

  /** Start soothing filtered pink-noise kettle water pour */
  public startPourSound(pitchRatio: number = 0.5): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (this.pourNodes) {
      const targetFreq = 650 + Math.min(1, Math.max(0, pitchRatio)) * 620;
      this.pourNodes.filter.frequency.setTargetAtTime(
        targetFreq,
        ctx.currentTime,
        0.12
      );
      return;
    }

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      output[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(650 + pitchRatio * 620, ctx.currentTime);
    filter.Q.setValueAtTime(1.1, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.11, ctx.currentTime + 0.18);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    this.pourNodes = { source, filter, gain };
  }

  /** Gently fade out pouring water sound */
  public stopPourSound(): void {
    if (!this.pourNodes || !this.ctx) return;
    const { source, gain } = this.pourNodes;
    const now = this.ctx.currentTime;
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.001, gain.gain.value), now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.14);
      source.stop(now + 0.16);
    } catch {
      // Ignore if already stopped
    }
    this.pourNodes = null;
  }

  /** Soft linen pickup thump */
  public playPickup(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.055);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  /** Crisp wooden/ceramic rotation tick */
  public playRotate(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(310, now + 0.04);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.048);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  /** Warm magnetic ceramic snap */
  public playSnap(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Woody body thock
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = "sine";
    bodyOsc.frequency.setValueAtTime(310, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(145, now + 0.07);

    bodyGain.gain.setValueAtTime(0.001, now);
    bodyGain.gain.linearRampToValueAtTime(0.14, now + 0.005);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(ctx.destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.09);

    // Ceramic overtone click
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = "triangle";
    clickOsc.frequency.setValueAtTime(920, now);
    clickOsc.frequency.exponentialRampToValueAtTime(520, now + 0.03);

    clickGain.gain.setValueAtTime(0.001, now);
    clickGain.gain.linearRampToValueAtTime(0.05, now + 0.003);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.04);
  }

  /** Tactile weighted-token drop clack with subtle wooden double-bounce */
  public playTokenDrop(row: number = 5): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Deeper drops sound slightly lower and more resonant
    const baseFreq = 250 + (5 - Math.min(5, Math.max(0, row))) * 26;

    const triggerClack = (offset: number, volume: number, freqScale: number) => {
      const start = now + offset;
      const body = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      body.type = "triangle";
      body.frequency.setValueAtTime(baseFreq * freqScale, start);
      body.frequency.exponentialRampToValueAtTime(
        Math.max(95, baseFreq * 0.45 * freqScale),
        start + 0.055
      );

      bodyGain.gain.setValueAtTime(0.001, start);
      bodyGain.gain.linearRampToValueAtTime(volume, start + 0.004);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, start + 0.068);

      body.connect(bodyGain);
      bodyGain.connect(ctx.destination);
      body.start(start);
      body.stop(start + 0.075);

      const rim = ctx.createOscillator();
      const rimGain = ctx.createGain();
      rim.type = "sine";
      rim.frequency.setValueAtTime(baseFreq * 2.8 * freqScale, start);
      rim.frequency.exponentialRampToValueAtTime(
        baseFreq * 1.6 * freqScale,
        start + 0.025
      );

      rimGain.gain.setValueAtTime(0.001, start);
      rimGain.gain.linearRampToValueAtTime(volume * 0.35, start + 0.002);
      rimGain.gain.exponentialRampToValueAtTime(0.001, start + 0.03);

      rim.connect(rimGain);
      rimGain.connect(ctx.destination);
      rim.start(start);
      rim.stop(start + 0.035);
    };

    triggerClack(0, 0.14, 1.0);
    triggerClack(0.068, 0.06, 1.08);
  }

  /** Resonant harmonic chime when an eyelet latches onto its matching peg */
  public playLatch(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.playSnap();

    const now = ctx.currentTime + 0.015;
    const notes = [587.33, 880]; // D5 + A5 warm fifth

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.035);

      gain.gain.setValueAtTime(0.001, now + i * 0.035);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.035 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.035 + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.035);
      osc.stop(now + i * 0.035 + 0.34);
    });
  }

  /** Gentle muted tap when placement is blocked (never harsh) */
  public playInvalid(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(155, now);
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.07);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /** Soft cascading sweep when clearing the board */
  public playClear(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [440, 369.99, 293.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.045);

      gain.gain.setValueAtTime(0.001, now + i * 0.045);
      gain.gain.linearRampToValueAtTime(0.055, now + i * 0.045 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.045 + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.16);
    });
  }

  /** Warm ascending pentatonic marimba chord on puzzle completion */
  public playComplete(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // C5, E5, G5, B5, D6 — restorative major-9th arpeggio
    const chord = [523.25, 659.25, 783.99, 987.77, 1174.66];
    chord.forEach((freq, i) => {
      const start = now + i * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.095, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.68);
    });
  }
}

export const soundEngine = new SoundEngine();
