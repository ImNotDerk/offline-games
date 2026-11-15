const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

// =========================================================================
// MOCK DOM & RUNTIME ENVIRONMENT FOR CARTRIDGE TESTS
// =========================================================================

function parseHtmlToElement(html, parent) {
  const regex = /<(\/)?([a-zA-Z0-9-]+)((?:\s+[^>]*?)?)\s*(\/?)>|([^<]+)/g;
  const stack = [parent];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const [full, isClosing, tagName, rawAttrs, isSelfClosing, text] = match;
    if (text) {
      const trimmed = text.trim();
      if (trimmed) {
        const current = stack[stack.length - 1];
        current.textContent = (current.textContent ? current.textContent + ' ' : '') + trimmed;
      }
    } else if (isClosing) {
      if (stack.length > 1) {
        stack.pop();
      }
    } else if (tagName) {
      const el = new MockElement('', tagName);
      if (rawAttrs) {
        const attrRegex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
        let m;
        while ((m = attrRegex.exec(rawAttrs)) !== null) {
          const k = m[1];
          const v = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : ''));
          if (k === 'id') el.id = v;
          else if (k === 'class') el.className = v;
          else if (k.startsWith('data-')) {
            const dataKey = k.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
            el.dataset[dataKey] = v;
          }
          el.setAttribute(k, v);
        }
      }
      const current = stack[stack.length - 1];
      current.appendChild(el);
      if (!isSelfClosing && !['input', 'img', 'br', 'hr'].includes(tagName.toLowerCase())) {
        stack.push(el);
      }
    }
  }
}

class MockElement {
  constructor(id = '', tagName = 'div', className = '') {
    this.id = id;
    this.tagName = (tagName || 'div').toUpperCase();
    this._classes = new Set(className ? String(className).split(/\s+/).filter(Boolean) : []);
    this.classList = {
      add: (...tokens) => tokens.forEach(t => this._classes.add(t)),
      remove: (...tokens) => tokens.forEach(t => this._classes.delete(t)),
      toggle: (token, force) => {
        const has = this._classes.has(token);
        const shouldHave = force !== undefined ? !!force : !has;
        if (shouldHave) this._classes.add(token);
        else this._classes.delete(token);
        return shouldHave;
      },
      contains: (token) => this._classes.has(token),
      toString: () => Array.from(this._classes).join(' ')
    };
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.children = [];
    this.parentElement = null;
    this._innerHTML = '';
    this.textContent = '';
    this._listeners = {};
    this.onclick = null;
    this.onkeydown = null;
    this.tabIndex = 0;
  }

  get className() {
    return Array.from(this._classes).join(' ');
  }

  set className(val) {
    this._classes = new Set(val ? String(val).split(/\s+/).filter(Boolean) : []);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(html) {
    this._innerHTML = html;
    this.children = [];
    this.textContent = '';
    if (!html) return;
    parseHtmlToElement(html, this);
  }

  setAttribute(k, v) {
    this.attributes[k] = String(v);
  }

  getAttribute(k) {
    return Object.prototype.hasOwnProperty.call(this.attributes, k) ? this.attributes[k] : null;
  }

  removeAttribute(k) {
    delete this.attributes[k];
  }

  addEventListener(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }

  removeEventListener(event, fn) {
    if (!this._listeners[event]) return;
    const idx = this._listeners[event].indexOf(fn);
    if (idx !== -1) this._listeners[event].splice(idx, 1);
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  querySelectorAll(sel) {
    const results = [];
    const matchNode = (node, s) => {
      s = s.trim();
      if (s.startsWith('.')) {
        return node.classList.contains(s.slice(1));
      }
      if (s.startsWith('#')) {
        return node.id === s.slice(1);
      }
      if (s.startsWith('[') && s.endsWith(']')) {
        const inner = s.slice(1, -1);
        if (inner.includes('=')) {
          const [k, rawV] = inner.split('=');
          const v = rawV.replace(/^["']|["']$/g, '');
          return node.getAttribute(k) === v;
        }
        return node.getAttribute(inner) !== null;
      }
      return node.tagName.toLowerCase() === s.toLowerCase();
    };

    const traverse = (node) => {
      for (const child of node.children) {
        if (matchNode(child, sel)) {
          results.push(child);
        }
        traverse(child);
      }
    };
    traverse(this);
    return results;
  }

  querySelector(sel) {
    const list = this.querySelectorAll(sel);
    return list.length > 0 ? list[0] : null;
  }

  click() {
    let stopped = false;
    const evt = {
      type: 'click',
      target: this,
      stopPropagation: () => { stopped = true; }
    };
    if (typeof this.onclick === 'function') {
      this.onclick(evt);
    }
    if (this._listeners['click']) {
      this._listeners['click'].forEach(fn => fn(evt));
    }
    if (!stopped && this.parentElement && typeof this.parentElement.click === 'function') {
      this.parentElement.click();
    }
  }

  triggerKeydown(key, target = null) {
    let prevented = false;
    const evt = {
      type: 'keydown',
      key,
      target: target || this,
      preventDefault: () => { prevented = true; }
    };
    if (typeof this.onkeydown === 'function') {
      this.onkeydown(evt);
    }
    return prevented;
  }
}

// Global Mocks
const elements = new Map();
const sfxCalls = [];

const mockDocument = {
  createElement(tag) {
    return new MockElement('', tag);
  },
  getElementById(id) {
    if (!elements.has(id)) {
      elements.set(id, new MockElement(id));
    }
    return elements.get(id);
  },
  querySelectorAll() { return []; },
  addEventListener() {}
};

const mockWindow = {
  audioController: {
    playSfx(id) {
      sfxCalls.push(id);
    },
    toggleSfx() { return true; }
  },
  storageManager: {
    getHighScore(id) { return 1000; },
    get(k, def) { return def !== undefined ? def : 5; },
    set() {}
  },
  addEventListener() {},
  removeEventListener() {}
};

globalThis.window = mockWindow;
globalThis.document = mockDocument;

const { App, MODULES } = require('../js/app.js');

let appInstance = null;
let switchedViews = [];
let openedTutorials = [];

beforeEach(() => {
  elements.clear();
  sfxCalls.length = 0;
  switchedViews = [];
  openedTutorials = [];

  appInstance = new App();
  appInstance.switchView = (view, modId) => {
    switchedViews.push({ view, modId });
  };
  appInstance.openTutorial = (modId) => {
    openedTutorials.push(modId);
  };
});

// =========================================================================
// TEST SUITE: RETRO CARTRIDGE DOM & MINI SCREENSHOT PREVIEWS
// =========================================================================

test('cartridge-dom: App.prototype.getModulePreviewHtml returns rich pixel art for all 10 modules', () => {
  const expectedPreviews = [
    { id: 'sudoku', boardClass: 'mini-sudoku-board', childClass: 'mini-sudoku-cell', minCells: 81 },
    { id: 'wordle', boardClass: 'mini-wordle-board', childClass: 'mini-wordle-tile', minCells: 15 },
    { id: 'g2048', boardClass: 'mini-2048-board', childClass: 'mini-2048-tile', minCells: 16 },
    { id: 'tetris', boardClass: 'mini-tetris-board', childClass: 'mini-tet-cell', minCells: 110 },
    { id: 'minesweeper', boardClass: 'mini-ms-board', childClass: 'mini-ms-cell', minCells: 48 },
    { id: 'scratchpad', boardClass: 'mini-scratch-board', childClass: 'mini-scratch-pane', minCells: 2 },
    { id: 'solitaire', boardClass: 'mini-sol-board', childClass: 'mini-sol-card', minCells: 5 },
    { id: 'connect4', boardClass: 'mini-c4-board', childClass: 'mini-c4-slot', minCells: 42 },
    { id: 'tictactoe', boardClass: 'mini-ttt-board', childClass: 'mini-ttt-cell', minCells: 9 },
    { id: 'aistudio', boardClass: 'mini-ai-board', childClass: 'mini-ai-prompt', minCells: 2 }
  ];

  for (const exp of expectedPreviews) {
    const html = appInstance.getModulePreviewHtml(exp.id);
    assert.ok(html && html.length > 0, `getModulePreviewHtml('${exp.id}') must return non-empty HTML`);

    const container = new MockElement();
    container.innerHTML = html;

    const board = container.querySelector(`.${exp.boardClass}`);
    assert.ok(board, `HTML for ${exp.id} must contain element with class .${exp.boardClass}`);

    const children = container.querySelectorAll(`.${exp.childClass}`);
    assert.ok(
      children.length >= exp.minCells,
      `HTML for ${exp.id} must contain at least ${exp.minCells} elements with class .${exp.childClass}, found ${children.length}`
    );
  }

  // Fallback test
  assert.strictEqual(appInstance.getModulePreviewHtml('unknown_module'), '');
});

test('cartridge-dom: renderIndex() populates #index-grid with 10 .cartridge-card elements', () => {
  const gridEl = mockDocument.getElementById('index-grid');
  appInstance.renderIndex();

  const cards = gridEl.querySelectorAll('.cartridge-card');
  assert.strictEqual(cards.length, 10, 'renderIndex() must generate exactly 10 .cartridge-card elements');

  // Verify all 10 module IDs are present in sequence
  const renderedIds = cards.map(c => c.getAttribute('data-id'));
  const expectedIds = MODULES.map(m => m.id);
  assert.deepStrictEqual(renderedIds, expectedIds, 'All 10 modules must be rendered with matching data-id');

  // Verify data-key on each card
  cards.forEach((card, idx) => {
    const mod = MODULES[idx];
    assert.strictEqual(card.getAttribute('data-key'), mod.key, `Card ${mod.id} must have data-key="${mod.key}"`);
  });
});

test('cartridge-dom: each cartridge card has full retro anatomy (grooves, sticker, preview, action bar)', () => {
  const gridEl = mockDocument.getElementById('index-grid');
  appInstance.renderIndex();

  const cards = gridEl.querySelectorAll('.cartridge-card');

  cards.forEach((card, idx) => {
    const mod = MODULES[idx];

    // 1. Top grooves
    const topGrooves = card.querySelector('.cartridge-top-grooves');
    assert.ok(topGrooves, `Cartridge ${mod.id} must have .cartridge-top-grooves`);
    const grooves = topGrooves.querySelectorAll('.cartridge-groove');
    assert.strictEqual(grooves.length, 3, `Cartridge ${mod.id} must have 3 .cartridge-groove slots`);

    // 2. Sticker
    const sticker = card.querySelector('.cartridge-sticker');
    assert.ok(sticker, `Cartridge ${mod.id} must have .cartridge-sticker`);

    const title = sticker.querySelector('.cartridge-sticker-title');
    assert.ok(title, `Cartridge ${mod.id} must have .cartridge-sticker-title`);
    assert.strictEqual(title.textContent.trim(), mod.title);

    const badge = sticker.querySelector('.cartridge-sticker-badge');
    assert.ok(badge, `Cartridge ${mod.id} must have .cartridge-sticker-badge`);
    assert.strictEqual(badge.textContent.trim(), `ZENITH-${mod.num}`);

    // 3. Preview window with embedded mini-screenshot
    const preview = sticker.querySelector('.cartridge-preview-window');
    assert.ok(preview, `Cartridge ${mod.id} must have .cartridge-preview-window`);
    assert.ok(preview.children.length > 0, `Preview window for ${mod.id} must not be empty`);

    // 4. Footer
    const footer = sticker.querySelector('.cartridge-sticker-footer');
    assert.ok(footer, `Cartridge ${mod.id} must have .cartridge-sticker-footer`);
    const cat = footer.querySelector('.cartridge-cat');
    assert.ok(cat, `Cartridge ${mod.id} must have .cartridge-cat`);
    assert.strictEqual(cat.textContent.trim(), mod.cat);

    // 5. Action bar
    const actions = card.querySelector('.cartridge-actions-bar');
    assert.ok(actions, `Cartridge ${mod.id} must have .cartridge-actions-bar`);

    const tutBtn = actions.querySelector('.cart-btn-tut');
    assert.ok(tutBtn, `Cartridge ${mod.id} must have .cart-btn-tut`);
    assert.strictEqual(tutBtn.getAttribute('data-tut'), mod.id);

    const insertBtn = actions.querySelector('.cart-btn-insert');
    assert.ok(insertBtn, `Cartridge ${mod.id} must have .cart-btn-insert`);
    assert.strictEqual(insertBtn.getAttribute('data-launch'), mod.id);
  });
});

test('cartridge-dom: clicking .cart-btn-insert or cartridge triggers audio SFX and switchView', () => {
  const gridEl = mockDocument.getElementById('index-grid');
  appInstance.renderIndex();

  const cards = gridEl.querySelectorAll('.cartridge-card');

  // Test clicking insert button on card 0 (sudoku)
  const insertBtnSudoku = cards[0].querySelector('.cart-btn-insert');
  insertBtnSudoku.click();

  assert.strictEqual(sfxCalls.length, 1, 'Clicking INSERT must play SFX 0');
  assert.strictEqual(sfxCalls[0], 0, 'SFX id must be 0');
  assert.strictEqual(switchedViews.length, 1, 'Clicking INSERT must call switchView');
  assert.deepStrictEqual(switchedViews[0], { view: 'stage', modId: 'sudoku' });

  // Test clicking card 3 (tetris) body directly
  sfxCalls.length = 0;
  switchedViews.length = 0;
  cards[3].click();

  assert.strictEqual(sfxCalls.length, 1, 'Clicking cartridge card must play SFX 0');
  assert.strictEqual(sfxCalls[0], 0, 'SFX id must be 0');
  assert.strictEqual(switchedViews.length, 1, 'Clicking cartridge card must call switchView');
  assert.deepStrictEqual(switchedViews[0], { view: 'stage', modId: 'tetris' });
});

test('cartridge-dom: pressing Enter or Space on focused cartridge triggers launch', () => {
  const gridEl = mockDocument.getElementById('index-grid');
  appInstance.renderIndex();

  const cards = gridEl.querySelectorAll('.cartridge-card');
  const wordleCard = cards[1]; // wordle

  // Enter key
  sfxCalls.length = 0;
  switchedViews.length = 0;
  const preventedEnter = wordleCard.triggerKeydown('Enter');
  assert.ok(preventedEnter, 'Enter on cartridge card must preventDefault');
  assert.strictEqual(sfxCalls.length, 1);
  assert.deepStrictEqual(switchedViews[0], { view: 'stage', modId: 'wordle' });

  // Space key
  sfxCalls.length = 0;
  switchedViews.length = 0;
  const preventedSpace = wordleCard.triggerKeydown(' ');
  assert.ok(preventedSpace, 'Space on cartridge card must preventDefault');
  assert.strictEqual(sfxCalls.length, 1);
  assert.deepStrictEqual(switchedViews[0], { view: 'stage', modId: 'wordle' });
});

test('cartridge-dom: clicking .cart-btn-tut opens tutorial and stops propagation', () => {
  const gridEl = mockDocument.getElementById('index-grid');
  appInstance.renderIndex();

  const cards = gridEl.querySelectorAll('.cartridge-card');
  const minesweeperCard = cards[4];
  const tutBtn = minesweeperCard.querySelector('.cart-btn-tut');

  tutBtn.click();

  assert.strictEqual(openedTutorials.length, 1, 'Clicking .cart-btn-tut must call openTutorial');
  assert.strictEqual(openedTutorials[0], 'minesweeper');
  assert.strictEqual(switchedViews.length, 0, 'Clicking .cart-btn-tut must stop propagation and NOT launch stage');
});
