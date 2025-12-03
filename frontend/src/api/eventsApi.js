import api from './api.js';

class Events {
  async fetchEvents(params) {
    return await api.post(`/events`, params);
  }

  async fetchEvent(eventId) {
    return await api.get(`/events/${eventId}`);
  }

  async updateEvent(eventId, params) {
    return await api.patch(`/events/${eventId}`, params);
  }

  async doTask(eventId) {
    return await api.post(`/events/${eventId}/done`);
  }

  async undoTask(eventId) {
    return await api.delete(`/events/${eventId}/done`);
  }

  async deleteEvent(eventId) {
    return await api.delete(`/events/${eventId}`);
  }

  async resendParticipation(eventId, params) {
    return await api.post(`/events/${eventId}/confirm`, params);
  }

  async viewParticipation(confirmToken) {
    return await api.get(`/events/confirm/${confirmToken}`);
  }

  async confirmParticipation(confirmToken) {
    return await api.post(`/events/confirm/${confirmToken}`);
  }
}

export default new Events;
