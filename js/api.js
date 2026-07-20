const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function apiRequest(url, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    headers,
    ...options,
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    if (!url.includes('/auth/')) {
      window.location.reload();
    }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

const api = {
  list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}/profiles${qs ? '?' + qs : ''}`);
  },

  get(id) {
    return apiRequest(`${API_BASE}/profiles/${id}`);
  },

  create(data) {
    return apiRequest(`${API_BASE}/profiles`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return apiRequest(`${API_BASE}/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(id) {
    return apiRequest(`${API_BASE}/profiles/${id}`, { method: 'DELETE' });
  },

  stats() {
    return apiRequest(`${API_BASE}/profiles/stats`);
  },

  login(username, password) {
    return apiRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  me() {
    return apiRequest(`${API_BASE}/auth/me`);
  },

  changePassword(currentPassword, newPassword) {
    return apiRequest(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  resetPassword(username, recoveryCode, newPassword) {
    return apiRequest(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ username, recoveryCode, newPassword }),
    });
  },
};
