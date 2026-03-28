/**
 * WeatherWear — Wardrobe Module
 * CRUD, tagging, analytics tracking, photo storage
 */

const Wardrobe = (() => {
  const TYPES = ['top', 'base', 'mid', 'outer', 'bottom', 'shoes', 'accessory', 'dress', 'suit'];
  const SEASONS = ['all', 'spring', 'summer', 'autumn', 'winter'];
  const FABRICS = [
    'cotton', 'linen', 'wool', 'silk', 'denim', 'polyester', 'nylon', 'leather',
    'suede', 'fleece', 'cashmere', 'merino wool', 'synthetic blend', 'organic cotton',
    'hemp', 'bamboo', 'recycled polyester', 'other'
  ];

  function getAll() {
    return Storage.get('wardrobe_items', []);
  }

  function getById(id) {
    return getAll().find(i => i.id === id);
  }

  function add(itemData) {
    const items = getAll();
    const newItem = {
      id: 'wi_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      ...itemData,
      wearCount: 0,
      lastWorn: null,
      addedAt: new Date().toISOString(),
      tags: itemData.tags || autoTag(itemData)
    };
    items.push(newItem);
    Storage.set('wardrobe_items', items);
    return newItem;
  }

  function update(id, updates) {
    const items = getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates, id };
    Storage.set('wardrobe_items', items);
    return items[idx];
  }

  function remove(id) {
    const items = getAll().filter(i => i.id !== id);
    Storage.set('wardrobe_items', items);
  }

  function recordWear(id) {
    const items = getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;
    items[idx].wearCount = (items[idx].wearCount || 0) + 1;
    items[idx].lastWorn = new Date().toISOString();
    Storage.set('wardrobe_items', items);
  }

  function autoTag(item) {
    const tags = [];
    const name = (item.name || '').toLowerCase();
    const fabric = (item.fabric || '').toLowerCase();
    // Season inference from fabric
    if (['wool', 'fleece', 'cashmere', 'merino wool', 'down'].some(f => fabric.includes(f))) {
      tags.push('winter', 'cold');
    }
    if (['linen', 'bamboo', 'cotton'].some(f => fabric.includes(f))) {
      tags.push('summer', 'breathable');
    }
    // Type-based tags
    if (item.type === 'outer') tags.push('layerable');
    if (item.type === 'shoes' && name.includes('boot')) tags.push('rain', 'cold');
    if (item.type === 'shoes' && name.includes('sandal')) tags.push('summer', 'warm');
    if (item.type === 'accessory' && (name.includes('umbrella') || name.includes('raincoat'))) {
      tags.push('rain', 'waterproof');
    }
    // Eco tags
    if (['organic', 'recycled', 'hemp', 'bamboo'].some(f => fabric.includes(f))) {
      tags.push('sustainable');
    }
    return [...new Set([...tags, ...(item.season !== 'all' ? [item.season] : [])])];
  }

  function getStats() {
    const items = getAll();
    const total = items.length;
    const byType = {};
    const bySeason = {};
    const byFabric = {};
    let sustainableCount = 0;
    let totalWears = 0;

    for (const item of items) {
      byType[item.type] = (byType[item.type] || 0) + 1;
      bySeason[item.season] = (bySeason[item.season] || 0) + 1;
      byFabric[item.fabric] = (byFabric[item.fabric] || 0) + 1;
      totalWears += item.wearCount || 0;
      if (item.tags?.includes('sustainable')) sustainableCount++;
    }

    const neverWorn = items.filter(i => !i.wearCount || i.wearCount === 0);
    const mostWorn = [...items].sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0)).slice(0, 5);
    const leastWorn = [...items]
      .filter(i => (i.wearCount || 0) > 0)
      .sort((a, b) => (a.wearCount || 0) - (b.wearCount || 0))
      .slice(0, 5);

    const ecoFabrics = ['organic cotton', 'recycled polyester', 'hemp', 'bamboo', 'linen', 'merino wool'];
    const synthFabrics = ['polyester', 'nylon', 'synthetic blend', 'acrylic'];
    let ecoWears = 0, synthWears = 0;
    for (const it of items) {
      const fab = (it.fabric || '').toLowerCase();
      const w = it.wearCount || 0;
      if (ecoFabrics.some(f => fab.includes(f))) ecoWears += w;
      if (synthFabrics.some(f => fab.includes(f))) synthWears += w;
    }
    // Rough CO₂ estimate: synthetic ~0.8kg per wear, eco ~0.2kg
    const co2Saved = Math.round((ecoWears * 0.6 - synthWears * 0.2) * 10) / 10;

    return {
      total, byType, bySeason, byFabric,
      sustainableCount, sustainablePercent: total ? Math.round(sustainableCount / total * 100) : 0,
      totalWears, avgWears: total ? Math.round(totalWears / total * 10) / 10 : 0,
      neverWorn, mostWorn, leastWorn,
      co2Saved
    };
  }

  function mixAndMatch(outfit, userOccasion) {
    const wardrobeItems = getAll();
    if (!wardrobeItems.length) return { wardrobeItems: [], suggestions: outfit.items };
    const { matched, missing } = RecommendationEngine
      ? { matched: [], missing: outfit.items }
      : { matched: [], missing: outfit.items };
    return { wardrobeItems: matched, suggestions: missing };
  }

  return {
    getAll, getById, add, update, remove, recordWear,
    autoTag, getStats, mixAndMatch,
    TYPES, SEASONS, FABRICS
  };
})();
