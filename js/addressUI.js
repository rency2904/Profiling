const AddressUI = (() => {
  function createSearchableSelect(containerId, label, placeholder, items, onChange) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
      <label>${label} <span class="required">*</span></label>
      <div class="select-search" id="${containerId}-wrapper">
        <input type="text" class="select-search-input" id="${containerId}-input"
               placeholder="${placeholder}" autocomplete="off">
        <input type="hidden" id="${containerId}-value" name="${containerId}-value">
        <div class="select-search-dropdown" id="${containerId}-dropdown"></div>
      </div>
    `;

    const input = document.getElementById(`${containerId}-input`);
    const hidden = document.getElementById(`${containerId}-value`);
    const dropdown = document.getElementById(`${containerId}-dropdown`);

    let currentItems = [...items];
    let selectedItem = null;
    let activeIndex = -1;
    let isOpen = false;

    function renderDropdown(filter) {
      const q = (filter || '').toLowerCase().trim();
      const filtered = currentItems.filter(item => item.name.toLowerCase().includes(q));
      dropdown.innerHTML = '';

      if (filtered.length === 0) {
        dropdown.innerHTML = '<div class="select-search-empty">No results found</div>';
        dropdown.style.display = 'block';
        isOpen = true;
        return;
      }

      filtered.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'select-search-item' + (selectedItem && item.code === selectedItem.code ? ' selected' : '');
        div.textContent = item.name;
        div.dataset.index = i;
        div.addEventListener('click', () => selectItem(item));
        div.addEventListener('mouseenter', () => { activeIndex = i; highlightItem(); });
        dropdown.appendChild(div);
      });

      dropdown.style.display = 'block';
      isOpen = true;
      activeIndex = -1;
    }

    function highlightItem() {
      const items = dropdown.querySelectorAll('.select-search-item');
      items.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
      if (activeIndex >= 0 && items[activeIndex]) {
        items[activeIndex].scrollIntoView({ block: 'nearest' });
      }
    }

    function selectItem(item) {
      selectedItem = item;
      input.value = item.name;
      hidden.value = item.code;
      dropdown.style.display = 'none';
      isOpen = false;
      if (onChange) onChange(item);
    }

    function clearSelection() {
      selectedItem = null;
      input.value = '';
      hidden.value = '';
    }

    function updateItems(newItems) {
      currentItems = [...newItems];
      if (selectedItem && !newItems.find(i => i.code === selectedItem.code)) {
        clearSelection();
      }
    }

    input.addEventListener('focus', () => {
      if (!input.disabled) renderDropdown(input.value);
    });

    input.addEventListener('input', () => {
      if (input.disabled) return;
      selectedItem = null;
      hidden.value = '';
      renderDropdown(input.value);
    });

    input.addEventListener('keydown', (e) => {
      if (input.disabled) return;
      const items = dropdown.querySelectorAll('.select-search-item');

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, currentItems.length - 1);
        highlightItem();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        highlightItem();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && currentItems[activeIndex]) {
          selectItem(currentItems[activeIndex]);
        }
      } else if (e.key === 'Escape') {
        dropdown.style.display = 'none';
        isOpen = false;
      }
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.style.display = 'none';
        isOpen = false;
        if (!selectedItem && input.value) {
          input.value = '';
        }
      }
    });

    return {
      clear: clearSelection,
      setValue: (code, name) => {
        const item = currentItems.find(i => i.code === code) || { code, name };
        selectItem(item);
      },
      getValue: () => selectedItem ? selectedItem.code : null,
      getName: () => selectedItem ? selectedItem.name : '',
      _updateItems: updateItems,
    };
  }

  function createTextField(containerId, label, placeholder) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
      <label>${label}</label>
      <input type="text" id="${containerId}-input" placeholder="${placeholder}">
    `;
    return {
      getValue: () => document.getElementById(`${containerId}-input`).value,
      setValue: (v) => { document.getElementById(`${containerId}-input`).value = v || ''; },
      clear: () => { document.getElementById(`${containerId}-input`).value = ''; },
    };
  }

  return { createSearchableSelect, createTextField };
})();
