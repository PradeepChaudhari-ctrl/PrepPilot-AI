"use client";

import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileSearch,
  Mic,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";

const loopSteps = [
  {
    number: "01",
    title: "Interview",
    description: "AI conducts a personalized placement interview.",
    icon: Mic,
  },
  {
    number: "02",
    title: "Diagnose",
    description: "Every answer is scored to identify exact weaknesses.",
    icon: FileSearch,
  },
  {
    number: "03",
    title: "Train",
    description: "Practice is generated specifically for your weak topics.",
    icon: Target,
  },
  {
    number: "04",
    title: "Re-test",
    description: "Your next interview revisits previously weak areas.",
    icon: RefreshCw,
  },
  {
    number: "05",
    title: "Improve",
    description: "Score changes prove whether you actually improved.",
    icon: TrendingUp,
  },
];

const features = [
  {
    title: "Weakness Memory",
    description:
      "PrepPilot remembers your weak topics and uses them to design your next interview.",
    icon: BrainCircuit,
  },
  {
    title: "Resume Truth Check",
    description:
      "Your resume claims are compared with what you actually demonstrate during the interview.",
    icon: FileSearch,
  },
  {
    title: "Measured Improvement",
    description:
      "Compare previous and latest topic scores to see real placement-readiness progress.",
    icon: TrendingUp,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <BrainCircuit className="h-5 w-5" />
            </div>

            <div>
              <p className="font-bold tracking-tight">PrepPilot AI</p>
              <p className="text-[10px] text-slate-500">
                Placement Readiness Platform
              </p>
            </div>
          </Link>

          <Link
            href="/onboarding"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-indigo-500"
          >
            Start Preparing
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-20 text-center sm:pt-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300">
            <BrainCircuit className="h-4 w-4" />
            AI-Powered Placement Preparation
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            From Interview Practice
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              to Placement Readiness
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg">
            PrepPilot AI doesn't stop after asking interview questions.
            It diagnoses your weaknesses, creates personalized practice,
            remembers your weak topics, and re-tests you to measure real
            improvement.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-4 font-semibold shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
            >
              Start Preparing
              <ArrowRight className="h-5 w-5" />
            </Link>

            <a
              href="#learning-loop"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-7 py-4 font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
            >
              See How It Works
            </a>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span>✓ Personalized interviews</span>
            <span>✓ Weakness memory</span>
            <span>✓ Resume verification</span>
            <span>✓ Measured improvement</span>
          </div>
        </div>
      </section>

      {/* Closed Learning Loop */}
      <section
        id="learning-loop"
        className="border-y border-slate-800/80 bg-slate-900/30"
      >
        <div className="mx-auto max-w-7xl px-5 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">
              The Core Difference
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              A Closed Learning Loop
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">
              The goal isn't just to complete another mock interview.
              The goal is to identify what is holding you back and prove
              that you improved.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-5">
            {loopSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="relative rounded-2xl border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">
                      STEP {step.number}
                    </span>

                    <Icon className="h-5 w-5 text-slate-500" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {step.description}
                  </p>

                  {index < loopSteps.length - 1 && (
                    <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-indigo-500 md:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why PrepPilot */}
      <section className="border-t border-slate-800/80 bg-slate-900/20">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">
            Why PrepPilot AI?
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Your previous interview changes your next one.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            If SQL was weak in your previous interview, your next technical
            interview can revisit SQL. If you improve, your score reflects
            that improvement. Your preparation becomes a continuous loop
            instead of isolated practice sessions.
          </p>

          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            {[
              "Interview data is saved",
              "Weak topics are remembered",
              "Progress is measured",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-4"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                <span className="text-sm text-slate-300">
                  {item}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/onboarding"
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-4 font-semibold transition hover:bg-indigo-500"
          >
            Build My Placement Profile
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-slate-300">
          PrepPilot AI
        </p>

        <p className="mt-1 text-xs text-slate-600">
          Interview → Diagnose → Train → Re-test → Improve
        </p>
      </footer>
    </main>
  );
}