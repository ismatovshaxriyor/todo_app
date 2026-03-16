const BASE_URL = 'http://127.0.0.1:8000/api';

// Helper to get headers
function getHeaders() {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Interceptor-like helper to handle 401s
async function apiFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  let response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Attempt Token Refresh logic could go here, but for simplicity:
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  // Handle empty responses (like 204 No Content for DELETE)
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw data;
  }
  return data;
}

// Authentication Service
export const authService = {
  login: async (username, password) => {
    const data = await apiFetch('/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    return data;
  },
  
  register: async (userData) => {
    return await apiFetch('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  },
  
  isAuthenticated: () => !!localStorage.getItem('access_token'),

  getUserProfile: async () => {
    return await apiFetch('/users/me/');
  },
  
  updateUserProfile: async (data) => {
    return await apiFetch('/users/update_profile/', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
};

// Todo Service
export const todoService = {
  getTodos: async (page = 1, search = '', categoryId = null) => {
    let url = `/todos/?page=${page}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (categoryId) {
      url += `&category=${categoryId}`;
    }
    return await apiFetch(url);
  },
  
  createTodo: async (title, description = '', category_id = null, priority = 'medium', deadline = null) => {
    const body = { title, description, priority };
    if (category_id) {
        body.category = category_id;
    }
    if (deadline) {
        body.deadline = deadline;
    }
    return await apiFetch('/todos/', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  
  updateTodo: async (id, updates) => {
    return await apiFetch(`/todos/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  
  deleteTodo: async (id) => {
    return await apiFetch(`/todos/${id}/`, {
      method: 'DELETE',
    });
  },

  getStatistics: async () => {
    return await apiFetch('/todos/statistics/');
  },
  
  getActivity: async (period = '7d') => {
    return await apiFetch(`/todos/activity/?period=${period}`);
  },

  archiveTodo: async (id) => {
    return await apiFetch(`/todos/${id}/archive/`, { method: 'POST' });
  },

  unarchiveTodo: async (id) => {
    return await apiFetch(`/todos/${id}/unarchive/`, { method: 'POST' });
  },

  getArchivedTodos: async (page = 1) => {
    return await apiFetch(`/todos/archived/?page=${page}`);
  }
};

// Category Service
export const categoryService = {
  getCategories: async () => {
    return await apiFetch('/categories/');
  },
  
  createCategory: async (title) => {
    return await apiFetch('/categories/', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  deleteCategory: async (id) => {
    return await apiFetch(`/categories/${id}/`, {
      method: 'DELETE',
    });
  }
};
