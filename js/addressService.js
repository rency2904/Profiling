const AddressService = (() => {
  const HUC_PARENT = {
    '301': '054', '302': '045', '303': '011', '304': '002',
    '305': '043', '306': '022', '307': '024', '308': '063',
    '309': '035', '310': '030', '311': '022', '312': '056',
    '313': '022', '314': '071', '315': '053', '316': '037', '317': '073',
  };

  let provinces = null;
  let muncities = null;
  let barangays = null;
  let loadPromise = null;

  async function load() {
    if (provinces) return;
    if (loadPromise) return loadPromise;

    loadPromise = Promise.all([
      fetch('assets/data/provinces.json').then(r => r.json()),
      fetch('assets/data/muncities.json').then(r => r.json()),
      fetch('assets/data/barangays.json').then(r => r.json()),
    ]).then(([p, m, b]) => {
      provinces = p;
      muncities = m;
      barangays = b;
    });

    return loadPromise;
  }

  function getProvinces() {
    if (!provinces) return [];
    return provinces.filter(p => !p.cityClass || p.provCode.startsWith('8'));
  }

  function getProvCodesFor(provCode) {
    const codes = [provCode];
    for (const [huc, parent] of Object.entries(HUC_PARENT)) {
      if (parent === provCode) codes.push(huc);
    }
    return codes;
  }

  function getMuncitiesByProvince(provCode) {
    if (!muncities || !provCode) return [];
    const codes = getProvCodesFor(provCode);
    return muncities.filter(m => codes.includes(m.provCode));
  }

  function getBarangaysByMuncity(munCityCode) {
    if (!barangays || !munCityCode) return [];
    return barangays.filter(b => b.munCityCode === munCityCode);
  }

  function getProvinceByCode(provCode) {
    if (!provinces) return null;
    if (HUC_PARENT[provCode]) {
      return provinces.find(p => p.provCode === HUC_PARENT[provCode]) || null;
    }
    return provinces.find(p => p.provCode === provCode) || null;
  }

  function getMuncityByCode(munCityCode) {
    if (!muncities) return null;
    return muncities.find(m => m.munCityCode === munCityCode) || null;
  }

  function getBarangayByCode(brgyCode) {
    if (!barangays) return null;
    return barangays.find(b => b.brgyCode === brgyCode) || null;
  }

  function getDisplayProvCode(provCode) {
    if (!provCode) return null;
    return HUC_PARENT[provCode] || provCode;
  }

  return {
    load, getProvinces, getMuncitiesByProvince, getBarangaysByMuncity,
    getProvinceByCode, getMuncityByCode, getBarangayByCode,
    getDisplayProvCode,
  };
})();
