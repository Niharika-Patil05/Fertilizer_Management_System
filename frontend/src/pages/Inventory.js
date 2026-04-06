import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');

function AlertTable({ items, type }) {
  if (items.length === 0) return (
    <div className="empty-state" style={{ padding: '24px' }}>
      <div className="empty-icon"></div>
      <p>No {type} items</p>
    </div>
  );

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Sell Price</th>
            {type === 'expiry' && <th>Expiry Date</th>}
            {type === 'expiry' && <th>Days Left</th>}
            {type === 'dead' && <th>Last Sale</th>}
            {type === 'dead' && <th>Days Idle</th>}
            {type === 'low' && <th>Min Stock</th>}
            {type === 'low' && <th>Deficit</th>}
            <th>Stock Value</th>
          </tr>
        </thead>
        <tbody>
          {items.map(p => {
            const daysSinceSale = p.lastSaleDate
              ? Math.floor((new Date() - new Date(p.lastSaleDate)) / (1000 * 60 * 60 * 24))
              : null;
            return (
              <tr key={p._id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.brand}</div>
                </td>
                <td><span className="badge badge-green">{p.category}</span></td>
                <td className="mono">{p.stockQuantity} {p.unit}</td>
                <td className="mono">{fmt(p.sellingPrice)}</td>
                {type === 'expiry' && (
                  <>
                    <td style={{ fontSize: 12 }}>{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td>
                      <span className={`badge ${p.daysUntilExpiry < 0 ? 'badge-red' : 'badge-amber'}`}>
                        {p.daysUntilExpiry < 0 ? `${Math.abs(p.daysUntilExpiry)}d ago` : `${p.daysUntilExpiry}d`}
                      </span>
                    </td>
                  </>
                )}
                {type === 'dead' && (
                  <>
                    <td style={{ fontSize: 12 }}>{p.lastSaleDate ? new Date(p.lastSaleDate).toLocaleDateString('en-IN') : 'Never'}</td>
                    <td><span className="badge badge-blue">{daysSinceSale ?? '90+'}d</span></td>
                  </>
                )}
                {type === 'low' && (
                  <>
                    <td className="mono">{p.minimumStock} {p.unit}</td>
                    <td><span className="badge badge-amber">{Math.max(0, p.minimumStock - p.stockQuantity)} {p.unit}</span></td>
                  </>
                )}
                <td className="mono">{fmt(p.stockQuantity * p.purchasePrice)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Inventory() {
  const [alerts, setAlerts] = useState({ lowStock: [], nearExpiry: [], expired: [], deadStock: [] });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('expired');

  useEffect(() => {
    const load = async () => {
      try {
        const [a, s] = await Promise.all([
          api.get('/products/alerts/summary'),
          api.get('/inventory/stats')
        ]);
        setAlerts(a.data.data);
        setStats(s.data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="loading-full"><span className="spinner"></span> Loading inventory…</div>;

  const tabs = [
    { id: 'expired', label: 'Expired', count: alerts.expired.length },
    { id: 'nearExpiry', label: 'Near Expiry', count: alerts.nearExpiry.length },
    { id: 'lowStock', label: 'Low Stock', count: alerts.lowStock.length },
    { id: 'deadStock', label: 'Dead Stock', count: alerts.deadStock.length },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Inventory Alerts & Stock</h2>
          <p>Monitor expiry, low stock, and dead stock items</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon green"></div>
            <div className="stat-info">
              <div className="stat-label">Total Products</div>
              <div className="stat-value">{stats.totalProducts}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"></div>
            <div className="stat-info">
              <div className="stat-label">Stock Purchase Value</div>
              <div className="stat-value" style={{ fontSize: 17 }}>₹{stats.totalStockValue.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"></div>
            <div className="stat-info">
              <div className="stat-label">Stock Selling Value</div>
              <div className="stat-value" style={{ fontSize: 17 }}>₹{stats.totalSellingValue.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber"></div>
            <div className="stat-info">
              <div className="stat-label">Potential Profit</div>
              <div className="stat-value" style={{ fontSize: 17 }}>₹{stats.potentialProfit.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Algorithm info */}
      <div className="card" style={{ marginBottom: 20, background: 'var(--green-50)', border: '1px solid var(--green-300)' }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
          <span>🔴 <strong>Expired:</strong> Expiry Date &lt; Today</span>
          <span>🟠 <strong>Near Expiry:</strong> Days to Expiry ≤ 30</span>
          <span>🟡 <strong>Low Stock:</strong> Quantity ≤ Minimum Stock</span>
          <span>🔵 <strong>Dead Stock:</strong> No sales for 90+ days</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          {tabs.map(t => (
            <button key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'Sora', fontSize: 13, fontWeight: 600,
                background: tab === t.id ? 'var(--green-700)' : 'var(--green-50)',
                color: tab === t.id ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span style={{
                  background: tab === t.id ? 'rgba(255,255,255,0.3)' : 'var(--red-500)',
                  color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: 11, fontFamily: 'Space Mono'
                }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'expired'   && <AlertTable items={alerts.expired}   type="expiry" />}
        {tab === 'nearExpiry'&& <AlertTable items={alerts.nearExpiry} type="expiry" />}
        {tab === 'lowStock'  && <AlertTable items={alerts.lowStock}   type="low"    />}
        {tab === 'deadStock' && <AlertTable items={alerts.deadStock}  type="dead"   />}
      </div>
    </div>
  );
}
