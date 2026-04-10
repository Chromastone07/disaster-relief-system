import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, AlertTriangle, Users, Settings, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const publicNavItems = [
  { name: 'Dashboard', path: '/', icon: Home, exact: true },
  { name: 'Incidents', path: '/incidents', icon: AlertTriangle }
];

const protectedNavItems = [
  { name: 'Volunteers', path: '/volunteers', icon: Users },
  { name: 'Inventory', path: '/inventory', icon: Package },
  { name: 'Settings', path: '/settings', icon: Settings },
];

function Sidebar() {
  const { user } = useAuth();
  
  const navItems = user 
    ? [...publicNavItems, ...protectedNavItems] 
    : publicNavItems;

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-logo">
        <div className="logo-icon animate-pulse"></div>
        <h2>ReliefSys</h2>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index}>
                <NavLink 
                  to={item.path} 
                  className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}
                  end={item.exact}
                >
                  <Icon size={20} className="nav-icon" />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>System Online</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
