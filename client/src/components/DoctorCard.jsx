import { Link } from 'react-router-dom';

export default function DoctorCard({ doctor, logId }) {
  const initials = doctor.name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');
  const to = `/doctors/${doctor._id}${logId ? `?log=${logId}` : ''}`;

  return (
    <article className="card doctor-card">
      <div className="avatar" aria-hidden="true">{initials}</div>
      <div className="doctor-info">
        <h3>{doctor.name}</h3>
        <p className="muted">{doctor.specialty}</p>
        <ul className="meta">
          <li>{doctor.experience} yrs exp.</li>
          <li>★ {doctor.rating.toFixed(1)}</li>
          <li>₹{doctor.fees}</li>
        </ul>
        {doctor.bio && <p className="doctor-bio">{doctor.bio}</p>}
      </div>
      <Link to={to} className="btn btn-primary btn-sm">View &amp; book</Link>
    </article>
  );
}
