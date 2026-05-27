const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  // Auth
  register: (email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),

  // Habits
  getHabits: (clientDate) => request(`/habits?clientDate=${clientDate}`),
  createHabit: (name, description, category, color, clientDate) =>
    request(`/habits?clientDate=${clientDate}`, { 
      method: 'POST', 
      body: JSON.stringify({ name, description, category, color }) 
    }),
  updateHabit: (id, updates, clientDate) =>
    request(`/habits/${id}?clientDate=${clientDate}`, { 
      method: 'PUT', 
      body: JSON.stringify(updates) 
    }),
  deleteHabit: (id) =>
    request(`/habits/${id}`, { method: 'DELETE' }),
  toggleHabit: (id, date, clientDate) =>
    request(`/habits/${id}/toggle`, { 
      method: 'POST', 
      body: JSON.stringify({ date, clientDate }) 
    }),
};
