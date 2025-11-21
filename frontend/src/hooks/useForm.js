import { useState } from 'react';

const useForm = (initialVals, validate, successClear = true) => {
  const [params, setParams] = useState(initialVals);
  const [load, setLoad] = useState(false);
  const [feedback, setFeedback] = useState({ msg: '', status: '' });
  const [errors, setErrors] = useState({});

  const setParam = (e) => {
    const { name, value } = e.target;

    setParams(params => ({...params, [name]: value}));
    if (errors[name]) errors[name] = '';
  };

  const resetForm = () => {
    const validation = validate();

    setFeedback({ msg: '', status: '' });
    setErrors(validation);
    if (Object.values(validation).some(val => val !== '')) return false;
    setLoad(true);
    return true;
  };

  const setSuccess = (res) => {
    setLoad(false);
    setFeedback({ msg: res.message, status: 'ok' });
    if (successClear) setParams(initialVals);
  };

  const setFailure = (err) => {
    setLoad(false);
    if (err.errors) setErrors(err.errors);
    else setFeedback({ msg: err.message, status: 'fail' });
  };

  return {
    params, setParam,
    load, feedback, errors,
    resetForm, setSuccess, setFailure
  };
};

export default useForm;
