import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from './components/widgets/StatCard';
import Modal from './components/widgets/Modal';
import DisasterMap from './components/maps/DisasterMap';
import { AlertTriangle, Users, HeartPulse, Package } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import apiClient from './api/client';
import './Dashboard.css';

function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [serverStatus, setServerStatus] = useState("Connecting...");
    const [isConnected, setIsConnected] = useState(false);
    
    // Realtime Database Metrics
    const [activeIncidents, setActiveIncidents] = useState([]);
    const [deployedVols, setDeployedVols] = useState([]);
    const [pendingHelp, setPendingHelp] = useState([]);
    const [totalStockpiles, setTotalStockpiles] = useState([]);

    const [modalData, setModalData] = useState({ isOpen: false, title: '', items: [] });
    
    const handleDrillDown = (title, items) => {
        if (!items || items.length === 0) {
            alert(`No records found for ${title}. Metrics show 0.`);
            return;
        }
        setModalData({ isOpen: true, title, items });
    };

    const fetchDashboardMetrics = async () => {
        try {
            // Ping server health
            await fetch("http://127.0.0.1:8000/");
            setServerStatus("Online - Syncing Live Data");
            setIsConnected(true);
            
            // Only fetch deeper metrics if token exists or server is open
            const [repRes, asgnRes, helpRes, resRes] = await Promise.all([
                apiClient.get('/disaster/reports'),
                apiClient.get('/volunteers/assignments').catch(() => ({ data: [] })),
                apiClient.get('/disaster/help').catch(() => ({ data: [] })),
                apiClient.get('/disaster/inventory').catch(() => ({ data: [] }))
            ]);
            
            // Calculate true operational loads
            const liveReports = repRes.data.filter(r => r.status !== 'resolved');
            setActiveIncidents(liveReports);
            
            const liveAssignments = asgnRes.data.filter(a => a.status !== 'completed');
            setDeployedVols(liveAssignments);
            
            const liveHelpReqs = helpRes.data.filter(h => h.status !== 'resolved');
            setPendingHelp(liveHelpReqs);
            
            setTotalStockpiles(resRes.data);
            
        } catch (err) {
            setServerStatus("Offline - Backend Unavailable");
            setIsConnected(false);
        }
    };

    useEffect(() => {
        fetchDashboardMetrics();
    }, [user]);

    return (
        <div className="dashboard-container animate-fade-in">
            <div className="dashboard-header">
                <div>
                  <h1 className="dashboard-title">Overview</h1>
                  <p className="dashboard-subtitle">Real-time Disaster Response Metrics</p>
                </div>
                <div className={`server-status ${isConnected ? 'online' : 'offline'}`}>
                  <span className="status-indicator"></span>
                  {serverStatus}
                </div>
            </div>

            <div className="stats-grid">
                <StatCard 
                  title="Active Incidents" 
                  value={activeIncidents.length.toString()} 
                  trend="Sourced from DB"
                  icon={AlertTriangle} 
                  colorClass="danger" 
                  onClick={() => handleDrillDown("Active Incidents List", activeIncidents.map(i => `[${i.status.toUpperCase()}] ${i.title} // Loc: ${i.location}`))}
                />
                <StatCard 
                  title="Volunteers Deployed" 
                  value={deployedVols.length.toString()} 
                  trend="Active Missions"
                  icon={Users} 
                  colorClass="success" 
                  onClick={() => handleDrillDown("Deployed Field Connects", deployedVols.map(v => `Volunteer Task Force ID: ${v.volunteer_id} assigned to REQ #${v.request_id} [${v.status}]`))}
                />
                <StatCard 
                  title="Pending Requests" 
                  value={pendingHelp.length.toString()} 
                  trend="Await Dispatch"
                  icon={HeartPulse} 
                  colorClass="warning"
                  onClick={() => handleDrillDown("Pending SOS", pendingHelp.map(p => `[${p.status.toUpperCase()}] Type: ${p.type.toUpperCase()}`))}
                />
                <StatCard 
                  title="Total Relief Units" 
                  value={totalStockpiles.reduce((acc, curr) => acc + curr.quantity, 0).toString()} 
                  trend="Registered Caches"
                  icon={Package} 
                  colorClass="info" 
                  onClick={() => handleDrillDown("Asset Ledger", totalStockpiles.map(s => `${s.quantity} units of ${s.item} (${s.category?.toUpperCase()})`))}
                />
            </div>

            <div className="main-content-grid">
              <div className="map-section">
                <DisasterMap />
              </div>
              <div className="incidents-section glass-panel">
                <div className="section-header">
                  <h3>Urgent Incidents Feed</h3>
                  <button className="view-all-btn" onClick={() => navigate('/incidents')}>View All</button>
                </div>
                <div className="incident-list">
                  {activeIncidents.length === 0 ? (
                      <div style={{padding: '24px', textAlign: 'center', color: 'var(--text-muted)'}}>
                          Zero active incidents registered. All regions clear.
                      </div>
                  ) : (
                      activeIncidents.slice(0,5).map((incident) => (
                        <div key={incident.id} className="incident-item">
                          <div className={`incident-icon ${incident.status === 'in_progress' ? 'warning' : 'danger'}`}>
                            <AlertTriangle size={18} />
                          </div>
                          <div className="incident-details">
                            <h4>{incident.title}</h4>
                            <p>{incident.location}</p>
                          </div>
                          <div className="incident-time">
                            {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
            
            <Modal isOpen={modalData.isOpen} onClose={() => setModalData({ ...modalData, isOpen: false })} title={modalData.title}>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-primary)' }}>
                        {modalData.items.map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </Modal>
        </div>
    );
}

export default Dashboard;