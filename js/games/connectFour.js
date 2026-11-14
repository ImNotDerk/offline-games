/**
 * Tactics 4: Connect Four (Strategy & Turn-based)
 */
class ConnectFourGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.rows = 6;
    this.cols = 7;
    this.board = [];
    this.currentPlayer = 1; // 1 = Red, 2 = Yellow
    this.vsAI = true;
    this.aiDifficulty = 'medium'; // easy, medium, hard
    this.gameOver = false;
    this.winningCells = [];
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title-group">
          <h3>Tactics 4</h3>
          <p class="game-subtitle">Connect 4 discs vertically, horizontally, or diagonally to win!</p>
        </div>
        <div class="stats-row">
          <div class="stat-pill"><span class="stat-label">TURN</span><span id="c4-turn" class="stat-value">Red (You)</span></div>
          <div class="stat-pill"><span class="stat-label">MODE</span><span id="c4-mode" class="stat-value">vs AI</span></div>
        </div>
      </div>
      <div class="game-controls-bar">
        <button class="btn btn-primary" id="c4-restart">New Match</button>
        <select id="c4-opponent-select" class="form-select">
          <option value="ai-easy">vs AI (Casual)</option>
          <option value="ai-medium" selected>vs AI (Tactical)</option>
          <option value="ai-hard">vs AI (Master)</option>
          <option value="pvp">Pass & Play (2 Players)</option>
        </select>
      </div>
      <div class="c4-wrapper">
        <div id="c4-board" class="c4-board" role="grid" aria-label="Connect Four Board"></div>
      </div>
      <div class="game-instructions">
        <p><strong>How to play:</strong> Click any column to drop your disc. The first to connect 4 discs wins!</p>
      </div>
    `;

    document.getElementById('c4-restart').onclick = () => this.restart();
    document.getElementById('c4-opponent-select').onchange = (e) => {
      const val = e.target.value;
      if (val === 'pvp') {
        this.vsAI = false;
      } else {
        this.vsAI = true;
        this.aiDifficulty = val.replace('ai-', '');
      }
      this.restart();
    };

    this.boardEl = document.getElementById('c4-board');
    this.restart();
  }

  restart() {
    this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.currentPlayer = 1;
    this.gameOver = false;
    this.winningCells = [];
    this.updateStats();
    this.render();
  }

  updateStats() {
    const turnEl = document.getElementById('c4-turn');
    const modeEl = document.getElementById('c4-mode');
    if (turnEl) {
      if (this.gameOver) {
        turnEl.textContent = 'Game Over';
      } else {
        turnEl.textContent = this.currentPlayer === 1 ? 'Red (Player 1)' : (this.vsAI ? 'Yellow (AI)' : 'Yellow (Player 2)');
        turnEl.style.color = this.currentPlayer === 1 ? '#ef4444' : '#facc15';
      }
    }
    if (modeEl) {
      modeEl.textContent = this.vsAI ? `vs AI (${this.aiDifficulty})` : '2-Player PvP';
    }
  }

  handleColumnClick(c) {
    if (this.gameOver) return;
    if (this.vsAI && this.currentPlayer === 2) return; // wait for AI

    const droppedRow = this.dropDisc(c, this.currentPlayer);
    if (droppedRow === -1) return; // Column full

    window.soundEngine.drop();
    this.checkAfterMove(droppedRow, c);

    if (!this.gameOver && this.vsAI && this.currentPlayer === 2) {
      setTimeout(() => this.makeAIMove(), 350);
    }
  }

  dropDisc(c, player) {
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.board[r][c] === 0) {
        this.board[r][c] = player;
        return r;
      }
    }
    return -1;
  }

  checkAfterMove(r, c) {
    const win = this.checkWin(this.board, this.currentPlayer);
    if (win) {
      this.gameOver = true;
      this.winningCells = win;
      window.soundEngine.victory();
      this.updateStats();
      this.render();
      return;
    }

    if (this.board.every(row => row.every(cell => cell !== 0))) {
      this.gameOver = true;
      window.soundEngine.gameOver();
      this.updateStats();
      this.render();
      return;
    }

    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    this.updateStats();
    this.render();
  }

  makeAIMove() {
    if (this.gameOver) return;

    let col = -1;
    if (this.aiDifficulty === 'easy') {
      const validCols = this.getValidCols(this.board);
      col = validCols[Math.floor(Math.random() * validCols.length)];
    } else {
      col = this.bestMoveMinimax();
    }

    if (col !== -1) {
      const droppedRow = this.dropDisc(col, 2);
      window.soundEngine.drop();
      this.checkAfterMove(droppedRow, col);
    }
  }

  getValidCols(b) {
    const cols = [];
    for (let c = 0; c < this.cols; c++) {
      if (b[0][c] === 0) cols.push(c);
    }
    return cols;
  }

  bestMoveMinimax() {
    const validCols = this.getValidCols(this.board);
    // 1. Check if AI can win immediately
    for (let c of validCols) {
      const temp = this.cloneBoard(this.board);
      this.simulateDrop(temp, c, 2);
      if (this.checkWin(temp, 2)) return c;
    }
    // 2. Block immediate player win
    for (let c of validCols) {
      const temp = this.cloneBoard(this.board);
      this.simulateDrop(temp, c, 1);
      if (this.checkWin(temp, 1)) return c;
    }

    // 3. Minimax evaluation
    const depth = this.aiDifficulty === 'hard' ? 4 : 2;
    let bestScore = -Infinity;
    let bestCol = validCols[Math.floor(Math.random() * validCols.length)];

    for (let c of validCols) {
      const temp = this.cloneBoard(this.board);
      this.simulateDrop(temp, c, 2);
      const score = this.minimax(temp, depth - 1, false, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestCol = c;
      }
    }
    return bestCol;
  }

  minimax(b, depth, isMaximizing, alpha, beta) {
    if (this.checkWin(b, 2)) return 1000 + depth;
    if (this.checkWin(b, 1)) return -1000 - depth;
    const validCols = this.getValidCols(b);
    if (validCols.length === 0 || depth === 0) return this.evaluateBoard(b);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let c of validCols) {
        const temp = this.cloneBoard(b);
        this.simulateDrop(temp, c, 2);
        const ev = this.minimax(temp, depth - 1, false, alpha, beta);
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let c of validCols) {
        const temp = this.cloneBoard(b);
        this.simulateDrop(temp, c, 1);
        const ev = this.minimax(temp, depth - 1, true, alpha, beta);
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  evaluateBoard(b) {
    let score = 0;
    // Prefer center column
    const centerCol = Math.floor(this.cols / 2);
    let centerCount = 0;
    for (let r = 0; r < this.rows; r++) {
      if (b[r][centerCol] === 2) centerCount++;
    }
    score += centerCount * 3;
    return score;
  }

  cloneBoard(b) {
    return b.map(row => [...row]);
  }

  simulateDrop(b, c, player) {
    for (let r = this.rows - 1; r >= 0; r--) {
      if (b[r][c] === 0) {
        b[r][c] = player;
        return r;
      }
    }
    return -1;
  }

  checkWin(b, player) {
    // Horizontal
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 3; c++) {
        if (b[r][c] === player && b[r][c+1] === player && b[r][c+2] === player && b[r][c+3] === player) {
          return [{r, c}, {r, c: c+1}, {r, c: c+2}, {r, c: c+3}];
        }
      }
    }
    // Vertical
    for (let r = 0; r < this.rows - 3; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (b[r][c] === player && b[r+1][c] === player && b[r+2][c] === player && b[r+3][c] === player) {
          return [{r, c}, {r: r+1, c}, {r: r+2, c}, {r: r+3, c}];
        }
      }
    }
    // Diagonal \
    for (let r = 0; r < this.rows - 3; r++) {
      for (let c = 0; c < this.cols - 3; c++) {
        if (b[r][c] === player && b[r+1][c+1] === player && b[r+2][c+2] === player && b[r+3][c+3] === player) {
          return [{r, c}, {r: r+1, c: c+1}, {r: r+2, c: c+2}, {r: r+3, c: c+3}];
        }
      }
    }
    // Diagonal /
    for (let r = 3; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 3; c++) {
        if (b[r][c] === player && b[r-1][c+1] === player && b[r-2][c+2] === player && b[r-3][c+3] === player) {
          return [{r, c}, {r: r-1, c: c+1}, {r: r-2, c: c+2}, {r: r-3, c: c+3}];
        }
      }
    }
    return null;
  }

  render() {
    this.boardEl.innerHTML = '';
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const val = this.board[r][c];
        const cell = document.createElement('div');
        cell.className = 'c4-cell';
        cell.onclick = () => this.handleColumnClick(c);

        const disc = document.createElement('div');
        disc.className = 'c4-disc';
        if (val === 1) disc.classList.add('disc-red');
        else if (val === 2) disc.classList.add('disc-yellow');

        if (this.winningCells.some(w => w.r === r && w.c === c)) {
          disc.classList.add('winning-disc');
        }

        cell.appendChild(disc);
        this.boardEl.appendChild(cell);
      }
    }
  }

  destroy() {}
}

window.ConnectFourGame = ConnectFourGame;
