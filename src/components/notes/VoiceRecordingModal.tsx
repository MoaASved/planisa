import { useState, useEffect, useRef } from 'react';
import { Mic, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/mediaUtils';

interface VoiceRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (audioData: string, duration: number) => void;
}

export function VoiceRecordingModal({ isOpen, onClose, onRecordingComplete }: VoiceRecordingModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      startRecording();
    }
    
    return () => {
      stopRecording(false);
    };
  }, [isOpen]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
      
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Microphone access denied');
    }
  };

  const stopRecording = (save: boolean) => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      if (save) {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { 
            type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
          });
          
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            onRecordingComplete(base64, elapsed);
          };
          reader.readAsDataURL(blob);
        };
      }
    }
    
    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    setElapsed(0);
  };

  const handleCancel = () => {
    stopRecording(false);
    onClose();
  };

  const handleDone = () => {
    stopRecording(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/50 flex items-center justify-center animate-fade-in">
      <div 
        className="bg-card rounded-3xl p-8 w-72 flex flex-col items-center gap-6 shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pulsing microphone */}
        <div className={cn(
          "w-20 h-20 rounded-full bg-primary flex items-center justify-center transition-all",
          isRecording && "animate-pulse"
        )}>
          <Mic className="w-8 h-8 text-primary-foreground" />
        </div>
        
        {/* Status and timer */}
        <div className="text-center">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <>
              <p className="text-lg font-medium text-foreground">
                {isRecording ? 'Recording...' : 'Preparing...'}
              </p>
              <p className="text-3xl font-bold tabular-nums mt-2 text-foreground">
                {formatDuration(elapsed)}
              </p>
            </>
          )}
        </div>
        
        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleDone}
            disabled={!isRecording || elapsed < 1}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Check className="w-4 h-4" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
