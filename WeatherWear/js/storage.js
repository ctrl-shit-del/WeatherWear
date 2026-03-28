/**
 * WeatherWear Storage Module
 * Abstraction layer over localStorage with TTL, namespacing, and error handling
 */

const WW_PREFIX = 'ww_';

const Storage = {
  set(key, value, ttlMinutes = null) {
    try {
      const entry = {
        value,
        ts: Date.now(),
        ttl: ttlMinutes ? ttlMinutes * 60 * 1000 : null
      };
      localStorage.setItem(WW_PREFIX + key, JSON.stringify(entry));
      return true;
    } catch (e) {
      console.error('[Storage] Set error:', e);
      return false;
    }
  },

  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(WW_PREFIX + key);
      if (!raw) return defaultValue;
      const entry = JSON.parse(raw);
      if (entry.ttl && Date.now() - entry.ts > entry.ttl) {
        this.remove(key);
        return defaultValue;
      }
      return entry.value;
    } catch (e) {
      console.error('[Storage] Get error:', e);
      return defaultValue;
    }
  },

  remove(key) {
    localStorage.removeItem(WW_PREFIX + key);
  },

  clear(prefix = '') {
    Object.keys(localStorage)
      .filter(k => k.startsWith(WW_PREFIX + prefix))
      .forEach(k => localStorage.removeItem(k));
  },

  exists(key) {
    return this.get(key) !== null;
  }
};
