/**
 * Snake Retro Deluxe
 * Optimized for instant restarts, smooth controls, and high-score saves.
 */
class SnakeGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.canvas = null;
    this.ctx = null;
    this.gridSize = 20;
    this.tileSize = 20;
    this.snake = [];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = { x: 15, y: 10 };
    this.bonusFood = null;
    this.bonusTimer = 0;
    this.score = 0;
    this.bestScore = window.offlineStorage.getHighScore('snake');
    this.particles = [];
    this.gameLoop = null;
    this.speed = 110;
    this.isPaused = false;
    this.isGameOver = false;
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title-group">
          <h3>Snake Retro Deluxe</h3>
          <p class="game-subtitle">Devour energy orbs and grow your cyber serpent!</p>
        </div>
        <div class="stats-row">
          <div class="stat-pill"><span class="stat-label">SCORE</span><span id="snake-score" class="stat-value">0</span></div>
          <div class="stat-pill"><span class="stat-label">BEST</span><span id="snake-best" class="stat-value">${this.bestScore}</span></div>
          <div class="stat-pill"><span class="stat-label">LENGTH</span><span id="snake-len" class="stat-value">3</span></div>
        </div>
      </div>
      <div class="game-controls-bar">
        <button class="btn btn-primary" id="snake-restart">New Game (R)</button>
        <button class="btn btn-secondary" id="snake-pause">Pause (P)</button>
        <select id="snake-speed-select" class="form-select">
          <option value="140">Speed: Chill</option>
          <option value="110" selected>Speed: Classic</option>
          <option value="75">Speed: Turbo</option>
        </select>
      </div>
      <div class="canvas-wrapper" id="snake-canvas-wrapper" style="position: relative;">
        <canvas id="snake-canvas" width="440" height="440"></canvas>
      </div>
      <div class="virtual-dpad" id="snake-dpad">
        <div class="dpad-row"><button class="dpad-btn" data-dir="up">▲</button></div>
        <div class="dpad-row">
          <button class="dpad-btn" data-dir="left">◀</button>
          <button class="dpad-btn" data-dir="down">▼</button>
          <button class="dpad-btn" data-dir="right">▶</button>
        </div>
      </div>
      <div class="game-instructions">
        <p><strong>Controls:</strong> <strong>Arrow Keys</strong> or <strong>WASD</strong>. Press <strong>Space</strong> or <strong>P</strong> to pause. Press <strong>R</strong> or <strong>Space</strong> when game over to restart instantly.</p>
      </div>
    `;

    this.canvas = document.getElementById('snake-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.tileSize = this.canvas.width / this.gridSize;

    document.getElementById('snake-restart').onclick = () => this.restart();
    document.getElementById('snake-pause').onclick = () => this.togglePause();
    document.getElementById('snake-speed-select').onchange = (e) => {
      this.speed = parseInt(e.target.value, 10);
      if (!this.isGameOver && !this.isPaused) {
        clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.tick(), this.speed);
      }
    };

    document.querySelectorAll('#snake-dpad .dpad-btn').forEach(btn => {
      btn.onclick = () => {
        const dir = btn.getAttribute('data-dir');
        this.handleDirectionChange(dir);
      };
    });

    this.setupKeys();
    this.restart();
  }

  restart() {
    if (this.gameLoop) clearInterval(this.gameLoop);
    this.snake = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.particles = [];
    this.bonusFood = null;
    this.spawnFood();
    this.updateStats();

    // Remove any game-over overlay if present
    const wrapper = document.getElementById('snake-canvas-wrapper');
    const existingOverlay = wrapper ? wrapper.querySelector('.game-overlay') : null;
    if (existingOverlay) existingOverlay.remove();

    const pauseBtn = document.getElementById('snake-pause');
    if (pauseBtn) pauseBtn.textContent = 'Pause (P)';

    this.gameLoop = setInterval(() => this.tick(), this.speed);
    window.soundEngine.click();
    this.render();
  }

  togglePause() {
    if (this.isGameOver) {
      this.restart();
      return;
    }
    this.isPaused = !this.isPaused;
    const pauseBtn = document.getElementById('snake-pause');
    if (this.isPaused) {
      clearInterval(this.gameLoop);
      if (pauseBtn) pauseBtn.textContent = 'Resume (P)';
      this.render();
    } else {
      if (pauseBtn) pauseBtn.textContent = 'Pause (P)';
      this.gameLoop = setInterval(() => this.tick(), this.speed);
    }
  }

  spawnFood() {
    let valid = false;
    while (!valid) {
      this.food = {
        x: Math.floor(Math.random() * this.gridSize),
        y: Math.floor(Math.random() * this.gridSize)
      };
      valid = !this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y);
    }

    if (!this.bonusFood && Math.random() < 0.25) {
      let bValid = false;
      let bPos;
      while (!bValid) {
        bPos = {
          x: Math.floor(Math.random() * this.gridSize),
          y: Math.floor(Math.random() * this.gridSize)
        };
        bValid = !this.snake.some(s => s.x === bPos.x && s.y === bPos.y) &&
                 (bPos.x !== this.food.x || bPos.y !== this.food.y);
      }
      this.bonusFood = bPos;
      this.bonusTimer = 35;
    }
  }

  handleDirectionChange(dir) {
    if (this.isGameOver) return;
    if (dir === 'up' && this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
    else if (dir === 'down' && this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
    else if (dir === 'left' && this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
    else if (dir === 'right' && this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
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

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') this.handleDirectionChange('up');
      else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') this.handleDirectionChange('down');
      else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') this.handleDirectionChange('left');
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') this.handleDirectionChange('right');
      else if (e.key.toLowerCase() === 'r') this.restart();
      else if (e.key === ' ' || e.key.toLowerCase() === 'p') this.togglePause();
    };
    window.addEventListener('keydown', this.keyHandler);

    this.canvas.onclick = () => {
      if (this.isGameOver) this.restart();
    };
  }

  tick() {
    this.direction = this.nextDirection;
    const head = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y
    };

    if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
      this.endGame();
      return;
    }

    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.createParticles(head.x * this.tileSize + this.tileSize/2, head.y * this.tileSize + this.tileSize/2, '#10b981');
      window.soundEngine.coin();
      this.spawnFood();
      this.updateStats();
    } else if (this.bonusFood && head.x === this.bonusFood.x && head.y === this.bonusFood.y) {
      this.score += 35;
      this.createParticles(head.x * this.tileSize + this.tileSize/2, head.y * this.tileSize + this.tileSize/2, '#f59e0b');
      window.soundEngine.victory();
      this.bonusFood = null;
      this.updateStats();
    } else {
      this.snake.pop();
    }

    if (this.bonusFood) {
      this.bonusTimer--;
      if (this.bonusTimer <= 0) this.bonusFood = null;
    }

    this.render();
  }

  createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0
      });
    }
  }

  updateStats() {
    const scoreEl = document.getElementById('snake-score');
    const bestEl = document.getElementById('snake-best');
    const lenEl = document.getElementById('snake-len');
    if (scoreEl) scoreEl.textContent = this.score;
    if (lenEl) lenEl.textContent = this.snake.length;

    const res = window.offlineStorage.setHighScore('snake', this.score);
    this.bestScore = res.highScore;
    if (bestEl) bestEl.textContent = this.bestScore;
  }

  endGame() {
    this.isGameOver = true;
    clearInterval(this.gameLoop);
    window.soundEngine.gameOver();
    this.render();
    this.showGameOverOverlay();
  }

  showGameOverOverlay() {
    const wrapper = document.getElementById('snake-canvas-wrapper');
    if (!wrapper) return;
    const existing = wrapper.querySelector('.game-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'game-overlay';
    overlay.innerHTML = `
      <div class="overlay-card">
        <h3>Game Over! 💀</h3>
        <p>Final Score: <strong>${this.score}</strong> | Length: <strong>${this.snake.length}</strong></p>
        <button class="btn btn-primary" id="snake-overlay-restart">Play Again (Space / Enter)</button>
      </div>
    `;
    wrapper.appendChild(overlay);
    overlay.querySelector('#snake-overlay-restart').onclick = (e) => {
      e.stopPropagation();
      this.restart();
    };
  }

  render() {
    const { ctx, canvas, tileSize } = this;
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= this.gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * tileSize, 0);
      ctx.lineTo(i * tileSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * tileSize);
      ctx.lineTo(canvas.width, i * tileSize);
      ctx.stroke();
    }

    // Render Food
    const fx = this.food.x * tileSize + tileSize / 2;
    const fy = this.food.y * tileSize + tileSize / 2;
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(fx, fy, tileSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Render Bonus Food
    if (this.bonusFood) {
      const bx = this.bonusFood.x * tileSize + tileSize / 2;
      const by = this.bonusFood.y * tileSize + tileSize / 2;
      const pulse = Math.sin(Date.now() / 150) * 2;
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(bx, by, tileSize * 0.45 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Render Snake
    this.snake.forEach((seg, index) => {
      const isHead = index === 0;
      const sx = seg.x * tileSize;
      const sy = seg.y * tileSize;

      if (isHead) {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 14;
      } else {
        const ratio = 1 - (index / this.snake.length) * 0.6;
        ctx.fillStyle = `rgba(56, 189, 248, ${ratio})`;
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect(sx + 1, sy + 1, tileSize - 2, tileSize - 2, isHead ? 6 : 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Render Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    if (this.isPaused) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
  }

  destroy() {
    if (this.gameLoop) clearInterval(this.gameLoop);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
  }
}

window.SnakeGame = SnakeGame;
