import User from '../models/userModel.js';
import { UserDto } from '../dtos/userDto.js';
import { createAccessToken, createRefreshToken } from '../utils/tokenUtil.js';
// import Email from '../utils/emailUtil.js';

class Auth {
  async register(req, res) {
    try {
      const { login, email, password } = req.body;

      if (await User.findOne({ login })) {
        return res.status(409).json({
          message: 'Unavailable login',
          errors: [{ param: 'login', error: 'Unavailable login. Please try another' }]
        });
      }
      if (await User.findOne().or(
        [{ email }, { 'pendingEmail.email': email, 'pendingEmail.expireDate': { $lt: new Date() } }]
      )) {
        return res.status(409).json({
          message: 'Unavailable email',
          errors: [{ param: 'email', error: 'Unavailable email. Please try another' }]
        });
      }
      const user = await User.create({ login, email, password });

      // await Email.sendEmailConfirmation(user, email);
      // TODO create main calendar
      return res.status(201).json({
        message: 'Registered successfully. Please check your email to confirm it',
        data: { user: new UserDto(user) }
      });
    } catch (err) {
      err.message = `Registration failed: ${err.message}`;
      throw err;
    }
  }

  async login(req, res) {
    try {
      const { login, password } = req.body;
      const user = await User.findOne().byLoginOrEmail(login).select('+password +email +isConfirmed');

      if (!user || !await user.checkPassword(password))
        return res.status(401).json({ message: 'Invalid credentials' });
      if (!user.isConfirmed) {
        return res.status(403).json({
          message: 'Email is not confirmed. Please confirm your email first'
        });
      }

      await createRefreshToken(user, res);
      return res.status(200).json({
        message: 'Logged in successfully',
        data: { user: new UserDto(user), accessToken: createAccessToken(user) }
      });
    } catch (err) {
      err.message = `Login failed: ${err.message}`;
      throw err;
    }
  }

  async logout(req, res) {
    try {
      await User.updateOne({ _id: req.user.id }, { $unset: { refreshToken: '' } });
      res.clearCookie('refreshToken', { httpOnly: true, path: '/api/auth/refresh' });

      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      err.message = `Logout failed: ${err.message}`;
      throw err;
    }
  }

  async refresh(req, res) {
    try {
      await createRefreshToken(req.user, res);
      return res.status(200).json({
        message: 'Refreshed tokens successfully',
        data: { user: new UserDto(req.user), accessToken: createAccessToken(req.user) }
      });
    } catch (err) {
      err.message = `Refreshing tokens failed: ${err.message}`;
      throw err;
    }
  }
}

export default new Auth;
