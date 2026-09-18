import React, { useState, useEffect, useCallback, useMemo } from 'react';
import shopLogo from '../assets/Logo.png';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ─── UTILS ───
const fmt = n => 'Rs.' + Number(n || 0).toLocaleString('en-IN');

// ─── SHOP DETAILS ───
// Real data. DUMMY_* values have no source of truth in the system yet.
const SHOP = {
  nameHindi: 'श्री राम कृषी केंद्र',
  proprietor: 'पवन खांडेकर', 
  dealsIn: 'Fertilizers, Seeds & Pesticides',
  address: 'Gotewadi, Solapur',
  phone: '8624862027',
  licenceNos: [
    'LCFRD0520241057SOL',
    'LCID0520241204SOL',
    'LCSD0520241348SOL',
  ],
  gstNo: '27EMSPK9825D1ZH',
};

const invoicePrintStyles = `
@media print {
  body * { visibility: hidden !important; }
  #printable-invoice, #printable-invoice * { visibility: visible !important; }
  #printable-invoice { position: fixed !important; top: 0; left: 0; width: 100vw; margin: 0; padding: 0; }
  .no-print { display: none !important; }
}
`;

// ─── Number to words (Indian numbering: Crore / Lakh / Thousand) ───
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigitsToWords = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
const threeDigitsToWords = n => {
  let str = '';
  if (n >= 100) { str += ONES[Math.floor(n / 100)] + ' Hundred'; n %= 100; if (n) str += ' '; }
  if (n) str += twoDigitsToWords(n);
  return str;
};
const numberToWords = num => {
  num = Math.round(Math.abs(Number(num) || 0));
  if (num === 0) return 'Zero';
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = num;
  let parts = [];
  if (crore) parts.push(threeDigitsToWords(crore) + ' Crore');
  if (lakh) parts.push(threeDigitsToWords(lakh) + ' Lakh');
  if (thousand) parts.push(threeDigitsToWords(thousand) + ' Thousand');
  if (hundred) parts.push(threeDigitsToWords(hundred));
  return parts.join(' ');
};

// ─── SUB-COMPONENT: INVOICE VIEW — compact dealer-bill layout ───
const InvoiceView = ({ invoice, onClose }) => {
  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = invoicePrintStyles;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const textColor = '#000';
  const cell = { border: '1px solid #000', padding: '9px 10px', color: textColor };
  const totalsLabelCell = { ...cell, textAlign: 'right', fontWeight: 'bold' };
  const totalsValueCell = { ...cell, textAlign: 'right', width: 120 };
  const subtotal = invoice.subtotal ?? invoice.items.reduce((s, it) => s + it.totalAmount, 0);

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg" style={{ maxWidth: 720, borderRadius: 12, overflow: 'hidden', padding: 0 }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', background: '#f8faf8', borderBottom: '1px solid #d1e7d8' }}>
          <span style={{ fontWeight: 600, color: '#1a5c2e' }}>Invoice: {invoice.invoiceNumber}</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handlePrint} className="btn btn-primary btn-sm">🖨 Print Invoice</button>
            <button onClick={onClose} className="btn-close">×</button>
          </div>
        </div>

        <div id="printable-invoice" style={{ background: '#fff', fontFamily: 'sans-serif', color: textColor, padding: '24px', fontSize: 14, lineHeight: 1.5, border: '2px solid #000' }}>
          {/* Row 1: BILL badge top-left, Mob top-right */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
            <div style={{ border: '2px solid #000', borderRadius: 4, padding: '3px 14px', fontWeight: 'bold', fontSize: 15 }}>
              BILL
            </div>
            <div><strong>Mob :</strong> {SHOP.phone}</div>
          </div>

          <div style={{ borderTop: '2px solid #000', marginTop: 10 }} />

          {/* Row 2: logo (left) / shop info (middle) / licence + GST (right) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 12, marginTop: 12 }}>
            <img src={shopLogo} alt="Logo" style={{ width: 130, height: 130, objectFit: 'contain', flexShrink: 0 }} />

            <div style={{ flex: 1, textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 26, letterSpacing: 1, color: textColor }}>{SHOP.nameHindi}</h2>
              <div style={{ marginTop: 2 }}>{SHOP.proprietor}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{ border: '1px solid #000', borderRadius: 4, padding: '3px 10px', fontSize: 12, fontWeight: 'bold' }}>
                  Deals in : {SHOP.dealsIn}
                </span>
              </div>
              <div style={{ marginTop: 6, fontWeight: 'bold', fontSize: 13 }}>{SHOP.address}</div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div>
                <strong>Licence No:</strong>
                {SHOP.licenceNos.map((no, i) => <div key={no}>({i + 1}) {no}</div>)}
              </div>
              <div style={{ marginTop: 6 }}><strong>G.S.T No :</strong> {SHOP.gstNo}</div>
            </div>
          </div>

          <div style={{ borderTop: '2px solid #000', marginTop: 12 }} />

          {/* Sl No / Date row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 13 }}>
            <div><strong>Sl No :</strong> {invoice.invoiceNumber}</div>
            <div><strong>Date:</strong> {new Date(invoice.createdAt).toLocaleDateString('en-IN')}</div>
          </div>

          {/* Purchaser details */}
          <div style={{ marginTop: 14 }}>
            <div style={{ borderBottom: '1px dotted #000', paddingBottom: 4 }}>
              <strong>Name :</strong> {invoice.customerName}
            </div>
            <div style={{ borderBottom: '1px dotted #000', paddingBottom: 4, marginTop: 10 }}>
              <strong>Contact No. :</strong> {invoice.customerPhone || ''}
            </div>
          </div>

          {/* Items table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16, border: '2px solid #000' }}>
            <thead>
              <tr style={{ background: '#eef2ee' }}>
                <th style={{ ...cell, width: 34 }}>Sl<br />No</th>
                <th style={cell}>DESCRIPTION</th>
                <th style={{ ...cell, width: 75 }}>QNTY./KG</th>
                <th style={{ ...cell, width: 65 }}>RATE</th>
                <th style={{ ...cell, width: 100 }} colSpan={2}>AMOUNT<br /><span style={{ fontWeight: 'normal', fontSize: 12 }}>Rs. &nbsp;&nbsp; P.</span></th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => {
                const [rupees, paise] = item.totalAmount.toFixed(2).split('.');
                return (
                  <tr key={i}>
                    <td style={cell}>{i + 1}</td>
                    <td style={cell}>{item.productName}</td>
                    <td style={{ ...cell, textAlign: 'center' }}>{item.quantity} {item.unit}</td>
                    <td style={{ ...cell, textAlign: 'right' }}>{item.sellingPrice}</td>
                    <td style={{ ...cell, textAlign: 'right' }}>{rupees}</td>
                    <td style={{ ...cell, textAlign: 'right' }}>{paise}</td>
                  </tr>
                );
              })}
              <tr>
                <td style={cell} colSpan={3}></td>
                <td style={totalsLabelCell}>Sub Total</td>
                <td style={totalsValueCell} colSpan={2}>{subtotal.toFixed(2)}</td>
              </tr>
              {invoice.discountPercent > 0 && (
                <tr>
                  <td style={cell} colSpan={3}></td>
                  <td style={totalsLabelCell}>Discount ({invoice.discountPercent}%)</td>
                  <td style={totalsValueCell} colSpan={2}>-{Number(invoice.discount).toFixed(2)}</td>
                </tr>
              )}
              {invoice.taxPercent > 0 && (
                <tr>
                  <td style={cell} colSpan={3}></td>
                  <td style={totalsLabelCell}>GST ({invoice.taxPercent}%)</td>
                  <td style={totalsValueCell} colSpan={2}>{Number(invoice.tax).toFixed(2)}</td>
                </tr>
              )}
              <tr style={{ background: '#eef2ee' }}>
                <td style={cell} colSpan={3}></td>
                <td style={{ ...totalsLabelCell, fontSize: 16 }}>TOTAL-</td>
                <td style={{ ...totalsValueCell, fontSize: 16, fontWeight: 'bold' }} colSpan={2}>{Number(invoice.totalAmount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 16, fontSize: 14 }}>
            Rupees in Words : {numberToWords(invoice.totalAmount)} Only
          </div>

          {invoice.amountDue > 0 && (
            <div style={{ marginTop: 8, fontWeight: 'bold', fontSize: 14 }}>
              Pending Balance: {fmt(invoice.amountDue)}
            </div>
          )}

          {/* Signature Area */}
          <div style={{ marginTop: 50, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <div>Customer&apos;s Signature</div>
            <div>Signature</div>
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
    discountPercent: 0, taxPercent: 0, paymentType: 'cash', amountPaid: 0, dueDate: '', notes: ''
  });

  const subtotal = useMemo(() => form.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity || 0), 0), [form.items]);
  const discountAmount = useMemo(() => subtotal * (Number(form.discountPercent) || 0) / 100, [subtotal, form.discountPercent]);
  const taxAmount = useMemo(() => (subtotal - discountAmount) * (Number(form.taxPercent) || 0) / 100, [subtotal, discountAmount, form.taxPercent]);
  const total = useMemo(() => subtotal - discountAmount + taxAmount, [subtotal, discountAmount, taxAmount]);

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

  const resetForm = () => setForm({
    customerType: 'walk-in', customerId: '', customerName: '', customerPhone: '',
    items: [{ productId: '', quantity: 1, sellingPrice: 0 }],
    discountPercent: 0, taxPercent: 0, paymentType: 'cash', amountPaid: 0, dueDate: '', notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.some(it => !it.productId)) return toast.error('Please select products');
    if (form.customerType === 'registered' && !form.customerId) return toast.error('Please select a registered customer');
    if (form.paymentType !== 'cash' && Number(form.amountPaid) > total) return toast.error('Amount paid cannot exceed total');
    try {
      const payload = {
        ...form,
        customerName: form.customerType === 'registered' ? customers.find(c => c._id === form.customerId)?.name : form.customerName || 'Walk-in',
        customerId: form.customerType === 'registered' ? form.customerId : undefined,
        amountPaid: form.paymentType === 'cash' ? total : Number(form.amountPaid || 0)
      };
      await api.post('/billing', payload);
      toast.success('Invoice Created');
      setShowNew(false);
      resetForm();
      loadInvoices();
    } catch (err) { toast.error(err.response?.data?.message || 'Error creating invoice'); }
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
              <button className="btn-close" onClick={() => { setShowNew(false); resetForm(); }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                <div className="grid-2">
                   <div className="form-group">
                      <label className="form-label">Customer Type</label>
                      <select className="form-control" value={form.customerType} onChange={e => setForm({...form, customerType: e.target.value, customerId: '', customerName: ''})}>
                        <option value="walk-in">Walk-in</option>
                        <option value="registered">Registered Credit Customer</option>
                      </select>
                   </div>
                   {form.customerType === 'registered' ? (
                     <div className="form-group">
                        <label className="form-label">Select Customer</label>
                        <select className="form-control" value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
                          <option value="">Select Customer</option>
                          {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
                        </select>
                     </div>
                   ) : (
                     <div className="form-group">
                        <label className="form-label">Customer Name</label>
                        <input className="form-control" placeholder="Enter Name" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} />
                     </div>
                   )}
                </div>

                <div className="grid-2">
                   <div className="form-group">
                      <label className="form-label">Customer Phone</label>
                      <input className="form-control" placeholder="Optional" value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} />
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

                <h4 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: 10, marginTop: 25, color: '#1a5c2e' }}>Payment Details</h4>
                <div className="grid-2">
                   <div className="form-group">
                      <label className="form-label">Discount (%)</label>
                      <input type="number" className="form-control" min="0" max="100" step="0.01" value={form.discountPercent} onChange={e => setForm({...form, discountPercent: e.target.value})} />
                      {form.discountPercent > 0 && <small style={{ color: '#666' }}>= {fmt(discountAmount)}</small>}
                   </div>
                   <div className="form-group">
                      <label className="form-label">Tax / GST (%)</label>
                      <input type="number" className="form-control" min="0" max="100" step="0.01" value={form.taxPercent} onChange={e => setForm({...form, taxPercent: e.target.value})} />
                      {form.taxPercent > 0 && <small style={{ color: '#666' }}>= {fmt(taxAmount)}</small>}
                   </div>
                </div>
                <div className="grid-2">
                   <div className="form-group">
                      <label className="form-label">Payment Type</label>
                      <select className="form-control" value={form.paymentType} onChange={e => setForm({...form, paymentType: e.target.value})}>
                        <option value="cash">Cash (Paid in Full)</option>
                        <option value="credit">Credit (Pay Later)</option>
                        <option value="partial">Partial Payment</option>
                      </select>
                   </div>
                   {form.paymentType !== 'cash' && (
                     <div className="form-group">
                        <label className="form-label">Amount Paid Now (Rs.)</label>
                        <input type="number" className="form-control" min="0" max={total} value={form.amountPaid} onChange={e => setForm({...form, amountPaid: e.target.value})} />
                     </div>
                   )}
                </div>
                {form.paymentType !== 'cash' && (
                  <div className="grid-2">
                     <div className="form-group">
                        <label className="form-label">Due Date</label>
                        <input type="date" className="form-control" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
                     </div>
                  </div>
                )}
                <div className="form-group">
                   <label className="form-label">Notes</label>
                   <input className="form-control" placeholder="Optional" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                </div>
              </div>

              {/* Sticky Total Footer */}
              <div className="modal-footer" style={{ background: '#f9fafb', borderTop: '3px solid #1a5c2e', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>
                    <span style={{ color: '#666', fontSize: 13 }}>Final Grand Total:</span>
                    <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1a5c2e' }}>{fmt(total)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowNew(false); resetForm(); }}>Discard</button>
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