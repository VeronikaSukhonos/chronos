import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { EyeCloseIcon, EyeOpenIcon } from '../assets';
import './InputFields.css';

const COLORS = ['#ade4ff', '#f8d1ff', '#ffcedc', '#ffdab4', '#fced9a', '#cff2c8'];

export const TextField = ({ label, onChange, id, val, err, req = false, ph = "", ac = "off", dis = false }) => {
  return (
    <div className="field">
      {label && <label className={"field-label" + (req ? " required" : "")} htmlFor={id}>{label}</label>}
      <div className="field-container">
        <input
          type="text"
          id={id} name={id}
          onChange={onChange} value={val || ""}
          placeholder={ph} autoComplete={ac} disabled={dis}
        />
      </div>

      {err?.[id] && <div className="field-err">{err[id]}</div>}
    </div>
  );
};

export const TextAreaField = ({ label, onChange, id, val, err, req = false, ph = "", dis = false }) => {
  return (
    <div className="field">
      {label && <label className={"field-label" + (req ? " required" : "")} htmlFor={id}>{label}</label>}
      <div className="field-container area">
        <textarea
          id={id} name={id}
          onChange={onChange} value={val || ""}
          placeholder={ph} disabled={dis}
        ></textarea>
      </div>

      {err?.[id] && <div className="field-err">{err[id]}</div>}
    </div>
  );
};

export const PasswordField = (
    { label = "Password", onChange, id, name = "password", val, err, req = false, ph = "", ac = "new-password" }
  ) => {
  const [pwOpen, setPwOpen] = useState(false);

  return (
    <div className="field">
      {label && <label className={"field-label" + (req ? " required" : "")} htmlFor={id}>{label}</label>}
      <div className="field-container">
        <input
          type={pwOpen ? "text" : "password"}
          id={id || name} name={name}
          onChange={onChange} value={val || ""}
          placeholder={ph} autoComplete={ac}
        />
        <button type="button">{pwOpen ? <EyeCloseIcon onClick={() => setPwOpen(false)} />
          : <EyeOpenIcon onClick={() => setPwOpen(true)} />}</button>
      </div>
      {err?.[name] && <div className="field-err">{err[name]}</div>}
    </div>
  );
};

export const DateField = ({ label, onChange, id, val, err, req = false, ac = "off", dis = false }) => {
  return (
    <div className="field">
      {label && <label className={"field-label" + (req ? " required" : "")} htmlFor={id}>{label}</label>}
      <div className="field-container">
        <DatePicker
          id={id} name={id}
          onChange={(d) => onChange({ target: { name: id, value: d }})}
          selected={val} autoComplete={ac}
          placeholderText="dd/mm/yyyy" maxDate={new Date()}
          dateFormat="dd/MM/yyyy" calendarStartDay={1}
          disabled={dis}
        />
      </div>

      {err?.[id] && <div className="field-err">{err[id]}</div>}
    </div>
  );
};

export const Checkbox = (
  { label, id, name, checked, onChange, dis = false, color = 'var(--accent-bg-color)', icon = '', short = true }
) => {
  return (
    <div className={`checkbox-field-container` + (short ? " short" : "")}>
      <label className="checkbox-field-label" htmlFor={id}>
        <input
          type="checkbox"
          id={id} name={name}
          onChange={onChange}
          checked={checked}
          disabled={dis}
        />
        <div
          className="checkbox-container"
          style={checked ? { background: color } : {}}
        ></div>
        <span className="checkbox-field-label">{label}{icon}</span>
      </label>
    </div>
  );
};

export const ColorField = (
  { label, name, checked, onChange, req = false, err, dis = false, colors = COLORS }
) => {
  return (
    <div className="field">
      {label && <span className={"field-label" + (req ? " required" : "")}>{label}</span>}
      <div className="color-field-container">
        {
          colors.map((c) => 
            <label className="color-field-label" htmlFor={c} key={c}>
              <input
                type="radio"
                id={c} name={name}
                onChange={onChange}
                checked={c === checked}
                disabled={dis}
              />
              <div className="color-container" style={{ background: c }}></div>
            </label>
          )
        }
        {err?.[name] && <div className="field-err">{err[name]}</div>}
      </div>
    </div>
  );
};
