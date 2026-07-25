import { z } from "zod";

export const ContactSchema = z.object({
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
});

export const ExperienceSchema = z.object({
  role: z.string(),
  company: z.string(),
  location: z.string().optional(),
  period: z.string(),
  bullets: z.array(z.string()),
});

export const EducationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  year: z.string().optional(),
});

export const LanguageSkillSchema = z.object({
  name: z.string(),
  level: z.string(),
});

export const ResumeSchema = z.object({
  language: z.enum(["pt", "en"]),
  contact: ContactSchema,
  headline: z.string(),
  summary: z.string(),
  experience: z.array(ExperienceSchema),
  skills: z.array(z.string()),
  education: z.array(EducationSchema),
  certifications: z.array(z.string()).optional(),
  languages: z.array(LanguageSkillSchema).optional(),
  keywordsMatched: z.array(z.string()),
});

export const CoverLetterSchema = z.object({
  greeting: z.string(),
  paragraphs: z.array(z.string()),
  closing: z.string(),
});

export const ApplicationSchema = z.object({
  resume: ResumeSchema,
  coverLetter: CoverLetterSchema,
});

export type Contact = z.infer<typeof ContactSchema>;
export type Resume = z.infer<typeof ResumeSchema>;
export type CoverLetter = z.infer<typeof CoverLetterSchema>;
export type Application = z.infer<typeof ApplicationSchema>;
