import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Spinner from './Spinner.jsx';

// Wraps private pages. Redirects to /login (remembering where the user wanted to go).
export default function ProtectedRoute() {
  const { user, initializing } = useSelector((s) => s.auth);
  const location = useLocation();

  if (initializing) return <Spinner label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}
