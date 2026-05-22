// ─── Meditation Audio Engine ─────────────────────────────────────────────────
// All sounds are synthesized in real-time using Web Audio API.
// No audio files needed — everything is generated from oscillators, noise, and filters.
// This ensures zero copyright issues and minimal bundle size.

export type SoundscapeId = "home" | "breathe" | "wisdom" | "journal" | "test" | "profile" | "silence";

interface ActiveNodes {
  oscillators: OscillatorNode[];
  gains: GainNode[];
  noiseSource: AudioBufferSourceNode | null;
  lfo: OscillatorNode | null;
  masterGain: GainNode;
}

class MeditationAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentSoundscape: SoundscapeId = "silence";
  private activeNodes: ActiveNodes | null = null;
  private _volume = 0.35;
  private _enabled = false;
  private fadeTimeout: ReturnType<typeof setTimeout> | null = null;
  private analyser: AnalyserNode | null = null;

  get enabled() { return this._enabled; }
  get volume() { return this._volume; }
  get analyserNode() { return this.analyser; }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
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
    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.85;
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
      this.masterGain.gain.setTargetAtTime(this._volume, this.ensureContext().currentTime, 0.1);
    }
  }

  switchSoundscape(id: SoundscapeId) {
    if (id === this.currentSoundscape) return;
    this.currentSoundscape = id;
    if (!this._enabled) return;
    this.crossfadeTo(id);
  }

  // ─── Sound synthesis methods ──────────────────────────────────────────────

  private fadeOutAndStop() {
    if (this.activeNodes) {
      const { masterGain, gains, oscillators, noiseSource, lfo } = this.activeNodes;
      const ctx = this.ensureContext();
      const now = ctx.currentTime;

      masterGain.gain.setTargetAtTime(0, now, 0.5);

      setTimeout(() => {
        oscillators.forEach((o) => { try { o.stop(); } catch {} });
        if (noiseSource) { try { noiseSource.stop(); } catch {} }
        if (lfo) { try { lfo.stop(); } catch {} }
        gains.forEach((g) => g.disconnect());
        masterGain.disconnect();
        this.activeNodes = null;
      }, 1500);
    }
  }

  private crossfadeTo(id: SoundscapeId) {
    // Fade out current
    this.fadeOutAndStop();

    // Fade in new after a brief pause
    this.fadeTimeout = setTimeout(() => {
      this.startSoundscape(id);
    }, 600);
  }

  private startSoundscape(id: SoundscapeId) {
    const ctx = this.ensureContext();
    const sceneGain = ctx.createGain();
    sceneGain.gain.value = 0;
    sceneGain.connect(this.masterGain!);

    const nodes: ActiveNodes = {
      oscillators: [],
      gains: [],
      noiseSource: null,
      lfo: null,
      masterGain: sceneGain,
    };

    switch (id) {
      case "home":
        this.createHomeSoundscape(ctx, sceneGain, nodes);
        break;
      case "breathe":
        this.createBreatheSoundscape(ctx, sceneGain, nodes);
        break;
      case "wisdom":
        this.createWisdomSoundscape(ctx, sceneGain, nodes);
        break;
      case "journal":
        this.createJournalSoundscape(ctx, sceneGain, nodes);
        break;
      case "test":
        this.createTestSoundscape(ctx, sceneGain, nodes);
        break;
      case "profile":
        this.createProfileSoundscape(ctx, sceneGain, nodes);
        break;
      default:
        break;
    }

    this.activeNodes = nodes;

    // Fade in
    sceneGain.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
  }

  // ─── Home: Warm ambient drone with soft harmonics ─────────────────────────

  private createHomeSoundscape(ctx: AudioContext, gain: GainNode, nodes: ActiveNodes) {
    // Base drone - warm low tone
    const base = this.createOsc(ctx, gain, nodes, 110, "sine", 0.12);
    // Fifth harmony
    this.createOsc(ctx, gain, nodes, 165, "sine", 0.06);
    // Octave shimmer
    this.createOsc(ctx, gain, nodes, 220, "sine", 0.03);
    // Slow beat frequency (binaural-like)
    this.createOsc(ctx, gain, nodes, 111.5, "sine", 0.08);

    // LFO for gentle volume swell
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.08; // Very slow
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(base.gain);
    lfo.start();
    nodes.lfo = lfo;

    // Soft filtered noise (air/wind texture)
    this.createFilteredNoise(ctx, gain, nodes, 800, 0.015);
  }

  // ─── Breathe: Rhythmic swell matching breathing patterns ──────────────────

  private createBreatheSoundscape(ctx: AudioContext, gain: GainNode, nodes: ActiveNodes) {
    // Ocean-like drone
    const base = this.createOsc(ctx, gain, nodes, 82.5, "sine", 0.1);
    this.createOsc(ctx, gain, nodes, 123.75, "sine", 0.05);
    this.createOsc(ctx, gain, nodes, 55, "sine", 0.07);

    // Breathing LFO - mimics inhale/exhale cycle (~6 seconds)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.16; // ~6 second cycle
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(base.gain);
    lfo.start();
    nodes.lfo = lfo;

    // Filtered noise for ocean texture
    this.createFilteredNoise(ctx, gain, nodes, 400, 0.025);
  }

  // ─── Wisdom: Ethereal high tones, singing bowl-like ───────────────────────

  private createWisdomSoundscape(ctx: AudioContext, gain: GainNode, nodes: ActiveNodes) {
    // Singing bowl fundamentals
    this.createOsc(ctx, gain, nodes, 528, "sine", 0.04); // "healing" frequency
    this.createOsc(ctx, gain, nodes, 396, "sine", 0.03);
    this.createOsc(ctx, gain, nodes, 660, "sine", 0.02);
    // Subtle shimmer
    this.createOsc(ctx, gain, nodes, 1056, "sine", 0.008);

    // Very slow modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    nodes.lfo = lfo;

    // Airy texture
    this.createFilteredNoise(ctx, gain, nodes, 2000, 0.01);
  }

  // ─── Journal: Rain-like gentle texture ────────────────────────────────────

  private createJournalSoundscape(ctx: AudioContext, gain: GainNode, nodes: ActiveNodes) {
    // Soft warm base
    this.createOsc(ctx, gain, nodes, 130.81, "sine", 0.06); // C3
    this.createOsc(ctx, gain, nodes, 196, "sine", 0.03); // G3

    // Rain noise - bandpass filtered
    this.createFilteredNoise(ctx, gain, nodes, 3000, 0.03);
    // Additional low rain rumble
    this.createFilteredNoise(ctx, gain, nodes, 200, 0.015);
  }

  // ─── Test: Mystical, introspective ────────────────────────────────────────

  private createTestSoundscape(ctx: AudioContext, gain: GainNode, nodes: ActiveNodes) {
    // Deep introspective drone
    this.createOsc(ctx, gain, nodes, 73.42, "sine", 0.09); // D2
    this.createOsc(ctx, gain, nodes, 110, "sine", 0.05); // A2
    // Mysterious interval
    this.createOsc(ctx, gain, nodes, 146.83, "sine", 0.03); // D3
    // Slightly detuned for mystery
    this.createOsc(ctx, gain, nodes, 147.8, "sine", 0.02);

    // Slow evolving modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.04;
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    nodes.lfo = lfo;

    // Subtle wind
    this.createFilteredNoise(ctx, gain, nodes, 600, 0.012);
  }

  // ─── Profile: Warm, grounding, content ────────────────────────────────────

  private createProfileSoundscape(ctx: AudioContext, gain: GainNode, nodes: ActiveNodes) {
    // Grounding low tone
    this.createOsc(ctx, gain, nodes, 98, "sine", 0.08); // G2
    this.createOsc(ctx, gain, nodes, 146.83, "sine", 0.04); // D3
    this.createOsc(ctx, gain, nodes, 196, "sine", 0.025); // G3

    // Gentle warmth
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    nodes.lfo = lfo;

    this.createFilteredNoise(ctx, gain, nodes, 500, 0.01);
  }

  // ─── Utility: Create oscillator with gain ─────────────────────────────────

  private createOsc(
    ctx: AudioContext,
    destination: AudioNode,
    nodes: ActiveNodes,
    freq: number,
    type: OscillatorType,
    volume: number
  ): { osc: OscillatorNode; gain: GainNode } {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gainNode.gain.value = volume;

    osc.connect(gainNode);
    gainNode.connect(destination);
    osc.start();

    nodes.oscillators.push(osc);
    nodes.gains.push(gainNode);

    return { osc, gain: gainNode };
  }

  // ─── Utility: Create filtered white noise ─────────────────────────────────

  private createFilteredNoise(
    ctx: AudioContext,
    destination: AudioNode,
    nodes: ActiveNodes,
    filterFreq: number,
    volume: number
  ) {
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate pink-ish noise (more natural than white)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.7;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(destination);
    source.start();

    nodes.noiseSource = source;
    nodes.gains.push(gainNode);
  }

  // ─── One-shot sounds for interactions ─────────────────────────────────────

  playChime(frequency = 528, duration = 2.5) {
    if (!this._enabled || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  playSingingBowl(baseFreq = 396) {
    if (!this._enabled || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Fundamental + harmonics, like a real singing bowl
    const harmonics = [1, 2.76, 4.72];
    const volumes = [0.06, 0.025, 0.012];

    harmonics.forEach((h, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = baseFreq * h;
      gain.gain.setValueAtTime(volumes[i], now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 4);
    });
  }

  playTransition() {
    if (!this._enabled || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Soft ascending tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 1.5);
  }

  playInhale() {
    if (!this._enabled || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.linearRampToValueAtTime(220, now + 3);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 3.5);
  }

  playExhale() {
    if (!this._enabled || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(165, now + 4);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 4.5);
  }

  dispose() {
    this.fadeOutAndStop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.masterGain = null;
    this.analyser = null;
  }
}

// Singleton
export const audioEngine = new MeditationAudioEngine();
