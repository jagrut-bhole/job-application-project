import { z } from "zod";

export const profileSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      role: z.string(),
      bio: z.string().nullable(),
      createdAt: z.date(),
      _count: z.object({
        applications: z.number(),
      }),
      skills: z.array(z.string()).nullable(),
      resumeUrl: z.string().nullable(),
      profileImage: z.string().nullable(),
      updatedAt: z.date(),
    })
    .optional()
    .nullable(),
});

export type ProfileSchemaResponse = z.infer<typeof profileSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(3, "Name should be more than 3 characters").optional(),
  bio: z.string().max(500, "Bio should not be more than 500 characters").optional(),
  skills: z.array(z.string()).optional(),
  resume: z
    .instanceof(File)
    .refine((file) => file.size > 0, "Resume is required")
    .optional(),
  logo: z
    .instanceof(File)
    .refine((file) => file.size > 0, "Profile image is required")
    .optional(),
});
