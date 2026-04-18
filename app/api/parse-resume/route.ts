import { NextRequest, NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/pdfParser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { computeJobMatches } from "@/lib/jobMatcher";
import { generateRoadmap } from "@/lib/roadmapGenerator";
import { generateCareerTrajectory } from "@/lib/careerEngine";
import { extractSkillsFromText, detectExperienceLevel, extractName, extractEmail } from "@/lib/skillDatabase";

// ─── Gemini: extract EVERYTHING from the resume ───────────────────────────────
async function geminiDeepExtract(rawText: string, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0, maxOutputTokens: 4096 },
  });

  const prompt = `You are an expert resume parser. Read this resume CAREFULLY and extract EVERY piece of information.

Return ONLY valid JSON — no markdown fences, no explanation, just the JSON object:

{
  "name": "exact full name from resume",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "location": "city, state/country or empty string",
  "currentRole": "most recent job title exactly as written",
  "yearsOfExperience": <integer — calculate from work history dates>,
  "experienceLevel": "Beginner" or "Intermediate" or "Advanced",
  "education": "degree, field, university — most recent",
  "summary": "2-sentence summary of this person based on their actual resume",
  "skills": [
    "every single technical skill, tool, language, framework, platform mentioned anywhere in the resume",
    "normalize: React.js → react, Node.js → nodejs, etc.",
    "include ALL: programming languages, frameworks, libraries, databases, cloud, devops, testing, methodologies"
  ],
  "workExperience": [
    {
      "title": "job title",
      "company": "company name",
      "duration": "e.g. Jan 2022 – Present",
      "highlights": ["key achievement or responsibility 1", "key achievement 2"]
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "what it does",
      "techStack": ["tech1", "tech2"]
    }
  ],
  "certifications": ["cert1", "cert2"]
}

CRITICAL RULES:
- Extract ONLY what is actually written in the resume — NO assumptions, NO additions
- If a field is not in the resume, use empty string or empty array
- For yearsOfExperience: add up all work experience durations. If student/fresher with no work exp, use 0
- For experienceLevel: Beginner = 0-2 yrs or student, Intermediate = 2-5 yrs, Advanced = 5+ yrs or senior/lead/architect
- For skills: be exhaustive — scan every section (skills, experience, projects, certifications)
- Normalize skill names to lowercase standard forms

RESUME TEXT:
${rawText.slice(0, 12000)}`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();

  // Strip any markdown fences
  text = text.replace(/^```json\s*/im, "").replace(/^```\s*/im, "").replace(/```\s*$/im, "").trim();

  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Gemini returned no JSON");

  return JSON.parse(text.slice(start, end + 1));
}

// ─── Gemini: compute job matches based on actual extracted skills ──────────────
async function geminiComputeMatches(extracted: any, apiKey: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0, maxOutputTokens: 4096 },
  });

  const prompt = `You are a career matching engine. Analyze this candidate's skills and compute accurate job match scores.

CANDIDATE SKILLS: ${extracted.skills.join(", ")}
EXPERIENCE LEVEL: ${extracted.experienceLevel} (${extracted.yearsOfExperience} years)
CURRENT ROLE: ${extracted.currentRole || "Not specified"}

Evaluate this candidate against these 7 roles. For each role, determine which of their skills match and which are missing.

Return ONLY valid JSON array — no markdown, no explanation:
[
  {
    "id": "frontend-dev",
    "title": "Frontend Developer",
    "requiredSkills": ["react", "typescript", "javascript", "html", "css", "tailwind", "redux", "jest", "webpack", "accessibility"],
    "matchedSkills": [<list only skills the candidate ACTUALLY HAS from requiredSkills>],
    "missingSkills": [<list only skills the candidate is MISSING from requiredSkills>],
    "matchPercent": <integer 0-100, calculated as matchedSkills.length / requiredSkills.length * 100>,
    "automationRisk": "Medium"
  },
  {
    "id": "backend-dev",
    "title": "Backend Developer",
    "requiredSkills": ["nodejs", "python", "rest api", "postgresql", "redis", "docker", "microservices", "testing", "git", "system design"],
    "matchedSkills": [<candidate's actual matching skills>],
    "missingSkills": [<candidate's actual missing skills>],
    "matchPercent": <calculated integer>,
    "automationRisk": "Medium"
  },
  {
    "id": "fullstack-dev",
    "title": "Full Stack Developer",
    "requiredSkills": ["react", "nodejs", "typescript", "postgresql", "docker", "rest api", "git", "css", "redis", "testing"],
    "matchedSkills": [<candidate's actual matching skills>],
    "missingSkills": [<candidate's actual missing skills>],
    "matchPercent": <calculated integer>,
    "automationRisk": "Medium"
  },
  {
    "id": "ml-engineer",
    "title": "ML Engineer",
    "requiredSkills": ["python", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "mlflow", "sql", "docker", "statistics"],
    "matchedSkills": [<candidate's actual matching skills>],
    "missingSkills": [<candidate's actual missing skills>],
    "matchPercent": <calculated integer>,
    "automationRisk": "Low"
  },
  {
    "id": "devops-engineer",
    "title": "DevOps Engineer",
    "requiredSkills": ["docker", "kubernetes", "aws", "terraform", "ci/cd", "linux", "bash", "nginx", "prometheus", "helm"],
    "matchedSkills": [<candidate's actual matching skills>],
    "missingSkills": [<candidate's actual missing skills>],
    "matchPercent": <calculated integer>,
    "automationRisk": "Low"
  },
  {
    "id": "data-analyst",
    "title": "Data Analyst",
    "requiredSkills": ["sql", "python", "pandas", "data visualization", "statistics", "excel", "tableau", "matplotlib", "seaborn", "reporting"],
    "matchedSkills": [<candidate's actual matching skills>],
    "missingSkills": [<candidate's actual missing skills>],
    "matchPercent": <calculated integer>,
    "automationRisk": "High"
  },
  {
    "id": "cloud-engineer",
    "title": "Cloud Engineer",
    "requiredSkills": ["aws", "azure", "gcp", "terraform", "kubernetes", "docker", "ci/cd", "linux", "cloudformation", "networking"],
    "matchedSkills": [<candidate's actual matching skills>],
    "missingSkills": [<candidate's actual missing skills>],
    "matchPercent": <calculated integer>,
    "automationRisk": "Low"
  }
]

IMPORTANT: Only include a skill in matchedSkills if the candidate ACTUALLY HAS it. Be accurate.`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/^```json\s*/im, "").replace(/^```\s*/im, "").replace(/```\s*$/im, "").trim();

  const start = text.indexOf("[");
  const end   = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array in match response");

  const parsed = JSON.parse(text.slice(start, end + 1));
  return parsed.sort((a: any, b: any) => b.matchPercent - a.matchPercent); // eslint-disable-line @typescript-eslint/no-explicit-any
}

// ─── Gemini: generate roadmap from actual gaps ────────────────────────────────
async function geminiGenerateRoadmap(extracted: any, jobs: any[], apiKey: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0, maxOutputTokens: 3000 },
  });

  const topJobs = jobs.slice(0, 3);
  const allGaps = [...new Set(topJobs.flatMap((j: any) => j.missingSkills))]; // eslint-disable-line @typescript-eslint/no-explicit-any

  const prompt = `You are a learning roadmap generator. Create a personalized roadmap for this candidate.

CANDIDATE:
- Skills: ${extracted.skills.join(", ")}
- Level: ${extracted.experienceLevel} (${extracted.yearsOfExperience} years)
- Top matched roles: ${topJobs.map((j: any) => `${j.title} (${j.matchPercent}%)`).join(", ")} // eslint-disable-line @typescript-eslint/no-explicit-any
- Key skill gaps: ${allGaps.join(", ")}

Generate a prioritized learning roadmap. Return ONLY valid JSON array — no markdown:
[
  {
    "skill": "exact skill name",
    "priority": "High" or "Medium" or "Low",
    "timeline": "X weeks",
    "reason": "specific reason why this skill matters for THIS candidate based on their profile and gaps"
  }
]

Rules:
- Only include skills the candidate is ACTUALLY missing (from their gaps above)
- Priority: High = appears in 2+ top roles AND candidate has 0 related skills, Medium = appears in 1 top role, Low = nice to have
- Timeline: realistic estimate (1-8 weeks typically)
- Reason: specific to this candidate — reference their actual background and target roles
- Order by priority then impact
- Max 10 items`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/^```json\s*/im, "").replace(/^```\s*/im, "").replace(/```\s*$/im, "").trim();

  const start = text.indexOf("[");
  const end   = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array in roadmap response");

  return JSON.parse(text.slice(start, end + 1));
}

// ─── Gemini: generate career trajectory ──────────────────────────────────────
async function geminiGenerateTrajectory(extracted: any, jobs: any[], apiKey: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
  });

  const prompt = `Generate a career trajectory for this candidate based on their ACTUAL profile.

CANDIDATE:
- Name: ${extracted.name}
- Current Role: ${extracted.currentRole || "Not specified"}
- Level: ${extracted.experienceLevel} (${extracted.yearsOfExperience} years)
- Skills: ${extracted.skills.join(", ")}
- Top job matches: ${jobs.slice(0, 3).map((j: any) => `${j.title} ${j.matchPercent}%`).join(", ")} // eslint-disable-line @typescript-eslint/no-explicit-any

Return ONLY valid JSON — no markdown:
{
  "shortTerm": ["specific role/action 1", "specific role/action 2", "specific role/action 3"],
  "midTerm": ["specific role/action 1", "specific role/action 2", "specific role/action 3"],
  "longTerm": ["specific role/action 1", "specific role/action 2", "specific role/action 3"],
  "summary": "One precise sentence about this person's career direction based on their actual profile"
}

Rules:
- shortTerm = 0-12 months: realistic next steps given their CURRENT skills and level
- midTerm = 1-3 years: after closing key skill gaps
- longTerm = 3-7 years: leadership or specialization track
- Each array: exactly 3 specific items
- Base EVERYTHING on their actual skills and matched roles — no generic advice`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/^```json\s*/im, "").replace(/^```\s*/im, "").replace(/```\s*$/im, "").trim();

  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in trajectory response");

  return JSON.parse(text.slice(start, end + 1));
}

// ─── Main route ───────────────────────────────────────────────────────────────
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
    } catch {
      return NextResponse.json({ error: "Failed to read PDF. Please ensure it is a text-based PDF (not scanned)." }, { status: 422 });
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json({ error: "PDF appears empty or image-based. Please upload a text-based PDF." }, { status: 422 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 2. Gemini deep extraction
    let extracted: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (apiKey) {
      try {
        extracted = await geminiDeepExtract(rawText, apiKey);
        console.log(`✓ Gemini extracted: ${extracted.name}, ${extracted.skills?.length} skills, ${extracted.yearsOfExperience} yrs`);
      } catch (e) {
        console.error("Gemini extraction failed:", e);
      }
    }

    // Fallback extraction if Gemini fails
    if (!extracted || !extracted.skills?.length) {
      const skills = extractSkillsFromText(rawText);
      const { level, years } = detectExperienceLevel(rawText, skills);
      extracted = {
        name: extractName(rawText),
        email: extractEmail(rawText),
        phone: "",
        location: "",
        currentRole: "",
        yearsOfExperience: years,
        experienceLevel: level,
        education: "",
        summary: "",
        skills,
        workExperience: [],
        projects: [],
        certifications: [],
      };
    }

    // Merge keyword scan with Gemini skills for maximum coverage
    const keywordSkills = extractSkillsFromText(rawText);
    const allSkills = [...new Set([
      ...(extracted.skills ?? []).map((s: string) => s.toLowerCase().trim()),
      ...keywordSkills,
    ])].filter((s: string) => s.length > 1);
    extracted.skills = allSkills;

    // Build resume object
    const resume = {
      rawText,
      name:              extracted.name || "User",
      email:             extracted.email || "",
      phone:             extracted.phone || "",
      location:          extracted.location || "",
      currentRole:       extracted.currentRole || "",
      yearsOfExperience: extracted.yearsOfExperience ?? 0,
      experienceLevel:   extracted.experienceLevel ?? "Intermediate",
      education:         extracted.education || "",
      summary:           extracted.summary || "",
      skills:            extracted.skills,
      workExperience:    extracted.workExperience || [],
      projects:          extracted.projects || [],
      certifications:    extracted.certifications || [],
    };

    // 3. Compute job matches — Gemini first, fallback to local
    let jobs: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (apiKey) {
      try {
        jobs = await geminiComputeMatches(extracted, apiKey);
        console.log(`✓ Gemini computed ${jobs.length} job matches`);
      } catch (e) {
        console.error("Gemini job match failed:", e);
      }
    }
    if (!jobs.length) {
      jobs = computeJobMatches(resume.skills);
    }

    // 4. Generate roadmap — Gemini first, fallback to local
    let roadmap: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (apiKey) {
      try {
        roadmap = await geminiGenerateRoadmap(extracted, jobs, apiKey);
        console.log(`✓ Gemini generated ${roadmap.length} roadmap items`);
      } catch (e) {
        console.error("Gemini roadmap failed:", e);
        roadmap = generateRoadmap(jobs);
      }
    } else {
      roadmap = generateRoadmap(jobs);
    }

    // 5. Generate career trajectory — Gemini first, fallback to local
    let career: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (apiKey) {
      try {
        career = await geminiGenerateTrajectory(extracted, jobs, apiKey);
        console.log(`✓ Gemini generated career trajectory`);
      } catch (e) {
        console.error("Gemini trajectory failed:", e);
        career = generateCareerTrajectory(resume, jobs);
      }
    } else {
      career = generateCareerTrajectory(resume, jobs);
    }

    return NextResponse.json({ resume, jobs, roadmap, career });

  } catch (err) {
    console.error("Parse route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
