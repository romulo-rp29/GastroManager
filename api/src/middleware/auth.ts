import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase';
import { logger } from '../utils/logger';

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      logger.warn('Invalid or expired token', { error });
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user to the request object
    (req as any).user = user;
    
    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const checkRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user role from the database
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !userData) {
        logger.error('Error fetching user role', { error });
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!roles.includes(userData.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      logger.error('Role check error', { error });
      return res.status(500).json({ error: 'Authorization failed' });
    }
  };
};
