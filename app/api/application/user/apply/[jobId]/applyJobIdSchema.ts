import { z } from "zod";

export const applyJobIdSchema = z.object({
    coverLetter: z
        .string()
        .max(500, "Cover letter should not be more than 500 characters")
        .optional(),
});
