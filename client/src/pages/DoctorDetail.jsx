import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../api/axios.js';
import { bookAppointment } from '../store/appointmentSlice.js';
import { formatDate, formatTime, todayString } from '../utils/format.js';
import Spinner from '../components/Spinner.jsx';

export default function DoctorDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const logId = params.get('log') || undefined;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const booking = useSelector((s) => s.appointments.booking);

  const [doctor, setDoctor] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState(null); // null = not loaded yet
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    api
      .get(`/doctors/${id}`)
      .then(({ data }) => setDoctor(data.doctor))
      .catch((err) => setLoadError(getErrorMessage(err)));
  }, [id]);

  const loadSlots = useCallback(
    async (d) => {
      setSlotsLoading(true);
      setTime('');
      try {
        const { data } = await api.get(`/doctors/${id}/slots`, { params: { date: d } });
        setSlots(data.slots);
      } catch (err) {
        setSlots([]);
        toast.error(getErrorMessage(err));
      } finally {
        setSlotsLoading(false);
      }
    },
    [id]
  );

  const onDateChange = (e) => {
    setDate(e.target.value);
    if (e.target.value) loadSlots(e.target.value);
    else setSlots(null);
  };

  const onBook = async () => {
    const res = await dispatch(bookAppointment({ doctorId: id, date, timeSlot: time, symptomLogId: logId, notes: notes.trim() || undefined }));
    if (bookAppointment.fulfilled.match(res)) {
      toast.success('Appointment booked!');
      navigate('/dashboard');
    } else {
      toast.error(res.payload || 'Could not book appointment');
      loadSlots(date); // slot may have been taken meanwhile
    }
  };

  if (loadError) {
    return (
      <div className="card center-card">
        <h1>Doctor not found</h1>
        <p className="muted">{loadError}</p>
        <Link to="/doctors" className="btn btn-primary">Back to doctors</Link>
      </div>
    );
  }
  if (!doctor) return <Spinner label="Loading doctor..." />;

  return (
    <>
      <Link to="/doctors" className="back-link">← All doctors</Link>
      <div className="detail-layout">
        <section className="card">
          <h1>{doctor.name}</h1>
          <p className="specialty small-spec">{doctor.specialty}</p>
          <ul className="meta meta-lg">
            <li>{doctor.experience} years experience</li>
            <li>★ {doctor.rating.toFixed(1)} rating</li>
            <li>₹{doctor.fees} consultation</li>
          </ul>
          {doctor.bio && <p>{doctor.bio}</p>}
          {logId && <div className="alert alert-info">Your symptom report will be attached to this appointment.</div>}
        </section>

        <section className="card">
          <h2>Book an appointment</h2>
          <label className="field">
            <span>Choose a date</span>
            <input type="date" min={todayString()} value={date} onChange={onDateChange} />
          </label>

          {slotsLoading && <Spinner label="Checking availability..." />}
          {!slotsLoading && slots && slots.length === 0 && (
            <p className="muted">No slots on this day. Try another date.</p>
          )}
          {!slotsLoading && slots && slots.length > 0 && (
            <>
              <p className="muted small">Available times on {formatDate(date)}</p>
              <div className="chips" role="group" aria-label="Time slots">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    className={time === s.time ? 'chip chip-on' : 'chip'}
                    aria-pressed={time === s.time}
                    onClick={() => setTime(s.time)}
                    title={s.available ? '' : 'Already booked'}
                  >
                    {formatTime(s.time)}
                    {!s.available && ' (booked)'}
                  </button>
                ))}
              </div>
            </>
          )}

          <label className="field">
            <span>Notes for the doctor <span className="optional">(optional)</span></span>
            <textarea rows={2} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <button className="btn btn-primary btn-block" disabled={!date || !time || booking} onClick={onBook}>
            {booking ? 'Booking...' : time ? `Confirm ${formatTime(time)}` : 'Select a time'}
          </button>
        </section>
      </div>
    </>
  );
}
