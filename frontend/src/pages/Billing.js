import React, { useState, useEffect, useCallback, useMemo } from 'react';
import shopLogo from '../assets/Logo.png';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ─── UTILS ───
const fmt = n => 'Rs.' + Number(n || 0).toLocaleString('en-IN');

const invoicePrintStyles = `
@media print {
  body * { visibility: hidden !important; }
  #printable-invoice, #printable-invoice * { visibility: visible !important; }
  #printable-invoice { position: fixed !important; top: 0; left: 0; width: 100vw; margin: 0; padding: 0; }
  .no-print { display: none !important; }
}
`;

// ─── SUB-COMPONENT: INVOICE VIEW (UPDATED WITH LICENSE) ───
const InvoiceView = ({ invoice, onClose }) => {
  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = invoicePrintStyles;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const ps = invoice.paymentStatus;
  const badgeColor = ps === 'paid' ? '#16a34a' : ps === 'pending' ? '#dc2626' : '#d97706';

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg" style={{ maxWidth: 700, borderRadius: 12, overflow: 'hidden', padding: 0 }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', background: '#f8faf8', borderBottom: '1px solid #d1e7d8' }}>
          <span style={{ fontWeight: 600, color: '#1a5c2e' }}>Invoice: {invoice.invoiceNumber}</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handlePrint} className="btn btn-primary btn-sm">🖨 Print Invoice</button>
            <button onClick={onClose} className="btn-close">×</button>
          </div>
        </div>

        <div id="printable-invoice" style={{ background: '#fff', fontFamily: "sans-serif", color: '#111' }}>
          {/* Header Section */}
          <div style={{ background: '#1a5c2e', padding: '30px', textAlign: 'center', color: '#fff' }}>
            <img src={shopLogo} alt="Logo" style={{ width: 70, background: '#fff', padding: 5, borderRadius: 8, marginBottom: 10 }} />
            <h2 style={{ color: '#f5c518', margin: 0, fontSize: 26 }}>श्री राम कृषी केंद्र</h2>
            <div style={{ fontSize: 13, color: '#f5c518', fontWeight: 'bold', marginTop: 5, letterSpacing: '0.5px' }}>
              License No: MH-SOL-AGR-2019-04521
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.9 }}>
              Fertilizers • Seeds • Pesticides | Gotewadi, Solapur | Mo: 8624862027
            </p>
          </div>

          <div style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
              <div>
                <small style={{ color: '#666', letterSpacing: 1 }}>BILL TO</small>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>{invoice.customerName}</div>
                <div style={{ color: '#444' }}>{invoice.customerPhone}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <small style={{ color: '#666', letterSpacing: 1 }}>INVOICE DETAILS</small>
                <div style={{ fontWeight: 'bold', fontSize: 16, color: '#1a5c2e' }}>#{invoice.invoiceNumber}</div>
                <div>{new Date(invoice.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                <div style={{ color: badgeColor, fontWeight: 'bold', fontSize: 12, marginTop: 5 }}>{ps.toUpperCase()}</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #1a5c2e', color: '#1a5c2e' }}>
                  <th align="left" style={{ padding: 10 }}>PRODUCT</th>
                  <th align="right" style={{ padding: 10 }}>QTY</th>
                  <th align="right" style={{ padding: 10 }}>RATE</th>
                  <th align="right" style={{ padding: 10 }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 12 }}>{item.productName}</td>
                    <td align="right">{item.quantity} {item.unit}</td>
                    <td align="right">{fmt(item.sellingPrice)}</td>
                    <td align="right" style={{ fontWeight: 600 }}>{fmt(item.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, alignItems: 'flex-end' }}>
              <div style={{ fontSize: 11, color: '#777', fontStyle: 'italic' }}>
                * Goods once sold will not be taken back.<br />
                * Subject to Solapur jurisdiction.
              </div>
              <div style={{ width: 250 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                  <span>Total Amount</span>
                  <span style={{ fontWeight: 'bold', fontSize: 18, color: '#1a5c2e' }}>{fmt(invoice.totalAmount)}</span>
                </div>
                {invoice.amountDue > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontSize: 14, fontWeight: 'bold' }}>
                    <span>Pending Balance</span>
                    <span>{fmt(invoice.amountDue)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signature Area */}
            <div style={{ marginTop: 50, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: 8, width: 180 }}>
                <small style={{ fontWeight: 'bold', color: '#1a5c2e' }}>Authorised Signatory</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───
export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    customerType: 'walk-in', customerId: '', customerName: '', customerPhone: '',
    items: [{ productId: '', quantity: 1, sellingPrice: 0 }],
    discount: 0, tax: 0, paymentType: 'cash', amountPaid: 0, dueDate: '', notes: ''
  });

  const subtotal = useMemo(() => form.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity || 0), 0), [form.items]);
  const total = useMemo(() => subtotal - Number(form.discount || 0) + Number(form.tax || 0), [subtotal, form.discount, form.tax]);

  const loadInvoices = useCallback(async () => {
    try {
      const { data } = await api.get('/billing', { params: { status: filterStatus, search } });
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
  }, [loadInvoices]);

  const setItem = (i, k, v) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [k]: v };
    if (k === 'productId') {
      const prod = products.find(p => p._id === v);
      if (prod) items[i].sellingPrice = prod.sellingPrice;
    }
    return { ...f, items };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.some(it => !it.productId)) return toast.error('Please select products');
    try {
      const payload = {
        ...form,
        customerName: form.customerType === 'registered' ? customers.find(c => c._id === form.customerId)?.name : form.customerName || 'Walk-in',
        amountPaid: form.paymentType === 'cash' ? total : Number(form.amountPaid)
      };
      await api.post('/billing', payload);
      toast.success('Invoice Created');
      setShowNew(false);
      loadInvoices();
    } catch (err) { toast.error('Error creating invoice'); }
  };

  return (
    <div className="billing-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: '#1a5c2e' }}>Billing & Sales</h2>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>Generate invoices for seeds and fertilizers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Invoice</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '15px', marginBottom: 20, display: 'flex', gap: 15 }}>
        <input 
          className="form-control" 
          placeholder="🔍 Search customer or invoice..." 
          style={{ maxWidth: 400 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-control" style={{ width: 180 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      <div className="card">
        {loading ? <div className="p-4 text-center">Loading...</div> : (
          <div className="table-wrap">
            <table className="table-striped">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan="6" className="text-center p-4">No records found</td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv._id}>
                    <td className="mono">{inv.invoiceNumber}</td>
                    <td>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                    <td><strong>{inv.customerName}</strong></td>
                    <td className="mono font-bold">{fmt(inv.totalAmount)}</td>
                    <td>
                      <span className={`badge badge-${inv.paymentStatus === 'paid' ? 'green' : 'amber'}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setViewInvoice(inv)}>View / Print</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── NEW INVOICE MODAL ─── */}
      {showNew && (
        <div className="modal-overlay">
          <div className="modal modal-lg" style={{ maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>New Sale Transaction</h3>
              <button className="btn-close" onClick={() => setShowNew(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                <div className="grid-2">
                   <div className="form-group">
                      <label className="form-label">Customer Type</label>
                      <select className="form-control" value={form.customerType} onChange={e => setForm({...form, customerType: e.target.value})}>
                        <option value="walk-in">Walk-in</option>
                        <option value="registered">Registered Credit Customer</option>
                      </select>
                   </div>
                   <div className="form-group">
                      <label className="form-label">Customer Name</label>
                      <input className="form-control" placeholder="Enter Name" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} />
                   </div>
                </div>

                <h4 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: 10, marginTop: 25, color: '#1a5c2e' }}>Item List</h4>
                {form.items.map((item, i) => (
                  <div key={i} className="form-row" style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
                    <select className="form-control" style={{ flex: 3 }} value={item.productId} onChange={e => setItem(i, 'productId', e.target.value)}>
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} (Stock: {p.stockQuantity})</option>)}
                    </select>
                    <input type="number" className="form-control" style={{ flex: 1 }} placeholder="Qty" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} />
                    <input type="number" className="form-control" style={{ flex: 1.5 }} placeholder="Rate" value={item.sellingPrice} onChange={e => setItem(i, 'sellingPrice', e.target.value)} />
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}>✕</button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: 1, sellingPrice: 0 }] }))}>+ Add Row</button>
              </div>

              {/* Sticky Total Footer */}
              <div className="modal-footer" style={{ background: '#f9fafb', borderTop: '3px solid #1a5c2e', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>
                    <span style={{ color: '#666', fontSize: 13 }}>Final Grand Total:</span>
                    <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1a5c2e' }}>{fmt(total)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowNew(false)}>Discard</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>🧾 Confirm & Create</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewInvoice && <InvoiceView invoice={viewInvoice} onClose={() => setViewInvoice(null)} />}
    </div>
  );
}