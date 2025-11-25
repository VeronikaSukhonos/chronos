import api from './api.js';

class Users {
  async fetchUsers(queryParams) {
    return await api.get(`/users${queryParams}`);
  }

  async updateProfile(params) {
    return await api.patch(`/users`, params);
  }

  async deleteProfile(params) {
    return await api.post(`/users`, params);
  }

  async fetchUser(userId) {
    return await api.get(`/users/${userId}`);
  }

  async uploadAvatar(fd) {
    return await api.patch(`/users/avatar`, fd, {
      headers: { ...api.defaults.headers, 'Content-Type': 'multipart/form-data' }
    });
  }

  async deleteAvatar() {
    return await api.delete(`/users/avatar`);
  }

  async updateEmail(params) {
    return await api.patch(`/users/email`, params);
  }

  async updatePassword(params) {
    return await api.patch(`/users/password`, params);
  }

  async fetchVisibilitySettings() {
    return await api.get(`/users/visibility-settings`);
  }
}

export default new Users;
