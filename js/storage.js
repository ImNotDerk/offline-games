/**
 * Zenith Local Storage Manager
 * Persistent high scores and mid-game state serialization.
 */

class StorageManager {
  constructor(prefix = 'zenith_') {
    this.prefix = prefix;
  }

  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(this.prefix + key);
      return val ? JSON.parse(val) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  set(key, val) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(val));
    } catch (e) {}
  }

  getHighScore(gameId) {
    return this.get(`hi_${gameId}`, 0);
  }

  setHighScore(gameId, score) {
    const cur = this.getHighScore(gameId);
    if (score > cur) {
      this.set(`hi_${gameId}`, score);
      return { isNew: true, score };
    }
    return { isNew: false, score: cur };
  }

  saveState(gameId, state) {
    this.set(`state_${gameId}`, state);
  }

  loadState(gameId) {
    return this.get(`state_${gameId}`, null);
  }

  clearState(gameId) {
    try {
      localStorage.removeItem(this.prefix + `state_${gameId}`);
    } catch (e) {}
  }
}

window.storageManager = new StorageManager();
