import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, User, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import apiClient from '../../api/client';
import './Header.css';

function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        try {
          const res = await apiClient.get('/maps/notifications');
          setNotifications(res.data);
        } catch (err) { }
      };
      fetchNotifs();
      // Polling could go here
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleRead = async (id, is_read) => {
    if (is_read) return;
    try {
      await apiClient.patch(`/maps/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) { }
  };

  return (
    <header className="header glass-panel">
      <div className="header-search">
        <Search size={20} className="search-icon" />
        <input type="text" placeholder="Search..." />
      </div>

      <div className="header-actions">
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <NotificationBell />

        <div className="user-profile">
          <div className="avatar">
            <User size={18} />
          </div>
          <div className="user-info">
            {user ? (
                <>
                    <span className="user-name">{user.name}</span>
                    <button className="user-role" onClick={logout} style={{textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0}}>Log Out</button>
                </>
            ) : (
                <>
                    <span className="user-name">Guest</span>
                    <Link to="/login" className="user-role" style={{textDecoration: 'underline'}}>Sign In</Link>
                </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
