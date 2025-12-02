import { Router } from 'express';

import Events from '../controllers/eventsController.js';
import valid from '../middlewares/eventsValidMiddleware.js';

const router = Router();

router.post('/', valid.get, Events.getAll)
router.route('/:eventId')
  .get(Events.getOne)
  .patch(valid.update, Events.editOne)
  .delete(Events.deleteOne);
router.route('/:eventId/done')
  .post(Events.markDone)
  .delete(Events.markUndone);

export default router;
