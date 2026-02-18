import { z } from 'zod';

export const profileSchema = z.object({
    success: z.boolean(),
    message : z.string(),
    data: z.object({
        id: z.string(),
        name: z.string(),
        email : z.string(),
        role : z.string(),
        createdAt: z.date(),
        _count : z.object({
            applications: z.number()
        }) 
    }).optional().nullable(),
});

export type ProfileSchemaResponse = z.infer<typeof profileSchema>;