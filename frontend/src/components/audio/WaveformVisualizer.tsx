import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Volume2, 
  VolumeX,
  Scissors,
  Maximize2
} from 'lucide-react';
import { formatAudioTime, SilenceRegion } from '../../services/audio/audioEngine';

interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  peaks: number[];
  duration: number;
  startTime: number;
  endTime: number;
  onRangeChange?: (start: number, end: number) => void;
  silenceRegions?: SilenceRegion[];
  showSelection?: boolean;
  accentColor?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioBuffer,
  peaks,
  duration,
  startTime,
  endTime,
  onRangeChange,
  silenceRegions = [],
  showSelection = true,
  accentColor = '#8b5cf6'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(startTime || 0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);

  // Dragging states
  const [isDraggingStart, setIsDraggingStart] = useState<boolean>(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState<boolean>(false);

  // Audio Playback Nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackStartOffsetRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize or Stop Audio Playback
  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback(() => {
    if (!audioBuffer) return;
    stopAudio();

    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioCtxClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const ctx = audioCtxRef.current;
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = isMuted ? 0 : volume;
    gainNodeRef.current = gainNode;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    const startOffset = currentTime >= duration ? (startTime || 0) : currentTime;
    const playDuration = Math.max(0.1, (endTime && endTime > startOffset ? endTime : duration) - startOffset);

    source.start(0, startOffset, playDuration);
    sourceNodeRef.current = source;

    playbackStartTimeRef.current = ctx.currentTime;
    playbackStartOffsetRef.current = startOffset;
    setIsPlaying(true);

    const updatePlayhead = () => {
      if (!audioCtxRef.current || !sourceNodeRef.current) return;
      const elapsed = audioCtxRef.current.currentTime - playbackStartTimeRef.current;
      const cur = playbackStartOffsetRef.current + elapsed;

      if (cur >= (endTime && endTime > startOffset ? endTime : duration)) {
        setCurrentTime(startTime || 0);
        stopAudio();
      } else {
        setCurrentTime(cur);
        animationFrameRef.current = requestAnimationFrame(updatePlayhead);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updatePlayhead);

    source.onended = () => {
      setIsPlaying(false);
    };
  }, [audioBuffer, currentTime, duration, endTime, isMuted, startTime, stopAudio, volume]);

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  };

  // Draw Waveform on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background Grid
    ctx.fillStyle = '#0f172a'; // Slate-900
    ctx.fillRect(0, 0, w, h);

    // Center Baseline
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    const dataPeaks = peaks.length > 0 ? peaks : Array.from({ length: 150 }, () => Math.random() * 0.5 + 0.1);
    const numBars = dataPeaks.length;
    const barWidth = Math.max(2, (w / numBars) - 1.5);

    // Draw Waveform Bars
    for (let i = 0; i < numBars; i++) {
      const peakVal = dataPeaks[i] || 0.1;
      const barHeight = Math.max(4, peakVal * (h * 0.82));
      const x = i * (w / numBars);
      const y = (h - barHeight) / 2;
      const barTime = (i / numBars) * duration;

      // Color active range vs outside selection
      const inSelection = showSelection && barTime >= startTime && barTime <= endTime;
      const isPast = barTime <= currentTime;

      if (inSelection) {
        ctx.fillStyle = isPast ? '#38bdf8' : accentColor;
      } else {
        ctx.fillStyle = isPast ? '#64748b' : '#334155';
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1.5);
      ctx.fill();
    }

    // Draw Silence Regions Overlay
    if (silenceRegions.length > 0 && duration > 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'; // Red overlay
      for (const s of silenceRegions) {
        const sx = (s.start / duration) * w;
        const sw = ((s.end - s.start) / duration) * w;
        ctx.fillRect(sx, 0, sw, h);
      }
    }

    // Draw Selection Region Shading
    if (showSelection && duration > 0) {
      const startX = (startTime / duration) * w;
      const endX = (endTime / duration) * w;

      // Left Dim Area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, startX, h);

      // Right Dim Area
      ctx.fillRect(endX, 0, w - endX, h);

      // Selection Highlight Border
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, 0, endX - startX, h);

      // Left Handle Bar
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(startX - 3, 0, 6, h);

      // Right Handle Bar
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(endX - 3, 0, 6, h);
    }

    // Draw Current Playhead
    if (duration > 0) {
      const playheadX = (currentTime / duration) * w;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();

      // Playhead Top Triangle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(playheadX - 5, 0);
      ctx.lineTo(playheadX + 5, 0);
      ctx.lineTo(playheadX, 8);
      ctx.closePath();
      ctx.fill();
    }
  }, [accentColor, currentTime, duration, endTime, peaks, showSelection, silenceRegions, startTime, zoomLevel]);

  // Handle canvas click to seek or drag
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = Math.max(0, Math.min(1, clickX / rect.width));
    const clickTime = clickPercent * duration;

    const startX = (startTime / duration) * rect.width;
    const endX = (endTime / duration) * rect.width;

    if (Math.abs(clickX - startX) < 12) {
      setIsDraggingStart(true);
    } else if (Math.abs(clickX - endX) < 12) {
      setIsDraggingEnd(true);
    } else {
      setCurrentTime(clickTime);
      if (isPlaying) {
        stopAudio();
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingStart && !isDraggingEnd) return;
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0 || !onRangeChange) return;

    const rect = canvas.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const movePercent = Math.max(0, Math.min(1, moveX / rect.width));
    const newTime = movePercent * duration;

    if (isDraggingStart) {
      const safeStart = Math.min(newTime, endTime - 0.2);
      onRangeChange(Math.max(0, safeStart), endTime);
    } else if (isDraggingEnd) {
      const safeEnd = Math.max(newTime, startTime + 0.2);
      onRangeChange(startTime, Math.min(duration, safeEnd));
    }
  };

  const handleMouseUp = () => {
    setIsDraggingStart(false);
    setIsDraggingEnd(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl space-y-3 select-none"
    >
      {/* Waveform Canvas Viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
        <canvas
          ref={canvasRef}
          width={900}
          height={160}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          className="w-full h-36 sm:h-40 cursor-pointer block"
        />

        {/* Time Markers Header */}
        <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none">
          <span>{formatAudioTime(0)}</span>
          <span>{formatAudioTime(duration * 0.25)}</span>
          <span>{formatAudioTime(duration * 0.5)}</span>
          <span>{formatAudioTime(duration * 0.75)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls & Timestamp Display */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        
        {/* Left: Play/Pause, Rewind, Timestamps */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-700 text-white font-bold shadow-md hover:shadow-brand-500/20 transition-all flex items-center justify-center"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <button
            onClick={() => {
              setCurrentTime(startTime || 0);
              if (isPlaying) stopAudio();
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset to selection start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="flex items-baseline gap-1.5 font-mono text-xs">
            <span className="font-extrabold text-white text-sm">{formatAudioTime(currentTime)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{formatAudioTime(duration)}</span>
          </div>
        </div>

        {/* Center: Selected Range Badge */}
        {showSelection && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-mono">
            <Scissors className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-slate-300">Selected:</span>
            <span className="text-white font-bold">{formatAudioTime(startTime)} → {formatAudioTime(endTime)}</span>
            <span className="text-brand-400 font-extrabold">({formatAudioTime(Math.max(0, endTime - startTime))})</span>
          </div>
        )}

        {/* Right: Volume & Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
              if (gainNodeRef.current) gainNodeRef.current.gain.value = parseFloat(e.target.value);
            }}
            className="w-16 sm:w-20 accent-brand-500"
          />
        </div>

      </div>
    </div>
  );
};
