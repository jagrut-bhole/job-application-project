import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(3,"Name should be more than 3 characters").max(20,'Name should not be more than 20 characters'),
    email: z.string(),
    password: z.string().min(8,"Password should be more than 8 characters").max(20,'Password should not be more than 20 characters'),
});

export const registerSchemaResponse = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        role: z.string(),
        createdAt: z.string(),
    }).optional()
});
export type RegisterSchemaResponse = z.infer<typeof registerSchemaResponse>