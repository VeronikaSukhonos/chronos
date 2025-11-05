const express = require('express');
const controller = require('../controllers/test');

const router = express.Router();

router.route('/')
  .get(controller.getAll)
  .post(controller.createOne);
router.route('/:test')
  .get(controller.getOne)
  .patch(controller.updateOne)
  .delete(controller.deleteOne);

module.exports = router;

