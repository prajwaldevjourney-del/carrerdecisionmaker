import { NextRequest, NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/pdfParser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { computeJobMatches } from "@/lib/jobMatcher";
import { generateRoadmap } from "@/lib/roadmapGenerator";
import { generateCareerTrajectory } from "@/lib/careerEngine";
import { extractSkillsFromText, detectExperienceLevel, extractName, extractEmail } from "@/lib/skillDatabase";

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

const PROMPT_TEMPLATE = (rawText: string) => `You are an expert resume parser. Read this resume and return ONE JSON object.

Return ONLY valid JSON — no markdown fences, no explanation, just the JSON:

{
  "name": "full name",
  "email": "email or empty string",
  "phone": "phone or empty string",
  "location": "city/country or empty string",
  "currentRole": "most recent job title or empty string",
  "yearsOfExperience": 0,
  "experienceLevel": "Beginner",
  "education": "degree, field, university or empty string",
  "summary": "2-sentence summary of this person based on their actual resume",
  "skills": ["every technical skill mentioned — normalized lowercase"],
  "workExperience": [{"title":"","company":"","duration":"","highlights":[]}],
  "projects": [{"name":"","description":"","techStack":[]}],
  "certifications": [],
  "jobMatches": [
    {"id":"frontend-dev","title":"Frontend Developer","requiredSkills":["react","typescript","javascript","html","css","tailwind","redux","jest","webpack","accessibility"],"matchedSkills":[],"missingSkills":[],"matchPercent":0,"automationRisk":"Medium"},
    {"id":"backend-dev","title":"Backend Developer","requiredSkills":["nodejs","python","rest api","postgresql","redis","docker","microservices","testing","git","system design"],"matchedSkills":[],"missingSkills":[],"matchPercent":0,"automationRisk":"Medium"},
    {"id":"fullstack-dev","title":"Full Stack Developer","requiredSkills":["react","nodejs","typescript","postgresql","docker","rest api","git","css","redis","testing"],"matchedSkills":[],"missingSkills":[],"matchPercent":0,"automationRisk":"Medium"},
    {"id":"ml-engineer","title":"ML Engineer","requiredSkills":["python","tensorflow","pytorch","scikit-learn","pandas","numpy","mlflow","sql","docker","statistics"],"matchedSkills":[],"missingSkills":[],"matchPercent":0,"automationRisk":"Low"},
    {"id":"devops-engineer","title":"DevOps Engineer","requiredSkills":["docker","kubernetes","aws","terraform","ci/cd","linux","bash","nginx","prometheus","helm"],"matchedSkills":[],"missingSkills":[],"matchPercent":0,"automationRisk":"Low"},
    {"id":"data-analyst","title":"Data Analyst","requiredSkills":["sql","python","pandas","data visualization","statistics","excel","tableau","matplotlib","seaborn","reporting"],"matchedSkills":[],"missingSkills":[],"matchPercent":0,"automationRisk":"High"},
    {"id":"cloud-engineer","title":"Cloud Engineer","requiredSkills":["aws","azure","gcp","terraform","kubernetes","docker","ci/cd","linux","cloudformation","networking"],"matchedSkills":[],"missingSkills":[],"matchPercent":0,"automationRisk":"Low"}
  ],
  "roadmap": [{"skill":"","priority":"High","timeline":"2 weeks","reason":""}],
  "career": {"shortTerm":["","",""],"midTerm":["","",""],"longTerm":["","",""],"summary":""}
}

STRICT RULES:
1. skills: scan EVERY section — extract ALL technical skills, tools, languages, frameworks, platforms
2. jobMatches: for each role, check candidate's skills against requiredSkills. matchedSkills = intersection. missingSkills = requiredSkills not in candidate skills. matchPercent = round(matchedSkills.length / requiredSkills.length * 100)
3. roadmap: list top 8 missing skills by impact, with specific reasons for THIS candidate
4. career: realistic roles based on actual skills and level. shortTerm/midTerm/longTerm = exactly 3 items each
5. experienceLevel: Beginner=0-2yrs or student, Intermediate=2-5yrs, Advanced=5+yrs or senior/lead/architect
6. yearsOfExperience: integer, sum of all work durations

RESUME TEXT:
${rawText.slice(0, 10000)}`;

async function callGemini(rawText: string, apiKey: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = PROMPT_TEMPLATE(rawText);

  console.log(`\n=== GEMINI CALL START ===`);
  console.log(`Raw text length: ${rawText.length} chars`);
  console.log(`Raw text preview: ${rawText.slice(0, 200).replace(/\n/g, " ")}`);

  for (const modelName of MODELS) {
    try {
      console.log(`\nTrying model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0, maxOutputTokens: 8192 },
      });
      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      console.log(`Response length: ${text.length} chars`);
      console.log(`Response preview: ${text.slice(0, 300)}`);
      // Strip any markdown fences
      text = text.replace(/^```json\s*/im, "").replace(/^```\s*/im, "").replace(/```\s*$/im, "").trim();
      const start = text.indexOf("{");
      const end   = text.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("No JSON object in response");
      const parsed = JSON.parse(text.slice(start, end + 1));
      console.log(`✓ ${modelName} SUCCESS: name="${parsed.name}", skills=${parsed.skills?.length}, jobMatches=${parsed.jobMatches?.length}`);
      return parsed;
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const msg = err?.message ?? String(err);
      console.error(`✗ ${modelName} FAILED: ${msg.slice(0, 200)}`);
      // On rate limit, wait before trying next model
      if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        console.log("Rate limited — waiting 2s before next model...");
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  console.log("=== ALL MODELS FAILED — using local fallback ===");
  return null; // All models failed — use local fallback
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });

    // Step 1: Extract raw text from PDF
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

    // Step 2: Try Gemini (tries 3 models automatically)
    const apiKey = process.env.GEMINI_API_KEY;
    let g: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (apiKey) {
      g = await callGemini(rawText, apiKey);
    }

    // Step 3: Build resume object
    const keywordSkills = extractSkillsFromText(rawText);
    let resume: any; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (g?.name) {
      // Gemini succeeded — use its data, merge skills with keyword scan
      const geminiSkills = (g.skills ?? []).map((s: string) => s.toLowerCase().trim()).filter((s: string) => s.length > 1);
      resume = {
        rawText,
        name:              g.name,
        email:             g.email || extractEmail(rawText),
        phone:             g.phone || "",
        location:          g.location || "",
        currentRole:       g.currentRole || "",
        yearsOfExperience: typeof g.yearsOfExperience === "number" ? g.yearsOfExperience : 0,
        experienceLevel:   ["Beginner","Intermediate","Advanced"].includes(g.experienceLevel) ? g.experienceLevel : "Intermediate",
        education:         g.education || "",
        summary:           g.summary || "",
        skills:            [...new Set([...geminiSkills, ...keywordSkills])],
        workExperience:    Array.isArray(g.workExperience) ? g.workExperience : [],
        projects:          Array.isArray(g.projects) ? g.projects : [],
        certifications:    Array.isArray(g.certifications) ? g.certifications : [],
      };
    } else {
      // Local fallback — keyword extraction
      console.log("Using local fallback extraction");
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

    // Step 4: Job matches
    let jobs: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (g?.jobMatches?.length >= 7) {
      // Validate Gemini job matches — recalculate matchPercent to ensure accuracy
      jobs = g.jobMatches.map((j: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        id:             j.id,
        title:          j.title,
        requiredSkills: j.requiredSkills ?? [],
        matchedSkills:  Array.isArray(j.matchedSkills) ? j.matchedSkills : [],
        missingSkills:  Array.isArray(j.missingSkills) ? j.missingSkills : [],
        matchPercent:   Array.isArray(j.matchedSkills) && Array.isArray(j.requiredSkills) && j.requiredSkills.length > 0
          ? Math.round((j.matchedSkills.length / j.requiredSkills.length) * 100)
          : (typeof j.matchPercent === "number" ? j.matchPercent : 0),
        automationRisk: j.automationRisk ?? "Medium",
      })).sort((a: any, b: any) => b.matchPercent - a.matchPercent); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else {
      jobs = computeJobMatches(resume.skills);
    }

    // Step 5: Roadmap
    let roadmap: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (g?.roadmap?.length) {
      roadmap = g.roadmap.filter((r: any) => r.skill && r.priority && r.timeline); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (!roadmap.length) {
      roadmap = generateRoadmap(jobs);
    }

    // Step 6: Career trajectory
    let career: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (g?.career?.shortTerm?.length && g?.career?.midTerm?.length) {
      career = g.career;
    } else {
      career = generateCareerTrajectory(resume, jobs);
    }

    return NextResponse.json({ resume, jobs, roadmap, career });

  } catch (err) {
    console.error("Parse route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
