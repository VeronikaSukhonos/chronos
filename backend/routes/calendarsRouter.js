import { Router } from 'express';

import Calendars from '../controllers/calendarsController.js';
import calendarsValidation from '../middlewares/calendarsValidMiddleware.js';
import eventsValidation from '../middlewares/eventsValidMiddleware.js';

const router = Router();

router.route('/')
  .get(Calendars.getAll)
  .post(calendarsValidation.create, Calendars.createOne);
router.route('/:calendarId')
  .get(Calendars.getOne)
  .patch(calendarsValidation.update, Calendars.editOne)
  .delete(Calendars.deleteOne);
router.post('/:calendarId/events', eventsValidation.create, Calendars.createEvent);
router.post('/:calendarId/confirm', Calendars.sendParticipationMail);
router.post('/:calendarId/follow', Calendars.follow);
router.post('/:calendarId/confirm/:confirmToken', Calendars.confirmParticipation);

export default router;
