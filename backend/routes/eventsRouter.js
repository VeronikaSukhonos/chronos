import { Router } from 'express';
import { checkParticipationToken } from '../middlewares/tokenMiddleware.js';

import Events from '../controllers/eventsController.js';
import valid from '../middlewares/eventsValidMiddleware.js';

const router = Router();

router.post('/', valid.get, Events.getAll);
router.route('/:eventId')
  .get(Events.getOne)
  .patch(valid.update, Events.editOne)
  .delete(Events.deleteOne);
router.route('/:eventId/done')
  .post(Events.markDone)
  .delete(Events.markUndone);
router.get('/confirm/:confirmToken', checkParticipationToken, Events.viewParticipation);
router.post('/confirm/:confirmToken', checkParticipationToken, Events.confirmParticipation);
router.post('/:eventId/confirm', Events.sendParticipationMail);

export default router;
