let isLoggingIn = false;

function checkAuth() {
  const token = getToken();
  if (token) {
    document.getElementById('login-overlay').classList.remove('open');
    document.getElementById('app-content').style.display = 'block';
    const admin = JSON.parse(localStorage.getItem('admin') || '{}');
    document.getElementById('admin-label').textContent = admin.username ? `Signed in as ${admin.username}` : '';
    if (typeof loadProfiles === 'function') {
      loadProfiles();
    }
  } else {
    document.getElementById('login-overlay').classList.add('open');
    document.getElementById('app-content').style.display = 'none';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  if (isLoggingIn) return;
  isLoggingIn = true;

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const btn = document.getElementById('login-btn');
  const btnText = document.getElementById('login-btn-text');
  const errorEl = document.getElementById('login-error');

  btn.classList.add('loading');
  btn.disabled = true;
  btnText.textContent = 'Signing in...';
  errorEl.classList.remove('show');
  errorEl.querySelector('span').textContent = '';

  try {
    const result = await api.login(username, password);
    localStorage.setItem('token', result.token);
    localStorage.setItem('refreshToken', result.refreshToken);
    localStorage.setItem('admin', JSON.stringify(result.admin));
    checkAuth();
  } catch (err) {
    errorEl.querySelector('span').textContent = err.message || 'Invalid credentials.';
    errorEl.classList.add('show');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
    btnText.textContent = 'Sign In';
    isLoggingIn = false;
  }
}

async function handleLogout() {
  try {
    await api.logout();
  } catch {
    // proceed with local cleanup even if server call fails
  }
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('admin');
  checkAuth();
}

async function handleLogoutAll() {
  try {
    await api.logoutAll();
  } catch {
    // proceed with local cleanup even if server call fails
  }
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('admin');
  checkAuth();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  checkAuth();
});
