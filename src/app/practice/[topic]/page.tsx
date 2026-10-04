"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PracticeQuestion = {
  id: string;
  question: string;
  options?: string[];
  hint?: string;
  explanation?: string;
  modelAnswer?: string;
};

type Evaluation = {
  score: number;
  mainIssue?: string;
  betterAnswer?: string;
  tips?: string[];
};

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();

  const topic = decodeURIComponent(params.topic as string);

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] =
    useState<Evaluation | null>(null);

  const [scores, setScores] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/practice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic,
            level: "Intermediate",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to generate practice");
        }

        setQuestions(data.questions || []);
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Practice generation failed"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [topic]);

  async function submitAnswer() {
    if (!answer.trim()) return;

    const question = questions[current];

    setEvaluating(true);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.question,
          answer,
          topic,
          languageMode: "English",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Evaluation failed");
      }

      setEvaluation(data);
      setScores((prev) => [...prev, Number(data.score)]);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Evaluation failed"
      );
    } finally {
      setEvaluating(false);
    }
  }

  function nextQuestion() {
    if (current === questions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrent((prev) => prev + 1);
    setAnswer("");
    setEvaluation(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b18] p-6 text-white">
        <div className="mx-auto max-w-3xl animate-pulse">
          <div className="h-8 w-56 rounded bg-white/10" />
          <div className="mt-6 h-72 rounded-3xl bg-white/10" />
        </div>
      </main>
    );
  }

  if (finished) {
    const average =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

    return (
      <main className="min-h-screen bg-[#070b18] px-5 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-indigo-600/20 to-violet-600/5 p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-4xl">
              ✓
            </div>

            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-indigo-300">
              Practice completed
            </p>

            <h1 className="mt-2 text-4xl font-black">
              {topic} Practice
            </h1>

            <div className="mt-8 text-6xl font-black text-indigo-300">
              {average.toFixed(1)}
              <span className="text-xl text-slate-500">
                /10
              </span>
            </div>

            <p className="mt-3 text-slate-400">
              You completed {questions.length} targeted questions.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => router.push("/interview")}
                className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold"
              >
                Take Re-test Interview
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const question = questions[current];

  if (!question) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#070b18] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-5 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                Targeted Practice
              </p>

              <h1 className="text-xl font-bold">
                {topic}
              </h1>
            </div>

            <span className="text-sm text-slate-400">
              {current + 1} / {questions.length}
            </span>
          </div>

          <div className="mt-4 h-1.5 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{
                width: `${
                  ((current + 1) / questions.length) * 100
                }%`,
              }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-7 shadow-2xl md:p-10">
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            Question {current + 1}
          </span>

          <h2 className="mt-6 text-2xl font-bold leading-relaxed md:text-3xl">
            {question.question}
          </h2>

          {question.hint && (
            <p className="mt-4 text-sm text-slate-500">
              Hint: {question.hint}
            </p>
          )}

          <textarea
            value={answer}
            disabled={!!evaluation}
            onChange={(e) => setAnswer(e.target.value)}
            rows={8}
            placeholder="Write your answer here..."
            className="mt-8 w-full rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-6 outline-none focus:border-indigo-400 disabled:opacity-60"
          />

          {!evaluation ? (
            <button
              disabled={evaluating || !answer.trim()}
              onClick={submitAnswer}
              className="mt-5 w-full rounded-2xl bg-indigo-600 py-4 font-bold shadow-lg shadow-indigo-950/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {evaluating ? "AI is evaluating..." : "Submit Answer"}
            </button>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-5">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  AI Score
                </p>

                <div className="mt-1 text-4xl font-black text-indigo-300">
                  {Number(evaluation.score).toFixed(1)}
                  <span className="text-base text-slate-500">
                    /10
                  </span>
                </div>

                {evaluation.mainIssue && (
                  <p className="mt-3 text-sm text-slate-300">
                    {evaluation.mainIssue}
                  </p>
                )}
              </div>

              {evaluation.betterAnswer && (
                <details className="rounded-2xl border border-white/10 p-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    See better answer
                  </summary>

                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    {evaluation.betterAnswer}
                  </p>
                </details>
              )}

              {Array.isArray(evaluation.tips) &&
                evaluation.tips.length > 0 && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                    <p className="font-semibold text-emerald-300">
                      Improve this answer
                    </p>

                    <div className="mt-2 space-y-1 text-sm text-slate-400">
                      {evaluation.tips
                        .slice(0, 3)
                        .map((tip, index) => (
                          <p key={index}>• {tip}</p>
                        ))}
                    </div>
                  </div>
                )}

              <button
                onClick={nextQuestion}
                className="w-full rounded-2xl bg-white py-4 font-bold text-slate-950 hover:bg-slate-200"
              >
                {current === questions.length - 1
                  ? "Finish Practice"
                  : "Next Question →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}