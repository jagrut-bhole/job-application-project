import { z } from "zod";

export const createCompanySchema = z.object({
    name: z.string().min(3, "Name should be more than 3 character!!"),
    description: z.string().max(500, "Not should be more than 500 characters").optional(),
    website: z.string().optional(),
    location: z.string().array().optional(),
    logo: z.instanceof(File).refine((file) => file.size > 0, "Logo is required"),
});
