import api from './api.js';

class Auth {
  async register(params) {
    return await api.post(`/auth/register`, params);
  }

  async login(params) {
    return await api.post(`/auth/login`, params);
  }

  async logout() {
    return await api.post(`/auth/logout`);
  }

  async refresh() {
    return await api.post('/auth/refresh');
  }

  async passwordResetRequest(params) {
    return await api.post(`/auth/password-reset`, params);
  }

  async passwordResetConfirm(params, confirmToken) {
    return await api.post(`/auth/password-reset/${confirmToken}`, params);
  }

  async emailConfirmationRequest(params) {
    return await api.post(`/auth/email-confirmation`, params);
  }

  async emailConfirmationConfirm(confirmToken) {
    return await api.post(`/auth/email-confirmation/${confirmToken}`);
  }
}

export default new Auth;
