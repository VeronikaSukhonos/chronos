// import fsPromises from 'fs/promises';
// import path from 'path';

const keys = [
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'ACCESS_TOKEN_SECRET',
  'ACCESS_TOKEN_EXP_TIME',
  'REFRESH_TOKEN_SECRET',
  'REFRESH_TOKEN_EXP_TIME',
  'CONFIRM_TOKEN_SECRET',
  'CONFIRM_TOKEN_EXP_TIME',
  'IP_API_KEY',
  // 'HOLIDAYS_API_KEY'
];

const config = {};

for (let key of keys) {
  //if (process.env.NODE_ENV == 'development')
    config[key] = process.env[key];
  // else if (process.env.NODE_ENV == 'production') {
  //   const secretPath = path.join('run', 'secrets', key);
  //   fsPromises.readFile(secretPath, { encoding: 'utf8' })
  //     .then(value => {config[key] = value;})
  //     .catch(err => {console.error(`Cannot get secret value ${key}:\n`, err)});
  // }
}

export default {
  EMAIL_HOST: config.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: config.EMAIL_PORT || 465,
  EMAIL_USER: config.EMAIL_USER || 'yourmail@gmail.com',
  EMAIL_PASSWORD: config.EMAIL_PASSWORD || 'yourpassword',

  ACCESS_TOKEN_SECRET: config.ACCESS_TOKEN_SECRET || 'access_supersecret',
  ACCESS_TOKEN_EXP_TIME: config.ACCESS_TOKEN_EXP_TIME || '15m',
  REFRESH_TOKEN_SECRET: config.REFRESH_TOKEN_SECRET || 'refresh_supersecret',
  REFRESH_TOKEN_EXP_TIME: config.REFRESH_TOKEN_EXP_TIME || '30d',
  CONFIRM_TOKEN_SECRET: config.CONFIRM_TOKEN_SECRET || 'confirm_supersecret',
  CONFIRM_TOKEN_EXP_TIME: config.CONFIRM_TOKEN_EXP_TIME || '15m',

  IP_API_KEY: config.IP_API_KEY || 'yourapikey',
};
