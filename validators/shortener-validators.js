import z from "zod";

export const shortenerSchema = z.object({
  url: z.url("Please enter a valid URL").trim(),

  shortCode: z
    .string()
    .trim()
    .min(3, "Short code must be at least 3 characters")
    .max(20, "Short code must not exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Short code can only contain letters, numbers, hyphens, and underscores",
    ),
});
