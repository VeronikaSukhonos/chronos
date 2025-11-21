import { CastError } from 'mongoose';

import User from '../models/userModel.js';
import { UserDto } from '../dtos/userDto.js';
import Calendar from '../models/calendarModel.js';
import Event from '../models/eventModel.js';
import Tag from '../models/tagModel.js';
import { sendEmailConfirmation } from '../utils/emailUtil.js';

const limit = 10;

class Users {
  async getAllUsers(req, res) {
    try {
      const filter = {};

      filter.login = ((Array.isArray(req.query.login)
        ? req.query.login[0] : req.query.login) || '').trim().toLowerCase();

      const user = await User.findOne({ email: filter.login }).select('+email');
      const users = user ? [user]
        : await User.find(
            filter.login ? { login: { $regex: filter.login.replace(/[^a-z0-9]/g, '') }}: {})
          .limit(limit);

      return res.status(200).json({
        message: users.length !== 0 ? 'Fetched users successfully' : 'No users found',
        data: { users, limit, filter}
      });
    } catch (err) {
      err.message = `Getting users failed: ${err.message}`;
      throw err;
    }
  }

  async updateUserProfile(req, res) {
    try {
      const { login, fullName, dob } = req.body;
      const user = req.user;

      if (login) {
        if (await User.findOne({ login, _id: { $ne: user.id }})) {
          return res.status(409).json({
            message: 'Unavailable login',
            errors: [{ param: 'login', error: 'Unavailable login. Please try another' }]
          });
        }
        user.login = login;
      }
      if (user.fullName || fullName) user.fullName = fullName;
      if (user.dob || dob) user.dob = dob;

      if (user.isModified()) await user.save();
      else return res.status(200).json({ message: 'Nothing has changed' });

      if (user.fullName == '') {
        await User.updateOne({ _id: req.user.id }, { $unset: { fullName: '' } });
        user.fullName = undefined;
      }
      if (user.dob == null) {
        await User.updateOne({ _id: req.user.id }, { $unset: { dob: '' } });
        user.dob = undefined;
      }

      return res.status(200).json({
        message: 'Updated profile successully',
        data: { user: new UserDto(user) }
      });
    } catch (err) {
      err.message = `Updating profile failed: ${err.message}`;
      throw err;
    }
  }

  async deleteUserProfile(req, res) {
    try {
      const { password } = req.body;
      const user = req.user;

      if (!await user.checkPassword(password))
        return res.status(401).json({
          message: 'Invalid password',
          errors: [{ param: 'password', error: 'Invalid password' }]
        });

      await Calendar.deleteMany({ authorId: user.id });
      await Event.deleteMany({ authorId: user.id });
      await Tag.deleteMany({ authorId: user.id });
      // TODO delete user from all participants and followers
      await user.deleteAvatar();
      await User.deleteOne({ _id: user.id });

      return res.status(200).json({ message: 'Deleted profile successfully' });
    } catch (err) {
      err.message = `Deleting profile failed: ${err.message}`;
      throw err;
    }
  }

  async getUserData(req, res) {
    try {
      const userId = req.params.userId;
      const user = await User.findOne({ _id: userId }).select(
        userId === req.user.id ? '+email' : ''
      );

      if (!user) return res.status(404).json({ message: 'User is not found' });

      return res.status(200).json({
        message: 'Fetched user data successfully',
        data: { user: new UserDto(user) }
      });
    } catch (err) {
      if (err instanceof CastError)
        return res.status(404).json({ message: 'User is not found' });
      err.message = `Getting user data failed: ${err.message}`;
      throw err;
    }
  }

  async uploadUserAvatar(req, res) {
    try {
      const user = req.user;

      if (!req.file)
        return res.status(400).json({ message: 'Avatar is not found' });

      user.avatar = req.file.filename;
      await user.save();

      return res.status(200).json({
        message: 'Uploaded avatar successfully',
        data: { avatar: `${user.avatar}?t=${Date.now()}` }
      });
    } catch (err) {
      err.message = `Uploading avatar failed: ${err.message}`;
      throw err;
    }
  }

  async deleteUserAvatar(req, res) {
    try {
      const user = req.user;

      await user.deleteAvatar();

      return res.status(200).json({
        message: 'Deleted avatar successfully',
        data: { avatar: `${user.avatar}` }
      });
    } catch (err) {
      err.message = `Deleting avatar failed: ${err.message}`;
      throw err;
    }
  }

  async updateUserEmail(req, res) {
    try {
      const { password, email } = req.body;
      const user = req.user;

      if (!await user.checkPassword(password))
        return res.status(401).json({
          message: 'Invalid password',
          errors: [{ param: 'password', error: 'Invalid password' }]
        });
      if (email === user.email)
        return res.status(200).json({ message: 'Nothing has changed' });
      if (await User.findOne().byEmailOrPendingEmail(email).and({ _id: { $ne: user.id } })) {
        return res.status(409).json({
          message: 'Unavailable email',
          errors: [{ param: 'email', error: 'Unavailable email. Please try another' }]
        });
      }

      await sendEmailConfirmation(user, email);

      return res.status(200).json({
        message: 'Email confirmation link has been sent. Please check your new email to confirm it',
        data: { email: user.email }
      });
    } catch (err) {
      err.message = `Updating email failed: ${err.message}`;
      throw err;
    }
  }

  async updateUserPassword(req, res) {
    try {
      const { curPassword, password } = req.body;
      const user = req.user;

      if (!await user.checkPassword(curPassword))
        return res.status(401).json({
          message: 'Invalid current password',
          errors: [{ param: 'curPassword', error: 'Invalid current password' }]
        });

      user.password = password;
      await user.save();

      return res.status(200).json({ message: 'Updated password successully' });
    } catch (err) {
      err.message = `Updating password failed: ${err.message}`;
      throw err;
    }
  }
}

export default new Users;
