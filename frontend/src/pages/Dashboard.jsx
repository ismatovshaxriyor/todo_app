import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { todoService, categoryService, authService } from '../services/api';

function Dashboard() {
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDesc, setNewTodoDesc] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState('');
  
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [activeCategory, setActiveCategory] = useState(null); // null means 'All'
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [todosData, categoriesData] = await Promise.all([
        todoService.getTodos(),
        categoryService.getCategories()
      ]);
      setTodos(todosData.results || todosData);
      setCategories(categoriesData.results || categoriesData);
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
      const newTodo = await todoService.createTodo(newTodoTitle, newTodoDesc, newTodoCategory || null);
      setTodos([newTodo, ...todos]);
      setNewTodoTitle('');
      setNewTodoDesc('');
      setNewTodoCategory('');
    } catch (err) {
      setError('Failed to create task.');
    }
  };

  const handleToggleComplete = async (todo) => {
    try {
      const updated = await todoService.updateTodo(todo.id, { is_completed: !todo.is_completed });
      setTodos(todos.map(t => t.id === todo.id ? updated : t));
    } catch (err) {
      setError('Failed to update task.');
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await todoService.deleteTodo(id);
      setTodos(todos.filter(t => t.id !== id));
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
      // removing a category will SET_NULL for its todos, so we should refresh todos
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

  return (
    <div className="app-container" style={{ flexDirection: 'row', minHeight: '100vh' }}>
      
      {/* Sidebar for Categories */}
      <aside className="glass-panel" style={{ width: '280px', borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--accent-primary)' }}>⚡</span> DoIt
        </h2>
        
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Categories
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
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
              placeholder="+ New Category" 
              value={newCategoryTitle} 
              onChange={(e) => setNewCategoryTitle(e.target.value)}
              style={{ fontSize: '0.9rem', padding: '0.6rem 1rem' }}
            />
          </div>
          {newCategoryTitle.trim() && (
            <button type="submit" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}>
              Add
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

        <main className="main-content" style={{ maxWidth: '900px', margin: '0 auto', width: '100%', padding: '2.5rem' }}>
          {error && (
            <div style={{ padding: '1rem', background: 'rgba(248,113,113,0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
              {error}
            </div>
          )}

          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
            <form onSubmit={handleAddTodo} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="What needs to be done?" 
                  value={newTodoTitle} 
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  required
                  style={{ fontSize: '1.05rem' }}
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input 
                    type="text" 
                    className="glass-input" 
                    placeholder="Description (optional)" 
                    value={newTodoDesc} 
                    onChange={(e) => setNewTodoDesc(e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <select 
                    className="glass-input" 
                    value={newTodoCategory} 
                    onChange={(e) => setNewTodoCategory(e.target.value)}
                    style={{ flex: 1, cursor: 'pointer', appearance: 'none' }}
                  >
                    <option value="" style={{ color: '#000' }}>No Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id} style={{ color: '#000' }}>{cat.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '3.1rem', alignSelf: 'flex-start', padding: '0 2rem' }}>
                Add
              </button>
            </form>
          </div>

          {loading && <div className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>}
          
          {!loading && filteredTodos.length === 0 && (
            <div className="text-center" style={{ padding: '4rem 2rem', background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📝</div>
              <p style={{ fontSize: '1.1rem' }}>No tasks found here.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Relax or add a new one to get started.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredTodos.map(todo => {
              const cat = categories.find(c => c.id === todo.category);
              return (
                <div key={todo.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease', opacity: todo.is_completed ? 0.6 : 1, transform: todo.is_completed ? 'scale(0.99)' : 'scale(1)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flex: 1 }}>
                    <input 
                      type="checkbox" 
                      checked={todo.is_completed} 
                      onChange={() => handleToggleComplete(todo)}
                      style={{ marginTop: '0.25rem', width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    />
                    <div style={{ textDecoration: todo.is_completed ? 'line-through' : 'none' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{todo.title}</h4>
                      {todo.description && (
                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{todo.description}</p>
                      )}
                      {cat && (
                        <span style={{ display: 'inline-block', marginTop: '0.6rem', padding: '0.2rem 0.6rem', background: 'var(--surface-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {cat.title}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteTodo(todo.id)} className="btn btn-danger" style={{ padding: '0.5rem 0.8rem', opacity: 0.8 }} title="Delete task">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
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
