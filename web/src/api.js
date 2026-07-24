export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const initData = window.Telegram?.WebApp?.initData || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData,
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Ошибка запроса: ${res.status}`);
  }
  return data;
}

export const api = {
  initAuth: () => request('/api/auth/init', { method: 'POST' }),
  updateProfile: (updates) => request('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(updates) }),

  getSettings: () => request('/api/cycle/settings'),
  updateSettings: (settings) => request('/api/cycle/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  getCycles: () => request('/api/cycle/cycles'),
  addCycle: (cycle) => request('/api/cycle/cycles', { method: 'POST', body: JSON.stringify(cycle) }),
  deleteCycle: (id) => request(`/api/cycle/cycles/${id}`, { method: 'DELETE' }),

  getDailyLogs: () => request('/api/cycle/daily-logs'),
  saveDailyLog: (log) => request('/api/cycle/daily-logs', { method: 'POST', body: JSON.stringify(log) }),

  getToday: () => request('/api/cycle/today'),

  invitePartner: () => request('/api/partner/invite', { method: 'POST' }),
  getPartnerStatus: () => request('/api/partner/status'),
  unlinkPartner: () => request('/api/partner/unlink', { method: 'DELETE' }),
  getPartnerView: () => request('/api/partner/view'),
};
