let editId = null;
let addressFields = null;

function buildAddressFields() {
  const provinces = AddressService.getProvinces().map(p => ({
    code: p.provCode,
    name: p.provName.trim()
  }));

  let currentProvCode = null;
  let currentCityCode = null;

  const provinceSel = AddressUI.createSearchableSelect(
    'province-group', 'Province', 'Select Province', provinces,
    (item) => {
      currentProvCode = item.code;
      currentCityCode = null;
      citySel.clear();
      brgySel.clear();
      updateCityOptions();
    }
  );

  function getCities() {
    if (!currentProvCode) return [];
    return AddressService.getMuncitiesByProvince(currentProvCode).map(m => ({
      code: m.munCityCode,
      name: m.munCityName.trim()
    }));
  }

  const citySel = AddressUI.createSearchableSelect(
    'city-group', 'City / Municipality', 'Select Province first', [],
    (item) => {
      currentCityCode = item.code;
      brgySel.clear();
      updateBrgyOptions();
    }
  );

  function updateCityOptions() {
    const items = getCities();
    const input = document.getElementById('city-group-input');
    const wrapper = document.getElementById('city-group-wrapper');
    if (wrapper) {
      input.placeholder = items.length ? 'Select City / Municipality' : 'Select Province first';
      input.disabled = !items.length;
    }
    citySel._updateItems(items);
  }

  function getBarangays() {
    if (!currentCityCode) return [];
    return AddressService.getBarangaysByMuncity(currentCityCode).map(b => ({
      code: b.brgyCode,
      name: b.brgyName.trim()
    }));
  }

  const brgySel = AddressUI.createSearchableSelect(
    'barangay-group', 'Barangay', 'Select City first', [],
    () => {}
  );

  function updateBrgyOptions() {
    const items = getBarangays();
    const input = document.getElementById('barangay-group-input');
    const wrapper = document.getElementById('barangay-group-wrapper');
    if (wrapper) {
      input.placeholder = items.length ? 'Select Barangay' : 'Select City first';
      input.disabled = !items.length;
    }
    brgySel._updateItems(items);
  }

  const purokField = AddressUI.createTextField('purok-group', 'Purok / Sitio', 'e.g. Purok 3');

  return {
    provinceSel, citySel, brgySel, purokField,
    setProvCode(code) { currentProvCode = code; },
    setCityCode(code) { currentCityCode = code; },
    getProvCode() { return currentProvCode; },
    getCityCode() { return currentCityCode; },
  };
}

function openAddModal() {
  editId = null;
  document.getElementById('form-title').textContent = 'New Profile';
  document.getElementById('form-submit-btn').textContent = 'Save Profile';
  document.getElementById('profile-form').reset();
  if (addressFields) {
    addressFields.provinceSel.clear();
    addressFields.citySel.clear();
    addressFields.brgySel.clear();
    addressFields.purokField.clear();
    addressFields.setProvCode(null);
    addressFields.setCityCode(null);
  }
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

    if (addressFields) {
      const displayProvCode = AddressService.getDisplayProvCode(p.province_code);
      if (p.province_code) {
        addressFields.setProvCode(displayProvCode);
        addressFields.provinceSel.setValue(displayProvCode, p.province_name);
      }
      if (p.city_code) {
        addressFields.setCityCode(p.city_code);
        addressFields.citySel.setValue(p.city_code, p.city_name);
      }
      if (p.barangay_code) {
        addressFields.brgySel.setValue(p.barangay_code, p.barangay_name);
      }
      addressFields.purokField.setValue(p.purok);
    }

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
  };

  if (!data.first_name || !data.last_name || !data.gender) {
    showToast('First name, last name, and gender are required', 'error');
    return;
  }

  if (addressFields) {
    data.province_code = addressFields.provinceSel.getValue();
    data.province_name = addressFields.provinceSel.getName();
    data.city_code = addressFields.citySel.getValue();
    data.city_name = addressFields.citySel.getName();
    data.barangay_code = addressFields.brgySel.getValue();
    data.barangay_name = addressFields.brgySel.getName();
    data.purok = addressFields.purokField.getValue();

    if (!data.province_code || !data.city_code || !data.barangay_code) {
      showToast('Please select Province, City/Municipality, and Barangay', 'error');
      return;
    }
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

    const addressParts = [
      p.purok, p.barangay_name, p.city_name, p.province_name
    ].filter(Boolean);

    const fields = [
      { label: 'Age', value: p.age },
      { label: 'Gender', value: p.gender },
      { label: 'Occupation', value: p.occupation },
      { label: 'Address', value: addressParts.join(', ') },
    ].filter(f => f.value);

    document.getElementById('view-content').innerHTML = `
      <div class="detail-name">${name}</div>
      <div class="detail-info">
        ${fields.map(f => `
          <div class="detail-field">
            <span class="label">${f.label}</span>
            <span class="value">${f.value}</span>
          </div>
        `).join('')}
        ${!fields.length ? '<p style="color:var(--text-muted)">No additional information.</p>' : ''}
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
      const address = [p.barangay_name, p.city_name, p.province_name].filter(Boolean).join(', ') || p.address || '\u2014';
      return `<tr>
        <td>${name}</td>
        <td>${p.age ?? '\u2014'}</td>
        <td>${p.gender || '\u2014'}</td>
        <td>${p.occupation || '\u2014'}</td>
        <td>${address}</td>
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

document.addEventListener('DOMContentLoaded', async () => {
  await AddressService.load();
  addressFields = buildAddressFields();

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
