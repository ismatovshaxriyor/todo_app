import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await authService.register(formData);
      // Auto-login after successful registration
      await authService.login(formData.username, formData.password);
      window.location.href = '/';
    } catch (err) {
      // Very basic error parsing from DRF
      const errorMsg = typeof err === 'object' && err !== null 
        ? Object.values(err).map(v => Array.isArray(v) ? v[0] : v).join(', ')
        : 'Registration failed. Please check your inputs.';
      setError(errorMsg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem 0' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
        <div className="text-center mb-4">
          <h2>Create an Account</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Join us to manage your modern tasks.</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(248,113,113,0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="flex gap-4 mb-4" style={{ marginBottom: 0 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label" htmlFor="first_name">First Name</label>
              <input id="first_name" type="text" className="glass-input" value={formData.first_name} onChange={handleChange} />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label" htmlFor="last_name">Last Name</label>
              <input id="last_name" type="text" className="glass-input" value={formData.last_name} onChange={handleChange} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="username">Username *</label>
            <input id="username" type="text" className="glass-input" value={formData.username} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email Address</label>
            <input id="email" type="email" className="glass-input" value={formData.email} onChange={handleChange} />
          </div>
          
          <div className="input-group">
            <label className="input-label" htmlFor="password">Password *</label>
            <input id="password" type="password" className="glass-input" value={formData.password} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
