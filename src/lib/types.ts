export interface Student {
  id: string;
  name: string;
  email: string;
  college?: string | null;
  branch?: string | null;
  gradYear?: string | null;
  targetRole: string;
  targetCompanyTier: string;
  resumeText?: string | null;
  resumeFileName?: string | null;
  createdAt: string;
  updatedAt: string;
  interviews?: InterviewSession[];
  weaknesses?: Weakness[];
  drills?: PracticeDrill[];
  scoreHistories?: ScoreHistory[];
}

export interface InterviewSession {
  id: string;
  studentId: string;
  sessionNumber: number;
  sessionType: "DIAGNOSTIC" | "RE_INTERVIEW";
  targetRole: string;
  companyTier: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  overallScore?: number | null;
  techScore?: number | null;
  communicationScore?: number | null;
  problemSolvingScore?: number | null;
  starMethodScore?: number | null;
  feedbackSummary?: string | null;
  readinessLevel?: "Ready" | "Needs Polish" | "High Risk" | null;
  targetedWeaknessIds?: string | null;
  improvementDelta?: number | null;
  createdAt: string;
  updatedAt: string;
  questions?: QuestionAnswer[];
}

export interface QuestionAnswer {
  id: string;
  sessionId: string;
  questionOrder: number;
  category: "TECHNICAL" | "RESUME_PROJECT" | "BEHAVIORAL_STAR" | "CAMPUS_HR" | "PROBLEM_SOLVING";
  question: string;
  context?: string | null;
  userAnswer?: string | null;
  audioDurationSec?: number | null;
  score?: number | null;
  feedback?: string | null;
  betterAnswer?: string | null;
  weaknessIdentified?: string | null;
  keyStrengths?: string | null;
}

export interface Weakness {
  id: string;
  studentId: string;
  category: "TECHNICAL" | "BEHAVIORAL" | "COMMUNICATION" | "PROJECT_DEPTH" | "PROBLEM_SOLVING";
  topic: string;
  description: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "PRACTICED" | "RESOLVED";
  identifiedInSessionId?: string | null;
  resolvedInSessionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeDrill {
  id: string;
  studentId: string;
  weaknessId?: string | null;
  drillType: "CONCEPT_FLASH" | "STAR_BUILDER" | "RAPID_FIRE" | "SCENARIO_RESPONSE";
  title: string;
  prompt: string;
  options?: string | null;
  explanation?: string | null;
  sampleBestAnswer?: string | null;
  userAttempt?: string | null;
  aiGradeScore?: number | null;
  aiFeedback?: string | null;
  isCompleted: boolean;
  weakness?: Weakness | null;
}

export interface ScoreHistory {
  id: string;
  studentId: string;
  sessionId: string;
  overallScore: number;
  techScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  starMethodScore: number;
  deltaFromPrevious?: number | null;
  sessionNumber: number;
  timestamp: string;
}

export interface AnalyticsData {
  summary: {
    totalInterviews: number;
    latestScore: number;
    initialScore: number;
    totalDelta: number;
    readinessLevel: string;
    weaknessStats: {
      total: number;
      resolved: number;
      practiced: number;
      active: number;
      resolutionRate: number;
    };
  };
  trendData: Array<{
    sessionName: string;
    sessionNumber: number;
    overall: number;
    technical: number;
    communication: number;
    problemSolving: number;
    starMethod: number;
    delta: number;
    date: string;
  }>;
  radarData: Array<{
    subject: string;
    baseline: number;
    current: number;
    fullMark: number;
  }>;
  weaknesses: Weakness[];
  recentInterviews: InterviewSession[];
}
