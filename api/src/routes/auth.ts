import { Router } from 'express';
import { supabase } from '../services/supabase';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const authRouter = Router();

// User registration
authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, full_name, role = 'receptionist' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role,
        },
      },
    });

    if (signUpError) {
      logger.error('Error during signup:', signUpError);
      throw signUpError;
    }

    // Create user in the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user?.id,
          email,
          full_name,
          role,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (userError) {
      logger.error('Error creating user profile:', userError);
      // Rollback user creation in auth if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user?.id || '');
      throw userError;
    }

    res.status(201).json({
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
      },
    });
  })
);

// User login
authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn('Login failed for user:', { email, error: error.message });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get user profile from database
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!userProfile || !userProfile.is_active) {
      await supabase.auth.signOut();
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Set session cookie
    res.cookie('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // or 'strict' for better security
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    res.json({
      user: {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        role: userProfile.role,
      },
    });
  })
);

// User logout
authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await supabase.auth.signOut();
    res.clearCookie('sb-access-token');
    res.json({ message: 'Successfully logged out' });
  })
);

// Get current user
authRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const token = req.cookies['sb-access-token'] || 
                 req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user profile from database
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!userProfile || !userProfile.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    res.json({
      user: {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name,
        role: userProfile.role,
      },
    });
  })
);
