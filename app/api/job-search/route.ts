import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface LiveJob {
  title: string;
  company: string;
  location: string;
  type: string;
  matchReason: string;
  applyUrl: string;
  source: string;
}

// NOTE: googleSearch grounding and thinkingConfig cannot be used together.
// We use grounding only — Gemini searches the web and returns real job listings.
const SYSTEM_PROMPT = `You are a job search assistant. Search the web RIGHT NOW for real, currently open job postings.

You MUST use Google Search to find actual live job listings. Do not fabricate jobs.

After searching, return ONLY a valid JSON array with this exact format — no markdown, no explanation, just the array:
[
  {
    "title": "exact job title",
    "company": "real company name",
    "location": "city, country or Remote",
    "type": "Full-time | Part-time | Contract | Remote",
    "matchReason": "one sentence why this matches the candidate",
    "applyUrl": "real working URL to the job posting",
    "source": "LinkedIn | Indeed | Glassdoor | company website"
  }
]

STRICT RULES:
- Search LinkedIn Jobs, Indeed, Glassdoor, and company career pages
- Return 6–8 REAL currently open positions
- applyUrl must be a real, working, direct link to the job posting
- Match the candidate's skills and experience level
- Include a mix of remote and on-site roles
- Include a mix of company sizes`;

export async function POST(req: NextRequest) {
  let body: { resume: any; jobs: any[] }; // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ jobs: [] }, { status: 400 });
  }

  const { resume, jobs } = body;

  if (!resume?.skills?.length) {
    return NextResponse.json({ jobs: buildFallbackJobs(resume, jobs) });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ jobs: buildFallbackJobs(resume, jobs) });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Google Search grounding — NO thinkingConfig (they conflict)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      // @ts-expect-error googleSearch not yet typed in SDK
      tools: [{ googleSearch: {} }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4000,
      },
    });

    const topRoles = jobs
      .slice(0, 3)
      .map((j: { title: string; matchPercent: number }) => `${j.title} (${j.matchPercent}% match)`)
      .join(", ");
    const topSkills = resume.skills.slice(0, 10).join(", ");
    const level = resume.experienceLevel;
    const years = resume.yearsOfExperience;
    const prefix = level === "Beginner" ? "Junior " : level === "Advanced" ? "Senior " : "";

    const prompt = `Search the web for real, currently open job postings for this candidate.

Candidate:
- Level: ${level} (${years}+ years experience)
- Skills: ${topSkills}
- Best matched roles: ${topRoles}

Search LinkedIn Jobs, Indeed, and Glassdoor for "${prefix}${jobs[0]?.title ?? "Software Developer"}" and similar roles.
Find 6–8 real open positions posted recently.
Return ONLY the JSON array.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Aggressively extract JSON array
    let text = raw
      .replace(/^```json\s*/im, "")
      .replace(/^```\s*/im, "")
      .replace(/```\s*$/im, "")
      .trim();

    // Find the JSON array — it might be buried in text
    const start = text.indexOf("[");
    const end   = text.lastIndexOf("]");

    if (start === -1 || end === -1 || end <= start) {
      console.warn("No JSON array found in response, using fallback. Raw:", raw.slice(0, 300));
      return NextResponse.json({ jobs: buildFallbackJobs(resume, jobs) });
    }

    const jsonStr = text.slice(start, end + 1);
    const parsed: LiveJob[] = JSON.parse(jsonStr);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json({ jobs: buildFallbackJobs(resume, jobs) });
    }

    // Validate and clean each job entry
    const cleaned = parsed
      .filter(j => j.title && j.company && j.applyUrl)
      .map(j => ({
        title:       j.title       || "Software Developer",
        company:     j.company     || "Company",
        location:    j.location    || "Remote",
        type:        j.type        || "Full-time",
        matchReason: j.matchReason || "Matches your skill profile",
        applyUrl:    j.applyUrl    || "#",
        source:      j.source      || "LinkedIn",
      }));

    return NextResponse.json({ jobs: cleaned.length > 0 ? cleaned : buildFallbackJobs(resume, jobs) });

  } catch (err) {
    console.error("Job search Gemini error:", err);
    return NextResponse.json({ jobs: buildFallbackJobs(resume, jobs) });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFallbackJobs(resume: any, jobs: any[]): LiveJob[] {
  const topRole    = jobs?.[0]?.title ?? "Software Developer";
  const secondRole = jobs?.[1]?.title ?? "Backend Developer";
  const thirdRole  = jobs?.[2]?.title ?? "Full Stack Developer";
  const level  = resume?.experienceLevel ?? "Intermediate";
  const prefix = level === "Beginner" ? "Junior+" : level === "Advanced" ? "Senior+" : "";
  const q1 = encodeURIComponent(`${prefix} ${topRole}`).replace(/%20/g, "+");
  const q2 = encodeURIComponent(`${prefix} ${secondRole}`).replace(/%20/g, "+");
  const q3 = encodeURIComponent(`${prefix} ${thirdRole}`).replace(/%20/g, "+");

  return [
    {
      title: `${prefix} ${topRole}`.trim(),
      company: "LinkedIn Jobs",
      location: "Remote / Worldwide",
      type: "Full-time",
      matchReason: `Matches your top skill set for ${topRole}`,
      applyUrl: `https://www.linkedin.com/jobs/search/?keywords=${q1}&f_WT=2`,
      source: "LinkedIn",
    },
    {
      title: `${prefix} ${secondRole}`.trim(),
      company: "Indeed",
      location: "Remote / Worldwide",
      type: "Full-time",
      matchReason: `Strong overlap with your ${secondRole} skill profile`,
      applyUrl: `https://www.indeed.com/jobs?q=${q2}&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11`,
      source: "Indeed",
    },
    {
      title: `${prefix} ${thirdRole}`.trim(),
      company: "Glassdoor",
      location: "Remote / Worldwide",
      type: "Full-time",
      matchReason: `Aligns with your experience level and matched skills`,
      applyUrl: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${q3}`,
      source: "Glassdoor",
    },
    {
      title: `${prefix} ${topRole}`.trim(),
      company: "We Work Remotely",
      location: "Remote",
      type: "Remote",
      matchReason: `Remote-first companies hiring for ${topRole} skills`,
      applyUrl: `https://weworkremotely.com/remote-jobs/search?term=${q1}`,
      source: "We Work Remotely",
    },
  ];
}
