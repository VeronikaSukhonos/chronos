import { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { EyeCloseIcon, EyeOpenIcon, ArrowIcon } from '../assets';
import { useClickOutside } from '../hooks';
import './InputFields.css';

const COLORS = ['#ade4ff', '#f8d1ff', '#ffcedc', '#ffdab4', '#fced9a', '#cff2c8'];

export const TextField = ({ label, onChange, id, name, val, err, req = false, ph = "", ac = "off", dis = false }) => {
  return (
    <div className="field">
      {label && <label className={"field-label" + (req ? " required" : "")} htmlFor={id}>{label}</label>}
      <div className="field-container">
        <input
          type="text"
          id={id} name={name || id}
          onChange={onChange} value={val || ""}
          placeholder={ph} autoComplete={ac} disabled={dis}
        />
      </div>

      {err?.[name || id] && <div className="field-err">{err[name || id]}</div>}
    </div>
  );
};

export const TextAreaField = ({ label, onChange, id, name, val, err, req = false, ph = "", dis = false }) => {
  return (
    <div className="field">
      {label && <label className={"field-label" + (req ? " required" : "")} htmlFor={id}>{label}</label>}
      <div className="field-container area">
        <textarea
          id={id} name={name || id}
          onChange={onChange} value={val || ""}
          placeholder={ph} disabled={dis}
        ></textarea>
      </div>

      {err?.[name || id] && <div className="field-err">{err[name || id]}</div>}
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

export const DateField = ({ label, min, max, time = false, onChange, id, val, err, req = false, ac = "off", dis = false }) => {
  return (
    <div className="field">
      {label && <label className={"field-label" + (req ? " required" : "")} htmlFor={id}>{label}</label>}
      <div className={"field-container" + (time ? " time" : "")}>
        <DatePicker
          id={id} name={id}
          showTimeSelect={time}
          onChange={(d) => onChange({ target: { name: id, value: d }})}
          selected={val} autoComplete={ac}
          placeholderText={ time ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy"} minDate={min} maxDate={max}
          dateFormat={ time ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy"} timeFormat="HH:mm" calendarStartDay={1}
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
          onChange={(e) => onChange({ target: { name, value: e.target.checked } })}
          checked={checked}
          disabled={dis}
        />
        <div
          className="checkbox-container"
          style={checked ? { background: color } : {}}
        ></div>
        <span className="checkbox-field-label"><span>{label}</span>{icon}</span>
      </label>
    </div>
  );
};

export const ColorField = (
  { label, name, id = 'cld', checked, onChange, err, req = false, dis = false, colors = COLORS }
) => {
  return (
    <div className="field">
      {label && <span className={"field-label" + (req ? " required" : "")}>{label}</span>}
      <div className="color-field-container">
        {
          colors.map((c) => 
            <label className="color-field-label" htmlFor={id + c} key={id + c}>
              <input
                type="radio"
                id={id + c} name={name}
                onChange={() => onChange({ target: { name, value: c } })}
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

export const SelectField = (
  { label, name, options = [], selected, onChange, err, req = false, dis = false, nav = false }
) => {
  const [selectOpen, setSelectOpen] = useState(false);
  const sel = options.find(opt => opt.value === selected) || options[0];

  const selectRef = useRef(null);

  useClickOutside([selectRef], () => { if (selectOpen) setSelectOpen(false); });
  useEffect(() => { if (dis) setSelectOpen(false); }, [dis]);

  return (
    <div className="field">
      {label && <span className={"field-label" + (req ? " required" : "")}>{label}</span>}
      <div ref={selectRef} className={
        "select-field-container " + (dis ? "disabled close" : (selectOpen ? "open" : "close")) + (nav ? " nav" : "")
      }>
        <button type="button" className="select-field-button" disabled={dis} onClick={() => { if (!dis) setSelectOpen(open => !open); }}>
          {sel?.label}<ArrowIcon />
        </button>
        <div className="select-field-options-container">
          {options.map(opt => <div className="select-field-option" key={"opt" + opt.value}>
              <input
                type="radio"
                id={opt.value} name={name}
                onClick={() => setSelectOpen(false)}
                onChange={() => onChange({ target: { name, value: opt.value } })}
                checked={opt.value === sel?.value}
                disabled={dis}
              />
              <label htmlFor={opt.value}>{opt.label}</label>
            </div>
          )}
        </div>
        {err?.[name] && <div className="field-err">{err[name]}</div>}
      </div>
    </div>
  );
};
