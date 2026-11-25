import { Router } from 'express';
import { createStock, listStock, updateStock } from '../controllers/inventory.controller.js';
import { requireOwner, requireSession } from '../middleware/auth.middleware.js';

// /api/stock — raw materials. Everyone logged in can see them; only the Owner changes them.
const router = Router();
const ownerOnly = requireOwner('Hanya Owner yang boleh mengubah stok.');

router.get('/', requireSession, listStock);
router.post('/', ownerOnly, createStock);
router.put('/:id', ownerOnly, updateStock);

export default router;
