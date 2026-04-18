import { NextRequest, NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/pdfParser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { computeJobMatches } from "@/lib/jobMatcher";
import { generateRoadmap } from "@/lib/roadmapGenerator";
import { generateCareerTrajectory } from "@/lib/careerEngine";
import { extractSkillsFromText, detectExperienceLevel, extractName, extractEmail } from "@/lib/skillDatabase";

// ONE single Gemini call — extracts everything at once to avoid quota exhaustion
async function geminiFullAnalysis(rawText: string, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0, maxOutputTokens: 8192 },
  });

  const prompt = `You are an expert resume parser and career analyst. Read this resume carefully and return ONE JSON object with ALL of the following.

Return ONLY valid JSON — no markdown, no explanation:

{
  "name": "full name from resume",
  "email": "email or empty string",
  "phone": "phone or empty string",
  "location": "city/country or empty string",
  "currentRole": "most recent job title or empty string",
  "yearsOfExperience": <integer>,
  "experienceLevel": "Beginner" or "Intermediate" or "Advanced",
  "education": "degree, field, university or empty string",
  "summary": "2-sentence professional summary based on actual resume content",
  "skills": ["every technical skill, tool, language, framework, platform mentioned — normalized lowercase"],
  "workExperience": [
    { "title": "job title", "company": "company", "duration": "dates", "highlights": ["achievement 1", "achievement 2"] }
  ],
  "projects": [
    { "name": "project name", "description": "what it does", "techStack": ["tech1"] }
  ],
  "certifications": ["cert1"],
  "jobMatches": [
    {
      "id": "frontend-dev",
      "title": "Frontend Developer",
      "requiredSkills": ["react","typescript","javascript","html","css","tailwind","redux","jest","webpack","accessibility"],
      "matchedSkills": ["<only skills candidate ACTUALLY HAS>"],
      "missingSkills": ["<only skills candidate is MISSING>"],
      "matchPercent": <0-100 integer>,
      "automationRisk": "Medium"
    },
    {
      "id": "backend-dev",
      "title": "Backend Developer",
      "requiredSkills": ["nodejs","python","rest api","postgresql","redis","docker","microservices","testing","git","system design"],
      "matchedSkills": ["<candidate's actual matching skills>"],
      "missingSkills": ["<candidate's actual missing skills>"],
      "matchPercent": <integer>,
      "automationRisk": "Medium"
    },
    {
      "id": "fullstack-dev",
      "title": "Full Stack Developer",
      "requiredSkills": ["react","nodejs","typescript","postgresql","docker","rest api","git","css","redis","testing"],
      "matchedSkills": ["<candidate's actual matching skills>"],
      "missingSkills": ["<candidate's actual missing skills>"],
      "matchPercent": <integer>,
      "automationRisk": "Medium"
    },
    {
      "id": "ml-engineer",
      "title": "ML Engineer",
      "requiredSkills": ["python","tensorflow","pytorch","scikit-learn","pandas","numpy","mlflow","sql","docker","statistics"],
      "matchedSkills": ["<candidate's actual matching skills>"],
      "missingSkills": ["<candidate's actual missing skills>"],
      "matchPercent": <integer>,
      "automationRisk": "Low"
    },
    {
      "id": "devops-engineer",
      "title": "DevOps Engineer",
      "requiredSkills": ["docker","kubernetes","aws","terraform","ci/cd","linux","bash","nginx","prometheus","helm"],
      "matchedSkills": ["<candidate's actual matching skills>"],
      "missingSkills": ["<candidate's actual missing skills>"],
      "matchPercent": <integer>,
      "automationRisk": "Low"
    },
    {
      "id": "data-analyst",
      "title": "Data Analyst",
      "requiredSkills": ["sql","python","pandas","data visualization","statistics","excel","tableau","matplotlib","seaborn","reporting"],
      "matchedSkills": ["<candidate's actual matching skills>"],
      "missingSkills": ["<candidate's actual missing skills>"],
      "matchPercent": <integer>,
      "automationRisk": "High"
    },
    {
      "id": "cloud-engineer",
      "title": "Cloud Engineer",
      "requiredSkills": ["aws","azure","gcp","terraform","kubernetes","docker","ci/cd","linux","cloudformation","networking"],
      "matchedSkills": ["<candidate's actual matching skills>"],
      "missingSkills": ["<candidate's actual missing skills>"],
      "matchPercent": <integer>,
      "automationRisk": "Low"
    }
  ],
  "roadmap": [
    {
      "skill": "skill name",
      "priority": "High" or "Medium" or "Low",
      "timeline": "X weeks",
      "reason": "specific reason for this candidate based on their gaps and target roles"
    }
  ],
  "career": {
    "shortTerm": ["role/action 1", "role/action 2", "role/action 3"],
    "midTerm": ["role/action 1", "role/action 2", "role/action 3"],
    "longTerm": ["role/action 1", "role/action 2", "role/action 3"],
    "summary": "one sentence about this person's career direction"
  }
}

RULES:
- skills: extract EVERY technical skill from the entire resume
- jobMatches: matchPercent = matchedSkills.length / requiredSkills.length * 100, rounded
- roadmap: top 8 missing skills ordered by impact, with specific reasons for THIS candidate
- career: based on actual skills and experience level, specific roles not generic advice
- yearsOfExperience: sum all work experience durations
- experienceLevel: Beginner=0-2yrs, Intermediate=2-5yrs, Advanced=5+yrs or senior/lead title

RESUME:
${rawText.slice(0, 10000)}`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/^```json\s*/im, "").replace(/^```\s*/im, "").replace(/```\s*$/im, "").trim();
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in response");
  return JSON.parse(text.slice(start, end + 1));
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
    } catch {
      return NextResponse.json({ error: "Failed to read PDF. Please ensure it is a text-based PDF (not scanned)." }, { status: 422 });
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json({ error: "PDF appears empty or image-based. Please upload a text-based PDF." }, { status: 422 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 2. ONE Gemini call for everything
    let geminiResult: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (apiKey) {
      try {
        geminiResult = await geminiFullAnalysis(rawText, apiKey);
        console.log(`✓ Gemini: ${geminiResult.name}, ${geminiResult.skills?.length} skills, ${geminiResult.experienceLevel}`);
      } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Gemini failed:", e?.message ?? e);
        // If rate limited, wait 3s and retry once
        if (e?.message?.includes("429") || e?.message?.includes("quota")) {
          console.log("Rate limited — retrying in 3s...");
          await new Promise(r => setTimeout(r, 3000));
          try {
            geminiResult = await geminiFullAnalysis(rawText, apiKey);
            console.log(`✓ Gemini retry succeeded: ${geminiResult.name}`);
          } catch (e2) {
            console.error("Gemini retry also failed:", e2);
          }
        }
      }
    }

    // 3. Build resume — Gemini data + keyword scan merged
    const keywordSkills = extractSkillsFromText(rawText);

    let resume: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (geminiResult?.name) {
      const geminiSkills = [
        ...(geminiResult.skills ?? []),
      ].map((s: string) => s.toLowerCase().trim()).filter((s: string) => s.length > 1);

      const mergedSkills = [...new Set([...geminiSkills, ...keywordSkills])];

      resume = {
        rawText,
        name:              geminiResult.name || extractName(rawText),
        email:             geminiResult.email || extractEmail(rawText),
        phone:             geminiResult.phone || "",
        location:          geminiResult.location || "",
        currentRole:       geminiResult.currentRole || "",
        yearsOfExperience: geminiResult.yearsOfExperience ?? 0,
        experienceLevel:   geminiResult.experienceLevel ?? "Intermediate",
        education:         geminiResult.education || "",
        summary:           geminiResult.summary || "",
        skills:            mergedSkills,
        workExperience:    geminiResult.workExperience || [],
        projects:          geminiResult.projects || [],
        certifications:    geminiResult.certifications || [],
      };
    } else {
      // Full local fallback
      const skills = extractSkillsFromText(rawText);
      const { level, years } = detectExperienceLevel(rawText, skills);
      resume = {
        rawText,
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
      };
    }

    // 4. Job matches — from Gemini or local
    let jobs: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (geminiResult?.jobMatches?.length) {
      jobs = geminiResult.jobMatches.sort((a: any, b: any) => b.matchPercent - a.matchPercent); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else {
      jobs = computeJobMatches(resume.skills);
    }

    // 5. Roadmap — from Gemini or local
    let roadmap: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (geminiResult?.roadmap?.length) {
      roadmap = geminiResult.roadmap;
    } else {
      roadmap = generateRoadmap(jobs);
    }

    // 6. Career trajectory — from Gemini or local
    let career: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (geminiResult?.career?.shortTerm?.length) {
      career = geminiResult.career;
    } else {
      career = generateCareerTrajectory(resume, jobs);
    }

    return NextResponse.json({ resume, jobs, roadmap, career });

  } catch (err) {
    console.error("Parse route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
