"use client";

import { useRef, useEffect, useCallback } from "react";
import { useAudio } from "@/components/AudioProvider";

/** Minimalist waveform visualizer — breathes with the audio.
 *  Shows a smooth organic wave even when audio is off (using a gentle sine),
 *  and morphs into real audio data when enabled.
 */
export function WaveformVisualizer({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const { enabled, analyserNode } = useAudio();
  const timeRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    timeRef.current += 0.02;

    if (enabled && analyserNode) {
      // Real audio data
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteTimeDomainData(dataArray);

      // Draw organic wave from real audio
      ctx.beginPath();
      ctx.strokeStyle = "rgba(201, 169, 110, 0.35)";
      ctx.lineWidth = 1.5;

      const sliceWidth = w / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();

      // Second wave — slightly offset, more transparent
      ctx.beginPath();
      ctx.strokeStyle = "rgba(122, 139, 111, 0.2)";
      ctx.lineWidth = 1;

      x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2 + 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();
    } else {
      // Simulated gentle wave when audio is off
      const t = timeRef.current;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(201, 169, 110, 0.12)";
      ctx.lineWidth = 1;

      for (let x = 0; x < w; x++) {
        const y =
          h / 2 +
          Math.sin(x * 0.02 + t) * 3 +
          Math.sin(x * 0.01 + t * 0.7) * 2;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [enabled, analyserNode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(2, 2);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
