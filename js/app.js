let editId = null;

function openAddModal() {
  editId = null;
  document.getElementById('form-title').textContent = 'New Profile';
  document.getElementById('form-submit-btn').textContent = 'Save Profile';
  document.getElementById('profile-form').reset();
  document.getElementById('form-modal').classList.add('open');
}

function openEditModal(id) {
  editId = id;
  document.getElementById('form-title').textContent = 'Edit Profile';
  document.getElementById('form-submit-btn').textContent = 'Update Profile';
  showLoading(true);
  api.get(id).then(p => {
    document.getElementById('first_name').value = p.first_name || '';
    document.getElementById('last_name').value = p.last_name || '';
    document.getElementById('age').value = p.age || '';
    document.getElementById('gender').value = p.gender || '';
    document.getElementById('occupation').value = p.occupation || '';
    document.getElementById('address').value = p.address || '';
    document.getElementById('form-modal').classList.add('open');
  }).catch(() => showToast('Failed to load profile', 'error'))
    .finally(() => showLoading(false));
}

function closeFormModal() {
  document.getElementById('form-modal').classList.remove('open');
}

async function saveProfile(e) {
  e.preventDefault();
  const data = {
    first_name: document.getElementById('first_name').value.trim(),
    last_name: document.getElementById('last_name').value.trim(),
    age: parseInt(document.getElementById('age').value) || null,
    gender: document.getElementById('gender').value,
    occupation: document.getElementById('occupation').value.trim(),
    address: document.getElementById('address').value.trim(),
  };

  if (!data.first_name || !data.last_name || !data.gender) {
    showToast('First name, last name, and gender are required', 'error');
    return;
  }

  showLoading(true);
  try {
    if (editId) {
      await api.update(editId, data);
      showToast('Profile updated');
    } else {
      await api.create(data);
      showToast('Profile created');
    }
    closeFormModal();
    loadProfiles();
  } catch (err) {
    showToast(err.message || 'Failed to save profile', 'error');
  } finally {
    showLoading(false);
  }
}

function openViewModal(id) {
  showLoading(true);
  api.get(id).then(p => {
    const name = [p.first_name, p.last_name].filter(Boolean).join(' ');
    const fields = [
      { label: 'Age', value: p.age },
      { label: 'Gender', value: p.gender },
      { label: 'Occupation', value: p.occupation },
      { label: 'Address', value: p.address },
    ];
    document.getElementById('view-content').innerHTML = `
      <div class="detail-name">${name}</div>
      <div class="detail-info">
        ${fields.filter(f => f.value).map(f => `
          <div class="detail-field">
            <span class="label">${f.label}</span>
            <span class="value">${f.value}</span>
          </div>
        `).join('')}
        ${!fields.some(f => f.value) ? '<p style="color:var(--text-muted)">No additional information.</p>' : ''}
      </div>
    `;
    document.getElementById('view-modal').classList.add('open');
  }).catch(() => showToast('Failed to load profile', 'error'))
    .finally(() => showLoading(false));
}

function closeViewModal() {
  document.getElementById('view-modal').classList.remove('open');
}

async function deleteProfile(id) {
  if (!confirm('Delete this profile?')) return;
  showLoading(true);
  try {
    await api.delete(id);
    showToast('Profile deleted');
    loadProfiles();
  } catch (err) {
    showToast('Failed to delete profile', 'error');
  } finally {
    showLoading(false);
  }
}

async function loadProfiles() {
  showLoading(true);
  try {
    const params = {};
    const q = document.getElementById('search-input').value.trim();
    if (q) params.q = q;
    const gender = document.getElementById('filter-gender').value;
    if (gender) params.gender = gender;

    const profiles = await api.list(params);

    const tbody = document.getElementById('table-body');
    const empty = document.getElementById('empty-state');

    document.getElementById('profile-count').textContent = `${profiles.length} record${profiles.length !== 1 ? 's' : ''}`;

    if (profiles.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = profiles.map(p => {
      const name = [p.first_name, p.last_name].filter(Boolean).join(' ');
      return `<tr>
        <td>${name}</td>
        <td>${p.age ?? '—'}</td>
        <td>${p.gender || '—'}</td>
        <td>${p.occupation || '—'}</td>
        <td>${p.address || '—'}</td>
        <td><div class="actions">
          <button class="btn btn-sm btn-view" onclick="openViewModal(${p.id})">View</button>
          <button class="btn btn-sm btn-edit" onclick="openEditModal(${p.id})">Edit</button>
          <button class="btn btn-sm btn-delete" onclick="deleteProfile(${p.id})">Delete</button>
        </div></td>
      </tr>`;
    }).join('');
  } catch (err) {
    showToast('Failed to load profiles', 'error');
  } finally {
    showLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-input').addEventListener('input', () => {
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(loadProfiles, 300);
  });

  document.getElementById('filter-gender').addEventListener('change', loadProfiles);

  document.getElementById('form-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeFormModal();
  });
  document.getElementById('view-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeViewModal();
  });
});
