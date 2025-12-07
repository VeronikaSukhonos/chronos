import { useState, useRef, useEffect } from 'react';

import Tags from '../api/tagsApi.js';
import { AddIcon } from '../assets';
import './SearchForms.css';
import './InputFields.css';

const SelectedTag = ({ tag, del }) => {
  return (
    <div className="selected-tag">
      <div className="selected-tag-title">{tag?.title}</div>
      <button type="button" className="selected-tag-delete" onClick={del}><AddIcon /></button>
    </div>
  );
};

const TagSelect = ({ label, name, chosen = [], setChosen, req = false, err, fOpen }) => {
  const [search, setSearch] = useState('');

  const [_, setLoad] = useState(false);
  const [feedback, setFeedback] = useState({ msg: '', status: '' });
  const [tags, setTags] = useState([]);
  const [shown, setShown] = useState([]);

  const inputRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(blurTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (fOpen) {
      Tags.fetchTags()
        .then(({ data: res }) => {
          setLoad(false);
          setTags(res.data.tags);
          setShown([]);
        })
        .catch(err => {
          setLoad(false);
          setFeedback({ msg: err.message, status: 'fail' });
          setTags([]);
          setShown([]);
        });
    } else {
      setSearch('');
      setTags([]);
      setFeedback({ msg: '', status: '' });
      setShown([]);
    }
  }, [fOpen]);

  useEffect(() => {
    if (!search || search.trim() === '') {
      setFeedback({ msg: '', status: '' });
      setShown([]);
      return;
    }
    setFeedback({ msg: 'Fetched tags successfully', status: 'ok' });
    setShown(tags.filter(t => (t.title.includes(search) && !chosen.some(ch => ch.id === t.id))));
  }, [search]);

  return (
    <div className="field tag-select-container">
      {label && <span className={"field-label" + (req ? " required" : "")}>{label}</span>}
      <div className="field-container vertical">
        <div className="selected-tags">
          {chosen.map(ch => {
            return <SelectedTag key={ch.id} tag={ch}
              del={() => setChosen({ target: { name, value: chosen.filter(t => t.id !== ch.id) } })}
            />
          })}
        </div>

        <div className="tag-add-container">
          <input id="tag-select"
            type="text" name={name}
            onChange={(e) => setSearch(e.target.value)} value={search || ""}
            onBlur={() => {
              clearTimeout(blurTimeoutRef.current);
              blurTimeoutRef.current = setTimeout(() => {
                setFeedback({ msg: '', status: '' });
                setShown([]);
              }, 150);
            }}
            placeholder="Search tags..." autoComplete="off" ref={inputRef}
          />
          {
            feedback.msg && <ul className="search-results tags">
              {shown.length > 0
                ? <>{shown.map(t => <li key={`searchedtag${t.id}`}
                      className="searched-tag" onClick={() => {
                      inputRef.current?.focus();
                      setChosen({ target: { name, value: [...chosen, t]}});
                      setSearch('');
                      setShown([]);
                    }
                    }>{t.title}</li>)}
                  </>
                : search && search.trim() && ((feedback.status === 'ok' ? <li className="info-message">No tags found</li>
                  : <li className="info-message">{feedback.msg}</li>))}
            </ul>
          }
        </div>
      </div>

      {err?.[name]
        && <div className="field-err">{err[name]}</div>}
    </div>
  );
};

export default TagSelect;
