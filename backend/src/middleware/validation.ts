/**
 * Validation middleware for request validation using Zod schemas
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory to validate request body against a Zod schema
 */
export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid request data',
          details: errors,
        });
      }
      next(error);
    }
  };
}
