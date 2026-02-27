import { z } from "zod";

export const appliedSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z
    .array(
      z.object({
        status: z.enum(["OPEN", "CLOSED", "PAUSED"]).default("OPEN"),
        id: z.string(),
        company: z.object({
          id: z.string(),
          name: z.string(),
          website: z.string().nullable(),
          logoUrl: z.string().nullable(),
          location: z.array(z.string()).nullable(),
        }),
        location: z.string().nullable(),
        description: z.string(),
        type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "REMOTE"]),
        title: z.string(),
        salary: z.string().nullable(),
        postedAt: z.date(),
      })
    )
    .optional(),
});

export type AppliedSchemaResponse = z.infer<typeof appliedSchema>;
