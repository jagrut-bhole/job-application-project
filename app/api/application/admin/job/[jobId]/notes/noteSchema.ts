import { z } from "zod";

export const addNoteRequest = z.object({
    text: z.string().trim().min(1, "Note cannot be empty").max(1000, "Note is too long"),
});
