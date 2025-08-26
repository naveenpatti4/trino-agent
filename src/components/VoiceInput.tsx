"use client";

import { useEffect } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import clsx from "clsx";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

interface VoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function VoiceInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Type your message...",
}: VoiceInputProps) {
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    resetTranscript,
    browserSupportsContinuousListening,
  } = useSpeechRecognition();

  // While listening, mirror transcript into the input
  useEffect(() => {
    if (listening && transcript !== value) {
      onChange(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, listening]);

  const start = async () => {
    if (!browserSupportsSpeechRecognition || listening) return;
    try {
      resetTranscript();
      onChange("");
      // Toggle mode: continuous when supported; single-utterance otherwise
      await SpeechRecognition.startListening({
        continuous: !!browserSupportsContinuousListening,
        language: "en-US",
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Failed to start speech recognition:", err);
    }
  };

  const stop = async () => {
    try {
      await SpeechRecognition.stopListening();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Failed to stop speech recognition:", err);
    }
  };

  const toggle = () => {
    if (!browserSupportsSpeechRecognition || disabled) return;
    if (listening) void stop();
    else void start();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const voiceSupported = browserSupportsSpeechRecognition && isMicrophoneAvailable !== false;

  return (
    <div className="flex items-center gap-4 max-w-6xl mx-auto">
      <div className="flex-1 relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-slate-300 px-5 py-4 pr-14 focus:ring-2 focus:ring-slate-400 outline-none text-base"
          placeholder={listening ? "Listening... speak now" : placeholder}
          disabled={disabled}
        />
        {voiceSupported && (
          <button
            onClick={toggle}
            disabled={disabled}
            className={clsx(
              "absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200",
              disabled && "opacity-50 cursor-not-allowed",
              !disabled && listening && "bg-red-100 text-red-600 animate-pulse",
              !disabled && !listening && "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
            title={listening ? "Stop recording" : "Start voice input"}
          >
            {listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>
        )}
        {!browserSupportsSpeechRecognition && (
          <p className="mt-2 text-sm text-slate-500">
            Voice input isn’t supported in this browser. Try Chrome for the best experience.
          </p>
        )}
        {browserSupportsSpeechRecognition && isMicrophoneAvailable === false && (
          <p className="mt-2 text-sm text-orange-600">
            Microphone access is blocked. Allow mic access in your browser settings (and macOS System Settings → Privacy & Security → Microphone).
          </p>
        )}
      </div>
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className={clsx(
          "inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-4 text-white font-medium text-base transition-opacity",
          (disabled || !value.trim()) && "opacity-50 cursor-not-allowed"
        )}
      >
        <Send className="size-5" />
        Send
      </button>
    </div>
  );
}
 