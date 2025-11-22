import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { PwCloseIcon, PwOpenIcon } from '../assets';
import './InputFields.css';

export const TextField = ({ label, onChange, id, val, err, req = false, ph = "", ac = "off" }) => {
  return (
    <div className="field">
      {label && <label className={"field-label " + (req ? "required" : "")} htmlFor={id}>{label}</label>}
      <div className="field-container">
        <input
          type="text"
          id={id} name={id}
          onChange={onChange} value={val || ""}
          placeholder={ph} autoComplete={ac}
        />
      </div>

      {err?.[id] && <div className="field-err">{err[id]}</div>}
    </div>
  );
};

export const PasswordField = (
    { label = "Password", onChange, id = "password", val, err, req = false, ph = "", ac = "new-password" }
  ) => {
  const [pwOpen, setPwOpen] = useState(false);

  return (
    <div className="field">
      {label && <label className={"field-label " + (req ? "required" : "")} htmlFor={id}>{label}</label>}
      <div className="field-container">
        <input
          type={pwOpen ? "text" : "password"}
          id={id} name={id}
          onChange={onChange} value={val || ""}
          placeholder={ph} autoComplete={ac}
        />
        <button type="button">{pwOpen ? <PwCloseIcon onClick={() => setPwOpen(false)} />
          : <PwOpenIcon onClick={() => setPwOpen(true)} />}</button>
      </div>
      {err?.[id] && <div className="field-err">{err[id]}</div>}
    </div>
  );
};

export const DateField = ({ label, onChange, id, val, err, req = false, ac = "off" }) => {
  return (
    <div className="field">
      {label && <label className={"field-label " + (req ? "required" : "")} htmlFor={id}>{label}</label>}
      <div className="field-container">
        <DatePicker
          id={id} name={id}
          onChange={(d) => onChange({ target: { name: id, value: d }})}
          selected={val} autoComplete={ac}
          placeholderText="dd/mm/yyyy" maxDate={new Date()}
          dateFormat="dd/MM/yyyy" calendarStartDay={1}
        />
      </div>

      {err?.[id] && <div className="field-err">{err[id]}</div>}
    </div>
  );
};
