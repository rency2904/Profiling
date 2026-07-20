const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

let isRefreshing = false;
let refreshQueue = [];

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('admin');
    throw new Error('Refresh failed');
  }

  const data = await res.json();
  localStorage.setItem('token', data.token);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('admin', JSON.stringify(data.admin));
  return data.token;
}

async function apiRequest(url, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { headers, ...options });

  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({}));

    if ((body.code === 'TOKEN_EXPIRED' || body.code === 'SESSION_EXPIRED') && !url.includes('/auth/')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken();
          isRefreshing = false;
          refreshQueue.forEach(cb => cb(newToken));
          refreshQueue = [];

          headers['Authorization'] = `Bearer ${newToken}`;
          res = await fetch(url, { headers, ...options });
        } catch {
          isRefreshing = false;
          refreshQueue = [];
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('admin');
          window.location.reload();
          throw new Error('Session expired. Please sign in again.');
        }
      } else {
        return new Promise((resolve, reject) => {
          refreshQueue.push(async (newToken) => {
            headers['Authorization'] = `Bearer ${newToken}`;
            try {
              const retryRes = await fetch(url, { headers, ...options });
              if (!retryRes.ok) {
                const errData = await retryRes.json().catch(() => ({ error: 'Request failed' }));
                reject(new Error(errData.error || 'Request failed'));
              } else {
                resolve(retryRes.json());
              }
            } catch (err) {
              reject(err);
            }
          });
        });
      }
    } else if (!url.includes('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('admin');
      window.location.reload();
      throw new Error('Session expired. Please sign in again.');
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

  logout() {
    return apiRequest(`${API_BASE}/auth/logout`, { method: 'POST' });
  },

  logoutAll() {
    return apiRequest(`${API_BASE}/auth/logout-all`, { method: 'POST' });
  },

  me() {
    return apiRequest(`${API_BASE}/auth/me`);
  },

  sessions() {
    return apiRequest(`${API_BASE}/auth/sessions`);
  },
};
