// ─── Meditation Audio Engine v3 ──────────────────────────────────────────────
// Philosophy: Silence is the foundation. Sounds emerge from and return to silence.
// No continuous drone pads. Only sparse, beautiful tones that ring and fade.
// Pre-rendered AudioBuffers for complex, realistic singing bowls & chimes.
// Ultra-quiet ambient texture (brown noise) for "air" — never a drone.

export type SoundscapeId = "home" | "breathe" | "wisdom" | "journal" | "test" | "profile" | "silence";

// ─── Musical scales ──────────────────────────────────────────────────────────

// Pentatonic — never dissonant, always consonant
const BOWL_FREQS_LOW = [174.61, 196.0, 220.0, 261.63, 293.66];
const BOWL_FREQS_MID = [261.63, 293.66, 329.63, 392.0, 440.0];
const BOWL_FREQS_HIGH = [392.0, 440.0, 523.25, 587.33, 659.25];
const CHIME_FREQS = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Pre-render a singing bowl tone into an AudioBuffer ──────────────────────
// Uses additive synthesis with inharmonic partials based on real bowl physics.
// The result sounds like a real struck singing bowl — rich, warm, with beats.

function renderSingingBowl(
  ctx: BaseAudioContext,
  baseFreq: number,
  duration: number = 8,
  volume: number = 0.15
): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(2, len, sr);

  // Real singing bowl partial ratios (approximate, from acoustics research)
  // These create the characteristic "beating" and rich timbre
  const partials = [
    { ratio: 1.0, amp: 1.0, decay: duration * 0.9 },
    { ratio: 2.76, amp: 0.45, decay: duration * 0.65 },
    { ratio: 4.72, amp: 0.18, decay: duration * 0.45 },
    { ratio: 6.85, amp: 0.07, decay: duration * 0.3 },
    { ratio: 8.92, amp: 0.03, decay: duration * 0.2 },
  ];

  // Add a slight detuned copy for natural "beating" effect
  const detune = 0.3; // Hz — creates gentle pulsing

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    const channelDetune = ch === 0 ? 0 : 0.15; // Slight stereo spread

    for (let i = 0; i < len; i++) {
      const t = i / sr;
      let sample = 0;

      for (const p of partials) {
        const freq = baseFreq * p.ratio + channelDetune;
        const freq2 = freq + detune; // Detuned copy for beating

        // Gentle attack (10-80ms depending on partial)
        const attackTime = 0.01 + p.ratio * 0.008;
        const attack = t < attackTime ? t / attackTime : 1.0;

        // Exponential decay
        const decay = Math.exp(-t / (p.decay * 0.25));

        // Main tone + detuned copy (creates natural beating)
        const tone1 = Math.sin(2 * Math.PI * freq * t);
        const tone2 = Math.sin(2 * Math.PI * freq2 * t);

        sample += (tone1 + tone2 * 0.6) * p.amp * attack * decay * volume;
      }

      // Soft limiting
      sample = Math.tanh(sample * 1.2);
      data[i] = sample;
    }
  }

  return buffer;
}

// ─── Pre-render a soft chime/bell tone ───────────────────────────────────────

function renderChime(
  ctx: BaseAudioContext,
  baseFreq: number,
  duration: number = 4,
  volume: number = 0.1
): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(2, len, sr);

  const partials = [
    { ratio: 1.0, amp: 1.0, decay: duration * 0.8 },
    { ratio: 2.0, amp: 0.35, decay: duration * 0.5 },
    { ratio: 3.0, amp: 0.12, decay: duration * 0.3 },
    { ratio: 4.2, amp: 0.05, decay: duration * 0.2 }, // Slightly inharmonic
  ];

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    const pan = ch === 0 ? -0.2 : 0.2;

    for (let i = 0; i < len; i++) {
      const t = i / sr;
      let sample = 0;

      for (const p of partials) {
        const freq = baseFreq * p.ratio;
        const attackTime = 0.005 + p.ratio * 0.003;
        const attack = t < attackTime ? t / attackTime : 1.0;
        const decay = Math.exp(-t / (p.decay * 0.3));

        sample += Math.sin(2 * Math.PI * freq * t + pan) * p.amp * attack * decay * volume;
      }

      data[i] = Math.tanh(sample * 1.1);
    }
  }

  return buffer;
}

// ─── Pre-render brown noise (much softer than pink/white) ────────────────────

function renderBrownNoise(
  ctx: BaseAudioContext,
  duration: number = 12,
  volume: number = 0.02
): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(2, len, sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let last = 0;

    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise: each sample = previous + small random step
      last = (last + (0.02 * white)) / 1.02;
      // Gentle crossfade at loop boundaries (first/last 1s)
      const t = i / sr;
      let env = 1;
      if (t < 1) env = t;
      if (t > duration - 1) env = duration - t;
      data[i] = last * volume * env;
    }
  }

  return buffer;
}

// ─── Pre-render a soft "whoosh" for transitions ─────────────────────────────

function renderWhoosh(
  ctx: BaseAudioContext,
  duration: number = 1.5,
  volume: number = 0.06
): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(2, len, sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let last = 0;

    for (let i = 0; i < len; i++) {
      const t = i / sr;
      // Noise burst with envelope
      const white = Math.random() * 2 - 1;
      last = (last + 0.04 * white) / 1.04;

      // Smooth envelope: rise then fall
      const env = Math.sin(Math.PI * t / duration);

      // Frequency sweep effect via amplitude modulation
      const sweep = 0.5 + 0.5 * Math.sin(2 * Math.PI * (200 + t * 100) * t);

      data[i] = last * volume * env * (0.6 + 0.4 * sweep);
    }
  }

  return buffer;
}

// ─── Pre-render breath tone (ascending or descending) ───────────────────────

function renderBreathTone(
  ctx: BaseAudioContext,
  startFreq: number,
  endFreq: number,
  duration: number,
  volume: number = 0.06
): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(2, len, sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);

    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const progress = t / duration;

      // Frequency glide
      const freq = startFreq + (endFreq - startFreq) * progress;

      // Soft envelope
      let env;
      if (progress < 0.15) env = progress / 0.15;
      else if (progress > 0.7) env = (1 - progress) / 0.3;
      else env = 1;
      env = env * env; // Quadratic for smoothness

      // Main tone + soft harmonic
      const tone = Math.sin(2 * Math.PI * freq * t);
      const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.15;

      data[i] = (tone + harmonic) * volume * env;
    }
  }

  return buffer;
}

// ─── Generate impulse response for reverb ────────────────────────────────────

function generateReverbIR(ctx: BaseAudioContext, duration: number = 4, decay: number = 3): AudioBuffer {
  const sr = ctx.sampleRate;
  const length = Math.floor(sr * duration);
  const buffer = ctx.createBuffer(2, length, sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);

    // Early reflections — discrete echoes
    const reflectionTimes = [0.012, 0.019, 0.028, 0.037, 0.048, 0.063, 0.083, 0.108];
    const reflectionAmps = [0.6, 0.5, 0.4, 0.35, 0.28, 0.22, 0.16, 0.1];

    for (let i = 0; i < length; i++) {
      const t = i / sr;

      // Diffuse decay
      let sample = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, decay);

      // Add early reflections
      for (let r = 0; r < reflectionTimes.length; r++) {
        if (Math.abs(t - reflectionTimes[r]) < 0.001) {
          sample += reflectionAmps[r] * (ch === 0 ? 1 : -1) * (Math.random() * 0.5 + 0.5);
        }
      }

      data[i] = sample * 0.5;
    }
  }

  return buffer;
}

// ─── Main Engine ─────────────────────────────────────────────────────────────

class MeditationAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private currentSoundscape: SoundscapeId = "silence";
  private _volume = 0.4;
  private _enabled = false;
  private schedulers: ReturnType<typeof setTimeout>[] = [];
  private activeSources: AudioBufferSourceNode[] = [];
  private activeNodes: AudioNode[] = [];
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;

  // Pre-rendered buffers
  private bowlBuffers: Map<number, AudioBuffer> = new Map();
  private chimeBuffers: Map<number, AudioBuffer> = new Map();
  private brownNoiseBuffer: AudioBuffer | null = null;
  private whooshBuffer: AudioBuffer | null = null;
  private inhaleBuffer: AudioBuffer | null = null;
  private exhaleBuffer: AudioBuffer | null = null;

  get enabled() { return this._enabled; }
  get volume() { return this._volume; }
  get analyserNode() { return this.analyser; }

  // ─── Setup ────────────────────────────────────────────────────────────────

  private ensureContext(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  enable() {
    this._enabled = true;
    const ctx = this.ensureContext();

    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(ctx.destination);
    }

    if (!this.reverb) {
      this.reverb = ctx.createConvolver();
      this.reverb.buffer = generateReverbIR(ctx, 4.5, 3.5);

      this.reverbGain = ctx.createGain();
      this.reverbGain.gain.value = 0.55;

      this.dryGain = ctx.createGain();
      this.dryGain.gain.value = 0.65;

      this.reverb.connect(this.reverbGain);
      this.reverbGain.connect(this.masterGain);
      this.dryGain.connect(this.masterGain);
    }

    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.9;
      this.masterGain.connect(this.analyser);
    }

    // Pre-render all sounds
    this.prerenderBuffers(ctx);
  }

  private prerenderBuffers(ctx: AudioContext) {
    // Singing bowls at various frequencies
    if (this.bowlBuffers.size === 0) {
      const bowlFreqs = [...BOWL_FREQS_LOW, ...BOWL_FREQS_MID];
      for (const freq of bowlFreqs) {
        this.bowlBuffers.set(freq, renderSingingBowl(ctx, freq, 8, 0.15));
      }
    }

    // Chimes at higher frequencies
    if (this.chimeBuffers.size === 0) {
      for (const freq of CHIME_FREQS) {
        this.chimeBuffers.set(freq, renderChime(ctx, freq, 4, 0.08));
      }
    }

    // Brown noise loop
    if (!this.brownNoiseBuffer) {
      this.brownNoiseBuffer = renderBrownNoise(ctx, 12, 0.018);
    }

    // Whoosh
    if (!this.whooshBuffer) {
      this.whooshBuffer = renderWhoosh(ctx, 1.5, 0.05);
    }

    // Breath tones
    if (!this.inhaleBuffer) {
      this.inhaleBuffer = renderBreathTone(ctx, 196, 293.66, 3.5, 0.05);
    }
    if (!this.exhaleBuffer) {
      this.exhaleBuffer = renderBreathTone(ctx, 293.66, 196, 4, 0.045);
    }
  }

  disable() {
    this._enabled = false;
    this.stopAll();
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this._volume, this.ensureContext().currentTime, 0.15);
    }
  }

  switchSoundscape(id: SoundscapeId) {
    if (id === this.currentSoundscape) return;
    this.currentSoundscape = id;
    if (!this._enabled) return;
    this.crossfadeTo(id);
  }

  // ─── Audio routing ────────────────────────────────────────────────────────

  private routeToOutput(node: AudioNode) {
    if (!this.reverb || !this.dryGain) return;
    node.connect(this.dryGain);
    node.connect(this.reverb);
  }

  // ─── Play a pre-rendered buffer ───────────────────────────────────────────

  private playBuffer(buffer: AudioBuffer, volume: number = 1.0): AudioBufferSourceNode {
    const ctx = this.ensureContext();
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    src.connect(gain);
    this.routeToOutput(gain);

    src.start();
    this.activeSources.push(src);
    this.activeNodes.push(gain);

    // Auto-cleanup when done
    src.onended = () => {
      const si = this.activeSources.indexOf(src);
      if (si > -1) this.activeSources.splice(si, 1);
      const gi = this.activeNodes.indexOf(gain);
      if (gi > -1) this.activeNodes.splice(gi, 1);
      try { gain.disconnect(); } catch {}
    };

    return src;
  }

  // ─── Stop all sounds ──────────────────────────────────────────────────────

  private stopAll() {
    // Clear all scheduled events
    for (const id of this.schedulers) {
      clearTimeout(id);
    }
    this.schedulers = [];

    // Fade out ambient
    if (this.ambientGain) {
      const ctx = this.ensureContext();
      this.ambientGain.gain.setTargetAtTime(0, ctx.currentTime, 0.8);
      const ambSrc = this.ambientSource;
      const ambGain = this.ambientGain;
      setTimeout(() => {
        try { ambSrc?.stop(); } catch {}
        try { ambGain?.disconnect(); } catch {}
      }, 2500);
      this.ambientSource = null;
      this.ambientGain = null;
    }

    // Fade out master briefly for active sources
    if (this.masterGain) {
      const ctx = this.ensureContext();
      this.masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      setTimeout(() => {
        for (const src of this.activeSources) {
          try { src.stop(); } catch {}
        }
        for (const node of this.activeNodes) {
          try { node.disconnect(); } catch {}
        }
        this.activeSources = [];
        this.activeNodes = [];
        // Restore master gain
        if (this.masterGain) {
          this.masterGain.gain.setTargetAtTime(this._volume, ctx.currentTime, 0.1);
        }
      }, 1800);
    }
  }

  private crossfadeTo(id: SoundscapeId) {
    this.stopAll();
    const id2 = setTimeout(() => {
      this.startSoundscape(id);
    }, 1200);
    this.schedulers.push(id2);
  }

  // ─── Start ambient texture (brown noise, ultra-quiet) ─────────────────────

  private startAmbient(filterFreq: number = 400, volume: number = 0.3) {
    if (!this.brownNoiseBuffer) return;
    const ctx = this.ensureContext();

    const src = ctx.createBufferSource();
    src.buffer = this.brownNoiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.3;

    // Slow filter modulation for organic feel
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.03 + Math.random() * 0.02;
    lfoGain.gain.value = filterFreq * 0.2;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = 0;
    // Very slow fade in — ambient should barely be noticed
    gain.gain.setTargetAtTime(volume, ctx.currentTime, 3);

    src.connect(filter);
    filter.connect(gain);
    this.routeToOutput(gain);
    src.start();

    this.ambientSource = src;
    this.ambientGain = gain;
    this.activeNodes.push(filter, lfoGain);
    this.activeSources.push(lfo);

    // Cleanup LFO when ambient stops
    const origStop = src.onended;
    src.onended = () => {
      origStop?.call(src);
      try { lfo.stop(); } catch {}
      try { filter.disconnect(); } catch {}
      try { lfoGain.disconnect(); } catch {}
    };
  }

  // ─── Schedule random bowl strikes ─────────────────────────────────────────

  private scheduleBowls(
    freqs: number[],
    intervalRange: [number, number], // min, max ms between strikes
    volumeRange: [number, number] = [0.6, 1.0]
  ) {
    const scheduleNext = () => {
      if (!this._enabled) return;
      const freq = pick(freqs);
      const buffer = this.bowlBuffers.get(freq);
      if (buffer) {
        const vol = volumeRange[0] + Math.random() * (volumeRange[1] - volumeRange[0]);
        this.playBuffer(buffer, vol);
      }
      const delay = intervalRange[0] + Math.random() * (intervalRange[1] - intervalRange[0]);
      const id = setTimeout(scheduleNext, delay);
      this.schedulers.push(id);
    };

    // First strike after a gentle delay
    const firstDelay = 1500 + Math.random() * 2000;
    const id = setTimeout(scheduleNext, firstDelay);
    this.schedulers.push(id);
  }

  // ─── Schedule random chime strikes ────────────────────────────────────────

  private scheduleChimes(
    freqs: number[],
    intervalRange: [number, number],
    volumeRange: [number, number] = [0.5, 0.9]
  ) {
    const scheduleNext = () => {
      if (!this._enabled) return;
      const freq = pick(freqs);
      const buffer = this.chimeBuffers.get(freq);
      if (buffer) {
        const vol = volumeRange[0] + Math.random() * (volumeRange[1] - volumeRange[0]);
        this.playBuffer(buffer, vol);
      }
      const delay = intervalRange[0] + Math.random() * (intervalRange[1] - intervalRange[0]);
      const id = setTimeout(scheduleNext, delay);
      this.schedulers.push(id);
    };

    const firstDelay = 2000 + Math.random() * 3000;
    const id = setTimeout(scheduleNext, firstDelay);
    this.schedulers.push(id);
  }

  // ─── Soundscapes ──────────────────────────────────────────────────────────

  private startSoundscape(id: SoundscapeId) {
    switch (id) {
      case "home": this.buildHome(); break;
      case "breathe": this.buildBreathe(); break;
      case "wisdom": this.buildWisdom(); break;
      case "journal": this.buildJournal(); break;
      case "test": this.buildTest(); break;
      case "profile": this.buildProfile(); break;
    }
  }

  /** Home: warm, welcoming. Low singing bowls, very sparse, gentle air. */
  private buildHome() {
    this.startAmbient(350, 0.25); // Very quiet, deep air
    this.scheduleBowls(BOWL_FREQS_LOW, [8000, 18000], [0.55, 0.85]); // Low bowls, sparse
    this.scheduleChimes(CHIME_FREQS.slice(0, 3), [15000, 28000], [0.3, 0.5]); // Rare high sparkle
  }

  /** Breathe: ocean-like, spacious. Mid bowls + breathing modulation. */
  private buildBreathe() {
    this.startAmbient(300, 0.35); // Deeper, slightly louder air (like distant ocean)
    this.scheduleBowls(BOWL_FREQS_MID, [10000, 20000], [0.5, 0.8]); // Mid-range bowls
  }

  /** Wisdom: ethereal, spacious. Higher bowls, very sparse, zen-like. */
  private buildWisdom() {
    this.startAmbient(450, 0.18); // Very subtle, high-pass air
    this.scheduleBowls(BOWL_FREQS_MID, [12000, 25000], [0.6, 0.9]); // Sparse mid bowls
    this.scheduleChimes(CHIME_FREQS.slice(2), [18000, 35000], [0.25, 0.45]); // Very rare chimes
  }

  /** Journal: cozy, intimate. Low bowls + rain-like texture. */
  private buildJournal() {
    this.startAmbient(500, 0.4); // Slightly more present, like soft rain
    this.scheduleBowls(BOWL_FREQS_LOW, [10000, 22000], [0.5, 0.75]); // Warm low bowls
  }

  /** Test: deep, introspective. Very sparse, minimal. */
  private buildTest() {
    this.startAmbient(280, 0.2); // Deep, barely-there air
    this.scheduleBowls([220, 261.63, 293.66], [14000, 30000], [0.4, 0.7]); // Very sparse, deep
  }

  /** Profile: grounded, content. Warm low bowls, gentle air. */
  private buildProfile() {
    this.startAmbient(380, 0.3); // Warm air
    this.scheduleBowls(BOWL_FREQS_LOW, [12000, 24000], [0.55, 0.85]); // Low, warm bowls
    this.scheduleChimes([523.25, 587.33], [20000, 35000], [0.2, 0.35]); // Very rare, gentle
  }

  // ─── One-shot sounds ──────────────────────────────────────────────────────

  playChime(frequency = 528, duration = 3) {
    if (!this._enabled || !this.ctx) return;
    const ctx = this.ctx;

    // Find closest chime buffer, or render on-the-fly
    let buffer = this.chimeBuffers.get(frequency);
    if (!buffer) {
      // Find closest available
      let closest = CHIME_FREQS[0];
      let minDist = Infinity;
      for (const f of CHIME_FREQS) {
        if (Math.abs(f - frequency) < minDist) { minDist = Math.abs(f - frequency); closest = f; }
      }
      buffer = this.chimeBuffers.get(closest);
    }
    if (buffer) this.playBuffer(buffer, 0.7);
  }

  playSingingBowl(baseFreq = 396) {
    if (!this._enabled || !this.ctx) return;

    let buffer = this.bowlBuffers.get(baseFreq);
    if (!buffer) {
      // Find closest
      let closest = BOWL_FREQS_MID[0];
      let minDist = Infinity;
      const allFreqs = [...BOWL_FREQS_LOW, ...BOWL_FREQS_MID];
      for (const f of allFreqs) {
        if (Math.abs(f - baseFreq) < minDist) { minDist = Math.abs(f - baseFreq); closest = f; }
      }
      buffer = this.bowlBuffers.get(closest);
    }
    if (buffer) this.playBuffer(buffer, 0.85);
  }

  playTransition() {
    if (!this._enabled || !this.ctx || !this.whooshBuffer) return;
    this.playBuffer(this.whooshBuffer, 0.6);
  }

  playInhale() {
    if (!this._enabled || !this.ctx || !this.inhaleBuffer) return;
    this.playBuffer(this.inhaleBuffer, 0.8);
  }

  playExhale() {
    if (!this._enabled || !this.ctx || !this.exhaleBuffer) return;
    this.playBuffer(this.exhaleBuffer, 0.75);
  }

  dispose() {
    this.stopAll();
    setTimeout(() => {
      if (this.ctx) {
        this.ctx.close();
        this.ctx = null;
      }
      this.masterGain = null;
      this.reverb = null;
      this.reverbGain = null;
      this.dryGain = null;
      this.analyser = null;
      this.bowlBuffers.clear();
      this.chimeBuffers.clear();
      this.brownNoiseBuffer = null;
      this.whooshBuffer = null;
      this.inhaleBuffer = null;
      this.exhaleBuffer = null;
    }, 2000);
  }
}

export const audioEngine = new MeditationAudioEngine();
