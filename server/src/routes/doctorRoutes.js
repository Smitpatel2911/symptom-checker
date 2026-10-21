import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  listDoctors,
  listSpecialties,
  getDoctor,
  getSlots,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const doctorRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('specialty').trim().notEmpty().withMessage('Specialty is required'),
  body('experience').isInt({ min: 0, max: 60 }).withMessage('Experience must be 0-60 years'),
  body('fees').isFloat({ min: 0 }).withMessage('Fees must be 0 or more'),
];

// Any logged-in user can browse doctors
router.get('/', protect, listDoctors);
router.get('/specialties', protect, listSpecialties);
router.get(
  '/:id/slots',
  protect,
  param('id').isMongoId().withMessage('Invalid doctor id'),
  query('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
  validate,
  getSlots
);
router.get('/:id', protect, param('id').isMongoId().withMessage('Invalid doctor id'), validate, getDoctor);

// Admin only
router.post('/', protect, authorize('admin'), doctorRules, validate, createDoctor);
router.put(
  '/:id',
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid doctor id'),
  validate,
  updateDoctor
);
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('Invalid doctor id'),
  validate,
  deleteDoctor
);

export default router;
