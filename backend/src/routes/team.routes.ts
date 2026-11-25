import { Router } from 'express';
import { createKasir, listKasir, resetKasirPassword, updateKasir } from '../controllers/team.controller.js';
import { requireOwner } from '../middleware/auth.middleware.js';

// /api/accounts — kasir accounts, Owner only.
const router = Router();

router.use(requireOwner('Hanya Owner yang boleh mengelola akun.'));
router.get('/', listKasir);
router.post('/', createKasir);
router.patch('/:loginId', updateKasir);
router.post('/:loginId/reset-password', resetKasirPassword);

export default router;
