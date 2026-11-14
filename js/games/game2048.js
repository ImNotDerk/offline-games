/**
 * 2048 Game Module
 */
class Game2048 {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.gridSize = 4;
    this.board = [];
    this.score = 0;
    this.bestScore = window.offlineStorage.getHighScore('2048');
    this.history = [];
    this.won = false;
    this.keepPlaying = false;
    this.gameOver = false;
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title-group">
          <h3>2048</h3>
          <p class="game-subtitle">Join the numbers and get to the <strong>2048</strong> tile!</p>
        </div>
        <div class="stats-row">
          <div class="stat-pill"><span class="stat-label">SCORE</span><span id="g2048-score" class="stat-value">0</span></div>
          <div class="stat-pill"><span class="stat-label">BEST</span><span id="g2048-best" class="stat-value">${this.bestScore}</span></div>
        </div>
      </div>
      <div class="game-controls-bar">
        <button class="btn btn-primary" id="g2048-restart">New Game</button>
        <button class="btn btn-secondary" id="g2048-undo">Undo</button>
      </div>
      <div class="g2048-container" id="g2048-board" tabindex="0" role="region" aria-label="2048 Game Board"></div>
      <div class="game-instructions">
        <p><strong>Controls:</strong> Use <strong>Arrow Keys</strong> or <strong>W, A, S, D</strong> (or swipe on touch) to slide tiles.</p>
      </div>
    `;

    document.getElementById('g2048-restart').onclick = () => this.restart();
    document.getElementById('g2048-undo').onclick = () => this.undo();

    this.boardEl = document.getElementById('g2048-board');
    this.setupKeyListeners();
    this.setupTouchListeners();
    this.restart();
  }

  restart() {
    this.board = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
    this.score = 0;
    this.history = [];
    this.won = false;
    this.keepPlaying = false;
    this.gameOver = false;
    this.addRandomTile();
    this.addRandomTile();
    this.render();
  }

  saveHistory() {
    if (this.history.length > 5) this.history.shift();
    this.history.push({
      board: JSON.parse(JSON.stringify(this.board)),
      score: this.score
    });
  }

  undo() {
    if (this.history.length === 0) return;
    const prev = this.history.pop();
    this.board = prev.board;
    this.score = prev.score;
    this.gameOver = false;
    window.soundEngine.move();
    this.render();
  }

  addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.board[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  render() {
    this.boardEl.innerHTML = '';
    const scoreEl = document.getElementById('g2048-score');
    const bestEl = document.getElementById('g2048-best');
    if (scoreEl) scoreEl.textContent = this.score;

    const record = window.offlineStorage.setHighScore('2048', this.score);
    this.bestScore = record.highScore;
    if (bestEl) bestEl.textContent = this.bestScore;

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const val = this.board[r][c];
        const cell = document.createElement('div');
        cell.className = 'g2048-cell';
        if (val > 0) {
          const tile = document.createElement('div');
          tile.className = `g2048-tile tile-${val <= 2048 ? val : 'super'}`;
          tile.textContent = val;
          cell.appendChild(tile);
        }
        this.boardEl.appendChild(cell);
      }
    }

    if (this.won && !this.keepPlaying) {
      this.showOverlay('You reached 2048! 🎉', 'Keep Going', () => {
        this.keepPlaying = true;
        this.render();
      });
    } else if (this.gameOver) {
      this.showOverlay('Game Over!', 'Try Again', () => this.restart());
    }
  }

  showOverlay(msg, actionText, actionFn) {
    const overlay = document.createElement('div');
    overlay.className = 'game-overlay';
    overlay.innerHTML = `
      <div class="overlay-card">
        <h3>${msg}</h3>
        <p>Final Score: <strong>${this.score}</strong></p>
        <button class="btn btn-primary" id="overlay-action">${actionText}</button>
      </div>
    `;
    this.boardEl.appendChild(overlay);
    overlay.querySelector('#overlay-action').onclick = () => {
      window.soundEngine.click();
      actionFn();
    };
  }

  setupKeyListeners() {
    this.keyHandler = (e) => {
      if (this.gameOver) {
        if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'r') {
          e.preventDefault();
          this.restart();
          return;
        }
      }

      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        this.restart();
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
        let moved = false;
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') moved = this.move('left');
        else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') moved = this.move('right');
        else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') moved = this.move('up');
        else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') moved = this.move('down');

        if (moved) {
          window.soundEngine.move();
          this.addRandomTile();
          if (!this.canMove()) {
            this.gameOver = true;
            window.soundEngine.gameOver();
          }
          this.render();
        }
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  setupTouchListeners() {
    let startX = 0, startY = 0;
    this.boardEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.boardEl.addEventListener('touchend', (e) => {
      if (!startX || !startY) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) > 30) {
        let moved = false;
        if (absDx > absDy) {
          moved = dx > 0 ? this.move('right') : this.move('left');
        } else {
          moved = dy > 0 ? this.move('down') : this.move('up');
        }
        if (moved) {
          window.soundEngine.move();
          this.addRandomTile();
          if (!this.canMove()) {
            this.gameOver = true;
            window.soundEngine.gameOver();
          }
          this.render();
        }
      }
      startX = 0;
      startY = 0;
    }, { passive: true });
  }

  move(dir) {
    if (this.gameOver) return false;
    const oldBoard = JSON.stringify(this.board);
    this.saveHistory();

    let rotated = 0;
    if (dir === 'up') { this.rotateLeft(); rotated = 1; }
    else if (dir === 'right') { this.rotateLeft(); this.rotateLeft(); rotated = 2; }
    else if (dir === 'down') { this.rotateRight(); rotated = 3; }

    let gainedPoints = 0;
    for (let r = 0; r < this.gridSize; r++) {
      let row = this.board[r].filter(val => val !== 0);
      for (let c = 0; c < row.length - 1; c++) {
        if (row[c] === row[c + 1]) {
          row[c] *= 2;
          gainedPoints += row[c];
          if (row[c] === 2048 && !this.won) {
            this.won = true;
            window.soundEngine.victory();
          }
          row.splice(c + 1, 1);
        }
      }
      while (row.length < this.gridSize) row.push(0);
      this.board[r] = row;
    }

    if (rotated === 1) this.rotateRight();
    else if (rotated === 2) { this.rotateLeft(); this.rotateLeft(); }
    else if (rotated === 3) this.rotateLeft();

    const changed = oldBoard !== JSON.stringify(this.board);
    if (changed) {
      this.score += gainedPoints;
      if (gainedPoints > 0) window.soundEngine.coin();
    } else {
      this.history.pop(); // nothing changed, don't store duplicate history
    }
    return changed;
  }

  rotateLeft() {
    const res = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        res[this.gridSize - 1 - c][r] = this.board[r][c];
      }
    }
    this.board = res;
  }

  rotateRight() {
    const res = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        res[c][this.gridSize - 1 - r] = this.board[r][c];
      }
    }
    this.board = res;
  }

  canMove() {
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.board[r][c] === 0) return true;
        if (c + 1 < this.gridSize && this.board[r][c] === this.board[r][c + 1]) return true;
        if (r + 1 < this.gridSize && this.board[r][c] === this.board[r + 1][c]) return true;
      }
    }
    return false;
  }

  destroy() {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
  }
}

window.Game2048 = Game2048;
