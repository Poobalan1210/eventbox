/**
 * Error handling middleware for Express
 */
import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types/api.js';
import { ZodError } from 'zod';

/**
 * Global error handler middleware
 * Must be registered after all routes
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error for debugging
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Check if response already sent
  if (res.headersSent) {
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      error: 'ValidationError',
      message: 'Invalid request data',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    };
    return res.status(400).json(response);
  }

  // Handle custom validation errors
  if (err.name === 'ValidationError') {
    const response: ErrorResponse = {
      error: 'ValidationError',
      message: err.message,
    };
    return res.status(400).json(response);
  }

  // Handle AWS SDK errors
  if (err.name === 'ResourceNotFoundException') {
    const response: ErrorResponse = {
      error: 'NotFound',
      message: 'Resource not found',
    };
    return res.status(404).json(response);
  }

  if (err.name === 'ConditionalCheckFailedException') {
    const response: ErrorResponse = {
      error: 'Conflict',
      message: 'Resource conflict - the resource may have been modified',
    };
    return res.status(409).json(response);
  }

  if (err.name === 'ProvisionedThroughputExceededException' || err.name === 'ThrottlingException') {
    const response: ErrorResponse = {
      error: 'ServiceUnavailable',
      message: 'Service temporarily unavailable. Please try again.',
    };
    return res.status(503).json(response);
  }

  if (err.name === 'ServiceUnavailable' || err.name === 'InternalServerError') {
    const response: ErrorResponse = {
      error: 'ServiceUnavailable',
      message: 'Database service temporarily unavailable',
    };
    return res.status(503).json(response);
  }

  // Handle timeout errors
  if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
    const response: ErrorResponse = {
      error: 'RequestTimeout',
      message: 'Request timed out. Please try again.',
    };
    return res.status(408).json(response);
  }

  // Default to 500 Internal Server Error
  const response: ErrorResponse = {
    error: 'InternalServerError',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred',
  };

  res.status(500).json(response);
}
