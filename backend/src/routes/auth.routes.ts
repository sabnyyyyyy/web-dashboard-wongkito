import { Router } from 'express';
import { changePassword, login, logout, me, updateMe } from '../controllers/auth.controller.js';
import { requireSession } from '../middleware/auth.middleware.js';

// /api/auth
const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);
router.patch('/me', requireSession, updateMe);
router.post('/password', requireSession, changePassword);

export default router;
