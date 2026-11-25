import { Router } from 'express';
import { getSummary } from '../controllers/dashboard.controller.js';
import { requireSession } from '../middleware/auth.middleware.js';

// /api/dashboard — sales figures for the dashboard and reports pages.
const router = Router();

router.get('/summary', requireSession, getSummary);

export default router;
