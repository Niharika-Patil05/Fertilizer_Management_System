import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

function LoginForm() {
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
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
    <>
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
    </>
  );
}

function SetupForm() {
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ name: '', shopName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const result = await register({ name: form.name, email: form.email, password: form.password, shopName: form.shopName });
    if (!result.success) {
      setError(result.message);
      toast.error(result.message);
    } else {
      toast.success('Account created!');
    }
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <>
      <div className="alert" style={{ background: 'var(--green-50, #f0f7f1)', border: '1px solid var(--green-300, #b7dcc0)', color: '#1a5c2e', marginBottom: 16 }}>
        First time setup — create your own admin account to get started.
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Your Name</label>
          <input className="form-control" value={form.name} onChange={e => setF('name', e.target.value)} required autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Shop Name</label>
          <input className="form-control" value={form.shopName} onChange={e => setF('shopName', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input type="email" className="form-control" value={form.email} onChange={e => setF('email', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input type="password" className="form-control" value={form.password} onChange={e => setF('password', e.target.value)} required minLength={6} />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input type="password" className="form-control" value={form.confirmPassword} onChange={e => setF('confirmPassword', e.target.value)} required minLength={6} />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '8px' }} disabled={loading}>
          {loading ? <><span className="spinner"></span> Creating account…</> : '→ Create Account'}
        </button>
      </form>
    </>
  );
}

export default function Login() {
  const [needsSetup, setNeedsSetup] = useState(null); // null = checking

  useEffect(() => {
    api.get('/auth/setup-status')
      .then(({ data }) => setNeedsSetup(!!data.data?.needsSetup))
      .catch(() => setNeedsSetup(false)); // if the check fails, fall back to the normal login form
  }, []);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-leaf"></div>
          <h1>Fertilizer Management</h1>
          <p>Retail Shop Automation System</p>
        </div>

        {needsSetup === null ? (
          <div className="p-4 text-center"><span className="spinner"></span></div>
        ) : needsSetup ? <SetupForm /> : <LoginForm />}

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Annasaheb Dange College of Engineering &amp; Technology, Ashta
        </p>
      </div>
    </div>
  );
}
