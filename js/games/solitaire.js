/**
 * Klondike Solitaire (Offline Classic)
 * Full 52-card solitaire with smart click-to-move, foundation auto-send, and undo.
 */
class SolitaireGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    this.suitSymbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
    this.suitColors = { hearts: 'red', diamonds: 'red', clubs: 'black', spades: 'black' };
    this.values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    this.valueNames = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };

    this.stock = [];
    this.waste = [];
    this.foundations = [[], [], [], []]; // 4 suits
    this.tableau = [[], [], [], [], [], [], []]; // 7 piles
    this.history = [];
    this.moves = 0;
    this.score = 0;
    this.timer = 0;
    this.timerInterval = null;
    this.isWon = false;
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title-group">
          <h3>Klondike Solitaire</h3>
          <p class="game-subtitle">Build 4 foundation piles from Ace to King. Click cards for smart auto-move!</p>
        </div>
        <div class="stats-row">
          <div class="stat-pill"><span class="stat-label">SCORE</span><span id="sol-score" class="stat-value">0</span></div>
          <div class="stat-pill"><span class="stat-label">MOVES</span><span id="sol-moves" class="stat-value">0</span></div>
          <div class="stat-pill"><span class="stat-label">TIME</span><span id="sol-timer" class="stat-value">00:00</span></div>
        </div>
      </div>
      <div class="game-controls-bar">
        <button class="btn btn-primary" id="sol-new-deal">New Deal</button>
        <button class="btn btn-secondary" id="sol-restart">Restart Deal</button>
        <button class="btn btn-outline" id="sol-undo">Undo</button>
        <button class="btn btn-outline" id="sol-autocomplete" style="display: none;">✨ Auto Complete</button>
      </div>

      <div class="solitaire-board" id="sol-board">
        <div class="sol-top-row">
          <div class="sol-stock-waste">
            <div class="sol-card-slot sol-stock" id="sol-stock" title="Draw card">
              <span class="slot-label">STOCK</span>
            </div>
            <div class="sol-card-slot sol-waste" id="sol-waste"></div>
          </div>
          <div class="sol-foundations">
            ${[0, 1, 2, 3].map(i => `<div class="sol-card-slot sol-foundation" id="sol-found-${i}" data-fidx="${i}"><span class="slot-label">A</span></div>`).join('')}
          </div>
        </div>

        <div class="sol-tableau" id="sol-tableau">
          ${[0, 1, 2, 3, 4, 5, 6].map(i => `<div class="sol-column" id="sol-col-${i}" data-col="${i}"></div>`).join('')}
        </div>
      </div>

      <div class="game-instructions">
        <p><strong>Tips:</strong> Click the Stock pile to draw cards. <strong>Single click</strong> any card to automatically move it to the best legal spot (Foundation or Tableau). <strong>Double click</strong> to send directly to Foundation.</p>
      </div>
    `;

    document.getElementById('sol-new-deal').onclick = () => this.newDeal();
    document.getElementById('sol-restart').onclick = () => this.restartDeal();
    document.getElementById('sol-undo').onclick = () => this.undo();
    document.getElementById('sol-autocomplete').onclick = () => this.autoComplete();
    document.getElementById('sol-stock').onclick = () => this.drawCard();

    this.newDeal();
  }

  createDeck() {
    const deck = [];
    this.suits.forEach(suit => {
      this.values.forEach(val => {
        deck.push({
          suit,
          val,
          color: this.suitColors[suit],
          name: this.valueNames[val] || val.toString(),
          symbol: this.suitSymbols[suit],
          faceUp: false,
          id: `${suit}_${val}`
        });
      });
    });
    return deck.sort(() => Math.random() - 0.5);
  }

  newDeal() {
    this.initialDeck = this.createDeck();
    this.loadDeck(this.initialDeck);
  }

  restartDeal() {
    if (this.initialDeck) {
      this.loadDeck(this.initialDeck);
      window.soundEngine.click();
    }
  }

  loadDeck(deckTemplate) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.history = [];
    this.moves = 0;
    this.score = 0;
    this.timer = 0;
    this.isWon = false;

    // Deep clone deck
    const deck = JSON.parse(JSON.stringify(deckTemplate));
    this.stock = [];
    this.waste = [];
    this.foundations = [[], [], [], []];
    this.tableau = [[], [], [], [], [], [], []];

    // Deal to tableau
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r <= c; r++) {
        const card = deck.pop();
        if (r === c) card.faceUp = true;
        this.tableau[c].push(card);
      }
    }

    // Rest goes to stock
    this.stock = deck;

    this.startTimer();
    this.updateStats();
    this.render();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (!this.isWon) {
        this.timer++;
        const mins = Math.floor(this.timer / 60);
        const secs = this.timer % 60;
        const el = document.getElementById('sol-timer');
        if (el) el.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  saveState() {
    if (this.history.length > 20) this.history.shift();
    this.history.push({
      stock: JSON.parse(JSON.stringify(this.stock)),
      waste: JSON.parse(JSON.stringify(this.waste)),
      foundations: JSON.parse(JSON.stringify(this.foundations)),
      tableau: JSON.parse(JSON.stringify(this.tableau)),
      moves: this.moves,
      score: this.score
    });
  }

  undo() {
    if (this.history.length === 0) return;
    const prev = this.history.pop();
    this.stock = prev.stock;
    this.waste = prev.waste;
    this.foundations = prev.foundations;
    this.tableau = prev.tableau;
    this.moves = prev.moves;
    this.score = prev.score;
    window.soundEngine.move();
    this.updateStats();
    this.render();
  }

  drawCard() {
    this.saveState();
    if (this.stock.length > 0) {
      const card = this.stock.pop();
      card.faceUp = true;
      this.waste.push(card);
      window.soundEngine.drop();
    } else if (this.waste.length > 0) {
      // Recycle waste into stock
      while (this.waste.length > 0) {
        const c = this.waste.pop();
        c.faceUp = false;
        this.stock.push(c);
      }
      window.soundEngine.rotate();
    }
    this.moves++;
    this.updateStats();
    this.render();
  }

  handleWasteCardClick() {
    if (this.waste.length === 0) return;
    const card = this.waste[this.waste.length - 1];

    // Try send to foundation first
    if (this.trySendToFoundation(card, () => this.waste.pop())) return;

    // Try send to tableau
    if (this.trySendToTableau(card, () => this.waste.pop())) return;

    window.soundEngine.click();
  }

  handleTableauCardClick(colIdx, cardIdx) {
    const col = this.tableau[colIdx];
    const card = col[cardIdx];

    if (!card.faceUp) {
      if (cardIdx === col.length - 1) {
        this.saveState();
        card.faceUp = true;
        this.score += 5;
        this.moves++;
        window.soundEngine.move();
        this.updateStats();
        this.render();
      }
      return;
    }

    // If top card of column, try foundation first
    if (cardIdx === col.length - 1) {
      if (this.trySendToFoundation(card, () => {
        col.pop();
        if (col.length > 0) col[col.length - 1].faceUp = true;
      })) return;
    }

    // Try moving stack to another column
    const movingStack = col.slice(cardIdx);
    for (let targetCol = 0; targetCol < 7; targetCol++) {
      if (targetCol === colIdx) continue;
      const targetStack = this.tableau[targetCol];

      let canPlace = false;
      if (targetStack.length === 0) {
        canPlace = (card.val === 13); // King on empty
      } else {
        const topCard = targetStack[targetStack.length - 1];
        canPlace = (topCard.faceUp && topCard.color !== card.color && topCard.val === card.val + 1);
      }

      if (canPlace) {
        this.saveState();
        col.splice(cardIdx);
        targetStack.push(...movingStack);
        if (col.length > 0) col[col.length - 1].faceUp = true;
        this.moves++;
        this.score += 5;
        window.soundEngine.drop();
        this.updateStats();
        this.checkWin();
        this.render();
        return;
      }
    }

    window.soundEngine.click();
  }

  trySendToFoundation(card, removeCallback) {
    for (let f = 0; f < 4; f++) {
      const fPile = this.foundations[f];
      let canPlace = false;
      if (fPile.length === 0) {
        canPlace = (card.val === 1); // Ace
      } else {
        const top = fPile[fPile.length - 1];
        canPlace = (top.suit === card.suit && top.val === card.val - 1);
      }

      if (canPlace) {
        this.saveState();
        removeCallback();
        fPile.push(card);
        this.score += 15;
        this.moves++;
        window.soundEngine.coin();
        this.updateStats();
        this.checkWin();
        this.render();
        return true;
      }
    }
    return false;
  }

  trySendToTableau(card, removeCallback) {
    for (let colIdx = 0; colIdx < 7; colIdx++) {
      const col = this.tableau[colIdx];
      let canPlace = false;
      if (col.length === 0) {
        canPlace = (card.val === 13);
      } else {
        const top = col[col.length - 1];
        canPlace = (top.faceUp && top.color !== card.color && top.val === card.val + 1);
      }

      if (canPlace) {
        this.saveState();
        removeCallback();
        col.push(card);
        this.moves++;
        this.score += 5;
        window.soundEngine.drop();
        this.updateStats();
        this.checkWin();
        this.render();
        return true;
      }
    }
    return false;
  }

  canAutoComplete() {
    if (this.stock.length > 0 || this.waste.length > 0) return false;
    for (let col of this.tableau) {
      if (col.some(c => !c.faceUp)) return false;
    }
    return true;
  }

  autoComplete() {
    const step = () => {
      let moved = false;
      for (let colIdx = 0; colIdx < 7; colIdx++) {
        const col = this.tableau[colIdx];
        if (col.length > 0) {
          const card = col[col.length - 1];
          if (this.trySendToFoundation(card, () => col.pop())) {
            moved = true;
            setTimeout(step, 100);
            return;
          }
        }
      }
    };
    step();
  }

  checkWin() {
    const totalFound = this.foundations.reduce((sum, f) => sum + f.length, 0);
    if (totalFound === 52) {
      this.isWon = true;
      window.soundEngine.victory();
    }
  }

  updateStats() {
    const sEl = document.getElementById('sol-score');
    const mEl = document.getElementById('sol-moves');
    if (sEl) sEl.textContent = this.score;
    if (mEl) mEl.textContent = this.moves;

    const autoBtn = document.getElementById('sol-autocomplete');
    if (autoBtn) {
      autoBtn.style.display = (this.canAutoComplete() && !this.isWon) ? 'inline-flex' : 'none';
    }
  }

  render() {
    // Render Stock
    const stockEl = document.getElementById('sol-stock');
    if (stockEl) {
      stockEl.innerHTML = '';
      if (this.stock.length > 0) {
        stockEl.appendChild(this.createCardElement({ faceUp: false }));
      } else {
        stockEl.innerHTML = '<span class="slot-label">↻ RECYCLE</span>';
      }
    }

    // Render Waste
    const wasteEl = document.getElementById('sol-waste');
    if (wasteEl) {
      wasteEl.innerHTML = '';
      if (this.waste.length > 0) {
        const top = this.waste[this.waste.length - 1];
        const cardEl = this.createCardElement(top);
        cardEl.onclick = () => this.handleWasteCardClick();
        cardEl.ondblclick = () => this.handleWasteCardClick();
        wasteEl.appendChild(cardEl);
      }
    }

    // Render Foundations
    for (let f = 0; f < 4; f++) {
      const fEl = document.getElementById(`sol-found-${f}`);
      if (fEl) {
        fEl.innerHTML = '';
        const fPile = this.foundations[f];
        if (fPile.length > 0) {
          fEl.appendChild(this.createCardElement(fPile[fPile.length - 1]));
        } else {
          fEl.innerHTML = '<span class="slot-label">A</span>';
        }
      }
    }

    // Render Tableau Columns
    for (let c = 0; c < 7; c++) {
      const colEl = document.getElementById(`sol-col-${c}`);
      if (colEl) {
        colEl.innerHTML = '';
        const col = this.tableau[c];

        if (col.length === 0) {
          const emptySlot = document.createElement('div');
          emptySlot.className = 'sol-card-slot';
          emptySlot.onclick = () => {
            // Check if waste has King
            if (this.waste.length > 0 && this.waste[this.waste.length - 1].val === 13) {
              this.handleWasteCardClick();
            }
          };
          colEl.appendChild(emptySlot);
        } else {
          col.forEach((card, r) => {
            const cardEl = this.createCardElement(card);
            cardEl.style.position = 'absolute';
            cardEl.style.top = `${r * 28}px`;

            if (card.faceUp) {
              cardEl.onclick = (e) => {
                e.stopPropagation();
                this.handleTableauCardClick(c, r);
              };
              cardEl.ondblclick = (e) => {
                e.stopPropagation();
                this.handleTableauCardClick(c, r);
              };
            } else if (r === col.length - 1) {
              cardEl.onclick = () => this.handleTableauCardClick(c, r);
            }

            colEl.appendChild(cardEl);
          });
        }
      }
    }

    // Victory Overlay
    if (this.isWon) {
      const board = document.getElementById('sol-board');
      const overlay = document.createElement('div');
      overlay.className = 'game-overlay';
      overlay.innerHTML = `
        <div class="overlay-card">
          <h3>Solitaire Victory! 🏆</h3>
          <p>Score: <strong>${this.score}</strong> | Moves: <strong>${this.moves}</strong></p>
          <button class="btn btn-primary" id="sol-play-again-btn">New Deal (Enter)</button>
        </div>
      `;
      board.appendChild(overlay);
      overlay.querySelector('#sol-play-again-btn').onclick = () => this.newDeal();
    }
  }

  createCardElement(card) {
    const el = document.createElement('div');
    el.className = 'sol-card';
    if (!card.faceUp) {
      el.classList.add('card-back');
      return el;
    }

    el.classList.add(`card-${card.color}`);
    el.innerHTML = `
      <div class="card-corner top-left">
        <span>${card.name}</span>
        <span class="suit-icon">${card.symbol}</span>
      </div>
      <div class="card-center">${card.symbol}</div>
      <div class="card-corner bottom-right">
        <span>${card.name}</span>
        <span class="suit-icon">${card.symbol}</span>
      </div>
    `;
    return el;
  }

  destroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}

window.SolitaireGame = SolitaireGame;
