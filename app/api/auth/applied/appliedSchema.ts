import { z } from "zod";

export const appliedSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    id: z.string(),
    company: z.string(),
    position: z.string(),
    jobDescription: z.string(),
    appliedDate: z.date(),
    status: z.string(),
    salary: z.string().nullable(),
    location: z.string().nullable(),
    notes: z
      .object({
        text: z.string(),
      }).array()
  }).array().optional(),
});

export type AppliedSchemaResponse = z.infer<typeof appliedSchema>;