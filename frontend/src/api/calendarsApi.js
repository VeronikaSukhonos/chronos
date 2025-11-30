import api from './api.js';

class Calendars {
  async fetchCalendars(queryParams = '') {
    return await api.get(`/calendars${queryParams}`);
  }

  async fetchHiddenCalendars() {
    return await api.get(`/calendars/hidden`);
  }

  async fetchCalendar(calendarId) {
    return await api.get(`/calendars/${calendarId}`);
  }

  async createCalendar(params) {
    return await api.post(`/calendars`, params);
  }

  async updateCalendar(calendarId, params) {
    return await api.patch(`/calendars/${calendarId}`, params);
  }

  async archiveCalendar(calendarId, params) {
    return await api.post(`/calendars/${calendarId}/archive`, params);
  }

  async dearchiveCalendar(calendarId, params) {
    return await api.delete(`/calendars/${calendarId}/archive`, params);
  }

  async deleteCalendar(calendarId) {
    return await api.delete(`/calendars/${calendarId}`);
  }

  async resendParticipation(calendarId, params) {
    return await api.post(`/calendars/${calendarId}/confirm`, params);
  }

  async confirmParticipation(calendarId, confirmToken) {
    return await api.post(`/calendars/${calendarId}/confirm/${confirmToken}`);
  }

  async followCalendar(calendarId) {
    return await api.post(`/calendars/${calendarId}/follow`);
  }

  async createEvent(calendarId, params) {
    return await api.post(`/calendars/${calendarId}/events`, params);
  }
}

export default new Calendars;
