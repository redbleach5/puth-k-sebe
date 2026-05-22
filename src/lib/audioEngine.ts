// ─── Meditation Audio Engine v2 ──────────────────────────────────────────────
// Beautiful, spacious, musical soundscapes.
// Pentatonic scales, convolution reverb, soft pads, singing bowls, gentle rain.

export type SoundscapeId = "home" | "breathe" | "wisdom" | "journal" | "test" | "profile" | "silence";

// ─── Musical scales (pentatonic — never dissonant) ───────────────────────────

const PENTATONIC_C = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
const PENTATONIC_LOW = [130.81, 146.83, 164.81, 196.0, 220.0, 261.63];
const PENTATONIC_HIGH = [523.25, 587.33, 659.25, 783.99, 880.0];

// ─── Utility: pick random from array ────────────────────────────────────────

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Utility: generate impulse response for convolution reverb ───────────────

function generateReverbIR(ctx: BaseAudioContext, duration: number, decay: number): AudioBuffer {
  const length = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      // Exponential decay with some early reflections
      const t = i / ctx.sampleRate;
      const earlyRef = t < 0.03 ? 1.5 : 1;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, decay) * earlyRef;
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
  private activeNodes: { stoppable: (OscillatorNode | AudioBufferSourceNode)[]; disconnectable: AudioNode[] } | null = null;
  private _volume = 0.4;
  private _enabled = false;
  private fadeTimeout: ReturnType<typeof setTimeout> | null = null;
  private schedulers: ReturnType<typeof setInterval>[] = [];

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
      this.reverb.buffer = generateReverbIR(ctx, 3.5, 2.5);

      this.reverbGain = ctx.createGain();
      this.reverbGain.gain.value = 0.45; // Wet signal

      this.dryGain = ctx.createGain();
      this.dryGain.gain.value = 0.7; // Dry signal

      this.reverb.connect(this.reverbGain);
      this.reverbGain.connect(this.masterGain);
      this.dryGain.connect(this.masterGain);
    }

    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.88;
      this.masterGain.connect(this.analyser);
    }
  }

  disable() {
    this._enabled = false;
    this.fadeOutAndStop();
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

  // ─── Routing helper ───────────────────────────────────────────────────────

  private routeToOutput(node: AudioNode) {
    if (!this.reverb || !this.dryGain) return;
    node.connect(this.dryGain);
    node.connect(this.reverb);
  }

  // ─── Fade management ──────────────────────────────────────────────────────

  private fadeOutAndStop() {
    if (this.activeNodes) {
      const { stoppable, disconnectable } = this.activeNodes;
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      // Fade out master briefly
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0, now, 0.6);
      }

      setTimeout(() => {
        stoppable.forEach((n) => { try { n.stop(); } catch {} });
        disconnectable.forEach((n) => { try { n.disconnect(); } catch {} });
        this.activeNodes = null;
        // Restore master gain
        if (this.masterGain) {
          this.masterGain.gain.setTargetAtTime(this._volume, ctx.currentTime, 0.1);
        }
      }, 2000);
    }

    // Clear schedulers
    this.schedulers.forEach((id) => clearInterval(id));
    this.schedulers = [];
  }

  private crossfadeTo(id: SoundscapeId) {
    this.fadeOutAndStop();
    this.fadeTimeout = setTimeout(() => {
      this.startSoundscape(id);
    }, 800);
  }

  private startSoundscape(id: SoundscapeId) {
    const ctx = this.ensureContext();
    const stoppable: (OscillatorNode | AudioBufferSourceNode)[] = [];
    const disconnectable: AudioNode[] = [];

    switch (id) {
      case "home": this.buildHome(ctx, stoppable, disconnectable); break;
      case "breathe": this.buildBreathe(ctx, stoppable, disconnectable); break;
      case "wisdom": this.buildWisdom(ctx, stoppable, disconnectable); break;
      case "journal": this.buildJournal(ctx, stoppable, disconnectable); break;
      case "test": this.buildTest(ctx, stoppable, disconnectable); break;
      case "profile": this.buildProfile(ctx, stoppable, disconnectable); break;
    }

    this.activeNodes = { stoppable, disconnectable };
  }

  // ─── Sound building blocks ────────────────────────────────────────────────

  /** Create a soft pad: layered detuned oscillators through a low-pass filter */
  private createSoftPad(
    ctx: AudioContext,
    freqs: number[],
    volume: number,
    filterFreq: number,
    stoppable: (OscillatorNode | AudioBufferSourceNode)[],
    disconnectable: AudioNode[]
  ): GainNode {
    const padGain = ctx.createGain();
    padGain.gain.value = 0;
    // Slow fade in
    padGain.gain.setTargetAtTime(volume, ctx.currentTime, 2);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.5;
    disconnectable.push(filter);

    filter.connect(padGain);
    this.routeToOutput(padGain);
    disconnectable.push(padGain);

    for (const freq of freqs) {
      // Main tone
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(filter);
      osc.start();
      stoppable.push(osc);

      // Slightly detuned copy for warmth (chorus)
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = freq * 1.002; // Slight detune
      const g2 = ctx.createGain();
      g2.gain.value = 0.5;
      osc2.connect(g2);
      g2.connect(filter);
      osc2.start();
      stoppable.push(osc2);
      disconnectable.push(g2);

      // Quiet harmonic an octave up
      const osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.value = freq * 2;
      const g3 = ctx.createGain();
      g3.gain.value = 0.12;
      osc3.connect(g3);
      g3.connect(filter);
      osc3.start();
      stoppable.push(osc3);
      disconnectable.push(g3);
    }

    // Slow filter sweep for movement
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.04 + Math.random() * 0.03;
    lfoGain.gain.value = filterFreq * 0.15;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    stoppable.push(lfo);
    disconnectable.push(lfoGain);

    return padGain;
  }

  /** Create gentle rain-like noise */
  private createRain(
    ctx: AudioContext,
    volume: number,
    filterFreq: number,
    stoppable: (OscillatorNode | AudioBufferSourceNode)[],
    disconnectable: AudioNode[]
  ): GainNode {
    const bufLen = ctx.sampleRate * 6;
    const buf = ctx.createBuffer(2, bufLen, ctx.sampleRate);

    // Generate pink noise per channel
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufLen; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.3;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(volume, ctx.currentTime, 2);

    src.connect(filter);
    filter.connect(gain);
    this.routeToOutput(gain);
    src.start();
    stoppable.push(src);
    disconnectable.push(filter, gain);

    return gain;
  }

  /** Schedule occasional soft chime notes from a scale */
  private scheduleChimes(
    ctx: AudioContext,
    scale: number[],
    intervalMs: [number, number], // min, max random interval
    volume: number,
    stoppable: (OscillatorNode | AudioBufferSourceNode)[],
    disconnectable: AudioNode[]
  ) {
    const playChime = () => {
      if (!this._enabled) return;
      const freq = pick(scale);
      const now = ctx.currentTime;

      // Bell-like tone with inharmonic partials
      const partials = [
        { ratio: 1, vol: volume },
        { ratio: 2.756, vol: volume * 0.35 },
        { ratio: 5.404, vol: volume * 0.12 },
      ];

      for (const p of partials) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq * p.ratio;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(p.vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 5);

        osc.connect(gain);
        this.routeToOutput(gain);
        osc.start(now);
        osc.stop(now + 5.5);
      }
    };

    const scheduleNext = () => {
      const delay = intervalMs[0] + Math.random() * (intervalMs[1] - intervalMs[0]);
      const id = setTimeout(() => {
        playChime();
        scheduleNext();
      }, delay);
      // Store as pseudo-interval for cleanup
      this.schedulers.push(id as unknown as ReturnType<typeof setInterval>);
    };

    // First chime after a short delay
    scheduleNext();
  }

  // ─── Soundscapes ──────────────────────────────────────────────────────────

  /** Home: warm open pad with occasional high chimes */
  private buildHome(ctx: AudioContext, stoppable: (OscillatorNode | AudioBufferSourceNode)[], disconnectable: AudioNode[]) {
    // Warm C-pentatonic pad
    this.createSoftPad(ctx, [130.81, 196.0, 261.63], 0.08, 800, stoppable, disconnectable);
    // Very soft rain texture
    this.createRain(ctx, 0.012, 1200, stoppable, disconnectable);
    // Occasional high pentatonic chimes
    this.scheduleChimes(ctx, PENTATONIC_HIGH, [6000, 14000], 0.04, stoppable, disconnectable);
  }

  /** Breathe: ocean-like swells with deep pad */
  private buildBreathe(ctx: AudioContext, stoppable: (OscillatorNode | AudioBufferSourceNode)[], disconnectable: AudioNode[]) {
    // Deep A-pentatonic pad
    this.createSoftPad(ctx, [110.0, 164.81, 220.0], 0.09, 600, stoppable, disconnectable);
    // Rain as ocean texture
    this.createRain(ctx, 0.02, 800, stoppable, disconnectable);

    // Breathing LFO on the rain filter — slow swell
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = "lowpass";
    rainFilter.frequency.value = 600;
    rainFilter.Q.value = 0.5;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.15; // ~6.6s cycle — breathing
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(rainFilter.frequency);
    lfo.start();
    stoppable.push(lfo);
    disconnectable.push(rainFilter, lfoGain);
  }

  /** Wisdom: ethereal singing bowls, sparse and spacious */
  private buildWisdom(ctx: AudioContext, stoppable: (OscillatorNode | AudioBufferSourceNode)[], disconnectable: AudioNode[]) {
    // High ethereal pad
    this.createSoftPad(ctx, [261.63, 392.0, 523.25], 0.05, 1200, stoppable, disconnectable);
    // Very sparse singing bowl chimes
    this.scheduleChimes(ctx, PENTATONIC_C, [8000, 18000], 0.055, stoppable, disconnectable);
  }

  /** Journal: soft rain with gentle pad underneath */
  private buildJournal(ctx: AudioContext, stoppable: (OscillatorNode | AudioBufferSourceNode)[], disconnectable: AudioNode[]) {
    // Gentle G-pentatonic pad
    this.createSoftPad(ctx, [196.0, 261.63, 293.66], 0.055, 900, stoppable, disconnectable);
    // More prominent rain
    this.createRain(ctx, 0.03, 2500, stoppable, disconnectable);
    // Very sparse, low chimes
    this.scheduleChimes(ctx, PENTATONIC_LOW, [10000, 20000], 0.03, stoppable, disconnectable);
  }

  /** Test: deep, mysterious, introspective */
  private buildTest(ctx: AudioContext, stoppable: (OscillatorNode | AudioBufferSourceNode)[], disconnectable: AudioNode[]) {
    // Deep D-pentatonic pad
    this.createSoftPad(ctx, [146.83, 196.0, 220.0], 0.07, 500, stoppable, disconnectable);
    // Distant rain/wind
    this.createRain(ctx, 0.015, 500, stoppable, disconnectable);
    // Mysterious sparse chimes
    this.scheduleChimes(ctx, [293.66, 392.0, 440.0, 523.25], [7000, 16000], 0.035, stoppable, disconnectable);
  }

  /** Profile: warm, content, grounded */
  private buildProfile(ctx: AudioContext, stoppable: (OscillatorNode | AudioBufferSourceNode)[], disconnectable: AudioNode[]) {
    // Grounding G-pentatonic pad
    this.createSoftPad(ctx, [98.0, 146.83, 196.0], 0.07, 700, stoppable, disconnectable);
    // Very light rain
    this.createRain(ctx, 0.01, 1800, stoppable, disconnectable);
    // Warm low chimes
    this.scheduleChimes(ctx, PENTATONIC_LOW, [9000, 18000], 0.035, stoppable, disconnectable);
  }

  // ─── One-shot sounds ──────────────────────────────────────────────────────

  playChime(frequency = 528, duration = 3) {
    if (!this._enabled || !this.ctx || !this.reverb) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const partials = [
      { ratio: 1, vol: 0.07 },
      { ratio: 2.756, vol: 0.025 },
      { ratio: 5.404, vol: 0.008 },
    ];

    for (const p of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency * p.ratio;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(p.vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.dryGain!);
      gain.connect(this.reverb!);
      osc.start(now);
      osc.stop(now + duration + 0.5);
    }
  }

  playSingingBowl(baseFreq = 396) {
    if (!this._enabled || !this.ctx || !this.reverb) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Real singing bowl: inharmonic partials with long decay through reverb
    const partials = [
      { ratio: 1, vol: 0.08, decay: 6 },
      { ratio: 2.756, vol: 0.04, decay: 4.5 },
      { ratio: 4.567, vol: 0.02, decay: 3.5 },
      { ratio: 6.724, vol: 0.008, decay: 2.5 },
    ];

    for (const p of partials) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = baseFreq * p.ratio;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(p.vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.dryGain!);
      gain.connect(this.reverb!);
      osc.start(now);
      osc.stop(now + p.decay + 1);
    }
  }

  playTransition() {
    if (!this._enabled || !this.ctx || !this.reverb) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Soft ascending fifth interval through reverb
    const notes = [261.63, 392.0]; // C4 → G4
    for (const freq of notes) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2);

      osc.connect(gain);
      gain.connect(this.dryGain!);
      gain.connect(this.reverb!);
      osc.start(now);
      osc.stop(now + 2.5);
    }
  }

  playInhale() {
    if (!this._enabled || !this.ctx || !this.reverb) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Ascending tone: C4 → G4
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(196, now); // G3
    osc.frequency.linearRampToValueAtTime(293.66, now + 3); // D4

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.5);
    gain.gain.setValueAtTime(0.04, now + 2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.dryGain!);
    gain.connect(this.reverb!);
    osc.start(now);
    osc.stop(now + 4);
  }

  playExhale() {
    if (!this._enabled || !this.ctx || !this.reverb) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Descending tone: G4 → C4
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(293.66, now); // D4
    osc.frequency.linearRampToValueAtTime(196, now + 4); // G3

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.3);
    gain.gain.setValueAtTime(0.04, now + 3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.dryGain!);
    gain.connect(this.reverb!);
    osc.start(now);
    osc.stop(now + 5);
  }

  dispose() {
    this.fadeOutAndStop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
    this.reverb = null;
    this.reverbGain = null;
    this.dryGain = null;
    this.analyser = null;
  }
}

export const audioEngine = new MeditationAudioEngine();
