import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { logger } from '../utils/logger';

/**
 * Middleware to validate the request using express-validator
 * @param validations Array of validation chains
 * @returns Middleware function
 */
export const validateRequest = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Log validation errors
    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: errors.array(),
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Format error response
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: formattedErrors,
    });
  };
};

/**
 * Middleware to validate UUID parameters
 * @param paramNames Names of the parameters to validate as UUIDs
 * @returns Middleware function
 */
export const validateUUIDParams = (paramNames: string | string[]) => {
  const params = Array.isArray(paramNames) ? paramNames : [paramNames];
  
  return (req: Request, res: Response, next: NextFunction) => {
    const invalidParams = params.filter(param => {
      const value = req.params[param];
      return !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    });

    if (invalidParams.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid parameters',
        errors: invalidParams.map(param => ({
          field: param,
          message: 'Must be a valid UUID',
          value: req.params[param],
        })),
      });
    }

    next();
  };
};

/**
 * Middleware to validate required query parameters
 * @param paramNames Names of the required query parameters
 * @returns Middleware function
 */
export const validateRequiredQueryParams = (paramNames: string | string[]) => {
  const params = Array.isArray(paramNames) ? paramNames : [paramNames];
  
  return (req: Request, res: Response, next: NextFunction) => {
    const missingParams = params.filter(param => !(param in req.query));

    if (missingParams.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required query parameters',
        errors: missingParams.map(param => ({
          field: param,
          message: 'This query parameter is required',
        })),
      });
    }

    next();
  };
};

/**
 * Middleware to validate required body fields
 * @param fieldNames Names of the required body fields
 * @returns Middleware function
 */
export const validateRequiredBodyFields = (fieldNames: string | string[]) => {
  const fields = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
  
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = fields.filter(field => !(field in req.body));

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
        errors: missingFields.map(field => ({
          field,
          message: 'This field is required',
        })),
      });
    }

    next();
  };
};
