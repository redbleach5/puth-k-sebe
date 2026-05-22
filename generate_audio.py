#!/usr/bin/env python3
"""
Generate beautiful ambient meditation music loops.
Uses FM synthesis, physical modeling (Karplus-Strong), convolution reverb,
and careful musical composition for genuinely pleasant, relaxing sound.
"""

import numpy as np
from scipy.signal import fftconvolve
from scipy.io import wavfile
import os

SR = 44100  # Sample rate

# ─── Utility functions ────────────────────────────────────────────────────────

def normalize(audio, peak=-1.0):
    """Normalize audio to peak dB."""
    mx = np.max(np.abs(audio))
    if mx == 0:
        return audio
    target = 10 ** (peak / 20)
    return audio * (target / mx)

def fade_in(audio, seconds):
    n = int(SR * seconds)
    fade = np.linspace(0, 1, min(n, len(audio)))
    audio[:len(fade)] *= fade
    return audio

def fade_out(audio, seconds):
    n = int(SR * seconds)
    fade = np.linspace(1, 0, min(n, len(audio)))
    audio[-len(fade):] *= fade
    return audio

def crossfade_len(seconds):
    return int(SR * seconds)

def generate_impulse_response(duration=4.0, decay=3.0, sr=SR):
    """Generate a realistic reverb impulse response."""
    length = int(sr * duration)
    ir = np.zeros(length)
    
    # Early reflections (discrete echoes simulating room walls)
    reflections = [
        (0.012, 0.7), (0.019, 0.55), (0.028, 0.45), (0.042, 0.35),
        (0.058, 0.28), (0.077, 0.22), (0.099, 0.17), (0.128, 0.12),
        (0.162, 0.09), (0.205, 0.065), (0.258, 0.045), (0.323, 0.03),
    ]
    
    for t, amp in reflections:
        idx = int(t * sr)
        if idx < length:
            ir[idx] = amp
    
    # Diffuse tail
    for i in range(length):
        t = i / sr
        # Exponential decay with slight noise modulation
        env = np.exp(-t * decay)
        ir[i] += (np.random.randn() * 0.15 + ir[i]) * env
    
    # Smooth the IR
    ir = np.convolve(ir, np.ones(50) / 50, mode='same')
    
    # Normalize
    mx = np.max(np.abs(ir))
    if mx > 0:
        ir /= mx
    
    return ir

# ─── FM Synthesis ─────────────────────────────────────────────────────────────

def fm_synth(freq, duration, mod_ratio=2.0, mod_index=1.5, attack=0.05, decay_time=3.0, sr=SR):
    """
    FM synthesis — creates rich, complex timbres like real bells/bowls.
    Much more realistic than simple additive sine waves.
    """
    n = int(sr * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    
    # Modulator with its own envelope
    mod_env = np.exp(-t / (decay_time * 0.6))
    modulator = np.sin(2 * np.pi * freq * mod_ratio * t) * mod_index * mod_env
    
    # Carrier with frequency modulation
    carrier = np.sin(2 * np.pi * freq * t + modulator)
    
    # Amplitude envelope: soft attack + exponential decay
    attack_samples = int(sr * attack)
    env = np.ones(n)
    env[:attack_samples] = np.linspace(0, 1, attack_samples) ** 2  # Quadratic attack
    env[attack_samples:] = np.exp(-(t[attack_samples:] - attack) / (decay_time * 0.7))
    
    return carrier * env

def singing_bowl(freq, duration=6.0, sr=SR):
    """
    Realistic singing bowl using multiple FM operators + inharmonic partials.
    Based on physical modeling of real Tibetan singing bowls.
    """
    n = int(sr * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    
    # Real singing bowl has inharmonic partials with beating
    partials = [
        # (freq_ratio, amp, decay_rate, fm_mod_index, attack_time)
        (1.0,   1.0,  duration * 0.85, 0.8,  0.02),  # Fundamental
        (2.76,  0.40, duration * 0.60, 1.2,  0.01),  # 1st inharmonic
        (4.72,  0.15, duration * 0.42, 0.5,  0.008), # 2nd inharmonic
        (6.85,  0.06, duration * 0.28, 0.3,  0.005), # 3rd inharmonic
    ]
    
    signal = np.zeros(n)
    
    for ratio, amp, decay, fm_idx, attack_t in partials:
        p_freq = freq * ratio
        
        # FM synthesis for this partial
        modulator = np.sin(2 * np.pi * p_freq * 2.0 * t) * fm_idx
        modulator *= np.exp(-t / (decay * 0.4))
        
        tone = np.sin(2 * np.pi * p_freq * t + modulator)
        
        # Add slight detuning for natural beating
        detune = 0.3 + ratio * 0.15  # Higher partials beat more
        tone2 = np.sin(2 * np.pi * (p_freq + detune) * t + modulator * 0.6)
        
        # Envelope
        attack_s = int(sr * attack_t)
        env = np.ones(n)
        env[:attack_s] = np.linspace(0, 1, attack_s) ** 1.5
        env[attack_s:] = np.exp(-(t[attack_s:] - attack_t) / (decay * 0.5))
        
        signal += (tone * 0.7 + tone2 * 0.3) * amp * env
    
    return signal

def soft_pad(freq, duration, sr=SR, mod_index=0.3):
    """
    Warm, evolving pad sound using FM + chorus (detuned copies).
    Very different from a static sine oscillator drone.
    """
    n = int(sr * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    
    signal = np.zeros(n)
    
    # Multiple detuned copies for chorus richness
    detunes = [-1.5, -0.5, 0, 0.5, 1.5]  # Hz detuning
    
    for d in detunes:
        f = freq + d
        # Gentle FM modulation for warmth
        mod = np.sin(2 * np.pi * f * 0.5 * t) * mod_index
        # LFO on amplitude for subtle movement
        lfo = 0.85 + 0.15 * np.sin(2 * np.pi * (0.05 + abs(d) * 0.02) * t)
        tone = np.sin(2 * np.pi * f * t + mod) * lfo
        signal += tone
    
    signal /= len(detunes)
    
    # Soft envelope
    signal = fade_in(signal, 2.0)
    signal = fade_out(signal, 2.0)
    
    return signal

# ─── Karplus-Strong (plucked string) ─────────────────────────────────────────

def karplus_strong(freq, duration=3.0, sr=SR, decay=0.996, brightness=0.5):
    """
    Physical modeling of a plucked string. Sounds like a real harp or guitar.
    Much more realistic than any oscillator-based approach.
    """
    n = int(sr * duration)
    period = int(sr / freq)
    
    # Initial excitation: filtered noise (brightness controls harmonic content)
    excitation = np.random.randn(period)
    # Low-pass filter on excitation to control brightness
    from scipy.signal import lfilter
    b = [1 - brightness, brightness]
    a = [1]
    excitation = lfilter(b, a, excitation)
    
    # Extend through the delay line with feedback
    signal = np.zeros(n)
    buffer = np.zeros(period)
    buffer[:len(excitation)] = excitation
    
    for i in range(n):
        idx = i % period
        signal[i] = buffer[idx]
        # Average adjacent samples (low-pass) + decay — this is the Karplus-Strong core
        buffer[idx] = decay * 0.5 * (buffer[idx] + buffer[(idx + 1) % period])
    
    return signal

# ─── Nature sounds ────────────────────────────────────────────────────────────

def generate_rain(duration, intensity=0.3, sr=SR):
    """Realistic rain sound using shaped noise."""
    n = int(sr * duration)
    
    # Start with white noise
    noise = np.random.randn(n) * 0.02 * intensity
    
    # Shape with multiple resonant filters to sound like rain on different surfaces
    from scipy.signal import lfilter, bilinear
    
    # Simulate rain with band-pass characteristics
    # Heavy rain has more mid-frequency content
    b1, a1 = bilinear([1], [1, 1/(2*np.pi*3000), 1/(2*np.pi*3000)**2], sr)
    b2, a2 = bilinear([1], [1, 1/(2*np.pi*800), 1/(2*np.pi*800)**2], sr)
    
    rain1 = lfilter(b1, a1, noise)
    rain2 = lfilter(b2, a2, noise) * 0.3
    
    # Add occasional droplet "pings" 
    signal = rain1 + rain2
    n_drops = int(duration * intensity * 8)
    for _ in range(n_drops):
        pos = np.random.randint(0, n - 500)
        drop_freq = 2000 + np.random.rand() * 4000
        drop_dur = int(0.02 * sr + np.random.rand() * 0.05 * sr)
        t_drop = np.linspace(0, drop_dur / sr, drop_dur)
        ping = np.sin(2 * np.pi * drop_freq * t_drop) * np.exp(-t_drop * 40) * 0.003 * intensity
        end = min(pos + drop_dur, n)
        signal[pos:end] += ping[:end-pos]
    
    # Crossfade for seamless loop
    xf = crossfade_len(1.0)
    signal[:xf] = signal[:xf] * np.linspace(0, 1, xf) + signal[-xf:] * np.linspace(1, 0, xf)
    
    return signal

def generate_stream(duration, sr=SR):
    """Gentle stream/babbling brook sound."""
    n = int(sr * duration)
    
    # Base: filtered brown noise
    noise = np.random.randn(n) * 0.015
    # Brown noise (integrate white noise)
    brown = np.cumsum(noise)
    brown = brown - np.linspace(brown[0], brown[-1], n)  # Remove DC drift
    
    # Bandpass to get that watery character
    from scipy.signal import lfilter, bilinear
    b, a = bilinear([1, 0], [1, 1/(2*np.pi*1500), 1/(2*np.pi*1500)**2], sr)
    stream = lfilter(b, a, brown)
    
    # Modulate with slow LFO for babbling variation
    t = np.linspace(0, duration, n, endpoint=False)
    lfo = 0.7 + 0.3 * np.sin(2 * np.pi * 0.15 * t) * np.sin(2 * np.pi * 0.07 * t)
    stream *= lfo
    
    # Crossfade for loop
    xf = crossfade_len(1.5)
    stream[:xf] = stream[:xf] * np.linspace(0, 1, xf) + stream[-xf:] * np.linspace(1, 0, xf)
    
    return stream * 0.08

# ─── Musical composition helpers ──────────────────────────────────────────────

# Pentatonic scale frequencies (C major pentatonic — always consonant)
C_PENTA_OCT3 = [130.81, 146.83, 164.81, 196.00, 220.00]  # C3 D3 E3 G3 A3
C_PENTA_OCT4 = [261.63, 293.66, 329.63, 392.00, 440.00]  # C4 D4 E4 G4 A4
C_PENTA_OCT5 = [523.25, 587.33, 659.25, 783.99, 880.00]  # C5 D5 E5 G5 A5

# Chord voicings (root position + inversions)
CHORDS = {
    'C':  [130.81, 164.81, 196.00],
    'Dm': [146.83, 174.61, 220.00],
    'Em': [164.81, 196.00, 246.94],
    'F':  [174.61, 220.00, 261.63],
    'G':  [196.00, 246.94, 293.66],
    'Am': [220.00, 261.63, 329.63],
}

# Ambient chord progressions (each is a loop)
PROGRESSIONS = {
    'warm':     ['C', 'Am', 'F', 'G'],   # Warm, welcoming
    'deep':     ['Am', 'F', 'C', 'G'],   # Deep, introspective
    'ethereal': ['C', 'Em', 'Am', 'F'],  # Ethereal, spacious
    'gentle':   ['F', 'C', 'G', 'Am'],   # Gentle, flowing
    'ground':   ['C', 'F', 'Am', 'G'],   # Grounding, content
}

def ambient_chord_loop(chord_names, loop_duration=60, pad_volume=0.04, sr=SR):
    """
    Create an ambient chord progression pad.
    Uses FM pad synthesis with slow evolving harmonics.
    """
    n = int(sr * loop_duration)
    signal = np.zeros(n)
    chord_dur = loop_duration / len(chord_names)
    
    for ci, cname in enumerate(chord_names):
        freqs = CHORDS[cname]
        start = int(ci * chord_dur * sr)
        end = int((ci + 1) * chord_dur * sr)
        dur = end - start
        
        for freq in freqs:
            # Pad at octave up for air
            pad = soft_pad(freq * 2, chord_dur + 2, sr, mod_index=0.2) * pad_volume
            # Low fundamental
            pad_low = soft_pad(freq, chord_dur + 2, sr, mod_index=0.15) * pad_volume * 0.5
            
            pad_total = (pad + pad_low)[:dur]
            signal[start:start + len(pad_total)] += pad_total
    
    return signal

def sparse_melody(freqs, loop_duration=60, note_interval_range=(5, 12), volume=0.06, sr=SR):
    """
    Sparse, gentle melody notes — like drops of water, very occasional.
    Uses FM synthesis for beautiful, bell-like tones.
    """
    n = int(sr * loop_duration)
    signal = np.zeros(n)
    
    pos = int(sr * 3)  # Start after 3 seconds
    
    while pos < n - int(sr * 4):
        freq = freqs[np.random.randint(len(freqs))]
        
        # FM bell tone
        note = fm_synth(freq, 5.0, mod_ratio=2.5, mod_index=1.8, attack=0.01, decay_time=3.5) * volume
        
        # Sometimes a singing bowl instead
        if np.random.rand() < 0.3:
            note = singing_bowl(freq / 2, duration=7.0) * volume * 1.5
        
        end = min(pos + len(note), n)
        signal[pos:end] += note[:end - pos]
        
        # Next note after long silence
        gap = np.random.uniform(note_interval_range[0], note_interval_range[1])
        pos += int(gap * sr)
    
    return signal

def sparse_plucks(freqs, loop_duration=60, note_interval_range=(6, 15), volume=0.04, sr=SR):
    """
    Sparse harp-like plucked string notes using Karplus-Strong.
    Very gentle and organic sounding.
    """
    n = int(sr * loop_duration)
    signal = np.zeros(n)
    
    pos = int(sr * 4)
    
    while pos < n - int(sr * 4):
        freq = freqs[np.random.randint(len(freqs))]
        
        note = karplus_strong(freq * 2, duration=3.5, decay=0.994, brightness=0.3) * volume
        
        end = min(pos + len(note), n)
        signal[pos:end] += note[:end - pos]
        
        gap = np.random.uniform(note_interval_range[0], note_interval_range[1])
        pos += int(gap * sr)
    
    return signal

# ─── Compose full tracks ─────────────────────────────────────────────────────

def compose_track(name, chord_prog, melody_freqs, has_rain=False, has_stream=False, 
                  pad_vol=0.04, melody_vol=0.06, pluck_vol=0.04, duration=60, sr=SR):
    """Compose a full ambient meditation track."""
    print(f"  Composing '{name}' ({duration}s)...")
    
    n = int(sr * duration)
    
    # 1. Pad chord progression
    print(f"    Generating pad...")
    pad = ambient_chord_loop(chord_prog, duration, pad_volume=pad_vol, sr=sr)
    
    # 2. Sparse melody (bowl/chime tones)
    print(f"    Generating melody...")
    melody = sparse_melody(melody_freqs, duration, volume=melody_vol, sr=sr)
    
    # 3. Sparse plucks
    print(f"    Generating plucks...")
    plucks = sparse_plucks(melody_freqs, duration, volume=pluck_vol, sr=sr)
    
    # 4. Nature sounds (optional)
    nature = np.zeros(n)
    if has_rain:
        print(f"    Generating rain...")
        nature += generate_rain(duration, intensity=0.2, sr=sr)
    if has_stream:
        print(f"    Generating stream...")
        nature += generate_stream(duration, sr=sr)
    
    # Mix
    print(f"    Mixing...")
    mix = pad[:n] + melody[:n] + plucks[:n] + nature[:n]
    
    # Apply reverb
    print(f"    Applying reverb...")
    ir = generate_impulse_response(duration=4.0, decay=3.5, sr=sr)
    
    # Wet/dry mix
    wet = fftconvolve(mix, ir, mode='same') * 0.4
    mix = mix * 0.7 + wet
    
    # Normalize
    mix = normalize(mix, -3.0)
    
    # Final fade in/out for seamless loop audition
    mix = fade_in(mix, 1.0)
    mix = fade_out(mix, 1.0)
    
    # Make stereo (slight difference between channels for spaciousness)
    left = mix + np.roll(mix, int(0.015 * sr)) * 0.15
    right = mix + np.roll(mix, -int(0.015 * sr)) * 0.15
    
    left = normalize(left, -3.0)
    right = normalize(right, -3.0)
    
    stereo = np.column_stack([left, right])
    
    return stereo.astype(np.float32)

# ─── Main: Generate all tracks ───────────────────────────────────────────────

def main():
    output_dir = "/home/z/my-project/public/audio"
    os.makedirs(output_dir, exist_ok=True)
    
    DURATION = 90  # seconds per track (1.5 min loop)
    
    tracks = {
        # name: (chord_progression, melody_freqs, has_rain, has_stream, pad_vol, melody_vol, pluck_vol)
        "home": (
            PROGRESSIONS['warm'],
            C_PENTA_OCT4 + C_PENTA_OCT5[:3],
            False, False, 0.035, 0.055, 0.035
        ),
        "breathe": (
            PROGRESSIONS['deep'],
            C_PENTA_OCT3 + C_PENTA_OCT4[:2],
            False, True, 0.04, 0.05, 0.03
        ),
        "wisdom": (
            PROGRESSIONS['ethereal'],
            C_PENTA_OCT5,
            False, False, 0.025, 0.065, 0.02
        ),
        "journal": (
            PROGRESSIONS['gentle'],
            C_PENTA_OCT4,
            True, False, 0.03, 0.05, 0.04
        ),
        "test": (
            PROGRESSIONS['deep'],
            C_PENTA_OCT3[1:] + C_PENTA_OCT4[:3],
            False, False, 0.03, 0.045, 0.025
        ),
        "profile": (
            PROGRESSIONS['ground'],
            C_PENTA_OCT3 + C_PENTA_OCT4[:2],
            False, True, 0.035, 0.05, 0.035
        ),
    }
    
    for name, (chords, freqs, rain, stream, pv, mv, plv) in tracks.items():
        print(f"\n{'='*50}")
        print(f"Track: {name}")
        print(f"{'='*50}")
        
        audio = compose_track(
            name, chords, freqs,
            has_rain=rain, has_stream=stream,
            pad_vol=pv, melody_vol=mv, pluck_vol=plv,
            duration=DURATION
        )
        
        # Save as WAV first
        wav_path = os.path.join(output_dir, f"{name}.wav")
        wavfile.write(wav_path, SR, audio)
        print(f"  Saved WAV: {wav_path}")
    
    print("\n✅ All tracks generated!")

if __name__ == "__main__":
    main()
