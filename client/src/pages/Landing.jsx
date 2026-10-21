import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Disclaimer from '../components/Disclaimer.jsx';

export default function Landing() {
  const { user } = useSelector((s) => s.auth);

  return (
    <section className="hero">
      <p className="eyebrow">AI-assisted symptom checker</p>
      <h1>Know which doctor to see, before you book.</h1>
      <p className="lead">
        Describe how you feel. CareCompass suggests possible conditions, points you to the right specialty,
        and lets you book a slot with a matching doctor in one place.
      </p>
      <div className="hero-actions">
        {user ? (
          <Link to="/check" className="btn btn-primary">Check my symptoms</Link>
        ) : (
          <>
            <Link to="/register" className="btn btn-primary">Create free account</Link>
            <Link to="/login" className="btn btn-ghost">I already have an account</Link>
          </>
        )}
      </div>

      <div className="steps">
        <div className="step">
          <span className="step-num">1</span>
          <h3>Tell us your symptoms</h3>
          <p>Pick from a list or describe them in your own words.</p>
        </div>
        <div className="step">
          <span className="step-num">2</span>
          <h3>Get a specialty suggestion</h3>
          <p>See likely conditions with confidence, and urgent-care warnings when needed.</p>
        </div>
        <div className="step">
          <span className="step-num">3</span>
          <h3>Book the right doctor</h3>
          <p>Choose an available slot. Double bookings are prevented automatically.</p>
        </div>
      </div>

      <Disclaimer />
    </section>
  );
}
