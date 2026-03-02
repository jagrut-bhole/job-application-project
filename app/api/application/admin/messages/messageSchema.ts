import { z } from "zod";

export const adminMessageSchema = z.object({
    text: z.string().trim().min(1, "Message text cannot be empty").max(2000, "Message is too long"),
});

export const messageIdParam = z.object({
    messageId: z.string().uuid(),
});

export const applicationIdParam = z.object({
    applicationId: z.string().uuid(),
});
