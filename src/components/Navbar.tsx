"use client";

import React from "react";
import Link from "next/link";
import { Student } from "@/lib/types";
import { Sparkles, Bot, GraduationCap, RefreshCw, BarChart3, Target, BookOpen } from "lucide-react";

interface NavbarProps {
  student: Student | null;
  activeTab: "profile" | "interview" | "diagnosis" | "practice" | "improvement";
  onTabChange: (tab: "profile" | "interview" | "diagnosis" | "practice" | "improvement") => void;
  onOpenProfileModal: () => void;
}

export function Navbar({ student, activeTab, onTabChange, onOpenProfileModal }: NavbarProps) {
  const modelName = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.0-flash";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                PrepPilot <span className="text-indigo-400 font-extrabold">AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Placement OS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Closed-Loop Placement Readiness for Indian Colleges
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onTabChange("profile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "profile"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Profile & Resume
          </button>

          <button
            onClick={() => onTabChange("interview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "interview"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            Interview Room
          </button>

          <button
            onClick={() => onTabChange("diagnosis")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "diagnosis"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            Diagnosis
          </button>

          <button
            onClick={() => onTabChange("practice")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "practice"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Targeted Practice
          </button>

          <button
            onClick={() => onTabChange("improvement")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "improvement"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Improvement Delta
          </button>
        </nav>

        {/* Student Profile Quick Info & Actions */}
        <div className="flex items-center gap-3">
          {student ? (
            <div
              onClick={onOpenProfileModal}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
            >
              <div className="h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-medium text-slate-200 truncate max-w-[120px]">{student.name}</p>
                <p className="text-[10px] text-indigo-400 truncate max-w-[130px]">{student.targetRole}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenProfileModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Get Started
            </button>
          )}

          {/* Model info pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Gemini: {modelName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
