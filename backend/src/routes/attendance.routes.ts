import { Router } from 'express';
import { checkIn, checkOut, listAttendance, todayAttendance } from '../controllers/attendance.controller.js';
import { requireSession } from '../middleware/auth.middleware.js';

// /api/attendance — kasir see their own attendance, the Owner sees everyone's.
const router = Router();

router.use(requireSession);
router.get('/', listAttendance);
router.get('/today', todayAttendance);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);

export default router;
