import { Router } from 'express';
import { createOrder, listOrders, updateOrderStatus } from '../controllers/order.controller.js';
import { requireSession } from '../middleware/auth.middleware.js';

// /api/orders — POS checkout and the kitchen flow (cancelling is checked for Owner in the controller).
const router = Router();

router.use(requireSession);
router.get('/', listOrders);
router.post('/', createOrder);
router.patch('/:id', updateOrderStatus);

export default router;
