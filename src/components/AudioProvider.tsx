"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { audioEngine, type SoundscapeId } from "@/lib/audioEngine";

interface AudioContextType {
  enabled: boolean;
  volume: number;
  currentSoundscape: SoundscapeId;
  toggle: () => void;
  setVolume: (v: number) => void;
  switchSoundscape: (id: SoundscapeId) => void;
  playChime: (freq?: number, dur?: number) => void;
  playSingingBowl: (freq?: number) => void;
  playTransition: () => void;
  playInhale: () => void;
  playExhale: () => void;
  analyserNode: AnalyserNode | null;
}

const AudioCtx = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolumeState] = useState(0.35);
  const [currentSoundscape, setCurrentSoundscape] = useState<SoundscapeId>("silence");
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  // Track preference — but do NOT auto-enable audio (browser autoplay policy)
  const pendingEnable = useRef(false);
  const listenerAttached = useRef(false);

  // Load saved preferences on mount (but don't enable audio yet)
  useEffect(() => {
    const savedVol = localStorage.getItem("puth-audio-volume");
    if (savedVol) {
      const v = parseFloat(savedVol);
      audioEngine.setVolume(v);
      setVolumeState(v);
    }

    // If user had audio enabled last time, defer enabling to first user gesture
    const saved = localStorage.getItem("puth-audio-enabled");
    if (saved === "true") {
      pendingEnable.current = true;

      // Set up a one-time listener to enable audio on first user interaction
      if (!listenerAttached.current) {
        listenerAttached.current = true;
        const enableOnGesture = () => {
          if (pendingEnable.current) {
            pendingEnable.current = false;
            audioEngine.enable();
            setEnabled(true);
            setAnalyserNode(audioEngine.analyserNode);
            // Resume current soundscape if one was set
            const savedSoundscape = localStorage.getItem("puth-audio-soundscape") as SoundscapeId | null;
            if (savedSoundscape && savedSoundscape !== "silence") {
              setCurrentSoundscape(savedSoundscape);
              audioEngine.switchSoundscape(savedSoundscape);
            }
          }
          // Remove listener after first gesture
          document.removeEventListener("click", enableOnGesture);
          document.removeEventListener("keydown", enableOnGesture);
          document.removeEventListener("touchstart", enableOnGesture);
          listenerAttached.current = false;
        };

        document.addEventListener("click", enableOnGesture, { once: false });
        document.addEventListener("keydown", enableOnGesture, { once: false });
        document.addEventListener("touchstart", enableOnGesture, { once: false });
      }
    }
  }, []);

  const toggle = useCallback(() => {
    if (enabled) {
      audioEngine.disable();
      setEnabled(false);
      setAnalyserNode(null);
      localStorage.setItem("puth-audio-enabled", "false");
      pendingEnable.current = false;
    } else {
      // This is always a user gesture (click on toggle button)
      audioEngine.enable();
      setEnabled(true);
      setAnalyserNode(audioEngine.analyserNode);
      localStorage.setItem("puth-audio-enabled", "true");
      // Resume current soundscape if one was set
      if (currentSoundscape !== "silence") {
        audioEngine.switchSoundscape(currentSoundscape);
      }
    }
  }, [enabled, currentSoundscape]);

  const setVolume = useCallback((v: number) => {
    audioEngine.setVolume(v);
    setVolumeState(v);
    localStorage.setItem("puth-audio-volume", v.toString());
  }, []);

  const switchSoundscape = useCallback((id: SoundscapeId) => {
    setCurrentSoundscape(id);
    localStorage.setItem("puth-audio-soundscape", id);
    audioEngine.switchSoundscape(id);
  }, []);

  const playChime = useCallback((freq?: number, dur?: number) => audioEngine.playChime(freq, dur), []);
  const playSingingBowl = useCallback((freq?: number) => audioEngine.playSingingBowl(freq), []);
  const playTransition = useCallback(() => audioEngine.playTransition(), []);
  const playInhale = useCallback(() => audioEngine.playInhale(), []);
  const playExhale = useCallback(() => audioEngine.playExhale(), []);

  return (
    <AudioCtx.Provider
      value={{
        enabled,
        volume,
        currentSoundscape,
        toggle,
        setVolume,
        switchSoundscape,
        playChime,
        playSingingBowl,
        playTransition,
        playInhale,
        playExhale,
        analyserNode,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}
