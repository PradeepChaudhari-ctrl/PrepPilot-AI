"use client";

import {
  ChangeEvent,
  FormEvent,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setStoredStudentId } from "@/lib/storage";

const SKILLS = [
  "Python",
  "Java",
  "SQL",
  "DSA",
  "DBMS",
  "OS",
  "CN",
  "OOP",
  "ML",
  "Excel",
  "Communication",
];

const BRANCHES = [
  "CSE",
  "AI/ML",
  "IT",
  "ECE",
  "Mech",
  "Other",
];

const YEARS = ["1", "2", "3", "4"];

const TARGET_MODES = [
  "Campus Placement",
  "Internship",
];

const COMPANY_STYLES = [
  "TCS",
  "Infosys",
  "Wipro",
  "Startup",
  "Generic",
];

const LANGUAGE_MODES = [
  "English",
  "Hinglish",
];

type ResumeAnalysis = {
  claimedSkills?: {
    skill: string;
    level: string;
  }[];
  projects?: {
    name: string;
    tech: string[];
  }[];
  claims?: string[];
};

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [year, setYear] = useState("3");

  const [skills, setSkills] = useState<string[]>([]);

  const [targetMode, setTargetMode] =
    useState("Campus Placement");

  const [companyStyle, setCompanyStyle] =
    useState("Generic");

  const [languageMode, setLanguageMode] =
    useState("English");

  const [targetRole, setTargetRole] = useState("");

  const [resumeText, setResumeText] = useState("");

  const [resumeFile, setResumeFile] =
    useState<File | null>(null);

  const [resumeAnalysis, setResumeAnalysis] =
    useState<ResumeAnalysis | null>(null);

  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<
    "profile" | "resume"
  >("profile");

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  function toggleSkill(skill: string) {
    setSkills((current) => {
      if (current.includes(skill)) {
        return current.filter((item) => item !== skill);
      }

      return [...current, skill];
    });
  }

  function handleResumeFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF resume.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Resume PDF must be smaller than 5 MB.");
      return;
    }

    setError("");
    setResumeFile(file);
    setResumeText("");
  }

  async function extractPdfText(file: File) {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch("/api/resume/parse", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error || "Unable to read the resume PDF."
      );
    }

    return String(
      data?.text ||
        data?.resumeText ||
        ""
    ).trim();
  }

  async function analyzeResume(text: string) {
    if (!text.trim()) {
      return null;
    }

    const response = await fetch(
      "/api/resume-analyze",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText: text,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "Unable to analyze your resume."
      );
    }

    return data as ResumeAnalysis;
  }

  async function createStudent(
    analysis: ResumeAnalysis | null,
    finalResumeText: string
  ) {
    const response = await fetch("/api/student", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        branch,
        year: Number(year),
        skills,
        skillsJson: JSON.stringify(skills),
        targetMode,
        companyStyle,
        languageMode,
        targetRole: targetRole.trim(),
        resumeText: finalResumeText,
        resumeAnalysis: analysis,
        resumeAnalysisJson: JSON.stringify(
          analysis || {}
        ),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "Unable to create your account."
      );
    }

    const studentId =
      data?.student?.id ||
      data?.id ||
      data?.studentId;

    if (!studentId) {
      throw new Error(
        "Account was created, but student ID was not returned."
      );
    }

    return studentId;
  }

  function validateProfile() {
    if (!name.trim()) {
      setError("Please enter your full name.");
      return false;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return false;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setError(
        "Please enter a valid email address."
      );
      return false;
    }

    if (!branch) {
      setError("Please select your branch.");
      return false;
    }

    if (!year) {
      setError("Please select your year.");
      return false;
    }

    if (skills.length === 0) {
      setError(
        "Please select at least one skill."
      );
      return false;
    }

    return true;
  }

  function handleProfileContinue() {
    setError("");

    if (!validateProfile()) {
      return;
    }

    setStep("resume");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!validateProfile()) {
      setStep("profile");
      return;
    }

    if (
      !resumeFile &&
      !resumeText.trim()
    ) {
      setError(
        "Please upload your resume PDF or paste your resume text."
      );
      return;
    }

    setLoading(true);

    try {
      let finalResumeText =
        resumeText.trim();

      // PDF → text
      if (resumeFile) {
        finalResumeText =
          await extractPdfText(resumeFile);

        if (!finalResumeText) {
          throw new Error(
            "Could not extract text from this PDF. Please paste your resume text instead."
          );
        }

        setResumeText(finalResumeText);
      }

      // Resume → AI analysis
      const analysis =
        await analyzeResume(finalResumeText);

      setResumeAnalysis(analysis);

      // Create student
      const studentId =
        await createStudent(
          analysis,
          finalResumeText
        );

      // Save current student
      setStoredStudentId(studentId);

      setSuccessMessage(
        "Your PrepPilot AI profile has been created successfully!"
      );

      // Small delay so success message is visible
      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating your account."
      );
    } finally {
      setLoading(false);
    }
  }

  function goBackToProfile() {
    setError("");
    setStep("profile");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-3xl" />

        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">

          {/* Header */}
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="inline-block"
            >
              <div className="text-3xl font-extrabold tracking-tight">
                Prep
                <span className="text-indigo-400">
                  Pilot
                </span>
                <span className="text-violet-400">
                  {" "}
                  AI
                </span>
              </div>
            </Link>

            <p className="mt-2 text-sm text-slate-400">
              Build your personalized placement
              preparation profile
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="mx-auto flex max-w-md items-center justify-center">
              {/* Step 1 */}
              <div className="flex items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    step === "profile"
                      ? "bg-indigo-500 text-white"
                      : "bg-indigo-500 text-white"
                  }`}
                >
                  1
                </div>

                <span
                  className={`ml-2 hidden text-sm font-medium sm:block ${
                    step === "profile"
                      ? "text-white"
                      : "text-indigo-300"
                  }`}
                >
                  Profile
                </span>
              </div>

              <div className="mx-4 h-px w-16 bg-white/10 sm:w-24">
                <div
                  className={`h-full transition-all ${
                    step === "resume"
                      ? "w-full bg-indigo-500"
                      : "w-0"
                  }`}
                />
              </div>

              {/* Step 2 */}
              <div className="flex items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                    step === "resume"
                      ? "bg-indigo-500 text-white"
                      : "border border-white/20 bg-white/5 text-slate-400"
                  }`}
                >
                  2
                </div>

                <span
                  className={`ml-2 hidden text-sm font-medium sm:block ${
                    step === "resume"
                      ? "text-white"
                      : "text-slate-500"
                  }`}
                >
                  Resume
                </span>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">

            {/* PROFILE STEP */}
            {step === "profile" && (
              <div className="p-6 sm:p-8 lg:p-10">

                <div className="mb-8">
                  <div className="mb-3 inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                    Create Account
                  </div>

                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Create your PrepPilot AI
                    account
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    Tell us about yourself so
                    PrepPilot AI can personalize
                    your interview questions,
                    practice topics and placement
                    readiness analysis.
                  </p>
                </div>

                <div className="space-y-8">

                  {/* Basic Information */}
                  <section>
                    <h2 className="mb-4 text-lg font-semibold">
                      Basic Information
                    </h2>

                    <div className="grid gap-5 sm:grid-cols-2">

                      {/* Name */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">
                          Full Name
                        </label>

                        <input
                          type="text"
                          value={name}
                          onChange={(e) =>
                            setName(
                              e.target.value
                            )
                          }
                          placeholder="Enter your full name"
                          className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">
                          Email Address
                        </label>

                        <input
                          type="email"
                          value={email}
                          onChange={(e) =>
                            setEmail(
                              e.target.value
                            )
                          }
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />

                        <p className="mt-1.5 text-xs text-slate-500">
                          Use this email to login
                          later.
                        </p>
                      </div>

                      {/* Branch */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">
                          Branch
                        </label>

                        <select
                          value={branch}
                          onChange={(e) =>
                            setBranch(
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {BRANCHES.map(
                            (item) => (
                              <option
                                key={item}
                                value={item}
                                className="bg-slate-900"
                              >
                                {item}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      {/* Year */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">
                          Current Year
                        </label>

                        <select
                          value={year}
                          onChange={(e) =>
                            setYear(
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {YEARS.map(
                            (item) => (
                              <option
                                key={item}
                                value={item}
                                className="bg-slate-900"
                              >
                                Year {item}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Skills */}
                  <section>
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold">
                        Your Skills
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Select the skills you want
                        to be tested on.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {SKILLS.map(
                        (skill) => {
                          const selected =
                            skills.includes(
                              skill
                            );

                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() =>
                                toggleSkill(
                                  skill
                                )
                              }
                              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                selected
                                  ? "border-indigo-400 bg-indigo-500/20 text-indigo-300"
                                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"
                              }`}
                            >
                              {selected
                                ? "✓ "
                                : ""}
                              {skill}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </section>

                  {/* Preparation */}
                  <section>
                    <h2 className="mb-4 text-lg font-semibold">
                      Preparation Goal
                    </h2>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {TARGET_MODES.map(
                        (mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() =>
                              setTargetMode(
                                mode
                              )
                            }
                            className={`rounded-2xl border p-4 text-left transition ${
                              targetMode ===
                              mode
                                ? "border-indigo-400 bg-indigo-500/10"
                                : "border-white/10 bg-white/[0.03] hover:border-white/20"
                            }`}
                          >
                            <div className="font-semibold">
                              {mode}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {mode ===
                              "Campus Placement"
                                ? "Prepare for college placement drives"
                                : "Prepare for internship interviews"}
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  </section>

                  {/* Company Style */}
                  <section>
                    <h2 className="mb-4 text-lg font-semibold">
                      Company Interview Style
                    </h2>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {COMPANY_STYLES.map(
                        (company) => (
                          <button
                            key={company}
                            type="button"
                            onClick={() =>
                              setCompanyStyle(
                                company
                              )
                            }
                            className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                              companyStyle ===
                              company
                                ? "border-violet-400 bg-violet-500/10 text-violet-300"
                                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                            }`}
                          >
                            {company}
                          </button>
                        )
                      )}
                    </div>
                  </section>

                  {/* Language */}
                  <section>
                    <h2 className="mb-4 text-lg font-semibold">
                      Interview Language
                    </h2>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {LANGUAGE_MODES.map(
                        (language) => (
                          <button
                            key={language}
                            type="button"
                            onClick={() =>
                              setLanguageMode(
                                language
                              )
                            }
                            className={`rounded-2xl border p-4 text-left transition ${
                              languageMode ===
                              language
                                ? "border-indigo-400 bg-indigo-500/10"
                                : "border-white/10 bg-white/[0.03] hover:border-white/20"
                            }`}
                          >
                            <div className="font-semibold">
                              {language}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {language ===
                              "English"
                                ? "Practice in professional English"
                                : "Practice using Hindi + English"
                              }
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  </section>

                  {/* Target Role */}
                  <section>
                    <label className="mb-2 block text-lg font-semibold">
                      Target Role / Job Description
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        Optional
                      </span>
                    </label>

                    <textarea
                      value={targetRole}
                      onChange={(e) =>
                        setTargetRole(
                          e.target.value
                        )
                      }
                      rows={5}
                      placeholder="Example: Software Developer, Java Developer, Data Analyst, AI/ML Intern..."
                      className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </section>
                </div>

                {/* Error */}
                {error && (
                  <div className="mt-7 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* Continue */}
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href="/login"
                    className="text-center text-sm font-medium text-slate-400 transition hover:text-white sm:text-left"
                  >
                    ← Already have an
                    account? Sign in
                  </Link>

                  <button
                    type="button"
                    onClick={
                      handleProfileContinue
                    }
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-500"
                  >
                    Continue to Resume →
                  </button>
                </div>
              </div>
            )}

            {/* RESUME STEP */}
            {step === "resume" && (
              <form
                onSubmit={handleSubmit}
                className="p-6 sm:p-8 lg:p-10"
              >
                <div className="mb-8">
                  <div className="mb-3 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                    Resume Analysis
                  </div>

                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Add your resume
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    PrepPilot AI will analyze your
                    resume to identify claimed
                    skills, projects and claims
                    that can be verified during
                    your interview.
                  </p>
                </div>

                {/* Upload */}
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center sm:p-8">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl">
                    📄
                  </div>

                  <h2 className="font-semibold">
                    Upload PDF Resume
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    PDF only • Maximum 5 MB
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleResumeFile}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="mt-5 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Choose PDF
                  </button>

                  {resumeFile && (
                    <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-left text-sm text-emerald-300">
                      ✓ {resumeFile.name}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="my-7 flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/10" />

                  <span className="text-xs text-slate-500">
                    OR PASTE RESUME
                  </span>

                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Paste Resume */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Resume Text
                  </label>

                  <textarea
                    value={resumeText}
                    onChange={(e) => {
                      setResumeText(
                        e.target.value
                      );

                      if (e.target.value) {
                        setResumeFile(null);
                      }
                    }}
                    rows={14}
                    placeholder={`Paste your resume text here...

Example:

Pradeep Chaudhari
B.Tech CSE (AI)

Skills:
Python, Java, SQL, DSA

Projects:
AI Study Buddy
Weather API

Education:
B.Tech Computer Science & Engineering
...`}
                    className="w-full resize-y rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Pasting your resume is always
                    available as a fallback if PDF
                    upload doesn't work.
                  </p>
                </div>

                {/* AI analysis preview */}
                {resumeAnalysis && (
                  <div className="mt-6 rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-5">
                    <h3 className="font-semibold text-indigo-300">
                      Resume analyzed ✓
                    </h3>

                    {resumeAnalysis
                      .claimedSkills &&
                      resumeAnalysis
                        .claimedSkills
                        .length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Skills detected
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {resumeAnalysis.claimedSkills.map(
                              (
                                item,
                                index
                              ) => (
                                <span
                                  key={`${item.skill}-${index}`}
                                  className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300"
                                >
                                  {item.skill} ·{" "}
                                  {item.level}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {resumeAnalysis
                      .projects &&
                      resumeAnalysis
                        .projects
                        .length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Projects detected
                          </p>

                          <div className="mt-2 space-y-2">
                            {resumeAnalysis.projects
                              .slice(0, 3)
                              .map(
                                (
                                  project,
                                  index
                                ) => (
                                  <div
                                    key={`${project.name}-${index}`}
                                    className="rounded-lg bg-white/5 px-3 py-2 text-sm"
                                  >
                                    <span className="font-medium text-white">
                                      {
                                        project.name
                                      }
                                    </span>

                                    {project.tech &&
                                      project
                                        .tech
                                        .length >
                                        0 && (
                                        <span className="ml-2 text-xs text-slate-500">
                                          {project.tech.join(
                                            ", "
                                          )}
                                        </span>
                                      )}
                                  </div>
                                )
                              )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
                    {error}
                  </div>
                )}

                {/* Success */}
                {successMessage && (
                  <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-5 text-emerald-300">
                    {successMessage}
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={
                      goBackToProfile
                    }
                    disabled={loading}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Creating your account..."
                      : "Create My Account →"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="py-6 text-center">
            <p className="text-xs text-slate-600">
              Your profile powers personalized
              interviews, targeted practice and
              measurable improvement.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}