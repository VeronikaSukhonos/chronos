import { useSelector, useDispatch } from 'react-redux';

import {
  selectConfirmDeleteForm, setForm, closeForm
} from '../store/calendarSlice.js';
import { Modal, MainButton } from '../components';
import './Forms.css';

const ConfirmDeleteForm = () => {
  const dispatch = useDispatch();

  const form = useSelector(selectConfirmDeleteForm);

  return (
    <Modal
      modalOpen={form.open}
      setModalOpen={(_) => dispatch(closeForm('confirmDeleteForm'))}
      title={
        (form.group === 'myCalendars' || form.group === 'otherCalendars') ? 'Delete Calendar?'
        : (form.group === 'tags' ? 'Delete Tag?'
        : (form.group === 'events' ? 'Delete Event?' : ''))
      }
    >
      <div className="basic-form transparent confirm-form">
        <div className="warning">
          {
            form.group === 'myCalendars' ? 'Deleting this calendar will delete all data associated with it from all users. Are you sure?'
            : (form.group === 'otherCalendars' ? 'By deleting this calendar, you will lose access to all events that it has. Are you sure?'
            : (form.group === 'tags' ? 'By deleting this tag, you will no longer be able to filter events by it. Are you sure?'
            : (form.group === 'events' ? 'Deleting this event will delete all data associated with it from all users. Are you sure?'
            : (form.group === 'eventsParticipation' ? 'By deleting this event, you will lose access to it. Are you sure?' : ''))))
          }
        </div>
        <div className="buttons-container">
          <MainButton title="Delete" simple={true} type="button" onClick={
            () => dispatch(setForm({ form: 'confirmDeleteForm', params: { result: true }}))}
          />
          <MainButton title="Cancel" simple={true} type="button" onClick={
            () => dispatch(closeForm('confirmDeleteForm'))}
          />
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDeleteForm;
