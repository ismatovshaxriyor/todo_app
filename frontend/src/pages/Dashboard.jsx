import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { todoService, categoryService, authService } from '../services/api';

function Dashboard() {
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDesc, setNewTodoDesc] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState('medium');
  const [newTodoDeadline, setNewTodoDeadline] = useState('');
  
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'archived'

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      let todosData;
      if (viewMode === 'archived') {
        todosData = await todoService.getArchivedTodos(currentPage);
      } else {
        todosData = await todoService.getTodos(currentPage, searchQuery, activeCategory);
      }

      const [categoriesData, statsData, userProfile] = await Promise.all([
        categoryService.getCategories(),
        todoService.getStatistics(),
        authService.getUserProfile()
      ]);
      
      if (todosData && todosData.results !== undefined) {
        setTodos(todosData.results);
        setTotalPages(Math.ceil(todosData.count / 10)); 
      } else {
        setTodos(Array.isArray(todosData) ? todosData : []);
        setTotalPages(1);
      }
      
      if (categoriesData && (categoriesData.results || categoriesData.length >= 0)) {
        setCategories(categoriesData.results || categoriesData);
      }
      
      if (statsData) setStats(statsData);
      if (userProfile) setProfile(userProfile);
      
    } catch (err) {
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, activeCategory, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchQuery(searchInput);
  };
  
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    try {
      const deadlineStr = newTodoDeadline ? new Date(newTodoDeadline).toISOString() : null;
      await todoService.createTodo(newTodoTitle, newTodoDesc, newTodoCategory || null, newTodoPriority, deadlineStr);
      if (currentPage === 1) fetchData();
      else setCurrentPage(1);
      setNewTodoTitle(''); setNewTodoDesc(''); setNewTodoCategory(''); setNewTodoPriority('medium'); setNewTodoDeadline('');
      setIsAddPanelOpen(false);
    } catch (err) {
      let errorMsg = 'Failed to create task.';
      if (err && err.deadline) errorMsg = `Deadline error: ${err.deadline[0]}`;
      else if (err && typeof err === 'object' && Object.values(err)[0]) {
        try { errorMsg = Object.values(err)[0][0] || errorMsg; } catch(_) {}
      }
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleToggleComplete = async (todo) => {
    try {
      await todoService.updateTodo(todo.id, { is_completed: !todo.is_completed });
      fetchData();
    } catch (err) { setError('Failed to update task.'); }
  };

  const handleDeleteTodo = async (id) => {
    try { await todoService.deleteTodo(id); fetchData(); }
    catch (err) { setError('Failed to delete task.'); }
  };

  const handleArchiveTodo = async (id) => {
    try { await todoService.archiveTodo(id); fetchData(); }
    catch (err) { setError('Failed to archive task.'); }
  };

  const handleUnarchiveTodo = async (id) => {
    try { await todoService.unarchiveTodo(id); fetchData(); }
    catch (err) { setError('Failed to unarchive task.'); }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryTitle.trim()) return;
    try {
      const newCat = await categoryService.createCategory(newCategoryTitle);
      setCategories([...categories, newCat]);
      setNewCategoryTitle('');
    } catch (err) { setError('Failed to create category.'); }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
      if (activeCategory === id) setActiveCategory(null);
      fetchData();
    } catch (err) { setError('Failed to delete category.'); }
  };

  const handleLogout = () => { authService.logout(); };

  const handleSwitchView = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
    setSearchQuery('');
    setSearchInput('');
    setActiveCategory(null);
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'high': return 'rgba(248, 113, 113, 0.15)'; 
      case 'medium': return 'rgba(251, 191, 36, 0.15)'; 
      case 'low': return 'rgba(110, 231, 183, 0.15)'; 
      default: return 'var(--surface-glass)';
    }
  };

  const getPriorityTextColor = (p) => {
    switch (p) {
      case 'high': return '#f87171'; 
      case 'medium': return '#fbbf24'; 
      case 'low': return '#6ee7b7'; 
      default: return 'var(--text-secondary)';
    }
  };

  const formatDeadline = (isoString) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    const now = new Date();
    const isOverdue = date < now;
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return { text: dateStr, isOverdue, color: isOverdue ? '#f87171' : '#818cf8' };
  };

  const isArchiveMode = viewMode === 'archived';

  return (
    <div className="app-container" style={{ flexDirection: 'row', minHeight: '100vh' }}>
      
      {/* ===== LIQUID GLASS SIDEBAR ===== */}
      <aside style={{ width: '260px', background: 'rgba(8, 9, 13, 0.95)', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        
        {/* Sidebar shimmer */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(110,231,183,0.3), transparent)', pointerEvents: 'none' }} />

        <h2 style={{ padding: '2rem 1.5rem 1.5rem', margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 8px rgba(110,231,183,0.5))' }}>⚡</span> DoIt
        </h2>

        {/* User Card */}
        {profile && (
          <div style={{ padding: '0 1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '1rem', paddingBottom: '1.25rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.first_name || profile.username}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.email}</div>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <div style={{ padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
          <button onClick={() => handleSwitchView('active')} className="btn" style={{ justifyContent: 'flex-start', background: !isArchiveMode ? 'var(--surface-glass-active)' : 'transparent', color: !isArchiveMode ? 'var(--accent-primary)' : 'var(--text-secondary)', padding: '0.7rem 1rem', border: !isArchiveMode ? '1px solid rgba(110,231,183,0.12)' : 'none', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
            📊 Dashboard
          </button>
          <button onClick={() => handleSwitchView('archived')} className="btn" style={{ justifyContent: 'flex-start', background: isArchiveMode ? 'var(--surface-glass-active)' : 'transparent', color: isArchiveMode ? 'var(--accent-secondary)' : 'var(--text-secondary)', padding: '0.7rem 1rem', border: isArchiveMode ? '1px solid rgba(129,140,248,0.12)' : 'none', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
            📦 Archive
          </button>
          <Link to="/profile" className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', color: 'var(--text-secondary)', padding: '0.7rem 1rem', textDecoration: 'none', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
            👤 Profile
          </Link>
          <button onClick={handleLogout} className="btn" style={{ justifyContent: 'flex-start', background: 'transparent', color: 'var(--accent-danger)', padding: '0.7rem 1rem', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', opacity: 0.8 }}>
            🚪 Log Out
          </button>
        </div>

        {/* Category Filters (only in active mode) */}
        {!isArchiveMode && (
          <div style={{ flex: 1, padding: '0 0.75rem', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 0.75rem', marginBottom: '0.75rem', fontWeight: 600 }}>
              Categories
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <button onClick={() => { setActiveCategory(null); setCurrentPage(1); }} className="btn"
                style={{ justifyContent: 'flex-start', background: activeCategory === null ? 'var(--surface-glass-hover)' : 'transparent', color: activeCategory === null ? 'var(--accent-primary)' : 'var(--text-secondary)', border: 'none', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                All Tasks
              </button>
              
              {categories.map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                  <button onClick={() => { setActiveCategory(cat.id); setCurrentPage(1); }} className="btn"
                    style={{ flex: 1, justifyContent: 'flex-start', background: activeCategory === cat.id ? 'var(--surface-glass-hover)' : 'transparent', color: activeCategory === cat.id ? 'var(--accent-primary)' : 'var(--text-secondary)', border: 'none', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    {cat.title}
                  </button>
                  <button onClick={() => handleDeleteCategory(cat.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem', fontSize: '1rem', opacity: 0.5, transition: 'opacity 0.2s' }} title="Delete">×</button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddCategory} style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
              <input type="text" placeholder="+ Add Category" value={newCategoryTitle} onChange={(e) => setNewCategoryTitle(e.target.value)}
                style={{ width: '100%', fontSize: '0.82rem', padding: '0.55rem 0.75rem', background: 'var(--surface-glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', outline: 'none' }} />
              {newCategoryTitle.trim() && (
                <button type="submit" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem', marginTop: '0.5rem' }}>Create</button>
              )}
            </form>
          </div>
        )}
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Header */}
        <header style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2.5rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(8,9,13,0.7)', backdropFilter: 'blur(16px)' }}>
          <h2 style={{ margin: 0, fontWeight: 600, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isArchiveMode ? (
              <><span style={{ opacity: 0.7 }}>📦</span> Archived Tasks</>
            ) : (
              activeCategory ? categories.find(c => c.id === activeCategory)?.title : 'Dashboard'
            )}
          </h2>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {!isArchiveMode && (
              <>
                <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
                  <input type="text" placeholder="Search tasks..." className="glass-input"
                    style={{ padding: '0.5rem 2.5rem 0.5rem 1rem', fontSize: '0.88rem', width: '260px', borderRadius: 'var(--radius-full)' }}
                    value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                  <button type="submit" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                  {searchInput && (
                    <button type="button" onClick={handleClearSearch} style={{ position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
                  )}
                </form>
                <button onClick={() => setIsAddPanelOpen(true)} className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>+ Create Task</button>
              </>
            )}
          </div>
        </header>

        <main style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '2rem 2.5rem 0' }}>
          
          {/* Top: Stats / Alerts */}
          <div style={{ flexShrink: 0 }}>
            {error && (
              <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(248,113,113,0.08)', color: 'var(--accent-danger)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            {stats && !searchQuery && !isArchiveMode && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Total Tasks', value: stats.total_tasks || 0, color: 'var(--accent-primary)' },
                  { label: 'Completed', value: stats.completed_tasks || 0, color: '#34d399' },
                  { label: 'Pending', value: stats.pending_tasks || 0, color: '#fbbf24' },
                  { label: 'Overdue', value: stats.overdue_tasks || 0, color: '#f87171' }
                ].map((s, i) => (
                  <div key={i} className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderLeft: `3px solid ${s.color}` }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>{s.label}</span>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: s.color, marginTop: '0.2rem', display: 'block' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && (
              <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Results for:</span>
                <strong style={{ color: 'var(--accent-primary)' }}>"{searchQuery}"</strong>
              </div>
            )}
          </div>

          {/* Scrollable Todo List */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '2rem' }} className="todos-scroll-container">
            
            {loading && (
              <div className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid rgba(110,231,183,0.2)', borderRadius: '50%', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
              </div>
            )}
          
            {!loading && todos.length === 0 && (
              <div className="text-center" style={{ padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.4 }}>{isArchiveMode ? '📦' : '📝'}</div>
                <p style={{ fontSize: '1rem' }}>{isArchiveMode ? 'No archived tasks yet.' : 'No tasks found.'}</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {todos.map(todo => {
                const cat = categories.find(c => c.id === todo.category);
                const deadlineInfo = formatDeadline(todo.deadline);
                
                return (
                  <div key={todo.id} className="glass-panel" style={{ padding: '0', display: 'flex', overflow: 'hidden', transition: 'all 0.25s ease', opacity: todo.is_completed ? 0.6 : 1, borderRadius: 'var(--radius-md)' }}>
                    
                    {/* Priority indicator */}
                    <div style={{ width: '4px', background: getPriorityTextColor(todo.priority), flexShrink: 0 }} />

                    <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                        {!isArchiveMode && (
                          <input type="checkbox" checked={todo.is_completed} onChange={() => handleToggleComplete(todo)}
                            style={{ marginTop: '0.3rem', width: '1.15rem', height: '1.15rem', cursor: 'pointer', accentColor: 'var(--accent-primary)', flexShrink: 0 }} />
                        )}
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, textDecoration: todo.is_completed ? 'line-through' : 'none', color: todo.is_completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                            {todo.title}
                          </h4>
                          
                          {todo.description && (
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: todo.is_completed ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {todo.description}
                            </p>
                          )}
                          
                          {(cat || deadlineInfo || todo.priority) && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                              {todo.priority && (
                                <span style={{ padding: '0.15rem 0.5rem', background: getPriorityColor(todo.priority), color: getPriorityTextColor(todo.priority), borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                  {todo.priority}
                                </span>
                              )}
                              {cat && (
                                <span style={{ padding: '0.15rem 0.5rem', background: 'var(--surface-glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                  {cat.title}
                                </span>
                              )}
                              {deadlineInfo && (
                                <span style={{ padding: '0.15rem 0.5rem', background: deadlineInfo.isOverdue ? 'rgba(248,113,113,0.1)' : 'rgba(129,140,248,0.1)', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', color: deadlineInfo.color }}>
                                  {deadlineInfo.isOverdue ? '⚠ ' : '⏰ '}{deadlineInfo.text}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        {isArchiveMode ? (
                          <button onClick={() => handleUnarchiveTodo(todo.id)} className="btn btn-secondary" style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem' }} title="Unarchive">
                            ↩ Restore
                          </button>
                        ) : (
                          todo.is_completed && (
                            <button onClick={() => handleArchiveTodo(todo.id)} className="btn btn-secondary" style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', opacity: 0.7 }} title="Move to Archive">
                              📦
                            </button>
                          )
                        )}
                        <button onClick={() => handleDeleteTodo(todo.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.6rem' }} title="Delete">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', marginTop: '2.5rem', padding: '1rem' }}>
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} className="btn btn-secondary" style={{ opacity: currentPage === 1 ? 0.4 : 1, fontSize: '0.85rem' }}>
                  ← Prev
                </button>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Page <strong style={{ color: 'var(--text-primary)' }}>{currentPage}</strong> of {totalPages}
                </span>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading} className="btn btn-secondary" style={{ opacity: currentPage === totalPages ? 0.4 : 1, fontSize: '0.85rem' }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* ===== SLIDE PANEL: Create Task ===== */}
      {isAddPanelOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40, display: 'flex', justifyContent: 'flex-end' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', height: '100%', borderRadius: 0, padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s forwards', borderLeft: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Create Task</h2>
              <button onClick={() => setIsAddPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', padding: '0.5rem' }}>&times;</button>
            </div>
            
            <form onSubmit={handleAddTodo} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              <div className="input-group">
                <label className="input-label">Title</label>
                <input type="text" className="glass-input" placeholder="What needs to be done?" value={newTodoTitle} onChange={(e) => setNewTodoTitle(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="glass-input" placeholder="Details..." value={newTodoDesc} onChange={(e) => setNewTodoDesc(e.target.value)} style={{ minHeight: '90px', resize: 'vertical' }} />
              </div>
              <div className="input-group">
                <label className="input-label">Category</label>
                <select className="glass-input" value={newTodoCategory} onChange={(e) => setNewTodoCategory(e.target.value)} style={{ cursor: 'pointer', appearance: 'none' }}>
                  <option value="">No Category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.title}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Priority</label>
                <select className="glass-input" value={newTodoPriority} onChange={(e) => setNewTodoPriority(e.target.value)} style={{ cursor: 'pointer', appearance: 'none' }}>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Due Date</label>
                <input type="datetime-local" className="glass-input" value={newTodoDeadline} onChange={(e) => setNewTodoDeadline(e.target.value)} style={{ cursor: 'pointer' }} />
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .todos-scroll-container::-webkit-scrollbar { width: 6px; }
        .todos-scroll-container::-webkit-scrollbar-track { background: transparent; }
        .todos-scroll-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        .todos-scroll-container::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </div>
  );
}

export default Dashboard;
