/**
 * Classic Minesweeper
 */
class MinesweeperGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.difficulties = {
      easy: { rows: 9, cols: 9, mines: 10 },
      medium: { rows: 16, cols: 16, mines: 40 },
      hard: { rows: 16, cols: 30, mines: 99 }
    };
    this.currentDiff = 'easy';
    this.rows = 9;
    this.cols = 9;
    this.mineCount = 10;
    this.board = [];
    this.firstClick = true;
    this.flagMode = false;
    this.timer = 0;
    this.timerInterval = null;
    this.gameOver = false;
    this.won = false;
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title-group">
          <h3>Minesweeper</h3>
          <p class="game-subtitle">Clear the minefield without detonating a bomb!</p>
        </div>
        <div class="stats-row">
          <div class="stat-pill"><span class="stat-label">MINES</span><span id="ms-mines" class="stat-value">10</span></div>
          <div class="stat-pill"><span class="stat-label">TIME</span><span id="ms-timer" class="stat-value">0</span></div>
        </div>
      </div>
      <div class="game-controls-bar">
        <select id="ms-diff-select" class="form-select">
          <option value="easy">Easy (9x9, 10 Mines)</option>
          <option value="medium">Medium (16x16, 40 Mines)</option>
          <option value="hard">Hard (30x16, 99 Mines)</option>
        </select>
        <button class="btn btn-secondary" id="ms-face-btn">🙂 New</button>
        <button class="btn btn-outline" id="ms-flag-mode-btn">🚩 Flag Mode: OFF</button>
      </div>
      <div class="ms-board-wrapper" id="ms-board-wrapper" style="position: relative;">
        <div id="ms-grid" class="ms-grid" role="grid" aria-label="Minesweeper Grid"></div>
      </div>
      <div class="game-instructions">
        <p><strong>Controls:</strong> Left Click to reveal, Right Click (or toggle Flag Mode) to place flags. Click numbered cells to chord-reveal. Press <strong>R</strong> to restart anytime.</p>
      </div>
    `;

    document.getElementById('ms-diff-select').onchange = (e) => {
      this.currentDiff = e.target.value;
      this.restart();
    };

    document.getElementById('ms-face-btn').onclick = () => this.restart();

    const flagBtn = document.getElementById('ms-flag-mode-btn');
    flagBtn.onclick = () => {
      this.flagMode = !this.flagMode;
      flagBtn.textContent = `🚩 Flag Mode: ${this.flagMode ? 'ON' : 'OFF'}`;
      flagBtn.classList.toggle('active', this.flagMode);
    };

    this.setupKeys();
    this.restart();
  }

  setupKeys() {
    this.keyHandler = (e) => {
      if (this.gameOver || this.won) {
        if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'r') {
          e.preventDefault();
          this.restart();
          return;
        }
      }
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        this.restart();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  restart() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const conf = this.difficulties[this.currentDiff];
    this.rows = conf.rows;
    this.cols = conf.cols;
    this.mineCount = conf.mines;
    this.firstClick = true;
    this.gameOver = false;
    this.won = false;
    this.timer = 0;

    const wrapper = document.getElementById('ms-board-wrapper');
    const existing = wrapper ? wrapper.querySelector('.game-overlay') : null;
    if (existing) existing.remove();

    const timerEl = document.getElementById('ms-timer');
    const minesEl = document.getElementById('ms-mines');
    const faceBtn = document.getElementById('ms-face-btn');
    if (timerEl) timerEl.textContent = '0';
    if (minesEl) minesEl.textContent = this.mineCount;
    if (faceBtn) faceBtn.textContent = '🙂 New';

    this.initBoard();
    this.render();
  }

  initBoard() {
    this.board = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push({
          r, c,
          isMine: false,
          revealed: false,
          flagged: false,
          neighborMines: 0
        });
      }
      this.board.push(row);
    }
  }

  placeMines(safeR, safeC) {
    let placed = 0;
    while (placed < this.mineCount) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      // Guarantee 3x3 area around first click is safe
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
      if (!this.board[r][c].isMine) {
        this.board[r][c].isMine = true;
        placed++;
      }
    }

    // Calculate neighbors
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.board[r][c].isMine) {
          let count = 0;
          this.forEachNeighbor(r, c, (nr, nc) => {
            if (this.board[nr][nc].isMine) count++;
          });
          this.board[r][c].neighborMines = count;
        }
      }
    }
  }

  forEachNeighbor(r, c, callback) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          callback(nr, nc);
        }
      }
    }
  }

  handleCellClick(r, c) {
    if (this.gameOver || this.won) return;
    const cell = this.board[r][c];

    if (this.flagMode) {
      this.handleRightClick(r, c);
      return;
    }

    if (cell.flagged) return;

    if (this.firstClick) {
      this.firstClick = false;
      this.placeMines(r, c);
      this.startTimer();
    }

    if (cell.revealed) {
      // Chord reveal if flags match neighbor mines
      this.chordReveal(r, c);
      return;
    }

    if (cell.isMine) {
      this.detonate(cell);
      return;
    }

    window.soundEngine.click();
    this.reveal(r, c);
    this.checkWin();
    this.render();
  }

  chordReveal(r, c) {
    const cell = this.board[r][c];
    if (cell.neighborMines === 0) return;
    let flags = 0;
    this.forEachNeighbor(r, c, (nr, nc) => {
      if (this.board[nr][nc].flagged) flags++;
    });

    if (flags === cell.neighborMines) {
      let hitMine = false;
      this.forEachNeighbor(r, c, (nr, nc) => {
        const neighbor = this.board[nr][nc];
        if (!neighbor.revealed && !neighbor.flagged) {
          if (neighbor.isMine) {
            hitMine = true;
            this.detonate(neighbor);
          } else {
            this.reveal(nr, nc);
          }
        }
      });
      if (!hitMine) {
        window.soundEngine.move();
        this.checkWin();
        this.render();
      }
    }
  }

  reveal(r, c) {
    const cell = this.board[r][c];
    if (cell.revealed || cell.flagged) return;
    cell.revealed = true;

    if (cell.neighborMines === 0 && !cell.isMine) {
      this.forEachNeighbor(r, c, (nr, nc) => {
        this.reveal(nr, nc);
      });
    }
  }

  handleRightClick(r, c) {
    if (this.gameOver || this.won) return;
    const cell = this.board[r][c];
    if (cell.revealed) return;

    cell.flagged = !cell.flagged;
    window.soundEngine.rotate();

    let flagsPlaced = 0;
    for (let row of this.board) {
      for (let item of row) {
        if (item.flagged) flagsPlaced++;
      }
    }
    const rem = this.mineCount - flagsPlaced;
    const mEl = document.getElementById('ms-mines');
    if (mEl) mEl.textContent = rem;

    this.checkWin();
    this.render();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timer++;
      const timerEl = document.getElementById('ms-timer');
      if (timerEl) timerEl.textContent = this.timer;
    }, 1000);
  }

  detonate(hitCell) {
    this.gameOver = true;
    if (this.timerInterval) clearInterval(this.timerInterval);
    window.soundEngine.explosion();

    const faceBtn = document.getElementById('ms-face-btn');
    if (faceBtn) faceBtn.textContent = '💀 Dead';

    // Reveal all mines
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.board[r][c];
        if (cell.isMine) cell.revealed = true;
      }
    }
    hitCell.exploded = true;
    this.render();
    this.showOverlay('Detonated! 💥', `Time: ${this.timer}s`, 'Play Again');
  }

  checkWin() {
    let unrevealedSafe = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.board[r][c];
        if (!cell.isMine && !cell.revealed) unrevealedSafe++;
      }
    }

    if (unrevealedSafe === 0) {
      this.won = true;
      if (this.timerInterval) clearInterval(this.timerInterval);
      window.soundEngine.victory();
      const faceBtn = document.getElementById('ms-face-btn');
      if (faceBtn) faceBtn.textContent = '😎 Won!';
      this.showOverlay('Field Cleared! 🎉', `Completed in ${this.timer} seconds!`, 'New Game');
    }
  }

  showOverlay(title, subtitle, btnText) {
    const wrapper = document.getElementById('ms-board-wrapper');
    if (!wrapper) return;
    const existing = wrapper.querySelector('.game-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'game-overlay';
    overlay.innerHTML = `
      <div class="overlay-card">
        <h3>${title}</h3>
        <p>${subtitle}</p>
        <button class="btn btn-primary" id="ms-overlay-btn">${btnText} (Enter / Space)</button>
      </div>
    `;
    wrapper.appendChild(overlay);
    overlay.querySelector('#ms-overlay-btn').onclick = () => this.restart();
  }

  render() {
    const gridEl = document.getElementById('ms-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.board[r][c];
        const btn = document.createElement('button');
        btn.className = 'ms-cell';
        btn.setAttribute('data-r', r);
        btn.setAttribute('data-c', c);

        if (cell.revealed) {
          btn.classList.add('revealed');
          if (cell.isMine) {
            btn.classList.add(cell.exploded ? 'exploded' : 'mine');
            btn.textContent = '💣';
          } else if (cell.neighborMines > 0) {
            btn.classList.add(`num-${cell.neighborMines}`);
            btn.textContent = cell.neighborMines;
          }
        } else if (cell.flagged) {
          btn.classList.add('flagged');
          btn.textContent = '🚩';
        }

        btn.onclick = () => this.handleCellClick(r, c);
        btn.oncontextmenu = (e) => {
          e.preventDefault();
          this.handleRightClick(r, c);
        };

        gridEl.appendChild(btn);
      }
    }
  }

  destroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
  }
}

window.MinesweeperGame = MinesweeperGame;
