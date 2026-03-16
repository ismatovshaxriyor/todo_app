import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, todoService } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Profile() {
  const [profile, setProfile] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Renamed from 'saving'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); // Renamed from 'success'
  
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [activityPeriod, setActivityPeriod] = useState('7d');

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userProfile, userStats, userActivity] = await Promise.all([
        authService.getUserProfile(),
        todoService.getStatistics(),
        todoService.getActivity(activityPeriod)
      ]);
      setProfile(userProfile);
      setStats(userStats);
      setActivity(userActivity);
      setFormData({
        username: userProfile.username || '',
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        email: userProfile.email || '',
      });
    } catch (err) {
      setError('Failed to fetch data.');
      if (err.message === 'Unauthorized') {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePeriodChange = async (e) => {
    const newPeriod = e.target.value;
    setActivityPeriod(newPeriod);
    try {
      const newActivity = await todoService.getActivity(newPeriod);
      setActivity(newActivity);
    } catch (err) {
      console.error("Failed to fetch activity");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const updated = await authService.updateUserProfile(formData);
      setProfile(updated);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to update profile. Please check your inputs.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login'); // Redirect to login after logout
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem 0' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '1000px', padding: '2.5rem', position: 'relative' }}>
        
        {/* Top Navigation */}
        <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', right: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <Link to="/" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Dashboard
          </Link>

          <button onClick={handleLogout} className="btn btn-danger" style={{ background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Log Out
          </button>
        </div>
        
        <div className="text-center" style={{ marginBottom: '2.5rem', marginTop: '1rem' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: '#000', margin: '0 auto 1rem', boxShadow: 'var(--glow-primary)'
          }}>
            {profile?.username ? profile.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>My Profile</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage your personal information.</p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(248,113,113,0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}
        
        {successMsg && (
          <div style={{ padding: '1rem', background: 'rgba(110,231,183,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(110,231,183,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading profile...</div>
        ) : profile ? (
          <>
          {/* Profile Details Section */}
          <div style={{ marginBottom: '4rem', paddingBottom: '3rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '600px' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Profile Information</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Update your personal details here.</p>
              </div>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                <div className="input-group">
                  <label className="input-label">Username</label>
                  <input 
                    type="text" 
                    name="username"
                    className="glass-input" 
                    value={formData.username}
                    onChange={handleChange}
                    disabled // Username is usually not editable in simple setups
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div className="input-group">
                    <label className="input-label">First Name</label>
                    <input 
                      type="text" 
                      name="first_name"
                      className="glass-input" 
                      value={formData.first_name}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Last Name</label>
                    <input 
                      type="text" 
                      name="last_name"
                      className="glass-input" 
                      value={formData.last_name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    className="glass-input" 
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ padding: '0.85rem 3rem', width: '100%' }}>
                    {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
            
          {/* Analytics Section */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Your Statistics</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Track your productivity progress.</p>
            
            {/* Top Stat Cards */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div style={{ background: 'var(--surface-primary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-15px', top: '-5px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completion Rate</span>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '0.2rem' }}>
                         {stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ background: 'var(--surface-primary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-10px', top: '0px', opacity: 0.05 }}>
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Active Tasks</span>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-secondary)', marginTop: '0.2rem' }}>
                         {stats.pending_tasks}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ background: 'var(--surface-primary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-10px', top: '0px', opacity: 0.05 }}>
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--accent-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', color: stats.overdue_tasks > 0 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>Overdue Tasks</span>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stats.overdue_tasks > 0 ? 'var(--accent-danger)' : 'var(--text-primary)', marginTop: '0.2rem' }}>
                         {stats.overdue_tasks}
                      </div>
                    </div>
                  </div>
              </div>
            )}
            
            {/* Recharts Graph */}
            <div style={{ background: 'var(--surface-primary)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Task Completion History</h4>
                
                <select 
                  className="glass-input" 
                  value={activityPeriod} 
                  onChange={handlePeriodChange}
                  style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'pointer', appearance: 'none', background: 'rgba(255,255,255,0.05)' }}
                >
                  <option value="3d" style={{ color: '#000' }}>Last 3 Days</option>
                  <option value="7d" style={{ color: '#000' }}>Last 7 Days</option>
                  <option value="30d" style={{ color: '#000' }}>Last 30 Days</option>
                  <option value="1y" style={{ color: '#000' }}>Last 1 Year</option>
                </select>
              </div>

              {activity && activity.length > 0 ? (
                <div style={{ height: '350px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e1e2d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="total" name="Tasks Created" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" />
                      <Area type="monotone" dataKey="completed" name="Tasks Completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                 <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                   No activity data found for this period.
                 </div>
              )}
            </div>
          </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default Profile;
