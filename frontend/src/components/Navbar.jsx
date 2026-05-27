import { useAuth } from '../context/AuthContext';
import { Flame, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Flame size={24} className="logo-icon" />
        <span>StreakBuilder</span>
      </div>
      <div className="navbar-right">
        <span className="navbar-email">{user?.email}</span>
        <button className="btn-logout" onClick={logout}>
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </nav>
  );
}
