import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authService.getUserProfile();
      setProfileData(data);
    } catch (err) {
      setError('Failed to load profile data.');
      if (err.message === 'Unauthorized') {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem 0' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', position: 'relative' }}>
        
        {/* Back navigation */}
        <Link to="/" style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Tasks
        </Link>
        
        <div className="text-center" style={{ marginBottom: '2.5rem', marginTop: '1rem' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: '#000', margin: '0 auto 1rem', boxShadow: 'var(--glow-primary)'
          }}>
            {profileData?.username ? profileData.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>My Profile</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage your personal information.</p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(248,113,113,0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading profile...</div>
        ) : profileData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ background: 'var(--surface-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>Username</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>@{profileData.username}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, background: 'var(--surface-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>First Name</p>
                <p style={{ fontSize: '1.05rem' }}>{profileData.first_name || '-'}</p>
              </div>
              <div style={{ flex: 1, background: 'var(--surface-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>Last Name</p>
                <p style={{ fontSize: '1.05rem' }}>{profileData.last_name || '-'}</p>
              </div>
            </div>

            <div style={{ background: 'var(--surface-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>Email Address</p>
              <p style={{ fontSize: '1.05rem' }}>{profileData.email || 'Not provided'}</p>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button onClick={handleLogout} className="btn btn-danger" style={{ flex: 1 }}>
                Log Out
              </button>
            </div>
            
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Profile;
