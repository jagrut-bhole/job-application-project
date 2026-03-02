import { z } from "zod";

export const applicationStatusSchema = z.object({
    status: z.enum(["REVIEWED", "SHORTLISTED", "INTERVIEW", "OFFER", "REJECTED", "HIRED"]),
});

export const applicationIdParam = z.object({
    applicationId: z.string().uuid(),
});
