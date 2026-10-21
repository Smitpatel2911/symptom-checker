import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { cancelAppointment, fetchMyAppointments } from '../store/appointmentSlice.js';
import { fetchHistory } from '../store/symptomSlice.js';
import { formatDate, formatDateTime, formatTime, isUpcoming, titleCase } from '../utils/format.js';
import Spinner from '../components/Spinner.jsx';

function AppointmentRow({ a, onCancel }) {
  const upcoming = isUpcoming(a);
  return (
    <li className="row-item">
      <div>
        <strong>{a.doctor?.name || 'Doctor removed'}</strong>
        <p className="muted small">
          {a.doctor?.specialty} · {formatDate(a.date)} at {formatTime(a.timeSlot)}
        </p>
      </div>
      <div className="row-actions">
        <span className={`tag tag-${a.status === 'Confirmed' ? 'low' : 'muted'}`}>{a.status}</span>
        {upcoming && (
          <button className="btn btn-ghost btn-sm" onClick={() => onCancel(a._id)}>Cancel</button>
        )}
      </div>
    </li>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { items: appointments, loading: apptLoading, error: apptError } = useSelector((s) => s.appointments);
  const { history, historyLoading } = useSelector((s) => s.symptoms);

  useEffect(() => {
    dispatch(fetchMyAppointments());
    dispatch(fetchHistory());
  }, [dispatch]);

  const upcoming = appointments.filter((a) => isUpcoming(a)).sort((a, b) => (a.date + a.timeSlot).localeCompare(b.date + b.timeSlot));
  const past = appointments.filter((a) => !isUpcoming(a));

  const onCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    const res = await dispatch(cancelAppointment(id));
    if (cancelAppointment.fulfilled.match(res)) toast.success('Appointment cancelled');
    else toast.error(res.payload || 'Could not cancel');
  };

  return (
    <>
      <header className="page-header">
        <h1>Hello, {user.name.split(' ')[0]}</h1>
        <p className="muted">Your appointments and symptom checks in one place.</p>
      </header>

      <div className="stats">
        <div className="card stat"><span className="stat-num">{upcoming.length}</span><span>Upcoming appointments</span></div>
        <div className="card stat"><span className="stat-num">{history.length}</span><span>Symptom checks</span></div>
        <Link to="/check" className="card stat stat-cta"><span className="stat-num">→</span><span>Check new symptoms</span></Link>
      </div>

      <section className="card">
        <h2>Upcoming appointments</h2>
        {apptLoading && <Spinner />}
        {apptError && <div className="alert alert-error">{apptError}</div>}
        {!apptLoading && upcoming.length === 0 && (
          <p className="muted">
            Nothing scheduled. <Link to="/check">Check your symptoms</Link> or <Link to="/doctors">browse doctors</Link>.
          </p>
        )}
        <ul className="list">
          {upcoming.map((a) => <AppointmentRow key={a._id} a={a} onCancel={onCancel} />)}
        </ul>
      </section>

      {past.length > 0 && (
        <section className="card">
          <h2>Past &amp; cancelled</h2>
          <ul className="list">
            {past.map((a) => <AppointmentRow key={a._id} a={a} onCancel={onCancel} />)}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>Symptom check history</h2>
        {historyLoading && <Spinner />}
        {!historyLoading && history.length === 0 && <p className="muted">No symptom checks yet.</p>}
        <ul className="list">
          {history.map((h) => (
            <li key={h._id} className="row-item">
              <div>
                <strong>{h.results[0]?.name || 'No result'}</strong>
                <p className="muted small">
                  {formatDateTime(h.createdAt)} · {h.symptoms.map(titleCase).join(', ')}
                </p>
              </div>
              <div className="row-actions">
                {h.urgent && <span className="tag tag-high">urgent</span>}
                <Link
                  className="btn btn-ghost btn-sm"
                  to={`/doctors?specialty=${encodeURIComponent(h.recommendedSpecialty)}`}
                >
                  {h.recommendedSpecialty}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
