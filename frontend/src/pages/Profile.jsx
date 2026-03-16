import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, todoService } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ username: '', first_name: '', last_name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [activityPeriod, setActivityPeriod] = useState('7d');
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userProfile, userStats, userActivity] = await Promise.all([
        authService.getUserProfile(), todoService.getStatistics(), todoService.getActivity(activityPeriod)
      ]);
      setProfile(userProfile); setStats(userStats); setActivity(userActivity);
      setFormData({ username: userProfile.username || '', first_name: userProfile.first_name || '', last_name: userProfile.last_name || '', email: userProfile.email || '' });
    } catch (err) {
      setError('Failed to fetch data.');
      if (err.message === 'Unauthorized') navigate('/login');
    } finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePeriodChange = async (e) => {
    const p = e.target.value;
    setActivityPeriod(p);
    try { setActivity(await todoService.getActivity(p)); } catch (err) { console.error('Failed to fetch activity'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true); setError(''); setSuccessMsg('');
    try {
      const updated = await authService.updateUserProfile(formData);
      setProfile(updated); setSuccessMsg('Profile updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { setError('Failed to update profile.'); }
    finally { setIsSaving(false); }
  };

  const handleLogout = () => { authService.logout(); navigate('/login'); };

  return (
    <div className="app-container" style={{ flexDirection: 'row', minHeight: '100vh' }}>
      
      {/* ===== LIQUID GLASS SIDEBAR ===== */}
      <aside style={{ width: '260px', background: 'rgba(8, 9, 13, 0.95)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(110,231,183,0.3), transparent)', pointerEvents: 'none' }} />

        <h2 style={{ padding: '2rem 1.5rem 1.5rem', margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 8px rgba(110,231,183,0.5))' }}>⚡</span> DoIt
        </h2>
        
        <div style={{ padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Link to="/" className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', color: 'var(--text-secondary)', padding: '0.7rem 1rem', border: 'none', textDecoration: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
            📊 Dashboard
          </Link>
          <button className="btn" style={{ justifyContent: 'flex-start', background: 'var(--surface-glass-active)', color: 'var(--accent-primary)', padding: '0.7rem 1rem', border: '1px solid rgba(110,231,183,0.12)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
            👤 Profile
          </button>
          <button onClick={handleLogout} className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', color: 'var(--accent-danger)', padding: '0.7rem 1rem', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', opacity: 0.8 }}>
            🚪 Log Out
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '1rem 2.5rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(8,9,13,0.7)', backdropFilter: 'blur(16px)' }}>
          <h2 style={{ margin: 0, fontWeight: 600, fontSize: '1.2rem' }}>Profile & Analytics</h2>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '2.5rem' }}>
          {error && <div style={{ padding: '0.85rem', background: 'rgba(248,113,113,0.08)', color: 'var(--accent-danger)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</div>}
          {successMsg && <div style={{ padding: '0.85rem', background: 'rgba(110,231,183,0.08)', color: 'var(--accent-primary)', border: '1px solid rgba(110,231,183,0.15)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{successMsg}</div>}

          {loading ? (
            <div className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
          ) : profile ? (
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              
              {/* Left: Avatar + Form */}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 'bold', color: '#000', margin: '0 auto 1rem', boxShadow: '0 4px 20px rgba(110,231,183,0.2)' }}>
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                  <h2 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>{profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : profile.username}</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.88rem' }}>{profile.email || 'No email'}</p>
                </div>

                <div className="glass-panel" style={{ padding: '1.75rem' }}>
                  <h3 style={{ fontSize: '0.95rem', marginBottom: '1.25rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>Edit Information</h3>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">Username</label>
                      <input type="text" name="username" className="glass-input" value={formData.username} onChange={handleChange} disabled />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="input-group">
                        <label className="input-label">First Name</label>
                        <input type="text" name="first_name" className="glass-input" value={formData.first_name} onChange={handleChange} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Last Name</label>
                        <input type="text" name="last_name" className="glass-input" value={formData.last_name} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Email</label>
                      <input type="email" name="email" className="glass-input" value={formData.email} onChange={handleChange} />
                    </div>
                    <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right: Stats + Chart */}
              <div style={{ flex: '2 1 450px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {stats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid var(--accent-primary)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Completion</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '0.2rem' }}>{stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0}%</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid var(--accent-secondary)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Active</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-secondary)', marginTop: '0.2rem' }}>{stats.pending_tasks}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: `3px solid ${stats.overdue_tasks > 0 ? '#f87171' : 'var(--text-muted)'}` }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>Overdue</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stats.overdue_tasks > 0 ? '#f87171' : 'var(--text-primary)', marginTop: '0.2rem' }}>{stats.overdue_tasks}</div>
                    </div>
                  </div>
                )}

                <div className="glass-panel" style={{ padding: '1.75rem', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Activity Overview</h4>
                    <select className="glass-input" value={activityPeriod} onChange={handlePeriodChange}
                      style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.82rem', cursor: 'pointer', appearance: 'none' }}>
                      <option value="3d">3 Days</option>
                      <option value="7d">7 Days</option>
                      <option value="30d">30 Days</option>
                      <option value="1y">1 Year</option>
                    </select>
                  </div>

                  {activity && activity.length > 0 ? (
                    <div style={{ height: '300px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#34d399" stopOpacity={0.6}/>
                              <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(15,15,25,0.95)', borderColor: 'var(--glass-border)', borderRadius: '10px', color: '#fff', backdropFilter: 'blur(12px)' }} itemStyle={{ color: '#fff' }} />
                          <Area type="monotone" dataKey="total" name="Created" stroke="#818cf8" fillOpacity={1} fill="url(#colorTotal)" />
                          <Area type="monotone" dataKey="completed" name="Completed" stroke="#34d399" fillOpacity={1} fill="url(#colorCompleted)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No activity data for this period.</div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default Profile;
