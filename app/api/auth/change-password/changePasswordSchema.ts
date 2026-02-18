import { z } from "zod";

export const changePasswordRequest = z.object({
  oldPassword: z
    .string()
    .min(8, "Password should be 8 charater long")
    .max(20, "Password should not exceed 20 character"),
  newPassword: z
    .string()
    .min(8, "Password should be 8 charater long")
    .max(20, "Password should not exceed 20 character"),
});
