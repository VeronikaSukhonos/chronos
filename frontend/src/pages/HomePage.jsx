import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';

import Users from '../api/usersApi.js';
import Calendars from '../api/calendarsApi.js';
import Tags from '../api/tagsApi.js';
import { selectAuthUser } from '../store/authSlice.js';
import {
  selectCalendar, selectCalendarLoad, setCalendar, setVs, updateVs
} from '../store/calendarSlice.js';
import ErrorPage from './ErrorPage.jsx';
import LoadPage from './LoadPage.jsx';
import { AccordionMenu, Calendar, MainButton, Checkbox } from '../components';
import { AddIcon, LinesIcon } from '../assets';
import { getEventIcon } from '../utils/getEventIcon.jsx';
import './HomePage.css';

function HomePage() {
  const dispatch = useDispatch();

  const auth = useSelector(selectAuthUser.user);

  const myCalendars = useSelector(selectCalendar.myCalendars);
  const otherCalendars = useSelector(selectCalendar.otherCalendars);
  const eventTypes = useSelector(selectCalendar.eventTypes);
  const tags = useSelector(selectCalendar.tags);

  const calendarsLoad = useSelector(selectCalendarLoad.calendars);
  const tagsLoad = useSelector(selectCalendarLoad.tags);
  const vsLoad = useSelector(selectCalendarLoad.vs);
  const loadError = useSelector(selectCalendarLoad.error);

  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  const openCalendarCreateForm = () => {
    console.log('Calendar creation form opens...'); // TODO
  };

  const openTagCreateForm = (e) => {
    e.stopPropagation(); // TODO
  };

  useEffect(() => {
    Calendars.fetchCalendars()
      .then(({ data: res }) => {
        dispatch(setCalendar({
          myCalendars: res.data.calendars.filter(c => c.authorId === auth.id),
          otherCalendars: res.data.calendars.filter(c => c.authorId !== auth.id),
          calendarsLoad: false
        }));
      })
      .catch((err) => {
        dispatch(setCalendar({ loadError: err.message }));
      });
    Tags.fetchTags()
      .then(({ data: res }) => {
        dispatch(setCalendar({ tags: res.data.tags, tagsLoad: false }));
      })
      .catch((err) => {
        dispatch(setCalendar({ loadError: err.message }));
      });

    return () => dispatch(setCalendar())
  }, []);

  useEffect(() => {
    if (!calendarsLoad && !tagsLoad) {
      Users.fetchVisibilitySettings()
        .then(({ data: res }) => {
          dispatch(setCalendar({ vsLoad: false }));
          dispatch(setVs(res.data.visibilitySettings));
        })
        .catch((err) => {
          dispatch(setCalendar({ loadError: err.message }));
        });
    }
  }, [calendarsLoad, tagsLoad]);

  if (!auth) return <Navigate to="login" />
  if (loadError)
    return <ErrorPage error={loadError} />

  return (
    <div className="home-page-container">
      <div className={"side-panel " + (sidePanelOpen ? "open" : "close")}>
        <div className="side-panel-buttons-container">
          {sidePanelOpen && <div className="main-button square" onClick={() => setSidePanelOpen(false)}>
            <LinesIcon className="side-panel-icon" />
          </div>}
          <MainButton
            title="New Calendar"
            onClick={openCalendarCreateForm}
            type="button" dis={vsLoad}
          />
        </div>
        <AccordionMenu
          defaultOpenItems={[0, 1, 2, 3]}
          items={[
            {
              title: "My Calendars",
              content:
                <ul className="side-panel-group">
                  {vsLoad ? <li><LoadPage small="true" /></li> : myCalendars.map((c, i) => <li key={c.id}>
                    <Checkbox
                      id={c.id} name="myCalendars"
                      label={c.name}
                      checked={c.visible || false}
                      onChange={() => dispatch(updateVs({ group: 'myCalendars', id: c.id }))}
                      color={c.color}
                    />
                  </li>)}
                </ul>
            },
            {
              title: "Other Calendars",
              content:
                <ul className="side-panel-group">
                  {vsLoad ? <li><LoadPage small="true" /></li> : (otherCalendars.length ? otherCalendars.map((c, i) => <li key={c.id}>
                    <Checkbox
                      id={c.id} name="otherCalendars"
                      label={c.name}
                      checked={c.visible || false}
                      onChange={() => dispatch(updateVs({ group: 'otherCalendars', id: c.id }))}
                      color={c.color}
                    />
                  </li>)
                    : <li className="side-panel-group-no-content" key="no-calendars">You do not have other calendars. Find one!</li>)}
                </ul>
            },
            {
              title: "Event Types",
              content:
                <ul className="side-panel-group">
                  {vsLoad ? <li><LoadPage small="true" /></li> : eventTypes.map((et, i) => <li key={et.type}>
                    <Checkbox
                      id={et.type} name="eventTypes"
                      label={et.type}
                      checked={et.visible || false}
                      onChange={() => dispatch(updateVs({ group: 'eventTypes', id: et.type }))}
                      icon={getEventIcon(et.type, "small-event-icon")}
                    />
                  </li>)}
                </ul>
            },
            {
              title: "Event Tags",
              content:
                <ul className="side-panel-group">
                  {vsLoad ? <li><LoadPage small="true" /></li> : (tags.length ? tags.map((t, i) => <li key={t.id}>
                    <Checkbox
                      id={t.id} name="tags"
                      label={t.name}
                      checked={t.visible || false}
                      onChange={() => dispatch(updateVs({ group: 'tags', id: t.id }))}
                    />
                  </li>)
                    : <li className="side-panel-group-no-content" key="no-tags">You do not have tags. Create one!</li>)}
                </ul>,
              button: <MainButton Icon={AddIcon} small={true} onClick={openTagCreateForm} type="button" />
            }
          ]}
        />
      </div>
      <div className="main-panel">
        <div className="calendar-navigation">
          {!sidePanelOpen && <div className="main-button square" onClick={() => setSidePanelOpen(true)}>
            <LinesIcon className="side-panel-icon" />
          </div>}
        </div>
        <Calendar />
      </div>
    </div>
  );
}

export default HomePage;
