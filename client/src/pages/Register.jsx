import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { clearAuthError, registerUser } from '../store/authSlice.js';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  if (user) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const { name, email, password } = form;
    const result = await dispatch(registerUser({ name: name.trim(), email, password }));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created');
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <section className="center-card card">
      <h1>Create your account</h1>
      <p className="muted">It takes less than a minute.</p>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <form onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Full name</span>
          <input name="name" value={form.name} onChange={onChange} autoComplete="name" />
          {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" value={form.email} onChange={onChange} autoComplete="email" />
          {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" value={form.password} onChange={onChange} autoComplete="new-password" />
          {fieldErrors.password && <small className="field-error">{fieldErrors.password}</small>}
        </label>
        <label className="field">
          <span>Confirm password</span>
          <input type="password" name="confirm" value={form.confirm} onChange={onChange} autoComplete="new-password" />
          {fieldErrors.confirm && <small className="field-error">{fieldErrors.confirm}</small>}
        </label>
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="muted small">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
