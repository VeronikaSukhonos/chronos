import { Router } from 'express';

import Events from '../controllers/eventsController.js';
import valid from '../middlewares/eventsValidMiddleware.js';

const router = Router();

router.get('/', Events.getAll)
router.route('/:eventId')
  .get(Events.getOne)
  .patch(valid.update, Events.updateOne)
  .delete(Events.deleteOne);
router.get('/:eventId/participants', Events.getParticipants)
router.route('/:eventId/done')
  .post(Events.markDone)
  .delete(Events.markUndone);

export default router;
