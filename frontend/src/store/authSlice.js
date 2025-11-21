import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
  avatarLoad: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload?.user || null;
      state.accessToken = action.payload?.accessToken || null;
    },
    updateAuthUser: (state, action) => {
      if (state.user) {
        for (const [prop, val] of Object.entries(action.payload))
          state.user[prop] = val;
      }
    },
    setAvatarLoad: (state, action) => {
      state.avatarLoad = action.payload;
    }
  }
});

export const { setCredentials, updateAuthUser, setAvatarLoad } = authSlice.actions;

export default authSlice.reducer;

export const selectAuthUser = {
  user: (state) => state.auth.user,
  accessToken: (state) => state.auth.accessToken,
  avatarLoad: (state) => state.auth.avatarLoad
};
