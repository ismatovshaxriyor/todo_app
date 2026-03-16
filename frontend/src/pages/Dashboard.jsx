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
  const [activeCategory, setActiveCategory] = useState(null); // null means 'All'
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [stats, setStats] = useState(null);
  
  // Pagination & Search States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Only update query on submit/debounce
  
  // UI State
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [todosData, categoriesData, statsData] = await Promise.all([
        todoService.getTodos(currentPage, searchQuery),
        categoryService.getCategories(),
        todoService.getStatistics()
      ]);
      
      // Handle Django Pagination Response
      if (todosData && todosData.results !== undefined) {
        setTodos(todosData.results);
        // Math.ceil(total entries / page_size) => 10 is our default set in backend
        setTotalPages(Math.ceil(todosData.count / 10)); 
      } else {
        setTodos(todosData);
        setTotalPages(1);
      }
      
      // We only want to set categories if they come back successfully
      if (categoriesData && (categoriesData.results || categoriesData.length >= 0)) {
        setCategories(categoriesData.results || categoriesData);
      }
      
      if (statsData) setStats(statsData);
      
    } catch (err) {
      setError('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  // Initial fetch and dependency fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    setSearchQuery(searchInput);
  };
  
  // Clear search
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
      
      await todoService.createTodo(
        newTodoTitle, 
        newTodoDesc, 
        newTodoCategory || null,
        newTodoPriority,
        deadlineStr
      );
      
      // Update data and refresh stats
      if (currentPage === 1) {
          fetchData();
      } else {
          setCurrentPage(1); // Adding new todo should usually send us back to pg 1
      }
      
      // Reset form and close panel
      setNewTodoTitle('');
      setNewTodoDesc('');
      setNewTodoCategory('');
      setNewTodoPriority('medium');
      setNewTodoDeadline('');
      setIsAddPanelOpen(false);
    } catch (err) {
      let errorMsg = 'Failed to create task.';
      if (err && err.deadline) {
        errorMsg = `Deadline error: ${err.deadline[0]}`;
      } else if (err && typeof err === 'object' && Object.values(err)[0]) {
        try {
            errorMsg = Object.values(err)[0][0] || errorMsg;
        } catch(_) {}
      }
      setError(errorMsg);
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

  // Filter existing fetched todos by category visually
  const filteredTodos = activeCategory 
    ? todos.filter(t => t.category === activeCategory)
    : todos;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'rgba(248, 113, 113, 0.2)'; 
      case 'medium': return 'rgba(250, 204, 21, 0.2)'; 
      case 'low': return 'rgba(110, 231, 183, 0.2)'; 
      default: return 'var(--surface-secondary)';
    }
  };

  const getPriorityTextColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--accent-danger)'; 
      case 'medium': return '#fbbf24'; 
      case 'low': return 'var(--accent-primary)'; 
      default: return 'var(--text-secondary)';
    }
  };

  const formatDeadline = (isoString) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    const now = new Date();
    
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(10, 10, 15, 0.5)' }}>
          <h2 style={{ margin: 0, fontWeight: 600 }}>
            {activeCategory ? categories.find(c => c.id === activeCategory)?.title : 'Dashboard'}
          </h2>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* SEARCH BAR */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search tasks..." 
                className="glass-input"
                style={{ padding: '0.4rem 1rem', paddingRight: '2.5rem', fontSize: '0.9rem', width: '250px', borderRadius: 'var(--radius-full)' }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                 <button type="button" onClick={handleClearSearch} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                    ×
                 </button>
              )}
            </form>

            <button 
              onClick={() => setIsAddPanelOpen(true)}
              className="btn btn-primary" 
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
            >
              + New Task
            </button>

            <Link to="/profile" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textDecoration: 'none', color: 'var(--text-primary)', marginLeft: '0.5rem' }}>
              Profile
            </Link>
          </div>
        </header>

        <main className="main-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', maxWidth: '1000px', margin: '0 auto', width: '100%', padding: '2.5rem 2.5rem 0 2.5rem' }}>
          
          {/* STATIC TOP PART (Stats + Form) */}
          <div style={{ flexShrink: 0 }}>
            {error && (
              <div style={{ padding: '1rem', background: 'rgba(248,113,113,0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                {error}
              </div>
            )}

            {/* STATISTICS WIDGETS */}
            {stats && !searchQuery && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Tasks</span>
                  <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.total_tasks || 0}</span>
                </div>
                
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Completed</span>
                  <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.completed_tasks || 0}</span>
                </div>
                
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending</span>
                  <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pending_tasks || 0}</span>
                </div>
                
                <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-danger)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Overdue</span>
                  <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-danger)' }}>{stats.overdue_tasks || 0}</span>
                </div>
              </div>
            )}

            {searchQuery && (
               <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Search results for:</span>
                  <strong style={{ color: 'var(--accent-primary)' }}>"{searchQuery}"</strong>
               </div>
            )}

            {/* ADD TODO FORM WAS HERE */}
          </div>

          {/* SCROLLABLE BOTTOM PART (List + Pagination) */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '2.5rem' }} className="todos-scroll-container">
            {/* TODOS LIST */}
            {loading && <div className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
               <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid rgba(110,231,183,0.3)', borderRadius: '50%', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s ease-in-out infinite' }}></div>
            </div>}
          
          {!loading && filteredTodos.length === 0 && (
            <div className="text-center" style={{ padding: '4rem 2rem', background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📝</div>
              <p style={{ fontSize: '1.1rem' }}>No tasks found here.</p>
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

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '3rem', padding: '1rem' }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="btn btn-secondary"
                style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                ← Previous
              </button>
              
              <span style={{ color: 'var(--text-secondary)' }}>
                Page <strong style={{ color: 'var(--text-primary)' }}>{currentPage}</strong> of {totalPages}
              </span>
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                className="btn btn-secondary"
                style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                Next →
              </button>
            </div>
          )}
          
          </div>
        </main>
      </div>
      
      {/* Right Side Panel for Adding Task */}
      {isAddPanelOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40,
          backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end', transition: 'all 0.3s'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '400px', height: '100%', borderRadius: 0, borderRight: 0, borderTop: 0, borderBottom: 0,
            padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s forwards'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ margin: 0 }}>Create Task</h2>
              <button onClick={() => setIsAddPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', padding: '0.5rem' }}>
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddTodo} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              <div className="input-group">
                <label className="input-label">Title</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="What needs to be done?" 
                  value={newTodoTitle} 
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Description (optional)</label>
                <textarea 
                  className="glass-input" 
                  placeholder="Add details..." 
                  value={newTodoDesc} 
                  onChange={(e) => setNewTodoDesc(e.target.value)}
                  style={{ minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Category</label>
                <select 
                  className="glass-input" 
                  value={newTodoCategory} 
                  onChange={(e) => setNewTodoCategory(e.target.value)}
                  style={{ cursor: 'pointer', appearance: 'none', color: newTodoCategory ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  <option value="" style={{ color: '#000' }}>📄 No Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} style={{ color: '#000' }}>{cat.title}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Priority</label>
                <select 
                  className="glass-input" 
                  value={newTodoPriority} 
                  onChange={(e) => setNewTodoPriority(e.target.value)}
                  style={{ cursor: 'pointer', appearance: 'none' }}
                >
                  <option value="low" style={{ color: '#000' }}>🟢 Low</option>
                  <option value="medium" style={{ color: '#000' }}>🟡 Medium</option>
                  <option value="high" style={{ color: '#000' }}>🔴 High</option>
                </select>
              </div>
              
              <div className="input-group">
                <label className="input-label">Due Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="glass-input" 
                  value={newTodoDeadline}
                  onChange={(e) => setNewTodoDeadline(e.target.value)}
                  style={{ cursor: 'pointer', color: newTodoDeadline ? 'var(--text-primary)' : 'var(--text-muted)' }}
                />
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                  Create Task
                </button>
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
          
        /* Custom scrollbar for todos list */
        .todos-scroll-container::-webkit-scrollbar {
          width: 8px;
        }
        .todos-scroll-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .todos-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .todos-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
          
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </div>
  );
}

export default Dashboard;
