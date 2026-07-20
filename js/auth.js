let isLoggingIn = false;
let isResetting = false;

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

function showForgotPassword() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('forgot-panel').style.display = 'block';
  document.getElementById('reset-error').classList.remove('show');
  document.getElementById('reset-success').textContent = '';
}

function hideForgotPassword() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('forgot-panel').style.display = 'none';
}

async function handleResetPassword() {
  if (isResetting) return;
  isResetting = true;

  const username = document.getElementById('reset-username').value.trim();
  const code = document.getElementById('reset-code').value.trim();
  const password = document.getElementById('reset-password').value;
  const confirm = document.getElementById('reset-confirm').value;
  const btn = document.getElementById('reset-btn');
  const btnText = document.getElementById('reset-btn-text');
  const errorEl = document.getElementById('reset-error');
  const successEl = document.getElementById('reset-success');

  btn.classList.add('loading');
  btn.disabled = true;
  errorEl.classList.remove('show');
  successEl.textContent = '';

  if (!username || !code || !password || !confirm) {
    errorEl.querySelector('span').textContent = 'All fields are required.';
    errorEl.classList.add('show');
    btn.classList.remove('loading');
    btn.disabled = false;
    isResetting = false;
    return;
  }

  if (password.length < 6) {
    errorEl.querySelector('span').textContent = 'Password must be at least 6 characters.';
    errorEl.classList.add('show');
    btn.classList.remove('loading');
    btn.disabled = false;
    isResetting = false;
    return;
  }

  if (password !== confirm) {
    errorEl.querySelector('span').textContent = 'Passwords do not match.';
    errorEl.classList.add('show');
    btn.classList.remove('loading');
    btn.disabled = false;
    isResetting = false;
    return;
  }

  try {
    const result = await api.resetPassword(username, code, password);
    successEl.textContent = result.message || 'Password reset successfully.';
    document.getElementById('reset-username').value = '';
    document.getElementById('reset-code').value = '';
    document.getElementById('reset-password').value = '';
    document.getElementById('reset-confirm').value = '';
    setTimeout(() => hideForgotPassword(), 2500);
  } catch (err) {
    errorEl.querySelector('span').textContent = err.message || 'Reset failed.';
    errorEl.classList.add('show');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
    isResetting = false;
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

function openChangePassword() {
  document.getElementById('change-pw-modal').classList.add('open');
  document.getElementById('change-pw-form').reset();
  document.getElementById('change-pw-error').textContent = '';
  document.getElementById('change-pw-success').textContent = '';
}

function closeChangePassword() {
  document.getElementById('change-pw-modal').classList.remove('open');
}

async function handleChangePassword(e) {
  e.preventDefault();

  const current = document.getElementById('change-pw-current').value;
  const newPw = document.getElementById('change-pw-new').value;
  const confirm = document.getElementById('change-pw-confirm').value;
  const errorEl = document.getElementById('change-pw-error');
  const successEl = document.getElementById('change-pw-success');
  const btn = document.getElementById('change-pw-btn-submit');

  errorEl.textContent = '';
  successEl.textContent = '';

  if (!current || !newPw || !confirm) {
    errorEl.textContent = 'All fields are required.';
    return;
  }

  if (newPw.length < 6) {
    errorEl.textContent = 'New password must be at least 6 characters.';
    return;
  }

  if (newPw !== confirm) {
    errorEl.textContent = 'New passwords do not match.';
    return;
  }

  btn.textContent = 'Changing...';
  btn.disabled = true;

  try {
    await api.changePassword(current, newPw);
    successEl.textContent = 'Password changed successfully.';
    document.getElementById('change-pw-form').reset();
    setTimeout(() => closeChangePassword(), 2000);
  } catch (err) {
    errorEl.textContent = err.message || 'Failed to change password.';
  } finally {
    btn.textContent = 'Change Password';
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  checkAuth();
});
