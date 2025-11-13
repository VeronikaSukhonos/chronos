import { Router } from 'express';

import Auth from '../controllers/authController.js';
import {
  isAuth, checkRefreshToken, checkConfirmToken
} from '../middlewares/tokenMiddleware.js';
import valid from '../middlewares/usersValidMiddleware.js';

const router = Router();

router.post('/register', valid.register, Auth.register);
router.post('/login', valid.login, Auth.login);
router.post('/logout', isAuth, Auth.logout);
router.post('/refresh', checkRefreshToken, Auth.refresh);

router.post('/email-confirmation',
  valid.emailConfirmation, Auth.emailConfirmation
);
router.post('/email-confirmation/:confirmToken',
  checkConfirmToken, Auth.confirmEmailConfirmation
);
router.post('/password-reset',
  valid.passwordReset, Auth.passwordReset
);
router.post('/password-reset/:confirmToken',
  checkConfirmToken, valid.confirmPasswordReset, Auth.confirmPasswordReset
);

export default router;
