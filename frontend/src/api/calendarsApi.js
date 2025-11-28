import api from './api.js';

class Calendars {
  async fetchCalendars(queryParams = '') {
    return await api.get(`/calendars${queryParams}`);
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

  async deleteCalendar(calendarId) {
    return await api.delete(`/calendars/${calendarId}`);
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
