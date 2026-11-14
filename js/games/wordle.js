/**
 * Wordle Offline Edition
 * Guess the secret 5-letter word in 6 tries. 100% offline dictionary.
 */
class WordleGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.maxGuesses = 6;
    this.wordLength = 5;
    this.targetWord = '';
    this.guesses = [];
    this.currentGuess = '';
    this.keyStatuses = {};
    this.isGameOver = false;
    this.isWon = false;
    this.stats = window.offlineStorage.get('wordle_stats', { played: 0, won: 0, streak: 0 });

    // Curated list of familiar, fun 5-letter words
    this.wordList = [
      'APPLE', 'BEACH', 'BRAIN', 'BREAD', 'CHAIR', 'CLOUD', 'CROWN', 'DANCE', 'DREAM', 'EARTH',
      'FLAME', 'FRUIT', 'GHOST', 'GRAPE', 'HEART', 'HOUSE', 'JUICE', 'LEMON', 'LIGHT', 'MONEY',
      'MUSIC', 'NIGHT', 'OCEAN', 'PEACH', 'PIANO', 'PLANT', 'QUEEN', 'RIVER', 'ROBOT', 'SHARK',
      'SMILE', 'SNAKE', 'SPACE', 'STORM', 'SUGAR', 'TIGER', 'TRAIN', 'WATER', 'WORLD', 'ZEBRA',
      'ALERT', 'BLOOM', 'CANDY', 'CRANE', 'DRIFT', 'EAGLE', 'FROST', 'GIANT', 'HONEY', 'LUCKY',
      'MAGIC', 'NOBLE', 'ORBIT', 'PEARL', 'QUEST', 'RIDER', 'SOLAR', 'TOWER', 'VALOR', 'WHEAT',
      'AUDIO', 'BLAZE', 'CHAMP', 'DELTA', 'EMBER', 'FLASH', 'GLORY', 'HAVEN', 'IVORY', 'JAZZY',
      'KNIFE', 'LUNAR', 'MANGO', 'NINJA', 'OASIS', 'PIXEL', 'QUARK', 'RAVEN', 'SPARK', 'TITAN',
      'VAPOR', 'WALTZ', 'YOUTH', 'ACORN', 'BISON', 'CEDAR', 'DINGO', 'ELFIN', 'FAIRY', 'GECKO',
      'HYDRA', 'IGLOO', 'JEWEL', 'KOALA', 'LOTUS', 'MAPLE', 'NYMPH', 'OTTER', 'PANDA', 'RHINO',
      'SWIFT', 'TOPAZ', 'VIPER', 'WHALE', 'YACHT', 'ARROW', 'BLAST', 'CHESS', 'DRIVE', 'FLUTE',
      'GLIDE', 'HASTE', 'IMAGE', 'JUMBO', 'KNEEL', 'LASER', 'MIRTH', 'NERVE', 'ONION', 'PRISM',
      'QUOTA', 'RALLY', 'SCOUT', 'TEMPO', 'UNITY', 'VIVID', 'WINDY', 'YIELD', 'ADAPT', 'BOUND'
    ];
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title-group">
          <h3>Wordle Offline</h3>
          <p class="game-subtitle">Guess the hidden 5-letter word in 6 attempts. Color clues reveal your progress!</p>
        </div>
        <div class="stats-row">
          <div class="stat-pill"><span class="stat-label">PLAYED</span><span id="wd-played" class="stat-value">${this.stats.played}</span></div>
          <div class="stat-pill"><span class="stat-label">WIN %</span><span id="wd-winrate" class="stat-value">${this.stats.played ? Math.round((this.stats.won / this.stats.played) * 100) : 0}%</span></div>
          <div class="stat-pill"><span class="stat-label">STREAK</span><span id="wd-streak" class="stat-value">${this.stats.streak}</span></div>
        </div>
      </div>
      <div class="game-controls-bar">
        <button class="btn btn-primary" id="wd-new-game">New Word</button>
      </div>

      <div class="wordle-board-container" id="wd-board-container">
        <div id="wd-board" class="wordle-board" role="grid" aria-label="Wordle Grid"></div>
      </div>

      <div id="wd-keyboard" class="wordle-keyboard" role="group" aria-label="Virtual Keyboard">
        <!-- Injected via renderKeyboard -->
      </div>

      <div class="game-instructions">
        <p><strong>Clues:</strong> 🟩 <strong>Green</strong> = Correct letter in correct spot. 🟨 <strong>Yellow</strong> = In word but wrong spot. ⬛ <strong>Gray</strong> = Not in word. Type using keyboard or click onscreen keys.</p>
      </div>
    `;

    document.getElementById('wd-new-game').onclick = () => this.restart();

    this.setupKeyboard();
    this.restart();
  }

  restart() {
    this.targetWord = this.wordList[Math.floor(Math.random() * this.wordList.length)];
    this.guesses = [];
    this.currentGuess = '';
    this.keyStatuses = {};
    this.isGameOver = false;
    this.isWon = false;

    this.renderBoard();
    this.renderKeyboard();
    window.soundEngine.click();
  }

  setupKeyboard() {
    this.keyHandler = (e) => {
      if (this.isGameOver) {
        if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'r') {
          e.preventDefault();
          this.restart();
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        this.submitGuess();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        this.deleteLetter();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        this.addLetter(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  addLetter(letter) {
    if (this.currentGuess.length < this.wordLength) {
      this.currentGuess += letter;
      window.soundEngine.move();
      this.renderBoard();
    }
  }

  deleteLetter() {
    if (this.currentGuess.length > 0) {
      this.currentGuess = this.currentGuess.slice(0, -1);
      window.soundEngine.click();
      this.renderBoard();
    }
  }

  submitGuess() {
    if (this.currentGuess.length !== this.wordLength) {
      this.shakeCurrentRow();
      return;
    }

    const guess = this.currentGuess;
    const evaluation = this.evaluateGuess(guess);
    this.guesses.push({ word: guess, evaluation });
    this.currentGuess = '';

    // Update keyboard letters
    evaluation.forEach(({ letter, status }) => {
      const current = this.keyStatuses[letter];
      if (status === 'correct') {
        this.keyStatuses[letter] = 'correct';
      } else if (status === 'present' && current !== 'correct') {
        this.keyStatuses[letter] = 'present';
      } else if (!current) {
        this.keyStatuses[letter] = 'absent';
      }
    });

    if (guess === this.targetWord) {
      this.isWon = true;
      this.isGameOver = true;
      this.stats.played++;
      this.stats.won++;
      this.stats.streak++;
      window.offlineStorage.set('wordle_stats', this.stats);
      window.soundEngine.victory();
      this.updateStatsDisplay();
    } else if (this.guesses.length >= this.maxGuesses) {
      this.isGameOver = true;
      this.stats.played++;
      this.stats.streak = 0;
      window.offlineStorage.set('wordle_stats', this.stats);
      window.soundEngine.gameOver();
      this.updateStatsDisplay();
    } else {
      window.soundEngine.drop();
    }

    this.renderBoard();
    this.renderKeyboard();
  }

  evaluateGuess(guess) {
    const res = Array(this.wordLength).fill(null);
    const targetArr = this.targetWord.split('');
    const guessArr = guess.split('');

    // First pass: mark correct positions (Green)
    for (let i = 0; i < this.wordLength; i++) {
      if (guessArr[i] === targetArr[i]) {
        res[i] = { letter: guessArr[i], status: 'correct' };
        targetArr[i] = null;
        guessArr[i] = null;
      }
    }

    // Second pass: mark present letters in wrong position (Yellow)
    for (let i = 0; i < this.wordLength; i++) {
      if (guessArr[i] !== null) {
        const foundIdx = targetArr.indexOf(guessArr[i]);
        if (foundIdx !== -1) {
          res[i] = { letter: guessArr[i], status: 'present' };
          targetArr[foundIdx] = null;
        } else {
          res[i] = { letter: guessArr[i], status: 'absent' };
        }
      }
    }

    return res;
  }

  shakeCurrentRow() {
    const boardEl = document.getElementById('wd-board');
    if (!boardEl) return;
    const rowIdx = this.guesses.length;
    const rows = boardEl.querySelectorAll('.wordle-row');
    if (rows[rowIdx]) {
      rows[rowIdx].classList.add('shake');
      setTimeout(() => rows[rowIdx].classList.remove('shake'), 400);
    }
  }

  updateStatsDisplay() {
    const pEl = document.getElementById('wd-played');
    const wEl = document.getElementById('wd-winrate');
    const sEl = document.getElementById('wd-streak');
    if (pEl) pEl.textContent = this.stats.played;
    if (wEl) wEl.textContent = `${Math.round((this.stats.won / this.stats.played) * 100)}%`;
    if (sEl) sEl.textContent = this.stats.streak;
  }

  renderBoard() {
    const boardEl = document.getElementById('wd-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    for (let r = 0; r < this.maxGuesses; r++) {
      const row = document.createElement('div');
      row.className = 'wordle-row';

      const isCurrentRow = r === this.guesses.length;
      const isPastRow = r < this.guesses.length;

      for (let c = 0; c < this.wordLength; c++) {
        const tile = document.createElement('div');
        tile.className = 'wordle-tile';

        if (isPastRow) {
          const item = this.guesses[r].evaluation[c];
          tile.textContent = item.letter;
          tile.classList.add(`tile-${item.status}`);
        } else if (isCurrentRow) {
          const letter = this.currentGuess[c] || '';
          tile.textContent = letter;
          if (letter) tile.classList.add('tile-active');
        }

        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }

    // Overlays
    if (this.isGameOver) {
      const container = document.getElementById('wd-board-container');
      const overlay = document.createElement('div');
      overlay.className = 'game-overlay';
      overlay.innerHTML = `
        <div class="overlay-card">
          <h3>${this.isWon ? 'Splendid! 🎉' : 'Out of Tries! 😅'}</h3>
          <p>The word was: <strong style="color: var(--color-primary); font-size: 1.3rem;">${this.targetWord}</strong></p>
          <button class="btn btn-primary" id="wd-play-again-btn">Play Again (Enter)</button>
        </div>
      `;
      container.appendChild(overlay);
      overlay.querySelector('#wd-play-again-btn').onclick = () => this.restart();
    }
  }

  renderKeyboard() {
    const kbEl = document.getElementById('wd-keyboard');
    if (!kbEl) return;
    kbEl.innerHTML = '';

    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
    ];

    rows.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      row.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'kb-key';
        btn.textContent = key;
        if (key === 'ENTER' || key === '⌫') btn.classList.add('kb-key-wide');

        const status = this.keyStatuses[key];
        if (status) btn.classList.add(`key-${status}`);

        btn.onclick = () => {
          if (this.isGameOver) return;
          if (key === 'ENTER') this.submitGuess();
          else if (key === '⌫') this.deleteLetter();
          else this.addLetter(key);
        };

        rowEl.appendChild(btn);
      });
      kbEl.appendChild(rowEl);
    });
  }

  destroy() {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
  }
}

window.WordleGame = WordleGame;
