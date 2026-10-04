"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredStudentId } from "@/lib/storage";

type QuestionData = {
  question: string;
  topic: string;
  round: string;
  isFollowUp: boolean;
  revisitingWeakTopic?: string;
};

type Evaluation = {
  score: number;
  breakdown: {
    correctness: number;
    relevance: number;
    structure: number;
    depth: number;
    communication: number;
  };
  mainIssue: string;
  problems: string[];
  betterAnswer: string;
  englishRewrite?: string;
  tips: string[];
};

const TOTAL_QUESTIONS = 9;

const ROUND_NAMES: Record<number, string> = {
  1: "Round 1 — Introduction",
  2: "Round 2 — Technical",
  3: "Round 3 — Project Deep Dive",
  4: "Round 4 — HR",
};

function getRound(questionNumber: number) {
  if (questionNumber === 1) return "Intro";
  if (questionNumber >= 2 && questionNumber <= 5) return "Technical";
  if (questionNumber >= 6 && questionNumber <= 7) return "Project";
  return "HR";
}

function getRoundName(questionNumber: number) {
  if (questionNumber === 1) return ROUND_NAMES[1];
  if (questionNumber >= 2 && questionNumber <= 5) return ROUND_NAMES[2];
  if (questionNumber >= 6 && questionNumber <= 7) return ROUND_NAMES[3];
  return ROUND_NAMES[4];
}

export default function InterviewPage() {
  const router = useRouter();

  const [student, setStudent] = useState<any>(null);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [answer, setAnswer] = useState("");

  const [questionNumber, setQuestionNumber] = useState(1);
  const [answers, setAnswers] = useState<any[]>([]);

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const [error, setError] = useState("");

  const [interviewId, setInterviewId] = useState("");

  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const studentId = getStoredStudentId();

    if (!studentId) {
      router.push("/onboarding");
      return;
    }

    loadStudent(studentId);
  }, [router]);

  async function loadStudent(studentId: string) {
    try {
      const response = await fetch(`/api/student?id=${studentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load profile");
      }

      setStudent(data.student);

      await loadQuestion(data.student, 1, []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your profile."
      );
    }
  }

  async function loadQuestion(
    studentData: any,
    number: number,
    history: any[]
  ) {
    setLoadingQuestion(true);
    setError("");
    setEvaluation(null);
    setAnswer("");

    try {
      const topicProgress = studentData.topicProgress || [];

      const resumeData = studentData.resumeAnalysisJson
        ? JSON.parse(studentData.resumeAnalysisJson)
        : null;

      const skills = studentData.skillsJson
        ? JSON.parse(studentData.skillsJson)
        : [];

      const response = await fetch("/api/question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: {
            name: studentData.name,
            email: studentData.email,
            branch: studentData.branch,
            year: studentData.year,
            skills,
            targetMode: studentData.targetMode,
            companyStyle: studentData.companyStyle,
            languageMode: studentData.languageMode,
            targetRole: studentData.targetRole,
          },
          resumeData,
          history,
          topicProgress,
          round: getRound(number),
          questionNumber: number,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate question");
      }

      setQuestion(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate interview question."
      );
    } finally {
      setLoadingQuestion(false);
    }
  }

  function startVoiceInput() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice input is not supported in this browser. Please type your answer."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang =
      student?.languageMode === "Hinglish" ? "hi-IN" : "en-IN";

    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";

      setAnswer((current) =>
        current ? `${current} ${transcript}` : transcript
      );
    };

    recognition.onerror = () => {
      setError("Could not capture voice. You can type your answer instead.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }

  async function submitAnswer() {
    if (!question) return;

    if (!answer.trim()) {
      setError("Please answer the question before continuing.");
      return;
    }

    setEvaluating(true);
    setError("");

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.question,
          answer: answer.trim(),
          topic: question.topic,
          languageMode: student?.languageMode || "English",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to evaluate answer");
      }

      setEvaluation(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to evaluate your answer."
      );
    } finally {
      setEvaluating(false);
    }
  }

  async function continueInterview() {
    if (!question || !evaluation) return;

    const currentAnswer = {
      round: question.round,
      question: question.question,
      answer: answer.trim(),
      topic: question.topic,
      score: evaluation.score,
      breakdown: evaluation.breakdown,
      feedback: {
        mainIssue: evaluation.mainIssue,
        problems: evaluation.problems,
        betterAnswer: evaluation.betterAnswer,
        englishRewrite: evaluation.englishRewrite,
        tips: evaluation.tips,
      },
    };

    const updatedAnswers = [...answers, currentAnswer];

    setAnswers(updatedAnswers);

    if (questionNumber >= TOTAL_QUESTIONS) {
      await finishInterview(updatedAnswers);
      return;
    }

    const nextNumber = questionNumber + 1;

    setQuestionNumber(nextNumber);

    await loadQuestion(student, nextNumber, updatedAnswers);
  }

  async function finishInterview(finalAnswers: any[]) {
    setFinishing(true);
    setError("");

    try {
      const studentId = getStoredStudentId();

      if (!studentId) {
        throw new Error("Student profile not found.");
      }

      const interviewResponse = await fetch("/api/interview/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          answers: finalAnswers,
        }),
      });

      const interviewData = await interviewResponse.json();

      if (!interviewResponse.ok) {
        throw new Error(
          interviewData.error || "Unable to save interview"
        );
      }

      const id = interviewData.interview.id;

      setInterviewId(id);

      const reportResponse = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewId: id,
        }),
      });

      const reportData = await reportResponse.json();

      if (!reportResponse.ok) {
        throw new Error(
          reportData.error || "Unable to generate report"
        );
      }

      router.push(`/report/${id}`);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to finish the interview."
      );
    } finally {
      setFinishing(false);
    }
  }

  const progress = Math.round(
    ((questionNumber - 1) / TOTAL_QUESTIONS) * 100
  );

  if (!student) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />
          <p className="text-slate-400">
            Preparing your personalized interview...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-indigo-400">
                PrepPilot AI Interview
              </p>

              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                Personalized Placement Interview
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Hi {student.name}! Answer naturally. We&apos;ll diagnose
                your strengths and weaknesses.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-center">
              <p className="text-xs text-slate-500">
                Question
              </p>

              <p className="text-lg font-bold">
                {questionNumber} / {TOTAL_QUESTIONS}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs text-slate-500">
            <span>{getRoundName(questionNumber)}</span>
            <span>{progress}% complete</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{
                width: `${Math.max(progress, 8)}%`,
              }}
            />
          </div>
        </div>

        {/* Round indicator */}
        <div className="mb-5 flex flex-wrap gap-2">
          {["Intro", "Technical", "Project", "HR"].map((round) => {
            const active =
              getRound(questionNumber) === round;

            return (
              <span
                key={round}
                className={`rounded-full border px-3 py-1 text-xs ${
                  active
                    ? "border-indigo-400 bg-indigo-500/15 text-indigo-300"
                    : "border-slate-800 text-slate-600"
                }`}
              >
                {round}
              </span>
            );
          })}
        </div>

        {/* Question Card */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl sm:p-8">
          {loadingQuestion ? (
            <div className="animate-pulse">
              <div className="mb-5 h-5 w-32 rounded bg-slate-800" />
              <div className="h-8 w-full rounded bg-slate-800" />
              <div className="mt-3 h-8 w-4/5 rounded bg-slate-800" />

              <div className="mt-8 h-32 rounded-xl bg-slate-800" />
            </div>
          ) : question ? (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
                  {question.topic}
                </span>

                {question.isFollowUp && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                    Adaptive Follow-up
                  </span>
                )}

                {question.revisitingWeakTopic && (
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300">
                    Revisiting weak topic:{" "}
                    {question.revisitingWeakTopic}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-semibold leading-relaxed sm:text-2xl">
                {question.question}
              </h2>

              <div className="mt-7">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Your Answer
                </label>

                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={!!evaluation || evaluating}
                  rows={8}
                  placeholder={
                    student.languageMode === "Hinglish"
                      ? "Apna answer yahan type karein..."
                      : "Type your answer here..."
                  }
                  className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm leading-7 outline-none transition focus:border-indigo-500 disabled:opacity-70"
                />

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={startVoiceInput}
                    disabled={!!evaluation || evaluating || isListening}
                    className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-indigo-500 hover:text-white disabled:opacity-50"
                  >
                    {isListening
                      ? "🎙️ Listening..."
                      : "🎤 Answer with Voice"}
                  </button>

                  {!evaluation && (
                    <button
                      type="button"
                      onClick={submitAnswer}
                      disabled={evaluating}
                      className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {evaluating
                        ? "AI is evaluating..."
                        : "Submit Answer →"}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </section>

        {/* Evaluation */}
        {evaluation && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-slate-400">
                  AI Evaluation
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Your Score:{" "}
                  <span
                    className={
                      evaluation.score >= 8
                        ? "text-emerald-400"
                        : evaluation.score >= 6
                          ? "text-amber-400"
                          : "text-red-400"
                    }
                  >
                    {evaluation.score}/10
                  </span>
                </h2>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                <p className="text-xs text-slate-500">
                  Main Issue
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {evaluation.mainIssue}
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="mt-6 grid gap-3 sm:grid-cols-5">
              {Object.entries(evaluation.breakdown).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                  >
                    <p className="text-xs capitalize text-slate-500">
                      {key}
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {value}/10
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Problems */}
            {evaluation.problems?.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold">
                  What to improve
                </h3>

                <ul className="mt-3 space-y-2">
                  {evaluation.problems.slice(0, 3).map(
                    (problem, index) => (
                      <li
                        key={index}
                        className="rounded-lg bg-red-500/5 px-4 py-3 text-sm text-slate-300"
                      >
                        <span className="mr-2 text-red-400">
                          •
                        </span>
                        {problem}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Better answer */}
            <details className="mt-6 rounded-xl border border-slate-800 bg-slate-950">
              <summary className="cursor-pointer px-4 py-3 font-medium">
                Show better answer
              </summary>

              <div className="border-t border-slate-800 px-4 py-4 text-sm leading-7 text-slate-300">
                {evaluation.betterAnswer}
              </div>
            </details>

            {/* Hinglish */}
            {evaluation.englishRewrite && (
              <details className="mt-3 rounded-xl border border-slate-800 bg-slate-950">
                <summary className="cursor-pointer px-4 py-3 font-medium">
                  English rewrite
                </summary>

                <div className="border-t border-slate-800 px-4 py-4 text-sm leading-7 text-slate-300">
                  {evaluation.englishRewrite}
                </div>
              </details>
            )}

            {/* Tips */}
            {evaluation.tips?.length > 0 && (
              <div className="mt-5">
                <h3 className="font-semibold">
                  Quick tips
                </h3>

                <div className="mt-3 grid gap-2">
                  {evaluation.tips.slice(0, 2).map(
                    (tip, index) => (
                      <div
                        key={index}
                        className="rounded-lg bg-indigo-500/5 px-4 py-3 text-sm text-slate-300"
                      >
                        💡 {tip}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Continue */}
            <button
              type="button"
              onClick={continueInterview}
              disabled={finishing}
              className="mt-7 w-full rounded-xl bg-indigo-600 px-6 py-4 font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {finishing
                ? "Generating your report..."
                : questionNumber === TOTAL_QUESTIONS
                  ? "Finish Interview & See Report →"
                  : `Continue to Question ${questionNumber + 1} →`}
            </button>
          </section>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          PrepPilot remembers your weak topics so your next interview
          can target them.
        </p>
      </div>
    </main>
  );
}