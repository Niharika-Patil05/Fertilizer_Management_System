import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');

function ScoreBar({ score }) {
  const color = score >= 80 ? 'var(--green-500)' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : 'var(--red-500)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reliability Score</span>
        <span style={{ fontFamily: 'Space Mono', fontSize: 12, fontWeight: 700, color }}>{score}%</span>
      </div>
      <div className="score-bar">
        <div className="score-fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

const EMPTY_FORM = { name: '', phone: '', address: '', email: '', creditLimit: 10000, notes: '' };

export default function Credit() {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showOutstanding, setShowOutstanding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = { search };
      if (showOutstanding) params.status = 'outstanding';
      const [cust, summ] = await Promise.all([
        api.get('/credit/customers', { params }),
        api.get('/credit/summary')
      ]);
      setCustomers(cust.data.data || []);
      setSummary(summ.data.data);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [search, showOutstanding]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const openAdd = () => { setEditCustomer(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (c) => {
    setEditCustomer(c);
    setForm({ name: c.name, phone: c.phone || '', address: c.address || '', email: c.email || '', creditLimit: c.creditLimit, notes: c.notes || '' });
    setShowModal(true);
  };

  const openDetail = async (c) => {
    setViewCustomer(c);
    try {
      const { data } = await api.get(`/credit/customers/${c._id}`);
      setViewDetail(data.data);
    } catch { toast.error('Failed to load details'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editCustomer) {
        await api.put(`/credit/customers/${editCustomer._id}`, form);
        toast.success('Customer updated!');
      } else {
        await api.post('/credit/customers', form);
        toast.success('Customer added!');
      }
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const statusColor = (score) => score >= 80 ? 'badge-green' : score >= 60 ? 'badge-amber' : 'badge-red';

  return (
    <div>
      <div className="page-header">
        <div><h2>Credit & Borrower Management</h2><p>Track outstanding payments and borrower reliability</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon blue"></div>
            <div className="stat-info">
              <div className="stat-label">Total Customers</div>
              <div className="stat-value">{summary.totalCustomers}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red"></div>
            <div className="stat-info">
              <div className="stat-label">With Dues</div>
              <div className="stat-value">{summary.customersWithDues}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber"></div>
            <div className="stat-info">
              <div className="stat-label">Total Outstanding</div>
              <div className="stat-value" style={{ fontSize: 17 }}>{fmt(summary.totalOutstanding)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"></div>
            <div className="stat-info">
              <div className="stat-label">Excellent Borrowers</div>
              <div className="stat-value">{summary.reliabilityBreakdown?.excellent || 0}</div>
              <div className="stat-sub">Score ≥ 80%</div>
            </div>
          </div>
        </div>
      )}

      {/* Reliability formula info */}
      <div className="card" style={{ marginBottom: 20, background: 'var(--blue-300)', border: '1px solid var(--blue-500)' }}>
        <div style={{ fontSize: 15, color: '#1237af' }}>
          <strong> Borrower Reliability Score Formula:</strong>&nbsp;
          <span className="mono">Score = (On-Time Payments ÷ Total Payments) × 100</span>
          &nbsp;|&nbsp; 🟢 Excellent ≥80% &nbsp; 🟡 Good ≥60% &nbsp; 🟠 Fair ≥40% &nbsp; 🔴 Poor &lt;40%
        </div>
      </div>

      {/* Filters */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon" style={{ fontSize: 15 }}>⌕</span>
          <input placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={showOutstanding} onChange={e => setShowOutstanding(e.target.checked)} />
          Show only with dues
        </label>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <div className="loading-full"><span className="spinner"></span> Loading…</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Credit Limit</th>
                  <th>Outstanding</th>
                  <th>Total Purchases</th>
                  <th>Reliability</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan="8"><div className="empty-state"><div className="empty-icon">👥</div><p>No customers found</p></div></td></tr>
                ) : customers.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      {c.address && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.address}</div>}
                    </td>
                    <td style={{ fontSize: 13 }}>{c.phone || '—'}</td>
                    <td className="mono">{fmt(c.creditLimit)}</td>
                    <td className="mono" style={{ color: c.outstandingBalance > 0 ? 'var(--red-500)' : 'var(--green-600)', fontWeight: 700 }}>
                      {c.outstandingBalance > 0 ? fmt(c.outstandingBalance) : '—'}
                    </td>
                    <td className="mono">{fmt(c.totalPurchases)}</td>
                    <td>
                      <span className={`badge ${statusColor(c.reliabilityScore)}`}>{c.creditStatus}</span>
                    </td>
                    <td style={{ minWidth: 120 }}>
                      <ScoreBar score={c.reliabilityScore} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openDetail(c)}>History</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top defaulters */}
      {summary?.topDefaulters?.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-title">Top Outstanding Borrowers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {summary.topDefaulters.map((c, i) => (
              <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--red-100)', borderRadius: 8 }}>
                <span style={{ fontFamily: 'Space Mono', fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', width: 24 }}>#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.phone} · Score: {c.reliabilityScore}%</div>
                </div>
                <div style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--red-500)', fontSize: 16 }}>{fmt(c.outstandingBalance)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" value={form.name} onChange={e => setF('name', e.target.value)} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={form.phone} onChange={e => setF('phone', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email} onChange={e => setF('email', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-control" value={form.address} onChange={e => setF('address', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Credit Limit (₹)</label>
                  <input type="number" className="form-control" value={form.creditLimit} onChange={e => setF('creditLimit', e.target.value)} min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-control" value={form.notes} onChange={e => setF('notes', e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner"></span> Saving…</> : (editCustomer ? 'Update' : 'Add Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {viewCustomer && (
        <div className="modal-overlay" onClick={() => { setViewCustomer(null); setViewDetail(null); }}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 {viewCustomer.name}</h3>
              <button className="btn-close" onClick={() => { setViewCustomer(null); setViewDetail(null); }}>×</button>
            </div>
            <div className="modal-body">
              {/* Score */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[
                  { label: 'Outstanding', value: fmt(viewCustomer.outstandingBalance), color: 'var(--red-500)' },
                  { label: 'Total Purchases', value: fmt(viewCustomer.totalPurchases), color: 'var(--green-700)' },
                  { label: 'Payment Reliability', value: `${viewCustomer.reliabilityScore}%`, color: viewCustomer.reliabilityScore >= 80 ? 'var(--green-600)' : 'var(--amber-500)' }
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center', padding: 16, background: 'var(--green-50)', borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 18, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <ScoreBar score={viewCustomer.reliabilityScore} />

              {/* Payment History */}
              {viewCustomer.paymentHistory?.length > 0 && (
                <>
                  <div className="card-title" style={{ marginTop: 20 }}>Payment History</div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Date</th><th>Amount</th><th>Due Date</th><th>On Time?</th></tr></thead>
                      <tbody>
                        {viewCustomer.paymentHistory.slice().reverse().map((p, i) => (
                          <tr key={i}>
                            <td style={{ fontSize: 12 }}>{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                            <td className="mono">{fmt(p.amount)}</td>
                            <td style={{ fontSize: 12 }}>{p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                            <td><span className={`badge ${p.isOnTime ? 'badge-green' : 'badge-red'}`}>{p.isOnTime ? '✓ On Time' : '✗ Late'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Invoice History */}
              {viewDetail?.invoices?.length > 0 && (
                <>
                  <div className="card-title" style={{ marginTop: 20 }}>Invoice History</div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Invoice</th><th>Date</th><th>Total</th><th>Due</th><th>Status</th></tr></thead>
                      <tbody>
                        {viewDetail.invoices.map(inv => (
                          <tr key={inv._id}>
                            <td className="mono" style={{ fontSize: 12 }}>{inv.invoiceNumber}</td>
                            <td style={{ fontSize: 12 }}>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                            <td className="mono">{fmt(inv.totalAmount)}</td>
                            <td className="mono text-red">{inv.amountDue > 0 ? fmt(inv.amountDue) : '—'}</td>
                            <td><span className={`badge badge-${inv.paymentStatus === 'paid' ? 'green' : inv.paymentStatus === 'pending' ? 'red' : 'amber'}`}>{inv.paymentStatus}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setViewCustomer(null); setViewDetail(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
