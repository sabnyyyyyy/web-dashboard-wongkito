import { Router } from 'express';
import { createMenu, deleteMenu, listMenu, updateMenu } from '../controllers/menu.controller.js';
import { requireOwner, requireSession } from '../middleware/auth.middleware.js';

// /api/menu — every logged-in staff reads it (the POS needs it); only the Owner changes it.
const router = Router();
const ownerOnly = requireOwner('Hanya Owner yang boleh mengubah menu.');

router.get('/', requireSession, listMenu);
router.post('/', ownerOnly, createMenu);
router.put('/:id', ownerOnly, updateMenu);
router.delete('/:id', ownerOnly, deleteMenu);

export default router;
