import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: 'admin@shriramkrushi.com', password: 'admin123' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (!result.success) {
      setError(result.message);
      toast.error(result.message);
    } else {
      toast.success('Welcome back!');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-leaf"></div>
          <h1>Fertilizer Management</h1>
          <p>Retail Shop Automation System</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email" className="form-control"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password" className="form-control"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '8px' }} disabled={loading}>
            {loading ? <><span className="spinner"></span> Signing in…</> : '→ Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Annasaheb Dange College of Engineering &amp; Technology, Ashta
        </p>
      </div>
    </div>
  );
}
