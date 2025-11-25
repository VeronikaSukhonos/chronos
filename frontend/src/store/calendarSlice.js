import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  myCalendars: [],
  otherCalendars: [],
  eventTypes: [
    { type: 'arrangement' },
    { type: 'reminder' },
    { type: 'task' },
    { type: 'holiday' },
    { type: 'birthday' }
  ],
  tags: [],

  calendarsLoad: true,
  tagsLoad: true,
  vsLoad: true,
  eventsLoad: true,

  loadError: '',
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setCalendar: (state, action) => {
      for (const [prop, val] of Object.entries(action.payload || initialState))
        state[prop] = val;
    },
    setVs: (state, action) => {
      for (const [prop, val] of Object.entries(action.payload)) {
        if (prop === 'calendars') {
          for (const c of state.myCalendars) c.visible = val.includes(c.id);
          for (const c of state.otherCalendars) c.visible = val.includes(c.id);
        }
        if (prop === 'eventTypes') {
          for (const et of state.eventTypes) et.visible = val.includes(et.type);
        }
        if (prop === 'tags') {
          for (const t of state.tags) t.visible = val.includes(t.id);
        }
      }
    },
    updateVs: (state, action) => {
      for (const item of state[action.payload.group]) {
        if (item[action.payload.group === 'eventTypes' ? 'type' : 'id'] === action.payload.id)
          item.visible = !item.visible;
      }
    }
  }
});

export const { setCalendar, setVs, updateVs } = calendarSlice.actions;

export default calendarSlice.reducer;

export const selectCalendar = {
  myCalendars: (state) => state.calendar.myCalendars,
  otherCalendars: (state) => state.calendar.otherCalendars,
  eventTypes: (state) => state.calendar.eventTypes,
  tags: (state) => state.calendar.tags
};

export const selectCalendarLoad = {
  calendars: (state) => state.calendar.calendarsLoad,
  tags: (state) => state.calendar.tagsLoad,
  vs: (state) => state.calendar.vsLoad,
  eventsLoad: (state) => state.calendar.eventsLoad,
  error: (state) => state.calendar.loadError
};
