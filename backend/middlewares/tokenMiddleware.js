import jwt from 'jsonwebtoken';

import User from '../models/userModel.js';
import Calendar from '../models/calendarModel.js';
import Event from '../models/eventModel.js';
import config from '../config.js';

export const isAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader)
    return res.status(401).json({ message: 'Authorization header is missing' });
  const accessToken = authHeader.startsWith('Bearer') && authHeader.split(' ')[1];

  if (!accessToken)
    return res.status(401).json({ message: 'Bearer access token is missing' });
  jwt.verify(accessToken, config.ACCESS_TOKEN_SECRET, async (err, user) => {
    const message = 'Invalid or expired access token. Please log in or request a new one';

    if (err) return res.status(401).json({ message });

    user = await User.findOne({ _id: user.id }).select('+email +password');
    if (!user) return res.status(401).json({ message });

    req.user = user;
    next();
  });
};

export const checkRefreshToken = (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken)
    return res.status(401).json({ message: 'Refresh token is missing' });
  jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, async (err, user) => {
    const message = 'Invalid or expired refresh token. Please log in';

    if (err) return res.status(401).json({ message });

    user = await User.findOne({ _id: user.id }).select('+email +refreshToken');
    if (!user || user.refreshToken !== refreshToken) return res.status(401).json({ message });

    req.user = user;
    next();
  });
};

export const checkConfirmToken = (req, res, next) => {
  const { confirmToken } = req.params;

  if (!confirmToken)
    return res.status(400).json({
      message: 'Confirm token is missing. Please use the link sent to your email'
    });
  jwt.verify(confirmToken, config.CONFIRM_TOKEN_SECRET, async (err, user) => {
    const message = 'Invalid or expired confirm token. Please request a new one';

    if (err) return res.status(400).json({ message });

    user = await User.findOne({ _id: user.id }).select('+pendingEmail +passwordToken');
    if ((req.path.includes('email-confirmation') && (!user || user.pendingEmail?.token !== confirmToken))
      || (req.path.includes('password-reset') && (!user || user.passwordToken !== confirmToken)))
      return res.status(400).json({ message });

    if (!req.user) req.user = user;
    else if (req.user !== user) return res.status(400).json({ message });
  
    next();
  });
};

export const checkParticipationToken = (req, res, next) => {
  const { confirmToken } = req.params;

  if (!confirmToken)
    return res.status(400).json({
      message: 'Participation token is missing. Please use the link sent to your email'
    });
  jwt.verify(confirmToken, config.CONFIRM_TOKEN_SECRET, async (err, data) => {
    const calendar = req.originalUrl.includes('calendars');
    const message = 'Invalid or expired participation token. '
      + `Please ask an author of the ${calendar ? 'calendar' : 'event'} to send you a new one`;

    if (err) return res.status(400).json({ message });

    if ((req.path.includes('confirm') && (!data || req.user._id.toString() !== data.userId.toString())))
      return res.status(400).json({ message });

    if (calendar && !(await Calendar.findOne({
      participants: { $elemMatch: { participantId: req.user._id, isConfirmed: confirmToken }}
    }))) return res.status(400).json({ message });
    
    if (!calendar && !(await Event.findOne({
      participants: { $elemMatch: { participantId: req.user._id, isConfirmed: confirmToken }}
    }))) return res.status(400).json({ message });

    req.calendarId = data.calendarId;
    req.eventId = data.eventId;
    next();
  });
};
