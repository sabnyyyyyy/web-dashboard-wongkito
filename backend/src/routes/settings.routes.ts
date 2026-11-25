import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { requireOwner, requireSession } from '../middleware/auth.middleware.js';

// /api/settings — everyone logged in reads them (receipts, POS tax); only the Owner changes them.
const router = Router();

router.get('/', requireSession, getSettings);
router.put('/', requireOwner('Hanya Owner yang boleh mengubah pengaturan toko.'), updateSettings);

export default router;
