/**
 * Cosmic Voyage: Star Defender (Action & Arcade)
 * Optimized for instant restarts, smooth star parallax, and power-up progression.
 */
class SpaceRunnerGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.canvas = null;
    this.ctx = null;
    this.player = {
      x: 184,
      y: 420,
      width: 32,
      height: 36,
      speed: 6,
      shield: 100,
      maxShield: 100,
      blasterLevel: 1
    };
    this.keys = {};
    this.lasers = [];
    this.enemies = [];
    this.powerups = [];
    this.particles = [];
    this.stars = [];
    this.score = 0;
    this.bestScore = window.offlineStorage.getHighScore('spaceRunner');
    this.wave = 1;
    this.spawnTimer = 0;
    this.fireTimer = 0;
    this.autoFire = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.animId = null;
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title-group">
          <h3>Cosmic Voyage</h3>
          <p class="game-subtitle">Piloting deep space: blast asteroids, collect shields, survive waves!</p>
        </div>
        <div class="stats-row">
          <div class="stat-pill"><span class="stat-label">SCORE</span><span id="sr-score" class="stat-value">0</span></div>
          <div class="stat-pill"><span class="stat-label">BEST</span><span id="sr-best" class="stat-value">${this.bestScore}</span></div>
          <div class="stat-pill"><span class="stat-label">WAVE</span><span id="sr-wave" class="stat-value">1</span></div>
          <div class="stat-pill"><span class="stat-label">SHIELD</span><span id="sr-shield" class="stat-value">100%</span></div>
        </div>
      </div>
      <div class="game-controls-bar">
        <button class="btn btn-primary" id="sr-restart">New Mission (R)</button>
        <button class="btn btn-secondary" id="sr-pause">Pause (P)</button>
        <button class="btn btn-outline" id="sr-autofire">⚡ Auto-Fire: ON</button>
      </div>
      <div class="canvas-wrapper" id="sr-canvas-wrapper" style="position: relative;">
        <canvas id="sr-canvas" width="400" height="500"></canvas>
      </div>
      <div class="game-instructions">
        <p><strong>Controls:</strong> <strong>Arrow Keys</strong> or <strong>WASD</strong> to pilot ship. <strong>Space</strong> to manual fire. Mouse / Touch drag supported. Press <strong>R</strong> or <strong>Space</strong> to restart on game over.</p>
      </div>
    `;

    this.canvas = document.getElementById('sr-canvas');
    this.ctx = this.canvas.getContext('2d');

    document.getElementById('sr-restart').onclick = () => this.restart();
    document.getElementById('sr-pause').onclick = () => this.togglePause();

    const afBtn = document.getElementById('sr-autofire');
    afBtn.onclick = () => {
      this.autoFire = !this.autoFire;
      afBtn.textContent = `⚡ Auto-Fire: ${this.autoFire ? 'ON' : 'OFF'}`;
      afBtn.classList.toggle('active', this.autoFire);
    };

    this.initStars();
    this.setupListeners();
    this.restart();
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * 400,
        y: Math.random() * 500,
        speed: Math.random() * 2 + 0.5,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.3 ? '#ffffff' : '#38bdf8'
      });
    }
  }

  restart() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.player = {
      x: 184,
      y: 420,
      width: 32,
      height: 36,
      speed: 6,
      shield: 100,
      maxShield: 100,
      blasterLevel: 1
    };
    this.lasers = [];
    this.enemies = [];
    this.powerups = [];
    this.particles = [];
    this.score = 0;
    this.wave = 1;
    this.spawnTimer = 0;
    this.fireTimer = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.updateStats();

    const wrapper = document.getElementById('sr-canvas-wrapper');
    const existingOverlay = wrapper ? wrapper.querySelector('.game-overlay') : null;
    if (existingOverlay) existingOverlay.remove();

    const pBtn = document.getElementById('sr-pause');
    if (pBtn) pBtn.textContent = 'Pause (P)';

    this.loop();
    window.soundEngine.click();
  }

  togglePause() {
    if (this.isGameOver) {
      this.restart();
      return;
    }
    this.isPaused = !this.isPaused;
    const pBtn = document.getElementById('sr-pause');
    if (this.isPaused) {
      if (pBtn) pBtn.textContent = 'Resume (P)';
    } else {
      if (pBtn) pBtn.textContent = 'Pause (P)';
      this.loop();
    }
  }

  setupListeners() {
    this.kd = (e) => {
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
      this.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'p') this.togglePause();
      else if (e.key.toLowerCase() === 'r') this.restart();
    };
    this.ku = (e) => {
      this.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', this.kd);
    window.addEventListener('keyup', this.ku);

    let dragging = false;
    this.canvas.onmousedown = (e) => {
      if (this.isGameOver) {
        this.restart();
        return;
      }
      dragging = true;
      this.trackPointer(e);
    };
    window.onmousemove = (e) => { if (dragging) this.trackPointer(e); };
    window.onmouseup = () => { dragging = false; };

    this.canvas.ontouchstart = (e) => {
      if (this.isGameOver) {
        this.restart();
        return;
      }
      dragging = true;
      this.trackPointer(e.touches[0]);
    };
    this.canvas.ontouchmove = (e) => { if (dragging) this.trackPointer(e.touches[0]); };
    this.canvas.ontouchend = () => { dragging = false; };
  }

  trackPointer(e) {
    if (this.isPaused || this.isGameOver) return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, mx - this.player.width / 2));
    this.player.y = Math.max(50, Math.min(this.canvas.height - this.player.height, my - this.player.height / 2));
  }

  fireLaser() {
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y;
    window.soundEngine.laser();

    if (this.player.blasterLevel === 1) {
      this.lasers.push({ x: px, y: py, vx: 0, vy: -10, color: '#38bdf8' });
    } else if (this.player.blasterLevel === 2) {
      this.lasers.push({ x: px - 8, y: py, vx: 0, vy: -10, color: '#38bdf8' });
      this.lasers.push({ x: px + 8, y: py, vx: 0, vy: -10, color: '#38bdf8' });
    } else {
      this.lasers.push({ x: px, y: py, vx: 0, vy: -10, color: '#f59e0b' });
      this.lasers.push({ x: px - 10, y: py, vx: -2, vy: -9, color: '#38bdf8' });
      this.lasers.push({ x: px + 10, y: py, vx: 2, vy: -9, color: '#38bdf8' });
    }
  }

  spawnEnemy() {
    const types = [
      { type: 'asteroid', r: 16, hp: 2, score: 20, speed: Math.random() * 1.5 + 1.5, color: '#94a3b8' },
      { type: 'drone', r: 12, hp: 1, score: 30, speed: Math.random() * 2 + 2.5, color: '#ef4444' },
      { type: 'heavy', r: 24, hp: 5, score: 60, speed: Math.random() * 0.8 + 1.2, color: '#a855f7' }
    ];
    const pick = types[Math.floor(Math.random() * (this.wave > 2 ? 3 : 2))];
    this.enemies.push({
      x: Math.random() * (this.canvas.width - 40) + 20,
      y: -30,
      ...pick,
      maxHp: pick.hp
    });
  }

  update() {
    if (this.keys['arrowleft'] || this.keys['a']) this.player.x -= this.player.speed;
    if (this.keys['arrowright'] || this.keys['d']) this.player.x += this.player.speed;
    if (this.keys['arrowup'] || this.keys['w']) this.player.y -= this.player.speed;
    if (this.keys['arrowdown'] || this.keys['s']) this.player.y += this.player.speed;

    this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
    this.player.y = Math.max(50, Math.min(this.canvas.height - this.player.height, this.player.y));

    this.fireTimer++;
    if ((this.autoFire || this.keys[' ']) && this.fireTimer > 11) {
      this.fireLaser();
      this.fireTimer = 0;
    }

    this.stars.forEach(st => {
      st.y += st.speed;
      if (st.y > this.canvas.height) {
        st.y = 0;
        st.x = Math.random() * this.canvas.width;
      }
    });

    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.x += l.vx;
      l.y += l.vy;
      if (l.y < -10) this.lasers.splice(i, 1);
    }

    this.spawnTimer++;
    const spawnRate = Math.max(22, 60 - this.wave * 5);
    if (this.spawnTimer > spawnRate) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const en = this.enemies[i];
      en.y += en.speed;

      const dx = en.x - (this.player.x + this.player.width / 2);
      const dy = en.y - (this.player.y + this.player.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < en.r + 14) {
        this.player.shield -= 25;
        this.createExplosion(en.x, en.y, '#ef4444', 15);
        window.soundEngine.explosion();
        this.enemies.splice(i, 1);
        this.updateStats();
        if (this.player.shield <= 0) {
          this.endGame();
          return;
        }
        continue;
      }

      for (let j = this.lasers.length - 1; j >= 0; j--) {
        const l = this.lasers[j];
        if (Math.hypot(en.x - l.x, en.y - l.y) < en.r + 5) {
          en.hp--;
          this.lasers.splice(j, 1);
          this.createSpark(l.x, l.y);

          if (en.hp <= 0) {
            this.score += en.score;
            this.createExplosion(en.x, en.y, en.color, 18);
            window.soundEngine.explosion();

            if (Math.random() < 0.22) {
              this.powerups.push({
                x: en.x,
                y: en.y,
                type: Math.random() < 0.5 ? 'shield' : 'blaster',
                vy: 1.5
              });
            }

            this.enemies.splice(i, 1);
            if (this.score >= this.wave * 350) {
              this.wave++;
              window.soundEngine.victory();
            }
            this.updateStats();
            break;
          }
        }
      }

      if (en.y > this.canvas.height + 40) {
        this.enemies.splice(i, 1);
      }
    }

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += p.vy;
      const pdx = p.x - (this.player.x + this.player.width / 2);
      const pdy = p.y - (this.player.y + this.player.height / 2);
      if (Math.hypot(pdx, pdy) < 24) {
        if (p.type === 'shield') {
          this.player.shield = Math.min(this.player.maxShield, this.player.shield + 30);
        } else {
          this.player.blasterLevel = Math.min(3, this.player.blasterLevel + 1);
        }
        window.soundEngine.coin();
        this.powerups.splice(i, 1);
        this.updateStats();
        continue;
      }
      if (p.y > this.canvas.height + 20) this.powerups.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= 0.04;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  createSpark(x, y) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: '#fbbf24',
        life: 0.5
      });
    }
  }

  createExplosion(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
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
    const sEl = document.getElementById('sr-score');
    const bEl = document.getElementById('sr-best');
    const wEl = document.getElementById('sr-wave');
    const shEl = document.getElementById('sr-shield');
    if (sEl) sEl.textContent = this.score;
    if (wEl) wEl.textContent = this.wave;
    if (shEl) {
      shEl.textContent = `${Math.max(0, this.player.shield)}%`;
      shEl.style.color = this.player.shield < 30 ? '#ef4444' : '#10b981';
    }

    const res = window.offlineStorage.setHighScore('spaceRunner', this.score);
    this.bestScore = res.highScore;
    if (bEl) bEl.textContent = this.bestScore;
  }

  endGame() {
    this.isGameOver = true;
    window.soundEngine.gameOver();
    this.updateStats();
    this.render();
    this.showGameOverOverlay();
  }

  showGameOverOverlay() {
    const wrapper = document.getElementById('sr-canvas-wrapper');
    if (!wrapper) return;
    const existing = wrapper.querySelector('.game-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'game-overlay';
    overlay.innerHTML = `
      <div class="overlay-card">
        <h3>Hull Breached! 💥</h3>
        <p>Final Score: <strong>${this.score}</strong> | Wave: <strong>${this.wave}</strong></p>
        <button class="btn btn-primary" id="sr-overlay-restart">Launch Again (Space / Enter)</button>
      </div>
    `;
    wrapper.appendChild(overlay);
    overlay.querySelector('#sr-overlay-restart').onclick = (e) => {
      e.stopPropagation();
      this.restart();
    };
  }

  loop() {
    if (this.isPaused || this.isGameOver) return;
    this.update();
    this.render();
    this.animId = requestAnimationFrame(() => this.loop());
  }

  render() {
    const { ctx, canvas } = this;
    if (!ctx) return;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.stars.forEach(st => {
      ctx.fillStyle = st.color;
      ctx.fillRect(st.x, st.y, st.size, st.size);
    });

    this.powerups.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = p.type === 'shield' ? '#10b981' : '#f59e0b';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type === 'shield' ? 'S' : 'B', p.x, p.y);
    });

    this.enemies.forEach(en => {
      ctx.fillStyle = en.color;
      ctx.shadowColor = en.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(en.x, en.y, en.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (en.maxHp > 1) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.r + 3, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (en.hp / en.maxHp)));
        ctx.stroke();
      }
    });

    this.lasers.forEach(l => {
      ctx.fillStyle = l.color;
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(l.x - 2, l.y, 4, 12);
      ctx.shadowBlur = 0;
    });

    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.fillRect(pt.x, pt.y, 3, 3);
      ctx.globalAlpha = 1.0;
    });

    if (!this.isGameOver) {
      const px = this.player.x;
      const py = this.player.y;
      const pw = this.player.width;
      const ph = this.player.height;

      ctx.fillStyle = Math.random() > 0.5 ? '#f97316' : '#facc15';
      ctx.beginPath();
      ctx.moveTo(px + pw / 2 - 5, py + ph);
      ctx.lineTo(px + pw / 2 + 5, py + ph);
      ctx.lineTo(px + pw / 2, py + ph + 10 + Math.random() * 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(px + pw / 2, py);
      ctx.lineTo(px + pw, py + ph);
      ctx.lineTo(px + pw / 2, py + ph - 8);
      ctx.lineTo(px, py + ph);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px + pw / 2, py + 14, 4, 0, Math.PI * 2);
      ctx.fill();

      if (this.player.shield > 25) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + ph / 2, pw * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (this.isPaused) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MISSION PAUSED', canvas.width / 2, canvas.height / 2);
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.kd) window.removeEventListener('keydown', this.kd);
    if (this.ku) window.removeEventListener('keyup', this.ku);
  }
}

window.SpaceRunnerGame = SpaceRunnerGame;
