import React from 'react';
import './StatCard.css';

function StatCard({ title, value, icon: Icon, colorClass, trend, onClick }) {
  return (
    <div className={`stat-card glass-panel ${colorClass}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-header">
        <h3 className="stat-title">{title}</h3>
        <div className="stat-icon-wrapper">
          {Icon && <Icon size={24} />}
        </div>
      </div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        {trend && (
          <div className="stat-trend">
             {trend}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
