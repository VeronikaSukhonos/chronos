import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import Tags from '../api/tagsApi.js';
import {
  updateVs, deleteFromCalendar,
  selectConfirmDeleteForm, setForm, closeForm
} from '../store/calendarSlice.js';
import { Checkbox, MenuButton } from '../components';
import { useClickOutside } from '../hooks';
import { UpdateIcon, DeleteIcon } from '../assets';
import { getEventIcon } from '../utils/getEventIcon.jsx';
import '../pages/HomePage.css';
import './DropdownMenu.css';

const CalendarMenu = ({ calendar, menuOpen, setLoad, my }) => {

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
          dispatch(deleteFromCalendar({ group: 'tags', id: tag.id }));
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
        icon={ group === 'eventTypes' ? getEventIcon(item.type, "small-event-icon") : undefined }
      />
      {group !== 'eventTypes' && <div className="dropdown-menu-container small" ref={menuRef}>
        {
          group === 'myCalendars' ?
            <CalendarMenu calendar={item} menuOpen={menuOpen} setLoad={setLoad} my={true} />
          : (group === 'myCalendars' ?
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
