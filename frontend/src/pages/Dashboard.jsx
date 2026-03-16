import React, { useState, useEffect } from 'react';
import { todoService, authService } from '../services/api';

function Dashboard() {
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDesc, setNewTodoDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const data = await todoService.getTodos();
      // Django REST Framework might return an array or { results: [...] } depending on pagination
      setTodos(data.results || data);
    } catch (err) {
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      const newTodo = await todoService.createTodo(newTodoTitle, newTodoDesc);
      setTodos([newTodo, ...todos]);
      setNewTodoTitle('');
      setNewTodoDesc('');
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

  const handleDelete = async (id) => {
    try {
      await todoService.deleteTodo(id);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete task.');
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(10, 10, 15, 0.8)', backdropFilter: 'blur(12px)' }}>
        <h2 style={{ margin: 0 }}>My Tasks</h2>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          Logout
        </button>
      </header>

      <main className="main-content">
        {error && (
          <div style={{ padding: '1rem', background: 'rgba(248,113,113,0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <form onSubmit={handleAddTodo} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="What needs to be done?" 
                value={newTodoTitle} 
                onChange={(e) => setNewTodoTitle(e.target.value)}
                required
              />
              <input 
                type="text" 
                className="glass-input" 
                placeholder="Description (optional)" 
                value={newTodoDesc} 
                onChange={(e) => setNewTodoDesc(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '3rem', alignSelf: 'flex-start' }}>
              Add Task
            </button>
          </form>
        </div>

        {loading && <div className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading tasks...</div>}
        
        {!loading && todos.length === 0 && (
          <div className="text-center" style={{ padding: '3rem 1rem', background: 'var(--surface-primary)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
            <p>You have no tasks yet.</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Add a task above to get started.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {todos.map(todo => (
            <div key={todo.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s', opacity: todo.is_completed ? 0.6 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <input 
                  type="checkbox" 
                  checked={todo.is_completed} 
                  onChange={() => handleToggleComplete(todo)}
                  style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                />
                <div style={{ textDecoration: todo.is_completed ? 'line-through' : 'none' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{todo.title}</h4>
                  {todo.description && (
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{todo.description}</p>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(todo.id)} className="btn btn-danger" style={{ padding: '0.5rem 0.75rem' }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
