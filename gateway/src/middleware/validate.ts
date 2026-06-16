import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

const requestSchema = z.object({
  prompt: z
    .string()
    .min(2, "Prompt must be at least 2 characters long")
    .max(2000, "Prompt cannot exceed 2000 characters"),
});

export const validatePayload = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const result = requestSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: "Invalid request payload",
      details: result.error.issues
    });
    return;
  }

  req.body.prompt = result.data.prompt;
  next();
};
