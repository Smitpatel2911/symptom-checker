import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { analyzeSymptoms, clearResult, fetchSymptomList } from '../store/symptomSlice.js';
import { titleCase } from '../utils/format.js';
import Spinner from '../components/Spinner.jsx';
import Disclaimer from '../components/Disclaimer.jsx';
import DoctorCard from '../components/DoctorCard.jsx';

export default function SymptomChecker() {
  const dispatch = useDispatch();
  const { list, listLoading, listError, result, analyzing, analyzeError } = useSelector((s) => s.symptoms);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [freeText, setFreeText] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const resultRef = useRef(null);

  useEffect(() => {
    if (list.length === 0) dispatch(fetchSymptomList());
  }, [dispatch, list.length]);

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [result]);

  const visible = useMemo(
    () => list.filter((s) => s.includes(search.trim().toLowerCase())),
    [list, search]
  );

  const toggle = (symptom) =>
    setSelected((prev) => (prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]));

  const canSubmit = selected.length > 0 || freeText.trim().length > 0;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const payload = {
      symptoms: selected,
      freeText: freeText.trim() || undefined,
      age: age === '' ? undefined : Number(age),
      gender: gender || undefined,
    };
    const res = await dispatch(analyzeSymptoms(payload));
    if (analyzeSymptoms.rejected.match(res)) toast.error(res.payload || 'Analysis failed');
  };

  const reset = () => {
    setSelected([]);
    setFreeText('');
    setAge('');
    setGender('');
    setSearch('');
    dispatch(clearResult());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const log = result?.log;

  return (
    <>
      <header className="page-header">
        <h1>Symptom checker</h1>
        <p className="muted">Select what you are experiencing, or describe it in your own words.</p>
      </header>

      <Disclaimer />

      <form className="card form-card" onSubmit={onSubmit}>
        <h2>1. Your symptoms</h2>
        <input
          className="search"
          type="search"
          placeholder="Search symptoms (e.g. fever)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search symptoms"
        />
        {listLoading && <Spinner label="Loading symptoms..." />}
        {listError && (
          <div className="alert alert-error" role="alert">
            {listError}{' '}
            <button type="button" className="link-btn" onClick={() => dispatch(fetchSymptomList())}>Retry</button>
          </div>
        )}
        <div className="chips" role="group" aria-label="Symptoms">
          {visible.map((s) => (
            <button
              type="button"
              key={s}
              className={selected.includes(s) ? 'chip chip-on' : 'chip'}
              aria-pressed={selected.includes(s)}
              onClick={() => toggle(s)}
            >
              {titleCase(s)}
            </button>
          ))}
          {!listLoading && visible.length === 0 && list.length > 0 && <p className="muted">No symptoms match “{search}”.</p>}
        </div>
        <p className="muted small">{selected.length} selected</p>

        <h2>2. Anything else? <span className="optional">(optional)</span></h2>
        <label className="field">
          <span>Describe in your own words</span>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="e.g. I have had a sore throat and feel very tired for 3 days"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
          />
        </label>
        <div className="row">
          <label className="field">
            <span>Age</span>
            <input type="number" min="0" max="120" value={age} onChange={(e) => setAge(e.target.value)} />
          </label>
          <label className="field">
            <span>Gender</span>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        {analyzeError && <div className="alert alert-error" role="alert">{analyzeError}</div>}
        <button className="btn btn-primary" disabled={!canSubmit || analyzing}>
          {analyzing ? 'Analysing...' : 'Analyse symptoms'}
        </button>
      </form>

      {result && log && (
        <section ref={resultRef} className="results" aria-live="polite">
          <h2>Your result</h2>

          {log.urgent && (
            <div className="alert alert-urgent" role="alert">
              <strong>Seek urgent medical care.</strong> Your symptoms
              {log.urgentReasons.length > 0 && <> ({log.urgentReasons.join(', ')})</>} can indicate a serious
              problem. If symptoms are severe or getting worse, contact emergency services or go to the nearest hospital.
            </div>
          )}

          <div className="card">
            <p className="eyebrow">Recommended specialty</p>
            <p className="specialty">{log.recommendedSpecialty}</p>
            <p className="muted small">Based on: {log.symptoms.map(titleCase).join(', ')}</p>
          </div>

          <div className="card">
            <h3>Possible conditions</h3>
            <ul className="conditions">
              {log.results.map((r) => (
                <li key={r.name}>
                  <div className="condition-head">
                    <span>{r.name}</span>
                    <span className={`tag tag-${r.severity}`}>{r.severity} severity</span>
                  </div>
                  <div className="bar" role="img" aria-label={`${r.confidence}% match`}>
                    <div className="bar-fill" style={{ width: `${r.confidence}%` }} />
                  </div>
                  <small className="muted">{r.confidence}% match · {r.specialty}</small>
                </li>
              ))}
            </ul>
            <Disclaimer>{result.disclaimer}</Disclaimer>
          </div>

          <h3>Recommended doctors</h3>
          {result.fallbackToGeneralPhysician && (
            <div className="alert alert-info">
              No {log.recommendedSpecialty} is available yet, so we are showing General Physicians instead.
            </div>
          )}
          {result.doctors.length === 0 ? (
            <p className="muted">No doctors are available right now.</p>
          ) : (
            <div className="grid">
              {result.doctors.map((d) => (
                <DoctorCard key={d._id} doctor={d} logId={log._id} />
              ))}
            </div>
          )}
          <div className="actions">
            <Link className="btn btn-ghost" to={`/doctors?specialty=${encodeURIComponent(log.recommendedSpecialty)}`}>
              See all {log.recommendedSpecialty} doctors
            </Link>
            <button className="btn btn-ghost" onClick={reset}>Start a new check</button>
          </div>
        </section>
      )}
    </>
  );
}
