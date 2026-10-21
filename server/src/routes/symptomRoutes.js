import { Router } from 'express';
import { body } from 'express-validator';
import { analyze, history, listSymptoms } from '../controllers/symptomController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect);

router.get('/list', listSymptoms);
router.get('/history', history);
router.post(
  '/analyze',
  body('symptoms').optional().isArray({ max: 25 }).withMessage('symptoms must be an array (max 25)'),
  body('symptoms.*').isString().trim().isLength({ max: 50 }),
  body('freeText').optional({ nullable: true }).isString().isLength({ max: 500 }).withMessage('Description is too long'),
  body('age').optional({ nullable: true }).isInt({ min: 0, max: 120 }).withMessage('Age must be 0-120'),
  body('gender').optional({ nullable: true }).isString().isLength({ max: 20 }),
  validate,
  analyze
);

export default router;
