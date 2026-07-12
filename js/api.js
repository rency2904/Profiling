const API_BASE = '/api/profiles';

async function apiRequest(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

const api = {
  list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`${API_BASE}${qs ? '?' + qs : ''}`);
  },

  get(id) {
    return apiRequest(`${API_BASE}/${id}`);
  },

  create(data) {
    return apiRequest(API_BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return apiRequest(`${API_BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(id) {
    return apiRequest(`${API_BASE}/${id}`, { method: 'DELETE' });
  },

  search(query) {
    return apiRequest(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  },

  stats() {
    return apiRequest(`${API_BASE}/stats`);
  },
};
