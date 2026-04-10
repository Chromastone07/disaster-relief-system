import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit3, ShieldAlert, CheckCircle, XOctagon } from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/widgets/Modal';
import './Resources.css';

function ResourcesPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    
    const [selectedResId, setSelectedResId] = useState(null);
    const [formData, setFormData] = useState({ name: '', type: 'food', quantity: 0 });
    const [editQuantity, setEditQuantity] = useState(0);

    const fetchData = async () => {
        try {
            const res = await apiClient.get('/volunteers/resources');
            setResources(res.data);
        } catch (err) {
            showToast("Failed to fetch inventory streams", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/volunteers/resources', {
                name: formData.name,
                type: formData.type,
                quantity: parseInt(formData.quantity)
            });
            showToast(user?.role === 'admin' ? "Stockpile physically mapped." : "Inventory addition queued for Admin clearance.", "success");
            setAddModalOpen(false);
            setFormData({ name: '', type: 'food', quantity: 0 });
            fetchData();
        } catch (err) {
            showToast("Network blocked the transaction.", "error");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.patch(`/volunteers/resources/${selectedResId}`, {
                quantity: parseInt(editQuantity)
            });
            showToast("Quantity recalibrated.", "success");
            setEditModalOpen(false);
            fetchData();
        } catch (err) {
            showToast("System Admin credentials required to modify active stores.", "error");
        }
    };

    const handleDelete = async (id) => {
        try {
            await apiClient.delete(`/volunteers/resources/${id}`);
            showToast("Cache deleted from the grid.", "success");
            fetchData();
        } catch (err) {
           showToast("Permission denied.", "error");
        }
    };

    const resolveResource = async (id, statusLiteral) => {
        try {
            await apiClient.patch(`/volunteers/resources/${id}/approve`, { status: statusLiteral });
            showToast(`Resource tracking ${statusLiteral}`, "info");
            fetchData();
        } catch(err) {
            showToast("Cannot process approval vector.", "error");
        }
    };

    // Arrays
    const pendingResources = resources.filter(r => r.approval_status === "pending");
    const activeResources = resources.filter(r => r.approval_status === "approved" || !r.approval_status);

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Relief Inventory</h1>
                    <p>Track centralized physical resources and caches.</p>
                </div>
                <button className="primary-btn" onClick={() => setAddModalOpen(true)}>
                    <Plus size={16} /> {user?.role === 'admin' ? 'Add Stockpile' : 'Submit Inventory Addition'}
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Counting physical assets...</div>
            ) : (
                <>
                    {user?.role === 'admin' && pendingResources.length > 0 && (
                        <>
                            <h2 style={{color:'var(--warning)', marginBottom: '-16px', fontSize:'1.2rem'}}>Pending Registry Queue</h2>
                            <div className="resources-grid" style={{marginBottom: '32px'}}>
                                {pendingResources.map(res => (
                                    <div key={res.id} className="resource-card glass-panel" style={{border: '1px solid var(--warning)'}}>
                                        <div className="res-header">
                                            <div className="res-icon" style={{background: 'var(--warning-light)', color: 'var(--warning)'}}>
                                                <Package size={20} />
                                            </div>
                                            <h3 style={{color: 'var(--warning)'}}>UNVERIFIED DATA</h3>
                                        </div>
                                        <div className="res-details">
                                            <h4>{res.name}</h4>
                                            <p className="res-type">Category: {res.type.toUpperCase()}</p>
                                            <div className="res-quantity">
                                                <span className="qty-number">{res.quantity}</span> units mapped
                                            </div>
                                        </div>
                                        <div style={{display:'flex', gap:'8px', marginTop:'12px'}}>
                                            <button className="icon-btn" style={{color: 'var(--danger)', flex:1, border:'1px solid var(--danger)'}} onClick={() => resolveResource(res.id, 'denied')}>
                                                <XOctagon size={16} /> Strip
                                            </button>
                                            <button className="icon-btn" style={{color: 'var(--success)', flex: 1, border:'1px solid var(--success)'}} onClick={() => resolveResource(res.id, 'approved')}>
                                                <CheckCircle size={16} /> Ratify
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <h2 style={{color:'var(--text-primary)', marginBottom: '-16px', fontSize:'1.2rem'}}>Active Ledger</h2>
                    <div className="resources-grid">
                        {activeResources.length === 0 ? (
                            <div className="empty-state">No inventory is currently tracked.</div>
                        ) : (
                            activeResources.map(res => (
                                <div key={res.id} className="resource-card glass-panel">
                                    <div className="res-header">
                                        <div className="res-icon">
                                            <Package size={20} />
                                        </div>
                                        {user && user.role === 'admin' && (
                                            <div className="res-actions">
                                                <button className="icon-btn edit" onClick={() => {
                                                    setSelectedResId(res.id);
                                                    setEditQuantity(res.quantity);
                                                    setEditModalOpen(true);
                                                }}><Edit3 size={16} /></button>
                                                <button className="icon-btn delete" onClick={() => handleDelete(res.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="res-details">
                                        <h4>{res.name}</h4>
                                        <p className="res-type">{res.type.toUpperCase()}</p>
                                        <div className="res-quantity">
                                            <span className="qty-number">{res.quantity}</span> units
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title={user?.role === 'admin' ? "Register New Resource" : "Request Inventory Sync"}>
                <form className="modal-form" onSubmit={handleAddSubmit}>
                    {user?.role !== 'admin' && (
                         <p style={{fontSize:'0.85rem', color:'var(--warning)'}}>Your asset cache will bounce to administration for live verification before joining the active ledger.</p>
                    )}
                    <div>
                        <label>Item / Stockpile Name</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div>
                        <label>Resource Category</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                            <option value="food">Water & Nutrition</option>
                            <option value="medical">Medical / First Aid</option>
                            <option value="equipment">Heavy Equipment / Tooling</option>
                            <option value="personnel">Shelter Gear</option>
                        </select>
                    </div>
                    <div>
                        <label>Initial Quantity Count</label>
                        <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                    </div>
                    <div className="modal-form-actions">
                        <button type="button" className="btn-secondary" onClick={() => setAddModalOpen(false)}>Cancel</button>
                        <button type="submit" className="primary-btn">Add to Inventory</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Update Resource Quantity">
                <form className="modal-form" onSubmit={handleEditSubmit}>
                    <div>
                        <label>New Quantity</label>
                        <input type="number" min="0" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} required />
                    </div>
                    <div className="modal-form-actions">
                        <button type="button" className="btn-secondary" onClick={() => setEditModalOpen(false)}>Cancel</button>
                        <button type="submit" className="primary-btn">Save Changes</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default ResourcesPage;
