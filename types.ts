export interface UserProfile {
  name: string;
  gradeLevel: string;
  favoriteSubjects: string;
  hobbies: string;
  skills: string;
  dream: string;
}

export interface SkillMetric {
  category: string;
  score: number; // 0-100
  reasoning: string;
}

export interface CareerPath {
  title: string;
  matchScore: number; // 0-100
  description: string;
  salaryRange: string;
  educationRequired: string;
  roadmap: string[];
}

export interface AnalysisResult {
  skillsReport: SkillMetric[];
  careers: CareerPath[];
  summary: string;
}

export enum AppState {
  LANDING,
  INPUT,
  ANALYZING,
  DASHBOARD,
  INTERVIEW
}
