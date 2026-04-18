import { JobRole, RoadmapItem } from "@/types";
import { SKILL_IMPORTANCE } from "./jobMatcher";

const SKILL_TIMELINE: Record<string, string> = {
  docker: "2 weeks",
  kubernetes: "4 weeks",
  typescript: "2 weeks",
  react: "3 weeks",
  nodejs: "3 weeks",
  python: "3 weeks",
  aws: "6 weeks",
  postgresql: "2 weeks",
  tensorflow: "6 weeks",
  pytorch: "6 weeks",
  "ci/cd": "2 weeks",
  terraform: "4 weeks",
  redis: "1 week",
  graphql: "2 weeks",
  "system design": "8 weeks",
  sql: "2 weeks",
  "machine learning": "8 weeks",
  statistics: "4 weeks",
  linux: "2 weeks",
  git: "1 week",
  "rest api": "1 week",
  jest: "1 week",
  webpack: "2 weeks",
  tailwind: "1 week",
  css: "2 weeks",
  html: "1 week",
  javascript: "4 weeks",
  pandas: "2 weeks",
  numpy: "1 week",
  "scikit-learn": "3 weeks",
  mlflow: "2 weeks",
  helm: "2 weeks",
  nginx: "1 week",
  prometheus: "2 weeks",
  bash: "2 weeks",
  azure: "6 weeks",
  gcp: "6 weeks",
  cloudformation: "3 weeks",
  "data visualization": "2 weeks",
  matplotlib: "1 week",
  seaborn: "1 week",
  redux: "2 weeks",
  nestjs: "3 weeks",
  fastapi: "2 weeks",
  mongodb: "2 weeks",
  microservices: "4 weeks",
  testing: "2 weeks",
  accessibility: "2 weeks",
};

const SKILL_PRIORITY: Record<string, "High" | "Medium" | "Low"> = {
  docker: "High",
  kubernetes: "High",
  typescript: "High",
  react: "High",
  nodejs: "High",
  python: "High",
  aws: "High",
  postgresql: "High",
  tensorflow: "Medium",
  pytorch: "Medium",
  "ci/cd": "High",
  terraform: "High",
  redis: "Medium",
  graphql: "Medium",
  "system design": "High",
  sql: "High",
  "machine learning": "High",
  statistics: "High",
  linux: "High",
  git: "High",
  "rest api": "High",
  jest: "Medium",
  webpack: "Low",
  tailwind: "Medium",
  css: "Medium",
  html: "Medium",
  javascript: "High",
  pandas: "High",
  numpy: "Medium",
  "scikit-learn": "High",
  mlflow: "Medium",
  helm: "Medium",
  nginx: "Medium",
  prometheus: "Medium",
  bash: "Medium",
  azure: "Medium",
  gcp: "Medium",
  cloudformation: "Medium",
  "data visualization": "High",
  matplotlib: "Medium",
  seaborn: "Low",
  redux: "Medium",
  nestjs: "Medium",
  fastapi: "Medium",
  mongodb: "Medium",
  microservices: "High",
  testing: "High",
  accessibility: "Medium",
};

export function generateRoadmap(jobs: JobRole[]): RoadmapItem[] {
  const skillFrequency: Record<string, number> = {};

  for (const job of jobs.slice(0, 3)) {
    for (const skill of job.missingSkills) {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + (job.matchPercent >= 50 ? 2 : 1);
    }
  }

  const sorted = Object.entries(skillFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  return sorted.map(([skill]) => ({
    skill,
    timeline: SKILL_TIMELINE[skill] || "2 weeks",
    priority: SKILL_PRIORITY[skill] || "Medium",
    reason: SKILL_IMPORTANCE[skill] || `${skill} is required across multiple target roles.`,
  }));
}
