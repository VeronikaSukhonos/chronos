import api from './api.js';

// temp api response
const events = [
  {
    "id": "1",
    "name": "Make a cake",
    "type": "task",
    "startDate": "2025-01-01",
    "color": "#ade4ff",
    "calendar": {
      "id": "1",
      "name": "Main",
      "color": "#ade4ff"
    }
  },
  {
    "id": "2",
    "name": "Buy groceries",
    "type": "task",
    "startDate": "2025-01-02",
    "color": "#f8d1ff",
    "calendar": {
      "id": "1",
      "name": "Main",
      "color": "#ade4ff"
    }
  },
  {
    "id": "3",
    "name": "Doctor appointment",
    "type": "arrangement",
    "startDate": "2025-01-03 10:00",
    "endDate": "2025-01-03 11:00",
    "color": "#fced9a",
    "calendar": {
      "id": "1",
      "name": "Main",
      "color": "#ade4ff"
    }
  },
  {
    "id": "4",
    "name": "Team meeting",
    "type": "arrangement",
    "startDate": "2025-01-04 13:00",
    "endDate": "2025-01-05 14:00",
    "color": "#ade4ff",
    "calendar": {
      "id": "1",
      "name": "Super Team Calendar",
      "color": "#ade4ff"
    }
  },
  {
    "id": "5",
    "name": "Pay bills",
    "type": "task",
    "startDate": "2025-01-05",
    "color": "#f8d1ff",
    "calendar": {
      "id": "1",
      "name": "Main",
      "color": "#ade4ff"
    }
  },
  {
    "id": "6",
    "name": "Call parents",
    "type": "reminder",
    "startDate": "2025-01-06",
    "color": "#f8d1ff",
    "calendar": {
      "id": "1",
      "name": "Main",
      "color": "#ade4ff"
    }
  },
  {
    "id": "7",
    "name": "Tim's Birthday",
    "type": "birthday",
    "startDate": "2025-01-07",
    "color": "#ffdab4",
    "allDay": "true",
    "calendar": {
      "id": "1",
      "name": "Holidays",
      "color": "#ade4ff"
    }
  },
  {
    "id": "8",
    "name": "Project deadline",
    "type": "reminder",
    "startDate": "2025-01-08",
    "color": "#ffdab4",
    "calendar": {
      "id": "1",
      "name": "Main",
      "color": "#ade4ff"
    }
  },
  {
    "id": "9",
    "name": "Plan vacation",
    "type": "task",
    "startDate": "2025-01-09",
    "color": "#cff2c8",
    "calendar": {
      "id": "1",
      "name": "Travel Calendar",
      "color": "#ade4ff"
    }
  },
  {
    "id": "10",
    "name": "Clean the house",
    "type": "task",
    "startDate": "2025-01-10",
    "color": "#cff2c8",
    "calendar": {
      "id": "1",
      "name": "Main",
      "color": "#ade4ff"
    }
  }
];

class Events {
  async fetchEvents(queryParams) {
    return await Promise.resolve((() => {
      const res = events.filter(e =>
        e.name.toLowerCase().includes(queryParams.slice(6))
      );

      return {
        data: {
          data: { events: res },
          message: res.length > 0 ? "successfully fetched" : "no events"
        }
      };
    })());
    // return await api.get(`/events${queryParams}`);
  }
}

export default new Events;
