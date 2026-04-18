import { JobRole } from "@/types";

export const JOB_DEFINITIONS: Array<{
  id: string;
  title: string;
  requiredSkills: string[];
  automationRisk: "Low" | "Medium" | "High";
}> = [
  {
    id: "frontend-dev",
    title: "Frontend Developer",
    requiredSkills: ["react", "typescript", "javascript", "html", "css", "tailwind", "redux", "jest", "webpack", "accessibility"],
    automationRisk: "Medium",
  },
  {
    id: "backend-dev",
    title: "Backend Developer",
    requiredSkills: ["nodejs", "python", "rest api", "postgresql", "redis", "docker", "microservices", "testing", "git", "system design"],
    automationRisk: "Medium",
  },
  {
    id: "fullstack-dev",
    title: "Full Stack Developer",
    requiredSkills: ["react", "nodejs", "typescript", "postgresql", "docker", "rest api", "git", "css", "redis", "testing"],
    automationRisk: "Medium",
  },
  {
    id: "ml-engineer",
    title: "ML Engineer",
    requiredSkills: ["python", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "mlflow", "sql", "docker", "statistics"],
    automationRisk: "Low",
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    requiredSkills: ["docker", "kubernetes", "aws", "terraform", "ci/cd", "linux", "bash", "nginx", "prometheus", "helm"],
    automationRisk: "Low",
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    requiredSkills: ["sql", "python", "pandas", "data visualization", "statistics", "excel", "tableau", "matplotlib", "seaborn", "reporting"],
    automationRisk: "High",
  },
  {
    id: "cloud-engineer",
    title: "Cloud Engineer",
    requiredSkills: ["aws", "azure", "gcp", "terraform", "kubernetes", "docker", "ci/cd", "linux", "cloudformation", "networking"],
    automationRisk: "Low",
  },
];

export const SKILL_IMPORTANCE: Record<string, string> = {
  docker: "Critical for containerizing and deploying applications consistently across environments.",
  kubernetes: "Essential for orchestrating containers at scale in production systems.",
  typescript: "Strongly typed JavaScript that prevents runtime errors and improves maintainability.",
  react: "The most widely used frontend library for building interactive UIs.",
  nodejs: "Enables JavaScript on the server side, critical for full-stack development.",
  python: "The primary language for data science, ML, and backend scripting.",
  aws: "The leading cloud platform used by most enterprise companies.",
  postgresql: "The most reliable open-source relational database for production apps.",
  tensorflow: "Google's ML framework used for training and deploying deep learning models.",
  pytorch: "Facebook's ML framework preferred in research and production ML pipelines.",
  "ci/cd": "Automates testing and deployment, reducing manual errors and release cycles.",
  terraform: "Infrastructure as code tool for provisioning cloud resources reliably.",
  redis: "In-memory data store used for caching, sessions, and real-time features.",
  graphql: "Flexible API query language that reduces over-fetching and under-fetching.",
  "system design": "Ability to architect scalable, reliable distributed systems.",
  sql: "Fundamental skill for querying and managing relational databases.",
  "machine learning": "Core discipline for building predictive models and AI systems.",
  statistics: "Mathematical foundation required for data analysis and ML.",
  linux: "The operating system powering most servers and cloud infrastructure.",
  git: "Version control system essential for collaborative software development.",
};

export function computeJobMatches(userSkills: string[]): JobRole[] {
  const normalizedUserSkills = userSkills.map(s => s.toLowerCase().trim());

  return JOB_DEFINITIONS.map(job => {
    const matched = job.requiredSkills.filter(s => normalizedUserSkills.includes(s));
    const missing = job.requiredSkills.filter(s => !normalizedUserSkills.includes(s));
    const matchPercent = Math.round((matched.length / job.requiredSkills.length) * 100);

    return {
      id: job.id,
      title: job.title,
      requiredSkills: job.requiredSkills,
      matchPercent,
      matchedSkills: matched,
      missingSkills: missing,
      automationRisk: job.automationRisk,
    };
  }).sort((a, b) => b.matchPercent - a.matchPercent);
}
