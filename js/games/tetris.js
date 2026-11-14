/**
 * Tetra Blocks (Tetris style)
 * Optimized for instant restarts, smooth ghost piece, and high-score saves.
 */
class TetrisGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.cols = 10;
    this.rows = 20;
    this.grid = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.bestScore = window.offlineStorage.getHighScore('tetris');
    this.currentPiece = null;
    this.holdPiece = null;
    this.canHold = true;
    this.nextPiece = null;
    this.gameLoop = null;
    this.isPaused = false;
    this.isGameOver = false;

    this.shapes = {
      I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#06b6d4' },
      J: { shape: [[1,0,0],[1,1,1],[0,0,0]], color: '#3b82f6' },
      L: { shape: [[0,0,1],[1,1,1],[0,0,0]], color: '#f97316' },
      O: { shape: [[1,1],[1,1]], color: '#eab308' },
      S: { shape: [[0,1,1],[1,1,0],[0,0,0]], color: '#22c55e' },
      T: { shape: [[0,1,0],[1,1,1],[0,0,0]], color: '#a855f7' },
      Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], color: '#ef4444' }
    };
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title-group">
          <h3>Tetra Blocks</h3>
          <p class="game-subtitle">Classic falling block puzzle with ghost piece & hold system!</p>
        </div>
        <div class="stats-row">
          <div class="stat-pill"><span class="stat-label">SCORE</span><span id="tetris-score" class="stat-value">0</span></div>
          <div class="stat-pill"><span class="stat-label">BEST</span><span id="tetris-best" class="stat-value">${this.bestScore}</span></div>
          <div class="stat-pill"><span class="stat-label">LINES</span><span id="tetris-lines" class="stat-value">0</span></div>
          <div class="stat-pill"><span class="stat-label">LEVEL</span><span id="tetris-level" class="stat-value">1</span></div>
        </div>
      </div>
      <div class="game-controls-bar">
        <button class="btn btn-primary" id="tetris-restart">New Game (R)</button>
        <button class="btn btn-secondary" id="tetris-pause">Pause (P)</button>
      </div>
      <div class="tetris-layout">
        <div class="tetris-side-col">
          <div class="mini-box">
            <h4>HOLD (C)</h4>
            <canvas id="tetris-hold-canvas" width="80" height="80"></canvas>
          </div>
        </div>
        <div class="canvas-wrapper" id="tetris-canvas-wrapper" style="position: relative;">
          <canvas id="tetris-canvas" width="260" height="520"></canvas>
        </div>
        <div class="tetris-side-col">
          <div class="mini-box">
            <h4>NEXT</h4>
            <canvas id="tetris-next-canvas" width="80" height="80"></canvas>
          </div>
        </div>
      </div>
      <div class="game-instructions">
        <p><strong>Controls:</strong> <strong>←/→</strong>: Move, <strong>↑</strong>: Rotate, <strong>↓</strong>: Soft Drop, <strong>Space</strong>: Hard Drop, <strong>C / Shift</strong>: Hold Piece. Press <strong>R</strong> or <strong>Enter</strong> to restart on game over.</p>
      </div>
    `;

    this.mainCanvas = document.getElementById('tetris-canvas');
    this.mainCtx = this.mainCanvas.getContext('2d');
    this.holdCanvas = document.getElementById('tetris-hold-canvas');
    this.holdCtx = this.holdCanvas.getContext('2d');
    this.nextCanvas = document.getElementById('tetris-next-canvas');
    this.nextCtx = this.nextCanvas.getContext('2d');

    document.getElementById('tetris-restart').onclick = () => this.restart();
    document.getElementById('tetris-pause').onclick = () => this.togglePause();

    this.setupKeys();
    this.restart();
  }

  restart() {
    if (this.gameLoop) clearInterval(this.gameLoop);
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.isPaused = false;
    this.isGameOver = false;
    this.holdPiece = null;
    this.canHold = true;
    this.nextPiece = this.randomPiece();
    this.spawnPiece();
    this.updateStats();

    const wrapper = document.getElementById('tetris-canvas-wrapper');
    const existingOverlay = wrapper ? wrapper.querySelector('.game-overlay') : null;
    if (existingOverlay) existingOverlay.remove();

    const pBtn = document.getElementById('tetris-pause');
    if (pBtn) pBtn.textContent = 'Pause (P)';

    this.startLoop();
    window.soundEngine.click();
    this.render();
  }

  getSpeed() {
    return Math.max(100, 750 - (this.level - 1) * 65);
  }

  startLoop() {
    if (this.gameLoop) clearInterval(this.gameLoop);
    this.gameLoop = setInterval(() => this.tick(), this.getSpeed());
  }

  randomPiece() {
    const keys = Object.keys(this.shapes);
    const key = keys[Math.floor(Math.random() * keys.length)];
    const def = this.shapes[key];
    return {
      type: key,
      matrix: JSON.parse(JSON.stringify(def.shape)),
      color: def.color,
      x: 0,
      y: 0
    };
  }

  spawnPiece() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.randomPiece();
    this.canHold = true;

    this.currentPiece.x = Math.floor((this.cols - this.currentPiece.matrix[0].length) / 2);
    this.currentPiece.y = 0;

    if (this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y)) {
      this.isGameOver = true;
      clearInterval(this.gameLoop);
      window.soundEngine.gameOver();
      this.showGameOverOverlay();
    }
  }

  checkCollision(matrix, px, py) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const nx = px + c;
          const ny = py + r;
          if (nx < 0 || nx >= this.cols || ny >= this.rows) return true;
          if (ny >= 0 && this.grid[ny][nx] !== null) return true;
        }
      }
    }
    return false;
  }

  rotateMatrix(matrix) {
    const N = matrix.length;
    const res = Array(N).fill(null).map(() => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        res[c][N - 1 - r] = matrix[r][c];
      }
    }
    return res;
  }

  rotate() {
    if (this.isPaused || this.isGameOver || !this.currentPiece) return;
    const rotated = this.rotateMatrix(this.currentPiece.matrix);
    const kicks = [0, 1, -1, 2, -2];
    for (let kick of kicks) {
      if (!this.checkCollision(rotated, this.currentPiece.x + kick, this.currentPiece.y)) {
        this.currentPiece.matrix = rotated;
        this.currentPiece.x += kick;
        window.soundEngine.rotate();
        this.render();
        return;
      }
    }
  }

  moveLeft() {
    if (this.isPaused || this.isGameOver || !this.currentPiece) return;
    if (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x - 1, this.currentPiece.y)) {
      this.currentPiece.x--;
      window.soundEngine.move();
      this.render();
    }
  }

  moveRight() {
    if (this.isPaused || this.isGameOver || !this.currentPiece) return;
    if (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x + 1, this.currentPiece.y)) {
      this.currentPiece.x++;
      window.soundEngine.move();
      this.render();
    }
  }

  softDrop() {
    if (this.isPaused || this.isGameOver || !this.currentPiece) return;
    if (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1)) {
      this.currentPiece.y++;
      this.score += 1;
      this.updateStats();
      this.render();
    } else {
      this.lockPiece();
    }
  }

  hardDrop() {
    if (this.isPaused || this.isGameOver || !this.currentPiece) return;
    let dropped = 0;
    while (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, this.currentPiece.y + 1)) {
      this.currentPiece.y++;
      dropped++;
    }
    this.score += dropped * 2;
    window.soundEngine.drop();
    this.lockPiece();
  }

  hold() {
    if (this.isPaused || this.isGameOver || !this.canHold || !this.currentPiece) return;
    window.soundEngine.rotate();
    const currType = this.currentPiece.type;
    if (!this.holdPiece) {
      this.holdPiece = currType;
      this.spawnPiece();
    } else {
      const temp = this.holdPiece;
      this.holdPiece = currType;
      const def = this.shapes[temp];
      this.currentPiece = {
        type: temp,
        matrix: JSON.parse(JSON.stringify(def.shape)),
        color: def.color,
        x: Math.floor((this.cols - def.shape[0].length) / 2),
        y: 0
      };
    }
    this.canHold = false;
    this.render();
  }

  lockPiece() {
    const { matrix, x, y, color } = this.currentPiece;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const ny = y + r;
          const nx = x + c;
          if (ny >= 0 && ny < this.rows && nx >= 0 && nx < this.cols) {
            this.grid[ny][nx] = color;
          }
        }
      }
    }

    this.clearLines();
    this.spawnPiece();
    this.render();
  }

  clearLines() {
    let cleared = 0;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r].every(cell => cell !== null)) {
        this.grid.splice(r, 1);
        this.grid.unshift(Array(this.cols).fill(null));
        cleared++;
        r++;
      }
    }

    if (cleared > 0) {
      this.lines += cleared;
      const points = [0, 100, 300, 500, 800];
      this.score += (points[cleared] || 100) * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      window.soundEngine.lineClear();
      this.startLoop();
      this.updateStats();
    }
  }

  getGhostY() {
    if (!this.currentPiece) return 0;
    let gy = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece.matrix, this.currentPiece.x, gy + 1)) {
      gy++;
    }
    return gy;
  }

  tick() {
    if (this.isPaused || this.isGameOver) return;
    this.softDrop();
  }

  togglePause() {
    if (this.isGameOver) {
      this.restart();
      return;
    }
    this.isPaused = !this.isPaused;
    const pBtn = document.getElementById('tetris-pause');
    if (this.isPaused) {
      if (pBtn) pBtn.textContent = 'Resume (P)';
    } else {
      if (pBtn) pBtn.textContent = 'Pause (P)';
    }
    this.render();
  }

  updateStats() {
    const sEl = document.getElementById('tetris-score');
    const bEl = document.getElementById('tetris-best');
    const lEl = document.getElementById('tetris-lines');
    const vEl = document.getElementById('tetris-level');
    if (sEl) sEl.textContent = this.score;
    if (lEl) lEl.textContent = this.lines;
    if (vEl) vEl.textContent = this.level;

    const res = window.offlineStorage.setHighScore('tetris', this.score);
    this.bestScore = res.highScore;
    if (bEl) bEl.textContent = this.bestScore;
  }

  showGameOverOverlay() {
    const wrapper = document.getElementById('tetris-canvas-wrapper');
    if (!wrapper) return;
    const existing = wrapper.querySelector('.game-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'game-overlay';
    overlay.innerHTML = `
      <div class="overlay-card">
        <h3>Game Over! 💀</h3>
        <p>Score: <strong>${this.score}</strong> | Lines: <strong>${this.lines}</strong></p>
        <button class="btn btn-primary" id="tetris-overlay-restart">Play Again (Enter / Space)</button>
      </div>
    `;
    wrapper.appendChild(overlay);
    overlay.querySelector('#tetris-overlay-restart').onclick = (e) => {
      e.stopPropagation();
      this.restart();
    };
  }

  setupKeys() {
    this.keyHandler = (e) => {
      if (this.isGameOver) {
        if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'r') {
          e.preventDefault();
          this.restart();
          return;
        }
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'c', 'C', 'Shift', 'p', 'P', 'r', 'R'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft') this.moveLeft();
      else if (e.key === 'ArrowRight') this.moveRight();
      else if (e.key === 'ArrowUp') this.rotate();
      else if (e.key === 'ArrowDown') this.softDrop();
      else if (e.key === ' ') this.hardDrop();
      else if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') this.hold();
      else if (e.key.toLowerCase() === 'p') this.togglePause();
      else if (e.key.toLowerCase() === 'r') this.restart();
    };
    window.addEventListener('keydown', this.keyHandler);

    this.mainCanvas.onclick = () => {
      if (this.isGameOver) this.restart();
    };
  }

  renderMini(ctx, canvas, pieceType) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!pieceType) return;
    const def = this.shapes[pieceType];
    const m = def.shape;
    const size = 16;
    const ox = (canvas.width - m[0].length * size) / 2;
    const oy = (canvas.height - m.length * size) / 2;

    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (m[r][c]) {
          ctx.fillStyle = def.color;
          ctx.beginPath();
          ctx.roundRect(ox + c * size + 1, oy + r * size + 1, size - 2, size - 2, 3);
          ctx.fill();
        }
      }
    }
  }

  render() {
    const { mainCtx: ctx, mainCanvas: canvas } = this;
    if (!ctx) return;
    const cellW = canvas.width / this.cols;
    const cellH = canvas.height / this.rows;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellH);
      ctx.lineTo(canvas.width, r * cellH);
      ctx.stroke();
    }
    for (let c = 0; c <= this.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellW, 0);
      ctx.lineTo(c * cellW, canvas.height);
      ctx.stroke();
    }

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) {
          ctx.fillStyle = this.grid[r][c];
          ctx.beginPath();
          ctx.roundRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2, 4);
          ctx.fill();
        }
      }
    }

    if (this.currentPiece && !this.isGameOver) {
      const gy = this.getGhostY();
      const m = this.currentPiece.matrix;
      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (m[r][c]) {
            const gx = (this.currentPiece.x + c) * cellW;
            const posY = (gy + r) * cellH;
            ctx.strokeStyle = this.currentPiece.color;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(gx + 2, posY + 2, cellW - 4, cellH - 4, 3);
            ctx.stroke();
            ctx.fill();
          }
        }
      }

      for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
          if (m[r][c]) {
            const px = (this.currentPiece.x + c) * cellW;
            const py = (this.currentPiece.y + r) * cellH;
            ctx.fillStyle = this.currentPiece.color;
            ctx.shadowColor = this.currentPiece.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(px + 1, py + 1, cellW - 2, cellH - 2, 4);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }
    }

    this.renderMini(this.holdCtx, this.holdCanvas, this.holdPiece);
    this.renderMini(this.nextCtx, this.nextCanvas, this.nextPiece ? this.nextPiece.type : null);

    if (this.isPaused) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
  }

  destroy() {
    if (this.gameLoop) clearInterval(this.gameLoop);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
  }
}

window.TetrisGame = TetrisGame;
