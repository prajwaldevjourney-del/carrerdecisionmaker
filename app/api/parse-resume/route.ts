import { NextRequest, NextResponse } from "next/server";
import { extractSkillsFromText, detectExperienceLevel, extractName, extractEmail } from "@/lib/skillDatabase";
import { computeJobMatches } from "@/lib/jobMatcher";
import { generateRoadmap } from "@/lib/roadmapGenerator";
import { generateCareerTrajectory } from "@/lib/careerEngine";
import { parsePdfBuffer } from "@/lib/pdfParser";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use Gemini to deeply extract structured data from resume text
async function geminiExtractResume(rawText: string, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2000,
    },
  });

  const prompt = `You are a resume parser. Extract structured data from this resume text.

Return ONLY a valid JSON object — no markdown, no explanation:
{
  "name": "full name",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "location": "city/country or empty string",
  "yearsOfExperience": number,
  "experienceLevel": "Beginner" | "Intermediate" | "Advanced",
  "currentRole": "current or most recent job title",
  "skills": ["skill1", "skill2", ...],
  "programmingLanguages": ["lang1", ...],
  "frameworks": ["fw1", ...],
  "tools": ["tool1", ...],
  "databases": ["db1", ...],
  "cloudPlatforms": ["aws", ...],
  "education": "highest degree and field",
  "summary": "2-sentence professional summary based on the resume"
}

Rules for skills extraction:
- Extract ALL technical skills mentioned anywhere in the resume
- Include programming languages, frameworks, libraries, tools, platforms, methodologies
- Normalize skill names (e.g. "React.js" → "react", "Node.js" → "nodejs")
- Include soft skills only if explicitly listed as skills
- Be thorough — extract every technical skill mentioned

Rules for experience level:
- Beginner: 0–2 years or student/intern/fresher
- Intermediate: 2–5 years
- Advanced: 5+ years or senior/lead/principal/architect titles

RESUME TEXT:
${rawText.slice(0, 8000)}`;

  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();

  // Strip markdown fences
  text = text.replace(/^```json\s*/im, "").replace(/^```\s*/im, "").replace(/```\s*$/im, "").trim();

  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in Gemini response");

  return JSON.parse(text.slice(start, end + 1));
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let rawText = "";
    try {
      rawText = await parsePdfBuffer(buffer);
    } catch (parseErr) {
      console.error("PDF parse error:", parseErr);
      return NextResponse.json(
        { error: "Failed to parse PDF. Please ensure it is a text-based PDF (not scanned)." },
        { status: 422 }
      );
    }

    if (!rawText || rawText.trim().length < 30) {
      return NextResponse.json(
        { error: "PDF appears to be empty or image-based. Please upload a text-based PDF." },
        { status: 422 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    let resume;

    // Try Gemini deep extraction first
    if (apiKey) {
      try {
        const extracted = await geminiExtractResume(rawText, apiKey);

        // Merge all skill categories into one deduplicated list
        const allSkills = [
          ...(extracted.skills ?? []),
          ...(extracted.programmingLanguages ?? []),
          ...(extracted.frameworks ?? []),
          ...(extracted.tools ?? []),
          ...(extracted.databases ?? []),
          ...(extracted.cloudPlatforms ?? []),
        ]
          .map((s: string) => s.toLowerCase().trim())
          .filter((s: string) => s.length > 1);

        // Also run keyword extraction on raw text and merge
        const keywordSkills = extractSkillsFromText(rawText);
        const mergedSkills = [...new Set([...allSkills, ...keywordSkills])];

        resume = {
          rawText,
          skills: mergedSkills,
          experienceLevel: extracted.experienceLevel ?? "Intermediate",
          name: extracted.name || extractName(rawText),
          email: extracted.email || extractEmail(rawText),
          phone: extracted.phone || "",
          location: extracted.location || "",
          currentRole: extracted.currentRole || "",
          education: extracted.education || "",
          summary: extracted.summary || "",
          yearsOfExperience: extracted.yearsOfExperience ?? 0,
        };

        console.log(`Gemini extracted ${mergedSkills.length} skills for ${resume.name}`);
      } catch (geminiErr) {
        console.warn("Gemini extraction failed, falling back to keyword extraction:", geminiErr);
        // Fall through to keyword extraction
      }
    }

    // Fallback: keyword-based extraction
    if (!resume) {
      const skills = extractSkillsFromText(rawText);
      const { level, years } = detectExperienceLevel(rawText, skills);
      resume = {
        rawText,
        skills,
        experienceLevel: level,
        name: extractName(rawText),
        email: extractEmail(rawText),
        phone: "",
        location: "",
        currentRole: "",
        education: "",
        summary: "",
        yearsOfExperience: years,
      };
    }

    const jobs    = computeJobMatches(resume.skills);
    const roadmap = generateRoadmap(jobs);
    const career  = generateCareerTrajectory(resume, jobs);

    return NextResponse.json({ resume, jobs, roadmap, career });
  } catch (err) {
    console.error("Parse error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
