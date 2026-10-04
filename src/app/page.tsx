"use client";

import React, { useState, useEffect } from "react";
import { Student, InterviewSession, Weakness } from "@/lib/types";
import { getStoredStudentId, setStoredStudentId } from "@/lib/storage";
import { Navbar } from "@/components/Navbar";
import { ClosedLoopVisualizer } from "@/components/ClosedLoopVisualizer";
import { ProfileModal } from "@/components/ProfileModal";
import { InterviewRoom } from "@/components/InterviewRoom";
import { DiagnosisView } from "@/components/DiagnosisView";
import { PracticeDrillsView } from "@/components/PracticeDrillsView";
import { MeasuredImprovementView } from "@/components/MeasuredImprovementView";
import {
  Sparkles,
  Bot,
  Target,
  BookOpen,
  TrendingUp,
  RefreshCw,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Mic,
  FileText,
  Building2,
  Briefcase,
  Users,
} from "lucide-react";

export default function Home() {
  const [student, setStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<
    "profile" | "interview" | "diagnosis" | "practice" | "improvement"
  >("profile");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [sessionType, setSessionType] = useState<"DIAGNOSTIC" | "RE_INTERVIEW">("DIAGNOSTIC");
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load student on mount
  useEffect(() => {
    const storedId = getStoredStudentId();
    if (storedId) {
      fetchStudent(storedId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchStudent = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/student?id=${id}`);
      const data = await res.json();
      if (res.ok && data.student) {
        setStudent(data.student);
        setWeaknesses(data.student.weaknesses || []);

        const completedInterviews = data.student.interviews?.filter(
          (i: InterviewSession) => i.status === "COMPLETED"
        );

        if (completedInterviews && completedInterviews.length > 0) {
          const latest = completedInterviews[0];
          setCurrentSession(latest);
          if (completedInterviews.length > 1) {
            setActiveTab("improvement");
          } else {
            setActiveTab("diagnosis");
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch student profile:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSaved = (savedStudent: Student) => {
    setStudent(savedStudent);
    setWeaknesses(savedStudent.weaknesses || []);
    setIsProfileModalOpen(false);
    setActiveTab("interview");
  };

  const handleStartInterview = (type: "DIAGNOSTIC" | "RE_INTERVIEW" = "DIAGNOSTIC") => {
    setSessionType(type);
    setActiveTab("interview");
  };

  const handleInterviewCompleted = (session: InterviewSession) => {
    setCurrentSession(session);
    if (student) {
      fetchStudent(student.id);
    }
    if (session.sessionType === "RE_INTERVIEW") {
      setActiveTab("improvement");
    } else {
      setActiveTab("diagnosis");
    }
  };

  const handleQuickDemoLoad = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Aarav Sharma",
          email: "aarav.sharma25@vitstudent.ac.in",
          college: "VIT Vellore",
          branch: "Computer Science & Engineering",
          gradYear: "2025",
          targetRole: "Software Development Engineer (SDE)",
          targetCompanyTier: "Tier 1 Product",
          resumeFileName: "Aarav_Sharma_SDE_Resume.pdf",
          resumeText: `AARAV SHARMA | B.Tech CSE, VIT Vellore (2025)
Tech Stack: Java, C++, TypeScript, React, Node.js, PostgreSQL, Redis, Docker
Projects:
1. Campus Mart - Full-stack student marketplace with Redis caching & PostgreSQL composite indexing.
2. DevSync - Real-time collaborative workspace with WebSockets and Docker containerization.
Achievements: Top 2% in LeetCode contests (Knight rating 1940+).`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.student) {
        setStoredStudentId(data.student.id);
        setStudent(data.student);
        setActiveTab("interview");
      }
    } catch (e) {
      console.error("Demo load failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine closed loop visualizer stage
  const getLoopStage = () => {
    if (activeTab === "interview") {
      return sessionType === "RE_INTERVIEW" ? "reinterview" : "interview";
    }
    return activeTab;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        student={student}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (!student && tab !== "profile") {
            setIsProfileModalOpen(true);
            return;
          }
          setActiveTab(tab);
        }}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* If no student registered yet, show compelling Landing Hero */}
        {!student ? (
          <div className="py-12 space-y-16">
            {/* Hero Section */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Next-Gen Campus Placement Engine for Indian Colleges
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Not Just a Mock Interview. <br />
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                  A Closed Learning Loop.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Generic mock interview sites ask questions and disappear. PrepPilot AI runs a closed loop:{" "}
                <span className="text-slate-200 font-semibold">
                  Interview ➔ Diagnosis ➔ Personalized Practice ➔ Re-Interview ➔ Measured Improvement.
                </span>{" "}
                The AI remembers your weak spots and re-tests them to prove your growth.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold rounded-2xl shadow-xl shadow-indigo-600/25 transition-all"
                >
                  <GraduationCap className="h-5 w-5" />
                  Create Student Profile & Upload Resume
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={handleQuickDemoLoad}
                  className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-semibold rounded-2xl border border-slate-800 transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  1-Click Sample Placement Candidate
                </button>
              </div>
            </div>

            {/* Closed Loop Visual Showcase */}
            <ClosedLoopVisualizer
              currentStage="interview"
              hasDiagnosis={false}
              hasPracticed={false}
              hasImprovement={false}
            />

            {/* 3 Core Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Mic className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Voice & Text Dual Input</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Web Speech API with Indian English (<code className="text-indigo-400">en-IN</code>) and Hindi (<code className="text-indigo-400">hi-IN</code>) accents. Voice input and real-time typing blend seamlessly.
                </p>
              </div>

              <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Persistent Weakness Memory</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unlike one-off mock interview tools, PrepPilot AI saves your diagnosed gaps in a local SQLite database and programs subsequent re-interviews to specifically re-test them.
                </p>
              </div>

              <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Measured Score Delta</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Clear visual radar and progression charts showing exact score improvements (+pts) between diagnostic and re-interview rounds to verify placement readiness.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* The Interactive Closed Learning Loop Visualizer */}
            <ClosedLoopVisualizer
              currentStage={getLoopStage()}
              onSelectStage={(tab) => {
                if (tab === "interview" && student.interviews && student.interviews.length > 0) {
                  setSessionType("RE_INTERVIEW");
                }
                setActiveTab(tab);
              }}
              hasDiagnosis={Boolean(student.interviews && student.interviews.length > 0)}
              hasPracticed={Boolean(student.drills && student.drills.some((d) => d.isCompleted))}
              hasImprovement={Boolean(student.interviews && student.interviews.length > 1)}
            />

            {/* TAB: PROFILE & RESUME */}
            {activeTab === "profile" && (
              <div className="w-full max-w-4xl mx-auto space-y-6">
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-extrabold text-xl text-indigo-300">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{student.name}</h2>
                      <p className="text-xs text-slate-400">
                        {student.email} • {student.college || "Indian Engineering College"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {student.targetRole}
                        </span>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          {student.targetCompanyTier}
                        </span>
                        {student.branch && (
                          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {student.branch} ({student.gradYear || "Class of 2025"})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                  >
                    Edit Profile / Resume
                  </button>
                </div>

                {/* Resume Summary Card */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-400" />
                      Extracted Resume Information
                    </h3>
                    {student.resumeFileName && (
                      <span className="text-xs text-emerald-400 font-medium">
                        ✓ {student.resumeFileName}
                      </span>
                    )}
                  </div>

                  {student.resumeText ? (
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 max-h-80 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {student.resumeText}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/50 rounded-2xl">
                      No resume uploaded or pasted yet. Uploading a resume allows the AI to tailor technical questions to your actual project architecture.
                    </div>
                  )}

                  {/* Direct Launch Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleStartInterview("DIAGNOSTIC")}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
                    >
                      <Bot className="h-4 w-4" />
                      Step 1: Start Diagnostic Placement Interview
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: INTERVIEW ROOM */}
            {activeTab === "interview" && (
              <InterviewRoom
                student={student}
                sessionType={sessionType}
                onInterviewCompleted={handleInterviewCompleted}
              />
            )}

            {/* TAB: DIAGNOSIS */}
            {activeTab === "diagnosis" && currentSession && (
              <DiagnosisView
                session={currentSession}
                weaknesses={weaknesses}
                onGoToPractice={() => setActiveTab("practice")}
                onStartReInterview={() => handleStartInterview("RE_INTERVIEW")}
              />
            )}

            {/* TAB: PRACTICE DRILLS */}
            {activeTab === "practice" && (
              <PracticeDrillsView
                student={student}
                onStartReInterview={() => handleStartInterview("RE_INTERVIEW")}
              />
            )}

            {/* TAB: MEASURED IMPROVEMENT */}
            {activeTab === "improvement" && (
              <MeasuredImprovementView
                student={student}
                onStartReInterview={() => handleStartInterview("RE_INTERVIEW")}
              />
            )}
          </div>
        )}
      </main>

      {/* Global Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentStudent={student}
        onProfileSaved={handleProfileSaved}
      />
    </div>
  );
}
