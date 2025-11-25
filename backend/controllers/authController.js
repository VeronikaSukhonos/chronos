import User from '../models/userModel.js';
import { UserDto } from '../dtos/userDto.js';
import Calendar from '../models/calendarModel.js';
import { createAccessToken, createRefreshToken } from '../utils/tokenUtil.js';
import { sendEmailConfirmation, sendPasswordReset } from '../utils/emailUtil.js';

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
      if (await User.findOne().byEmailOrPendingEmail(email)) {
        return res.status(409).json({
          message: 'Unavailable email',
          errors: [{ param: 'email', error: 'Unavailable email. Please try another' }]
        });
      }
      const user = await User.create({ login, email, password });

      const calendars = (await Calendar.create([
        { authorId: user.id, name: 'Main', type: 'main' },
        { authorId: user.id, name: 'Holidays', type: 'holidays' }
      ])).map(c => c._id);

      user.visibilitySettings = {
        calendars, eventTypes: ['arrangement', 'reminder', 'task', 'holiday', 'birthday'], tags: []
      };
      await user.save();
      await sendEmailConfirmation(user, email);

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
      const user = await User.findOne()
        .byLoginOrEmail(login).select('+password +email +isConfirmed');

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

  async emailConfirmation(req, res) {
    try {
      const { login, email } = req.body;
      const user = await User.findOne({ login }).select('+isConfirmed');

      if (!user || user.isConfirmed)
        return res.status(404).json({ message: 'Unconfirmed user with this login is not found' });
      if (await User.findOne().byEmailOrPendingEmail(email).and({ _id: { $ne: user.id } })) {
        return res.status(409).json({
          message: 'Unavailable email',
          errors: [{ param: 'email', error: 'Unavailable email. Please try another' }]
        });
      }
      await sendEmailConfirmation(user, email || user.email);

      return res.status(200).json({
        message: 'Email confirmation link has been sent. Please check your email to confirm it'
      });
    } catch (err) {
      err.message = `Email confirmation request failed: ${err.message}`;
      throw err;
    }
  }

  async confirmEmailConfirmation(req, res) {
    try {
      const user = req.user;

      user.email = user.pendingEmail.email;
      user.isConfirmed = true;
      await user.save();
      await User.updateOne({ _id: user.id }, { $unset: { pendingEmail: '' } });

      return res.status(200).json({
        message: 'Email has been confirmed successfully',
        data: { email: user.email }
      });
    } catch (err) {
      err.message = `Confirming email failed: ${err.message}`;
      throw err;
    }
  }

  async passwordReset(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email }).select('+email +isConfirmed');

      if (!user) return res.status(404).json({
        message: 'User with this email is not found'
      });
      if (!user.isConfirmed) {
        return res.status(403).json({
          message: 'Email is not confirmed. Please confirm your email first'
        });
      }
      await sendPasswordReset(user);

      return res.status(200).json({
        message: 'Password reset link has been sent. Please check your email'
      });
    } catch (err) {
      err.message = `Password reset request failed: ${err.message}`;
      throw err;
    }
  }

  async confirmPasswordReset(req, res) {
    try {
      const { password } = req.body, user = req.user;

      user.password = password;
      await user.save();
      await User.updateOne({ _id: user.id }, { $unset: { passwordToken: '' } });

      return res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (err) {
      err.message = `Resetting password failed: ${err.message}`;
      throw err;
    }
  }
}

export default new Auth;
