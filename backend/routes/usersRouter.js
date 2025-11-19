import { Router } from 'express';
import multer from 'multer';
import path from 'path';

import Users from '../controllers/usersController.js';
import valid from '../middlewares/usersValidMiddleware.js';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join('db', 'avatars'));
    },
    filename: (req, file, cb) => {
      cb(null, `avatar-${req.user.id}` +
        path.extname(file.originalname).toLowerCase()
      );
    }
  }),
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png')
      return cb(null, true);
    return cb(new multer.MulterError('LIMIT_FILE_TYPE'), false);
  }
});

router.route('/')
  .get(Users.getAllUsers)
  .patch(valid.updateUserProfile, Users.updateUserProfile)
  .post(valid.deleteUserProfile, Users.deleteUserProfile);

router.route('/avatar')
  .patch(upload.single('avatar'), Users.uploadUserAvatar)
  .delete(Users.deleteUserAvatar);

router.patch('/email', valid.updateUserEmail, Users.updateUserEmail);
router.patch('/password', valid.updateUserPassword, Users.updateUserPassword);

router.get('/:userId', Users.getUserData);

export default router;
