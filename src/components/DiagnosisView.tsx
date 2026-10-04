"use client";

import React, { useState } from "react";
import { InterviewSession, Weakness, QuestionAnswer } from "@/lib/types";
import {
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  Code,
  MessageSquare,
  Zap,
} from "lucide-react";

interface DiagnosisViewProps {
  session: InterviewSession;
  weaknesses: Weakness[];
  onGoToPractice: () => void;
  onStartReInterview: () => void;
}

export function DiagnosisView({ session, weaknesses, onGoToPractice, onStartReInterview }: DiagnosisViewProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(
    session.questions?.[0]?.id || null
  );

  const overallScore = Math.round(session.overallScore || 0);
  const readiness = session.readinessLevel || (overallScore >= 80 ? "Ready" : overallScore >= 65 ? "Needs Polish" : "High Risk");

  const getReadinessBadge = (level: string) => {
    switch (level) {
      case "Ready":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          text: "Campus Placement Ready 🚀",
        };
      case "Needs Polish":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          text: "Needs Remediation Polish ⚡",
        };
      default:
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          text: "High Rejection Risk ⚠️",
        };
    }
  };

  const badge = getReadinessBadge(readiness);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Round #{session.sessionNumber} Diagnosis
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
              {badge.text}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Placement Readiness Diagnostic Report
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            AI evaluated your technical substance, STAR articulation, and engineering depth against standard placement benchmarks for{" "}
            <span className="text-slate-200 font-semibold">{session.companyTier}</span>.
          </p>
        </div>

        {/* Big Score Gauge */}
        <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shrink-0">
          <div className="relative flex items-center justify-center">
            <div className="h-20 w-20 rounded-full border-4 border-slate-800 flex items-center justify-center">
              <span className="text-2xl font-extrabold text-white">{overallScore}</span>
              <span className="text-[10px] text-slate-500 absolute -bottom-1">/100</span>
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-300">Overall Readiness</p>
            <p className="text-[11px] text-slate-500">
              {session.sessionType === "RE_INTERVIEW" ? "Re-Interview Evaluated" : "Baseline Diagnostic"}
            </p>
            {session.improvementDelta !== null && session.improvementDelta !== undefined && (
              <p className="text-xs font-bold text-emerald-400 mt-1">
                +{session.improvementDelta} pts Improvement!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4 Skill Metric Breakdown Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5 text-indigo-400" />
              Technical Depth
            </span>
            <span className="text-xs font-bold text-white">{Math.round(session.techScore || 0)}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.round(session.techScore || 0)}%` }}
            ></div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
              Communication
            </span>
            <span className="text-xs font-bold text-white">{Math.round(session.communicationScore || 0)}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.round(session.communicationScore || 0)}%` }}
            ></div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Problem Solving
            </span>
            <span className="text-xs font-bold text-white">{Math.round(session.problemSolvingScore || 0)}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.round(session.problemSolvingScore || 0)}%` }}
            ></div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-violet-400" />
              STAR Delivery
            </span>
            <span className="text-xs font-bold text-white">{Math.round(session.starMethodScore || 0)}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-violet-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.round(session.starMethodScore || 0)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recruiter Feedback Summary Card */}
      {session.feedbackSummary && (
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Award className="h-4 w-4" />
            Recruiter Summary & Diagnostic Diagnosis
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {session.feedbackSummary}
          </p>
        </div>
      )}

      {/* Diagnosed Weaknesses List & Remediation CTA */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Diagnosed Placement Weaknesses ({weaknesses.length})
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              These exact gaps were identified by the AI. Each has a personalized practice drill ready!
            </p>
          </div>

          <button
            onClick={onGoToPractice}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto"
          >
            <BookOpen className="h-4 w-4" />
            Step 3: Practice These Weaknesses
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {weaknesses.length === 0 ? (
          <div className="p-6 bg-slate-950/50 rounded-2xl text-center text-xs text-slate-400">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1.5" />
            No active critical weaknesses found! You are well-positioned for placement rounds.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {weaknesses.map((w) => (
              <div
                key={w.id}
                className="p-4 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {w.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        w.severity === "HIGH"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : w.severity === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}
                    >
                      {w.severity} SEVERITY
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs sm:text-sm text-white">{w.topic}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">{w.description}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px]">
                  <span className="text-indigo-400 font-medium">⚡ Remediation drill ready</span>
                  <span
                    className={`font-semibold ${
                      w.status === "RESOLVED"
                        ? "text-emerald-400"
                        : w.status === "PRACTICED"
                        ? "text-sky-400"
                        : "text-amber-400"
                    }`}
                  >
                    Status: {w.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Question-by-Question Deep Dive */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white">
            Question-by-Question Evaluation & Exemplary Answers
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare what you said against the standard expected by Indian campus recruiters.
          </p>
        </div>

        <div className="space-y-3">
          {session.questions?.map((q, idx) => {
            const isExpanded = expandedQuestion === q.id;
            return (
              <div
                key={q.id}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-200 line-clamp-1">
                        {q.question}
                      </p>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        {q.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {q.score !== null && q.score !== undefined && (
                      <span className="text-xs font-bold text-indigo-400">
                        Score: {Math.round(q.score)}/100
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-slate-800/60 space-y-4 text-xs">
                    {/* Candidate Answer */}
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                      <p className="font-semibold text-slate-400 mb-1">Your Spoken/Typed Answer:</p>
                      <p className="text-slate-200 italic leading-relaxed">
                        {q.userAnswer ? `"${q.userAnswer}"` : "(No answer provided)"}
                      </p>
                    </div>

                    {/* Feedback */}
                    <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-500/20">
                      <p className="font-semibold text-indigo-300 mb-1">Recruiter Evaluation & Feedback:</p>
                      <p className="text-slate-300 leading-relaxed">{q.feedback || "Good attempt."}</p>
                    </div>

                    {/* Better Answer (Recruiter Gold Standard) */}
                    {q.betterAnswer && (
                      <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/20">
                        <p className="font-semibold text-emerald-300 mb-1">
                          ✨ Ideal Placement Answer (Recruiter Benchmark):
                        </p>
                        <p className="text-slate-200 leading-relaxed font-sans">{q.betterAnswer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Step Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 border border-indigo-500/30 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-white">Complete the Learning Loop</h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Fix these diagnosed weaknesses through interactive micro-drills, then take an adaptive Re-Interview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onGoToPractice}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Go to Practice Drills
          </button>
        </div>
      </div>
    </div>
  );
}
