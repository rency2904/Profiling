function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateInput(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
}

function calculateAge(birthdate) {
  if (!birthdate) return 0;
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getInitials(first, last) {
  return ((first || '')[0] || '') + ((last || '')[0] || '').toUpperCase();
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(el);
    return el;
  })();

  const colors = { success: '#22c55e', error: '#ef4444', info: '#2563eb' };
  const toast = document.createElement('div');
  toast.style.cssText = `padding:12px 20px;border-radius:8px;color:#fff;background:${colors[type] || colors.info};font-size:0.9rem;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:slideIn 0.3s ease;`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function showLoading(show = true) {
  let loader = document.getElementById('loading-indicator');
  if (show) {
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'loading-indicator';
      loader.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.7);display:flex;align-items:center;justify-content:center;z-index:9998;';
      loader.innerHTML = '<div style="width:40px;height:40px;border:4px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:spin 0.8s linear infinite;"></div>';
      document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
  } else {
    if (loader) loader.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  const hamburger = document.getElementById('hamburger');
  const sidebar = document.querySelector('.sidebar');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) && !hamburger.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }
});
