import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createAppointment,
  myAppointments,
  cancelAppointment,
  allAppointments,
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.post(
  '/',
  body('doctorId').isMongoId().withMessage('Valid doctorId is required'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
  body('timeSlot').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('timeSlot must be HH:mm'),
  body('symptomLogId').optional({ nullable: true }).isMongoId().withMessage('Invalid symptomLogId'),
  body('notes').optional().isString().isLength({ max: 300 }),
  validate,
  createAppointment
);

router.get('/my', myAppointments);
router.patch('/:id/cancel', param('id').isMongoId().withMessage('Invalid appointment id'), validate, cancelAppointment);

// Admin
router.get('/', authorize('admin'), allAppointments);

export default router;
