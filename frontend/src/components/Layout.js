import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [alerts, setAlerts] = useState({ lowStock: 0, nearExpiry: 0, expired: 0, deadStock: 0 });

  useEffect(() => {
    api.get('/products/alerts/summary').then(({ data }) => {
      if (data.success) {
        setAlerts({
          lowStock: data.data.lowStock.length,
          nearExpiry: data.data.nearExpiry.length,
          expired: data.data.expired.length,
          deadStock: data.data.deadStock.length
        });
      }
    }).catch(() => {});
  }, [location.pathname]);

  const totalAlerts = alerts.lowStock + alerts.nearExpiry + alerts.expired + alerts.deadStock;

  const pageTitles = {
    '/': 'Dashboard',
    '/products': 'Product Management',
    '/inventory': 'Inventory & Alerts',
    '/billing': 'Billing & Invoices',
    '/credit': 'Credit Management'
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>🌿 Fertilizer MS</h2>
          <p>{user?.shopName || 'My Shop'}</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Overview</div>
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"></span> Dashboard
          </NavLink>

          <div className="nav-section-label">Inventory</div>
          <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"></span> Products
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"></span> Alerts & Stock
            {totalAlerts > 0 && <span className="nav-badge">{totalAlerts}</span>}
          </NavLink>

          <div className="nav-section-label">Transactions</div>
          <NavLink to="/billing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"></span> Billing
          </NavLink>
          <NavLink to="/credit" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"></span> Credit / Borrowers
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user?.name}</strong>
            {user?.email}
          </div>
          <button className="btn-logout" onClick={logout}>↩ Logout</button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div>
            <h1>{pageTitles[location.pathname] || 'Fertilizer MS'}</h1>
          </div>
          <div className="topbar-right">
            <span className="topbar-date mono">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </header>
        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
