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
  const initialLoad = useRef(true);

  // Persist audio preference
  useEffect(() => {
    const saved = localStorage.getItem("puth-audio-enabled");
    const savedVol = localStorage.getItem("puth-audio-volume");
    if (saved === "true") {
      audioEngine.enable();
      setEnabled(true);
      setAnalyserNode(audioEngine.analyserNode);
    }
    if (savedVol) {
      const v = parseFloat(savedVol);
      audioEngine.setVolume(v);
      setVolumeState(v);
    }
    initialLoad.current = false;
  }, []);

  const toggle = useCallback(() => {
    if (enabled) {
      audioEngine.disable();
      setEnabled(false);
      setAnalyserNode(null);
      localStorage.setItem("puth-audio-enabled", "false");
    } else {
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
