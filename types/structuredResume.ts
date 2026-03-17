export interface StructuredExperience {
  title: string;
  company: string;
  duration: string;
  bullets: string[];
}

export interface StructuredProject {
  name: string;
  description: string;
  technologies: string[];
}

export interface StructuredEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface StructuredResume {
  summary: string;
  skills: string[];
  experience: StructuredExperience[];
  projects: StructuredProject[];
  education: StructuredEducation[];
  total_years_experience: number;
  preferred_roles: string[];
  industries: string[];
}
