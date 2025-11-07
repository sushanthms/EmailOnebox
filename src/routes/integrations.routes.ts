import { Router } from 'express';
import { IntegrationController } from '../controllers/IntegrationController';

const router = Router();
const controller = new IntegrationController();

// Slack routes
router.get('/slack/status', (req, res) => controller.getSlackStatus(req, res));
router.post('/slack/test', (req, res) => controller.testSlackNotification(req, res));

// Webhook routes
router.get('/webhook/status', (req, res) => controller.getWebhookStatus(req, res));
router.post('/webhook/url', (req, res) => controller.updateWebhookUrl(req, res));
router.post('/webhook/test', (req, res) => controller.testWebhook(req, res));

export default router;