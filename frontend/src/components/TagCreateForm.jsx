import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import Tags from '../api/tagsApi.js';
import {
  addToCalendar, updateInCalendar, selectTagCreateForm, setForm, closeForm
} from '../store/calendarSlice.js';
import { Modal, TextField, MainButton } from '../components';
import { useForm } from '../hooks';
import valid from '../utils/validation.js';
import '../components/Forms.css';

const TagCreateForm = () => {
  const dispatch = useDispatch();

  const f = useSelector(selectTagCreateForm);
  const formOpenRef = useRef();

  const {
    params, setParam, load, feedback, errors, resetForm, _, setFailure, clearForm
  } = useForm({ title: f.tag?.title || '' }, () => { return { title: valid.tagTitle(params) }; });

  const submit = (e) => {
    e.preventDefault();
    if (!resetForm()) return;

    if (f.tag?.id) {
      Tags.updateTag(f.tag?.id, params)
        .then(({ data: res }) => {
          if (res.data?.tag) dispatch(updateInCalendar({ group: 'tags', item: res.data.tag }));
          dispatch(setForm({ form: 'tagCreateForm',
            params: { tag: { id: f.tag?.id, ...params }}}));
          dispatch(closeForm('tagCreateForm'));
          toast(res.message);
        })
        .catch((err) => { if (formOpenRef.current) setFailure(err); });
    } else {
      Tags.createTag(params)
        .then(({ data: res }) => {
          dispatch(addToCalendar({ group: 'tags', item: res.data.tag }));
          dispatch(closeForm('tagCreateForm'));
          toast(res.message);
        })
        .catch((err) => { if (formOpenRef.current) setFailure(err); });
    }
  };

  useEffect(() => {
    formOpenRef.current = f.open;
    if (!f.open) clearForm();
  }, [f.open]);

  useEffect(() => {
    setParam({ target: { name: 'title', value: f.tag?.title || '' } });
  }, [f.tag]);

  return (
    <Modal
      modalOpen={f.open}
      setModalOpen={(_) => { if (!load) dispatch(closeForm('tagCreateForm')); }}
      title={f.tag?.id ? "Update Tag" : "Create Tag"}
    >
      <form className="basic-form transparent" onSubmit={submit}>
        <TextField
          label="Title"
          onChange={setParam}
          id="title"
          val={params.title}
          err={errors}
          req={true}
        />

        {feedback && <p className={"basic-form-feedback " + (feedback.status)}>{feedback.msg}</p>}

        <MainButton title={f.tag?.id ? "Update" : "Create"} dis={load} />
      </form>
    </Modal>
  );
};

export default TagCreateForm;
