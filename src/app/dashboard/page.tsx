"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Interview = {
  id: string;
  createdAt: string;
  overallScore: number | null;
  reportJson: string | null;
};

type TopicProgress = {
  id: string;
  topic: string;
  score: number;
  updatedAt: string;
};

type Student = {
  id: string;
  name: string;
  email: string;
  branch?: string | null;
  year?: number | null;
  interviews: Interview[];
  topicProgress: TopicProgress[];
};

function parseJSON(value: string | null) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

export default function DashboardPage() {
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const studentId = localStorage.getItem(
          "preppilot_student_id"
        );

        if (!studentId) {
          router.push("/onboarding");
          return;
        }

        const res = await fetch(
          `/api/student?id=${encodeURIComponent(studentId)}`
        );

        if (!res.ok) {
          throw new Error("Unable to load student");
        }

        const data = await res.json();

        setStudent(data.student || data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const sortedInterviews = useMemo(() => {
    return [...(student?.interviews || [])].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    );
  }, [student]);

  const latestInterview =
    sortedInterviews[sortedInterviews.length - 1];

  const latestReport = parseJSON(
    latestInterview?.reportJson || null
  );

  const readiness =
    latestReport.readinessScore ??
    latestInterview?.overallScore ??
    0;

  const chartData = sortedInterviews.map(
    (interview, index) => ({
      attempt: `Attempt ${index + 1}`,
      score: Math.round(
        interview.overallScore ||
          parseJSON(interview.reportJson).readinessScore ||
          0
      ),
    })
  );

  const latestTopicScores: Record<string, number> = {};

  const topicHistory: Record<string, TopicProgress[]> = {};

  (student?.topicProgress || []).forEach((item) => {
    if (!topicHistory[item.topic]) {
      topicHistory[item.topic] = [];
    }

    topicHistory[item.topic].push(item);
  });

  Object.entries(topicHistory).forEach(([topic, values]) => {
    const sorted = [...values].sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() -
        new Date(b.updatedAt).getTime()
    );

    latestTopicScores[topic] =
      sorted[sorted.length - 1]?.score || 0;
  });

  const topicEntries = Object.entries(latestTopicScores).sort(
    ([, a], [, b]) => a - b
  );

  const weakestTopic =
    topicEntries[0]?.[0] || "Communication";

  const weakTopics =
    latestReport.weakTopics?.length > 0
      ? latestReport.weakTopics
      : topicEntries
          .filter(([, score]) => score < 60)
          .map(([topic]) => topic)
          .slice(0, 3);

  const plan =
    latestReport.studyPlan || [
      {
        day: 1,
        topic: weakestTopic,
        subtopics: ["Fundamentals", "Core concepts"],
      },
      {
        day: 2,
        topic: weakestTopic,
        subtopics: ["Practice questions"],
      },
      {
        day: 3,
        topic: weakestTopic,
        subtopics: ["Interview questions"],
      },
      {
        day: 4,
        topic: weakestTopic,
        subtopics: ["Edge cases", "Optimization"],
      },
      {
        day: 5,
        topic: weakestTopic,
        subtopics: ["Mock interview"],
      },
    ];

  const previousTopicScores: Record<string, number> = {};

  Object.entries(topicHistory).forEach(([topic, values]) => {
    const sorted = [...values].sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() -
        new Date(b.updatedAt).getTime()
    );

    if (sorted.length >= 2) {
      previousTopicScores[topic] =
        sorted[sorted.length - 2].score;
    }
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b18] p-6 text-white">
        <div className="mx-auto max-w-7xl animate-pulse space-y-5">
          <div className="h-12 w-64 rounded-xl bg-white/10" />
          <div className="grid gap-5 md:grid-cols-3">
            <div className="h-52 rounded-3xl bg-white/10" />
            <div className="h-52 rounded-3xl bg-white/10" />
            <div className="h-52 rounded-3xl bg-white/10" />
          </div>
          <div className="h-96 rounded-3xl bg-white/10" />
        </div>
      </main>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#070b18] text-white">
      {/* Sidebar / top nav */}
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#090d1d] p-5 lg:block">
          <div className="mb-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-black">
                P
              </div>

              <div>
                <div className="font-black">
                  PrepPilot
                </div>
                <div className="text-xs text-slate-500">
                  AI Placement Coach
                </div>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            <button className="w-full rounded-xl bg-indigo-500/10 px-4 py-3 text-left text-sm font-semibold text-indigo-300">
              Dashboard
            </button>

            <button
              onClick={() => router.push("/interview")}
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-slate-400 hover:bg-white/5 hover:text-white"
            >
              New Interview
            </button>

            <button
              onClick={() =>
                router.push(
                  `/practice/${encodeURIComponent(
                    weakestTopic
                  )}`
                )
              }
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Practice
            </button>
          </nav>

          <div className="mt-auto pt-20">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">
                Placement goal
              </p>

              <p className="mt-2 text-sm font-semibold">
                Keep improving every interview.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Mobile/top header */}
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b18]/90 px-5 py-4 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                  PrepPilot AI
                </p>
                <h1 className="text-xl font-black">
                  Your Placement Dashboard
                </h1>
              </div>

              <button
                onClick={() => router.push("/interview")}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500"
              >
                + New Interview
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-6 p-5 md:p-8">
            {/* Welcome */}
            <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-sm text-slate-500">
                  Welcome back
                </p>

                <h2 className="mt-1 text-3xl font-black md:text-4xl">
                  {student.name.split(" ")[0]} 👋
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Let&apos;s turn your weak areas into placement
                  strengths.
                </p>
              </div>

              <div className="flex gap-2 text-xs text-slate-500">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  {student.branch || "CSE"}
                </span>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  Year {student.year || 3}
                </span>
              </div>
            </section>

            {/* Main metrics */}
            <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr_1fr]">
              {/* Readiness */}
              <div className="relative overflow-hidden rounded-[28px] border border-indigo-400/20 bg-gradient-to-br from-indigo-600/25 via-violet-600/10 to-white/[0.03] p-6">
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                        Placement readiness
                      </p>

                      <h3 className="mt-2 text-5xl font-black">
                        {Math.round(readiness)}
                        <span className="text-xl text-slate-500">
                          /100
                        </span>
                      </h3>
                    </div>

                    <div className="rounded-xl bg-indigo-500/10 px-3 py-2 text-xs text-indigo-300">
                      {latestReport.readyLevel ||
                        (readiness >= 85
                          ? "Placement ready"
                          : readiness >= 70
                          ? "Almost ready"
                          : readiness >= 50
                          ? "Getting there"
                          : "Not ready yet")}
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="h-3 rounded-full bg-black/30">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                        style={{
                          width: `${Math.min(
                            readiness,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="mt-3 flex justify-between text-xs text-slate-500">
                      <span>Needs work</span>
                      <span>Placement ready</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interviews */}
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Interviews completed
                </p>

                <p className="mt-4 text-5xl font-black">
                  {sortedInterviews.length}
                </p>

                <p className="mt-3 text-sm text-slate-400">
                  Every interview makes the next one more targeted.
                </p>

                <button
                  onClick={() => router.push("/interview")}
                  className="mt-6 text-sm font-bold text-indigo-300"
                >
                  Start next interview →
                </button>
              </div>

              {/* Weak topic */}
              <div className="rounded-[28px] border border-red-500/10 bg-red-500/[0.03] p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Focus area
                </p>

                <p className="mt-4 text-3xl font-black">
                  {weakestTopic}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Your lowest-performing topic right now.
                </p>

                <button
                  onClick={() =>
                    router.push(
                      `/practice/${encodeURIComponent(
                        weakestTopic
                      )}`
                    )
                  }
                  className="mt-6 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300"
                >
                  Practice now →
                </button>
              </div>
            </section>

            {/* Trend + Loop */}
            <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      Readiness over time
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Your measured improvement across interviews.
                    </p>
                  </div>

                  {sortedInterviews.length >= 2 && (
                    <span className="text-sm font-bold text-emerald-400">
                      {Math.round(
                        (sortedInterviews[
                          sortedInterviews.length - 1
                        ].overallScore || 0) -
                          (sortedInterviews[0]
                            .overallScore || 0)
                      )}
                      pts
                    </span>
                  )}
                </div>

                <div className="mt-6 h-72">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.06)"
                        />

                        <XAxis
                          dataKey="attempt"
                          stroke="#64748b"
                          fontSize={12}
                        />

                        <YAxis
                          domain={[0, 100]}
                          stroke="#64748b"
                          fontSize={12}
                        />

                        <Tooltip
                          contentStyle={{
                            background:
                              "#0f172a",
                            border:
                              "1px solid rgba(255,255,255,.1)",
                            borderRadius: 12,
                            color: "#fff",
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#818cf8"
                          strokeWidth={4}
                          dot={{
                            r: 5,
                            fill: "#818cf8",
                          }}
                          activeDot={{
                            r: 7,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Complete your first interview to see progress.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-xl font-bold">
                  The PrepPilot Loop
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your preparation cycle.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    ["01", "Interview", "Realistic interview"],
                    ["02", "Diagnose", "Find exact weaknesses"],
                    ["03", "Train", "Targeted practice"],
                    ["04", "Re-test", "Same weakness again"],
                    ["05", "Improve", "Measure progress"],
                  ].map(([num, title, text]) => (
                    <div
                      key={num}
                      className="flex gap-3 rounded-2xl border border-white/10 bg-black/10 p-3"
                    >
                      <span className="text-xs font-bold text-indigo-300">
                        {num}
                      </span>

                      <div>
                        <p className="text-sm font-semibold">
                          {title}
                        </p>

                        <p className="text-xs text-slate-500">
                          {text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Topics */}
            <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    Skill performance
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your latest topic scores and improvement.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {topicEntries.map(([topic, score]) => {
                  const previous =
                    previousTopicScores[topic];

                  const delta =
                    previous !== undefined
                      ? score - previous
                      : null;

                  return (
                    <div
                      key={topic}
                      className="rounded-2xl border border-white/10 bg-black/10 p-5"
                    >
                      <div className="flex justify-between">
                        <span className="font-semibold">
                          {topic}
                        </span>

                        <div className="flex items-center gap-2">
                          {delta !== null && (
                            <span
                              className={`text-xs font-bold ${
                                delta >= 0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {delta >= 0 ? "↑" : "↓"}{" "}
                              {Math.abs(
                                Math.round(delta)
                              )}
                            </span>
                          )}

                          <span className="font-black">
                            {Math.round(score)}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 h-2 rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${
                            score < 60
                              ? "bg-red-500"
                              : score < 75
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              score,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      {score < 60 && (
                        <button
                          onClick={() =>
                            router.push(
                              `/practice/${encodeURIComponent(
                                topic
                              )}`
                            )
                          }
                          className="mt-3 text-xs font-semibold text-indigo-300"
                        >
                          Fix this weakness →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Weakness + Resume */}
            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-[28px] border border-red-500/15 bg-red-500/[0.03] p-6">
                <h3 className="text-xl font-bold">
                  Top 3 weaknesses
                </h3>

                <div className="mt-5 space-y-3">
                  {(latestReport.top3Weaknesses ||
                    weakTopics).map(
                    (weakness: string, index: number) => (
                      <div
                        key={index}
                        className="flex gap-4 rounded-2xl border border-white/10 bg-black/10 p-4"
                      >
                        <span className="font-black text-red-400">
                          0{index + 1}
                        </span>

                        <p className="text-sm text-slate-300">
                          {weakness}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-amber-500/15 bg-amber-500/[0.03] p-6">
                <h3 className="text-xl font-bold">
                  Resume skill gap
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Does your interview performance match your resume?
                </p>

                <div className="mt-5 space-y-3">
                  {(latestReport.resumeTruthCheck ||
                    []).slice(0, 3).map(
                    (
                      claim: any,
                      index: number
                    ) => {
                      const gap =
                        claim.demonstratedLevel !==
                        claim.claimedLevel;

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 p-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {claim.claim}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {claim.claimedLevel} →{" "}
                              {claim.demonstratedLevel}
                            </p>
                          </div>

                          <span>
                            {gap ? "⚠️" : "✓"}
                          </span>
                        </div>
                      );
                    }
                  )}

                  {(!latestReport.resumeTruthCheck ||
                    latestReport.resumeTruthCheck.length ===
                      0) && (
                    <p className="text-sm text-slate-500">
                      Resume analysis will appear after your interview.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Study Plan */}
            <section className="rounded-[28px] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.08] to-transparent p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                    Personalized plan
                  </p>

                  <h3 className="mt-2 text-2xl font-black">
                    5-Day Weakness Fix
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    AI-generated from your latest diagnosis.
                  </p>
                </div>

                <button
                  onClick={() =>
                    router.push(
                      `/practice/${encodeURIComponent(
                        weakestTopic
                      )}`
                    )
                  }
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold hover:bg-indigo-500"
                >
                  Start Practice
                </button>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-5">
                {plan.slice(0, 5).map((day: any) => (
                  <div
                    key={day.day}
                    className="rounded-2xl border border-white/10 bg-black/10 p-4"
                  >
                    <p className="text-xs font-bold text-indigo-300">
                      DAY {day.day}
                    </p>

                    <p className="mt-2 font-bold">
                      {day.topic}
                    </p>

                    <div className="mt-3 space-y-1">
                      {(day.subtopics || [])
                        .slice(0, 3)
                        .map(
                          (
                            item: string,
                            index: number
                          ) => (
                            <p
                              key={index}
                              className="text-xs text-slate-500"
                            >
                              • {item}
                            </p>
                          )
                        )}
                    </div>

                    <button
                      onClick={() =>
                        router.push(
                          `/practice/${encodeURIComponent(
                            day.topic
                          )}`
                        )
                      }
                      className="mt-4 text-xs font-bold text-indigo-300"
                    >
                      Practice →
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom CTA */}
            <section className="rounded-[32px] border border-white/10 bg-gradient-to-r from-indigo-600/20 via-violet-600/10 to-transparent p-7 text-center">
              <h3 className="text-2xl font-black">
                Ready to beat your last score?
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
                Your next interview will remember your weak topics and
                challenge you where you need improvement.
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => router.push("/interview")}
                  className="rounded-xl bg-indigo-600 px-6 py-3 font-bold"
                >
                  Take New Interview
                </button>

                <button
                  onClick={() =>
                    router.push(
                      `/practice/${encodeURIComponent(
                        weakestTopic
                      )}`
                    )
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-bold"
                >
                  Practice {weakestTopic}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}