"use client";

import React from "react";
import { Mic, MicOff, Volume2, VolumeX, Globe } from "lucide-react";

interface AudioWaveIndicatorProps {
  isListening: boolean;
  onToggleListening: () => void;
  lang: string;
  onChangeLang: (lang: string) => void;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  voiceEnabled: boolean;
  audioDurationSec?: number;
}

export function AudioWaveIndicator({
  isListening,
  onToggleListening,
  lang,
  onChangeLang,
  isSpeaking,
  onToggleSpeech,
  voiceEnabled,
  audioDurationSec = 0,
}: AudioWaveIndicatorProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
      {/* Mic Action & Status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleListening}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            isListening
              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 animate-pulse"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              <span>Speak Answer (Voice)</span>
            </>
          )}
        </button>

        {/* Audio Wave Visualizer */}
        {isListening ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 border border-rose-800/50 rounded-lg">
            <div className="h-4 w-1 bg-rose-400 rounded-full wave-bar-1"></div>
            <div className="h-6 w-1 bg-rose-400 rounded-full wave-bar-2"></div>
            <div className="h-5 w-1 bg-rose-400 rounded-full wave-bar-3"></div>
            <div className="h-7 w-1 bg-rose-400 rounded-full wave-bar-4"></div>
            <div className="h-3 w-1 bg-rose-400 rounded-full wave-bar-5"></div>
            <span className="text-[11px] text-rose-300 font-mono font-medium ml-1.5">
              Listening ({formatTime(audioDurationSec)})
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click speak or type directly below
          </span>
        )}
      </div>

      {/* Language & Voice Controls */}
      <div className="flex items-center gap-2.5">
        {/* Accent Selector */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          <Globe className="h-3.5 w-3.5 text-indigo-400" />
          <select
            value={lang}
            onChange={(e) => onChangeLang(e.target.value)}
            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="en-IN" className="bg-slate-900 text-slate-200">
              English (India) - en-IN
            </option>
            <option value="hi-IN" className="bg-slate-900 text-slate-200">
              Hindi (India) - hi-IN
            </option>
            <option value="en-US" className="bg-slate-900 text-slate-200">
              English (US) - en-US
            </option>
          </select>
        </div>

        {/* AI Voice Toggle */}
        <button
          type="button"
          onClick={onToggleSpeech}
          title={voiceEnabled ? "Mute AI Question Reader" : "Enable AI Question Audio"}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            voiceEnabled
              ? "bg-slate-800 text-indigo-300 border-indigo-500/30 hover:bg-slate-700"
              : "bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300"
          }`}
        >
          {voiceEnabled ? (
            <>
              <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">AI Voice On</span>
            </>
          ) : (
            <>
              <VolumeX className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Voice Off</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
