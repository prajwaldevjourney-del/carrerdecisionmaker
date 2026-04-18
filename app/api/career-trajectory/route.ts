import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a career trajectory engine. You receive structured resume data and return ONLY a JSON object. No explanation. No markdown. No prose.

Output format (strict JSON, nothing else):
{
  "shortTerm": ["role or action", "role or action", "role or action"],
  "midTerm": ["role or action", "role or action", "role or action"],
  "longTerm": ["role or action", "role or action", "role or action"],
  "summary": "One precise sentence about this person's career direction."
}

Rules:
- shortTerm = 0–12 months (realistic next steps based on current skills and level)
- midTerm = 1–3 years (growth roles after closing skill gaps)
- longTerm = 3–7 years (leadership, specialization, or senior IC track)
- Each array: exactly 3 items
- Items must be specific to the person's actual skills and top matched roles
- DO NOT use generic items like "keep learning" or "grow professionally"
- Base everything strictly on the provided data`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFallbackTrajectory(resume: any, jobs: any[]) {
  const level = resume.experienceLevel as string;
  const topJob = jobs[0]?.title ?? "Software Developer";
  const secondJob = jobs[1]?.title ?? topJob;
  const skills = (resume.skills as string[]) ?? [];

  const hasML = skills.some(s => ["tensorflow", "pytorch", "machine learning", "scikit-learn"].includes(s));
  const hasCloud = skills.some(s => ["aws", "gcp", "azure", "kubernetes"].includes(s));
  const hasData = skills.some(s => ["sql", "pandas", "data visualization", "statistics"].includes(s));

  const short =
    level === "Beginner"
      ? [`Junior ${topJob}`, "Build 2–3 portfolio projects", `Contribute to open source`]
      : level === "Intermediate"
      ? [topJob, secondJob, "Lead a small team or project"]
      : [`Senior ${topJob}`, "Staff Engineer or Tech Lead", "Drive cross-team architecture"];

  const mid =
    level === "Beginner"
      ? [topJob, secondJob, "Contribute to open source"]
      : level === "Intermediate"
      ? [`Senior ${topJob}`, hasCloud ? "Cloud Architect" : "System Design specialist", "Architect-level contributions"]
      : ["Principal Engineer", hasML ? "AI/ML Product Lead" : "Platform Architect", "Cross-org technical leadership"];

  const long =
    level === "Beginner"
      ? [`Senior ${topJob}`, "Tech Lead or Specialist", hasData ? "Head of Data" : "Engineering Manager"]
      : level === "Intermediate"
      ? ["Engineering Manager or Principal Engineer", hasML ? "Head of AI" : "CTO / Technical Director", "Founder / Technical Co-founder"]
      : ["VP of Engineering or CTO", hasCloud ? "Head of Infrastructure" : "Chief Architect", "Founder / Technical Co-founder"];

  return {
    shortTerm: short,
    midTerm: mid,
    longTerm: long,
    summary: `${resume.name} is positioned as a ${level} ${topJob} with ${resume.skills.length} skills and ${resume.yearsOfExperience}+ years of experience.`,
  };
}

export async function POST(req: NextRequest) {
  let body: { resume: any; jobs: any[] }; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { resume, jobs } = body;

  if (!resume || !jobs?.length) {
    return NextResponse.json({ error: "Insufficient data" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Try Gemini first
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000,
        },
      });

      const prompt = `
Name: ${resume.name}
Experience Level: ${resume.experienceLevel}
Years of Experience: ${resume.yearsOfExperience}
Skills: ${resume.skills.join(", ")}

Top Job Matches:
${jobs
  .slice(0, 5)
  .map(
    (j: { title: string; matchPercent: number; matchedSkills: string[]; missingSkills: string[] }) =>
      `- ${j.title}: ${j.matchPercent}% | Has: ${j.matchedSkills.slice(0, 4).join(", ")} | Missing: ${j.missingSkills.slice(0, 4).join(", ")}`
  )
  .join("\n")}

Generate the career trajectory JSON now.`;

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch (err) {
      console.warn("Gemini trajectory failed, using fallback:", err);
      // Fall through to local fallback
    }
  }

  // Local fallback — always works
  return NextResponse.json(buildFallbackTrajectory(resume, jobs));
}
