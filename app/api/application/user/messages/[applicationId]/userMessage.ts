import { z } from "zod";

export const userMessageSchema = z.object({
    text: z.string().min(1, "Message text cannot be empty."),
});
