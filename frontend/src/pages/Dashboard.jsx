import React, { useState, useEffect } from 'react';
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
  const [activeCategory, setActiveCategory] = useState(null); // null means 'All'
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [todosData, categoriesData, statsData] = await Promise.all([
        todoService.getTodos(),
        categoryService.getCategories(),
        todoService.getStatistics()
      ]);
      setTodos(todosData.results || todosData);
      setCategories(categoriesData.results || categoriesData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      // Create date format that DRF understands if entered
      const deadlineStr = newTodoDeadline ? new Date(newTodoDeadline).toISOString() : null;
      
      const newTodo = await todoService.createTodo(
        newTodoTitle, 
        newTodoDesc, 
        newTodoCategory || null,
        newTodoPriority,
        deadlineStr
      );
      
      // Update data and refresh stats
      fetchData();
      
      // Reset form
      setNewTodoTitle('');
      setNewTodoDesc('');
      setNewTodoCategory('');
      setNewTodoPriority('medium');
      setNewTodoDeadline('');
    } catch (err) {
      // Read DRF validation error if available
      let errorMsg = 'Failed to create task.';
      if (err && err.deadline) {
        errorMsg = `Deadline error: ${err.deadline[0]}`;
      } else if (err && typeof err === 'object' && Object.values(err)[0]) {
        try {
            errorMsg = Object.values(err)[0][0] || errorMsg;
        } catch(_) {}
      }
      setError(errorMsg);
      // Auto clear error
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleToggleComplete = async (todo) => {
    try {
      await todoService.updateTodo(todo.id, { is_completed: !todo.is_completed });
      fetchData(); // Refresh to update list and stats
    } catch (err) {
      setError('Failed to update task.');
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await todoService.deleteTodo(id);
      fetchData(); // Refresh to update list and stats
    } catch (err) {
      setError('Failed to delete task.');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryTitle.trim()) return;

    try {
      const newCat = await categoryService.createCategory(newCategoryTitle);
      setCategories([...categories, newCat]);
      setNewCategoryTitle('');
    } catch (err) {
      setError('Failed to create category.');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
      if (activeCategory === id) {
        setActiveCategory(null);
      }
      fetchData();
    } catch (err) {
      setError('Failed to delete category.');
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  const filteredTodos = activeCategory 
    ? todos.filter(t => t.category === activeCategory)
    : todos;

  // Helper to get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'rgba(248, 113, 113, 0.2)'; // Red
      case 'medium': return 'rgba(250, 204, 21, 0.2)'; // Yellow
      case 'low': return 'rgba(110, 231, 183, 0.2)'; // Green
      default: return 'var(--surface-secondary)';
    }
  };

  const getPriorityTextColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--accent-danger)'; // Red
      case 'medium': return '#fbbf24'; // Yellow
      case 'low': return 'var(--accent-primary)'; // Green
      default: return 'var(--text-secondary)';
    }
  };

  // Format date helper
  const formatDeadline = (isoString) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    const now = new Date();
    
    // Simple logic for overdues
    const isOverdue = date < now;
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    return {
      text: dateStr,
      isOverdue,
      color: isOverdue ? 'var(--accent-danger)' : 'var(--accent-secondary)'
    };
  };

  return (
    <div className="app-container" style={{ flexDirection: 'row', minHeight: '100vh' }}>
      
      {/* Sidebar for Categories */}
      <aside className="glass-panel" style={{ width: '280px', borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--accent-primary)' }}>⚡</span> DoIt
        </h2>
        
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Categories
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
          <button 
            onClick={() => setActiveCategory(null)}
            className="btn"
            style={{ 
              justifyContent: 'flex-start', 
              background: activeCategory === null ? 'var(--surface-hover)' : 'transparent',
              color: activeCategory === null ? 'var(--accent-primary)' : 'var(--text-primary)',
              border: '1px solid transparent',
              borderColor: activeCategory === null ? 'rgba(110, 231, 183, 0.2)' : 'transparent',
            }}
          >
            All Tasks
          </button>
          
          {categories.map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                onClick={() => setActiveCategory(cat.id)}
                className="btn"
                style={{ 
                  flex: 1,
                  justifyContent: 'flex-start', 
                  background: activeCategory === cat.id ? 'var(--surface-hover)' : 'transparent',
                  color: activeCategory === cat.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                  border: '1px solid transparent',
                  borderColor: activeCategory === cat.id ? 'rgba(110, 231, 183, 0.2)' : 'transparent',
                  padding: '0.6rem 1rem'
                }}
              >
                {cat.title}
              </button>
              <button onClick={() => handleDeleteCategory(cat.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }} title="Delete category">
                ×
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddCategory} style={{ marginTop: '2rem' }}>
          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="+ Add Category" 
              value={newCategoryTitle} 
              onChange={(e) => setNewCategoryTitle(e.target.value)}
              style={{ fontSize: '0.9rem', padding: '0.6rem 1rem' }}
            />
          </div>
          {newCategoryTitle.trim() && (
            <button type="submit" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}>
              Create
            </button>
          )}
        </form>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(10, 10, 15, 0.5)' }}>
          <h2 style={{ margin: 0, fontWeight: 600 }}>
            {activeCategory ? categories.find(c => c.id === activeCategory)?.title : 'All Tasks'}
          </h2>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/profile" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textDecoration: 'none', color: 'var(--text-primary)' }}>
              My Profile
            </Link>
          </div>
        </header>

        <main className="main-content" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '2.5rem' }}>
          {error && (
            <div style={{ padding: '1rem', background: 'rgba(248,113,113,0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
              {error}
            </div>
          )}

          {/* STATISTICS WIDGETS */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {/* Total Card */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Tasks</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.total_tasks || 0}</span>
              </div>
              
              {/* Completed Card */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Completed</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.completed_tasks || 0}</span>
              </div>
              
              {/* Pending Card */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pending_tasks || 0}</span>
              </div>
              
              {/* Overdue Card */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-danger)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Overdue</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-danger)' }}>{stats.overdue_tasks || 0}</span>
              </div>
            </div>
          )}

          {/* ADD TODO FORM */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
            <form onSubmit={handleAddTodo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Row 1: Title and Add Button */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="What needs to be done?" 
                  value={newTodoTitle} 
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  required
                  style={{ fontSize: '1.05rem', flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 2rem' }}>
                  Create Task
                </button>
              </div>
              
              {/* Row 2: Description */}
              <div>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="Description (optional)" 
                  value={newTodoDesc} 
                  onChange={(e) => setNewTodoDesc(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Row 3: Advanced Options (Category, Priority, Deadline) */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <select 
                  className="glass-input" 
                  value={newTodoCategory} 
                  onChange={(e) => setNewTodoCategory(e.target.value)}
                  style={{ flex: 1, minWidth: '150px', cursor: 'pointer', appearance: 'none', color: newTodoCategory ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  <option value="" style={{ color: '#000' }}>📄 No Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} style={{ color: '#000' }}>{cat.title}</option>
                  ))}
                </select>

                <select 
                  className="glass-input" 
                  value={newTodoPriority} 
                  onChange={(e) => setNewTodoPriority(e.target.value)}
                  style={{ flex: 1, minWidth: '150px', cursor: 'pointer', appearance: 'none' }}
                >
                  <option value="low" style={{ color: '#000' }}>🟢 Low Priority</option>
                  <option value="medium" style={{ color: '#000' }}>🟡 Medium Priority</option>
                  <option value="high" style={{ color: '#000' }}>🔴 High Priority</option>
                </select>

                <input 
                  type="datetime-local" 
                  className="glass-input" 
                  value={newTodoDeadline}
                  onChange={(e) => setNewTodoDeadline(e.target.value)}
                  style={{ flex: 1.5, minWidth: '200px', cursor: 'pointer', color: newTodoDeadline ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  title="Due Date & Time"
                />
              </div>

            </form>
          </div>

          {/* TODOS LIST */}
          {loading && <div className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>}
          
          {!loading && filteredTodos.length === 0 && (
            <div className="text-center" style={{ padding: '4rem 2rem', background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📝</div>
              <p style={{ fontSize: '1.1rem' }}>No tasks found here.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Add a new one to get started.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredTodos.map(todo => {
              const cat = categories.find(c => c.id === todo.category);
              const deadlineInfo = formatDeadline(todo.deadline);
              
              return (
                <div key={todo.id} className="glass-panel" style={{ padding: '0', display: 'flex', overflow: 'hidden', transition: 'all 0.2s ease', opacity: todo.is_completed ? 0.6 : 1, transform: todo.is_completed ? 'scale(0.99)' : 'scale(1)' }}>
                  
                  {/* Priority Left Border Indicator */}
                  <div style={{ width: '6px', background: getPriorityTextColor(todo.priority) }}></div>

                  <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flex: 1 }}>
                      <input 
                        type="checkbox" 
                        checked={todo.is_completed} 
                        onChange={() => handleToggleComplete(todo)}
                        style={{ marginTop: '0.35rem', width: '1.3rem', height: '1.3rem', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                      />
                      
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, textDecoration: todo.is_completed ? 'line-through' : 'none' }}>
                          {todo.title}
                        </h4>
                        
                        {todo.description && (
                          <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: todo.is_completed ? 'line-through' : 'none' }}>
                            {todo.description}
                          </p>
                        )}
                        
                        {/* Badges Row */}
                        {!todo.is_completed && (cat || deadlineInfo || todo.priority) && (
                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                            {todo.priority && (
                              <span style={{ padding: '0.2rem 0.6rem', background: getPriorityColor(todo.priority), color: getPriorityTextColor(todo.priority), borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                {todo.priority} Priority
                              </span>
                            )}
                            
                            {cat && (
                              <span style={{ padding: '0.2rem 0.6rem', background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                📁 {cat.title}
                              </span>
                            )}
                            
                            {deadlineInfo && (
                              <span style={{ padding: '0.2rem 0.6rem', background: deadlineInfo.isOverdue ? 'rgba(248, 113, 113, 0.1)' : 'rgba(129, 140, 248, 0.1)', border: `1px solid ${deadlineInfo.isOverdue ? 'rgba(248, 113, 113, 0.2)' : 'rgba(129, 140, 248, 0.2)'}`, borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: deadlineInfo.color, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                ⏰ {deadlineInfo.isOverdue ? 'Overdue: ' : 'Due: '} {deadlineInfo.text}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button onClick={() => handleDeleteTodo(todo.id)} className="btn btn-danger" style={{ padding: '0.5rem 0.8rem', opacity: 0.8, marginLeft: '1rem' }} title="Delete task">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
