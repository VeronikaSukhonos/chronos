import { configureStore } from '@reduxjs/toolkit';

import { setGetToken, setDispatch } from '../api/api.js';

import authReducer from './authSlice.js';

const store = configureStore({
  reducer: {
    auth: authReducer
  }
});

setGetToken(() => store.getState().auth.accessToken);
setDispatch(store.dispatch);

export default store;
