import { z } from "zod";

export const postJobRequest = z.object({
  title: z.string(),
  description: z.string(),
  salary: z.string(),
  location: z.string(),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "REMOTE"]).default("FULL_TIME"),
  skills: z.array(z.string()).min(1, "1 skills should be mentioned"),
  expiresAt: z.coerce
    .date()
    .refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return date >= today;
    }, "Expiry date cannot be in past")
    .optional(),
});
