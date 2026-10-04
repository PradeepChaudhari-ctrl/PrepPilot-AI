"use client";

import React, { useState, useEffect, useRef } from "react";
import { Student, InterviewSession, QuestionAnswer, Weakness } from "@/lib/types";
import { AudioWaveIndicator } from "./AudioWaveIndicator";
import { SpeechRecognitionManager, speakText, stopSpeaking } from "@/lib/speech";
import {
  Bot,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Send,
  Loader2,
  Clock,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  RefreshCw,
} from "lucide-react";

interface InterviewRoomProps {
  student: Student;
  onInterviewCompleted: (session: InterviewSession) => void;
  sessionType?: "DIAGNOSTIC" | "RE_INTERVIEW";
}

export function InterviewRoom({ student, onInterviewCompleted, sessionType = "DIAGNOSTIC" }: InterviewRoomProps) {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questions, setQuestions] = useState<QuestionAnswer[]>([]);
  const [targetedWeaknesses, setTargetedWeaknesses] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Per-question state: answers map
  const [answers, setAnswers] = useState<Record<string, { text: string; audioSec: number }>>({});

  // Loading states
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Speech Recognition & TTS states
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioTimer, setAudioTimer] = useState(0);

  const speechManagerRef = useRef<SpeechRecognitionManager | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Interview Session
  const initInterview = async (type: "DIAGNOSTIC" | "RE_INTERVIEW") => {
    setIsInitializing(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          sessionType: type,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize interview");
      }

      setSession(data.session);
      setQuestions(data.session.questions || []);
      setTargetedWeaknesses(data.targetedWeaknesses || []);
      setCurrentIdx(0);

      // Pre-populate empty answers
      const initialAnswers: Record<string, { text: string; audioSec: number }> = {};
      data.session.questions.forEach((q: QuestionAnswer) => {
        initialAnswers[q.id] = { text: "", audioSec: 0 };
      });
      setAnswers(initialAnswers);

      // Automatically speak first question if enabled
      if (data.session.questions?.[0] && voiceEnabled) {
        speakCurrentQuestion(data.session.questions[0].question);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to start interview session.");
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initInterview(sessionType);

    return () => {
      stopSpeaking();
      if (speechManagerRef.current) {
        speechManagerRef.current.stop();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Set up Speech Recognition instance
  useEffect(() => {
    speechManagerRef.current = new SpeechRecognitionManager(
      voiceLang,
      (transcript, isFinal) => {
        if (!currentQuestion) return;
        const currentAnswerObj = answers[currentQuestion.id] || { text: "", audioSec: 0 };
        const updatedText = currentAnswerObj.text
          ? `${currentAnswerObj.text} ${transcript}`.trim()
          : transcript;

        setAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: {
            ...currentAnswerObj,
            text: updatedText,
          },
        }));
      },
      (error) => {
        console.warn("Speech error:", error);
        setIsListening(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      },
      () => {
        setIsListening(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      }
    );
  }, [voiceLang, currentIdx, answers]);

  const currentQuestion = questions[currentIdx];

  const speakCurrentQuestion = (text: string) => {
    if (!voiceEnabled) return;
    setIsSpeaking(true);
    speakText(text, voiceLang, () => {
      setIsSpeaking(false);
    });
  };

  // Toggle voice recognition
  const toggleListening = () => {
    if (isListening) {
      if (speechManagerRef.current) speechManagerRef.current.stop();
      setIsListening(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    } else {
      stopSpeaking();
      setIsSpeaking(false);
      if (speechManagerRef.current) {
        speechManagerRef.current.setLanguage(voiceLang);
        speechManagerRef.current.start();
        setIsListening(true);
        setAudioTimer(0);
        timerIntervalRef.current = setInterval(() => {
          setAudioTimer((prev) => {
            const next = prev + 1;
            if (currentQuestion) {
              setAnswers((prevAnswers) => ({
                ...prevAnswers,
                [currentQuestion.id]: {
                  ...prevAnswers[currentQuestion.id],
                  audioSec: next,
                },
              }));
            }
            return next;
          });
        }, 1000);
      }
    }
  };

  const handleNext = () => {
    if (isListening) toggleListening();
    stopSpeaking();
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      if (voiceEnabled && questions[nextIdx]) {
        speakCurrentQuestion(questions[nextIdx].question);
      }
    }
  };

  const handlePrev = () => {
    if (isListening) toggleListening();
    stopSpeaking();
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      setCurrentIdx(prevIdx);
      if (voiceEnabled && questions[prevIdx]) {
        speakCurrentQuestion(questions[prevIdx].question);
      }
    }
  };

  // Submit interview
  const handleSubmitInterview = async () => {
    if (!session) return;
    if (isListening) toggleListening();
    stopSpeaking();

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const submissionAnswers = questions.map((q) => ({
        questionId: q.id,
        userAnswer: answers[q.id]?.text || "",
        audioDurationSec: answers[q.id]?.audioSec || 0,
      }));

      const res = await fetch("/api/interview/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          answers: submissionAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit interview");
      }

      onInterviewCompleted(data.session);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to evaluate interview. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-slate-900/60 border border-slate-800 rounded-3xl text-center">
        <div className="relative mb-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
            <Bot className="h-8 w-8 text-indigo-400" />
          </div>
          <Sparkles className="h-5 w-5 text-amber-400 absolute -top-1 -right-1 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-white">Preparing Your Campus Placement Interview...</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1">
          {sessionType === "RE_INTERVIEW"
            ? "Analyzing previously diagnosed weaknesses to generate adaptive follow-up challenges..."
            : "Reviewing resume projects and role standards for " + student.targetCompanyTier + "..."}
        </p>
      </div>
    );
  }

  if (!session || questions.length === 0) {
    return (
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center">
        <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
        <p className="text-sm text-slate-200">No active interview questions loaded.</p>
        <button
          onClick={() => initInterview(sessionType)}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
        >
          Initialize Interview Session
        </button>
      </div>
    );
  }

  const currentAnswer = currentQuestion ? answers[currentQuestion.id]?.text || "" : "";
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
  const isReInterview = session.sessionType === "RE_INTERVIEW";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Session Header Card */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            {isReInterview ? (
              <RefreshCw className="h-5 w-5 text-sky-400" />
            ) : (
              <Bot className="h-5 w-5 text-indigo-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {isReInterview ? `Adaptive Re-Interview (Round #${session.sessionNumber})` : "Baseline Diagnostic Interview"}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isReInterview
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                }`}
              >
                {student.targetCompanyTier}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Role: <span className="text-slate-200 font-medium">{student.targetRole}</span> • College:{" "}
              <span className="text-slate-200 font-medium">{student.college || "Campus Placement"}</span>
            </p>
          </div>
        </div>

        {/* Question Counter Pill */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">Question:</span>
          <span className="font-bold text-indigo-400">{currentIdx + 1}</span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-300">{questions.length}</span>
        </div>
      </div>

      {/* Re-Interview Weakness Focus Banner (If Applicable) */}
      {isReInterview && targetedWeaknesses.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-sky-950/50 to-indigo-950/50 border border-sky-500/30 rounded-xl flex items-start gap-3">
          <RefreshCw className="h-4 w-4 text-sky-400 shrink-0 mt-0.5 animate-spin" />
          <div className="text-xs">
            <span className="font-bold text-sky-300">Closed-Loop Re-Testing Active: </span>
            <span className="text-slate-300">
              This interview has been programmed to re-test your past diagnosed gaps:{" "}
            </span>
            <span className="font-semibold text-white">
              {targetedWeaknesses.map((w) => w.topic).join(", ")}
            </span>
            . Answer thoroughly to prove your measured improvement!
          </div>
        </div>
      )}

      {/* Main Question Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-5">
        {/* Category & AI Speaker */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {currentQuestion.category.replace("_", " ")}
            </span>
            {currentQuestion.context && (
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                • {currentQuestion.context}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => speakCurrentQuestion(currentQuestion.question)}
            title="Read Question Aloud"
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Volume2 className="h-4 w-4" />
            <span>Hear Question</span>
          </button>
        </div>

        {/* The Question Text */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
          <h3 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Voice Input & Wave Indicator */}
        <AudioWaveIndicator
          isListening={isListening}
          onToggleListening={toggleListening}
          lang={voiceLang}
          onChangeLang={setVoiceLang}
          isSpeaking={isSpeaking}
          onToggleSpeech={() => setVoiceEnabled(!voiceEnabled)}
          voiceEnabled={voiceEnabled}
          audioDurationSec={audioTimer}
        />

        {/* User Answer Textarea (Fallback / Live Transcribed) */}
        <div>
          <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
            <span>Your Response (Voice transcript or Type below)</span>
            <span className={wordCount > 30 ? "text-emerald-400 font-medium" : "text-amber-400"}>
              {wordCount} words {wordCount < 30 ? "(Aim for 40+ words)" : "✓ Good length"}
            </span>
          </div>

          <textarea
            rows={5}
            value={currentAnswer}
            onChange={(e) => {
              const text = e.target.value;
              setAnswers((prev) => ({
                ...prev,
                [currentQuestion.id]: {
                  ...prev[currentQuestion.id],
                  text,
                },
              }));
            }}
            placeholder="Speak into microphone or type your technical/STAR response here..."
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>💡 Tip: Indian placement panels value STAR structure & real engineering tradeoffs.</span>
            <span>Typing and voice seamlessly blend.</span>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Navigation & Submission Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {currentIdx < questions.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/25 transition-all"
              >
                Next Question
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitInterview}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Evaluating Readiness with AI...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Complete & Diagnose Interview
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
