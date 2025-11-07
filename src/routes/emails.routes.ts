import { Router } from 'express';
import { EmailController } from '../controllers/EmailController';

const router = Router();
const controller = new EmailController();

router.get('/search', (req, res) => controller.searchEmails(req, res));
router.get('/category/:category', (req, res) => controller.getEmailsByCategory(req, res));
router.get('/folder/:folder', (req, res) => controller.getEmailsByFolder(req, res));
router.get('/:id', (req, res) => controller.getEmailById(req, res));

export default router;