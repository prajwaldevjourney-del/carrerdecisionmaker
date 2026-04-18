import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a senior career advisor for Carreriq. You have Google Search access.

Before answering, search for current job market data relevant to the question.
Cross-reference with the candidate's resume data. Give specific, data-backed answers.

RULES:
- Reference candidate's actual skills and match scores in every answer
- Include real numbers (salaries, demand levels, timelines)
- Use labeled sections, be concise and direct

FORMATS:
Best role: Best Role / Match Score / Market Demand / Matched Skills / Skills to Add / Next Step
Skills to learn: Priority Skills list with demand context and timeline
How to improve: Current state / Phase plan / Expected outcome
Career path: Short/Mid/Long term with hiring signals
Salary: Role / Level / Current Range / To Increase 20%+

TONE: Direct. Specific. Data-driven.`;

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
    if (!apiKey) return NextResponse.json({ answer: buildStructuredAnswer(query, context) });

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = buildPrompt(query, context);

    // Try with grounding first
    for (const modelName of ["gemini-2.0-flash", "gemini-2.0-flash-lite"]) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
          // @ts-expect-error googleSearch not yet typed
          tools: [{ googleSearch: {} }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1500 },
        });
        const result = await model.generateContent(prompt);
        const answer = result.response.text().trim();
        if (answer?.length > 20) return NextResponse.json({ answer });
      } catch (e) {
        console.warn(`${modelName} grounding failed:`, (e as Error).message?.slice(0, 80));
      }

      // Try without grounding
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: { temperature: 0.4, maxOutputTokens: 1500 },
        });
        const result = await model.generateContent(prompt);
        const answer = result.response.text().trim();
        if (answer?.length > 20) return NextResponse.json({ answer });
      } catch (e) {
        console.warn(`${modelName} no-grounding failed:`, (e as Error).message?.slice(0, 80));
      }
    }

    return NextResponse.json({ answer: buildStructuredAnswer(query, context) });

  } catch (err) {
    console.error("Assistant error:", err);
    return NextResponse.json({ answer: buildStructuredAnswer(query, context) });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPrompt(query: string, context: any): string {
  return `CANDIDATE:
Name: ${context.name || "User"} | Level: ${context.experience} (${context.years}+ yrs)
${context.currentRole ? `Current Role: ${context.currentRole}` : ""}
Skills (${context.skills.length}): ${context.skills.join(", ")}

JOB MATCHES:
${(context.job_matches ?? []).slice(0, 7).map((j: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
  `• ${j.role}: ${j.match}% | Has: ${(j.matched_skills ?? []).slice(0, 4).join(", ")} | Missing: ${j.missing_skills.slice(0, 4).join(", ")}`
).join("\n")}

QUESTION: ${query}

Search the web for current data, then answer using both the candidate's profile and what you find.`;
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
  const allMissing = [...new Set(jobs.slice(0, 3).flatMap((j: any) => j.missing_skills as string[]))].slice(0, 5);

  if (q.includes("best") || q.includes("suit") || q.includes("fit") || q.includes("job"))
    return `Best Role: ${top.role}\nMatch Score: ${top.match}%\nMatched: ${(top.matched_skills ?? []).slice(0, 5).join(", ")}\nMissing: ${top.missing_skills.slice(0, 4).join(", ")}\nNext Step: Apply to ${top.role} roles while learning ${top.missing_skills[0] ?? "key skills"}`;

  if (q.includes("learn") || q.includes("next") || q.includes("gap") || q.includes("skill"))
    return `Priority Skills:\n${allMissing.map((s, i) => `${i + 1}. ${s} — required for ${jobs[Math.min(i, jobs.length - 1)]?.role ?? "top roles"}`).join("\n")}\n\nStart with: ${allMissing[0]}`;

  if (q.includes("improve") || q.includes("profile"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return `Current: ${level} · ${skills.length} skills · ${top.match}% top match\n\nPlan:\n  Phase 1: Learn ${top.missing_skills[0]}\n  Phase 2: Learn ${top.missing_skills[1]}\n  Phase 3: Apply to ${top.role}\nOutcome: Increases match for ${jobs.slice(0, 2).map((j: any) => j.role).join(", ")}`;

  if (q.includes("path") || q.includes("career") || q.includes("trajectory"))
    return `Short Term: ${level === "Beginner" ? `Junior ${top.role}` : top.role}\nMid Term: Senior ${top.role}\nLong Term: ${level === "Advanced" ? "Principal Engineer / Staff" : "Engineering Manager"}\nKey Milestone: Close ${top.missing_skills.slice(0, 2).join(", ")} gaps`;

  if (q.includes("salary") || q.includes("market") || q.includes("value"))
    return `Role: ${top.role}\nLevel: ${level} (${years}+ yrs)\nTo Increase Value: Add ${top.missing_skills.slice(0, 2).join(", ")}`;

  return `Profile: ${skills.length} skills · ${level} (${years}+ yrs) · Top: ${top.role} at ${top.match}%\nGaps: ${top.missing_skills.slice(0, 3).join(", ")}`;
}
