import { createSlice } from '@reduxjs/toolkit';

const initialCalendarCreateForm = {
  calendar: null,
  open: false,
  onlyColor: false,
  findMode: false
};

const initialTagCreateForm = {
  tag: null,
  open: false
};

const initialConfirmDeleteForm = {
  id: null,
  group: null,
  open: false,
  result: null
};

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

  period: {
    year: null,
    week: null,
    month: null,
    day: null
  },
  view: 'month',
  events: [],

  calendarsLoad: true,
  tagsLoad: true,
  vsLoad: true,
  eventsLoad: true,

  loadError: '',

  calendarCreateForm: initialCalendarCreateForm,
  tagCreateForm: initialTagCreateForm,
  confirmDeleteForm: initialConfirmDeleteForm,

  archived: []
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setCalendar: (state, action) => {
      for (const [prop, val] of Object.entries(action.payload || initialState))
        state[prop] = val;
    },
    addToCalendar: (state, action) => {
      const prop = action.payload.group === 'tags' ? 'title' : 'name';

      state[action.payload.group].push(action.payload.item);
      state[action.payload.group] = action.payload.group === 'myCalendars'
        ? state[action.payload.group].slice(0, 2).concat(
          state[action.payload.group].slice(2).sort((a, b) => a[prop].localeCompare(b[prop])))
        : (state[action.payload.group].sort((a, b) => a[prop].localeCompare(b[prop])));
    },
    updateInCalendar: (state, action) => {
      for (const item of state[action.payload.group]) {
        if (item.id === action.payload.item.id) {
          for (const [prop, val] of Object.entries(action.payload.item))
            item[prop] = val;
          break;
        }
      }
    },
    deleteFromCalendar: (state, action) => {
      state[action.payload.group] = state[action.payload.group]
        .filter(i => i.id !== action.payload.id);
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
        if (item[action.payload.group === 'eventTypes' ? 'type' : 'id'] === action.payload.id) {
          item.visible = !item.visible;
          break;
        }
      }
    },
    setForm: (state, action) => {
      const form = action.payload.form;

      for (const [prop, val] of Object.entries(action.payload.params ||
        (form === 'calendarCreateForm' ? initialCalendarCreateForm
        : (form === 'tagCreateForm' ? initialTagCreateForm
          : initialConfirmDeleteForm))))
        state[form][prop] = val;
    },
    setPeriod: (state, action) => {
      for (const [prop, val] of Object.entries(action.payload))
        state.period[prop] = val;
    }
  }
});

export const {
  setCalendar, addToCalendar, updateInCalendar, deleteFromCalendar,
  setVs, updateVs, setPeriod,
  setForm
} = calendarSlice.actions;

export default calendarSlice.reducer;

export const closeForm = (form) => (dispatch) => {
  dispatch(setForm({ form, params: { open: false }}));
  setTimeout(() => { dispatch(setForm({ form })); }, 300);
};

export const selectCalendar = {
  myCalendars: (state) => state.calendar.myCalendars,
  otherCalendars: (state) => state.calendar.otherCalendars,
  eventTypes: (state) => state.calendar.eventTypes,
  tags: (state) => state.calendar.tags,

  period: (state) => state.calendar.period,

  view: (state) => state.calendar.view,
  events: (state) => state.calendar.events,

  archived: (state) => state.calendar.archived
};

export const selectCalendarLoad = {
  calendars: (state) => state.calendar.calendarsLoad,
  tags: (state) => state.calendar.tagsLoad,
  vs: (state) => state.calendar.vsLoad,
  events: (state) => state.calendar.eventsLoad,
  error: (state) => state.calendar.loadError
};

export const selectCalendarCreateForm = (state) => state.calendar.calendarCreateForm;
export const selectTagCreateForm = (state) => state.calendar.tagCreateForm;
export const selectConfirmDeleteForm = (state) => state.calendar.confirmDeleteForm;
