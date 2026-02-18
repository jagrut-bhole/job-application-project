import { z } from "zod";

export const deleteAccountPassword = z.object({
  password: z
    .string()
    .min(8, "Password should 8 characters long")
    .max(20, "Password should not exceed 20 characters"),
});
