import z from "zod";

// Common Password Validation
const passwordSchema = z
  .string()
  .min(8, {
    message: "Password must be at least 8 characters long.",
  })
  .max(100, {
    message: "Password must be no more than 100 characters.",
  })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter.",
  })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter.",
  })
  .regex(/[0-9]/, {
    message: "Password must contain at least one number.",
  });

// Login Validation
export const loginUserSchema = z.object({
  email: z
    .string()
    .trim()
    .email({
      message: "Please enter a valid email address.",
    })
    .max(100, {
      message: "Email must be no more than 100 characters.",
    }),

  password: z
    .string()
    .min(6, {
      message: "Password must be at least 6 characters long.",
    })
    .max(100, {
      message: "Password must be no more than 100 characters.",
    }),
});

// Registration Validation
export const registerUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, {
      message: "Name must be at least 3 characters long.",
    })
    .max(100, {
      message: "Name must be no more than 100 characters.",
    }),

  email: z
    .string()
    .trim()
    .email({
      message: "Please enter a valid email address.",
    })
    .max(100, {
      message: "Email must be no more than 100 characters.",
    }),

  password: passwordSchema,
});

// Change Password Validation
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, {
      message: "Current password is required.",
    }),

    newPassword: passwordSchema,

    confirmPassword: z.string().min(1, {
      message: "Please confirm your new password.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });
