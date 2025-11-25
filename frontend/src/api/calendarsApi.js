import api from './api.js';

// temp api response
const calendars = [
  {
    "id": "1",
    "authorId": "id1",
    "name": "Main",
    "type": "main",
    "color": "#ade4ff"
  },
  {
    "id": "2",
    "authorId": "id2",
    "name": "Holidays",
    "type": "holidays",
    "color": "#fced9a"
  },
  {
    "id": "3",
    "authorId": "id3",
    "name": "Random Calendar",
    "type": "other",
    "color": "#f8d1ff"
  }
];

class Calendars {
  async fetchCalendars(queryParams) {
    return await Promise.resolve((() => {
      return {
        data: {
          data: { calendars: calendars },
          message: calendars.length > 0 ? "successfully fetched" : "no calendars"
        }
      };
    })());
    // return await api.get(`/calendars${queryParams}`);
  }
}

export default new Calendars;
