import z from "zod";

export const shortenerSchema = z.object({
  url: z
    .string({ required_error: "URL is required." })
    .url({ message: "Please enter a valid URL" })
    .trim()
    .max(1024, { message: "URL cannot be longer than 1024 characters." }),

  shortCode: z
    .string({ required_error: "Short code is requires." })
    .trim()
    .min(2, "Short code must be at least 2 characters lomg.")
    .max(50, "Short code cannot  be lomger than  50 characters"),
});
