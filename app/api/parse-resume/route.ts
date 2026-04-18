import { NextRequest, NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/pdfParser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { computeJobMatches } from "@/lib/jobMatcher";
import { generateRoadmap } from "@/lib/roadmapGenerator";
import { generateCareerTrajectory } from "@/lib/careerEngine";
import { extractSkillsFromText, detectExperienceLevel, extractName, extractEmail } from "@/lib/skillDatabase";

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

// ── Phase 1: Extract ALL skills from resume (any domain) ──────────────────────
function buildSkillPrompt(rawText: string): string {
  return `Extract all skills from the resume text below.

Rules:
- Extract BOTH hard skills and soft skills
- Do NOT limit to tech or CSE skills — cover ALL industries and domains
- Include domain-specific tools, certifications, methodologies, and techniques
- Include industry knowledge areas (e.g., "patient triage", "financial modeling", "curriculum design")
- Normalize skill names to standard professional terminology
- No duplicates, no overly generic terms

Return ONLY a JSON object, no extra text:
{
  "hard_skills": ["skill1", "skill2"],
  "soft_skills": ["skill1", "skill2"],
  "domain": "detected domain (e.g., Software Engineering, Healthcare, Finance, Civil Engineering)"
}

Resume Text:
${rawText.slice(0, 5000)}`;
}

// ── Phase 2: Full resume analysis using extracted skills ──────────────────────
function buildAnalysisPrompt(rawText: string, hardSkills: string[], softSkills: string[], domain: string): string {
  const allSkills = [...hardSkills, ...softSkills];
  return `You are a resume analyst. Using the resume text and pre-extracted skills below, return a complete analysis as JSON only. No markdown. No explanation.

EXTRACTED SKILLS (${allSkills.length} total):
Hard Skills: ${hardSkills.join(", ")}
Soft Skills: ${softSkills.join(", ")}
Domain: ${domain}

Return ONLY this JSON:
{
  "name": "full name from resume",
  "email": "email or empty",
  "phone": "phone or empty",
  "location": "city/country or empty",
  "currentRole": "most recent job title or empty",
  "yearsOfExperience": 0,
  "experienceLevel": "Beginner",
  "education": "degree, field, institution or empty",
  "summary": "2-sentence professional summary based on actual resume content",
  "workExperience": [{"title":"","company":"","duration":"","highlights":[""]}],
  "projects": [{"name":"","description":"","techStack":[""]}],
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

Rules:
- matchedSkills: skills from requiredSkills that candidate HAS (check against extracted hard_skills)
- missingSkills: requiredSkills NOT in candidate's skills
- matchPercent: round(matchedSkills.length / requiredSkills.length * 100)
- roadmap: 6-8 most impactful missing skills, reasons specific to this candidate
- career: realistic roles based on actual skills and domain, 3 items each
- experienceLevel: Beginner=0-2yrs, Intermediate=2-5yrs, Advanced=5+yrs or senior/lead

Resume Text:
${rawText.slice(0, 4000)}`;
}

// ── Call Gemini with retry across models ──────────────────────────────────────
async function callGemini(prompt: string, apiKey: string, label: string): Promise<string | null> {
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of MODELS) {
    try {
      console.log(`[parse:${label}] Trying ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0, maxOutputTokens: 8192 },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      console.log(`[parse:${label}] ✓ ${modelName} responded (${text.length} chars)`);
      return text;
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const msg = String(err?.message ?? err);
      console.warn(`[parse:${label}] ✗ ${modelName}: ${msg.slice(0, 120)}`);
      if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  return null;
}

function parseJSON(raw: string | null): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!raw) return null;
  try {
    let text = raw.replace(/^```json\s*/im, "").replace(/^```\s*/im, "").replace(/```\s*$/im, "").trim();
    const start = text.indexOf("{");
    const end   = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function buildLocalFallback(rawText: string) {
  const skills = extractSkillsFromText(rawText);
  const { level, years } = detectExperienceLevel(rawText, skills);
  return {
    name: extractName(rawText), email: extractEmail(rawText),
    phone: "", location: "", currentRole: "",
    yearsOfExperience: years, experienceLevel: level,
    education: "", summary: "",
    skills, workExperience: [], projects: [], certifications: [],
    jobMatches: null, roadmap: null, career: null,
    hard_skills: skills, soft_skills: [], domain: "Software Engineering",
  };
}

// ── Main route ────────────────────────────────────────────────────────────────
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
    } catch (e) {
      console.error("[parse] PDF extraction failed:", e);
      return NextResponse.json({ error: "Failed to read PDF. Please ensure it is a text-based PDF (not scanned)." }, { status: 422 });
    }

    if (!rawText || rawText.trim().length < 30) {
      return NextResponse.json({ error: "PDF appears empty or image-based. Please upload a text-based PDF." }, { status: 422 });
    }

    console.log(`[parse] PDF extracted: ${rawText.length} chars`);

    const apiKey = process.env.GEMINI_API_KEY;

    // Step 2: Phase 1 — extract skills comprehensively (any domain)
    let hardSkills: string[] = [];
    let softSkills: string[] = [];
    let domain = "Software Engineering";

    if (apiKey) {
      const skillRaw = await callGemini(buildSkillPrompt(rawText), apiKey, "skills");
      const skillData = parseJSON(skillRaw);
      if (skillData?.hard_skills) {
        hardSkills = (skillData.hard_skills as string[]).map(s => s.toLowerCase().trim()).filter(s => s.length > 1);
        softSkills = (skillData.soft_skills as string[]).map(s => s.toLowerCase().trim()).filter(s => s.length > 1);
        domain     = skillData.domain || "Software Engineering";
        console.log(`[parse] Skills extracted: ${hardSkills.length} hard, ${softSkills.length} soft, domain: ${domain}`);
      }
    }

    // Merge with keyword scan for maximum coverage
    const keywordSkills = extractSkillsFromText(rawText);
    const allExtracted  = [...new Set([...hardSkills, ...keywordSkills])];

    // Step 3: Phase 2 — full analysis using extracted skills
    let g: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (apiKey && allExtracted.length > 0) {
      const analysisRaw = await callGemini(
        buildAnalysisPrompt(rawText, allExtracted, softSkills, domain),
        apiKey,
        "analysis"
      );
      g = parseJSON(analysisRaw);
      if (g?.name) {
        console.log(`[parse] Analysis: name="${g.name}", jobs=${g.jobMatches?.length}`);
      } else {
        console.warn("[parse] Analysis returned invalid JSON, using fallback");
      }
    }

    // Step 4: Build final resume object
    const src = g ?? buildLocalFallback(rawText);
    const mergedSkills = [...new Set([
      ...allExtracted,
      ...(Array.isArray(src.skills) ? src.skills.map((s: string) => s.toLowerCase().trim()) : []),
    ])].filter(s => s.length > 1);

    const resume = {
      rawText,
      name:              src.name || extractName(rawText),
      email:             src.email || extractEmail(rawText),
      phone:             src.phone || "",
      location:          src.location || "",
      currentRole:       src.currentRole || "",
      yearsOfExperience: typeof src.yearsOfExperience === "number" ? src.yearsOfExperience : 0,
      experienceLevel:   (["Beginner","Intermediate","Advanced"] as const).includes(src.experienceLevel)
                           ? src.experienceLevel as "Beginner"|"Intermediate"|"Advanced"
                           : "Intermediate" as const,
      education:         src.education || "",
      summary:           src.summary || "",
      skills:            mergedSkills,
      hardSkills,
      softSkills,
      domain,
      workExperience:    Array.isArray(src.workExperience) ? src.workExperience : [],
      projects:          Array.isArray(src.projects) ? src.projects : [],
      certifications:    Array.isArray(src.certifications) ? src.certifications : [],
    };

    // Step 5: Job matches
    let jobs: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (Array.isArray(src.jobMatches) && src.jobMatches.length >= 7) {
      jobs = src.jobMatches.map((j: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const matched  = Array.isArray(j.matchedSkills) ? j.matchedSkills : [];
        const missing  = Array.isArray(j.missingSkills) ? j.missingSkills : [];
        const required = Array.isArray(j.requiredSkills) ? j.requiredSkills : [];
        return {
          id:             j.id || "",
          title:          j.title || "",
          requiredSkills: required,
          matchedSkills:  matched,
          missingSkills:  missing,
          matchPercent:   required.length > 0 ? Math.round((matched.length / required.length) * 100) : 0,
          automationRisk: j.automationRisk || "Medium",
        };
      }).sort((a: any, b: any) => b.matchPercent - a.matchPercent); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else {
      jobs = computeJobMatches(mergedSkills);
    }

    // Step 6: Roadmap
    let roadmap: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (Array.isArray(src.roadmap) && src.roadmap.length > 0) {
      roadmap = src.roadmap.filter((r: any) => r?.skill && r?.priority && r?.timeline); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (!roadmap.length) roadmap = generateRoadmap(jobs);

    // Step 7: Career trajectory
    let career: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (src.career?.shortTerm?.length && src.career?.midTerm?.length) {
      career = src.career;
    } else {
      career = generateCareerTrajectory(resume, jobs);
    }

    console.log(`[parse] Done: ${resume.name}, ${mergedSkills.length} skills, top job: ${jobs[0]?.title} ${jobs[0]?.matchPercent}%`);
    return NextResponse.json({ resume, jobs, roadmap, career });

  } catch (err) {
    console.error("[parse] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
