"use client";

import React, { useState, useEffect } from "react";
import { Student, PracticeDrill, Weakness } from "@/lib/types";
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Send,
  Loader2,
  Layers,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import confetti from "canvas-confetti";

interface PracticeDrillsViewProps {
  student: Student;
  onStartReInterview: () => void;
}

export function PracticeDrillsView({ student, onStartReInterview }: PracticeDrillsViewProps) {
  const [drills, setDrills] = useState<PracticeDrill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDrillId, setActiveDrillId] = useState<string | null>(null);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [gradingStates, setGradingStates] = useState<Record<string, boolean>>({});
  const [gradingResults, setGradingResults] = useState<
    Record<string, { score: number; feedback: string; passed: boolean }>
  >({});
  const [errorMsg, setErrorMsg] = useState("");

  const fetchDrills = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/drills?studentId=${student.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load drills");

      setDrills(data.drills || []);
      if (data.drills?.length > 0) {
        setActiveDrillId(data.drills[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to fetch practice drills.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrills();
  }, [student.id]);

  const handleGenerateMore = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/drills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate drills");
      await fetchDrills();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate additional drills");
      setIsLoading(false);
    }
  };

  const handleGradeAttempt = async (drillId: string) => {
    const input = userInputs[drillId] || "";
    if (!input.trim()) {
      setErrorMsg("Please write or speak your practice answer before submitting for AI grading.");
      return;
    }

    setGradingStates((prev) => ({ ...prev, [drillId]: true }));
    setErrorMsg("");

    try {
      const res = await fetch("/api/drills/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillId,
          userAttempt: input,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grade drill");

      setGradingResults((prev) => ({
        ...prev,
        [drillId]: data.grade,
      }));

      // Update drill list locally
      setDrills((prev) =>
        prev.map((d) => (d.id === drillId ? { ...d, isCompleted: data.grade.passed } : d))
      );

      if (data.grade.passed) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to grade drill attempt.");
    } finally {
      setGradingStates((prev) => ({ ...prev, [drillId]: false }));
    }
  };

  const completedCount = drills.filter((d) => d.isCompleted).length;
  const activeDrill = drills.find((d) => d.id === activeDrillId) || drills[0];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Personalized Remediation Module
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {completedCount} / {drills.length} Drills Mastered
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Targeted Practice on Diagnosed Weaknesses
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Instead of generic quizzes, these interactive drills target the exact gaps uncovered in your interview. Complete them to prepare for your adaptive Re-Interview.
          </p>
        </div>

        {/* Ready for Re-interview CTA */}
        <div className="shrink-0 self-stretch sm:self-auto flex flex-col items-end">
          <button
            onClick={onStartReInterview}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Step 4: Launch Adaptive Re-Interview
            <ArrowRight className="h-4 w-4" />
          </button>
          <span className="text-[11px] text-slate-400 mt-1.5 self-center sm:self-end">
            🧠 AI will adapt questions to test your practice!
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-16 bg-slate-900 border border-slate-800 rounded-3xl text-center">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading personalized practice drills...</p>
        </div>
      ) : drills.length === 0 ? (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-3">
          <BookOpen className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No active practice drills yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Drills are automatically generated when you complete a Diagnostic Interview. You can also generate placement drills right now!
          </p>
          <button
            onClick={handleGenerateMore}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
          >
            Generate Placement Drills
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Drills Selector List */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Select Practice Drill
            </h3>

            <div className="space-y-2">
              {drills.map((drill, idx) => {
                const isSelected = drill.id === activeDrill?.id;
                return (
                  <div
                    key={drill.id}
                    onClick={() => setActiveDrillId(drill.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 border-indigo-500/80 shadow-md shadow-indigo-500/10"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                        {drill.drillType.replace("_", " ")}
                      </span>
                      {drill.isCompleted ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mastered
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-medium">To Practice</span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">
                      {drill.title}
                    </h4>
                    {drill.weakness && (
                      <p className="text-[10px] text-indigo-400/90 mt-0.5 line-clamp-1">
                        🎯 Target: {drill.weakness.topic}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleGenerateMore}
              className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium rounded-xl transition-colors"
            >
              + Generate More Practice Drills
            </button>
          </div>

          {/* Right Column: Active Drill Workspace */}
          {activeDrill && (
            <div className="lg:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-5">
              {/* Drill Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {activeDrill.drillType.replace("_", " ")}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                    {activeDrill.title}
                  </h3>
                </div>
                {activeDrill.weakness && (
                  <span className="text-xs px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                    Focus: {activeDrill.weakness.topic}
                  </span>
                )}
              </div>

              {/* Prompt Box */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80">
                <p className="text-xs font-semibold text-indigo-400 mb-1 flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4" />
                  Practice Challenge & Prompt
                </p>
                <p className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                  {activeDrill.prompt}
                </p>
              </div>

              {/* Options or Structured Hints (If available) */}
              {activeDrill.options && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-400">Options / Guide:</p>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {JSON.parse(activeDrill.options).map((opt: string, i: number) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300"
                      >
                        <span className="font-bold text-indigo-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Student Answer Workspace */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Your Practice Attempt</span>
                  <span>Articulate clearly or use STAR structure</span>
                </div>
                <textarea
                  rows={4}
                  value={userInputs[activeDrill.id] || activeDrill.userAttempt || ""}
                  onChange={(e) =>
                    setUserInputs((prev) => ({
                      ...prev,
                      [activeDrill.id]: e.target.value,
                    }))
                  }
                  placeholder="Type your revised response demonstrating complete mastery of this concept..."
                  className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    AI grades against Indian campus recruiter scoring rubric.
                  </span>
                  <button
                    onClick={() => handleGradeAttempt(activeDrill.id)}
                    disabled={gradingStates[activeDrill.id]}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    {gradingStates[activeDrill.id] ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Grading with AI...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit for AI Grading
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Grading Result Feedback Box */}
              {gradingResults[activeDrill.id] && (
                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
                    gradingResults[activeDrill.id].passed
                      ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                      : "bg-amber-950/30 border-amber-500/30 text-amber-200"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span className="flex items-center gap-1.5">
                      {gradingResults[activeDrill.id].passed ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Mastered (Score: {gradingResults[activeDrill.id].score}/100)
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                          Needs More Depth (Score: {gradingResults[activeDrill.id].score}/100)
                        </>
                      )}
                    </span>
                    {gradingResults[activeDrill.id].passed && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        Weakness Marked Practiced
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300">{gradingResults[activeDrill.id].feedback}</p>
                </div>
              )}

              {/* Sample Best Answer / Explanation Accordion */}
              {activeDrill.sampleBestAnswer && (
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Lightbulb className="h-4 w-4" />
                    <span>Recruiter Exemplary Model Answer & Takeaways</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                    {activeDrill.sampleBestAnswer}
                  </p>
                  {activeDrill.explanation && (
                    <p className="text-slate-400 border-t border-slate-800 pt-2 text-[11px]">
                      💡 Key takeaway: {activeDrill.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
