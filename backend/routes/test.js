import { Router } from 'express';
import { getAll, createOne, getOne, updateOne, deleteOne } from '../controllers/test';

const router = Router();

router.route('/')
  .get(getAll)
  .post(createOne);
router.route('/:test')
  .get(getOne)
  .patch(updateOne)
  .delete(deleteOne);

export default router;
