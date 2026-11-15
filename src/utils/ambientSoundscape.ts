export type SoundscapePreset = "auto" | "breeze" | "rain" | "night";

export type TimeOfDayPhase = "morning" | "afternoon" | "evening" | "night";

export function getTimeOfDayPhase(date = new Date()): TimeOfDayPhase {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function resolveSoundscapeProfile(
  preset: SoundscapePreset,
  phase: TimeOfDayPhase,
  residentStatus: "Calm" | "Active" | "Resting"
): {
  label: string;
  cutoffHz: number;
  q: number;
  toneHz: number;
  toneGain: number;
  noiseGain: number;
} {
  const effectiveMode: Exclude<SoundscapePreset, "auto"> =
    preset !== "auto"
      ? preset
      : residentStatus === "Resting" || phase === "night"
        ? "night"
        : phase === "morning"
          ? "breeze"
          : "rain";

  if (effectiveMode === "breeze") {
    return {
      label:
        preset === "auto"
          ? `Morning Garden Breeze (${residentStatus})`
          : "Morning Garden Breeze",
      cutoffHz: 920,
      q: 0.7,
      toneHz: 261.63,
      toneGain: 0.014,
      noiseGain: 0.14,
    };
  }

  if (effectiveMode === "rain") {
    return {
      label:
        preset === "auto"
          ? `Soft Afternoon Rain (${residentStatus})`
          : "Soft Afternoon Rain",
      cutoffHz: 680,
      q: 0.9,
      toneHz: 196.0,
      toneGain: 0.01,
      noiseGain: 0.17,
    };
  }

  return {
    label:
      preset === "auto"
        ? `Evening Hearth Hush (${residentStatus})`
        : "Evening Hearth Hush",
    cutoffHz: 340,
    q: 0.55,
    toneHz: 146.83,
    toneGain: 0.008,
    noiseGain: 0.19,
  };
}

export class AmbientSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private toneOsc: OscillatorNode | null = null;
  private toneGainNode: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private running = false;

  public async start(
    volume: number,
    preset: SoundscapePreset,
    residentStatus: "Calm" | "Active" | "Resting"
  ): Promise<void> {
    if (this.running) {
      this.update(volume, preset, residentStatus);
      return;
    }

    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) {
      throw new Error("Web Audio is not supported in this browser.");
    }

    const ctx = new Ctx();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    this.ctx = ctx;

    // 4-second seamless brown/pink-weighted noise buffer
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.028 * white) / 1.028;
      data[i] = lastOut * 2.6;
    }

    // Cross-fade buffer ends for click-free loop
    const fadeSamples = Math.floor(sampleRate * 0.15);
    for (let i = 0; i < fadeSamples; i += 1) {
      const t = i / fadeSamples;
      data[i] = data[i] * t + data[length - fadeSamples + i] * (1 - t);
    }

    const profile = resolveSoundscapeProfile(
      preset,
      getTimeOfDayPhase(),
      residentStatus
    );

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(
      Math.max(0.001, volume * profile.noiseGain),
      ctx.currentTime + 0.8
    );
    masterGain.connect(ctx.destination);
    this.masterGain = masterGain;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(profile.cutoffHz, ctx.currentTime);
    filter.Q.setValueAtTime(profile.q, ctx.currentTime);
    filter.connect(masterGain);
    this.filterNode = filter;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.connect(filter);
    noise.start();
    this.noiseSource = noise;

    // Subtle slow breathing LFO on filter cutoff
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.09, ctx.currentTime);
    lfoGain.gain.setValueAtTime(75, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.lfoOsc = lfo;

    // Very soft harmonic warmth drone
    const toneOsc = ctx.createOscillator();
    toneOsc.type = "sine";
    toneOsc.frequency.setValueAtTime(profile.toneHz, ctx.currentTime);
    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(volume * profile.toneGain, ctx.currentTime);
    toneOsc.connect(toneGain);
    toneGain.connect(ctx.destination);
    toneOsc.start();
    this.toneOsc = toneOsc;
    this.toneGainNode = toneGain;

    this.running = true;
  }

  public update(
    volume: number,
    preset: SoundscapePreset,
    residentStatus: "Calm" | "Active" | "Resting"
  ): void {
    if (!this.running || !this.ctx) return;
    const now = this.ctx.currentTime;
    const profile = resolveSoundscapeProfile(
      preset,
      getTimeOfDayPhase(),
      residentStatus
    );

    if (this.filterNode) {
      this.filterNode.frequency.linearRampToValueAtTime(profile.cutoffHz, now + 0.5);
      this.filterNode.Q.linearRampToValueAtTime(profile.q, now + 0.5);
    }
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(
        Math.max(0.001, volume * profile.noiseGain),
        now + 0.3
      );
    }
    if (this.toneOsc) {
      this.toneOsc.frequency.linearRampToValueAtTime(profile.toneHz, now + 0.5);
    }
    if (this.toneGainNode) {
      this.toneGainNode.gain.linearRampToValueAtTime(
        volume * profile.toneGain,
        now + 0.3
      );
    }
  }

  public stop(): void {
    if (!this.running || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    try {
      if (this.masterGain) {
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
      }
      if (this.toneGainNode) {
        this.toneGainNode.gain.linearRampToValueAtTime(0.0001, now + 0.25);
      }
      setTimeout(() => {
        try {
          this.noiseSource?.stop();
          this.toneOsc?.stop();
          this.lfoOsc?.stop();
          void ctx.close();
        } catch {
          // ignore already closed
        }
      }, 280);
    } catch {
      // ignore teardown errors
    }

    this.noiseSource = null;
    this.toneOsc = null;
    this.lfoOsc = null;
    this.masterGain = null;
    this.filterNode = null;
    this.toneGainNode = null;
    this.ctx = null;
    this.running = false;
  }
}
