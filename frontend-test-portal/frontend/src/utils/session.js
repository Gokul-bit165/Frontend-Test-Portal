const SESSION_EVENT = 'portal-session-change';

export const isAdminSessionActive = () => {
  const role = (localStorage.getItem('userRole') || '').toLowerCase();
  const adminToken = localStorage.getItem('adminToken');
  return role === 'admin' && !!adminToken;
};

export const notifySessionChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
};

export const clearAdminSession = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  notifySessionChange();
};

export const subscribeToSessionChanges = (callback) => {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback(isAdminSessionActive());
  window.addEventListener(SESSION_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(SESSION_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};
