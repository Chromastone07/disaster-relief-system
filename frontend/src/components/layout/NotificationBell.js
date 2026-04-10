import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import apiClient from '../../api/client';
import { useToast } from '../../context/ToastContext';
import './NotificationBell.css';

// Haversine formula calculation
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; 
    var dLat = deg2rad(lat2-lat1);  
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
}
  
function deg2rad(deg) { return deg * (Math.PI/180); }

function NotificationBell() {
    const { showToast } = useToast();
    const [notifications, setNotifications] = useState([]);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    
    // Store latest sync time internally
    const lastSyncRef = useRef(new Date());

    useEffect(() => {
        let userLat = null;
        let userLon = null;

        // Acquire user tracking position if possible
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                userLat = pos.coords.latitude;
                userLon = pos.coords.longitude;
            });
        }

        const pollRadar = async () => {
            try {
                const res = await apiClient.get('/disaster/reports/');
                const liveThreats = res.data.filter(r => r.status !== 'resolved' && r.status !== 'false_alarm');
                
                let newAlertsCount = 0;

                liveThreats.forEach(threat => {
                    const threatDate = new Date(threat.created_at);
                    if (threatDate > lastSyncRef.current) {
                        // Found a brand new incident since last check!
                        setNotifications(prev => [threat, ...prev]);
                        newAlertsCount++;

                        // Proximity check (5km)
                        if (userLat && userLon && threat.location) {
                            const parts = threat.location.split(',');
                            if (parts.length === 2) {
                                const tLat = parseFloat(parts[0]);
                                const tLon = parseFloat(parts[1]);
                                if (!isNaN(tLat) && !isNaN(tLon)) {
                                    const dist = getDistanceFromLatLonInKm(userLat, userLon, tLat, tLon);
                                    if (dist <= 5) {
                                        showToast(`PROXIMITY RADAR: Incident reported ${dist.toFixed(1)}km away! Proceed with extreme caution.`, "error");
                                    } else {
                                        showToast(`New Incident Logged: ${threat.title}`, "info");
                                    }
                                } else {
                                    showToast(`New Incident Logged: ${threat.title}`, "info");
                                }
                            }
                        } else {
                            showToast(`New Incident Logged: ${threat.title}`, "info");
                        }
                    }
                });

                lastSyncRef.current = new Date();
            } catch (err) {
                // Silently swallow fetch errors to avoid spamming the console on radar sweeping
            }
        };

        const intervalId = setInterval(pollRadar, 15000); // 15s sweep
        return () => clearInterval(intervalId);
    }, [showToast]);

    return (
        <div className="notification-bell-container" style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => setDropdownOpen(!isDropdownOpen)}>
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span className="badge">{notifications.length > 9 ? '9+' : notifications.length}</span>
                )}
            </button>
            
            {isDropdownOpen && (
                <div className="notification-dropdown glass-panel">
                    <div style={{padding:'12px', borderBottom:'1px solid var(--border-color)'}}>
                        <h4 style={{margin:0, color:'var(--text-primary)'}}>Recent Live Incidents</h4>
                    </div>
                    {notifications.length === 0 ? (
                        <div style={{padding:'20px', textAlign:'center', color:'var(--text-muted)'}}>No new incidents recorded.</div>
                    ) : (
                        <div style={{maxHeight:'300px', overflowY:'auto'}}>
                            {notifications.map((notif, idx) => (
                                <div key={idx} style={{padding:'12px', borderBottom:'1px solid var(--border-color)', fontSize:'0.9rem'}}>
                                    <strong style={{color:'var(--danger)', display:'block'}}>{notif.title}</strong>
                                    <span style={{color:'var(--text-secondary)'}}>{notif.location}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
