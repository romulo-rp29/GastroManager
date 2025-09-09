import { Router } from 'express';
import { supabase } from '../services/supabase';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateJWT, checkRole } from '../middleware/auth';
import { logger } from '../utils/logger';

// Define user roles for authorization
const ADMIN_ROLE = 'admin';
const DOCTOR_ROLE = 'doctor';
const RECEPTIONIST_ROLE = 'receptionist';

export const userRouter = Router();

// Apply authentication middleware to all user routes
userRouter.use(authenticateJWT);

// Get all users (admin only)
userRouter.get(
  '/',
  checkRole([ADMIN_ROLE]),
  asyncHandler(async (req, res) => {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at, updated_at');

    if (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }

    res.json(users);
  })
);

// Get current user profile
userRouter.get(
  '/profile',
  asyncHandler(async (req: any, res) => {
    const userId = req.user?.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      logger.error('Error fetching user profile:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  })
);

// Update user profile
userRouter.put(
  '/profile',
  asyncHandler(async (req: any, res) => {
    const userId = req.user?.id;
    const { full_name, email } = req.body;

    // Only allow updating specific fields
    const updates: { full_name?: string; email?: string } = {};
    if (full_name) updates.full_name = full_name;
    if (email) updates.email = email;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }

    // If email was updated, update it in auth as well
    if (email) {
      const { error: updateEmailError } = await supabase.auth.updateUser({
        email,
      });

      if (updateEmailError) {
        logger.error('Error updating auth email:', updateEmailError);
        throw updateEmailError;
      }
    }

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    });
  })
);

// Change password
userRouter.post(
  '/change-password',
  asyncHandler(async (req: any, res) => {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Reauthenticate user before allowing password change
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword,
    });

    if (authError || !user) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      logger.error('Error updating password:', updateError);
      throw updateError;
    }

    res.json({ message: 'Password updated successfully' });
  })
);

// Admin endpoints for user management

// Get user by ID (admin only)
userRouter.get(
  '/:id',
  checkRole([ADMIN_ROLE]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  })
);

// Update user (admin only)
userRouter.put(
  '/:id',
  checkRole([ADMIN_ROLE]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { full_name, email, role, is_active } = req.body;

    const updates: any = {};
    if (full_name) updates.full_name = full_name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (typeof is_active !== 'undefined') updates.is_active = is_active;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating user:', error);
      throw error;
    }

    // If email was updated, update it in auth as well
    if (email) {
      const { error: updateEmailError } = await supabase.auth.admin.updateUserById(id, {
        email,
      });

      if (updateEmailError) {
        logger.error('Error updating auth email:', updateEmailError);
        throw updateEmailError;
      }
    }

    res.json(user);
  })
);

// Delete user (admin only)
userRouter.delete(
  '/:id',
  checkRole([ADMIN_ROLE]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // First, delete the user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    
    if (authError) {
      logger.error('Error deleting user from auth:', authError);
      throw authError;
    }

    // Then delete from the users table
    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      logger.error('Error deleting user from database:', error);
      throw error;
    }

    res.json({ message: 'User deleted successfully' });
  })
);
