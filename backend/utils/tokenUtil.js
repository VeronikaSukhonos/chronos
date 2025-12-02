import jwt from 'jsonwebtoken';

import config from '../config.js';

export const createAccessToken = (user) => {
  return jwt.sign(
    { id: user.id }, config.ACCESS_TOKEN_SECRET,
    { expiresIn: config.ACCESS_TOKEN_EXP_TIME }
  );
};

export const createRefreshToken = async (user, res) => {
  try {
    const refreshToken = jwt.sign(
      { id: user.id }, config.REFRESH_TOKEN_SECRET, 
      { expiresIn: config.REFRESH_TOKEN_EXP_TIME }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      maxAge: getExpTime(config.REFRESH_TOKEN_EXP_TIME),
      httpOnly: true, path: '/api/auth/refresh'
    });

    return refreshToken;
  } catch (err) {
    err.message = `Creating refresh token failed: ${err.message}`;
    throw err;
  }
};

export const createConfirmToken = async (user, email) => {
  try {
    const confirmToken = jwt.sign(
      { id: user.id }, config.CONFIRM_TOKEN_SECRET,
      { expiresIn: config.CONFIRM_TOKEN_EXP_TIME }
    );

    if (email) {
      user.pendingEmail = {
        email, token: confirmToken,
        expDate: new Date(Date.now() + getExpTime(config.CONFIRM_TOKEN_EXP_TIME))
      };
    } else {
      user.passwordToken = confirmToken;
    }
    await user.save();

    return confirmToken;
  } catch (err) {
    err.message = `Creating confirm token failed: ${err.message}`;
    throw err;
  }
};

export const createParticipationToken = async (user, calendarId, eventId) => {
  try {
    const token = jwt.sign({
      userId: user._id,
      calendarId: calendarId,
      eventId: eventId
    }, config.CONFIRM_TOKEN_SECRET, {
      expiresIn: config.CONFIRM_TOKEN_EXP_TIME
    });
    return token;
  } catch (err) {
    err.message = `Creating participation token failed: ${err.message}`;
    throw err;
  }
};

export const getExpTime = (t) => {
  const time = parseInt(t), unit = t.at(-1);

  if (!time || !['m', 'd'].includes(unit)) throw new Error('Invalid expire time');
  return unit === 'm' ? time * 60 * 1000 : time * 24 * 60 * 60 * 1000;
};
