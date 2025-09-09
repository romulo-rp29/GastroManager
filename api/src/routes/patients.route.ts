import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validate-request.middleware';
import { authenticate, requireReceptionistOrAdmin } from '../middleware/auth.middleware';
import db from '../lib/supabase';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new patient
router.post(
  '/',
  requireReceptionistOrAdmin,
  [
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('date_of_birth').isISO8601().withMessage('Valid date of birth is required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
    body('phone').optional().isString(),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('address').optional().isString(),
    body('city').optional().isString(),
    body('state').optional().isString(),
    body('zip_code').optional().isPostalCode('any').withMessage('Valid ZIP code is required'),
    body('insurance_provider').optional().isString(),
    body('insurance_policy_number').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const patientData = req.body;
      const patient = await db.patients.create(patientData);
      res.status(201).json(patient);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

// Get a patient by ID
router.get(
  '/:id',
  requireReceptionistOrAdmin,
  [
    param('id').isUUID().withMessage('Valid patient ID is required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const patient = await db.patients.getById(id);
      
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      res.json(patient);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch patient' });
    }
  },
);

// Update a patient
router.patch(
  '/:id',
  requireReceptionistOrAdmin,
  [
    param('id').isUUID().withMessage('Valid patient ID is required'),
    body('first_name').optional().trim().notEmpty(),
    body('last_name').optional().trim().notEmpty(),
    body('date_of_birth').optional().isISO8601(),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('phone').optional().isString(),
    body('email').optional().isEmail(),
    body('address').optional().isString(),
    body('city').optional().isString(),
    body('state').optional().isString(),
    body('zip_code').optional().isPostalCode('any'),
    body('insurance_provider').optional().isString(),
    body('insurance_policy_number').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Check if patient exists
      const existingPatient = await db.patients.getById(id);
      if (!existingPatient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      const updatedPatient = await db.patients.update(id, updates);
      res.json(updatedPatient);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

// List patients with pagination
router.get(
  '/',
  requireReceptionistOrAdmin,
  [
    param('page').optional().isInt({ min: 1 }).toInt(),
    param('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
    param('search').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = req.query.search as string | undefined;
      
      let query = db.supabase
        .from('patients')
        .select('*', { count: 'exact' });
      
      // Apply search filter if provided
      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
        );
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })
        .range(from, to);
      
      if (error) throw error;
      
      res.json({
        data,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch patients' });
    }
  },
);

export default router;
