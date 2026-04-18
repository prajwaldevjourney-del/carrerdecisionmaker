export const SKILL_DATABASE: string[] = [
  // Frontend
  "react", "vue", "angular", "nextjs", "typescript", "javascript", "html", "css",
  "tailwind", "sass", "redux", "graphql", "webpack", "vite", "jest", "cypress",
  "storybook", "figma", "responsive design", "accessibility", "react native",
  "flutter", "swift", "kotlin", "electron",
  // Backend
  "nodejs", "express", "nestjs", "python", "django", "fastapi", "flask",
  "java", "spring", "golang", "rust", "php", "laravel", "ruby", "rails",
  "rest api", "grpc", "websockets", "microservices", "kafka", "rabbitmq",
  "c++", "c#", ".net", "scala",
  // Database
  "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
  "dynamodb", "cassandra", "firebase", "supabase", "prisma", "sequelize",
  "snowflake", "bigquery", "databricks", "dbt",
  // DevOps / Cloud
  "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ansible",
  "ci/cd", "github actions", "jenkins", "nginx", "linux", "bash", "helm",
  "prometheus", "grafana", "datadog", "cloudformation", "serverless",
  // ML / Data / AI
  "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch",
  "keras", "matplotlib", "seaborn", "sql", "spark", "hadoop", "airflow",
  "mlflow", "huggingface", "langchain", "openai", "data visualization",
  "statistics", "machine learning", "deep learning", "nlp", "computer vision",
  "looker", "tableau", "power bi",
  // General
  "git", "agile", "scrum", "jira", "system design", "algorithms", "data structures",
  "oop", "functional programming", "testing", "debugging", "code review",
];

export const SKILL_ALIASES: Record<string, string> = {
  "react.js": "react",
  "reactjs": "react",
  "react js": "react",
  "next.js": "nextjs",
  "next js": "nextjs",
  "node.js": "nodejs",
  "node js": "nodejs",
  "vue.js": "vue",
  "nuxt.js": "vue",
  "nuxtjs": "vue",
  "angular.js": "angular",
  "tailwindcss": "tailwind",
  "tailwind css": "tailwind",
  "postgres": "postgresql",
  "mongo": "mongodb",
  "mongoose": "mongodb",
  "k8s": "kubernetes",
  "tf": "terraform",
  "ml": "machine learning",
  "dl": "deep learning",
  "js": "javascript",
  "ts": "typescript",
  "py": "python",
  "ci cd": "ci/cd",
  "github action": "github actions",
  "github actions": "github actions",
  "gitlab ci": "ci/cd",
  "circle ci": "ci/cd",
  "circleci": "ci/cd",
  "express.js": "express",
  "expressjs": "express",
  "nest.js": "nestjs",
  "fast api": "fastapi",
  "spring boot": "spring",
  "springboot": "spring",
  "react native": "react native",
  "flutter": "flutter",
  "swift": "swift",
  "kotlin": "kotlin",
  "c++": "c++",
  "c#": "c#",
  ".net": ".net",
  "dotnet": ".net",
  "asp.net": ".net",
  "unity": "unity",
  "unreal": "unreal engine",
  "aws lambda": "aws",
  "amazon web services": "aws",
  "google cloud": "gcp",
  "google cloud platform": "gcp",
  "microsoft azure": "azure",
  "power bi": "power bi",
  "tableau": "tableau",
  "looker": "looker",
  "dbt": "dbt",
  "snowflake": "snowflake",
  "bigquery": "bigquery",
  "databricks": "databricks",
  "apache spark": "spark",
  "apache kafka": "kafka",
  "apache airflow": "airflow",
  "langchain": "langchain",
  "open ai": "openai",
  "chat gpt": "openai",
  "llm": "machine learning",
  "large language model": "machine learning",
  "generative ai": "machine learning",
  "gen ai": "machine learning",
  "rag": "machine learning",
  "vector database": "machine learning",
  "pinecone": "machine learning",
  "weaviate": "machine learning",
  "chromadb": "machine learning",
  "selenium": "testing",
  "playwright": "testing",
  "cypress": "cypress",
  "jest": "jest",
  "mocha": "testing",
  "junit": "testing",
  "pytest": "testing",
  "postman": "rest api",
  "swagger": "rest api",
  "openapi": "rest api",
  "grpc": "grpc",
  "graphql": "graphql",
  "websocket": "websockets",
  "socket.io": "websockets",
  "redis cache": "redis",
  "memcached": "redis",
  "elastic search": "elasticsearch",
  "solr": "elasticsearch",
  "linux/unix": "linux",
  "unix": "linux",
  "macos": "linux",
  "shell scripting": "bash",
  "shell script": "bash",
  "powershell": "bash",
  "ansible playbook": "ansible",
  "puppet": "ansible",
  "chef": "ansible",
  "vagrant": "docker",
  "virtualbox": "docker",
  "figma design": "figma",
  "adobe xd": "figma",
  "sketch": "figma",
  "invision": "figma",
  "jira software": "jira",
  "confluence": "jira",
  "trello": "agile",
  "kanban": "agile",
  "scrum master": "scrum",
  "product owner": "agile",
  "tdd": "testing",
  "bdd": "testing",
  "solid principles": "oop",
  "design patterns": "system design",
  "microservice": "microservices",
  "serverless": "aws",
  "event driven": "kafka",
  "message queue": "kafka",
  "rabbitmq": "rabbitmq",
  "celery": "python",
  "django rest framework": "django",
  "drf": "django",
  "sqlalchemy": "python",
  "alembic": "python",
  "pydantic": "python",
  "numpy": "numpy",
  "pandas": "pandas",
  "matplotlib": "matplotlib",
  "seaborn": "seaborn",
  "scikit learn": "scikit-learn",
  "sklearn": "scikit-learn",
  "xgboost": "scikit-learn",
  "lightgbm": "scikit-learn",
  "keras": "tensorflow",
  "tensorflow 2": "tensorflow",
  "pytorch lightning": "pytorch",
  "hugging face": "huggingface",
  "transformers": "huggingface",
  "bert": "huggingface",
  "gpt": "openai",
  "stable diffusion": "machine learning",
  "computer vision": "computer vision",
  "opencv": "computer vision",
  "nlp": "nlp",
  "natural language processing": "nlp",
  "data analysis": "data visualization",
  "data science": "machine learning",
  "data engineering": "spark",
  "etl": "airflow",
  "data pipeline": "airflow",
  "statistics": "statistics",
  "probability": "statistics",
  "linear algebra": "statistics",
  "calculus": "statistics",
};

export function normalizeSkill(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return SKILL_ALIASES[lower] || lower;
}

export function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const skill of SKILL_DATABASE) {
    const normalized = normalizeSkill(skill);
    if (lower.includes(normalized)) {
      found.add(normalized);
    }
  }

  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    if (lower.includes(alias)) {
      found.add(canonical);
    }
  }

  return Array.from(found);
}

export function detectExperienceLevel(text: string, skills: string[]): { level: "Beginner" | "Intermediate" | "Advanced"; years: number } {
  const lower = text.toLowerCase();

  const yearMatches = lower.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/gi);
  let years = 0;
  if (yearMatches) {
    const nums = yearMatches.map(m => parseInt(m.match(/\d+/)?.[0] || "0"));
    years = Math.max(...nums);
  }

  const seniorKeywords = ["senior", "lead", "principal", "staff", "architect", "manager", "director", "head of"];
  const juniorKeywords = ["junior", "intern", "entry", "fresher", "graduate", "trainee"];

  const isSenior = seniorKeywords.some(k => lower.includes(k));
  const isJunior = juniorKeywords.some(k => lower.includes(k));

  let level: "Beginner" | "Intermediate" | "Advanced";

  if (isSenior || years >= 5 || skills.length >= 15) {
    level = "Advanced";
    if (years === 0) years = 5;
  } else if (isJunior || years <= 1 || skills.length <= 5) {
    level = "Beginner";
    if (years === 0) years = 1;
  } else {
    level = "Intermediate";
    if (years === 0) years = 3;
  }

  return { level, years };
}

export function extractName(text: string): string {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (line.length > 2 && line.length < 50 && /^[A-Za-z\s.'-]+$/.test(line)) {
      return line;
    }
  }
  return "User";
}

export function extractEmail(text: string): string {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : "";
}
