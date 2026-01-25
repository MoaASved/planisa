import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration, generateWaveformHeights } from '@/lib/mediaUtils';

interface VoiceNotePlayerProps {
  audioSrc: string;
  duration: number;
  onDelete?: () => void;
  className?: string;
}

export function VoiceNotePlayer({ audioSrc, duration, onDelete, className }: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformHeights] = useState(() => generateWaveformHeights(40));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioSrc]);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const activeBarCount = Math.floor((progress / 100) * waveformHeights.length);

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 bg-secondary/30 rounded-2xl",
      className
    )}>
      {/* Play/Pause button - minimalist black */}
      <button
        onClick={togglePlayback}
        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 active:scale-95 transition-all"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
        ) : (
          <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />
        )}
      </button>

      {/* Waveform visualization */}
      <div className="flex items-center gap-[2px] flex-1 h-8">
        {waveformHeights.map((height, i) => (
          <div
            key={i}
            className={cn(
              "w-[3px] rounded-full transition-colors duration-150",
              i < activeBarCount 
                ? "bg-primary" 
                : "bg-muted-foreground/30"
            )}
            style={{ height: `${height}px` }}
          />
        ))}
      </div>

      {/* Duration display */}
      <span className="text-sm text-muted-foreground font-medium tabular-nums whitespace-nowrap">
        {formatDuration(isPlaying ? currentTime : duration)}
      </span>

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
