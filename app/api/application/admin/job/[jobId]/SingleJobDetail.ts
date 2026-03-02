import { z } from "zod";

export const singleJobDetailsReauest = z.object({
    jobId: z.string().uuid(),
});

export const editJobRequest = z
    .object({
        title: z.string().trim().min(3).optional(),
        description: z.string().trim().min(10).optional(),
        salary: z.string().optional(),
        location: z.string().optional(),
        type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "REMOTE"]).optional(),
        skills: z.array(z.string().trim()).min(1, "Skills cannot be empty").optional(),
        expiresAt: z.string().datetime().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided",
    });
