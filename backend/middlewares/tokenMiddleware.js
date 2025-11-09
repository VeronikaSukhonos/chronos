import jwt from 'jsonwebtoken';

import User from '../models/userModel.js';
import config from '../config.js';

export const isAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader)
    return res.status(401).json({ message: 'Authorization header is missing' });
  const accessToken = authHeader.startsWith('Bearer') && authHeader.split(' ')[1];

  if (!accessToken)
    return res.status(401).json({ message: 'Bearer access token is missing' });
  jwt.verify(accessToken, config.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) return res.status(401).json({
      message: 'Invalid or expired access token. Please log in or request a new one'
    });

    user = await User.findOne({ _id: user.id });
    if (!user) return res.status(401).json({ message: 'User is not found' });

    req.user = user;
    next();
  });
};

export const checkRefreshToken = (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken)
    return res.status(401).json({ message: 'Refresh token is missing' });
  jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET, async (err, user) => {
    if (err)
      return res.status(401).json({ message: 'Invalid or expired refresh token. Please log in' });

    user = await User.findOne({ _id: user.id }).select('+refreshToken');
    if (!user) return res.status(401).json({ message: 'User is not found' });

    if (user.refreshToken !== refreshToken)
      return res.status(401).json({ message: 'Invalid or expired refresh token. Please log in' });

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
    if (err) return res.status(400).json({
      message: 'Invalid or expired confirm token. Please request a new one'
    });
    // user = await User.findOne({ _id: user.id });
    // if (!user) return res.status(401).json({ message: 'User is not found' });
    req.user = user;
    next();
  });
};
