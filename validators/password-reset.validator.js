import z from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email({
      message: "Please enter a valid email address.",
    })
    .max(100, {
      message: "Email must be no more than 100 characters.",
    }),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, {
      message: "Invalid reset token.",
    }),

    password: z.string().min(6, {
      message: "Password must be at least 6 characters long.",
    }),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
