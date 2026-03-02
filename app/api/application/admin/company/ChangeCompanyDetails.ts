import { z } from "zod";

export const ChangeCompanyDetailsSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().min(1).max(100).optional(),
    logo: z
        .file()
        .refine((file) => file.size <= 1000000, "Logo size must be less than 1MB")
        .optional(),
    website: z.string().url().optional(),
    location: z.array(z.string().min(1).max(100)).optional(),
});
