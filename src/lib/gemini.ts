import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Helper to clean JSON string
function cleanJsonString(str: string): string {
  return str
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * Universal Gemini caller with responseMimeType: "application/json",
 * 1 retry on failure, and fallback handlers.
 */
async function callGeminiJson<T>(prompt: string, fallbackFn: () => T): Promise<T> {
  if (!genAI || !apiKey) {
    return fallbackFn();
  }

  // Attempt 1
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(cleanJsonString(text)) as T;
  } catch (err1) {
    console.warn("Gemini call attempt 1 failed, retrying once...", err1);
    // Attempt 2 (Retry once on failure)
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(cleanJsonString(text)) as T;
    } catch (err2) {
      console.error("Gemini call attempt 2 also failed, using fallback:", err2);
      return fallbackFn();
    }
  }
}

// -------------------------------------------------------------
// 1. RESUME ANALYZE
// -------------------------------------------------------------
export interface ResumeAnalysis {
  claimedSkills: Array<{ skill: string; level: "Basic" | "Intermediate" | "Advanced" }>;
  projects: Array<{ name: string; tech: string[] }>;
  claims: string[];
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  const prompt = `
You are a senior technical placement evaluator for Indian engineering colleges.
Analyze the following resume text:

"""
${resumeText.slice(0, 4000)}
"""

Extract:
1. "claimedSkills": Array of objects { "skill": string, "level": "Basic" | "Intermediate" | "Advanced" }. Include up to 8 core technical skills.
2. "projects": Array of objects { "name": string, "tech": string[] } for projects explicitly mentioned.
3. "claims": Exactly 3 specific technical achievements or quantitative claims worth verifying in an interview (e.g. "Reduced query latency by 45%", "Built real-time messaging using WebSockets", "Deployed microservices using Docker").

Respond strictly in this JSON format:
{
  "claimedSkills": [
    { "skill": "Python", "level": "Intermediate" },
    { "skill": "SQL", "level": "Advanced" }
  ],
  "projects": [
    { "name": "Campus Mart", "tech": ["React", "Node.js", "PostgreSQL", "Redis"] }
  ],
  "claims": [
    "Claim 1",
    "Claim 2",
    "Claim 3"
  ]
}
`;

  return callGeminiJson<ResumeAnalysis>(prompt, () => {
    // Intelligent fallback extraction
    const skillsList = ["Python", "Java", "SQL", "DSA", "DBMS", "OS", "CN", "React", "Node.js", "Docker"];
    const matchedSkills = skillsList
      .filter((s) => resumeText.toLowerCase().includes(s.toLowerCase()))
      .slice(0, 6)
      .map((skill, i) => ({
        skill,
        level: (i % 2 === 0 ? "Intermediate" : "Advanced") as "Intermediate" | "Advanced",
      }));

    return {
      claimedSkills: matchedSkills.length > 0 ? matchedSkills : [
        { skill: "Data Structures & Algorithms", level: "Intermediate" },
        { skill: "SQL / DBMS", level: "Advanced" },
        { skill: "Java / Python", level: "Intermediate" },
      ],
      projects: [
        { name: "Campus Marketplace & Ordering System", tech: ["React", "Node.js", "PostgreSQL", "Redis"] },
        { name: "Collaborative Code Editor", tech: ["TypeScript", "WebSockets", "Docker"] },
      ],
      claims: [
        "Optimized database queries and response times by 40% using Redis caching and composite indexing",
        "Implemented real-time synchronization and race condition prevention using WebSockets and locks",
        "Containerized full-stack services and configured automated testing pipelines using Docker and Git",
      ],
    };
  });
}

// -------------------------------------------------------------
// 2. QUESTION GENERATION (Adaptive + Interviewer Memory)
// -------------------------------------------------------------
export interface QuestionRequest {
  profile: {
    name: string;
    branch?: string;
    year?: number;
    skills?: string[];
    companyStyle?: string;
    languageMode?: string;
    targetMode?: string;
    targetRole?: string;
  };
  resumeData?: ResumeAnalysis | null;
  history: Array<{
    question: string;
    topic: string;
    round: string;
    score?: number;
    answer?: string;
  }>;
  topicProgress?: Array<{ topic: string; score: number }>;
  round: "Intro" | "Technical" | "Project Deep Dive" | "HR";
  questionNumber: number; // 1 to 9
}

export interface QuestionResponse {
  question: string;
  topic: string;
  round: string;
  isFollowUp: boolean;
  revisitingWeakTopic: string | null;
}

export async function generateQuestion(params: QuestionRequest): Promise<QuestionResponse> {
  const { profile, resumeData, history, topicProgress = [], round, questionNumber } = params;

  // Identify previous weak topics (<60)
  const weakTopics = topicProgress
    .filter((tp) => tp.score < 60)
    .map((tp) => tp.topic);

  // Check adaptive condition from previous question
  const previousQA = history.length > 0 ? history[history.length - 1] : null;
  const previousScore = previousQA?.score ?? 7;
  const shouldSimplifyFollowUp = previousScore < 6;
  const shouldDeepenFollowUp = previousScore >= 8;

  // Memory condition: for technical round questions, prioritize past weak topics
  let memoryWeakTopic: string | null = null;
  if (round === "Technical" && weakTopics.length > 0) {
    // Technical questions are Q2, Q3, Q4, Q5. Dedicate at least 2 to past weak topics
    if (questionNumber === 2 || questionNumber === 4) {
      memoryWeakTopic = weakTopics[(questionNumber === 2 ? 0 : 1) % weakTopics.length];
    }
  }

  const prompt = `
You are an expert technical interviewer for Indian campus placements (${profile.companyStyle || "TCS / Product"} track).
Conduct question #${questionNumber} of 9.
Current Round: "${round}"
Candidate Profile:
- Name: ${profile.name}
- Branch: ${profile.branch || "CSE"}, Year: ${profile.year || 4}
- Selected Skills: ${(profile.skills || []).join(", ") || "General CS"}
- Target: ${profile.targetMode || "Campus Placement"}
- Interview Language: ${profile.languageMode || "English"}
${memoryWeakTopic ? `\nCRITICAL INTERVIEWER MEMORY: The candidate was WEAK in "${memoryWeakTopic}" in previous interviews. You MUST ask a question testing "${memoryWeakTopic}"!` : ""}
${shouldSimplifyFollowUp ? `\nADAPTIVE MODE (SIMPLIFY): The candidate scored ${previousScore}/10 on the previous question ("${previousQA?.question}"). Ask a simpler, foundational follow-up question on the topic "${previousQA?.topic}" to help them recover.` : ""}
${shouldDeepenFollowUp ? `\nADAPTIVE MODE (DEEPEN): The candidate scored ${previousScore}/10 on the previous question ("${previousQA?.question}"). Ask a deeper follow-up examining edge cases, system complexity, or performance tradeoffs.` : ""}
${round === "Project Deep Dive" && resumeData?.claims?.length ? `\nRESUME TRUTH CHECK: Generate a question probing one of these resume claims or projects: ${JSON.stringify(resumeData.claims)} or projects: ${JSON.stringify(resumeData.projects)}` : ""}

Recent Questions Asked:
${history.map((h, i) => `Q${i + 1} (${h.round} - ${h.topic}): ${h.question}`).join("\n")}

Respond strictly in this JSON format:
{
  "question": "The question to ask the candidate",
  "topic": "The main topic tag (e.g. 'SQL', 'DSA', 'DBMS', 'OS', 'WebSockets', 'Resume Project', 'HR')",
  "round": "${round}",
  "isFollowUp": ${shouldSimplifyFollowUp || shouldDeepenFollowUp ? "true" : "false"},
  "revisitingWeakTopic": ${memoryWeakTopic ? `"${memoryWeakTopic}"` : "null"}
}
`;

  return callGeminiJson<QuestionResponse>(prompt, () => {
    // Fallback question generation
    if (round === "Intro") {
      return {
        question: `Hi ${profile.name}, welcome! Please introduce yourself, highlighting your academic background in ${profile.branch || "Engineering"}, key technical interests, and why you want to join ${profile.companyStyle || "our company"}.`,
        topic: "Introduction & Background",
        round: "Intro",
        isFollowUp: false,
        revisitingWeakTopic: null,
      };
    }

    if (round === "Technical") {
      if (memoryWeakTopic) {
        return {
          question: `In your previous round, you struggled with ${memoryWeakTopic}. Can you explain how ${memoryWeakTopic} works in practice and how you would prevent common performance bottlenecks?`,
          topic: memoryWeakTopic,
          round: "Technical",
          isFollowUp: false,
          revisitingWeakTopic: memoryWeakTopic,
        };
      }

      if (shouldSimplifyFollowUp && previousQA) {
        return {
          question: `Let's break that down into basics for ${previousQA.topic}. What is the fundamental concept behind it, and why do we use it in software development?`,
          topic: previousQA.topic,
          round: "Technical",
          isFollowUp: true,
          revisitingWeakTopic: null,
        };
      }

      if (shouldDeepenFollowUp && previousQA) {
        return {
          question: `Excellent points on ${previousQA.topic}. Now let's consider scale: what happens if the data volume increases by 100x? How would you optimize the time and space complexity?`,
          topic: previousQA.topic,
          round: "Technical",
          isFollowUp: true,
          revisitingWeakTopic: null,
        };
      }

      const techPool = [
        { q: "Explain the difference between clustered and non-clustered indexing in relational databases, and in what scenarios an index can slow down queries.", t: "SQL / DBMS" },
        { q: "How would you detect and resolve a memory leak in a production application? What profiling tools or methodologies do you rely on?", t: "OS / Memory Management" },
        { q: "What is the difference between synchronous and asynchronous execution in Node.js/Java? How does the event loop handle I/O operations?", t: "Concurrency & Runtime" },
        { q: "Given an array of integers, how would you find the longest contiguous subarray with sum equal to K in O(N) time?", t: "DSA" },
      ];
      const pick = techPool[(questionNumber - 2) % techPool.length];
      return {
        question: pick.q,
        topic: pick.t,
        round: "Technical",
        isFollowUp: false,
        revisitingWeakTopic: null,
      };
    }

    if (round === "Project Deep Dive") {
      const claim = resumeData?.claims?.[(questionNumber - 6) % (resumeData.claims.length || 1)] || "your primary project architecture";
      return {
        question: `In your resume, you highlighted: "${claim}". Walk me through the exact technical decisions and challenges you faced while implementing this feature.`,
        topic: "Project Deep Dive",
        round: "Project Deep Dive",
        isFollowUp: false,
        revisitingWeakTopic: null,
      };
    }

    // HR Round (Q8, Q9)
    if (questionNumber === 8) {
      return {
        question: `Tell me about a time during a college project or hackathon where you faced a significant conflict with a team member regarding the technical design or timeline. How did you resolve it?`,
        topic: "Conflict Resolution & Teamwork",
        round: "HR",
        isFollowUp: false,
        revisitingWeakTopic: null,
      };
    }

    return {
      question: `Where do you see yourself in 3 years, and how do you plan to handle the steep learning curve when assigned to an unfamiliar production codebase?`,
      topic: "Career Aspirations & Growth Mindset",
      round: "HR",
      isFollowUp: false,
      revisitingWeakTopic: null,
    };
  });
}

// -------------------------------------------------------------
// 3. EVALUATION
// -------------------------------------------------------------
export interface EvaluationResult {
  score: number; // 0-10
  breakdown: {
    correctness: number; // 0-10
    relevance: number; // 0-10
    structure: number; // 0-10
    depth: number; // 0-10
    communication: number; // 0-10
  };
  mainIssue: string; // 2-line summary
  problems: string[]; // max 3 bullets
  betterAnswer: string;
  englishRewrite?: string | null;
  tips: string[]; // 2 tips
}

export async function evaluateAnswer(params: {
  question: string;
  answer: string;
  topic?: string;
  languageMode?: string;
}): Promise<EvaluationResult> {
  const { question, answer, topic = "General", languageMode = "English" } = params;

  const prompt = `
You are a senior technical interviewer for Indian campus placements (TCS/Infosys/Product hiring).
Evaluate this candidate's response:
Question: "${question}"
Topic: "${topic}"
Language Mode: "${languageMode}"
Candidate's Answer: "${answer || "(No response / skipped)"}"

Evaluate strictly on:
- Correctness (/10)
- Relevance (/10)
- Structure (/10)
- Technical Depth (/10)
- Communication (/10)
Overall Score: Weighted average (/10).
${languageMode === "Hinglish" ? 'Since language mode is Hinglish, include "englishRewrite": a fluent, professional English rewrite of what the student said.' : '"englishRewrite": null'}

Respond strictly in this JSON format:
{
  "score": 7.5,
  "breakdown": {
    "correctness": 8,
    "relevance": 8,
    "structure": 7,
    "depth": 7,
    "communication": 7.5
  },
  "mainIssue": "Two-line concise statement of the candidate's primary gap or strong point.",
  "problems": [
    "First specific gap or missed detail",
    "Second gap (if any)",
    "Third gap (if any)"
  ],
  "betterAnswer": "Exemplary, recruiter-ready model answer demonstrating high depth and STAR clarity.",
  "englishRewrite": null,
  "tips": [
    "Tip 1 for campus interviews",
    "Tip 2 for campus interviews"
  ]
}
`;

  return callGeminiJson<EvaluationResult>(prompt, () => {
    const words = (answer || "").trim().split(/\s+/).filter(Boolean).length;
    let score = 5.0;
    if (words > 60) score = 8.5;
    else if (words > 35) score = 7.5;
    else if (words > 15) score = 6.0;
    else if (words > 5) score = 4.5;
    else score = 2.5;

    return {
      score,
      breakdown: {
        correctness: Math.min(10, Math.round(score * 1.05)),
        relevance: Math.min(10, Math.round(score * 1.02)),
        structure: Math.min(10, Math.round(score * 0.95)),
        depth: Math.min(10, Math.round(score * 0.90)),
        communication: Math.min(10, Math.round(score * 1.0)),
      },
      mainIssue:
        words > 35
          ? "Good conceptual grasp, but could articulate system tradeoffs and real-world failure modes more sharply."
          : "Answer is brief and surface-level. Placement interviewers look for structured reasoning with technical examples.",
      problems:
        words > 35
          ? [
              "Missed mentioning edge cases and memory/disk space constraints",
              "Could lead with a clearer one-sentence definition before expanding",
            ]
          : [
              "Answer lacked depth and concrete architectural examples",
              "Did not clearly articulate the underlying mechanism or algorithm",
              "Did not address performance tradeoffs",
            ],
      betterAnswer:
        "Start with a direct definition. Explain the internal working mechanism (e.g. data structure, time/space complexity O(log N)). Then discuss practical tradeoffs (write overhead vs read speed). Finally, conclude with an example from a real project or production environment.",
      englishRewrite:
        languageMode === "Hinglish"
          ? "I structured the database using indexed keys to optimize query execution times, while implementing caching to reduce overall server load during high traffic periods."
          : null,
      tips: [
        "Use the STAR method (Situation, Task, Action, Result) for behavioral and project questions.",
        "Always state the time and space complexity upfront when discussing technical algorithms.",
      ],
    };
  });
}

// -------------------------------------------------------------
// 4. REPORT GENERATION
// -------------------------------------------------------------
export interface ReportData {
  topicScores: Array<{ topic: string; score: number; delta?: number; isWeak: boolean }>;
  readinessScore: number; // 0-100
  readyLevel: "Not ready yet" | "Getting there" | "Almost ready" | "Placement ready";
  weakTopics: string[];
  top3Weaknesses: string[];
  resumeTruthCheck: Array<{
    claim: string;
    claimedLevel: string;
    demonstratedLevel: string;
    gap: boolean;
    comment: string;
  }>;
  studyPlan: Array<{
    day: number;
    title: string;
    subtopics: string[];
    practiceTopic: string;
  }>;
}

export async function generateReportData(params: {
  answers: Array<{
    question: string;
    round: string;
    topic?: string | null;
    score?: number | null;
    answer?: string | null;
    breakdownJson?: string | null;
  }>;
  resumeData?: ResumeAnalysis | null;
  previousTopicScores?: Record<string, number>;
}): Promise<ReportData> {
  const { answers, resumeData, previousTopicScores = {} } = params;

  // 1. Group scores by topic
  const topicMap: Record<string, number[]> = {};
  const roundScores: Record<string, number[]> = {
    Technical: [],
    "Project Deep Dive": [],
    HR: [],
    Intro: [],
  };
  const communicationScores: number[] = [];

  answers.forEach((a) => {
    const topic = a.topic || "General";
    const score10 = a.score || 5;
    if (!topicMap[topic]) topicMap[topic] = [];
    topicMap[topic].push(score10 * 10); // convert to 0-100

    if (a.round && roundScores[a.round]) {
      roundScores[a.round].push(score10 * 10);
    }

    if (a.breakdownJson) {
      try {
        const bd = JSON.parse(a.breakdownJson);
        if (bd.communication) communicationScores.push(bd.communication * 10);
      } catch (e) {
        // ignore
      }
    }
  });

  const avg = (arr: number[], fallback: number = 60) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : fallback;

  // Topic Scores & Deltas
  const topicScores = Object.entries(topicMap).map(([topic, scores]) => {
    const currentScore = Math.round(avg(scores));
    const prev = previousTopicScores[topic];
    const delta = prev !== undefined ? currentScore - prev : undefined;
    return {
      topic,
      score: currentScore,
      delta,
      isWeak: currentScore < 60,
    };
  });

  const weakTopics = topicScores.filter((t) => t.isWeak).map((t) => t.topic);

  // Scoring Rules:
  // Readiness Score = Technical 50% + Project/Resume Understanding 15% + Communication 20% + HR 15%
  const techAvg = avg(roundScores.Technical, 65);
  const projAvg = avg(roundScores["Project Deep Dive"], 65);
  const commAvg = avg(communicationScores, 70);
  const hrAvg = avg(roundScores.HR, 70);

  const readinessScore = Math.round(
    techAvg * 0.5 + projAvg * 0.15 + commAvg * 0.2 + hrAvg * 0.15
  );

  let readyLevel: ReportData["readyLevel"] = "Not ready yet";
  if (readinessScore >= 85) readyLevel = "Placement ready";
  else if (readinessScore >= 70) readyLevel = "Almost ready";
  else if (readinessScore >= 50) readyLevel = "Getting there";

  // Prompt Gemini for Top 3 Weaknesses & Resume Truth Check
  const prompt = `
You are the placement director evaluating an interview report for an Indian engineering student.
Interview answers summary:
${answers.map((a) => `[${a.round} - ${a.topic}] Score: ${a.score}/10 | Answer: ${a.answer?.slice(0, 150)}`).join("\n")}

Resume Claims:
${JSON.stringify(resumeData?.claims || ["Optimized database queries with indexing", "Built real-time features with WebSockets", "Deployed with Docker"])}

Generate:
1. "top3Weaknesses": Exactly 3 specific, constructive statements starting with what needs fixing (e.g. "Struggled to articulate B-Tree indexing tradeoffs when pressed on write penalties", "Project explanation lacked quantitative performance metrics", "Behavioral response did not follow the STAR framework").
2. "resumeTruthCheck": Array of 3 items evaluating resume claims against demonstrated interview performance:
   - "claim": string
   - "claimedLevel": "Basic" | "Intermediate" | "Advanced"
   - "demonstratedLevel": "Basic" | "Intermediate" | "Advanced"
   - "gap": boolean (true if demonstrated < claimed)
   - "comment": string (one-line AI assessment)
3. "studyPlan": 5-day study plan for the weakest topic (${weakTopics[0] || "Technical Core & System Design"}):
   - Array of 5 items { "day": 1..5, "title": string, "subtopics": string[], "practiceTopic": string }

Respond strictly in this JSON format:
{
  "top3Weaknesses": [
    "Weakness 1",
    "Weakness 2",
    "Weakness 3"
  ],
  "resumeTruthCheck": [
    {
      "claim": "Optimized database queries",
      "claimedLevel": "Advanced",
      "demonstratedLevel": "Intermediate",
      "gap": true,
      "comment": "Good theoretical understanding, but could not describe write amplification tradeoffs."
    }
  ],
  "studyPlan": [
    {
      "day": 1,
      "title": "B-Tree Internals & Index Anatomy",
      "subtopics": ["Clustered vs Non-Clustered", "Index Lookup Latency", "Prefix Matching"],
      "practiceTopic": "SQL / DBMS"
    }
  ]
}
`;

  const aiExtras = await callGeminiJson<any>(prompt, () => {
    return {
      top3Weaknesses: [
        `Hesitation in technical depth: struggled to explain internal execution mechanics and performance tradeoffs.`,
        `STAR Method delivery: project and behavioral responses lacked a clear quantitative 'Result' metric.`,
        `Surface-level resume defense: claims of optimization were not supported with concrete profiling metrics.`,
      ],
      resumeTruthCheck: (resumeData?.claims || [
        "Optimized database queries with indexing",
        "Built real-time features with WebSockets",
        "Deployed with Docker",
      ]).slice(0, 3).map((claim, idx) => ({
        claim,
        claimedLevel: "Advanced",
        demonstratedLevel: idx === 0 ? "Intermediate" : "Advanced",
        gap: idx === 0,
        comment: idx === 0
          ? "Demonstrated basic concept, but struggled with composite indexing order and disk overhead."
          : "Articulated architecture and implementation cleanly.",
      })),
      studyPlan: [
        { day: 1, title: "Core Fundamentals & Theory", subtopics: ["Definitions", "Architecture", "Key Terminology"], practiceTopic: weakTopics[0] || "SQL" },
        { day: 2, title: "Internal Mechanisms & Tradeoffs", subtopics: ["Memory allocation", "Complexity analysis", "Common failure modes"], practiceTopic: weakTopics[0] || "SQL" },
        { day: 3, title: "Hands-on Problem Solving", subtopics: ["Debugging scenarios", "Coding patterns", "Edge cases"], practiceTopic: weakTopics[0] || "SQL" },
        { day: 4, title: "High-Scale Production Scenarios", subtopics: ["Concurrency", "Caching strategies", "Bottleneck isolation"], practiceTopic: weakTopics[0] || "SQL" },
        { day: 5, title: "Interview Articulation & Rapid Drills", subtopics: ["STAR framing", "90-second pitch", "Mock question practice"], practiceTopic: weakTopics[0] || "SQL" },
      ],
    };
  });

  return {
    topicScores,
    readinessScore,
    readyLevel,
    weakTopics,
    top3Weaknesses: aiExtras.top3Weaknesses || [],
    resumeTruthCheck: aiExtras.resumeTruthCheck || [],
    studyPlan: aiExtras.studyPlan || [],
  };
}

// -------------------------------------------------------------
// 5. PRACTICE GENERATOR
// -------------------------------------------------------------
export interface PracticeQuestion {
  id: number;
  question: string;
  options?: string[];
  hint: string;
  explanation: string;
  modelAnswer: string;
}

export async function generatePracticeQuestions(topic: string, level: string = "Intermediate"): Promise<PracticeQuestion[]> {
  const prompt = `
Generate 5 high-yield placement practice interview questions on the topic "${topic}" at level "${level}" for Indian campus placement preparation.
For each question provide:
- "id": number (1 to 5)
- "question": string
- "options": optional array of 4 multiple-choice options (if conceptual) or omit if open-ended
- "hint": string
- "explanation": string (why this matters for campus placements)
- "modelAnswer": string (ideal recruiter-ready answer)

Respond strictly in this JSON format:
{
  "questions": [
    {
      "id": 1,
      "question": "Clear technical question",
      "options": ["A", "B", "C", "D"],
      "hint": "Key hint",
      "explanation": "Why this matters",
      "modelAnswer": "Model answer"
    }
  ]
}
`;

  const result = await callGeminiJson<{ questions: PracticeQuestion[] }>(prompt, () => {
    return {
      questions: [
        {
          id: 1,
          question: `How does indexing work internally in a database, and how does the B-Tree structure maintain O(log N) lookups?`,
          hint: "Think about balanced trees, branching factor, and disk page pointers.",
          explanation: "Recruiters test if you understand disk I/O vs in-memory tree traversal.",
          modelAnswer: "A B-Tree index maintains keys in sorted order with multiple pointers per node to maximize disk page reads. Lookups traverse from root to leaf in O(log N) time, returning pointers to the actual disk blocks.",
        },
        {
          id: 2,
          question: `In what scenarios can adding an index actually degrade database performance?`,
          options: [
            "A) When read queries are high",
            "B) On tables with frequent INSERT, UPDATE, or DELETE operations",
            "C) On columns with high cardinality",
            "D) When using primary keys",
          ],
          hint: "Consider what happens to the index tree during write operations.",
          explanation: "Crucial for understanding trade-offs in write-heavy systems.",
          modelAnswer: "Every INSERT, UPDATE, and DELETE statement requires updating the B-Tree index nodes and maintaining tree balance. On high-throughput write tables, multiple indices cause write amplification and disk latency.",
        },
        {
          id: 3,
          question: `What is the difference between a Clustered and a Non-Clustered index?`,
          hint: "Think about the physical ordering of rows on disk.",
          explanation: "One of the most frequently asked questions in Indian placement tech rounds.",
          modelAnswer: "A clustered index defines the physical order of data rows on disk (only one allowed per table). Non-clustered indices are separate structures containing pointers back to the clustered index or physical row address.",
        },
        {
          id: 4,
          question: `Given a composite index on (user_id, created_at), will the query: SELECT * FROM orders WHERE created_at > '2024-01-01'; use the index efficiently?`,
          hint: "Remember the leftmost prefix rule in composite indexing.",
          explanation: "Tests whether you understand composite index key order.",
          modelAnswer: "No, it will not use the index efficiently because user_id is the leading column. The database cannot jump directly to a created_at range without filtering on user_id first.",
        },
        {
          id: 5,
          question: `How do you identify slow queries in production, and what command do you run to inspect how the database executes your SQL query?`,
          hint: "Think about EXPLAIN / EXPLAIN ANALYZE and slow query logs.",
          explanation: "Practical engineering discipline expected by top tech recruiters.",
          modelAnswer: "Use EXPLAIN ANALYZE to inspect the execution plan (checking for sequential scans vs index seeks, estimated vs actual rows). Enable slow query logs (like pg_stat_statements in PostgreSQL) to isolate high-latency queries.",
        },
      ],
    };
  });

  return result.questions || [];
}
