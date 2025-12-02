import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import Calendars from '../api/calendarsApi.js';
import Tags from '../api/tagsApi.js';
import {
  updateVs, deleteFromCalendar,
  selectConfirmDeleteForm, setForm, closeForm
} from '../store/calendarSlice.js';
import { Checkbox, MenuButton } from '../components';
import { useClickOutside } from '../hooks';
import {
  AboutIcon, ColorIcon, UpdateIcon, ArchiveIcon, DeleteIcon
} from '../assets';
import { getCalendarIcon, getEventIcon } from '../utils/getIcon.jsx';
import '../pages/HomePage.css';
import './DropdownMenu.css';

const CalendarMenu = ({ calendar, menuOpen, setLoad, my }) => {
  const dispatch = useDispatch();

  const confirmDeleteForm = useSelector(selectConfirmDeleteForm);

  const archiveCalendar = () => {
    setLoad(true);

    Calendars.archiveCalendar(calendar.id)
      .then(({ data: res }) => {
        dispatch(deleteFromCalendar({ group: 'myCalendars', id: calendar.id }));
        setLoad(false);
        toast(res.message);
      })
      .catch((err) => {
        setLoad(false);
        toast(err.message);
      });
  };

  useEffect(() => {
    if (['myCalendars', 'otherCalendars'].includes(confirmDeleteForm.group)
      && confirmDeleteForm.id === calendar.id && confirmDeleteForm.result === true) {
      dispatch(closeForm('confirmDeleteForm'));
      setLoad(true);

      Calendars.deleteCalendar(calendar.id)
        .then(({ data: res }) => {
          dispatch(deleteFromCalendar({ group: confirmDeleteForm.group, id: calendar.id }));
          setLoad(false);
          toast(res.message);
        })
        .catch((err) => {
          setLoad(false);
          toast(err.message);
        });
      }
  }, [confirmDeleteForm.id, confirmDeleteForm.group, confirmDeleteForm.result]);

  const about = <li><Link to={`/calendars/${calendar.id}`}><AboutIcon />About</Link></li>

  const color =
    <li onClick={() => dispatch(setForm({
        form: 'calendarCreateForm', params: { calendar, open: true, onlyColor: true }}
      ))}>
      <button><ColorIcon /><div>Set color</div></button>
    </li>

  const archive =
    my ? <li onClick={archiveCalendar}>
      <button><ArchiveIcon /><div>Archive</div></button>
    </li> : <></>

  const update =
    my ? <li onClick={() => dispatch(setForm({
        form: 'calendarCreateForm', params: { calendar, open: true }}
      ))}>
      <button><UpdateIcon /><div>Update</div></button>
    </li> : <></>

  const del =
    <li onClick={() => dispatch(setForm({ form: 'confirmDeleteForm', params: {
        id: calendar.id, group: (my ? 'myCalendars' : 'otherCalendars'), open: true }}
      ))}>
      <button><DeleteIcon /><div>Delete</div></button>
    </li>

  return (
    <ul className={menuOpen ? 'open' : 'close'}>
      { ["main", "holidays"].includes(calendar.type)
        ? <>{about}{color}</> : <>{about}{update}{archive}{del}</> }
    </ul>
  );
};

const TagMenu = ({ tag, menuOpen, setLoad }) => {
  const dispatch = useDispatch();

  const confirmDeleteForm = useSelector(selectConfirmDeleteForm);

  useEffect(() => {
    if (confirmDeleteForm.group === 'tags' && confirmDeleteForm.id === tag.id
      && confirmDeleteForm.result === true) {
      dispatch(closeForm('confirmDeleteForm'));
      setLoad(true);

      Tags.deleteTag(tag.id)
        .then(({ data: res }) => {
          dispatch(deleteFromCalendar({ group: confirmDeleteForm.group, id: tag.id }));
          setLoad(false);
          toast(res.message);
        })
        .catch((err) => {
          setLoad(false);
          toast(err.message);
        });
      }
  }, [confirmDeleteForm.id, confirmDeleteForm.group, confirmDeleteForm.result]);

  return (
    <ul className={menuOpen ? 'open' : 'close'}>
      <li onClick={() => dispatch(setForm(
        { form: 'tagCreateForm', params: { tag, open: true }}
      ))}>
        <button><UpdateIcon /><div>Update</div></button>
      </li>
      <li onClick={() => dispatch(setForm(
        { form: 'confirmDeleteForm', params: { id: tag.id, group: 'tags', open: true }}
      ))}>
        <button><DeleteIcon /><div>Delete</div></button>
      </li>
    </ul>
  );
};

const SidePanelItem = ({ item, group }) => {
  const dispatch = useDispatch();

  const [load, setLoad] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useClickOutside([menuRef], () => setMenuOpen(false));

  return (
    <li className="side-panel-item">
      <Checkbox
        id={item.id || item.type} name={group}
        label={item.name || item.title || item.type}
        checked={item.visible || false}
        onChange={() => dispatch(updateVs({ group, id: (item.id || item.type) }))}
        color={item.color}
        icon={
          group === 'eventTypes' ? getEventIcon(item.type, "small-icon")
          : (['myCalendars', 'otherCalendars'].includes(group) && getCalendarIcon(item, "small-icon"))
        }
      />
      {group !== 'eventTypes' && <div className="dropdown-menu-container small" ref={menuRef}>
        {
          group === 'myCalendars' ?
            <CalendarMenu calendar={item} menuOpen={menuOpen} setLoad={setLoad} my={true} />
          : (group === 'otherCalendars' ?
            <CalendarMenu calendar={item} menuOpen={menuOpen} setLoad={setLoad} my={false} />
          : group === 'tags' ?
            <TagMenu tag={item} menuOpen={menuOpen} setLoad={setLoad} />
          : <></>)
        }
        <MenuButton onClick={() => {
          if (!menuOpen && !load) setMenuOpen(true); else setMenuOpen(false);
        }} />
      </div>}
    </li>
  );
};

export default SidePanelItem;
