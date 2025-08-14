import { z } from "zod";

export const userSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(50, "Password must not exceed 50 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"),
});

export const signupSchema = userSchema
  .extend({
    firstName: z.string().min(1, "First name is required").max(50, "First name must not exceed 50 characters"),
    lastName: z.string().min(1, "Last name is required").max(50, "Last name must not exceed 50 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type UserFormData = z.infer<typeof userSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
