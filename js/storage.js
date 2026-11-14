/**
 * LocalStorage Manager for Offline Games & Tools
 * Handles high scores, user preferences, notes, and game saves completely offline.
 */
class OfflineStorage {
  constructor(prefix = 'offline_haven_') {
    this.prefix = prefix;
  }

  get(key, defaultValue = null) {
    try {
      const val = localStorage.getItem(this.prefix + key);
      return val ? JSON.parse(val) : defaultValue;
    } catch (e) {
      console.warn('Storage read error:', e);
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage write error:', e);
    }
  }

  getHighScore(gameId) {
    return this.get(`highscore_${gameId}`, 0);
  }

  setHighScore(gameId, score) {
    const current = this.getHighScore(gameId);
    if (score > current) {
      this.set(`highscore_${gameId}`, score);
      return { isNewRecord: true, highScore: score };
    }
    return { isNewRecord: false, highScore: current };
  }

  getAllHighScores() {
    const scores = {};
    const keys = ['tetris', 'snake', '2048', 'spaceRunner', 'minesweeper', 'flappy'];
    keys.forEach(k => {
      scores[k] = this.getHighScore(k);
    });
    return scores;
  }
}

window.offlineStorage = new OfflineStorage();
