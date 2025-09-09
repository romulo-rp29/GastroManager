import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Middleware to verify JWT token and attach user to request
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || req.cookies['sb-access-token'];

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid or expired token', { error });
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user role from the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      logger.error('Error fetching user data', { error: userError });
      return res.status(401).json({ error: 'User not found' });
    }

    if (!userData.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Attach user to the request object
    req.user = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Role-based access control middleware
export const authorize = (roles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Admin-only middleware
export const requireAdmin = authorize(['admin']);

// Doctor or admin middleware
export const requireDoctorOrAdmin = authorize(['admin', 'doctor']);

// Receptionist or admin middleware
export const requireReceptionistOrAdmin = authorize(['admin', 'receptionist']);
