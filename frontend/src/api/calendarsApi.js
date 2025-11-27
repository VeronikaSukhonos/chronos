import api from './api.js';

class Calendars {
  async fetchCalendars(queryParams = '') {
    return await api.get(`/calendars${queryParams}`);
  }

  async fetchCalendar(calendarId) { // TODO
    return await api.get(`/calendars/${calendarId}`);
  }

  async createCalendar(params) { // TODO
    return await api.post(`/calendars`, params);
  }

  async updateCalendar(params) { // TODO
    return await api.post(`/calendars`, params);
  }

  async deleteCalendar(params) { // TODO
    return await api.post(`/calendars`, params);
  }

  async sendParticipation(params) { // TODO
    return await api.post(`/calendars`, params);
  }

  async confirmParticipation(params) { // TODO
    return await api.post(`/calendars`, params);
  }

  async follow(params) { // TODO
    return await api.post(`/calendars`, params);
  }

  async createEvent(params) { // TODO
    return await api.post(`/calendars`, params);
  }
}

export default new Calendars;
