import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { logout } from '../store/authSlice.js';

export default function Navbar() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out');
    navigate('/login');
  };

  const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to={user ? '/dashboard' : '/'} className="brand">
          <span className="brand-mark" aria-hidden="true">+</span>
          CareCompass
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              <NavLink to="/check" className={linkClass}>Check symptoms</NavLink>
              <NavLink to="/doctors" className={linkClass}>Doctors</NavLink>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
              <span className="nav-user">{user.name.split(' ')[0]}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Log in</NavLink>
              <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
