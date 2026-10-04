"use client";

import React from "react";
import { Bot, Target, BookOpen, RefreshCw, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";

interface ClosedLoopVisualizerProps {
  currentStage: "profile" | "interview" | "diagnosis" | "practice" | "reinterview" | "improvement";
  onSelectStage?: (stage: "interview" | "diagnosis" | "practice" | "improvement") => void;
  hasDiagnosis?: boolean;
  hasPracticed?: boolean;
  hasImprovement?: boolean;
}

export function ClosedLoopVisualizer({
  currentStage,
  onSelectStage,
  hasDiagnosis,
  hasPracticed,
  hasImprovement,
}: ClosedLoopVisualizerProps) {
  const steps = [
    {
      id: "interview",
      tab: "interview" as const,
      number: 1,
      title: "Diagnostic Interview",
      desc: "Live voice/text simulation tailored to Indian campus drives",
      icon: Bot,
      activeColor: "border-indigo-500 bg-indigo-500/10 text-indigo-400",
      isDone: hasDiagnosis,
    },
    {
      id: "diagnosis",
      tab: "diagnosis" as const,
      number: 2,
      title: "Weakness Diagnosis",
      desc: "PINPOINTS exact CS fundamentals, STAR gaps & project issues",
      icon: Target,
      activeColor: "border-amber-500 bg-amber-500/10 text-amber-400",
      isDone: hasDiagnosis,
    },
    {
      id: "practice",
      tab: "practice" as const,
      number: 3,
      title: "Targeted Remediation",
      desc: "Micro-drills generated strictly for YOUR diagnosed weak spots",
      icon: BookOpen,
      activeColor: "border-violet-500 bg-violet-500/10 text-violet-400",
      isDone: hasPracticed,
    },
    {
      id: "reinterview",
      tab: "interview" as const,
      number: 4,
      title: "Adaptive Re-Interview",
      desc: "AI remembers previous weaknesses & tests your mastery",
      icon: RefreshCw,
      activeColor: "border-sky-500 bg-sky-500/10 text-sky-400",
      isDone: hasImprovement,
    },
    {
      id: "improvement",
      tab: "improvement" as const,
      number: 5,
      title: "Measured Improvement",
      desc: "Quantified score delta (+pts) & weakness resolution proof",
      icon: TrendingUp,
      activeColor: "border-emerald-500 bg-emerald-500/10 text-emerald-400",
      isDone: hasImprovement,
    },
  ];

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-5 mb-8 backdrop-blur-md shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping"></span>
            <h2 className="text-xs uppercase font-bold tracking-widest text-indigo-400">
              The Closed Learning Loop
            </h2>
          </div>
          <p className="text-sm font-semibold text-slate-200 mt-0.5">
            Interview → Diagnosis → Personalized Practice → Re-Interview → Measured Improvement
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50 self-start md:self-auto">
          🧠 The AI remembers your gaps to evaluate real growth
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = currentStage === step.id;

          return (
            <div
              key={step.id}
              onClick={() => onSelectStage && onSelectStage(step.tab)}
              className={`relative rounded-xl p-3.5 border transition-all cursor-pointer group flex flex-col justify-between ${
                isCurrent
                  ? `${step.activeColor} ring-1 ring-indigo-500/40 shadow-lg shadow-indigo-500/10`
                  : step.isDone
                  ? "border-emerald-500/30 bg-emerald-950/20 text-slate-200 hover:border-emerald-500/50"
                  : "border-slate-800/80 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isCurrent
                        ? "bg-indigo-500 text-white"
                        : step.isDone
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    Step {step.number}
                  </span>
                  {step.isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Icon className="h-4 w-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
                  )}
                </div>
                <h3 className="font-semibold text-xs text-slate-100 group-hover:text-white transition-colors">
                  {step.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-snug mt-1">
                  {step.desc}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="h-3.5 w-3.5 text-slate-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
