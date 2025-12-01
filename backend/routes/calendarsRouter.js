import { Router } from 'express';
import { checkParticipationToken } from '../middlewares/tokenMiddleware.js';

import Calendars from '../controllers/calendarsController.js';
import calendarsValidation from '../middlewares/calendarsValidMiddleware.js';
import eventsValidation from '../middlewares/eventsValidMiddleware.js';

const router = Router();

router.route('/')
  .get(Calendars.getAll)
  .post(calendarsValidation.create, Calendars.createOne);
router.get('/hidden', Calendars.getHidden);
router.route('/:calendarId')
  .get(Calendars.getOne)
  .patch(calendarsValidation.update, Calendars.editOne)
  .delete(Calendars.deleteOne);
router.get('/confirm/:confirmToken', checkParticipationToken, Calendars.viewParticipation);
router.post('/confirm/:confirmToken', checkParticipationToken, Calendars.confirmParticipation);
router.post('/:calendarId/events', eventsValidation.create, Calendars.createEvent);
router.post('/:calendarId/confirm', Calendars.sendParticipationMail);
router.post('/:calendarId/follow', Calendars.follow);
router.post('/:calendarId/archive', Calendars.archive);
router.delete('/:calendarId/archive', Calendars.dearchive);

export default router;
