import { JobRole, CareerTrajectory, ParsedResume } from "@/types";

export function generateCareerTrajectory(resume: ParsedResume, jobs: JobRole[]): CareerTrajectory {
  const topJobs = jobs.slice(0, 3).map(j => j.title);
  const level = resume.experienceLevel;
  const skills = resume.skills;

  const hasML = skills.some(s => ["tensorflow", "pytorch", "scikit-learn", "machine learning"].includes(s));
  const hasCloud = skills.some(s => ["aws", "gcp", "azure", "kubernetes"].includes(s));
  const hasFrontend = skills.some(s => ["react", "vue", "angular", "nextjs"].includes(s));
  const hasBackend = skills.some(s => ["nodejs", "python", "java", "golang"].includes(s));
  const hasData = skills.some(s => ["sql", "pandas", "data visualization", "statistics"].includes(s));
  const hasDevOps = skills.some(s => ["docker", "kubernetes", "terraform", "ci/cd"].includes(s));

  const shortTerm: string[] = [];
  const midTerm: string[] = [];
  const longTerm: string[] = [];

  if (level === "Beginner") {
    shortTerm.push(...topJobs.slice(0, 2).map(j => `Junior ${j}`));
    shortTerm.push("Build 2-3 portfolio projects");
    midTerm.push(...topJobs.slice(0, 2));
    midTerm.push("Contribute to open source");
    longTerm.push(`Senior ${topJobs[0]}`);
    longTerm.push("Tech Lead or Specialist");
  } else if (level === "Intermediate") {
    shortTerm.push(...topJobs.slice(0, 2));
    shortTerm.push("Lead a small team or project");
    midTerm.push(`Senior ${topJobs[0]}`);
    midTerm.push("Architect-level contributions");
    longTerm.push("Engineering Manager or Principal Engineer");
    longTerm.push("CTO or Technical Director");
  } else {
    shortTerm.push(`Senior ${topJobs[0]}`);
    shortTerm.push("Staff Engineer or Tech Lead");
    midTerm.push("Principal Engineer or Architect");
    midTerm.push("Cross-team technical leadership");
    longTerm.push("VP of Engineering or CTO");
    longTerm.push("Founder / Technical Co-founder");
  }

  if (hasML) {
    midTerm.push("ML Engineer → AI Product Lead");
    longTerm.push("AI Research Lead or Head of AI");
  }
  if (hasCloud) {
    midTerm.push("Cloud Architect");
    longTerm.push("Head of Infrastructure");
  }
  if (hasData) {
    midTerm.push("Senior Data Analyst → Data Engineer");
    longTerm.push("Head of Data / Chief Data Officer");
  }
  if (hasDevOps) {
    midTerm.push("Platform Engineer");
    longTerm.push("Head of DevOps / SRE Lead");
  }

  return {
    shortTerm: [...new Set(shortTerm)].slice(0, 4),
    midTerm: [...new Set(midTerm)].slice(0, 4),
    longTerm: [...new Set(longTerm)].slice(0, 4),
  };
}

export function answerAssistantQuery(query: string, resume: ParsedResume, jobs: JobRole[]): string {
  const q = query.toLowerCase().trim();
  const topJob = jobs[0];
  const topSkills = resume.skills.slice(0, 5).join(", ");

  if (q.includes("best fit") || q.includes("fits me") || q.includes("best job") || q.includes("suited for")) {
    return `Based on your profile, you are best suited for ${topJob.title} with a ${topJob.matchPercent}% match. Your strongest skills — ${topSkills} — align well with this role. You are missing: ${topJob.missingSkills.slice(0, 3).join(", ")}.`;
  }

  if (q.includes("learn next") || q.includes("should i learn") || q.includes("what to learn")) {
    const missing = jobs.slice(0, 3).flatMap(j => j.missingSkills).slice(0, 3);
    return `To maximize your career growth, focus on: ${missing.join(", ")}. These skills appear across your top matched roles and will significantly increase your match percentages.`;
  }

  if (q.includes("skill gap") || q.includes("missing")) {
    const allMissing = [...new Set(jobs.slice(0, 3).flatMap(j => j.missingSkills))].slice(0, 5);
    return `Your key skill gaps across top roles are: ${allMissing.join(", ")}. Addressing these will unlock higher-match opportunities.`;
  }

  if (q.includes("experience") || q.includes("level")) {
    return `You are at the ${resume.experienceLevel} level with approximately ${resume.yearsOfExperience} years of experience. You have ${resume.skills.length} identified skills in your profile.`;
  }

  if (q.includes("automation") || q.includes("risk")) {
    const lowRisk = jobs.filter(j => j.automationRisk === "Low").map(j => j.title);
    return `Roles with low automation risk that match your profile: ${lowRisk.join(", ")}. These roles require complex problem-solving that is difficult to automate.`;
  }

  if (q.includes("salary") || q.includes("pay") || q.includes("earn")) {
    return `Based on your ${resume.experienceLevel} level and top match as ${topJob.title}, you are positioned for competitive compensation in the software industry. Focus on closing skill gaps to maximize your market value.`;
  }

  if (q.includes("roadmap") || q.includes("plan") || q.includes("path")) {
    const missing = topJob.missingSkills.slice(0, 3).join(", ");
    return `Your recommended path: Start with ${topJob.title} (${topJob.matchPercent}% match). Close gaps in ${missing}. Then target senior roles within 12-18 months based on your current ${resume.experienceLevel} level.`;
  }

  return `Your profile shows ${resume.skills.length} skills at the ${resume.experienceLevel} level. Your top match is ${topJob.title} at ${topJob.matchPercent}%. Focus on your roadmap to systematically close skill gaps and advance your career.`;
}
