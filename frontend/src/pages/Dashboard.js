import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../utils/api';

const fmt = (n) => 'Rs.' + Number(n || 0).toLocaleString('en-IN');
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [chart, setChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ov, ch, tp] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/sales-chart'),
          api.get('/dashboard/top-products')
        ]);
        setOverview(ov.data.data);
        setChart(ch.data.data);
        setTopProducts(tp.data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="loading-full"><span className="spinner"></span> Loading dashboard…</div>;
  if (!overview) return <div className="empty-state"><p>Failed to load dashboard.</p></div>;

  const inv = overview.inventory;
  const credit = overview.credit;

  return (
    <div>
      {/* Alert banner */}
      {(inv.lowStock + inv.nearExpiry + inv.expired + inv.deadStock) > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <strong>Attention needed:</strong>&nbsp;
          {inv.lowStock > 0 && `${inv.lowStock} low stock · `}
          {inv.nearExpiry > 0 && `${inv.nearExpiry} near expiry · `}
          {inv.expired > 0 && `${inv.expired} expired · `}
          {inv.deadStock > 0 && `${inv.deadStock} dead stock`}
          &nbsp;— <a href="/inventory" style={{ color: 'inherit', fontWeight: 700 }}>View Inventory from here →</a>
        </div>
      )}

      {/* Top Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"></div>
          <div className="stat-info">
            <div className="stat-label">Today's Sales</div>
            <div className="stat-value">{fmt(overview.sales.today)}</div>
            <div className="stat-sub">Profit: {fmt(overview.profit.today)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"></div>
          <div className="stat-info">
            <div className="stat-label">Monthly Sales</div>
            <div className="stat-value">{fmt(overview.sales.monthly)}</div>
            <div className="stat-sub">Profit: {fmt(overview.profit.monthly)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"></div>
          <div className="stat-info">
            <div className="stat-label">Total Products</div>
            <div className="stat-value">{fmtNum(inv.totalProducts)}</div>
            <div className="stat-sub">Active SKUs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"></div>
          <div className="stat-info">
            <div className="stat-label">Outstanding Dues</div>
            <div className="stat-value">{fmt(credit.totalOutstanding)}</div>
            <div className="stat-sub">{credit.customersWithDues} customers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"></div>
          <div className="stat-info">
            <div className="stat-label">Pending Invoices</div>
            <div className="stat-value">{fmtNum(credit.pendingCount)}</div>
            <div className="stat-sub">{fmt(credit.totalPending)} due</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-title">Sales & Profit — Last 6 Months</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Space Mono' }} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'Space Mono' }} tickFormatter={v => '₹' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v)} />
              <Tooltip formatter={(v, n) => ['₹' + Number(v).toLocaleString('en-IN'), n === 'sales' ? 'Sales' : 'Profit']} />
              <Legend />
              <Bar dataKey="sales" fill="#2a8c42" radius={[4,4,0,0]} name="sales" />
              <Bar dataKey="profit" fill="#8fd49f" radius={[4,4,0,0]} name="profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Inventory Alerts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: '🔴 Expired Products', count: inv.expired, color: 'var(--red-500)', bg: 'var(--red-100)' },
              { label: '🟠 Near Expiry (≤30d)', count: inv.nearExpiry, color: '#f59e0b', bg: 'var(--amber-100)' },
              { label: '🟡 Low Stock', count: inv.lowStock, color: '#d97706', bg: '#fef9c3' },
              { label: '🔵 Dead Stock (90d)', count: inv.deadStock, color: 'var(--blue-500)', bg: 'var(--blue-100)' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: item.bg, borderRadius: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontFamily: 'Space Mono', fontWeight: 700, color: item.color, fontSize: 16 }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Invoices + Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-title">Recent Invoices</div>
          {overview.recentInvoices?.length === 0 ? (
            <div className="empty-state"><p>No invoices yet</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.recentInvoices?.map(inv => (
                    <tr key={inv._id}>
                      <td className="mono" style={{ fontSize: 12 }}>{inv.invoiceNumber}</td>
                      <td>{inv.customerName}</td>
                      <td className="mono">{fmt(inv.totalAmount)}</td>
                      <td>
                        <span className={`badge badge-${inv.paymentStatus === 'paid' ? 'green' : inv.paymentStatus === 'pending' ? 'red' : 'amber'}`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Top Selling Products</div>
          {topProducts.length === 0 ? (
            <div className="empty-state"><p>No sales data yet</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topProducts.slice(0, 6).map((p, i) => (
                <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'Space Mono', fontSize: 12, color: 'var(--text-muted)', width: 20 }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.totalSold} {p.unit} sold</div>
                  </div>
                  <span className="badge badge-green">{fmt(p.sellingPrice * p.totalSold)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
