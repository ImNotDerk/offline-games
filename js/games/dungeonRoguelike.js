/**
 * Shadow Crypt: Turn-Based Roguelike Dungeon Crawler
 */
class DungeonRoguelikeGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.mapWidth = 32;
    this.mapHeight = 22;
    this.tileSize = 20;
    this.canvas = null;
    this.ctx = null;
    this.map = [];
    this.visible = [];
    this.explored = [];
    this.player = null;
    this.monsters = [];
    this.items = [];
    this.stairs = null;
    this.floor = 1;
    this.maxFloors = 5;
    this.combatLog = [];
    this.gameOver = false;
    this.won = false;
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title-group">
          <h3>Shadow Crypt</h3>
          <p class="game-subtitle">Turn-based tactical dungeon crawler. Delve 5 depths and vanquish the crypt lord!</p>
        </div>
        <div class="stats-row">
          <div class="stat-pill"><span class="stat-label">FLOOR</span><span id="rl-floor" class="stat-value">1</span></div>
          <div class="stat-pill"><span class="stat-label">HP</span><span id="rl-hp" class="stat-value">30/30</span></div>
          <div class="stat-pill"><span class="stat-label">LEVEL</span><span id="rl-lvl" class="stat-value">1</span></div>
          <div class="stat-pill"><span class="stat-label">ATK / DEF</span><span id="rl-stats" class="stat-value">8 / 2</span></div>
          <div class="stat-pill"><span class="stat-label">GOLD</span><span id="rl-gold" class="stat-value">0</span></div>
        </div>
      </div>
      <div class="game-controls-bar">
        <button class="btn btn-primary" id="rl-restart">New Expedition</button>
        <button class="btn btn-secondary" id="rl-wait">Wait Turn (Space)</button>
        <button class="btn btn-outline" id="rl-drink-potion">Drink Potion (<span id="rl-potions">1</span>)</button>
      </div>
      <div class="dungeon-layout">
        <div class="canvas-wrapper">
          <canvas id="rl-canvas" width="640" height="440"></canvas>
        </div>
        <div class="dungeon-sidebar">
          <h4>Combat Log</h4>
          <div id="rl-log" class="combat-log-box"></div>
          <div class="virtual-dpad" id="rl-dpad">
            <div class="dpad-row"><button class="dpad-btn" data-dir="up">▲</button></div>
            <div class="dpad-row">
              <button class="dpad-btn" data-dir="left">◀</button>
              <button class="dpad-btn" data-dir="down">▼</button>
              <button class="dpad-btn" data-dir="right">▶</button>
            </div>
          </div>
        </div>
      </div>
      <div class="game-instructions">
        <p><strong>Controls:</strong> <strong>Arrow Keys</strong> or <strong>WASD</strong> to walk and bump-attack enemies. <strong>Space</strong> to wait. Walk onto stairs (<strong>&gt;</strong>) to descend.</p>
      </div>
    `;

    this.canvas = document.getElementById('rl-canvas');
    this.ctx = this.canvas.getContext('2d');

    document.getElementById('rl-restart').onclick = () => this.restart();
    document.getElementById('rl-wait').onclick = () => this.playerWait();
    document.getElementById('rl-drink-potion').onclick = () => this.drinkPotion();

    document.querySelectorAll('#rl-dpad .dpad-btn').forEach(btn => {
      btn.onclick = () => {
        const dir = btn.getAttribute('data-dir');
        if (dir === 'up') this.tryMove(0, -1);
        else if (dir === 'down') this.tryMove(0, 1);
        else if (dir === 'left') this.tryMove(-1, 0);
        else if (dir === 'right') this.tryMove(1, 0);
      };
    });

    this.setupKeys();
    this.restart();
  }

  restart() {
    this.floor = 1;
    this.gameOver = false;
    this.won = false;
    this.combatLog = [];
    this.player = {
      x: 0,
      y: 0,
      hp: 35,
      maxHp: 35,
      atk: 9,
      def: 3,
      level: 1,
      xp: 0,
      gold: 0,
      potions: 2
    };

    this.log('You enter the dark crypt depths... Be on guard!');
    this.generateFloor();
    this.render();
  }

  log(msg) {
    this.combatLog.unshift(msg);
    if (this.combatLog.length > 25) this.combatLog.pop();
    const logEl = document.getElementById('rl-log');
    if (logEl) {
      logEl.innerHTML = this.combatLog.map(m => `<div class="log-entry">${m}</div>`).join('');
    }
  }

  generateFloor() {
    // 0: Wall, 1: Floor
    this.map = Array(this.mapHeight).fill(null).map(() => Array(this.mapWidth).fill(0));
    this.visible = Array(this.mapHeight).fill(null).map(() => Array(this.mapWidth).fill(false));
    this.explored = Array(this.mapHeight).fill(null).map(() => Array(this.mapWidth).fill(false));
    this.monsters = [];
    this.items = [];

    const rooms = [];
    const minSize = 4, maxSize = 8;
    for (let i = 0; i < 7; i++) {
      const w = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
      const h = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
      const x = Math.floor(Math.random() * (this.mapWidth - w - 2)) + 1;
      const y = Math.floor(Math.random() * (this.mapHeight - h - 2)) + 1;

      // Carve room
      for (let ry = y; ry < y + h; ry++) {
        for (let rx = x; rx < x + w; rx++) {
          this.map[ry][rx] = 1;
        }
      }

      if (rooms.length > 0) {
        // Connect to previous room with corridor
        const prev = rooms[rooms.length - 1];
        let cx = prev.cx, cy = prev.cy;
        const targetX = Math.floor(x + w / 2);
        const targetY = Math.floor(y + h / 2);

        while (cx !== targetX) {
          this.map[cy][cx] = 1;
          cx += cx < targetX ? 1 : -1;
        }
        while (cy !== targetY) {
          this.map[cy][cx] = 1;
          cy += cy < targetY ? 1 : -1;
        }
      }

      rooms.push({ x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) });
    }

    // Place Player in room 0
    this.player.x = rooms[0].cx;
    this.player.y = rooms[0].cy;

    // Place Stairs in last room
    const lastRoom = rooms[rooms.length - 1];
    this.stairs = { x: lastRoom.cx, y: lastRoom.cy };

    // Spawn Monsters and Items in intermediate rooms
    for (let i = 1; i < rooms.length; i++) {
      const r = rooms[i];
      const isBossRoom = (this.floor === this.maxFloors && i === rooms.length - 1);

      if (isBossRoom) {
        this.monsters.push({
          x: r.cx + 1,
          y: r.cy,
          name: 'Crypt Overlord',
          symbol: '👹',
          hp: 60,
          maxHp: 60,
          atk: 14,
          def: 6,
          xp: 150,
          color: '#ef4444'
        });
      } else {
        // Normal monsters
        const count = Math.floor(Math.random() * 2) + 1;
        for (let m = 0; m < count; m++) {
          const mx = Math.floor(r.x + Math.random() * (r.w - 1)) + 1;
          const my = Math.floor(r.y + Math.random() * (r.h - 1)) + 1;
          const tier = Math.random();
          let mDef;
          if (tier < 0.5) {
            mDef = { name: 'Giant Spider', symbol: '🕷️', hp: 12 + this.floor * 3, atk: 6 + this.floor, def: 1, xp: 20, color: '#a855f7' };
          } else if (tier < 0.8) {
            mDef = { name: 'Skeleton', symbol: '💀', hp: 18 + this.floor * 4, atk: 8 + this.floor * 2, def: 2, xp: 35, color: '#94a3b8' };
          } else {
            mDef = { name: 'Dark Sorcerer', symbol: '🧙', hp: 22 + this.floor * 4, atk: 11 + this.floor * 2, def: 3, xp: 50, color: '#f59e0b' };
          }
          this.monsters.push({ x: mx, y: my, ...mDef, maxHp: mDef.hp });
        }

        // Spawn Loot
        if (Math.random() < 0.7) {
          const ix = Math.floor(r.x + Math.random() * (r.w - 1)) + 1;
          const iy = Math.floor(r.y + Math.random() * (r.h - 1)) + 1;
          const lootType = Math.random();
          if (lootType < 0.45) {
            this.items.push({ x: ix, y: iy, type: 'potion', name: 'Health Potion', symbol: '🧪' });
          } else if (lootType < 0.75) {
            this.items.push({ x: ix, y: iy, type: 'gold', name: 'Gold Pile', amount: 15 + this.floor * 10, symbol: '🪙' });
          } else {
            const isSword = Math.random() < 0.5;
            this.items.push({
              x: ix, y: iy,
              type: isSword ? 'weapon' : 'armor',
              name: isSword ? 'Iron Greatsword (+3 ATK)' : 'Steel Shield (+2 DEF)',
              bonus: isSword ? 3 : 2,
              symbol: isSword ? '⚔️' : '🛡️'
            });
          }
        }
      }
    }

    this.computeFOV();
    this.updateStats();
  }

  computeFOV() {
    // Reset visibility
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        this.visible[y][x] = false;
      }
    }

    // Simple raycast FOV around player radius 7
    const radius = 7;
    for (let angle = 0; angle < 360; angle += 4) {
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      for (let d = 0; d <= radius; d += 0.5) {
        const tx = Math.round(this.player.x + cos * d);
        const ty = Math.round(this.player.y + sin * d);

        if (tx < 0 || tx >= this.mapWidth || ty < 0 || ty >= this.mapHeight) break;

        this.visible[ty][tx] = true;
        this.explored[ty][tx] = true;

        if (this.map[ty][tx] === 0) break; // walls block vision
      }
    }
  }

  tryMove(dx, dy) {
    if (this.gameOver || this.won) return;

    const nx = this.player.x + dx;
    const ny = this.player.y + dy;

    if (nx < 0 || nx >= this.mapWidth || ny < 0 || ny >= this.mapHeight) return;

    // Check wall
    if (this.map[ny][nx] === 0) {
      window.soundEngine.click();
      return;
    }

    // Check Monster (bump to attack)
    const monsterIdx = this.monsters.findIndex(m => m.x === nx && m.y === ny);
    if (monsterIdx !== -1) {
      this.attackMonster(this.monsters[monsterIdx], monsterIdx);
      this.finishPlayerTurn();
      return;
    }

    // Move player
    this.player.x = nx;
    this.player.y = ny;
    window.soundEngine.move();

    // Check Items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (it.x === nx && it.y === ny) {
        if (it.type === 'potion') {
          this.player.potions++;
          this.log(`Picked up a ${it.name}!`);
          window.soundEngine.coin();
        } else if (it.type === 'gold') {
          this.player.gold += it.amount;
          this.log(`Found ${it.amount} Gold coins!`);
          window.soundEngine.coin();
        } else if (it.type === 'weapon') {
          this.player.atk += it.bonus;
          this.log(`Equipped ${it.name}!`);
          window.soundEngine.victory();
        } else if (it.type === 'armor') {
          this.player.def += it.bonus;
          this.log(`Equipped ${it.name}!`);
          window.soundEngine.victory();
        }
        this.items.splice(i, 1);
      }
    }

    // Check Stairs
    if (this.stairs && nx === this.stairs.x && ny === this.stairs.y) {
      if (this.floor < this.maxFloors) {
        this.floor++;
        this.log(`Descending deeper to Floor ${this.floor}...`);
        window.soundEngine.victory();
        this.generateFloor();
        this.render();
        return;
      }
    }

    this.finishPlayerTurn();
  }

  playerWait() {
    if (this.gameOver || this.won) return;
    this.log('You rest and bide your time.');
    this.finishPlayerTurn();
  }

  drinkPotion() {
    if (this.gameOver || this.won) return;
    if (this.player.potions <= 0) {
      this.log('No health potions remaining!');
      return;
    }
    this.player.potions--;
    const heal = Math.min(25, this.player.maxHp - this.player.hp);
    this.player.hp += heal;
    this.log(`Drank potion: restored ${heal} HP!`);
    window.soundEngine.coin();
    this.finishPlayerTurn();
  }

  attackMonster(monster, idx) {
    const dmg = Math.max(1, this.player.atk - monster.def + Math.floor(Math.random() * 3) - 1);
    monster.hp -= dmg;
    this.log(`You strike ${monster.name} for ${dmg} DMG!`);
    window.soundEngine.laser();

    if (monster.hp <= 0) {
      this.log(`Defeated ${monster.name}! Gained ${monster.xp} XP.`);
      window.soundEngine.explosion();
      this.player.xp += monster.xp;
      this.monsters.splice(idx, 1);

      // Check Boss defeat
      if (monster.name === 'Crypt Overlord') {
        this.won = true;
        this.log('👑 You have slain the Crypt Overlord and conquered the dungeon!');
        window.soundEngine.victory();
      }

      // Check Level up
      if (this.player.xp >= this.player.level * 60) {
        this.player.level++;
        this.player.maxHp += 8;
        this.player.hp = this.player.maxHp;
        this.player.atk += 2;
        this.player.def += 1;
        this.log(`⭐ LEVEL UP! You reached Level ${this.player.level}!`);
        window.soundEngine.victory();
      }
    }
  }

  finishPlayerTurn() {
    this.computeFOV();
    this.updateMonsters();
    this.updateStats();
    this.render();
  }

  updateMonsters() {
    if (this.gameOver || this.won) return;

    for (let m of this.monsters) {
      // Monsters act only if visible or close
      const dist = Math.hypot(m.x - this.player.x, m.y - this.player.y);
      if (dist <= 6 && this.visible[m.y][m.x]) {
        if (dist <= 1.5) {
          // Attack player
          const dmg = Math.max(1, m.atk - this.player.def + Math.floor(Math.random() * 2));
          this.player.hp -= dmg;
          this.log(`${m.name} strikes you for ${dmg} DMG!`);
          window.soundEngine.playBeep(220, 'sawtooth', 0.15, 0.2);

          if (this.player.hp <= 0) {
            this.player.hp = 0;
            this.gameOver = true;
            this.log('💀 You have perished in the cold crypt...');
            window.soundEngine.gameOver();
            return;
          }
        } else {
          // Path towards player (simple cardinal step)
          const dx = Math.sign(this.player.x - m.x);
          const dy = Math.sign(this.player.y - m.y);
          let targetX = m.x + dx;
          let targetY = m.y;

          if (this.map[targetY][targetX] !== 1 || this.monsters.some(other => other.x === targetX && other.y === targetY)) {
            targetX = m.x;
            targetY = m.y + dy;
          }

          if (this.map[targetY][targetX] === 1 && !this.monsters.some(other => other.x === targetX && other.y === targetY) && (targetX !== this.player.x || targetY !== this.player.y)) {
            m.x = targetX;
            m.y = targetY;
          }
        }
      }
    }
  }

  updateStats() {
    const fEl = document.getElementById('rl-floor');
    const hEl = document.getElementById('rl-hp');
    const lEl = document.getElementById('rl-lvl');
    const sEl = document.getElementById('rl-stats');
    const gEl = document.getElementById('rl-gold');
    const pEl = document.getElementById('rl-potions');

    if (fEl) fEl.textContent = `${this.floor}/${this.maxFloors}`;
    if (hEl) hEl.textContent = `${this.player.hp}/${this.player.maxHp}`;
    if (lEl) lEl.textContent = this.player.level;
    if (sEl) sEl.textContent = `${this.player.atk} / ${this.player.def}`;
    if (gEl) gEl.textContent = this.player.gold;
    if (pEl) pEl.textContent = this.player.potions;
  }

  setupKeys() {
    this.keyHandler = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') this.tryMove(0, -1);
      else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') this.tryMove(0, 1);
      else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') this.tryMove(-1, 0);
      else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') this.tryMove(1, 0);
      else if (e.key === ' ') this.playerWait();
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  render() {
    const { ctx, canvas, tileSize } = this;
    if (!ctx) return;

    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render tiles
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const isVis = this.visible[y][x];
        const isExp = this.explored[y][x];
        const px = x * tileSize;
        const py = y * tileSize;

        if (!isExp) {
          ctx.fillStyle = '#05070d';
          ctx.fillRect(px, py, tileSize, tileSize);
          continue;
        }

        if (this.map[y][x] === 0) {
          // Wall
          ctx.fillStyle = isVis ? '#334155' : '#1e293b';
          ctx.fillRect(px, py, tileSize, tileSize);
          ctx.strokeStyle = isVis ? '#475569' : '#0f172a';
          ctx.strokeRect(px, py, tileSize, tileSize);
        } else {
          // Floor
          ctx.fillStyle = isVis ? '#1e293b' : '#0f172a';
          ctx.fillRect(px, py, tileSize, tileSize);
        }
      }
    }

    // Render Stairs
    if (this.stairs && this.explored[this.stairs.y][this.stairs.x]) {
      const isVis = this.visible[this.stairs.y][this.stairs.x];
      ctx.fillStyle = isVis ? '#38bdf8' : '#0369a1';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('>', this.stairs.x * tileSize + tileSize/2, this.stairs.y * tileSize + tileSize/2);
    }

    // Render Items
    this.items.forEach(it => {
      if (this.visible[it.y][it.x]) {
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(it.symbol, it.x * tileSize + tileSize/2, it.y * tileSize + tileSize/2);
      }
    });

    // Render Monsters
    this.monsters.forEach(m => {
      if (this.visible[m.y][m.x]) {
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.symbol, m.x * tileSize + tileSize/2, m.y * tileSize + tileSize/2);

        // Monster HP bar
        if (m.hp < m.maxHp) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(m.x * tileSize + 2, m.y * tileSize + tileSize - 4, tileSize - 4, 3);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(m.x * tileSize + 2, m.y * tileSize + tileSize - 4, (tileSize - 4) * (m.hp / m.maxHp), 3);
        }
      }
    });

    // Render Player
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧙‍♂️', this.player.x * tileSize + tileSize/2, this.player.y * tileSize + tileSize/2);

    // Overlays
    if (this.won) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VICTORY ACHIEVED! 🏆', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`You conquered the Shadow Crypt with ${this.player.gold} Gold!`, canvas.width / 2, canvas.height / 2 + 15);
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Click New Expedition to embark again', canvas.width / 2, canvas.height / 2 + 45);
    } else if (this.gameOver) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOU DIED', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`Fell on Floor ${this.floor} at Level ${this.player.level}`, canvas.width / 2, canvas.height / 2 + 15);
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Click New Expedition to retry', canvas.width / 2, canvas.height / 2 + 45);
    }
  }

  destroy() {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
  }
}

window.DungeonRoguelikeGame = DungeonRoguelikeGame;
