export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced";

export interface WorkExperience {
  title: string;
  company: string;
  duration: string;
  highlights: string[];
}

export interface Project {
  name: string;
  description: string;
  techStack: string[];
}

export interface ParsedResume {
  rawText: string;
  skills: string[];
  hardSkills: string[];
  softSkills: string[];
  domain: string;
  experienceLevel: ExperienceLevel;
  name: string;
  email: string;
  phone: string;
  location: string;
  currentRole: string;
  education: string;
  summary: string;
  yearsOfExperience: number;
  workExperience: WorkExperience[];
  projects: Project[];
  certifications: string[];
}

export interface JobRole {
  id: string;
  title: string;
  requiredSkills: string[];
  matchPercent: number;
  matchedSkills: string[];
  missingSkills: string[];
  automationRisk: "Low" | "Medium" | "High";
}

export interface SkillGap {
  skill: string;
  importance: string;
  role: string;
}

export interface RoadmapItem {
  skill: string;
  timeline: string;
  priority: "High" | "Medium" | "Low";
  reason: string;
}

export interface CareerTrajectory {
  shortTerm: string[];
  midTerm: string[];
  longTerm: string[];
  summary?: string;
}

export interface ExchangeSkill {
  skill: string;
  addedAt: string;
}

export interface AppState {
  resume: ParsedResume | null;
  jobs: JobRole[];
  roadmap: RoadmapItem[];
  career: CareerTrajectory | null;
  exchange: ExchangeSkill[];
  exchangePoints: number;
}
