/**
 * Sudoku Deluxe (Offline Puzzle)
 * Generates fresh unique solvable puzzles on the fly with backtracking algorithm.
 */
class SudokuGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.difficulty = 'easy'; // easy, medium, hard
    this.board = [];
    this.initialBoard = [];
    this.solution = [];
    this.notes = [];
    this.selectedCell = { r: 0, c: 0 };
    this.notesMode = false;
    this.mistakes = 0;
    this.maxMistakes = 3;
    this.timer = 0;
    this.timerInterval = null;
    this.isGameOver = false;
    this.isWon = false;
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title-group">
          <h3>Sudoku Deluxe</h3>
          <p class="game-subtitle">Fill the 9×9 grid so each row, column, and 3×3 box contains digits 1–9.</p>
        </div>
        <div class="stats-row">
          <div class="stat-pill"><span class="stat-label">DIFFICULTY</span><span id="sudoku-diff-label" class="stat-value">Easy</span></div>
          <div class="stat-pill"><span class="stat-label">MISTAKES</span><span id="sudoku-mistakes" class="stat-value">0/3</span></div>
          <div class="stat-pill"><span class="stat-label">TIME</span><span id="sudoku-timer" class="stat-value">00:00</span></div>
        </div>
      </div>
      <div class="game-controls-bar">
        <button class="btn btn-primary" id="sudoku-new-game">New Game</button>
        <button class="btn btn-secondary" id="sudoku-restart">Restart Board</button>
        <select id="sudoku-diff-select" class="form-select">
          <option value="easy" selected>Difficulty: Easy</option>
          <option value="medium">Difficulty: Medium</option>
          <option value="hard">Difficulty: Hard</option>
        </select>
        <button class="btn btn-outline" id="sudoku-notes-btn">✏️ Notes: OFF</button>
        <button class="btn btn-outline" id="sudoku-hint-btn">💡 Hint</button>
      </div>

      <div class="sudoku-layout">
        <div class="sudoku-grid-wrapper">
          <div id="sudoku-grid" class="sudoku-grid" role="grid" aria-label="Sudoku Grid"></div>
        </div>

        <div class="sudoku-keypad">
          <div class="keypad-digits">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="keypad-btn digit-btn" data-num="${n}">${n}</button>`).join('')}
          </div>
          <div class="keypad-actions">
            <button class="keypad-btn action-btn" id="sudoku-erase-btn">⌫ Erase</button>
          </div>
        </div>
      </div>

      <div class="game-instructions">
        <p><strong>Controls:</strong> Click a cell then press <strong>1–9</strong> on your keyboard or keypad. Use <strong>Arrow keys</strong> to navigate. Press <strong>N</strong> to toggle Notes/Pencil mode, <strong>Backspace</strong> or <strong>Delete</strong> to erase.</p>
      </div>
    `;

    document.getElementById('sudoku-new-game').onclick = () => this.generateNewGame();
    document.getElementById('sudoku-restart').onclick = () => this.restartCurrentBoard();
    document.getElementById('sudoku-diff-select').onchange = (e) => {
      this.difficulty = e.target.value;
      const label = document.getElementById('sudoku-diff-label');
      if (label) label.textContent = this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
      this.generateNewGame();
    };

    const notesBtn = document.getElementById('sudoku-notes-btn');
    notesBtn.onclick = () => {
      this.notesMode = !this.notesMode;
      notesBtn.textContent = `✏️ Notes: ${this.notesMode ? 'ON' : 'OFF'}`;
      notesBtn.classList.toggle('active', this.notesMode);
    };

    document.getElementById('sudoku-hint-btn').onclick = () => this.giveHint();
    document.getElementById('sudoku-erase-btn').onclick = () => this.enterNumber(0);

    document.querySelectorAll('.keypad-digits .digit-btn').forEach(btn => {
      btn.onclick = () => {
        const num = parseInt(btn.getAttribute('data-num'), 10);
        this.enterNumber(num);
      };
    });

    this.setupKeyboard();
    this.generateNewGame();
  }

  generateNewGame() {
    this.isGameOver = false;
    this.isWon = false;
    this.mistakes = 0;
    this.selectedCell = { r: 0, c: 0 };
    this.notes = Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set()));

    // Generate solved board
    const full = Array(9).fill(null).map(() => Array(9).fill(0));
    this.fillDiagonalBoxes(full);
    this.solve(full);
    this.solution = full.map(row => [...row]);

    // Remove clues based on difficulty
    const clues = this.difficulty === 'easy' ? 40 : (this.difficulty === 'medium' ? 32 : 26);
    const puzzle = full.map(row => [...row]);
    let removed = 81 - clues;

    while (removed > 0) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (puzzle[r][c] !== 0) {
        puzzle[r][c] = 0;
        removed--;
      }
    }

    this.initialBoard = puzzle.map(row => [...row]);
    this.board = puzzle.map(row => [...row]);

    this.startTimer();
    this.updateStats();
    this.render();
  }

  restartCurrentBoard() {
    this.isGameOver = false;
    this.isWon = false;
    this.mistakes = 0;
    this.board = this.initialBoard.map(row => [...row]);
    this.notes = Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set()));
    this.startTimer();
    this.updateStats();
    this.render();
    window.soundEngine.click();
  }

  fillDiagonalBoxes(b) {
    for (let i = 0; i < 9; i += 3) {
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      let idx = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          b[i + r][i + c] = nums[idx++];
        }
      }
    }
  }

  isValidPlacement(b, row, col, num) {
    for (let c = 0; c < 9; c++) if (b[row][c] === num) return false;
    for (let r = 0; r < 9; r++) if (b[r][col] === num) return false;
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (b[startRow + r][startCol + c] === num) return false;
      }
    }
    return true;
  }

  solve(b) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (let num of numbers) {
            if (this.isValidPlacement(b, r, c, num)) {
              b[r][c] = num;
              if (this.solve(b)) return true;
              b[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timer = 0;
    this.timerInterval = setInterval(() => {
      if (!this.isGameOver && !this.isWon) {
        this.timer++;
        const mins = Math.floor(this.timer / 60);
        const secs = this.timer % 60;
        const el = document.getElementById('sudoku-timer');
        if (el) el.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  enterNumber(num) {
    if (this.isGameOver || this.isWon) return;
    const { r, c } = this.selectedCell;

    // Fixed original clue cell cannot be edited
    if (this.initialBoard[r][c] !== 0) return;

    if (num === 0) {
      // Erase
      this.board[r][c] = 0;
      this.notes[r][c].clear();
      window.soundEngine.click();
      this.render();
      return;
    }

    if (this.notesMode) {
      // Toggle note
      const cellNotes = this.notes[r][c];
      if (cellNotes.has(num)) cellNotes.delete(num);
      else cellNotes.add(num);
      window.soundEngine.move();
      this.render();
      return;
    }

    // Direct entry
    if (this.board[r][c] === num) return; // already there

    // Check if correct against solution
    if (this.solution[r][c] === num) {
      this.board[r][c] = num;
      this.notes[r][c].clear();
      window.soundEngine.coin();
      this.checkWin();
    } else {
      this.mistakes++;
      window.soundEngine.playBeep(200, 'sawtooth', 0.2, 0.2);
      this.updateStats();
      if (this.mistakes >= this.maxMistakes) {
        this.isGameOver = true;
        window.soundEngine.gameOver();
      }
    }

    this.render();
  }

  giveHint() {
    if (this.isGameOver || this.isWon) return;
    const emptyCells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.board[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return;

    const pick = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    this.board[pick.r][pick.c] = this.solution[pick.r][pick.c];
    this.notes[pick.r][pick.c].clear();
    this.selectedCell = pick;
    window.soundEngine.victory();
    this.checkWin();
    this.render();
  }

  checkWin() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.board[r][c] !== this.solution[r][c]) return;
      }
    }
    this.isWon = true;
    window.soundEngine.victory();
  }

  updateStats() {
    const mEl = document.getElementById('sudoku-mistakes');
    if (mEl) mEl.textContent = `${this.mistakes}/${this.maxMistakes}`;
  }

  setupKeyboard() {
    this.keyHandler = (e) => {
      if (this.isGameOver || this.isWon) {
        if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'r') {
          e.preventDefault();
          this.generateNewGame();
        }
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        let { r, c } = this.selectedCell;
        if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
        else if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
        else if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
        else if (e.key === 'ArrowRight') c = Math.min(8, c + 1);
        this.selectedCell = { r, c };
        this.render();
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        this.enterNumber(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        this.enterNumber(0);
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        const btn = document.getElementById('sudoku-notes-btn');
        if (btn) btn.click();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  render() {
    const gridEl = document.getElementById('sudoku-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    const selectedVal = this.board[this.selectedCell.r][this.selectedCell.c];

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = this.board[r][c];
        const isInitial = this.initialBoard[r][c] !== 0;
        const isSelected = this.selectedCell.r === r && this.selectedCell.c === c;
        const isSameNumber = val !== 0 && val === selectedVal;
        const isRelated = this.selectedCell.r === r || this.selectedCell.c === c ||
          (Math.floor(this.selectedCell.r / 3) === Math.floor(r / 3) && Math.floor(this.selectedCell.c / 3) === Math.floor(c / 3));

        const cell = document.createElement('button');
        cell.className = 'sudoku-cell';
        if (isInitial) cell.classList.add('cell-initial');
        if (isSelected) cell.classList.add('cell-selected');
        else if (isSameNumber) cell.classList.add('cell-match');
        else if (isRelated) cell.classList.add('cell-related');

        // 3x3 Box borders
        if (c % 3 === 2 && c !== 8) cell.classList.add('border-right');
        if (r % 3 === 2 && r !== 8) cell.classList.add('border-bottom');

        if (val !== 0) {
          cell.textContent = val;
        } else if (this.notes[r][c].size > 0) {
          cell.classList.add('cell-notes');
          const notesGrid = document.createElement('div');
          notesGrid.className = 'notes-grid';
          for (let n = 1; n <= 9; n++) {
            const span = document.createElement('span');
            span.textContent = this.notes[r][c].has(n) ? n : '';
            notesGrid.appendChild(span);
          }
          cell.appendChild(notesGrid);
        }

        cell.onclick = () => {
          this.selectedCell = { r, c };
          this.render();
        };

        gridEl.appendChild(cell);
      }
    }

    // Overlays for Win or Game Over
    if (this.isWon) {
      this.showOverlay('Puzzle Solved! 🎉', `Completed in ${document.getElementById('sudoku-timer').textContent}`, 'New Game');
    } else if (this.isGameOver) {
      this.showOverlay('3 Mistakes Made! 💀', 'Game Over', 'Try Again');
    }
  }

  showOverlay(title, subtitle, btnText) {
    const gridWrapper = document.querySelector('.sudoku-grid-wrapper');
    if (!gridWrapper) return;
    const overlay = document.createElement('div');
    overlay.className = 'game-overlay';
    overlay.innerHTML = `
      <div class="overlay-card">
        <h3>${title}</h3>
        <p>${subtitle}</p>
        <button class="btn btn-primary" id="sudoku-overlay-btn">${btnText} (Enter)</button>
      </div>
    `;
    gridWrapper.appendChild(overlay);
    overlay.querySelector('#sudoku-overlay-btn').onclick = () => {
      this.generateNewGame();
    };
  }

  destroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
  }
}

window.SudokuGame = SudokuGame;
