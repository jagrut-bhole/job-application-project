import { z } from "zod";

export const changeJobStatusRequest = z.object({
    status: z.enum(["OPEN", "CLOSED", "PAUSED"]),
});

export const jobIdParam = z.object({
    jobId: z.string().uuid(),
});
