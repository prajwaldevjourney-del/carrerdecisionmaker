import { NextRequest, NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/pdfParser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { computeJobMatches } from "@/lib/jobMatcher";
import { generateRoadmap } from "@/lib/roadmapGenerator";
import { generateCareerTrajectory } from "@/lib/careerEngine";
import { extractSkillsFromText, detectExperienceLevel, extractName, extractEmail } from "@/lib/skillDatabase";

// Models to try in order — gemini-2.5-flash is fastest and most capable
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

function buildPrompt(rawText: string): string {
  return `You are an expert resume parser. Extract EVERYTHING from this resume accurately.

IMPORTANT: Return ONLY a valid JSON object. No markdown. No explanation. Just JSON.

{
  "name": "exact full name",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "location": "city, state/country or empty string",
  "currentRole": "most recent job title or empty string",
  "yearsOfExperience": <number — total years of work experience>,
  "experienceLevel": "<Beginner|Intermediate|Advanced>",
  "education": "degree, field, institution or empty string",
  "summary": "2-sentence professional summary based on this resume",
  "skills": ["list every technical skill, tool, language, framework, platform, methodology mentioned anywhere in the resume — normalized to lowercase"],
  "workExperience": [
    {
      "title": "job title",
      "company": "company name",
      "duration": "start – end dates",
      "highlights": ["key responsibility or achievement"]
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "brief description",
      "techStack": ["tech used"]
    }
  ],
  "certifications": ["certification name"],
  "jobMatches": [
    {
      "id": "frontend-dev",
      "title": "Frontend Developer",
      "requiredSkills": ["react","typescript","javascript","html","css","tailwind","redux","jest","webpack","accessibility"],
      "matchedSkills": ["<skills from requiredSkills that candidate HAS>"],
      "missingSkills": ["<skills from requiredSkills that candidate LACKS>"],
      "matchPercent": <integer 0-100>,
      "automationRisk": "Medium"
    },
    {
      "id": "backend-dev",
      "title": "Backend Developer",
      "requiredSkills": ["nodejs","python","rest api","postgresql","redis","docker","microservices","testing","git","system design"],
      "matchedSkills": ["<candidate's matching skills>"],
      "missingSkills": ["<candidate's missing skills>"],
      "matchPercent": <integer>,
      "automationRisk": "Medium"
    },
    {
      "id": "fullstack-dev",
      "title": "Full Stack Developer",
      "requiredSkills": ["react","nodejs","typescript","postgresql","docker","rest api","git","css","redis","testing"],
      "matchedSkills": ["<candidate's matching skills>"],
      "missingSkills": ["<candidate's missing skills>"],
      "matchPercent": <integer>,
      "automationRisk": "Medium"
    },
    {
      "id": "ml-engineer",
      "title": "ML Engineer",
      "requiredSkills": ["python","tensorflow","pytorch","scikit-learn","pandas","numpy","mlflow","sql","docker","statistics"],
      "matchedSkills": ["<candidate's matching skills>"],
      "missingSkills": ["<candidate's missing skills>"],
      "matchPercent": <integer>,
      "automationRisk": "Low"
    },
    {
      "id": "devops-engineer",
      "title": "DevOps Engineer",
      "requiredSkills": ["docker","kubernetes","aws","terraform","ci/cd","linux","bash","nginx","prometheus","helm"],
      "matchedSkills": ["<candidate's matching skills>"],
      "missingSkills": ["<candidate's missing skills>"],
      "matchPercent": <integer>,
      "automationRisk": "Low"
    },
    {
      "id": "data-analyst",
      "title": "Data Analyst",
      "requiredSkills": ["sql","python","pandas","data visualization","statistics","excel","tableau","matplotlib","seaborn","reporting"],
      "matchedSkills": ["<candidate's matching skills>"],
      "missingSkills": ["<candidate's missing skills>"],
      "matchPercent": <integer>,
      "automationRisk": "High"
    },
    {
      "id": "cloud-engineer",
      "title": "Cloud Engineer",
      "requiredSkills": ["aws","azure","gcp","terraform","kubernetes","docker","ci/cd","linux","cloudformation","networking"],
      "matchedSkills": ["<candidate's matching skills>"],
      "missingSkills": ["<candidate's missing skills>"],
      "matchPercent": <integer>,
      "automationRisk": "Low"
    }
  ],
  "roadmap": [
    {
      "skill": "skill name",
      "priority": "<High|Medium|Low>",
      "timeline": "X weeks",
      "reason": "why this skill matters for this specific candidate"
    }
  ],
  "career": {
    "shortTerm": ["specific role or action", "specific role or action", "specific role or action"],
    "midTerm": ["specific role or action", "specific role or action", "specific role or action"],
    "longTerm": ["specific role or action", "specific role or action", "specific role or action"],
    "summary": "one sentence about this person's career direction"
  }
}

CALCULATION RULES:
- matchPercent = round(matchedSkills.length / requiredSkills.length * 100)
- matchedSkills = intersection of candidate's skills with requiredSkills (check carefully)
- missingSkills = requiredSkills NOT in candidate's skills
- yearsOfExperience = sum of all work experience durations as integer
- experienceLevel: Beginner=0-2yrs or student/intern, Intermediate=2-5yrs, Advanced=5+yrs or senior/lead/architect
- roadmap: top 8 skills the candidate is missing, ordered by career impact
- career: specific to this person's actual background, not generic

RESUME TEXT (extract everything accurately):
${rawText}`;
}

async function callGemini(rawText: string, apiKey: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildPrompt(rawText);

  for (const modelName of MODELS) {
    try {
      console.log(`[parse] Trying ${modelName} (text: ${rawText.length} chars)...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0, maxOutputTokens: 8192 },
      });

      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();

      // Strip markdown fences if present
      text = text.replace(/^```json\s*/im, "").replace(/^```\s*/im, "").replace(/```\s*$/im, "").trim();

      // Find JSON boundaries
      const start = text.indexOf("{");
      const end   = text.lastIndexOf("}");
      if (start === -1 || end === -1) {
        console.warn(`[parse] ${modelName}: no JSON found in response`);
        continue;
      }

      const parsed = JSON.parse(text.slice(start, end + 1));

      // Validate minimum required fields
      if (!parsed.name || !Array.isArray(parsed.skills)) {
        console.warn(`[parse] ${modelName}: invalid response structure`);
        continue;
      }

      console.log(`[parse] ✓ ${modelName}: name="${parsed.name}", skills=${parsed.skills.length}, jobs=${parsed.jobMatches?.length}`);
      return parsed;

    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const msg = String(err?.message ?? err);
      const isRateLimit = msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");
      console.warn(`[parse] ✗ ${modelName}: ${msg.slice(0, 150)}`);
      if (isRateLimit) {
        console.log(`[parse] Rate limited on ${modelName}, waiting 2s...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  console.log("[parse] All Gemini models failed — using local fallback");
  return null;
}

function buildLocalFallback(rawText: string) {
  const skills = extractSkillsFromText(rawText);
  const { level, years } = detectExperienceLevel(rawText, skills);
  return {
    name:              extractName(rawText),
    email:             extractEmail(rawText),
    phone:             "",
    location:          "",
    currentRole:       "",
    yearsOfExperience: years,
    experienceLevel:   level,
    education:         "",
    summary:           "",
    skills,
    workExperience:    [],
    projects:          [],
    certifications:    [],
    jobMatches:        null,
    roadmap:           null,
    career:            null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });

    // 1. Extract raw text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = "";
    try {
      rawText = await parsePdfBuffer(buffer);
    } catch (e) {
      console.error("[parse] PDF extraction failed:", e);
      return NextResponse.json({ error: "Failed to read PDF. Please ensure it is a text-based PDF (not scanned)." }, { status: 422 });
    }

    if (!rawText || rawText.trim().length < 30) {
      return NextResponse.json({ error: "PDF appears empty or image-based. Please upload a text-based PDF." }, { status: 422 });
    }

    console.log(`[parse] PDF extracted: ${rawText.length} chars`);

    // 2. Try Gemini — one call, all models
    const apiKey = process.env.GEMINI_API_KEY;
    const g = apiKey ? await callGemini(rawText, apiKey) : null;

    // 3. Use Gemini result or local fallback
    const src = g ?? buildLocalFallback(rawText);

    // 4. Merge Gemini skills with keyword scan for maximum coverage
    const keywordSkills = extractSkillsFromText(rawText);
    const geminiSkills  = (src.skills ?? []).map((s: string) => s.toLowerCase().trim()).filter((s: string) => s.length > 1);
    const mergedSkills  = [...new Set([...geminiSkills, ...keywordSkills])];

    const resume = {
      rawText,
      name:              src.name || extractName(rawText),
      email:             src.email || extractEmail(rawText),
      phone:             src.phone || "",
      location:          src.location || "",
      currentRole:       src.currentRole || "",
      yearsOfExperience: typeof src.yearsOfExperience === "number" ? src.yearsOfExperience : 0,
      experienceLevel:   (["Beginner","Intermediate","Advanced"] as const).includes(src.experienceLevel) ? src.experienceLevel : "Intermediate",
      education:         src.education || "",
      summary:           src.summary || "",
      skills:            mergedSkills,
      workExperience:    Array.isArray(src.workExperience) ? src.workExperience : [],
      projects:          Array.isArray(src.projects) ? src.projects : [],
      certifications:    Array.isArray(src.certifications) ? src.certifications : [],
    };

    // 5. Job matches — validate and recalculate from Gemini or use local
    let jobs: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (Array.isArray(src.jobMatches) && src.jobMatches.length >= 7) {
      jobs = src.jobMatches.map((j: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const matched = Array.isArray(j.matchedSkills) ? j.matchedSkills : [];
        const missing = Array.isArray(j.missingSkills) ? j.missingSkills : [];
        const required = Array.isArray(j.requiredSkills) ? j.requiredSkills : [];
        const pct = required.length > 0 ? Math.round((matched.length / required.length) * 100) : 0;
        return {
          id:             j.id || "",
          title:          j.title || "",
          requiredSkills: required,
          matchedSkills:  matched,
          missingSkills:  missing,
          matchPercent:   pct,
          automationRisk: j.automationRisk || "Medium",
        };
      }).sort((a: any, b: any) => b.matchPercent - a.matchPercent); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else {
      jobs = computeJobMatches(mergedSkills);
    }

    // 6. Roadmap
    let roadmap: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (Array.isArray(src.roadmap) && src.roadmap.length > 0) {
      roadmap = src.roadmap.filter((r: any) => r?.skill && r?.priority && r?.timeline); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (!roadmap.length) roadmap = generateRoadmap(jobs);

    // 7. Career trajectory
    let career: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (src.career?.shortTerm?.length && src.career?.midTerm?.length) {
      career = src.career;
    } else {
      career = generateCareerTrajectory(resume, jobs);
    }

    return NextResponse.json({ resume, jobs, roadmap, career });

  } catch (err) {
    console.error("[parse] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
