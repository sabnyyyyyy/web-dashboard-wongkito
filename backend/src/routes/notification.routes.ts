import { Router } from 'express';
import { listNotifications } from '../controllers/notification.controller.js';
import { requireSession } from '../middleware/auth.middleware.js';

// /api/notifications
const router = Router();

router.get('/', requireSession, listNotifications);

export default router;
