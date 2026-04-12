import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', category: 'Fertilizer', brand: '', unit: 'kg',
  purchasePrice: '', sellingPrice: '', stockQuantity: '', minimumStock: 10,
  expiryDate: '', 'supplier.name': '', 'supplier.contact': '', description: ''
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showRestock, setShowRestock] = useState(null);
  const [restockQty, setRestockQty] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const { data } = await api.get('/products', { params });
      setProducts(data.data || []);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, categoryFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditProduct(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      name: p.name, category: p.category, brand: p.brand || '', unit: p.unit,
      purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice,
      stockQuantity: p.stockQuantity, minimumStock: p.minimumStock,
      expiryDate: p.expiryDate ? p.expiryDate.slice(0, 10) : '',
      'supplier.name': p.supplier?.name || '', 'supplier.contact': p.supplier?.contact || '',
      description: p.description || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name, category: form.category, brand: form.brand, unit: form.unit,
        purchasePrice: Number(form.purchasePrice), sellingPrice: Number(form.sellingPrice),
        stockQuantity: Number(form.stockQuantity), minimumStock: Number(form.minimumStock),
        expiryDate: form.expiryDate || undefined,
        supplier: { name: form['supplier.name'], contact: form['supplier.contact'] },
        description: form.description
      };
      if (editProduct) {
        await api.put(`/products/${editProduct._id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product added!');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product removed');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const handleRestock = async () => {
    if (!restockQty || isNaN(restockQty)) return toast.error('Enter valid quantity');
    try {
      await api.post('/inventory/restock', { productId: showRestock._id, quantity: Number(restockQty) });
      toast.success(`Restocked ${restockQty} units`);
      setShowRestock(null); setRestockQty('');
      load();
    } catch { toast.error('Restock failed'); }
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const statusBadge = (p) => {
    if (p.isExpired) return <span className="badge badge-red">Expired</span>;
    if (p.isNearExpiry) return <span className="badge badge-amber">Near Expiry</span>;
    if (p.isLowStock) return <span className="badge badge-amber">Low Stock</span>;
    if (p.isDeadStock) return <span className="badge badge-blue">Dead Stock</span>;
    return <span className="badge badge-green">Active</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p>Manage fertilizers, pesticides, and seeds inventory</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon"></span>
          <input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 160 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {['Fertilizer', 'Pesticide', 'Seeds', 'Other'].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? <div className="loading-full"><span className="spinner"></span> Loading…</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Buy Price</th>
                  <th>Sell Price</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan="8"><div className="empty-state"><div className="empty-icon">🌾</div><p>No products found</p></div></td></tr>
                ) : products.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.brand}</div>
                    </td>
                    <td><span className="badge badge-green">{p.category}</span></td>
                    <td className="mono">
                      <span style={{ color: p.isLowStock ? 'var(--red-500)' : 'inherit', fontWeight: p.isLowStock ? 700 : 400 }}>
                        {p.stockQuantity} {p.unit}
                      </span>
                    </td>
                    <td className="mono">Rs.{p.purchasePrice}</td>
                    <td className="mono">Rs.{p.sellingPrice}</td>
                    <td style={{ fontSize: 12 }}>
                      {p.expiryDate ? (
                        <span style={{ color: p.isExpired ? 'var(--red-500)' : p.isNearExpiry ? '#f59e0b' : 'inherit' }}>
                          {new Date(p.expiryDate).toLocaleDateString('en-IN')}
                          {p.isNearExpiry && ` (${p.daysUntilExpiry}d)`}
                          {p.isExpired && ' ✗'}
                        </span>
                      ) : '—'}
                    </td>
                    <td>{statusBadge(p)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowRestock(p)}>+Stock</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input className="form-control" value={form.name} onChange={e => setF('name', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input className="form-control" value={form.brand} onChange={e => setF('brand', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-control" value={form.category} onChange={e => setF('category', e.target.value)}>
                      {['Fertilizer', 'Pesticide', 'Seeds', 'Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <select className="form-control" value={form.unit} onChange={e => setF('unit', e.target.value)}>
                      {['kg', 'g', 'litre', 'ml', 'bag', 'packet', 'piece'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Purchase Price (Rs.) *</label>
                    <input type="number" className="form-control" value={form.purchasePrice} onChange={e => setF('purchasePrice', e.target.value)} required min="0" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Price (Rs.) *</label>
                    <input type="number" className="form-control" value={form.sellingPrice} onChange={e => setF('sellingPrice', e.target.value)} required min="0" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Profit Margin</label>
                    <div className="form-control" style={{ background: 'var(--green-50)', fontFamily: 'Space Mono', color: 'var(--green-700)' }}>
                      {form.purchasePrice && form.sellingPrice
                        ? `${(((form.sellingPrice - form.purchasePrice) / form.purchasePrice) * 100).toFixed(1)}%`
                        : '—'}
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Stock Quantity *</label>
                    <input type="number" className="form-control" value={form.stockQuantity} onChange={e => setF('stockQuantity', e.target.value)} required min="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Minimum Stock Alert</label>
                    <input type="number" className="form-control" value={form.minimumStock} onChange={e => setF('minimumStock', e.target.value)} min="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input type="date" className="form-control" value={form.expiryDate} onChange={e => setF('expiryDate', e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Supplier Name</label>
                    <input className="form-control" value={form['supplier.name']} onChange={e => setF('supplier.name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supplier Contact</label>
                    <input className="form-control" value={form['supplier.contact']} onChange={e => setF('supplier.contact', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner"></span> Saving…</> : (editProduct ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestock && (
        <div className="modal-overlay" onClick={() => setShowRestock(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Restock: {showRestock.name}</h3>
              <button className="btn-close" onClick={() => setShowRestock(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                Current stock: <strong className="mono">{showRestock.stockQuantity} {showRestock.unit}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Add Quantity</label>
                <input type="number" className="form-control" value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder="Enter quantity to add" min="1" autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRestock(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRestock}>Add Stock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
