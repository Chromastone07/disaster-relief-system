import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Bell, Moon, Sun, User, Database } from 'lucide-react';
import './Settings.css';

function SettingsPage() {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="settings-container animate-fade-in">
            <div className="settings-header">
                <div>
                    <h1>Settings</h1>
                    <p>Manage your account preferences and application layout.</p>
                </div>
            </div>

            <div className="settings-grid">
                
                {/* Account Details */}
                <div className="settings-card glass-panel">
                    <div className="settings-card-header">
                        <User className="icon-primary" size={24} />
                        <h3>Account Identity</h3>
                    </div>
                    <div className="settings-content">
                        {user ? (
                            <>
                                <div className="setting-row">
                                    <span className="setting-label">Name</span>
                                    <span className="setting-value">{user.name}</span>
                                </div>
                                <div className="setting-row">
                                    <span className="setting-label">Email</span>
                                    <span className="setting-value">{user.email}</span>
                                </div>
                                <div className="setting-row">
                                    <span className="setting-label">Clearance Role</span>
                                    <span className="setting-value" style={{ textTransform: 'capitalize', color: 'var(--primary)'}}>
                                        {user.role}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="setting-row">
                                <span className="setting-label">Status</span>
                                <span className="setting-value">Guest / Anonymous</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preferences */}
                <div className="settings-card glass-panel">
                    <div className="settings-card-header">
                        <Moon className="icon-primary" size={24} />
                        <h3>Visual Preferences</h3>
                    </div>
                    <div className="settings-content">
                        <div className="setting-row">
                            <span className="setting-label">Dark Mode UI</span>
                            <button className="primary-btn outline" onClick={toggleTheme} style={{padding: '6px 12px', display: 'flex', gap: '8px', alignItems:'center'}}>
                                {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
                                {theme === 'dark' ? 'Disable Dark Mode' : 'Enable Dark Mode'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="settings-card glass-panel">
                    <div className="settings-card-header">
                        <Bell className="icon-primary" size={24} />
                        <h3>Notifications</h3>
                    </div>
                    <div className="settings-content">
                        <div className="setting-row">
                            <span className="setting-label">Push Alerts</span>
                            <span className="setting-value" style={{color:'var(--success)'}}>Enabled by Browser</span>
                        </div>
                        <div className="setting-row">
                            <span className="setting-label">Email Subscriptions</span>
                            <span className="setting-value" style={{color:'var(--text-muted)'}}>Manage via Backend</span>
                        </div>
                    </div>
                </div>

                {/* System Diagnostics */}
                {user?.role === 'admin' && (
                    <div className="settings-card glass-panel" style={{borderLeft: '4px solid #ef4444'}}>
                        <div className="settings-card-header">
                            <Database className="icon-primary" size={24} color="#ef4444" />
                            <h3>Server Diagnostics</h3>
                        </div>
                        <div className="settings-content">
                            <div className="setting-row">
                                <span className="setting-label">Database Version</span>
                                <span className="setting-value">PostgreSQL 14+</span>
                            </div>
                            <div className="setting-row">
                                <span className="setting-label">FastAPI Node</span>
                                <span className="setting-value">v0.100+ (Active)</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SettingsPage;
