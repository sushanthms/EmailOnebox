import { Router } from 'express';
import { AccountController } from '../controllers/AccountController';

const router = Router();
const controller = new AccountController();

router.post('/', (req, res) => controller.addAccount(req, res));
router.get('/', (req, res) => controller.getAccounts(req, res));
router.get('/:id', (req, res) => controller.getAccount(req, res));
router.delete('/:id', (req, res) => controller.deleteAccount(req, res));

export default router;

// ========