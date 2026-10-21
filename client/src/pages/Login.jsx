import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { clearAuthError, loginUser } from '../store/authSlice.js';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  if (user) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back!');
      navigate(location.state?.from || '/dashboard', { replace: true });
    }
  };

  return (
    <section className="center-card card">
      <h1>Log in</h1>
      <p className="muted">Access your dashboard, symptom history and appointments.</p>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <form onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" value={form.email} onChange={onChange} autoComplete="email" />
          {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" value={form.password} onChange={onChange} autoComplete="current-password" />
          {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}
        </label>
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="muted small">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </section>
  );
}
