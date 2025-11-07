import { Router } from 'express';
import { SyncController } from '../controllers/SyncController';

const router = Router();
const controller = new SyncController();

router.post('/start', (req, res) => controller.startSync(req, res));
router.post('/start-all', (req, res) => controller.startAllSyncs(req, res));
router.post('/stop', (req, res) => controller.stopSync(req, res));
router.get('/status', (req, res) => controller.getSyncStatus(req, res));

export default router;
