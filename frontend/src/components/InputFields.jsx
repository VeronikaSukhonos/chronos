import { useState } from 'react';

import { PwCloseIcon, PwOpenIcon } from '../assets';
import './InputFields.css';

export const TextField = ({ label, onChange, id, val, err, req = false, ph = "", ac = "off" }) => {
  return (
    <div className="field">
      <label className={"field-label " + (req ? "required" : "")} htmlFor={id}>{label}</label>
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
      <label className={"field-label " + (req ? "required" : "")} htmlFor={id}>{label}</label>
      <div className="field-container">
        <input
          type={pwOpen ? "text" : "password"}
          id={id} name={id}
          onChange={onChange} value={val || ""}
          placeholder={ph} autoComplete={ac}
        />
        {pwOpen ? <PwCloseIcon onClick={() => setPwOpen(false)} />
          : <PwOpenIcon onClick={() => setPwOpen(true)} />}
      </div>
      {err?.[id] && <div className="field-err">{err[id]}</div>}
    </div>
  );
};
