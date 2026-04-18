import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a senior career advisor and market intelligence analyst for Carreriq.

You have access to Google Search. Use it to find real, current information before answering.

For EVERY question:
1. Search for current job market data, salary ranges, skill demand, hiring trends relevant to the question
2. Cross-reference with the candidate's actual resume data provided
3. Give a specific, data-backed answer using BOTH sources

RULES:
- Never give generic advice — every answer must reference the candidate's actual skills and match scores
- Always include real numbers (salaries, demand levels, timelines)
- Be direct and structured — use labeled sections
- Keep answers focused and actionable

RESPONSE FORMATS:

Best role / job fit:
Best Role: [role]
Match Score: [X]%
Market Demand: [current demand signal]
Your Matched Skills: [from their profile]
Skills to Add: [their actual gaps + why each matters now]
Next Step: [specific action]

Skills to learn:
Priority Skills (current market demand):
1. [skill] — [why in demand now] — closes gap in [their role]
2. [skill] — [demand signal] — required for [their role]
3. [skill] — [market context] — high-impact across their matches
Timeline: [realistic estimate]

How to improve:
Current: [level] · [X] skills · [Y]% top match
Plan:
  Phase 1 (weeks 1–4): [skill] — [market reason]
  Phase 2 (weeks 5–8): [skill] — [demand context]
  Phase 3: Apply to [role] positions
Outcome: Match score ~[X]% → ~[Y]%

Career path:
Short Term (0–12 months): [role] — [hiring signal]
Mid Term (1–3 years): [role] — [trajectory]
Long Term (3–7 years): [role] — [industry direction]
Key Milestone: [what unlocks next level]

Automation risk:
Low Risk (your matches): [roles + why safe]
Higher Risk: [roles + threat level]
Recommendation: [specific pivot]

Market value / salary:
Role: [their top match]
Level: [their level]
Current Range: [real salary range from search]
Remote Premium: [difference]
To Increase 20%+: [specific skills from their gaps]

TONE: Direct. Specific. Data-driven. Like a senior advisor who just searched the web.`;

export async function POST(req: NextRequest) {
  let query = "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let context: any = null;

  try {
    const body = await req.json();
    query = body.query;
    context = body.context;

    if (!query?.trim() || !context?.skills?.length) {
      return NextResponse.json({ answer: "Insufficient data. Upload resume for analysis." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ answer: buildStructuredAnswer(query, context) });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = buildPrompt(query, context);

    // Try gemini-2.0-flash with Google Search grounding (most reliable for grounding)
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: SYSTEM_PROMPT,
        // @ts-expect-error googleSearch tool not yet typed in SDK
        tools: [{ googleSearch: {} }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      });
      const result = await model.generateContent(prompt);
      const answer = result.response.text().trim();
      if (answer && answer.length > 20) {
        return NextResponse.json({ answer });
      }
    } catch (e1) {
      console.warn("gemini-2.0-flash grounding failed:", (e1 as Error).message);
    }

    // Try gemini-2.0-flash with grounding
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: SYSTEM_PROMPT,
        // @ts-expect-error googleSearch tool not yet typed in SDK
        tools: [{ googleSearch: {} }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      });
      const result = await model.generateContent(prompt);
      const answer = result.response.text().trim();
      if (answer && answer.length > 20) {
        return NextResponse.json({ answer });
      }
    } catch (e2) {
      console.warn("gemini-2.0-flash grounding failed:", (e2 as Error).message);
    }

    // Try gemini-2.0-flash without grounding
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      });
      const result = await model.generateContent(prompt);
      const answer = result.response.text().trim();
      if (answer && answer.length > 20) {
        return NextResponse.json({ answer });
      }
    } catch (e3) {
      console.warn("gemini-2.0-flash no-grounding failed:", (e3 as Error).message);
    }

    // Final fallback
    return NextResponse.json({ answer: buildStructuredAnswer(query, context) });

  } catch (err) {
    console.error("Assistant route error:", err);
    return NextResponse.json({ answer: buildStructuredAnswer(query, context) });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPrompt(query: string, context: any): string {
  return `CANDIDATE PROFILE:
Name: ${context.name || "User"}
Experience Level: ${context.experience} (${context.years}+ years)
Skills (${context.skills.length} total): ${context.skills.join(", ")}

JOB MATCH SCORES:
${(context.job_matches ?? [])
  .slice(0, 7)
  .map((j: { role: string; match: number; missing_skills: string[]; matched_skills?: string[] }) =>
    `• ${j.role}: ${j.match}% | Has: ${(j.matched_skills ?? []).slice(0, 5).join(", ")} | Missing: ${j.missing_skills.slice(0, 5).join(", ")}`
  ).join("\n")}

QUESTION: ${query}

Search the web for current data relevant to this question, then give a precise answer using both the candidate's profile and what you find.`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStructuredAnswer(query: string, context: any): string {
  if (!context) return "Insufficient data. Upload resume for analysis.";

  const q = query.toLowerCase();
  const jobs = context.job_matches ?? [];
  const top = jobs[0];
  const skills: string[] = context.skills ?? [];
  const level: string = context.experience ?? "Unknown";
  const years: number = context.years ?? 0;

  if (!top) return "Insufficient data. Upload resume for analysis.";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allMissing = [...new Set(jobs.slice(0, 3).flatMap((j: any) => j.missing_skills as string[]))].slice(0, 6);

  if (q.includes("best") || q.includes("suit") || q.includes("fit") || q.includes("job")) {
    return `Best Role: ${top.role}
Match Score: ${top.match}%
Your Matched Skills: ${(top.matched_skills ?? []).slice(0, 5).join(", ")}
Skills to Add: ${top.missing_skills.slice(0, 4).join(", ")}
Next Step: Apply to ${top.role} roles while learning ${top.missing_skills[0] ?? "missing skills"}`;
  }

  if (q.includes("learn") || q.includes("next") || q.includes("gap") || q.includes("skill")) {
    return `Priority Skills to Learn:
${allMissing.map((s, i) => `${i + 1}. ${s} — required for ${jobs[Math.min(i, jobs.length - 1)]?.role ?? "top roles"}`).join("\n")}

Start with: ${allMissing[0]} — appears across your top ${Math.min(3, jobs.length)} matched roles.`;
  }

  if (q.includes("improve") || q.includes("profile")) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return `Current: ${level} · ${skills.length} skills · ${top.match}% top match

Plan:
  Phase 1: Learn ${top.missing_skills[0] ?? "core skills"}
  Phase 2: Learn ${top.missing_skills[1] ?? "secondary skills"}
  Phase 3: Apply to ${top.role} positions
Outcome: Increases match for ${jobs.slice(0, 2).map((j: any) => j.role).join(", ")}`;
  }

  if (q.includes("path") || q.includes("career") || q.includes("trajectory")) {
    return `Career Path (${level}, ${years}+ yrs):

Short Term (0–12 months): ${level === "Beginner" ? `Junior ${top.role}` : top.role}
Mid Term (1–3 years): Senior ${top.role}
Long Term (3–7 years): ${level === "Advanced" ? "Principal Engineer / Staff Engineer" : "Engineering Manager or Tech Lead"}
Key Milestone: Close gaps in ${top.missing_skills.slice(0, 2).join(", ")}`;
  }

  if (q.includes("automation") || q.includes("risk")) {
    return `Automation Risk (your matches):

Lower Risk: DevOps Engineer, ML Engineer, Cloud Engineer — require complex system thinking
Higher Risk: Data Analyst — routine analysis increasingly automated
Recommendation: Focus on architecture and system design skills to stay automation-resistant.`;
  }

  if (q.includes("salary") || q.includes("market") || q.includes("value") || q.includes("pay")) {
    const ranges: Record<string, Record<string, string>> = {
      Beginner:     { "Frontend Developer": "$50k–$80k", "Backend Developer": "$55k–$85k", "Full Stack Developer": "$55k–$90k", "ML Engineer": "$70k–$100k", "DevOps Engineer": "$65k–$95k" },
      Intermediate: { "Frontend Developer": "$80k–$120k", "Backend Developer": "$90k–$130k", "Full Stack Developer": "$90k–$135k", "ML Engineer": "$110k–$160k", "DevOps Engineer": "$100k–$145k" },
      Advanced:     { "Frontend Developer": "$120k–$180k", "Backend Developer": "$130k–$200k", "Full Stack Developer": "$130k–$200k", "ML Engineer": "$160k–$250k", "DevOps Engineer": "$140k–$210k" },
    };
    const range = ranges[level]?.[top.role] ?? "$70k–$180k (varies by location)";
    return `Market Value:
Role: ${top.role}
Level: ${level} (${years}+ years)
Estimated Range: ${range}
Remote Premium: +10–20% for senior roles
To Increase 20%+: Add ${top.missing_skills.slice(0, 2).join(", ")}`;
  }

  return `Profile: ${skills.length} skills · ${level} (${years}+ yrs) · Top match: ${top.role} at ${top.match}%
Key Gaps: ${top.missing_skills.slice(0, 3).join(", ")}

Ask: best job fit · skills to learn · career path · salary · automation risk`;
}
