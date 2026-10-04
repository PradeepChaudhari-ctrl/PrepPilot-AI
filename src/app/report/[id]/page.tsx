"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Breakdown = {
  correctness?: number;
  relevance?: number;
  structure?: number;
  depth?: number;
  communication?: number;
};

type Answer = {
  id: string;
  round?: string;
  question?: string;
  answer?: string;
  topic?: string;
  score?: number;
  breakdownJson?: string;
  feedbackJson?: string;
  retryAnswer?: string | null;
  retryScore?: number | null;
};

type ResumeTruthCheck = {
  claim?: string;
  claimedLevel?: string;
  demonstratedLevel?: string;
  gap?: unknown;
  comment?: string;
};

type StudyDay = {
  day?: number;
  topic?: string;
  subtopic?: string;
  action?: string;
};

type ReportData = {
  readinessScore?: number;
  topicScores?: unknown;
  weakTopics?: unknown;
  top3Weaknesses?: unknown;
  resumeTruthCheck?: unknown;
  studyPlan?: unknown;
};

type InterviewData = {
  id: string;
  createdAt?: string;
  overallScore?: number;
  reportJson?: string | null;
  answers?: Answer[];
};

type ApiResponse = {
  interview?: InterviewData;
  report?: ReportData;
  answers?: Answer[];
};

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;

  if (typeof value === "object") {
    return value as T;
  }

  if (typeof value !== "string") return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getReadyLabel(score: number) {
  if (score < 50) return "Not ready yet";
  if (score < 70) return "Getting there";
  if (score < 85) return "Almost ready";
  return "Placement ready";
}

function getScoreClass(score: number) {
  if (score < 60) return "text-red-400";
  if (score < 75) return "text-amber-300";
  return "text-emerald-400";
}

function normalizeTopicScores(value: unknown): Array<[string, number]> {
  if (!value) return [];

  /*
   * Format 1:
   * [
   *   { topic: "SQL", score: 45 },
   *   { topic: "DBMS", score: 50 }
   * ]
   */
  if (Array.isArray(value)) {
    return value
      .map((item: unknown, index: number) => {
        if (Array.isArray(item)) {
          const topic = safeString(item[0], `Topic ${index + 1}`);
          const score = safeNumber(item[1]);
          return [topic, score] as [string, number];
        }

        if (typeof item === "object" && item !== null) {
          const record = item as Record<string, unknown>;

          const topic = safeString(
            record.topic ??
              record.name ??
              record.title ??
              record.skill ??
              `Topic ${index + 1}`
          );

          const score = safeNumber(
            record.score ??
              record.value ??
              record.percentage ??
              record.topicScore
          );

          return [topic, score] as [string, number];
        }

        return [
          safeString(item, `Topic ${index + 1}`),
          0,
        ] as [string, number];
      })
      .filter(([topic]) => topic.trim().length > 0);
  }

  /*
   * Format 2:
   * {
   *   SQL: 45,
   *   DBMS: 50,
   *   DSA: 55
   * }
   */
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(
      ([topic, score]) => [topic, safeNumber(score)]
    );
  }

  return [];
}

function normalizeWeakTopics(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;

        if (typeof item === "object" && item !== null) {
          const record = item as Record<string, unknown>;
          return safeString(
            record.topic ?? record.name ?? record.title ?? ""
          );
        }

        return safeString(item);
      })
      .filter(Boolean);
  }

  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>);
  }

  return [safeString(value)].filter(Boolean);
}

function normalizeWeaknesses(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;

        if (typeof item === "object" && item !== null) {
          const record = item as Record<string, unknown>;

          return safeString(
            record.problem ??
              record.issue ??
              record.description ??
              record.text ??
              record.weakness ??
              ""
          );
        }

        return safeString(item);
      })
      .filter(Boolean)
      .slice(0, 3);
  }

  return [safeString(value)].filter(Boolean).slice(0, 3);
}

function normalizeTruthChecks(value: unknown): ResumeTruthCheck[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    if (typeof item !== "object" || item === null) {
      return {
        claim: safeString(item),
      };
    }

    const record = item as Record<string, unknown>;

    return {
      claim: safeString(
        record.claim ??
          record.resumeClaim ??
          record.text ??
          ""
      ),
      claimedLevel: safeString(
        record.claimedLevel ??
          record.claimed ??
          record.level ??
          ""
      ),
      demonstratedLevel: safeString(
        record.demonstratedLevel ??
          record.demonstrated ??
          record.actualLevel ??
          ""
      ),
      gap: record.gap,
      comment: safeString(
        record.comment ??
          record.aiComment ??
          record.explanation ??
          ""
      ),
    };
  });
}

function normalizeStudyPlan(value: unknown): StudyDay[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 5).map((item, index) => {
    if (typeof item === "string") {
      return {
        day: index + 1,
        subtopic: item,
      };
    }

    if (typeof item === "object" && item !== null) {
      const record = item as Record<string, unknown>;

      return {
        day: safeNumber(record.day, index + 1),
        topic: safeString(record.topic ?? ""),
        subtopic: safeString(
          record.subtopic ??
            record.subTopic ??
            record.focus ??
            ""
        ),
        action: safeString(
          record.action ??
            record.practice ??
            record.description ??
            ""
        ),
      };
    }

    return {
      day: index + 1,
    };
  });
}

function parseBreakdown(answer: Answer): Breakdown {
  return parseJson<Breakdown>(answer.breakdownJson, {});
}

function parseFeedback(answer: Answer): Record<string, unknown> {
  return parseJson<Record<string, unknown>>(
    answer.feedbackJson,
    {}
  );
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();

  const interviewId = safeString(params?.id);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [retryOpen, setRetryOpen] = useState<string | null>(null);
  const [retryText, setRetryText] = useState("");
  const [retryLoading, setRetryLoading] = useState(false);

  useEffect(() => {
    if (!interviewId) return;

    async function loadReport() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/interview/${interviewId}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load interview report.");
        }

        const json = (await response.json()) as ApiResponse;

        setData(json);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading the report."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [interviewId]);

  const interview = data?.interview;

  const report = useMemo<ReportData>(() => {
    if (data?.report) return data.report;

    return parseJson<ReportData>(
      interview?.reportJson,
      {}
    );
  }, [data?.report, interview?.reportJson]);

  const answers = useMemo<Answer[]>(() => {
    if (Array.isArray(data?.answers)) {
      return data.answers;
    }

    if (Array.isArray(interview?.answers)) {
      return interview.answers;
    }

    return [];
  }, [data?.answers, interview?.answers]);

  const readinessScore = safeNumber(
    report.readinessScore ?? interview?.overallScore
  );

  const topicEntries = useMemo(
    () => normalizeTopicScores(report.topicScores),
    [report.topicScores]
  );

  const weakTopics = useMemo(
    () => normalizeWeakTopics(report.weakTopics),
    [report.weakTopics]
  );

  const weaknesses = useMemo(
    () => normalizeWeaknesses(report.top3Weaknesses),
    [report.top3Weaknesses]
  );

  const truthChecks = useMemo(
    () => normalizeTruthChecks(report.resumeTruthCheck),
    [report.resumeTruthCheck]
  );

  const studyPlan = useMemo(
    () => normalizeStudyPlan(report.studyPlan),
    [report.studyPlan]
  );

  const retryAnswer = async (answer: Answer) => {
    if (!retryText.trim()) return;

    try {
      setRetryLoading(true);

      const response = await fetch("/api/answer/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answerId: answer.id,
          answer: retryText.trim(),
          question: answer.question,
          topic: answer.topic,
          languageMode: "English",
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.error || "Retry evaluation failed."
        );
      }

      setData((current) => {
        if (!current) return current;

        const updatedAnswers = answers.map((item) =>
          item.id === answer.id
            ? {
                ...item,
                retryAnswer: retryText.trim(),
                retryScore: safeNumber(
                  json?.score ?? json?.evaluation?.score
                ),
              }
            : item
        );

        return {
          ...current,
          answers: updatedAnswers,
        };
      });

      setRetryText("");
      setRetryOpen(null);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Unable to evaluate retry."
      );
    } finally {
      setRetryLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070914] text-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-10 w-80 animate-pulse rounded bg-white/10" />

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="h-48 animate-pulse rounded-3xl bg-white/5 lg:col-span-2" />
            <div className="h-48 animate-pulse rounded-3xl bg-white/5" />
          </div>

          <div className="mt-8 h-80 animate-pulse rounded-3xl bg-white/5" />
        </div>
      </main>
    );
  }

  if (error || !data || !interview) {
    return (
      <main className="min-h-screen bg-[#070914] text-white">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
          <div className="w-full rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-red-300">
              Report unavailable
            </p>

            <h1 className="mt-3 text-2xl font-bold">
              We couldn't load this interview.
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              {error || "The interview report could not be found."}
            </p>

            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold hover:bg-indigo-500"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  const progress = Math.max(
    0,
    Math.min(100, readinessScore)
  );

  return (
    <main className="min-h-screen bg-[#070914] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#070914]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-300">
              PREPPILOT AI
            </p>

            <h1 className="mt-1 text-xl font-bold">
              Interview Diagnosis
            </h1>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
          >
            Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Hero */}
        <section className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="overflow-hidden rounded-3xl border border-indigo-400/10 bg-gradient-to-br from-indigo-950/80 via-[#12132b] to-[#0d1020] p-7">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
                  Placement readiness
                </p>

                <div className="mt-3 flex items-end gap-2">
                  <span className="text-6xl font-black tracking-tight">
                    {Math.round(readinessScore)}
                  </span>

                  <span className="mb-2 text-lg text-slate-500">
                    /100
                  </span>
                </div>

                <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {getReadyLabel(readinessScore)}
                </div>
              </div>

              {/* Gauge */}
              <div className="relative h-36 w-36 shrink-0">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(#6366f1 ${progress}%, rgba(255,255,255,0.08) ${progress}% 100%)`,
                  }}
                />

                <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-[#111326]">
                  <span className="text-2xl font-bold">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-2 flex justify-between text-xs text-slate-500">
                <span>Needs work</span>
                <span>Placement ready</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const firstWeak =
                    weakTopics[0] ||
                    topicEntries.find(
                      ([, score]) => score < 60
                    )?.[0];

                  if (firstWeak) {
                    router.push(
                      `/practice/${encodeURIComponent(firstWeak)}`
                    );
                  }
                }}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold shadow-lg shadow-indigo-950/30 hover:bg-indigo-500"
              >
                Practice Weak Topic
              </button>

              <button
                onClick={() => router.push("/interview")}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                Take New Interview
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="rounded-3xl border border-white/5 bg-[#10121d] p-7">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Interview snapshot
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">
                  Questions
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {answers.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">
                  Weak topics
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {weakTopics.length ||
                    topicEntries.filter(
                      ([, score]) => score < 60
                    ).length}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">
                Interview date
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-200">
                {interview.createdAt
                  ? new Date(
                      interview.createdAt
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Recent attempt"}
              </p>
            </div>
          </div>
        </section>

        {/* Improvement loop */}
        <section className="mt-6 rounded-3xl border border-white/5 bg-[#10121d] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
            Your improvement loop
          </p>

          <div className="mt-4 grid gap-2 md:grid-cols-5">
            {[
              ["01", "Interview", "Realistic interview"],
              ["02", "Diagnose", "Find exact weaknesses"],
              ["03", "Practice", "Targeted practice"],
              ["04", "Re-test", "Same weakness again"],
              ["05", "Improve", "Measure progress"],
            ].map(([number, title, subtitle], index) => (
              <div
                key={number}
                className={`rounded-2xl border p-4 ${
                  index === 1
                    ? "border-indigo-400/20 bg-indigo-500/10"
                    : "border-white/5 bg-white/[0.02]"
                }`}
              >
                <p className="text-[10px] font-bold text-indigo-300">
                  {number}
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {subtitle}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Topic performance */}
        <section className="mt-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
              Skill diagnosis
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Topic performance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Weak topics below 60% need focused practice.
            </p>
          </div>

          {topicEntries.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-white/5 bg-[#10121d] p-8 text-center text-sm text-slate-500">
              No topic scores available for this interview.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {topicEntries.map(([topic, score]) => {
                const numericScore = Math.max(
                  0,
                  Math.min(100, safeNumber(score))
                );

                const weak = numericScore < 60;

                return (
                  <div
                    key={topic}
                    className={`rounded-2xl border p-5 ${
                      weak
                        ? "border-red-500/10 bg-red-500/[0.025]"
                        : "border-white/5 bg-[#10121d]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-100">
                          {topic}
                        </p>

                        {weak && (
                          <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider text-red-400">
                            Needs practice
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-xl font-bold ${getScoreClass(
                          numericScore
                        )}`}
                      >
                        {Math.round(numericScore)}%
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${
                          weak
                            ? "bg-red-500"
                            : numericScore < 75
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                        }`}
                        style={{
                          width: `${numericScore}%`,
                        }}
                      />
                    </div>

                    <button
                      onClick={() =>
                        router.push(
                          `/practice/${encodeURIComponent(topic)}`
                        )
                      }
                      className="mt-4 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                    >
                      Practice this topic →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Weaknesses */}
        <section className="mt-8 rounded-3xl border border-red-500/10 bg-gradient-to-br from-red-500/[0.05] to-[#10121d] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">
            Your top 3 weaknesses
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            You didn't fail.
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            You have specific problems to work on.
          </p>

          {weaknesses.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-sm text-slate-400">
              No weakness summary was generated for this attempt.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {weaknesses.map((weakness, index) => (
                <div
                  key={`${index}-${weakness}`}
                  className="rounded-2xl border border-white/5 bg-black/10 p-5"
                >
                  <p className="text-3xl font-black text-red-400">
                    {String(index + 1).padStart(2, "0")}
                  </p>

                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    {weakness}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Resume Truth Check */}
        <section className="mt-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
              Resume verification
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Resume Truth Check
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              What you claimed vs what you demonstrated.
            </p>
          </div>

          {truthChecks.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-white/5 bg-[#10121d] p-8 text-sm text-slate-500">
              No resume claims were available for this interview.
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-3xl border border-white/5 bg-[#10121d]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="border-b border-white/5 bg-white/[0.02]">
                    <tr>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Resume claim
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Claimed
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Demonstrated
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Gap
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        AI comment
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {truthChecks.map((claim, index) => {
                      const claimedLevel = safeString(
                        claim.claimedLevel,
                        "Not specified"
                      );

                      const demonstratedLevel =
                        safeString(
                          claim.demonstratedLevel,
                          "Not demonstrated"
                        );

                      const gapValue = safeString(
                        claim.gap
                      );

                      const lowerGap =
                        gapValue.toLowerCase();

                      const hasGap =
                        lowerGap.includes("gap") ||
                        lowerGap.includes("true") ||
                        lowerGap.includes("yes") ||
                        (demonstratedLevel !==
                          "Not demonstrated" &&
                          claimedLevel.toLowerCase() !==
                            demonstratedLevel.toLowerCase());

                      return (
                        <tr
                          key={index}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="px-5 py-5 align-top">
                            <p className="max-w-xs text-sm leading-6 text-slate-200">
                              {safeString(
                                claim.claim,
                                "Resume claim"
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                              {claimedLevel}
                            </span>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                              {demonstratedLevel}
                            </span>
                          </td>

                          <td className="px-5 py-5 align-top">
                            {hasGap ? (
                              <span className="font-semibold text-amber-300">
                                ⚠️ Gap
                              </span>
                            ) : (
                              <span className="font-semibold text-emerald-400">
                                ✓ Aligned
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="max-w-xs text-sm leading-6 text-slate-400">
                              {safeString(
                                claim.comment,
                                "No additional comment."
                              )}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Answer diagnosis */}
        <section className="mt-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
              Answer-by-answer diagnosis
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              What happened in the interview?
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Understand exactly why each answer received its score.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {answers.map((answer, index) => {
              const score = safeNumber(answer.score);
              const breakdown = parseBreakdown(answer);
              const feedback = parseFeedback(answer);

              const problems = Array.isArray(
                feedback.problems
              )
                ? feedback.problems
                    .map((item) => safeString(item))
                    .filter(Boolean)
                    .slice(0, 3)
                : [];

              const betterAnswer = safeString(
                feedback.betterAnswer ??
                  feedback.modelAnswer ??
                  ""
              );

              const englishRewrite = safeString(
                feedback.englishRewrite ??
                  ""
              );

              const tips = Array.isArray(feedback.tips)
                ? feedback.tips
                    .map((item) => safeString(item))
                    .filter(Boolean)
                    .slice(0, 3)
                : [];

              return (
                <article
                  key={answer.id || index}
                  className="rounded-3xl border border-white/5 bg-[#10121d] p-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                          Question {index + 1}
                        </span>

                        {answer.round && (
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-500">
                            {answer.round}
                          </span>
                        )}

                        {answer.topic && (
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                            {answer.topic}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 text-lg font-semibold leading-7">
                        {safeString(
                          answer.question,
                          "Interview question"
                        )}
                      </h3>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-3 text-center">
                      <p className="text-3xl font-black">
                        {Math.round(score)}
                      </p>

                      <p className="text-xs text-slate-500">
                        /10
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/5 bg-black/10 p-5">
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      Your answer
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                      {safeString(
                        answer.answer,
                        "No answer recorded."
                      )}
                    </p>
                  </div>

                  <details className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                    <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-slate-200">
                      Why this score?
                    </summary>

                    <div className="border-t border-white/5 p-5">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {[
                          [
                            "Correctness",
                            breakdown.correctness,
                          ],
                          [
                            "Relevance",
                            breakdown.relevance,
                          ],
                          [
                            "Structure",
                            breakdown.structure,
                          ],
                          [
                            "Technical Depth",
                            breakdown.depth,
                          ],
                          [
                            "Communication",
                            breakdown.communication,
                          ],
                        ].map(([label, value]) => {
                          const itemScore = safeNumber(value);

                          return (
                            <div
                              key={String(label)}
                              className="rounded-xl border border-white/5 bg-black/10 p-3"
                            >
                              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                                {label}
                              </p>

                              <p className="mt-2 text-xl font-bold">
                                {Math.round(
                                  itemScore
                                )}
                                /10
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 rounded-xl bg-indigo-500/5 p-4">
                        <p className="text-xs uppercase tracking-wider text-indigo-300">
                          Main issue
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {safeString(
                            feedback.mainIssue,
                            "Keep improving clarity, depth and structure."
                          )}
                        </p>
                      </div>
                    </div>
                  </details>

                  {problems.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-5">
                      <p className="text-xs uppercase tracking-wider text-red-300">
                        What's wrong
                      </p>

                      <ul className="mt-3 space-y-2">
                        {problems.map((problem, problemIndex) => (
                          <li
                            key={problemIndex}
                            className="flex gap-2 text-sm leading-6 text-slate-300"
                          >
                            <span className="text-red-400">
                              •
                            </span>

                            <span>{problem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {betterAnswer && (
                      <details className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03]">
                        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-emerald-300">
                          Show better answer
                        </summary>

                        <div className="border-t border-white/5 p-5">
                          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                            {betterAnswer}
                          </p>
                        </div>
                      </details>
                    )}

                    {englishRewrite && (
                      <details className="rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.03]">
                        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-indigo-300">
                          English rewrite
                        </summary>

                        <div className="border-t border-white/5 p-5">
                          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                            {englishRewrite}
                          </p>

                          {tips.length > 0 && (
                            <div className="mt-4">
                              <p className="text-xs uppercase tracking-wider text-indigo-300">
                                Tips
                              </p>

                              <ul className="mt-2 space-y-2">
                                {tips.map((tip, tipIndex) => (
                                  <li
                                    key={tipIndex}
                                    className="text-sm text-slate-400"
                                  >
                                    • {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>

                  {/* Retry */}
                  <div className="mt-4">
                    {answer.retryScore !== null &&
                    answer.retryScore !== undefined ? (
                      <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.04] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-emerald-300">
                              Re-test result
                            </p>

                            <p className="mt-2 text-sm text-slate-300">
                              Previous score:{" "}
                              <strong>
                                {Math.round(score)}/10
                              </strong>
                              {" → "}
                              <strong className="text-emerald-400">
                                {Math.round(
                                  safeNumber(
                                    answer.retryScore
                                  )
                                )}
                                /10
                              </strong>
                            </p>
                          </div>

                          {safeNumber(
                            answer.retryScore
                          ) > score && (
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                              Improvement ↑
                            </span>
                          )}
                        </div>
                      </div>
                    ) : retryOpen === answer.id ? (
                      <div className="rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.03] p-5">
                        <p className="text-sm font-semibold">
                          Try the same question again
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Improve your answer and see whether your score increases.
                        </p>

                        <textarea
                          value={retryText}
                          onChange={(event) =>
                            setRetryText(event.target.value)
                          }
                          rows={5}
                          placeholder="Write your improved answer..."
                          className="mt-4 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500/50"
                        />

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            disabled={
                              retryLoading ||
                              !retryText.trim()
                            }
                            onClick={() =>
                              retryAnswer(answer)
                            }
                            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {retryLoading
                              ? "Evaluating..."
                              : "Submit improved answer"}
                          </button>

                          <button
                            onClick={() => {
                              setRetryOpen(null);
                              setRetryText("");
                            }}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setRetryOpen(answer.id);
                          setRetryText("");
                        }}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Study plan */}
        <section className="mt-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
              Personalized training
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Your 5-day weakness fix
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Turn diagnosis into focused practice.
            </p>
          </div>

          {studyPlan.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-white/5 bg-[#10121d] p-8 text-sm text-slate-500">
              No study plan is available for this attempt.
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-5">
              {studyPlan.map((day, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/5 bg-[#10121d] p-5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-sm font-bold text-indigo-300">
                    {day.day || index + 1}
                  </div>

                  <p className="mt-4 text-sm font-semibold">
                    {day.topic ||
                      day.subtopic ||
                      `Day ${index + 1}`}
                  </p>

                  {day.subtopic &&
                    day.topic && (
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {day.subtopic}
                      </p>
                    )}

                  {day.action && (
                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      {day.action}
                    </p>
                  )}

                  {(day.topic || day.subtopic) && (
                    <button
                      onClick={() => {
                        const topic =
                          day.topic ||
                          weakTopics[0] ||
                          topicEntries[0]?.[0];

                        if (topic) {
                          router.push(
                            `/practice/${encodeURIComponent(
                              topic
                            )}`
                          );
                        }
                      }}
                      className="mt-4 text-xs font-semibold text-indigo-300"
                    >
                      Practice →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="mt-8 mb-12 overflow-hidden rounded-3xl border border-indigo-400/10 bg-gradient-to-r from-indigo-950/70 to-violet-950/50 p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
                Next step
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Don't just read the feedback.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Practice your weakest topic, then take another interview
                and measure the improvement.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const topic =
                    weakTopics[0] ||
                    topicEntries.find(
                      ([, score]) => score < 60
                    )?.[0] ||
                    topicEntries[0]?.[0];

                  if (topic) {
                    router.push(
                      `/practice/${encodeURIComponent(topic)}`
                    );
                  }
                }}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold hover:bg-indigo-500"
              >
                Practice Weak Topic
              </button>

              <button
                onClick={() => router.push("/interview")}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
              >
                Take New Interview
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}