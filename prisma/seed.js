const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const json = (data) => JSON.stringify(data);

function makeBreakdown(score) {
  const s = Number(score);

  return json({
    correctness: s,
    relevance: s,
    structure: s,
    depth: s,
    communication: s,
  });
}

function makeFeedback(score, topic) {
  const s = Number(score);

  return json({
    mainIssue:
      s < 6
        ? `${topic} needs more depth and structured explanation.`
        : s < 8
        ? `${topic} is improving, but the answer can be more precise.`
        : `Good ${topic} answer. Add edge cases and trade-offs for a stronger response.`,

    problems:
      s < 6
        ? [
            "The answer was not structured clearly.",
            "Important technical details were missing.",
            "The explanation needs more confidence and examples.",
          ]
        : [
            "Some technical details could be stronger.",
            "The answer can be more concise.",
          ],

    betterAnswer:
      `A stronger answer should define ${topic}, explain the core concept step-by-step, and give a practical example.`,

    tips: [
      "Start with a clear definition.",
      "Explain the concept using 2-3 structured points.",
      "Finish with an example or use case.",
    ],
  });
}

function makeAnswer({
  round,
  question,
  answer,
  topic,
  score,
}) {
  return {
    round,
    question,
    answer,
    topic,
    score,
    breakdownJson: makeBreakdown(score),
    feedbackJson: makeFeedback(score, topic),
  };
}

async function main() {
  console.log("🚀 Creating PrepPilot demo data...");

  // =====================================================
  // DEMO STUDENT
  // =====================================================

  const student = await prisma.student.upsert({
    where: {
      email: "demo@preppilot.ai",
    },

    update: {
      name: "Demo Student",
      branch: "CSE",
      year: 3,
      skillsJson: json([
        "Python",
        "Java",
        "SQL",
        "DSA",
        "DBMS",
        "OS",
        "CN",
        "OOP",
      ]),
      targetMode: "Campus Placement",
      companyStyle: "Generic",
      languageMode: "English",
      targetRole: "Software Developer",
      resumeText:
        "B.Tech CSE student with projects in web development and Python. Skills include SQL, DBMS, DSA and OOP.",
      resumeAnalysisJson: json({
        claimedSkills: [
          {
            skill: "SQL",
            level: "Intermediate",
          },
          {
            skill: "Python",
            level: "Intermediate",
          },
          {
            skill: "DSA",
            level: "Intermediate",
          },
          {
            skill: "DBMS",
            level: "Intermediate",
          },
        ],

        projects: [
          {
            name: "Weather API",
            tech: [
              "HTML",
              "CSS",
              "JavaScript",
              "API",
            ],
          },
          {
            name: "Calculator",
            tech: [
              "HTML",
              "CSS",
              "JavaScript",
            ],
          },
        ],

        claims: [
          "Built a Weather API project.",
          "Comfortable with SQL and database concepts.",
          "Strong understanding of DSA fundamentals.",
        ],
      }),
    },

    create: {
      name: "Demo Student",
      email: "demo@preppilot.ai",
      branch: "CSE",
      year: 3,
      skillsJson: json([
        "Python",
        "Java",
        "SQL",
        "DSA",
        "DBMS",
        "OS",
        "CN",
        "OOP",
      ]),
      targetMode: "Campus Placement",
      companyStyle: "Generic",
      languageMode: "English",
      targetRole: "Software Developer",
      resumeText:
        "B.Tech CSE student with projects in web development and Python. Skills include SQL, DBMS, DSA and OOP.",
      resumeAnalysisJson: json({
        claimedSkills: [
          {
            skill: "SQL",
            level: "Intermediate",
          },
          {
            skill: "Python",
            level: "Intermediate",
          },
          {
            skill: "DSA",
            level: "Intermediate",
          },
          {
            skill: "DBMS",
            level: "Intermediate",
          },
        ],

        projects: [
          {
            name: "Weather API",
            tech: [
              "HTML",
              "CSS",
              "JavaScript",
              "API",
            ],
          },
          {
            name: "Calculator",
            tech: [
              "HTML",
              "CSS",
              "JavaScript",
            ],
          },
        ],

        claims: [
          "Built a Weather API project.",
          "Comfortable with SQL and database concepts.",
          "Strong understanding of DSA fundamentals.",
        ],
      }),
    },
  });

  console.log("✅ Demo student:", student.id);

  // =====================================================
  // DELETE OLD DEMO DATA
  // =====================================================

  await prisma.answer.deleteMany({
    where: {
      interview: {
        studentId: student.id,
      },
    },
  });

  await prisma.interview.deleteMany({
    where: {
      studentId: student.id,
    },
  });

  await prisma.topicProgress.deleteMany({
    where: {
      studentId: student.id,
    },
  });

  console.log("🧹 Old demo data cleared.");

  // =====================================================
  // INTERVIEW 1
  // =====================================================

  const interview1 = await prisma.interview.create({
    data: {
      studentId: student.id,
      createdAt: new Date("2026-09-20T10:00:00"),
      overallScore: 52,

      reportJson: json({
        readinessScore: 52,
        readyLevel: "Getting there",

        topicScores: {
          SQL: 45,
          DBMS: 50,
          DSA: 55,
          OOP: 58,
          Communication: 52,
          "Project Understanding": 48,
          HR: 60,
        },

        weakTopics: [
          "SQL",
          "DBMS",
          "Project Understanding",
        ],

        top3Weaknesses: [
          "SQL query formulation and database reasoning",
          "Explaining technical concepts in a structured way",
          "Connecting resume projects with technical decisions",
        ],

        resumeTruthCheck: [
          {
            claim:
              "Comfortable with SQL and database concepts.",
            claimedLevel: "Intermediate",
            demonstratedLevel: "Basic",
            gap: "Gap",
            comment:
              "SQL fundamentals were present but query reasoning was weak.",
          },
          {
            claim:
              "Strong understanding of DSA fundamentals.",
            claimedLevel: "Intermediate",
            demonstratedLevel: "Basic",
            gap: "Gap",
            comment:
              "Basic DSA knowledge was demonstrated, but optimization discussion was limited.",
          },
          {
            claim:
              "Built a Weather API project.",
            claimedLevel: "Intermediate",
            demonstratedLevel: "Basic",
            gap: "Gap",
            comment:
              "Project was explained at a high level without enough implementation detail.",
          },
        ],

        studyPlan: [
          {
            day: 1,
            topic: "SQL",
            subtopics: [
              "SELECT",
              "WHERE",
              "GROUP BY",
              "HAVING",
            ],
          },
          {
            day: 2,
            topic: "SQL",
            subtopics: [
              "JOINs",
              "Subqueries",
              "Aggregate functions",
            ],
          },
          {
            day: 3,
            topic: "DBMS",
            subtopics: [
              "Normalization",
              "Keys",
              "Transactions",
            ],
          },
          {
            day: 4,
            topic: "DSA",
            subtopics: [
              "Complexity",
              "Arrays",
              "Searching",
            ],
          },
          {
            day: 5,
            topic: "Project Understanding",
            subtopics: [
              "Architecture",
              "API flow",
              "Technical decisions",
            ],
          },
        ],
      }),
    },
  });

  const answers1 = [
    makeAnswer({
      round: "Round 1 - Intro",
      question: "Tell me about yourself.",
      answer:
        "I am a CSE student and I am interested in software development. I have worked on some small web projects and I am learning DSA.",
      topic: "Communication",
      score: 5.5,
    }),

    makeAnswer({
      round: "Round 2 - Technical",
      question:
        "What is the difference between INNER JOIN and LEFT JOIN in SQL?",
      answer:
        "Inner join gives matching records and left join gives records from left table also.",
      topic: "SQL",
      score: 4.5,
    }),

    makeAnswer({
      round: "Round 2 - Technical",
      question:
        "What is normalization in DBMS?",
      answer:
        "Normalization is used to reduce duplicate data and organize tables.",
      topic: "DBMS",
      score: 5.0,
    }),

    makeAnswer({
      round: "Round 2 - Technical",
      question:
        "What is the time complexity of binary search?",
      answer:
        "Binary search is O log n because it divides the array into half.",
      topic: "DSA",
      score: 5.5,
    }),

    makeAnswer({
      round: "Round 2 - Technical",
      question:
        "Explain encapsulation in OOP.",
      answer:
        "Encapsulation means wrapping data and methods together and using access modifiers.",
      topic: "OOP",
      score: 5.8,
    }),

    makeAnswer({
      round: "Round 3 - Project Deep Dive",
      question:
        "Explain how your Weather API project works.",
      answer:
        "I used an API to get weather data and displayed it on the webpage using JavaScript.",
      topic: "Project Understanding",
      score: 4.8,
    }),

    makeAnswer({
      round: "Round 3 - Project Deep Dive",
      question:
        "What happens when a user searches for a city in your Weather project?",
      answer:
        "The API is called and then weather information is shown.",
      topic: "Project Understanding",
      score: 4.8,
    }),

    makeAnswer({
      round: "Round 4 - HR",
      question:
        "Why should we hire you?",
      answer:
        "I am hardworking and I am learning quickly. I will improve my skills.",
      topic: "HR",
      score: 6.0,
    }),

    makeAnswer({
      round: "Round 4 - HR",
      question:
        "Where do you see yourself in three years?",
      answer:
        "I want to become a good software developer and work on real projects.",
      topic: "Communication",
      score: 5.8,
    }),
  ];

  for (const answer of answers1) {
    await prisma.answer.create({
      data: {
        interviewId: interview1.id,
        ...answer,
      },
    });
  }

  // =====================================================
  // INTERVIEW 2
  // =====================================================

  const interview2 = await prisma.interview.create({
    data: {
      studentId: student.id,
      createdAt: new Date("2026-10-02T10:00:00"),
      overallScore: 64,

      reportJson: json({
        readinessScore: 64,
        readyLevel: "Getting there",

        topicScores: {
          SQL: 62,
          DBMS: 68,
          DSA: 70,
          OOP: 72,
          Communication: 66,
          "Project Understanding": 58,
          HR: 68,
        },

        weakTopics: [
          "Project Understanding",
          "SQL",
        ],

        top3Weaknesses: [
          "Project architecture and implementation explanation",
          "Advanced SQL query reasoning",
          "Explaining technical trade-offs confidently",
        ],

        resumeTruthCheck: [
          {
            claim:
              "Comfortable with SQL and database concepts.",
            claimedLevel: "Intermediate",
            demonstratedLevel: "Intermediate",
            gap: "No Gap",
            comment:
              "SQL performance improved significantly compared with the previous interview.",
          },
          {
            claim:
              "Strong understanding of DSA fundamentals.",
            claimedLevel: "Intermediate",
            demonstratedLevel: "Intermediate",
            gap: "No Gap",
            comment:
              "You explained complexity and optimization more confidently.",
          },
          {
            claim:
              "Built a Weather API project.",
            claimedLevel: "Intermediate",
            demonstratedLevel: "Basic",
            gap: "Gap",
            comment:
              "The project is real, but architecture and implementation details still need improvement.",
          },
        ],

        studyPlan: [
          {
            day: 1,
            topic: "Project Understanding",
            subtopics: [
              "Architecture",
              "API request flow",
              "Error handling",
            ],
          },
          {
            day: 2,
            topic: "Project Understanding",
            subtopics: [
              "Technical decisions",
              "Trade-offs",
              "Edge cases",
            ],
          },
          {
            day: 3,
            topic: "SQL",
            subtopics: [
              "Complex JOINs",
              "Subqueries",
              "Window functions",
            ],
          },
          {
            day: 4,
            topic: "Communication",
            subtopics: [
              "STAR structure",
              "Concise explanations",
              "Technical confidence",
            ],
          },
          {
            day: 5,
            topic: "Mock Interview",
            subtopics: [
              "Technical round",
              "Project round",
              "HR round",
            ],
          },
        ],
      }),
    },
  });

  const answers2 = [
    makeAnswer({
      round: "Round 1 - Intro",
      question: "Tell me about yourself.",
      answer:
        "I am a third-year CSE student focused on software development. I have built projects using JavaScript and APIs and I am improving my DSA and SQL skills for placements.",
      topic: "Communication",
      score: 6.6,
    }),

    makeAnswer({
      round: "Round 2 - Technical",
      question:
        "Write a SQL query to find the second highest salary.",
      answer:
        "We can use SELECT MAX salary where salary is less than SELECT MAX salary from employee.",
      topic: "SQL",
      score: 6.2,
    }),

    makeAnswer({
      round: "Round 2 - Technical",
      question:
        "Explain normalization and why it is useful.",
      answer:
        "Normalization organizes data into related tables and reduces redundancy. It improves consistency and avoids update, insert and delete anomalies.",
      topic: "DBMS",
      score: 6.8,
    }),

    makeAnswer({
      round: "Round 2 - Technical",
      question:
        "How would you optimize a slow algorithm?",
      answer:
        "First I would identify the complexity and bottleneck. Then I would check whether a better data structure or algorithm can reduce time complexity.",
      topic: "DSA",
      score: 7.0,
    }),

    makeAnswer({
      round: "Round 2 - Technical",
      question:
        "Explain inheritance and polymorphism.",
      answer:
        "Inheritance allows one class to reuse properties and methods of another class. Polymorphism allows the same interface or method name to behave differently depending on the object.",
      topic: "OOP",
      score: 7.2,
    }),

    makeAnswer({
      round: "Round 3 - Project Deep Dive",
      question:
        "Explain the architecture of your Weather API project.",
      answer:
        "The frontend collects the city name, JavaScript sends an HTTP request to the weather API, the response is converted to JSON and the required fields are displayed in the UI.",
      topic: "Project Understanding",
      score: 5.8,
    }),

    makeAnswer({
      round: "Round 3 - Project Deep Dive",
      question:
        "How would you improve your Weather API project?",
      answer:
        "I would add better error handling, loading states, caching and input validation. I could also improve the UI for mobile devices.",
      topic: "Project Understanding",
      score: 5.8,
    }),

    makeAnswer({
      round: "Round 4 - HR",
      question:
        "Why should we hire you?",
      answer:
        "I have a learning mindset and I actively practice technical skills. I have built projects and I am working on improving my DSA, SQL and communication for real software development roles.",
      topic: "HR",
      score: 6.8,
    }),

    makeAnswer({
      round: "Round 4 - HR",
      question:
        "Tell me about a weakness you are working on.",
      answer:
        "Earlier I struggled to explain technical concepts in a structured way. I am improving it by practicing interview answers and reviewing my weak topics after every session.",
      topic: "Communication",
      score: 6.6,
    }),
  ];

  for (const answer of answers2) {
    await prisma.answer.create({
      data: {
        interviewId: interview2.id,
        ...answer,
      },
    });
  }

  // =====================================================
  // TOPIC PROGRESS
  // =====================================================

  const progress = [
    ["SQL", 45, "2026-09-20T10:30:00"],
    ["SQL", 62, "2026-10-02T10:30:00"],

    ["DBMS", 50, "2026-09-20T10:30:00"],
    ["DBMS", 68, "2026-10-02T10:30:00"],

    ["DSA", 55, "2026-09-20T10:30:00"],
    ["DSA", 70, "2026-10-02T10:30:00"],

    ["OOP", 58, "2026-09-20T10:30:00"],
    ["OOP", 72, "2026-10-02T10:30:00"],

    ["Communication", 52, "2026-09-20T10:30:00"],
    ["Communication", 66, "2026-10-02T10:30:00"],

    [
      "Project Understanding",
      48,
      "2026-09-20T10:30:00",
    ],
    [
      "Project Understanding",
      58,
      "2026-10-02T10:30:00",
    ],

    ["HR", 60, "2026-09-20T10:30:00"],
    ["HR", 68, "2026-10-02T10:30:00"],
  ];

  for (const [topic, score, date] of progress) {
    await prisma.topicProgress.create({
      data: {
        studentId: student.id,
        topic,
        score: Number(score),
        updatedAt: new Date(date),
      },
    });
  }

  console.log("");
  console.log("======================================");
  console.log("🎉 DEMO DATA CREATED SUCCESSFULLY");
  console.log("======================================");
  console.log("");
  console.log("Student: Demo Student");
  console.log("Email:   demo@preppilot.ai");
  console.log("");
  console.log("Interview 1: 52");
  console.log("Interview 2: 64");
  console.log("Improvement: +12 points");
  console.log("");
  console.log("SQL:  45 -> 62");
  console.log("DBMS: 50 -> 68");
  console.log("DSA:  55 -> 70");
  console.log("OOP:  58 -> 72");
  console.log("");
  console.log("======================================");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });