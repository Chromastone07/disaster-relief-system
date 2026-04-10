import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, LifeBuoy, CheckCircle, XCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/widgets/Modal';
import './Incidents.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function MapPicker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });
    return position === null ? null : (
        <Marker position={position} />
    );
}

function IncidentsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    
    const [reports, setReports] = useState([]);
    const [helpRequests, setHelpRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [isHelpModalOpen, setHelpModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [repRes, helpRes] = await Promise.all([
                apiClient.get('/disaster/reports/'),
                apiClient.get('/disaster/help')
            ]);
            setReports(repRes.data);
            setHelpRequests(helpRes.data);
        } catch (err) {
            showToast("Failed to fetch disaster feeds.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const geocodeAddress = async (addressStr) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addressStr)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                return `${parseFloat(data[0].lat).toFixed(5)}, ${parseFloat(data[0].lon).toFixed(5)}`;
            }
            return addressStr;
        } catch (err) {
            return addressStr;
        }
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        
        let finalLoc = reportForm.location;

        if (reportForm.locationMode === 'default') {
            if (!navigator.geolocation) {
                showToast('Geolocation is not supported by your browser.', 'error');
                finalLoc = "Location Unavailable";
                await sendReport(finalLoc);
            } else {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        finalLoc = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
                        await sendReport(finalLoc);
                    },
                    async (error) => {
                        showToast("GPS Permission Denied. Address unknown.", "warning");
                        finalLoc = "Location Unknown";
                        await sendReport(finalLoc);
                    }
                );
            }
        } else if (reportForm.locationMode === 'map') {
            if (!mapPosition) {
                showToast('Please click a location on the map!', 'warning');
                return;
            }
            finalLoc = `${mapPosition.lat.toFixed(5)}, ${mapPosition.lng.toFixed(5)}`;
            await sendReport(finalLoc);
        } else {
            showToast("Pinging satellites for location trace...", "info");
            finalLoc = await geocodeAddress(finalLoc);
            await sendReport(finalLoc);
        }
    };

    const sendReport = async (geoTaggedLocation) => {
        try {
            await apiClient.post('/disaster/report', {
                title: reportForm.title,
                description: reportForm.description,
                location: geoTaggedLocation
            });
            showToast("Incident successfully logged to Global Map.", "success");
            setReportModalOpen(false);
            setReportForm({ title: '', description: '', locationMode: 'manual', location: '' });
            setMapPosition(null);
            fetchData(); 
        } catch (err) { 
            showToast("Failed to submit report. Backend restricted.", "error");
        }
    };

    const handleHelpSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/disaster/help', {
                type: helpForm.type,
                description: helpForm.description
            });
            showToast("Emergency request broadcasted. Awaiting assignment.", "success");
            setHelpModalOpen(false);
            setHelpForm({ type: 'food', description: '' });
            fetchData();
        } catch (err) {
            showToast("Help dispatch dropped.", "error");
        }
    };

    const changeReportStatus = async (id, statusLiteral) => {
        try {
            await apiClient.patch(`/disaster/reports/${id}/status`, { status: statusLiteral });
            showToast(`Incident marked as ${statusLiteral.toUpperCase()}`, "success");
            fetchData();
        } catch (err) {
            showToast(`Permission denied updating incident.`, "error");
        }
    };

    const resolveHelp = async (id) => {
        try {
            await apiClient.patch(`/disaster/help/${id}/status`, { status: "resolved" });
            showToast("Help request successfully concluded.", "success");
            fetchData();
        } catch (err) {
            showToast("Cannot modify this request.", "error");
        }
    };

    const [reportForm, setReportForm] = useState({ title: '', description: '', locationMode: 'manual', location: '' });
    const [helpForm, setHelpForm] = useState({ type: 'food', description: '' });
    const [mapPosition, setMapPosition] = useState(null);

    const activeReports = reports.filter(r => r.status?.toLowerCase() !== 'resolved' && r.status?.toLowerCase() !== 'false_alarm');
    const resolvedReports = reports.filter(r => r.status?.toLowerCase() === 'resolved' || r.status?.toLowerCase() === 'false_alarm');

    const activeHelps = helpRequests.filter(h => h.status?.toLowerCase() !== 'resolved');
    const resolvedHelps = helpRequests.filter(h => h.status?.toLowerCase() === 'resolved');

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Disaster Incidents</h1>
                    <p>Live active crisis reports and help requests.</p>
                </div>
                {user && (
                    <div className="header-actions-row">
                        <button className="primary-btn outline" onClick={() => setHelpModalOpen(true)}>
                            <LifeBuoy size={18} /> Request Help
                        </button>
                        <button className="primary-btn" onClick={() => setReportModalOpen(true)}>
                            <Plus size={18} /> Report Incident
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="loading-state">Loading disaster feeds...</div>
            ) : (
                <>
                    <h2 style={{color:'var(--text-primary)', marginBottom:'-16px', fontSize:'1.2rem'}}>Active Incident Reports</h2>
                    <div className="incidents-grid">
                        {activeReports.length === 0 ? (
                            <div className="empty-state">No active incidents reported.</div>
                        ) : (
                            activeReports.map((report) => (
                                <div key={report.id} className="incident-card glass-panel">
                                    <div className="card-header">
                                        <div className={`severity-badge ${report.status?.toLowerCase() === 'resolved' ? 'low' : 'critical'}`}>
                                            <AlertTriangle size={14} />
                                            {report.status || 'REPORTED'}
                                        </div>
                                        <span className="incident-type" style={{fontWeight:600}}>{report.title}</span>
                                    </div>
                                    <h3 className="incident-title" style={{fontSize:'0.9rem', color:'var(--text-secondary)'}}>{report.location}</h3>
                                    <p className="incident-desc">{report.description || 'No description provided.'}</p>
                                    <div className="card-footer" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                        <span className="location-tag">Date: {new Date(report.created_at).toLocaleDateString()}</span>
                                        {user && user.role === 'admin' && (
                                            <div style={{display:'flex', gap:'8px'}}>
                                                <button onClick={() => changeReportStatus(report.id, 'false_alarm')} className="icon-btn" style={{color: 'var(--danger)'}} title="Flag False Alarm">
                                                    <XCircle size={18} />
                                                </button>
                                                <button onClick={() => changeReportStatus(report.id, 'resolved')} className="icon-btn" style={{color: 'var(--success)'}} title="Mark Resolved">
                                                    <CheckCircle size={18} />
                                                </button>
                                            </div>
                                        )}
                                        {user && user.role !== 'admin' && (
                                            <button onClick={() => showToast("Only system admins can verify and clear crisis tags.", "warning")} className="icon-btn" style={{opacity:0.3}} title="Clearance Required">
                                                 <CheckCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{height: '24px'}} />

                    <h2 style={{color:'var(--text-primary)', marginBottom: '-16px', fontSize:'1.2rem'}}>Emergency Help Requests</h2>
                    <div className="incidents-grid">
                        {activeHelps.length === 0 ? (
                            <div className="empty-state">No help requests open.</div>
                        ) : (
                            activeHelps.map((req) => (
                                <div key={req.id} className="incident-card glass-panel" style={{borderLeft: '4px solid var(--info)'}}>
                                    <div className="card-header">
                                        <div className={`severity-badge ${req.status?.toLowerCase() === 'resolved' ? 'low' : 'medium'}`}>
                                            <LifeBuoy size={14} />
                                            {req.status || 'REPORTED'}
                                        </div>
                                        <span className="incident-type">{req.type.toUpperCase()}</span>
                                    </div>
                                    <p className="incident-desc">{req.description}</p>
                                    <div className="card-footer" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                        <span className="location-tag">REQ #{req.id}</span>
                                        {user && user.role === 'admin' && (
                                            <button onClick={() => resolveHelp(req.id)} className="icon-btn" style={{color: 'var(--success)'}} title="Mark Resolved">
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {/* PAST CALAMITIES ARCHIVE */}
                    <div style={{height: '48px'}} />
                    <h2 style={{color:'var(--text-muted)', marginBottom: '-16px', fontSize:'1.2rem'}}>Past Calamities / Archive</h2>
                    <div className="incidents-grid">
                        {resolvedReports.length === 0 && resolvedHelps.length === 0 ? (
                            <div className="empty-state">No past historical calamities on record.</div>
                        ) : (
                            <>
                                {resolvedReports.map((report) => (
                                    <div key={`res-rep-${report.id}`} className="incident-card glass-panel" style={{opacity: 0.6}}>
                                        <div className="card-header">
                                            <div className={`severity-badge ${report.status === 'false_alarm' ? 'critical' : 'low'}`}>
                                                {report.status.toUpperCase()}
                                            </div>
                                            <span className="incident-type">{report.title}</span>
                                        </div>
                                        <p className="incident-desc" style={{fontSize:'0.85rem'}}>{report.description || 'Archived record'}</p>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </>
            )}

            <Modal isOpen={isReportModalOpen} onClose={() => setReportModalOpen(false)} title="Report New Incident">
                <form className="modal-form" onSubmit={handleReportSubmit}>
                    <div>
                        <label>Incident Title</label>
                        <input type="text" value={reportForm.title} onChange={e => setReportForm({...reportForm, title: e.target.value})} required placeholder="E.g. Flood on Main Street" />
                    </div>
                    <div>
                        <label>Description</label>
                        <textarea value={reportForm.description} onChange={e => setReportForm({...reportForm, description: e.target.value})} required rows={3}></textarea>
                    </div>
                    <div>
                        <label>Location Mode</label>
                        <select value={reportForm.locationMode} onChange={e => setReportForm({...reportForm, locationMode: e.target.value})}>
                            <option value="manual">Enter City / General Region</option>
                            <option value="map">Interactive Map Selector</option>
                            <option value="default">Extract Precise GPS Coordinates</option>
                        </select>
                    </div>
                    {reportForm.locationMode === 'manual' && (
                        <div>
                            <label>General Region</label>
                            <input type="text" value={reportForm.location} onChange={e => setReportForm({...reportForm, location: e.target.value})} required placeholder="E.g., Chicago, IL" />
                        </div>
                    )}
                    {reportForm.locationMode === 'map' && (
                        <div style={{height: '250px', width: '100%', marginBottom: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', overflow:'hidden'}}>
                            <MapContainer center={[37.7749, -122.4194]} zoom={4} style={{height: '100%', width: '100%'}}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                <MapPicker position={mapPosition} setPosition={setMapPosition} />
                            </MapContainer>
                        </div>
                    )}
                    <div className="modal-form-actions">
                        <button type="button" className="btn-secondary" onClick={() => setReportModalOpen(false)}>Cancel</button>
                        <button type="submit" className="primary-btn">Submit Report</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} title="Request Emergency Help">
                <form className="modal-form" onSubmit={handleHelpSubmit}>
                    <div>
                        <label>Required Resource Type</label>
                        <select value={helpForm.type} onChange={e => setHelpForm({...helpForm, type: e.target.value})}>
                            <option value="food">Food & Water</option>
                            <option value="medical">Medical Assistance</option>
                            <option value="shelter">Shelter</option>
                            <option value="rescue">Evacuation / Rescue</option>
                        </select>
                    </div>
                    <div>
                        <label>Specific Details</label>
                        <textarea value={helpForm.description} onChange={e => setHelpForm({...helpForm, description: e.target.value})} required rows={3}></textarea>
                    </div>
                    <div className="modal-form-actions">
                        <button type="button" className="btn-secondary" onClick={() => setHelpModalOpen(false)}>Cancel</button>
                        <button type="submit" className="primary-btn">Submit Request</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default IncidentsPage;
