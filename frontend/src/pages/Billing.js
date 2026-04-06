import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');

function InvoiceView({ invoice, onClose }) {
  const printRef = useRef();
  const handlePrint = () => window.print();
  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header no-print">
          <h3>Invoice: {invoice.invoiceNumber}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>🖨 Print</button>
            <button className="btn-close" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="modal-body" ref={printRef} style={{ fontFamily: 'Sora' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px solid var(--green-700)', paddingBottom: 16 }}>
            <h2 style={{ color: 'var(--green-800)', fontSize: 20 }}>🌿 Shriram Krushi Kendra</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fertilizers, Seeds & Pesticides</p>
            <p style={{ fontSize: 12 }}>Gotewadi, Solapur | 8624862027</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>BILL TO</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{invoice.customerName}</div>
              {invoice.customerPhone && <div style={{ fontSize: 12 }}>{invoice.customerPhone}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>INVOICE NO</div>
              <div style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--green-700)' }}>{invoice.invoiceNumber}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <span className={`badge badge-${invoice.paymentStatus === 'paid' ? 'green' : invoice.paymentStatus === 'pending' ? 'red' : 'amber'}`}>{invoice.paymentStatus.toUpperCase()}</span>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
            <thead>
              <tr style={{ background: 'var(--green-800)', color: '#fff' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12 }}>Product</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12 }}>Qty</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12 }}>Rate</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px', fontSize: 13 }}>{item.productName}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'Space Mono', fontSize: 12 }}>{item.quantity} {item.unit}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'Space Mono', fontSize: 12 }}>{fmt(item.sellingPrice)}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'Space Mono', fontSize: 12 }}>{fmt(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 240 }}>
              {[['Subtotal', fmt(invoice.subtotal)], ['Discount', `- ${fmt(invoice.discount)}`], ['Tax', `+ ${fmt(invoice.tax)}`]].map(([l,v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>{l}</span><span className="mono">{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--green-700)', marginTop: 8, paddingTop: 8, fontWeight: 700, fontSize: 16 }}>
                <span>Total</span><span className="mono">{fmt(invoice.totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'var(--green-700)' }}>
                <span>Amount Paid</span><span className="mono">{fmt(invoice.amountPaid)}</span>
              </div>
              {invoice.amountDue > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: 'var(--red-500)', fontWeight: 700 }}>
                  <span>Amount Due</span><span className="mono">{fmt(invoice.amountDue)}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            Thank you for your business! | Payment Type: {invoice.paymentType.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payAmt, setPayAmt] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  // New invoice form
  const [form, setForm] = useState({
    customerType: 'walk-in', customerId: '', customerName: '', customerPhone: '',
    items: [{ productId: '', quantity: 1, sellingPrice: 0 }],
    discount: 0, tax: 0, paymentType: 'cash', amountPaid: 0, dueDate: '', notes: ''
  });

  const loadInvoices = useCallback(async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      const { data } = await api.get('/billing', { params });
      setInvoices(data.data || []);
    } catch { toast.error('Failed to load invoices'); }
  }, [filterStatus, search]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadInvoices(),
        api.get('/products').then(({ data }) => setProducts(data.data || [])),
        api.get('/credit/customers').then(({ data }) => setCustomers(data.data || []))
      ]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => { if (!loading) loadInvoices(); }, [filterStatus, search]);

  const subtotal = form.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity || 0), 0);
  const total = subtotal - Number(form.discount || 0) + Number(form.tax || 0);

  const setItem = (i, k, v) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [k]: v };
    if (k === 'productId') {
      const prod = products.find(p => p._id === v);
      if (prod) items[i].sellingPrice = prod.sellingPrice;
    }
    return { ...f, items };
  });

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: 1, sellingPrice: 0 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.some(it => !it.productId)) return toast.error('Select product for all items');
    try {
      const payload = {
        customerId: form.customerType === 'registered' ? form.customerId : undefined,
        customerName: form.customerType === 'registered'
          ? customers.find(c => c._id === form.customerId)?.name || form.customerName
          : form.customerName || 'Walk-in Customer',
        customerPhone: form.customerType === 'registered'
          ? customers.find(c => c._id === form.customerId)?.phone
          : form.customerPhone,
        items: form.items.map(it => ({ productId: it.productId, quantity: Number(it.quantity), sellingPrice: Number(it.sellingPrice) })),
        discount: Number(form.discount), tax: Number(form.tax),
        paymentType: form.paymentType,
        amountPaid: form.paymentType === 'cash' ? total : Number(form.amountPaid),
        dueDate: form.dueDate || undefined,
        notes: form.notes
      };
      await api.post('/billing', payload);
      toast.success('Invoice created!');
      setShowNew(false);
      setForm({ customerType: 'walk-in', customerId: '', customerName: '', customerPhone: '', items: [{ productId: '', quantity: 1, sellingPrice: 0 }], discount: 0, tax: 0, paymentType: 'cash', amountPaid: 0, dueDate: '', notes: '' });
      loadInvoices();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create invoice'); }
  };

  const handlePayment = async () => {
    if (!payAmt) return toast.error('Enter amount');
    try {
      await api.put(`/billing/${payModal._id}/payment`, { amount: Number(payAmt), isOnTime: true });
      toast.success('Payment recorded!');
      setPayModal(null); setPayAmt('');
      loadInvoices();
    } catch { toast.error('Payment failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Billing & Invoices</h2><p>Create and manage sales invoices</p></div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Invoice</button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input placeholder="Search by customer…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      <div className="card">
        {loading ? <div className="loading-full"><span className="spinner"></span> Loading…</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th><th>Date</th><th>Customer</th>
                  <th>Items</th><th>Total</th><th>Paid</th><th>Due</th>
                  <th>Type</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan="10"><div className="empty-state"><div className="empty-icon">🧾</div><p>No invoices found</p></div></td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv._id}>
                    <td className="mono" style={{ fontSize: 12 }}>{inv.invoiceNumber}</td>
                    <td style={{ fontSize: 12 }}>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                    <td><div style={{ fontWeight: 600 }}>{inv.customerName}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.customerPhone}</div></td>
                    <td className="mono">{inv.items.length}</td>
                    <td className="mono fw-700">{fmt(inv.totalAmount)}</td>
                    <td className="mono text-green">{fmt(inv.amountPaid)}</td>
                    <td className="mono text-red">{inv.amountDue > 0 ? fmt(inv.amountDue) : '—'}</td>
                    <td><span className="badge badge-gray">{inv.paymentType}</span></td>
                    <td><span className={`badge badge-${inv.paymentStatus === 'paid' ? 'green' : inv.paymentStatus === 'pending' ? 'red' : 'amber'}`}>{inv.paymentStatus}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setViewInvoice(inv)}>View</button>
                        {inv.amountDue > 0 && <button className="btn btn-amber btn-sm" onClick={() => { setPayModal(inv); setPayAmt(''); }}>Pay</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Invoice Modal */}
      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Invoice</h3>
              <button className="btn-close" onClick={() => setShowNew(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Customer */}
                <div className="card-title">Customer Details</div>
                <div className="form-row" style={{ marginBottom: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Customer Type</label>
                    <select className="form-control" value={form.customerType} onChange={e => setForm(f => ({ ...f, customerType: e.target.value, customerId: '' }))}>
                      <option value="walk-in">Walk-in Customer</option>
                      <option value="registered">Registered Customer</option>
                    </select>
                  </div>
                  {form.customerType === 'registered' ? (
                    <div className="form-group">
                      <label className="form-label">Select Customer</label>
                      <select className="form-control" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required>
                        <option value="">— Select —</option>
                        {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Customer Name</label>
                      <input className="form-control" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Optional" />
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="card-title" style={{ marginTop: 8 }}>Items</div>
                {form.items.map((item, i) => {
                  const prod = products.find(p => p._id === item.productId);
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        {i === 0 && <label className="form-label">Product</label>}
                        <select className="form-control" value={item.productId} onChange={e => setItem(i, 'productId', e.target.value)} required>
                          <option value="">— Select Product —</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.stockQuantity} {p.unit})</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        {i === 0 && <label className="form-label">Qty {prod ? `(${prod.unit})` : ''}</label>}
                        <input type="number" className="form-control" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} min="1" max={prod?.stockQuantity} required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        {i === 0 && <label className="form-label">Rate (₹)</label>}
                        <input type="number" className="form-control" value={item.sellingPrice} onChange={e => setItem(i, 'sellingPrice', e.target.value)} min="0" step="0.01" />
                      </div>
                      <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeItem(i)} disabled={form.items.length === 1}>✕</button>
                    </div>
                  );
                })}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>

                <hr className="divider" />

                {/* Totals */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 8 }}>
                  <div className="form-group">
                    <label className="form-label">Discount (₹)</label>
                    <input type="number" className="form-control" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} min="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax (₹)</label>
                    <input type="number" className="form-control" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} min="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Grand Total</label>
                    <div className="form-control mono" style={{ background: 'var(--green-50)', fontWeight: 700, color: 'var(--green-700)', fontSize: 16 }}>{fmt(total)}</div>
                  </div>
                </div>

                {/* Payment */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Type</label>
                    <select className="form-control" value={form.paymentType} onChange={e => setForm(f => ({ ...f, paymentType: e.target.value }))}>
                      <option value="cash">Cash</option>
                      <option value="credit">Full Credit</option>
                      <option value="partial">Partial Payment</option>
                    </select>
                  </div>
                  {form.paymentType === 'partial' && (
                    <div className="form-group">
                      <label className="form-label">Amount Paid (₹)</label>
                      <input type="number" className="form-control" value={form.amountPaid} onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))} min="0" max={total} />
                    </div>
                  )}
                  {(form.paymentType === 'credit' || form.paymentType === 'partial') && (
                    <div className="form-group">
                      <label className="form-label">Due Date</label>
                      <input type="date" className="form-control" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">🧾 Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice */}
      {viewInvoice && <InvoiceView invoice={viewInvoice} onClose={() => setViewInvoice(null)} />}

      {/* Pay Modal */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Payment</h3>
              <button className="btn-close" onClick={() => setPayModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12, fontSize: 13 }}>{payModal.invoiceNumber} — {payModal.customerName}</p>
              <p style={{ marginBottom: 16, fontSize: 13 }}>Outstanding: <strong className="mono text-red">{fmt(payModal.amountDue)}</strong></p>
              <div className="form-group">
                <label className="form-label">Amount Received (₹)</label>
                <input type="number" className="form-control" value={payAmt} onChange={e => setPayAmt(e.target.value)} min="1" max={payModal.amountDue} autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPayModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePayment}>✓ Record Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
