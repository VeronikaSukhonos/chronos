import axios from 'axios';

import { setCredentials } from '../store/authSlice.js';
import apiConfig from './apiConfig.js';

const API_URL = import.meta.env.VITE_API_URL;
const timeout = 7000;

let getToken = null;
let dispatch = null;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: timeout
});

api.interceptors.request.use((config) => {
  const accessToken = getToken();

  if (accessToken)
    config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
}, (err) => {
  return Promise.reject(err);
});

api.interceptors.response.use(async (res) => {
  return res;
}, async (err) => {
  if (err.response) {
    const originalReq = err.config;

    if (err.response.status === 401 && originalReq
      && originalReq.url !== '/auth/login' && originalReq.url !== '/auth/refresh'
      && !originalReq.retry) {
      originalReq.retry = true;
      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
          timeout: timeout
        });
        const { user, accessToken } = response.data.data;

        dispatch(setCredentials({ user, accessToken }));
        return api.request(originalReq);
      } catch (_) {
        dispatch(setCredentials());
        return Promise.reject({ message: apiConfig.error.IRT });
      }
    } else if (err.response.data.errors) {
      const errors = {};

      for (const e of err.response.data.errors) {
        if (e.param) errors[e.param] = e.error;
        else err.response.data.message = e.error;
      }
      err.errors = Object.keys(errors).length ? errors : undefined;
    }
    err.message = err.response.data.message;
  } else if (err.request) {
    err.message = apiConfig.error.SNR;
  } else {
    err.message = apiConfig.error.SWW;
  }
  return Promise.reject(err);
});

export const setGetToken = (f) => { getToken = f; };
export const setDispatch = (f) => { dispatch = f; };

export default api;
