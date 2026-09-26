import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Sparkles, 
  FileAudio, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';

interface AudioUploadSectionProps {
  onAudioTranscribeAndAnalyze: (file: File) => Promise<void>;
  isProcessing: boolean;
  processingStage: string;
}

export const AudioUploadSection: React.FC<AudioUploadSectionProps> = ({
  onAudioTranscribeAndAnalyze,
  isProcessing,
  processingStage,
}) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/mp3');
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Audio Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clean up Blob URLs on unmount
  useEffect(() => {
    return () => {
      if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [audioBlobUrl]);

  // Handle file selection
  const processFile = (file: File) => {
    setErrorMsg(null);
    const validMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/wave',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
      'audio/webm',
      'audio/ogg',
      'audio/aac',
      'audio/flac',
    ];

    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['mp3', 'wav', 'm4a', 'webm', 'ogg', 'aac', 'flac', 'opus'];

    if (!validMimes.includes(file.type) && !validExtensions.includes(extension || '')) {
      setErrorMsg('Please select a supported audio format (MP3, WAV, M4A, WEBM, OGG, AAC, FLAC).');
      return;
    }

    // Up to 100MB
    if (file.size > 100 * 1024 * 1024) {
      setErrorMsg('Audio file is too large (maximum 100MB).');
      return;
    }

    setAudioFile(file);
    const detectedType = file.type || (extension ? `audio/${extension}` : 'audio/mp3');
    setAudioMimeType(detectedType);

    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    const newUrl = URL.createObjectURL(file);
    setAudioBlobUrl(newUrl);
  };

  // Recording controls
  const startRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const recordedFile = new File([audioBlob], `recorded-discussion-${Date.now()}.${mimeType === 'audio/webm' ? 'webm' : 'm4a'}`, {
          type: mimeType,
        });
        processFile(recordedFile);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(500);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMsg('Microphone access was denied or is unavailable. Please check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const clearAudio = () => {
    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    setAudioFile(null);
    setAudioBlobUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSubmit = async () => {
    if (!audioFile) return;
    await onAudioTranscribeAndAnalyze(audioFile);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Upload & Dropzone Area */}
      {!audioFile && !isRecording && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              processFile(e.dataTransfer.files[0]);
            }
          }}
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-950/30'
              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac,.flac"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white mb-1">
                Upload Discussion Audio File
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Supports MP3, WAV, M4A, WEBM, OGG, AAC, FLAC (up to 40MB).
                Gemini will transcribe multilingual speakers verbatim and convert it into the structured intelligence report.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
              >
                Choose Audio File
              </button>

              <span className="text-xs text-slate-500">or</span>

              <button
                type="button"
                onClick={startRecording}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-2"
              >
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                <span>Record via Microphone</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Recording Modal / Banner */}
      {isRecording && (
        <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Recording Discussion Live
            </span>
          </div>

          <div className="text-3xl font-mono font-extrabold text-white">
            {formatSeconds(recordingSeconds)}
          </div>

          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Speak in any mixture of languages (English, Japanese, Spanish, German, Hindi, French, etc.). Click finish when complete.
          </p>

          <button
            onClick={stopRecording}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 mx-auto"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Finish Recording</span>
          </button>
        </div>
      )}

      {/* Audio Loaded State: Player & Details */}
      {audioFile && audioBlobUrl && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          {/* File Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                  {audioFile.name}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="font-mono">{formatFileSize(audioFile.size)}</span>
                  <span>•</span>
                  <span className="uppercase">{audioMimeType.split('/')[1]}</span>
                </div>
              </div>
            </div>

            <button
              onClick={clearAudio}
              disabled={isProcessing}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Remove audio file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Audio Player */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <audio
              ref={audioRef}
              src={audioBlobUrl}
              onTimeUpdate={() => {
                if (audioRef.current) {
                  setCurrentTime(audioRef.current.currentTime);
                  setDuration(audioRef.current.duration || 0);
                }
              }}
              onEnded={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
              className="hidden"
            />

            <button
              onClick={togglePlayback}
              disabled={isProcessing}
              className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors flex-shrink-0 shadow-md shadow-indigo-600/30"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <div className="flex-1 space-y-1">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all"
                  style={{
                    width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>{formatSeconds(currentTime)}</span>
                <span>{formatSeconds(duration)}</span>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Browser downsamples to 16kHz & slices into payload-safe chunks (Zero Vercel 4.5MB payload errors).
              </span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isProcessing || !audioFile}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 transition-all ${
                isProcessing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-500 via-violet-600 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white shadow-indigo-500/25 active:scale-95'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{processingStage || 'Processing Audio & Discussion...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Transcribe & Analyze Discussion</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
