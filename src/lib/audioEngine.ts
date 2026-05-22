// ─── Meditation Audio Engine v4 ──────────────────────────────────────────────
// Plays pre-rendered ambient music MP3 files — real music, not synthesis.
// Each screen has its own track. Smooth crossfade between tracks.

export type SoundscapeId = "home" | "breathe" | "wisdom" | "journal" | "test" | "profile" | "silence";

// Map soundscape to audio file path
const SOUNDSCAPE_FILES: Record<SoundscapeId, string | null> = {
  home: "/audio/home.mp3",
  breathe: "/audio/breathe.mp3",
  wisdom: "/audio/wisdom.mp3",
  journal: "/audio/journal.mp3",
  test: "/audio/test.mp3",
  profile: "/audio/profile.mp3",
  silence: null,
};

class MeditationAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private currentSoundscape: SoundscapeId = "silence";
  private _volume = 0.4;
  private _enabled = false;

  // Current playback
  private currentSource: AudioBufferSourceNode | null = null;
  private currentGain: GainNode | null = null;

  // Incoming (crossfading in)
  private incomingSource: AudioBufferSourceNode | null = null;
  private incomingGain: GainNode | null = null;

  // Cached decoded audio buffers
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private loadingBuffers: Set<string> = new Set();

  // Fade timeouts
  private fadeTimeout: ReturnType<typeof setTimeout> | null = null;

  get enabled() { return this._enabled; }
  get volume() { return this._volume; }
  get analyserNode() { return this.analyser; }

  // ─── Context setup ────────────────────────────────────────────────────────

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        // AudioContext not available (SSR or unsupported browser)
        throw new Error("AudioContext not available");
      }
    }
    if (this.ctx.state === "suspended") {
      // resume() must be called from a user gesture.
      // If we're not in a gesture context, this will fail silently.
      this.ctx.resume().catch(() => {
        console.warn("AudioContext resume blocked by browser autoplay policy. Will resume on next user interaction.");
      });
    }
    return this.ctx;
  }

  enable() {
    this._enabled = true;
    try {
      const ctx = this.ensureContext();

      if (!this.masterGain) {
        this.masterGain = ctx.createGain();
        this.masterGain.gain.value = this._volume;
        this.masterGain.connect(ctx.destination);
      }

      if (!this.analyser) {
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.88;
        this.masterGain.connect(this.analyser);
      }

      // Start playing current soundscape if one was set
      if (this.currentSoundscape !== "silence") {
        this.startPlayback(this.currentSoundscape);
      }
    } catch {
      console.warn("AudioContext could not be created. Audio will not be available.");
      this._enabled = false;
    }
  }

  disable() {
    this._enabled = false;
    this.fadeOutCurrent();
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this._volume, this.ensureContext().currentTime, 0.15);
    }
  }

  switchSoundscape(id: SoundscapeId) {
    if (id === this.currentSoundscape) return;
    const prevSoundscape = this.currentSoundscape;
    this.currentSoundscape = id;

    if (!this._enabled) return;

    if (prevSoundscape === "silence") {
      // Just start new
      this.startPlayback(id);
    } else {
      // Crossfade
      this.crossfadeTo(id);
    }
  }

  // ─── Buffer loading ───────────────────────────────────────────────────────

  private async loadBuffer(path: string): Promise<AudioBuffer> {
    // Check cache
    const cached = this.bufferCache.get(path);
    if (cached) return cached;

    // Check if already loading
    if (this.loadingBuffers.has(path)) {
      // Wait for it
      return new Promise((resolve) => {
        const check = () => {
          const buf = this.bufferCache.get(path);
          if (buf) resolve(buf);
          else setTimeout(check, 100);
        };
        check();
      });
    }

    this.loadingBuffers.add(path);

    try {
      const ctx = this.ensureContext();
      const response = await fetch(path);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(path, audioBuffer);
      this.loadingBuffers.delete(path);
      return audioBuffer;
    } catch (err) {
      this.loadingBuffers.delete(path);
      console.warn("Failed to load audio:", path, err);
      throw err;
    }
  }

  // ─── Playback ─────────────────────────────────────────────────────────────

  private async startPlayback(id: SoundscapeId) {
    const path = SOUNDSCAPE_FILES[id];
    if (!path) return;

    try {
      const buffer = await this.loadBuffer(path);
      if (!this._enabled) return; // Was disabled while loading

      const ctx = this.ensureContext();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = 0;
      // Fade in over 2 seconds
      gain.gain.setTargetAtTime(1, ctx.currentTime, 1.0);

      source.connect(gain);
      gain.connect(this.masterGain!);
      source.start();

      // Stop any previous playback
      this.stopSource(this.currentSource, this.currentGain);

      this.currentSource = source;
      this.currentGain = gain;

      // Handle source end (shouldn't happen with loop, but just in case)
      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
          this.currentGain = null;
        }
        try { gain.disconnect(); } catch {}
      };
    } catch (err) {
      console.warn("Audio playback failed:", err);
    }
  }

  private async crossfadeTo(id: SoundscapeId) {
    const path = SOUNDSCAPE_FILES[id];
    if (!path) {
      this.fadeOutCurrent();
      return;
    }

    // Clear any pending crossfade
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }

    try {
      const buffer = await this.loadBuffer(path);
      if (!this._enabled) return;

      const ctx = this.ensureContext();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = 0;
      // Fade in over 3 seconds
      gain.gain.setTargetAtTime(1, ctx.currentTime, 1.5);

      source.connect(gain);
      gain.connect(this.masterGain!);
      source.start();

      // Fade out current
      if (this.currentGain) {
        this.currentGain.gain.setTargetAtTime(0, ctx.currentTime, 1.2);
      }
      if (this.currentSource) {
        const oldSource = this.currentSource;
        const oldGain = this.currentGain;
        // Stop old after fade
        this.fadeTimeout = setTimeout(() => {
          try { oldSource.stop(); } catch {}
          try { oldGain?.disconnect(); } catch {}
        }, 4000);
      }

      this.currentSource = source;
      this.currentGain = gain;

      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
          this.currentGain = null;
        }
        try { gain.disconnect(); } catch {}
      };
    } catch (err) {
      console.warn("Audio crossfade failed:", err);
    }
  }

  private fadeOutCurrent() {
    if (this.currentGain && this.ctx) {
      this.currentGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.8);
    }
    if (this.currentSource) {
      const source = this.currentSource;
      const gain = this.currentGain;
      setTimeout(() => {
        try { source.stop(); } catch {}
        try { gain?.disconnect(); } catch {}
      }, 3000);
    }
    this.currentSource = null;
    this.currentGain = null;
  }

  private stopSource(source: AudioBufferSourceNode | null, gain: GainNode | null) {
    if (gain && this.ctx) {
      gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    }
    if (source) {
      setTimeout(() => {
        try { source.stop(); } catch {}
        try { gain?.disconnect(); } catch {}
      }, 1500);
    }
  }

  // ─── One-shot sounds (kept for UI interactions) ───────────────────────────
  // These are short synthesized sounds for clicks/interactions
  // They're brief enough that synthesis is fine

  playChime(frequency = 528, duration = 2) {
    if (!this._enabled || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = frequency;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  playSingingBowl(baseFreq = 396) {
    // Same as chime but longer and softer
    this.playChime(baseFreq, 3);
  }

  playTransition() {
    if (!this._enabled || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Soft ascending interval
    [261.63, 392.0].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.03, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.1);
      osc.stop(now + 2);
    });
  }

  playInhale() {
    if (!this._enabled || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(196, now);
    osc.frequency.linearRampToValueAtTime(293.66, now + 3);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.5);
    gain.gain.setValueAtTime(0.04, now + 2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 4);
  }

  playExhale() {
    if (!this._enabled || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(293.66, now);
    osc.frequency.linearRampToValueAtTime(196, now + 4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.3);
    gain.gain.setValueAtTime(0.035, now + 3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 5);
  }

  dispose() {
    if (this.fadeTimeout) clearTimeout(this.fadeTimeout);
    this.fadeOutCurrent();
    setTimeout(() => {
      if (this.ctx) {
        this.ctx.close();
        this.ctx = null;
      }
      this.masterGain = null;
      this.analyser = null;
      this.bufferCache.clear();
    }, 3500);
  }
}

export const audioEngine = new MeditationAudioEngine();
