import React, { useState, useEffect } from 'react';
import { Users, Crosshair, XOctagon, CheckCircle, ShieldAlert } from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/widgets/Modal';
import './Volunteers.css';

function VolunteersPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    
    const [volunteers, setVolunteers] = useState([]);
    const [helpRequests, setHelpRequests] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isRegModalOpen, setRegModalOpen] = useState(false);
    const [isDeployModalOpen, setDeployModalOpen] = useState(false);
    
    const [selectedVolId, setSelectedVolId] = useState(null);
    const [selectedRequestId, setSelectedRequestId] = useState('');
    const [skills, setSkills] = useState('');
    const [allowLocation, setAllowLocation] = useState(false);

    const fetchData = async () => {
        try {
            // Admins fetch everything. Users fetch assignments/help natively.
            const pHelp = apiClient.get('/disaster/help');
            const pAsgn = user?.role === 'admin' ? apiClient.get('/volunteers/assignments') : Promise.resolve({data: []});
            const pVols = user ? apiClient.get('/volunteers/') : Promise.resolve({data: []});
            
            const [helpRes, asgnRes, volRes] = await Promise.all([pHelp, pAsgn, pVols]);
            
            setHelpRequests(helpRes.data);
            setAssignments(asgnRes.data);
            setVolunteers(volRes.data);
        } catch (err) {
            console.error("Partial fetch failure");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        let targetLocation = null;

        if (allowLocation) {
            if (!navigator.geolocation) {
                showToast("Geolocation not supported. Location hidden.", "warning");
            } else {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    targetLocation = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
                } catch (error) {
                    showToast("GPS denied. Mapped generically.", "warning");
                }
            }
        }

        try {
            await apiClient.post('/volunteers/register', { 
                skills, 
                location: targetLocation 
            });
            showToast("Successfully queued as a system responder. Awaiting admin clearance.", "success");
            setRegModalOpen(false);
            setSkills('');
            setAllowLocation(false);
            fetchData();
        } catch (err) {
            showToast("Failed to register. Ensure you aren't already registered.", "error");
        }
    };

    const handleDeploySubmit = async (e) => {
        e.preventDefault();
        if (!selectedRequestId) return;
        try {
            await apiClient.post('/volunteers/assign', {
                volunteer_id: selectedVolId,
                request_id: parseInt(selectedRequestId)
            });
            showToast("Volunteer dispatched securely.", "success");
            setDeployModalOpen(false);
            setSelectedVolId(null);
            setSelectedRequestId('');
            fetchData();
        } catch(err) {
            showToast("Deployment failed.", "error");
        }
    };

    const resolveAssignment = async (id, statusLiteral) => {
        try {
            await apiClient.patch(`/volunteers/assignments/${id}/status`, { status: statusLiteral });
            showToast(statusLiteral === 'completed' ? "Operation Finished." : "Deployment Cancelled.", "success");
            fetchData();
        } catch (err) {
            showToast("Action restricted by backend.", "error");
        }
    };

    const resolveRegistration = async (id, statusLiteral) => {
        try {
            await apiClient.patch(`/volunteers/${id}/approve`, { status: statusLiteral });
            showToast(`Volunteer Registration ${statusLiteral}`, "info");
            fetchData();
        } catch(err) {
            showToast("Unable to process approval.", "error");
        }
    };

    // Filters
    const pendingVolunteers = volunteers.filter(v => v.approval_status === "pending");
    const activeVolunteers = volunteers.filter(v => v.approval_status === "approved" || !v.approval_status);

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Volunteer Network</h1>
                    <p>Manage and dispatch registered volunteers to ongoing crises.</p>
                </div>
                {user && user.role !== 'admin' && volunteers.length === 0 && (
                    <button className="primary-btn" onClick={() => setRegModalOpen(true)}>
                        <ShieldAlert size={16} /> Request Enrollment
                    </button>
                )}
                {user && user.role !== 'admin' && volunteers.length > 0 && (
                    <div className={`severity-badge ${volunteers[0].approval_status === 'approved' ? 'low' : 'medium'}`} style={{padding:'8px 16px', fontSize:'0.9rem'}}>
                        Status: {volunteers[0].approval_status.toUpperCase()}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="loading-state">Syncing network data...</div>
            ) : (
                <>
                    {user?.role === 'admin' && pendingVolunteers.length > 0 && (
                        <>
                            <h2 style={{color:'var(--warning)', marginBottom: '-16px', fontSize:'1.2rem'}}>Admin Action Queue (Pending Clearances)</h2>
                            <div className="volunteers-grid" style={{marginBottom: '32px'}}>
                                {pendingVolunteers.map(vol => (
                                    <div key={vol.id} className="vol-card glass-panel" style={{border: '1px solid var(--warning)'}}>
                                        <div className="vol-info">
                                            <h3>Applicant ID: {vol.user_id}</h3>
                                            <p className="vol-skills">Skills: {vol.skills}</p>
                                        </div>
                                        <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
                                            <button className="assign-btn" style={{color: 'var(--danger)', borderColor: 'var(--danger)', flex:1}} onClick={() => resolveRegistration(vol.id, 'denied')}>
                                                <XOctagon size={16} /> Deny
                                            </button>
                                            <button className="assign-btn" style={{color: 'var(--success)', borderColor: 'var(--success)', flex: 1}} onClick={() => resolveRegistration(vol.id, 'approved')}>
                                                <CheckCircle size={16} /> Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {user?.role === 'admin' && (
                        <>
                            <h2 style={{color:'var(--text-primary)', marginBottom: '-16px', fontSize:'1.2rem'}}>Active Field Assignments</h2>
                            <div className="volunteers-grid" style={{marginBottom: '32px'}}>
                                {assignments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length === 0 ? (
                                     <div className="empty-state" style={{gridColumn: '1 / -1'}}>No volunteers are currently deployed.</div>
                                ) : (
                                    assignments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').map(asgn => (
                                        <div key={asgn.id} className="vol-card glass-panel" style={{border: '1px solid var(--accent-main)'}}>
                                            <div className="vol-info">
                                                <h3>Task Force #{asgn.volunteer_id}</h3>
                                                <p className="vol-skills">Deployed to REQ #{asgn.request_id}</p>
                                                <div className="vol-meta">
                                                    <span className="status-badge busy">{asgn.status.toUpperCase()}</span>
                                                </div>
                                            </div>
                                            <div style={{display:'flex', gap:'8px'}}>
                                                <button className="assign-btn" style={{color: 'var(--danger)', borderColor: 'var(--danger)', flex:1}} onClick={() => resolveAssignment(asgn.id, 'completed')}>
                                                    <XOctagon size={16} /> Recall
                                                </button>
                                                <button className="assign-btn" style={{color: 'var(--success)', borderColor: 'var(--success)', flex: 1}} onClick={() => resolveAssignment(asgn.id, 'completed')}>
                                                    <CheckCircle size={16} /> Finish
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <h2 style={{color:'var(--text-primary)', marginBottom: '-16px', fontSize:'1.2rem'}}>Approved Field Operatives</h2>
                            <div className="volunteers-grid">
                                {activeVolunteers.length === 0 ? (
                                    <div className="empty-state" style={{gridColumn: '1 / -1'}}>No approved volunteers on roster.</div>
                                ) : (
                                    activeVolunteers.map(vol => (
                                        <div key={vol.id} className="vol-card glass-panel">
                                            <div className="vol-avatar">
                                                <Users size={24} />
                                            </div>
                                            <div className="vol-info">
                                                <h3>User ID: {vol.user_id}</h3>
                                                <p className="vol-skills">Skills: {vol.skills || 'General Support'}</p>
                                                <div className="vol-meta">
                                                    <span className={`status-badge ${(vol.availability_status ?? vol.availability) ? 'available' : 'busy'}`}>
                                                        {(vol.availability_status ?? vol.availability) ? 'Available' : 'Deployed'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="assign-btn" 
                                                    disabled={!(vol.availability_status ?? vol.availability)}
                                                    onClick={() => { setSelectedVolId(vol.id); setDeployModalOpen(true); }}
                                                    style={{opacity: (vol.availability_status ?? vol.availability) ? 1 : 0.5}}
                                                    >
                                                <Crosshair size={16} /> Dispatch Unit
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {user?.role !== 'admin' && volunteers.length === 0 && (
                        <div style={{padding:'24px', border:'1px dashed var(--border-color)', borderRadius:'12px', textAlign:'center', marginTop:'32px'}}>
                            <h3 style={{color:'var(--text-primary)'}}>Tactical Array Encrypted</h3>
                            <p style={{color:'var(--text-secondary)'}}>Due to operational security, live mapping of task forces is strictly limited to command structures. Submit an enrollment request to join the active responder network.</p>
                        </div>
                    )}

                    {user?.role !== 'admin' && volunteers.length > 0 && (
                        <div style={{padding:'24px', border:'1px solid var(--accent-main)', borderRadius:'12px', textAlign:'center', marginTop:'32px', background:'var(--bg-card)'}}>
                            <h3 style={{color:'var(--text-primary)'}}>Your Operative Status: {volunteers[0].approval_status.toUpperCase()}</h3>
                            <p style={{color:'var(--text-secondary)'}}>
                                {volunteers[0].approval_status === "pending" ? "Your application is securely queued for administrative review. Please hold until clearance is granted." : "You are an active operative on the roster. Awaiting deployment calls."}
                            </p>
                        </div>
                    )}
                </>
            )}

            <Modal isOpen={isRegModalOpen} onClose={() => setRegModalOpen(false)} title="Request Field Deployment">
                <form className="modal-form" onSubmit={handleRegisterSubmit}>
                    <p style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>Your application will securely bounce to admin clearance before activating.</p>
                    <div>
                        <label>Your Skillset (comma separated)</label>
                        <input type="text" value={skills} onChange={e => setSkills(e.target.value)} required placeholder="e.g. EMT, Driver, Logistics" />
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'12px', marginTop:'8px'}}>
                        <input 
                            type="checkbox" 
                            id="loc-check"
                            checked={allowLocation} 
                            onChange={e => setAllowLocation(e.target.checked)} 
                            style={{width:'auto', cursor:'pointer'}}
                        />
                        <label htmlFor="loc-check" style={{margin:0, cursor:'pointer'}}>Bind Live GPS Coordinate Tracking</label>
                    </div>
                    <div className="modal-form-actions">
                        <button type="button" className="btn-secondary" onClick={() => setRegModalOpen(false)}>Cancel</button>
                        <button type="submit" className="primary-btn">Transmit Application</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeployModalOpen} onClose={() => setDeployModalOpen(false)} title="Execute Dispatch Directive">
                <form className="modal-form" onSubmit={handleDeploySubmit}>
                    <div>
                        <label>Target Help Request</label>
                        <select value={selectedRequestId} onChange={e => setSelectedRequestId(e.target.value)} required>
                            <option value="" disabled>Select active incident crosshair...</option>
                            {helpRequests.filter(req => req.status !== 'resolved').map(req => (
                                <option key={req.id} value={req.id}>
                                    REQ #{req.id} - {req.type.toUpperCase()} ({req.status})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-form-actions">
                        <button type="button" className="btn-secondary" onClick={() => setDeployModalOpen(false)}>Cancel</button>
                        <button type="submit" className="primary-btn">Initialize Connection</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default VolunteersPage;
