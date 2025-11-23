import { Router } from 'express';

import Tags from '../controllers/tagsController.js';
import valid from '../middlewares/tagsValidMiddleware.js';

const router = Router();

router.route('/')
  .get(Tags.getAll)
  .post(valid, Tags.createOne);
router.route('/:tagId')
  .patch(valid, Tags.updateOne)
  .delete(Tags.deleteOne);

export default router;
