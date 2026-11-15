const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

// =========================================================================
// MOCK DOM & BROWSER RUNTIME ENVIRONMENT
// =========================================================================

class MockKeyboardEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.key = init.key || '';
    this.code = init.code || '';
    this.bubbles = init.bubbles !== undefined ? init.bubbles : true;
    this.cancelable = init.cancelable !== undefined ? init.cancelable : true;
    this.metaKey = !!init.metaKey;
    this.ctrlKey = !!init.ctrlKey;
    this.altKey = !!init.altKey;
  }
  preventDefault() {}
  stopPropagation() {}
}

class MockElement {
  constructor(id = '', className = '', tagName = 'div') {
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
    this.onchange = null;
    this.onkeydown = null;
    this.width = 300;
    this.height = 600;
    this.value = '';
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
    if (!html) return;
    const tagRegex = /<([a-zA-Z0-9-]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9-]+)([^>]*)\/?>/g;
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      const tagName = match[1] || match[4];
      const attrsStr = match[2] || match[5] || '';
      const inner = match[3] || '';
      const child = new MockElement('', '', tagName);
      const attrRegex = /([a-zA-Z0-9_-]+)(?:="([^"]*)")?/g;
      for (const m of attrsStr.matchAll(attrRegex)) {
        const k = m[1];
        const v = m[2] !== undefined ? m[2] : '';
        if (k === 'id') child.id = v;
        else if (k === 'class') child.className = v;
        else if (k.startsWith('data-')) {
          const dataKey = k.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
          child.dataset[dataKey] = v;
        } else {
          child.setAttribute(k, v);
        }
      }
      if (inner && !inner.includes('<')) child.textContent = inner;
      else if (inner) child.innerHTML = inner;
      this.appendChild(child);
      if (child.id && globalThis.mockDocument) {
        globalThis.mockDocument.register(child);
      }
    }
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
    if (child.id && globalThis.mockDocument) {
      globalThis.mockDocument.register(child);
    }
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    child.parentElement = null;
    return child;
  }

  remove() {
    if (this.parentElement) {
      this.parentElement.removeChild(this);
    }
  }

  querySelector(sel) {
    const results = this.querySelectorAll(sel);
    return results.length > 0 ? results[0] : null;
  }

  querySelectorAll(sel) {
    const out = [];
    const check = (node) => {
      let match = false;
      if (sel.startsWith('#') && node.id === sel.slice(1)) match = true;
      else if (sel.startsWith('.') && node.classList.contains(sel.slice(1))) match = true;
      else if (node.tagName.toLowerCase() === sel.toLowerCase()) match = true;
      if (match) out.push(node);
      node.children.forEach(check);
    };
    this.children.forEach(check);
    return out;
  }

  getContext() {
    return {
      fillRect() {}, clearRect() {}, strokeRect() {}, fillText() {},
      measureText() { return { width: 0 }; }, beginPath() {}, moveTo() {},
      lineTo() {}, arc() {}, fill() {}, stroke() {}, closePath() {},
      drawImage() {}, save() {}, restore() {}, scale() {}, translate() {}
    };
  }

  click() {
    if (typeof this.onclick === 'function') {
      this.onclick({ type: 'click', target: this });
    }
    if (this._listeners['click']) {
      this._listeners['click'].forEach(fn => fn({ type: 'click', target: this }));
    }
  }
}

// Global registry
const elements = new Map();
const sfxCalls = [];
const wasmCalls = [];
const windowListeners = new Map();

const mockDocument = {
  documentElement: new MockElement('html'),
  body: new MockElement('body'),
  createElement(tag) {
    return new MockElement('', '', tag);
  },
  register(el) {
    if (el.id) elements.set(el.id, el);
  },
  getElementById(id) {
    if (!elements.has(id)) {
      const el = new MockElement(id);
      elements.set(id, el);
    }
    return elements.get(id);
  },
  querySelectorAll(sel) {
    return Array.from(elements.values()).filter(el => {
      if (sel.includes('.deck-dpad button') && el.className.includes('dpad-btn')) return true;
      if (sel.includes('.action-buttons button') && el.className.includes('action-btn')) return true;
      if (sel.includes('.deck-options button') && el.className.includes('pill-btn')) return true;
      return false;
    });
  },
  addEventListener() {}
};

const mockLocalStorage = {
  store: new Map(),
  getItem(key) { return this.store.has(key) ? this.store.get(key) : null; },
  setItem(key, value) { this.store.set(key, String(value)); },
  removeItem(key) { this.store.delete(key); },
  clear() { this.store.clear(); }
};

const mockWindow = {
  dispatchEvent(event) {
    const list = windowListeners.get(event.type) || [];
    list.forEach(fn => fn(event));
    return true;
  },
  addEventListener(type, fn) {
    if (!windowListeners.has(type)) windowListeners.set(type, []);
    windowListeners.get(type).push(fn);
  },
  removeEventListener(type, fn) {
    const list = windowListeners.get(type) || [];
    const idx = list.indexOf(fn);
    if (idx !== -1) list.splice(idx, 1);
  },
  audioController: {
    playSfx(id) { sfxCalls.push(id); },
    toggleSfx() { return true; },
    playAmbient() {},
    suspend() {},
    resume() {}
  },
  storageManager: {
    getHighScore() { return 0; },
    setHighScore() {},
    get(k, def) { return def !== undefined ? def : 0; },
    set() {}
  },
  wasmBridge: {
    init: async () => {},
    lastExecTimeMs: 0.05,
    call: (fn, ...args) => {
      wasmCalls.push({ fn, args });
      if (fn === 'tetris_get_level') return 1;
      if (fn === 'sudoku_is_game_over' || fn === 'sudoku_is_game_won') return 0;
      if (fn === 'ms_get_mine_count') return 10;
      return 1;
    },
    getUint8View: () => new Uint8Array(2048),
    getUint16View: () => new Uint16Array(2048),
    getUint32View: () => new Uint32Array(2048),
    getFloat32View: () => new Float32Array(2048)
  },
  requestAnimationFrame(fn) {
    return setTimeout(() => fn(Date.now()), 16);
  },
  cancelAnimationFrame(id) {
    clearTimeout(id);
  }
};

// Bind to global scope
globalThis.mockDocument = mockDocument;
globalThis.window = mockWindow;
globalThis.document = mockDocument;
globalThis.localStorage = mockLocalStorage;
globalThis.KeyboardEvent = MockKeyboardEvent;
globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });

const { App } = require('../js/app.js');

let currentApp = null;

function setupHandheldEnv() {
  if (currentApp && currentApp.activeModuleInstance && typeof currentApp.activeModuleInstance.destroy === 'function') {
    currentApp.activeModuleInstance.destroy();
    currentApp.activeModuleInstance = null;
  }

  elements.clear();
  windowListeners.clear();
  sfxCalls.length = 0;
  wasmCalls.length = 0;
  mockLocalStorage.clear();

  mockDocument.documentElement = new MockElement('html');
  mockDocument.body = new MockElement('body');

  // Build authentic Handheld DOM tree
  const chassis = new MockElement('handheld-chassis', 'handheld-chassis');
  const lens = new MockElement('handheld-lens', 'handheld-lens');
  const screen = new MockElement('handheld-screen', 'handheld-screen');
  const mount = new MockElement('stage-mount', 'stage-mount');
  const deck = new MockElement('handheld-deck', 'handheld-deck');

  screen.appendChild(mount);
  lens.appendChild(screen);
  chassis.appendChild(lens);
  chassis.appendChild(deck);

  mockDocument.register(chassis);
  mockDocument.register(lens);
  mockDocument.register(screen);
  mockDocument.register(mount);
  mockDocument.register(deck);

  // Shell & View controls
  elements.set('index-view', new MockElement('index-view'));
  elements.set('stage-view', new MockElement('stage-view'));
  elements.set('stage-title', new MockElement('stage-title'));
  elements.set('stage-stats', new MockElement('stage-stats'));
  elements.set('stage-actions', new MockElement('stage-actions'));
  elements.set('stage-kbd-hint', new MockElement('stage-kbd-hint'));
  elements.set('crt-toggle-btn', new MockElement('crt-toggle-btn', 'btn'));
  elements.set('theme-toggle-btn', new MockElement('theme-toggle-btn', 'btn'));
  elements.set('telemetry-ms', new MockElement('telemetry-ms'));
  elements.set('dash-telemetry', new MockElement('dash-telemetry'));

  // D-Pad buttons
  const dpadUp = new MockElement('dpad-up', 'dpad-btn dpad-up');
  dpadUp.dataset.key = 'ArrowUp';
  dpadUp.dataset.code = 'ArrowUp';
  elements.set('dpad-up', dpadUp);

  const dpadDown = new MockElement('dpad-down', 'dpad-btn dpad-down');
  dpadDown.dataset.key = 'ArrowDown';
  dpadDown.dataset.code = 'ArrowDown';
  elements.set('dpad-down', dpadDown);

  const dpadLeft = new MockElement('dpad-left', 'dpad-btn dpad-left');
  dpadLeft.dataset.key = 'ArrowLeft';
  dpadLeft.dataset.code = 'ArrowLeft';
  elements.set('dpad-left', dpadLeft);

  const dpadRight = new MockElement('dpad-right', 'dpad-btn dpad-right');
  dpadRight.dataset.key = 'ArrowRight';
  dpadRight.dataset.code = 'ArrowRight';
  elements.set('dpad-right', dpadRight);

  // Deck option buttons
  const deckSelect = new MockElement('deck-select', 'pill-btn');
  deckSelect.dataset.key = 'Shift';
  deckSelect.dataset.code = 'ShiftLeft';
  elements.set('deck-select', deckSelect);

  const deckStart = new MockElement('deck-start', 'pill-btn');
  deckStart.dataset.key = 'Enter';
  deckStart.dataset.code = 'Enter';
  elements.set('deck-start', deckStart);

  // Action buttons
  const btnB = new MockElement('btn-b', 'action-btn btn-b');
  btnB.dataset.key = 'z';
  btnB.dataset.code = 'KeyZ';
  elements.set('btn-b', btnB);

  const btnA = new MockElement('btn-a', 'action-btn btn-a');
  btnA.dataset.key = 'x';
  btnA.dataset.code = 'KeyX';
  elements.set('btn-a', btnA);

  currentApp = new App();
  return { chassis, lens, screen, mount, deck };
}

afterEach(() => {
  if (currentApp && currentApp.activeModuleInstance && typeof currentApp.activeModuleInstance.destroy === 'function') {
    currentApp.activeModuleInstance.destroy();
    currentApp.activeModuleInstance = null;
  }
});

// =========================================================================
// TEST SUITE: END-TO-END HANDHELD INTEGRATION
// =========================================================================

test('E2E Handheld: All 10 modules mount cleanly into #stage-mount inside #handheld-screen', () => {
  const { screen, mount } = setupHandheldEnv();

  const allModules = [
    'sudoku',
    'wordle',
    'g2048',
    'tetris',
    'minesweeper',
    'scratchpad',
    'solitaire',
    'connect4',
    'tictactoe',
    'aistudio'
  ];

  assert.strictEqual(mount.parentElement, screen, '#stage-mount must be a direct child of #handheld-screen');

  allModules.forEach(modId => {
    currentApp.switchView('stage', modId);

    // Verify stage view state
    assert.strictEqual(currentApp.currentView, 'stage', `currentView should be "stage" for ${modId}`);
    assert.strictEqual(currentApp.activeModuleId, modId, `activeModuleId should be "${modId}"`);
    assert.ok(currentApp.activeModuleInstance, `Module instance for "${modId}" must be created`);

    // Verify stage mount receives content
    const mountEl = elements.get('stage-mount');
    assert.ok(
      mountEl.children.length > 0 || mountEl.innerHTML.length > 0,
      `Module "${modId}" must mount UI elements inside #stage-mount`
    );

    // Verify stage title is updated
    const titleEl = elements.get('stage-title');
    assert.ok(titleEl.textContent.length > 0, `Stage title must be populated for ${modId}`);

    // Return to index and verify destruction
    currentApp.switchView('index');
    assert.strictEqual(currentApp.currentView, 'index');
    assert.strictEqual(currentApp.activeModuleId, null);
    assert.strictEqual(currentApp.activeModuleInstance, null);
  });
});

test('E2E Handheld: Adaptive wide layout toggles .layout-wide on #handheld-chassis', () => {
  const { chassis } = setupHandheldEnv();

  // 1. Solitaire requires wide layout
  currentApp.switchView('stage', 'solitaire');
  assert.strictEqual(
    chassis.classList.contains('layout-wide'),
    true,
    'Solitaire must add .layout-wide to #handheld-chassis'
  );

  // 2. Minesweeper requires wide layout
  currentApp.switchView('stage', 'minesweeper');
  assert.strictEqual(
    chassis.classList.contains('layout-wide'),
    true,
    'Minesweeper must add .layout-wide to #handheld-chassis'
  );

  // 3. Tetris returns to standard portrait layout
  currentApp.switchView('stage', 'tetris');
  assert.strictEqual(
    chassis.classList.contains('layout-wide'),
    false,
    'Tetris must remove .layout-wide from #handheld-chassis'
  );

  // 4. 2048 returns to standard portrait layout
  currentApp.switchView('stage', 'g2048');
  assert.strictEqual(
    chassis.classList.contains('layout-wide'),
    false,
    '2048 must remove .layout-wide from #handheld-chassis'
  );

  // 5. Connect 4 & Tic-Tac-Toe return to standard portrait layout
  currentApp.switchView('stage', 'solitaire');
  assert.strictEqual(chassis.classList.contains('layout-wide'), true);
  currentApp.switchView('stage', 'connect4');
  assert.strictEqual(chassis.classList.contains('layout-wide'), false);

  // 6. Returning to index view clears .layout-wide
  currentApp.switchView('stage', 'minesweeper');
  assert.strictEqual(chassis.classList.contains('layout-wide'), true);
  currentApp.switchView('index');
  assert.strictEqual(chassis.classList.contains('layout-wide'), false);
});

test('E2E Handheld: Stage overlay mounts inside #handheld-screen with full review workflow', () => {
  const { screen, mount } = setupHandheldEnv();

  currentApp.switchView('stage', 'minesweeper');

  let restartCalled = false;
  const onRestart = () => { restartCalled = true; };

  const ov = currentApp.showStageOverlay(
    'MINESWEEPER CLEARED',
    'Minefield successfully cleared!',
    [
      { label: 'TIME', val: '24s' },
      { label: 'MINES', val: '10' }
    ],
    onRestart,
    { allowReview: true }
  );

  assert.ok(ov, 'Overlay element must be returned');
  assert.strictEqual(ov.parentElement, mount, 'Overlay must be appended inside #stage-mount');
  assert.strictEqual(mount.parentElement, screen, '#stage-mount must be inside #handheld-screen');
  assert.strictEqual(ov.classList.contains('stage-overlay'), true, 'Overlay must have .stage-overlay class');
  assert.strictEqual(ov.classList.contains('banner-mode'), false, 'Overlay must not start in banner mode');

  // Verify Review Board button enters banner-mode
  const reviewBtn = ov.querySelector('#stage-ov-btn-review');
  assert.ok(reviewBtn, 'Review button must exist when allowReview is true');
  reviewBtn.click();
  assert.strictEqual(ov.classList.contains('banner-mode'), true, 'Clicking Review button must add .banner-mode');

  // Verify Reopen button exits banner-mode
  const reopenBtn = ov.querySelector('#stage-ov-btn-reopen');
  assert.ok(reopenBtn, 'Reopen button must exist in banner-mode');
  reopenBtn.click();
  assert.strictEqual(ov.classList.contains('banner-mode'), false, 'Clicking Reopen button must remove .banner-mode');

  // Verify Escape key behavior in review mode
  reviewBtn.click();
  assert.strictEqual(ov.classList.contains('banner-mode'), true);
  mockWindow.dispatchEvent(new MockKeyboardEvent('keydown', { key: 'Escape' }));
  assert.strictEqual(ov.classList.contains('banner-mode'), false, 'Escape while reviewing should exit banner-mode');

  // Verify Escape key behavior outside review mode (returns to index)
  mockWindow.dispatchEvent(new MockKeyboardEvent('keydown', { key: 'Escape' }));
  assert.strictEqual(currentApp.currentView, 'index', 'Escape outside review mode should return to index');

  // Re-open and verify Play Again button
  currentApp.switchView('stage', 'minesweeper');
  currentApp.showStageOverlay('DEFEAT', 'Mine detonated', [], onRestart, { isGameOver: true });
  const restartBtn = mount.querySelector('#stage-ov-btn-restart');
  assert.ok(restartBtn, 'Restart button must exist');
  restartBtn.click();
  assert.strictEqual(restartCalled, true, 'Clicking restart button must trigger callback');

  // Verify cleanup via removeStageOverlay
  currentApp.showStageOverlay('TITLE', 'Sub', [], onRestart);
  assert.strictEqual(mount.querySelectorAll('.stage-overlay').length, 1);
  currentApp.removeStageOverlay();
  assert.strictEqual(mount.querySelectorAll('.stage-overlay').length, 0, 'removeStageOverlay must remove all overlays');
});

test('E2E Handheld: Chassis controls (D-Pad, A/B, Select, Start) correctly dispatch events', async () => {
  setupHandheldEnv();
  currentApp.setupHandheldControls();

  const dispatchedEvents = [];
  mockWindow.addEventListener('keydown', (ev) => {
    dispatchedEvents.push({ type: 'keydown', key: ev.key, code: ev.code });
  });
  mockWindow.addEventListener('keyup', (ev) => {
    dispatchedEvents.push({ type: 'keyup', key: ev.key, code: ev.code });
  });

  const controls = [
    { id: 'dpad-up', expectedKey: 'ArrowUp', expectedCode: 'ArrowUp' },
    { id: 'dpad-down', expectedKey: 'ArrowDown', expectedCode: 'ArrowDown' },
    { id: 'dpad-left', expectedKey: 'ArrowLeft', expectedCode: 'ArrowLeft' },
    { id: 'dpad-right', expectedKey: 'ArrowRight', expectedCode: 'ArrowRight' },
    { id: 'btn-a', expectedKey: 'x', expectedCode: 'KeyX' },
    { id: 'btn-b', expectedKey: 'z', expectedCode: 'KeyZ' },
    { id: 'deck-select', expectedKey: 'Shift', expectedCode: 'ShiftLeft' },
    { id: 'deck-start', expectedKey: 'Enter', expectedCode: 'Enter' }
  ];

  for (const ctrl of controls) {
    dispatchedEvents.length = 0;
    const btn = elements.get(ctrl.id);
    assert.ok(btn, `Button #${ctrl.id} must exist`);

    btn.click();

    // Verify synchronous keydown
    assert.strictEqual(dispatchedEvents.length, 1, `Keydown should dispatch synchronously for #${ctrl.id}`);
    assert.strictEqual(dispatchedEvents[0].type, 'keydown');
    assert.strictEqual(dispatchedEvents[0].key, ctrl.expectedKey);
    assert.strictEqual(dispatchedEvents[0].code, ctrl.expectedCode);

    // Wait ~75ms for asynchronous keyup (60ms timeout)
    await new Promise(resolve => setTimeout(resolve, 75));

    assert.strictEqual(dispatchedEvents.length, 2, `Keyup should dispatch after timeout for #${ctrl.id}`);
    assert.strictEqual(dispatchedEvents[1].type, 'keyup');
    assert.strictEqual(dispatchedEvents[1].key, ctrl.expectedKey);
    assert.strictEqual(dispatchedEvents[1].code, ctrl.expectedCode);
  }

  // Verify mechanical click sound SFX 0 was played
  assert.ok(sfxCalls.includes(0), 'Audio SFX 0 should be played on control button clicks');
});

test('E2E Handheld: In-game consistency mechanics (Solitaire King, Minesweeper review, Sudoku errors, 2048 undo)', () => {
  setupHandheldEnv();

  // 1. Solitaire King placement on empty tableau
  currentApp.switchView('stage', 'solitaire');
  const sol = currentApp.activeModuleInstance;
  assert.ok(sol, 'Solitaire instance must be active');
  sol.tableau[0] = []; // Empty column 0
  assert.strictEqual(
    sol.canPlaceOnTableau({ val: 13, suit: 'H' }, 0),
    true,
    'King (val: 13) can be placed on empty tableau column'
  );
  assert.strictEqual(
    sol.canPlaceOnTableau({ val: 12, suit: 'H' }, 0),
    false,
    'Queen (val: 12) CANNOT be placed on empty tableau column'
  );

  // 2. Sudoku unlimited mistakes toggle
  currentApp.switchView('stage', 'sudoku');
  const sdk = currentApp.activeModuleInstance;
  assert.strictEqual(sdk.unlimitedErrors, false);
  const errBtn = elements.get('sdk-btn-errors');
  assert.ok(errBtn);
  errBtn.click();
  assert.strictEqual(sdk.unlimitedErrors, true, 'Clicking errors button must toggle unlimitedErrors to true');
  const wasmUnlimitedCalls = wasmCalls.filter(c => c.fn === 'sudoku_set_unlimited_mistakes');
  assert.ok(wasmUnlimitedCalls.length > 0, 'sudoku_set_unlimited_mistakes must be sent to WASM bridge');
  assert.strictEqual(wasmUnlimitedCalls[wasmUnlimitedCalls.length - 1].args[0], 1);

  // 3. 2048 undo
  currentApp.switchView('stage', 'g2048');
  const g2048 = currentApp.activeModuleInstance;
  wasmCalls.length = 0;
  g2048.undo();
  const wasmUndoCall = wasmCalls.find(c => c.fn === 'g2048_undo');
  assert.ok(wasmUndoCall, 'g2048_undo must be called on WASM bridge');

  // 4. Minesweeper review support
  currentApp.switchView('stage', 'minesweeper');
  const ms = currentApp.activeModuleInstance;
  assert.ok(ms);
  assert.strictEqual(typeof ms.app.showStageOverlay, 'function');
});

test('E2E Portability: Dual-mode offline binary and base64 fallback sync', () => {
  const wasmPath = path.resolve(__dirname, '../wasm/zenith_core.wasm');
  const jsPath = path.resolve(__dirname, '../js/wasm_inline.js');

  // 1. Verify files exist on disk
  assert.ok(fs.existsSync(wasmPath), 'wasm/zenith_core.wasm must exist');
  assert.ok(fs.existsSync(jsPath), 'js/wasm_inline.js must exist');

  const wasmBuf = fs.readFileSync(wasmPath);
  const jsContent = fs.readFileSync(jsPath, 'utf8');

  // 2. Validate WASM magic header (\0asm)
  assert.strictEqual(wasmBuf[0], 0x00, 'WASM byte 0 must be 0x00');
  assert.strictEqual(wasmBuf[1], 0x61, 'WASM byte 1 must be 0x61 (a)');
  assert.strictEqual(wasmBuf[2], 0x73, 'WASM byte 2 must be 0x73 (s)');
  assert.strictEqual(wasmBuf[3], 0x6d, 'WASM byte 3 must be 0x6d (m)');

  // 3. Extract and verify base64 fallback
  const match = jsContent.match(/window\.ZENITH_WASM_BASE64\s*=\s*"([^"]+)";/);
  assert.ok(match, 'window.ZENITH_WASM_BASE64 must be declared in js/wasm_inline.js');

  const b64Buf = Buffer.from(match[1], 'base64');
  assert.strictEqual(b64Buf.length, wasmBuf.length, 'Base64 decoded length must match WASM file size');
  assert.strictEqual(wasmBuf.equals(b64Buf), true, 'Base64 fallback buffer must be identical to zenith_core.wasm');

  // 4. Validate WASM binary compilation offline
  assert.strictEqual(WebAssembly.validate(wasmBuf), true, 'WASM buffer must validate as valid WebAssembly');

  const module = new WebAssembly.Module(wasmBuf);
  assert.ok(module, 'WASM module must compile synchronously offline');

  const exports = WebAssembly.Module.exports(module);
  const exportNames = exports.map(e => e.name);

  // 5. Ensure core exported APIs are intact
  const expectedExports = [
    'g2048_move',
    'g2048_undo',
    'g2048_reset',
    'ms_reveal',
    'ms_chord',
    'ms_toggle_flag',
    'sudoku_generate',
    'sudoku_set_unlimited_mistakes',
    'tetris_move_h',
    'tetris_rotate_cw',
    'wordle_submit',
    'dsp_render_sfx',
    'dsp_render_ambient'
  ];

  expectedExports.forEach(fn => {
    assert.ok(exportNames.includes(fn), `Exported API "${fn}" must exist in zenith_core.wasm`);
  });
});

test('E2E Handheld: Outer UI scanline confinement and eye-friendly styling', () => {
  const htmlPath = path.resolve(__dirname, '../index.html');
  const mainCssPath = path.resolve(__dirname, '../styles/main.css');
  const modulesCssPath = path.resolve(__dirname, '../styles/modules.css');

  const html = fs.readFileSync(htmlPath, 'utf8');
  const mainCss = fs.readFileSync(mainCssPath, 'utf8');
  const modulesCss = fs.readFileSync(modulesCssPath, 'utf8');

  // 1. In index.html: outer header and main hub are outside the handheld chassis
  assert.ok(html.includes('<header class="top-bar">'), 'Top bar header must exist in index.html');
  assert.ok(html.includes('<main class="main-viewport">'), 'Main app container must exist in index.html');
  assert.ok(html.includes('id="handheld-chassis"'), 'Handheld chassis must exist');
  assert.ok(html.includes('id="handheld-screen"'), 'Handheld screen must exist');
  assert.ok(html.includes('id="stage-mount"'), 'Stage mount must exist');

  // 2. In styles/main.css: scanlines-on is strictly scoped to .handheld-screen
  assert.ok(!mainCss.includes('body.scanlines-on::after'), 'body.scanlines-on::after must NOT exist');
  assert.ok(!mainCss.includes(':root.scanlines-on'), ':root.scanlines-on must NOT exist');
  assert.match(
    mainCss,
    /\.handheld-screen\.scanlines-on::after\s*\{/,
    'Scanlines must be strictly scoped to .handheld-screen.scanlines-on::after'
  );

  // 3. In styles/modules.css: layout-wide and handheld geometry
  assert.match(modulesCss, /\.handheld-chassis\.layout-wide\s*\{/);
  assert.match(modulesCss, /\.handheld-screen\s*\{[^}]*overflow:\s*hidden;/);
});
