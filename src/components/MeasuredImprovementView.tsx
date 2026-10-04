"use client";

import React, { useState, useEffect } from "react";
import { Student, AnalyticsData } from "@/lib/types";
import {
  TrendingUp,
  Award,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Loader2,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import confetti from "canvas-confetti";

interface MeasuredImprovementViewProps {
  student: Student;
  onStartReInterview: () => void;
}

export function MeasuredImprovementView({ student, onStartReInterview }: MeasuredImprovementViewProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/analytics?studentId=${student.id}`);
        const data = await res.json();
        if (res.ok) {
          setAnalytics(data);
          if (data.summary.totalDelta > 0) {
            confetti({
              particleCount: 70,
              spread: 80,
              origin: { y: 0.6 },
            });
          }
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [student.id]);

  if (isLoading || !isMounted) {
    return (
      <div className="p-16 bg-slate-900 border border-slate-800 rounded-3xl text-center">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-400">Calculating measured improvement delta & radar metrics...</p>
      </div>
    );
  }

  if (!analytics || analytics.summary.totalInterviews === 0) {
    return (
      <div className="p-12 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <TrendingUp className="h-12 w-12 text-slate-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">No Completed Interviews Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Complete your initial Diagnostic Interview and targeted practice drills. PrepPilot AI will then measure your score delta during the Re-Interview round!
        </p>
        <button
          onClick={onStartReInterview}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
        >
          Start Diagnostic Interview
        </button>
      </div>
    );
  }

  const { summary, trendData, radarData, weaknesses, recentInterviews } = analytics;
  const isImproved = summary.totalDelta > 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Hero: Measured Improvement Delta Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              The Closed Loop in Action
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {summary.totalInterviews} Completed Rounds
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Measured Improvement & Progression
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            PrepPilot AI continuously compares your baseline diagnostic performance against subsequent re-interviews to verify that diagnosed gaps were resolved.
          </p>
        </div>

        {/* Delta Callout Box */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-4 shrink-0 shadow-lg">
          <div className="text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Baseline</span>
            <span className="text-lg font-bold text-slate-300">{Math.round(summary.initialScore)}</span>
          </div>

          <div className="h-8 w-[1px] bg-slate-800"></div>

          <div className="text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Current</span>
            <span className="text-lg font-bold text-white">{Math.round(summary.latestScore)}</span>
          </div>

          <div className="h-8 w-[1px] bg-slate-800"></div>

          <div className="text-center">
            <span className="text-[10px] uppercase font-semibold text-emerald-400 block">Score Delta</span>
            <span
              className={`text-xl font-extrabold ${
                isImproved ? "text-emerald-400" : summary.totalDelta === 0 ? "text-slate-300" : "text-amber-400"
              }`}
            >
              {summary.totalDelta >= 0 ? `+${summary.totalDelta}` : summary.totalDelta} pts
            </span>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards: Resolution Rate, Readiness Level, Next Round */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Weakness Resolution Rate */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Weakness Resolution Rate</p>
            <p className="text-lg font-bold text-white">
              {summary.weaknessStats.resolutionRate}%{" "}
              <span className="text-xs text-slate-400 font-normal">
                ({summary.weaknessStats.resolved}/{summary.weaknessStats.total} Resolved)
              </span>
            </p>
          </div>
        </div>

        {/* Card 2: Current Readiness Status */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Campus Readiness Level</p>
            <p className="text-lg font-bold text-indigo-300">{summary.readinessLevel}</p>
          </div>
        </div>

        {/* Card 3: Continuous Loop Re-interview Button */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 font-medium">Continue Learning Loop</p>
            <p className="text-xs font-semibold text-slate-200">Re-test active weaknesses</p>
          </div>
          <button
            onClick={onStartReInterview}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-Interview
          </button>
        </div>
      </div>

      {/* Visual Analytics Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart: Skill Profile Comparison */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Skill Radar: Baseline vs Current Round
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Measures expansion across Technical Depth, Communication, Problem Solving, and STAR Delivery.
            </p>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
                <Radar
                  name="Baseline Session"
                  dataKey="baseline"
                  stroke="#64748b"
                  fill="#64748b"
                  fillOpacity={0.25}
                />
                <Radar
                  name="Current Re-Interview"
                  dataKey="current"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.5}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b1120",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    fontSize: "11px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart: Progression Over Time */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Readiness Progression Trend
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Round-by-round trajectory towards placement clearance.
            </p>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="sessionName" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis domain={[30, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b1120",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    fontSize: "11px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="overall"
                  name="Overall Readiness"
                  stroke="#10b981"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="technical"
                  name="Technical"
                  stroke="#6366f1"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="starMethod"
                  name="STAR Delivery"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weakness Resolution Tracker List */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-400" />
              Weakness Resolution Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracking the lifecycle of diagnosed placement bottlenecks: Diagnosed ➔ Practiced ➔ Resolved in Re-Interview
            </p>
          </div>
        </div>

        {weaknesses.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No weaknesses recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {weaknesses.map((w) => (
              <div
                key={w.id}
                className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {w.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        w.status === "RESOLVED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : w.status === "PRACTICED"
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {w.status === "RESOLVED" ? "✅ RESOLVED" : w.status === "PRACTICED" ? "⚡ PRACTICED" : "⚠️ ACTIVE"}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs sm:text-sm text-white">{w.topic}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">{w.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Sessions Table */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          Completed Placement Interview Rounds
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3 rounded-l-xl">Round #</th>
                <th className="p-3">Type</th>
                <th className="p-3">Target Tier</th>
                <th className="p-3">Score</th>
                <th className="p-3">Delta</th>
                <th className="p-3">Readiness</th>
                <th className="p-3 rounded-r-xl">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentInterviews.map((iv) => (
                <tr key={iv.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="p-3 font-bold text-white">Round {iv.sessionNumber}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        iv.sessionType === "RE_INTERVIEW"
                          ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}
                    >
                      {iv.sessionType}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{iv.companyTier}</td>
                  <td className="p-3 font-bold text-white">{Math.round(iv.overallScore || 0)}/100</td>
                  <td className="p-3">
                    {iv.improvementDelta !== null && iv.improvementDelta !== undefined ? (
                      <span className="font-bold text-emerald-400">+{iv.improvementDelta} pts</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="p-3 font-medium text-slate-200">{iv.readinessLevel || "Ready"}</td>
                  <td className="p-3 text-slate-400">
                    {new Date(iv.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
