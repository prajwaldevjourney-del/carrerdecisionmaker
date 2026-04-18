import { NextRequest, NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/pdfParser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateRoadmap } from "@/lib/roadmapGenerator";
import { generateCareerTrajectory } from "@/lib/careerEngine";
import { extractSkillsFromText, detectExperienceLevel, extractName, extractEmail } from "@/lib/skillDatabase";

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

// ── Phase 1: Extract ALL skills — any domain, any engineering field ────────────
function buildSkillPrompt(rawText: string): string {
  return `You are an expert resume parser with knowledge across ALL engineering domains — including ECE, EEE, Mechanical, Civil, Chemical, and more. Do NOT assume the candidate is from a software/CSE background.

Extract skills from the resume below. Include:
- Electronics, circuit design, signal processing, embedded systems, VLSI, PCB, communication protocols, instrumentation, control systems, etc.
- Domain-specific tools (MATLAB, Cadence, Multisim, LabVIEW, Proteus, etc.)
- Software tools, programming languages, frameworks if present
- Healthcare, finance, legal, education domain skills if present
- Certifications, methodologies, and soft skills

Return ONLY this JSON, no extra text:
{
  "domain": "detected domain (e.g., Electronics and Communication, Electrical Engineering, Mechanical Engineering, Software Engineering, Healthcare, Finance)",
  "experience_level": "Fresher | Junior | Mid-level | Senior",
  "hard_skills": ["skill1", "skill2"],
  "soft_skills": ["skill1", "skill2"],
  "tools": ["tool1", "tool2"],
  "certifications": ["cert1"]
}

Resume Text:
${rawText.slice(0, 5000)}`;
}

// ── Phase 2: Career mapping — domain-specific roles, NOT hardcoded software ───
function buildCareerMapPrompt(profile: {
  domain: string;
  experience_level: string;
  hard_skills: string[];
  soft_skills: string[];
  tools: string[];
  certifications: string[];
}): string {
  return `You are a career mapping engine. Based on the candidate profile below, identify the 7 most relevant job roles for THIS candidate's domain and skill set.

Do NOT default to software/CSE roles unless the candidate's background is CSE.
For ECE candidates suggest roles like: Embedded Systems Engineer, RF Engineer, VLSI Design Engineer, Hardware Engineer, IoT Developer, Signal Processing Engineer, Firmware Engineer, Electronics Design Engineer, etc.
For Mechanical candidates suggest: Design Engineer, Manufacturing Engineer, CAD Engineer, Thermal Engineer, etc.
For Civil candidates suggest: Structural Engineer, Site Engineer, Project Engineer, etc.
For EEE candidates suggest: Power Systems Engineer, Control Systems Engineer, Electrical Design Engineer, etc.
For Software/CSE candidates suggest: Frontend Developer, Backend Developer, Full Stack Developer, etc.

Candidate Profile:
${JSON.stringify(profile, null, 2)}

Return ONLY this JSON, no extra text:
{
  "roles": [
    {
      "id": "role-slug",
      "title": "Role Name",
      "required_skills": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6", "skill7", "skill8"],
      "automation_risk": "Low | Medium | High",
      "why_relevant": "one line reason why this role fits this candidate"
    }
  ]
}

Return exactly 7 roles ordered by relevance to this candidate.`;
}

// ── Phase 3: Full resume details + match scoring ──────────────────────────────
function buildAnalysisPrompt(
  rawText: string,
  allSkills: string[],
  softSkills: string[],
  domain: string,
  roles: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
): string {
  const roleList = roles.map(r =>
    `{"id":"${r.id}","title":"${r.title}","requiredSkills":${JSON.stringify(r.required_skills)},"matchedSkills":[],"missingSkills":[],"matchPercent":0,"automationRisk":"${r.automation_risk || "Medium"}"}`
  ).join(",\n    ");

  return `You are a resume analyst. Extract details and compute job matches. Return ONLY JSON, no markdown.

CANDIDATE SKILLS: ${allSkills.join(", ")}
SOFT SKILLS: ${softSkills.join(", ")}
DOMAIN: ${domain}

Return ONLY this JSON:
{
  "name": "full name",
  "email": "email or empty",
  "phone": "phone or empty",
  "location": "city/country or empty",
  "currentRole": "most recent job title or empty",
  "yearsOfExperience": 0,
  "experienceLevel": "Beginner",
  "education": "degree, field, institution or empty",
  "summary": "2-sentence professional summary",
  "workExperience": [{"title":"","company":"","duration":"","highlights":[""]}],
  "projects": [{"name":"","description":"","techStack":[""]}],
  "certifications": [],
  "jobMatches": [
    ${roleList}
  ],
  "roadmap": [{"skill":"","priority":"High","timeline":"2 weeks","reason":""}],
  "career": {"shortTerm":["","",""],"midTerm":["","",""],"longTerm":["","",""],"summary":""}
}

Rules:
- matchedSkills: skills from requiredSkills that candidate ACTUALLY HAS
- missingSkills: requiredSkills NOT in candidate's skills
- matchPercent: round(matchedSkills.length / requiredSkills.length * 100)
- roadmap: 6-8 most impactful missing skills with specific reasons for this candidate
- career: realistic roles for this domain, 3 items each array
- experienceLevel: Beginner=0-2yrs/Fresher, Intermediate=2-5yrs, Advanced=5+yrs/Senior

Resume Text:
${rawText.slice(0, 3500)}`;
}

// ── Gemini call with model fallback ───────────────────────────────────────────
async function callGemini(prompt: string, apiKey: string, label: string): Promise<string | null> {
  const genAI = new GoogleGenerativeAI(apiKey);
  for (const modelName of MODELS) {
    try {
      console.log(`[${label}] Trying ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0, maxOutputTokens: 8192 },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      console.log(`[${label}] ✓ ${modelName} (${text.length} chars)`);
      return text;
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const msg = String(err?.message ?? err);
      console.warn(`[${label}] ✗ ${modelName}: ${msg.slice(0, 100)}`);
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
    let t = raw.replace(/^```json\s*/im, "").replace(/^```\s*/im, "").replace(/```\s*$/im, "").trim();
    // Handle arrays too
    const objStart = t.indexOf("{");
    const arrStart = t.indexOf("[");
    const start = objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart);
    const isArr = start === arrStart && arrStart !== -1 && (objStart === -1 || arrStart < objStart);
    const end = isArr ? t.lastIndexOf("]") : t.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(t.slice(start, end + 1));
  } catch { return null; }
}

// ── Local fallback ────────────────────────────────────────────────────────────
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
  };
}

// ── Default software roles fallback ──────────────────────────────────────────
const DEFAULT_ROLES = [
  { id: "frontend-dev",    title: "Frontend Developer",    required_skills: ["react","typescript","javascript","html","css","tailwind","redux","jest","webpack","accessibility"], automation_risk: "Medium" },
  { id: "backend-dev",     title: "Backend Developer",     required_skills: ["nodejs","python","rest api","postgresql","redis","docker","microservices","testing","git","system design"], automation_risk: "Medium" },
  { id: "fullstack-dev",   title: "Full Stack Developer",  required_skills: ["react","nodejs","typescript","postgresql","docker","rest api","git","css","redis","testing"], automation_risk: "Medium" },
  { id: "ml-engineer",     title: "ML Engineer",           required_skills: ["python","tensorflow","pytorch","scikit-learn","pandas","numpy","mlflow","sql","docker","statistics"], automation_risk: "Low" },
  { id: "devops-engineer", title: "DevOps Engineer",       required_skills: ["docker","kubernetes","aws","terraform","ci/cd","linux","bash","nginx","prometheus","helm"], automation_risk: "Low" },
  { id: "data-analyst",    title: "Data Analyst",          required_skills: ["sql","python","pandas","data visualization","statistics","excel","tableau","matplotlib","seaborn","reporting"], automation_risk: "High" },
  { id: "cloud-engineer",  title: "Cloud Engineer",        required_skills: ["aws","azure","gcp","terraform","kubernetes","docker","ci/cd","linux","cloudformation","networking"], automation_risk: "Low" },
];

// ── Main route ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });

    // Step 1: PDF → raw text
    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = "";
    try { rawText = await parsePdfBuffer(buffer); }
    catch { return NextResponse.json({ error: "Failed to read PDF. Please ensure it is a text-based PDF." }, { status: 422 }); }
    if (!rawText || rawText.trim().length < 30)
      return NextResponse.json({ error: "PDF appears empty or image-based." }, { status: 422 });
    console.log(`[parse] PDF: ${rawText.length} chars`);

    const apiKey = process.env.GEMINI_API_KEY;

    // Step 2: Extract skills (any domain)
    let hardSkills: string[] = [];
    let softSkills: string[] = [];
    let tools: string[] = [];
    let domain = "Engineering";
    let geminiExpLevel = "";

    if (apiKey) {
      const skillData = parseJSON(await callGemini(buildSkillPrompt(rawText), apiKey, "skills"));
      if (skillData) {
        hardSkills     = (skillData.hard_skills   ?? []).map((s: string) => s.toLowerCase().trim()).filter((s: string) => s.length > 1);
        softSkills     = (skillData.soft_skills   ?? []).map((s: string) => s.toLowerCase().trim()).filter((s: string) => s.length > 1);
        tools          = (skillData.tools         ?? []).map((s: string) => s.toLowerCase().trim()).filter((s: string) => s.length > 1);
        domain         = skillData.domain         || "Engineering";
        geminiExpLevel = skillData.experience_level || "";
        console.log(`[parse] Skills: ${hardSkills.length}H ${softSkills.length}S ${tools.length}T | ${domain} | ${geminiExpLevel}`);
      }
    }

    const keywordSkills = extractSkillsFromText(rawText);
    const allExtracted  = [...new Set([...hardSkills, ...tools, ...keywordSkills])];

    // Step 3: Career mapping — domain-specific roles
    let roles = DEFAULT_ROLES;
    if (apiKey && allExtracted.length > 0) {
      const profile = { domain, experience_level: geminiExpLevel, hard_skills: allExtracted, soft_skills: softSkills, tools, certifications: [] };
      const roleData = parseJSON(await callGemini(buildCareerMapPrompt(profile), apiKey, "roles"));
      if (Array.isArray(roleData?.roles) && roleData.roles.length >= 5) {
        roles = roleData.roles;
        console.log(`[parse] Roles: ${roles.map((r: any) => r.title).join(", ")}`); // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }

    // Step 4: Full analysis with domain-specific roles
    let g: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (apiKey) {
      g = parseJSON(await callGemini(buildAnalysisPrompt(rawText, allExtracted, softSkills, domain, roles), apiKey, "analysis"));
      if (g?.name) console.log(`[parse] Analysis: "${g.name}", ${g.jobMatches?.length} matches`);
    }

    // Step 5: Build resume
    const src = g ?? buildLocalFallback(rawText);
    const mergedSkills = [...new Set([
      ...allExtracted,
      ...(Array.isArray(src.skills) ? src.skills.map((s: string) => s.toLowerCase().trim()) : []),
    ])].filter((s: string) => s.length > 1);

    const expLevelMap: Record<string, "Beginner"|"Intermediate"|"Advanced"> = {
      "fresher": "Beginner", "junior": "Beginner",
      "mid-level": "Intermediate", "mid level": "Intermediate",
      "senior": "Advanced",
    };
    const mappedLevel = expLevelMap[geminiExpLevel.toLowerCase()] ?? null;

    const resume = {
      rawText,
      name:              src.name || extractName(rawText),
      email:             src.email || extractEmail(rawText),
      phone:             src.phone || "",
      location:          src.location || "",
      currentRole:       src.currentRole || "",
      yearsOfExperience: typeof src.yearsOfExperience === "number" ? src.yearsOfExperience : 0,
      experienceLevel:   (mappedLevel ?? (
        (["Beginner","Intermediate","Advanced"] as const).includes(src.experienceLevel)
          ? src.experienceLevel as "Beginner"|"Intermediate"|"Advanced"
          : "Intermediate" as const
      )),
      education:      src.education || "",
      summary:        src.summary || "",
      skills:         mergedSkills,
      hardSkills,
      softSkills,
      tools,
      domain,
      workExperience: Array.isArray(src.workExperience) ? src.workExperience : [],
      projects:       Array.isArray(src.projects) ? src.projects : [],
      certifications: Array.isArray(src.certifications) ? src.certifications : [],
    };

    // Step 6: Job matches — from Gemini analysis or compute from roles
    let jobs: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (Array.isArray(src.jobMatches) && src.jobMatches.length >= 5) {
      jobs = src.jobMatches.map((j: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const matched  = Array.isArray(j.matchedSkills) ? j.matchedSkills : [];
        const missing  = Array.isArray(j.missingSkills) ? j.missingSkills : [];
        const required = Array.isArray(j.requiredSkills) ? j.requiredSkills : [];
        return {
          id:             j.id || j.title?.toLowerCase().replace(/\s+/g, "-") || "",
          title:          j.title || "",
          requiredSkills: required,
          matchedSkills:  matched,
          missingSkills:  missing,
          matchPercent:   required.length > 0 ? Math.round((matched.length / required.length) * 100) : 0,
          automationRisk: j.automationRisk || j.automation_risk || "Medium",
        };
      }).sort((a: any, b: any) => b.matchPercent - a.matchPercent); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else {
      // Compute matches from domain-specific roles
      jobs = roles.map((role: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const required = role.required_skills ?? [];
        const matched  = required.filter((s: string) => mergedSkills.includes(s.toLowerCase()));
        const missing  = required.filter((s: string) => !mergedSkills.includes(s.toLowerCase()));
        return {
          id:             role.id || role.title?.toLowerCase().replace(/\s+/g, "-"),
          title:          role.title,
          requiredSkills: required,
          matchedSkills:  matched,
          missingSkills:  missing,
          matchPercent:   required.length > 0 ? Math.round((matched.length / required.length) * 100) : 0,
          automationRisk: role.automation_risk || "Medium",
        };
      }).sort((a: any, b: any) => b.matchPercent - a.matchPercent); // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // Step 7: Roadmap
    let roadmap: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (Array.isArray(src.roadmap) && src.roadmap.length > 0)
      roadmap = src.roadmap.filter((r: any) => r?.skill && r?.priority && r?.timeline); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!roadmap.length) roadmap = generateRoadmap(jobs);

    // Step 8: Career trajectory
    let career: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (src.career?.shortTerm?.length && src.career?.midTerm?.length) career = src.career;
    else career = generateCareerTrajectory(resume, jobs);

    console.log(`[parse] ✓ ${resume.name} | ${domain} | ${mergedSkills.length} skills | top: ${jobs[0]?.title} ${jobs[0]?.matchPercent}%`);
    return NextResponse.json({ resume, jobs, roadmap, career });

  } catch (err) {
    console.error("[parse] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
