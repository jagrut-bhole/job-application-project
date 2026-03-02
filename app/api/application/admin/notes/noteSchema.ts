import { z } from "zod";

export const addAppNoteSchema = z.object({
    text: z.string().trim().min(1, "Note cannot be empty").max(1000, "Note is too long"),
});

export const applicationIdParam = z.object({
    applicationId: z.string().uuid(),
});

export const noteIdParam = z.object({
    noteId: z.string().uuid(),
});
