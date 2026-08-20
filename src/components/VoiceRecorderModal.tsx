import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, X, Check, Volume2 } from 'lucide-react';
import { saveAudioRecording } from '../services/storageService';

interface VoiceRecorderModalProps {
  surahNumber: number;
  surahName: string;
  verseNumber: number;
  verseArab: string;
  qariAudioUrl: string;
  onClose: () => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  surahNumber,
  surahName,
  verseNumber,
  verseArab,
  qariAudioUrl,
  onClose
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [isPlayingQari, setIsPlayingQari] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);
  const qariAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);

        // Save metadata
        saveAudioRecording({
          surahNumber,
          verseNumber,
          audioUrl: url,
          durationSeconds: recordingTime
        });
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Gagal mengaktifkan mikrofon. Mohon izinkan akses mikrofon browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePlayRecorded = () => {
    if (!recordedAudioRef.current) return;
    if (isPlayingRecorded) {
      recordedAudioRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      if (qariAudioRef.current) qariAudioRef.current.pause();
      setIsPlayingQari(false);
      recordedAudioRef.current.play();
      setIsPlayingRecorded(true);
    }
  };

  const togglePlayQari = () => {
    if (!qariAudioRef.current) return;
    if (isPlayingQari) {
      qariAudioRef.current.pause();
      setIsPlayingQari(false);
    } else {
      if (recordedAudioRef.current) recordedAudioRef.current.pause();
      setIsPlayingRecorded(false);
      qariAudioRef.current.play();
      setIsPlayingQari(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#15171E] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-[#1F2128]">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F2128]">
          <h2 className="text-base font-bold text-[#E2E2E2] flex items-center gap-2 font-serif-title">
            <Mic className="w-5 h-5 text-[#D4AF37]" />
            <span>Perekam Suara Hafalan</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded-xl text-[#8A8D9A] hover:text-[#E2E2E2]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verse preview */}
        <div className="text-center p-4 bg-[#0F1115] rounded-2xl border border-[#2A2D35] space-y-2">
          <span className="text-xs font-bold text-[#D4AF37]">
            QS. {surahName} Ayat {verseNumber}
          </span>
          <p className="font-arabic text-xl font-bold text-[#E2E2E2]" dir="rtl">
            {verseArab}
          </p>
        </div>

        {/* Hidden HTML5 Audio tags */}
        {recordedAudioUrl && (
          <audio
            ref={recordedAudioRef}
            src={recordedAudioUrl}
            onEnded={() => setIsPlayingRecorded(false)}
          />
        )}
        <audio
          ref={qariAudioRef}
          src={qariAudioUrl}
          onEnded={() => setIsPlayingQari(false)}
        />

        {/* Recording Controls */}
        <div className="flex flex-col items-center justify-center space-y-4 py-2">
          {isRecording ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center animate-pulse border-2 border-red-500">
                <Mic className="w-8 h-8" />
              </div>
              <div className="text-lg font-mono font-bold text-red-400">
                {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:
                {String(recordingTime % 60).padStart(2, '0')}
              </div>
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-600 text-white font-bold text-xs shadow-lg hover:bg-red-700 transition cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Hentikan Rekaman</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-[#D4AF37] text-[#0A0A0B] flex items-center justify-center shadow-lg hover:bg-[#B8962D] hover:scale-105 transition cursor-pointer"
                title="Mulai Rekam Suara Anda"
              >
                <Mic className="w-7 h-7" />
              </button>
              <span className="text-xs font-semibold text-[#8A8D9A]">
                {recordedAudioUrl ? 'Rekam Ulang' : 'Klik untuk rekam suara Anda'}
              </span>
            </div>
          )}
        </div>

        {/* Comparison Playback controls */}
        {recordedAudioUrl && !isRecording && (
          <div className="p-4 bg-[#0F1115] rounded-2xl border border-[#2A2D35] space-y-3">
            <h4 className="text-xs font-bold text-[#8A8D9A] uppercase tracking-wide">
              Bandingkan Hasil Hafalan:
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={togglePlayRecorded}
                className={`p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer border ${
                  isPlayingRecorded
                    ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37] shadow-md'
                    : 'bg-[#15171E] text-[#E2E2E2] border-[#2A2D35] hover:bg-[#1A1C23]'
                }`}
              >
                {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>Dengar Suara Saya</span>
              </button>

              <button
                onClick={togglePlayQari}
                className={`p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer border ${
                  isPlayingQari
                    ? 'bg-[#D4AF37] text-[#0A0A0B] border-[#D4AF37] shadow-md'
                    : 'bg-[#15171E] text-[#D4AF37] border-[#2A2D35] hover:bg-[#1A1C23]'
                }`}
              >
                {isPlayingQari ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>Dengar Audio Qari</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#D4AF37] text-[#0A0A0B] hover:bg-[#B8962D] shadow cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
