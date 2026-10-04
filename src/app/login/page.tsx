"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setStoredStudentId } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.error ||
            "Login failed. Please check your email and try again."
        );
        return;
      }

      setStoredStudentId(data.student.id);

      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function useDemoAccount() {
    setEmail("demo@preppilot.ai");
    setError("");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* Brand */}
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block">
              <div className="text-3xl font-extrabold tracking-tight">
                Prep
                <span className="text-indigo-400">Pilot</span>
                <span className="text-violet-400"> AI</span>
              </div>
            </Link>

            <p className="mt-2 text-sm text-slate-400">
              From Interview Practice to Placement Readiness
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl sm:p-8">

            {/* Heading */}
            <div className="mb-7">
              <div className="mb-3 inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                Student Login
              </div>

              <h1 className="text-2xl font-bold">
                Welcome back 👋
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Continue your personalized placement preparation.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
                  {error}
                </div>
              )}

              {/* Login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing in..."
                  : "Sign in to PrepPilot AI →"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-slate-500">
                OR
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Demo */}
            <button
              type="button"
              onClick={useDemoAccount}
              disabled={loading}
              className="w-full rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-60"
            >
              Use Demo Account
            </button>

            <p className="mt-3 text-center text-xs text-slate-500">
              demo@preppilot.ai
            </p>

            {/* Register */}
            <div className="mt-7 border-t border-white/10 pt-6 text-center">
              <p className="text-sm text-slate-400">
                Don't have an account?
              </p>

              <Link
                href="/onboarding"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo-400 transition hover:text-indigo-300"
              >
                Create your account
                <span>→</span>
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            Personalized interviews • AI diagnosis • Targeted practice •
            Measured improvement
          </p>
        </div>
      </div>
    </main>
  );
}