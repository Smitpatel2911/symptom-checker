import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDoctors, fetchSpecialties } from '../store/doctorSlice.js';
import DoctorCard from '../components/DoctorCard.jsx';
import Spinner from '../components/Spinner.jsx';

export default function Doctors() {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const { items, specialties, loading, error } = useSelector((s) => s.doctors);

  const specialty = params.get('specialty') || '';
  const sort = params.get('sort') || 'rating';

  useEffect(() => {
    dispatch(fetchSpecialties());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchDoctors({ specialty, sort }));
  }, [dispatch, specialty, sort]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <>
      <header className="page-header">
        <h1>Find a doctor</h1>
        <p className="muted">Filter by specialty and sort by rating, fees or experience.</p>
      </header>

      <div className="toolbar card">
        <label className="field">
          <span>Specialty</span>
          <select value={specialty} onChange={(e) => update('specialty', e.target.value)}>
            <option value="">All specialties</option>
            {specialties.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Sort by</span>
          <select value={sort} onChange={(e) => update('sort', e.target.value)}>
            <option value="rating">Highest rated</option>
            <option value="fees">Lowest fees</option>
            <option value="experience">Most experienced</option>
          </select>
        </label>
      </div>

      {loading && <Spinner label="Loading doctors..." />}
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {!loading && !error && items.length === 0 && <p className="muted">No doctors found for this filter.</p>}
      <div className="grid">
        {items.map((d) => (
          <DoctorCard key={d._id} doctor={d} />
        ))}
      </div>
    </>
  );
}
