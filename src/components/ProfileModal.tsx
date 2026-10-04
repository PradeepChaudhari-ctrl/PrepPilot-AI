"use client";

import React, { useState } from "react";
import { Student } from "@/lib/types";
import { setStoredStudentId } from "@/lib/storage";
import {
  X,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  GraduationCap,
  Loader2,
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudent: Student | null;
  onProfileSaved: (student: Student) => void;
}

export function ProfileModal({ isOpen, onClose, currentStudent, onProfileSaved }: ProfileModalProps) {
  const [name, setName] = useState(currentStudent?.name || "");
  const [email, setEmail] = useState(currentStudent?.email || "");
  const [college, setCollege] = useState(currentStudent?.college || "");
  const [branch, setBranch] = useState(currentStudent?.branch || "Computer Science & Engineering");
  const [gradYear, setGradYear] = useState(currentStudent?.gradYear || "2025");
  const [targetRole, setTargetRole] = useState(
    currentStudent?.targetRole || "Software Development Engineer (SDE)"
  );
  const [targetCompanyTier, setTargetCompanyTier] = useState(
    currentStudent?.targetCompanyTier || "Tier 1 Product"
  );
  const [resumeText, setResumeText] = useState(currentStudent?.resumeText || "");
  const [resumeFileName, setResumeFileName] = useState(currentStudent?.resumeFileName || "");

  const [activeResumeTab, setActiveResumeTab] = useState<"upload" | "paste">("paste");
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  // 1-Click Sample Placement Profile
  const handleLoadSample = () => {
    setName("Aarav Sharma");
    setEmail("aarav.sharma25@vitstudent.ac.in");
    setCollege("VIT Vellore");
    setBranch("Computer Science & Engineering (Core)");
    setGradYear("2025");
    setTargetRole("Software Development Engineer (SDE)");
    setTargetCompanyTier("Tier 1 Product");
    setActiveResumeTab("paste");
    setResumeFileName("Aarav_Sharma_SDE_Resume.pdf");
    setResumeText(`AARAV SHARMA
Email: aarav.sharma25@vitstudent.ac.in | LinkedIn: linkedin.com/in/aarav-sharma-sde | GitHub: github.com/aaravsde
B.Tech in Computer Science & Engineering, VIT Vellore (CGPA: 8.92 / 10.0) | Class of 2025

TECHNICAL SKILLS:
- Languages: Java, C++, TypeScript, Python, SQL
- Core: Data Structures & Algorithms, Object-Oriented Programming (OOP), OS, DBMS, Computer Networks
- Frameworks & DB: React.js, Next.js, Node.js, Express, Spring Boot basics, PostgreSQL, MongoDB, Redis
- Tools: Docker, Git, Linux, Postman, AWS EC2 / S3 basics

PROJECTS:
1. Campus Mart - High-Throughput Peer Marketplace (React, Node.js, PostgreSQL, Redis)
- Engineered a full-stack campus marketplace serving 2,500+ student peer transactions with JWT authentication.
- Optimized order retrieval latency by 45% using Redis caching and PostgreSQL composite indexing on order timestamps.
- Implemented real-time item reservation using distributed mutex locks to prevent race conditions during flash sales.

2. DevSync - Collaborative Markdown & Code Workspace (Next.js, WebSockets, Docker)
- Architected a real-time collaborative code editor with operational transformation and WebSockets.
- Containerized microservices using Docker and orchestrated automated CI test pipelines via GitHub Actions.

ACADEMIC ACHIEVEMENTS & EXTRACURRICULARS:
- Ranked in Top 2% in LeetCode Global Contests (Knight rating 1940+, 650+ problems solved in DSA).
- Technical Lead, Developer Student Club (GDSC) - Mentored 150+ juniors in Git & Web Development.
- Finalist, Smart India Hackathon (SIH 2024).`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse PDF");
      }

      setResumeText(data.text);
      setResumeFileName(data.fileName);
      setSuccessMsg(`Successfully parsed ${data.fileName} (${data.wordCount} words extracted)!`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to parse PDF. Please use the Paste Text tab.");
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg("Name and Email are required");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          college: college.trim(),
          branch: branch.trim(),
          gradYear: gradYear.trim(),
          targetRole,
          targetCompanyTier,
          resumeText: resumeText.trim(),
          resumeFileName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      setStoredStudentId(data.student.id);
      onProfileSaved(data.student);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong while saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 my-8 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Student Placement Profile & Resume</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized for your college, target role, and campus placement track
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1-Click Demo Loader Bar */}
        <div className="mt-4 p-3 bg-gradient-to-r from-indigo-950/60 to-violet-950/60 border border-indigo-500/20 rounded-xl flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-semibold text-indigo-300">Quick Test? </span>
            <span className="text-slate-400">Load a verified Tier-1 Placement CS profile</span>
          </div>
          <button
            type="button"
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Load Sample Profile
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. aarav@college.edu.in"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* College & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">College / University</label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. VIT / BITS / IIT"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">Branch / Degree</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. B.Tech CSE"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">Graduation Year</label>
              <select
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="2025">2025 (Final Year)</option>
                <option value="2026">2026 (Pre-final Year)</option>
                <option value="2027">2027</option>
                <option value="2024">2024 (Recent Grad)</option>
              </select>
            </div>
          </div>

          {/* Target Role & Company Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                <Briefcase className="inline h-3.5 w-3.5 text-indigo-400 mr-1" />
                Target Placement Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Software Development Engineer (SDE)">Software Development Engineer (SDE)</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Backend Engineer">Backend Engineer</option>
                <option value="Frontend Engineer">Frontend Engineer</option>
                <option value="Data Analyst / Data Scientist">Data Analyst / Data Scientist</option>
                <option value="Product Analyst">Product Analyst</option>
                <option value="Campus General (TCS/Infosys/Wipro NQT)">Campus General (Mass Recruiters Track)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                <Building2 className="inline h-3.5 w-3.5 text-indigo-400 mr-1" />
                Target Company Tier
              </label>
              <select
                value={targetCompanyTier}
                onChange={(e) => setTargetCompanyTier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Tier 1 Product">Tier 1 Product (Google, Microsoft, Amazon, Atlassian, Uber)</option>
                <option value="High-Growth Tech & Unicorns">High-Growth Tech (Razorpay, Swiggy, Zomato, CRED)</option>
                <option value="Service / Mass Recruiters">Mass Recruiters (TCS Digital/Prime, Infosys DSE, Wipro Turbo)</option>
                <option value="FinTech / Startups">FinTech & Fast Startups</option>
              </select>
            </div>
          </div>

          {/* Resume Upload / Paste Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-indigo-400" />
                Resume Context (Used to tailor project & technical questions)
              </label>

              {/* Tabs for Upload vs Paste */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveResumeTab("paste")}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
                    activeResumeTab === "paste"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setActiveResumeTab("upload")}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
                    activeResumeTab === "upload"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Upload PDF
                </button>
              </div>
            </div>

            {activeResumeTab === "upload" ? (
              <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 text-center bg-slate-950/50 transition-colors">
                <input
                  type="file"
                  id="resume-file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="resume-file"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    {isParsingPdf ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-indigo-400 hover:underline">
                      Click to upload resume PDF
                    </span>{" "}
                    <span className="text-xs text-slate-400">or drag and drop</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    PDF parsed on server with pdf-parse. (Pasting text is always available as fallback)
                  </p>
                </label>
                {resumeFileName && (
                  <p className="mt-3 text-xs text-emerald-400 font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Loaded: {resumeFileName}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  rows={6}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume content, key project descriptions, tech stack, and achievements here..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                  <span>Pasting ensures 100% reliable extraction even if PDF formatting is unusual.</span>
                  <span>{resumeText ? resumeText.split(/\s+/).filter(Boolean).length : 0} words</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save & Continue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
