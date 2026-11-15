const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

// Create mock DOM environment before importing App
class MockElement {
  constructor(id = '', className = '') {
    this.id = id;
    this.className = className;
    const classes = new Set(className ? className.split(/\s+/).filter(Boolean) : []);
    this.classList = {
      add: (...tokens) => tokens.forEach(t => classes.add(t)),
      remove: (...tokens) => tokens.forEach(t => classes.delete(t)),
      toggle: (token, force) => {
        const has = classes.has(token);
        const shouldHave = force !== undefined ? !!force : !has;
        if (shouldHave) classes.add(token);
        else classes.delete(token);
        return shouldHave;
      },
      contains: (token) => classes.has(token),
      toString: () => Array.from(classes).join(' ')
    };
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.children = [];
    this.innerHTML = '';
    this.textContent = '';
    this._listeners = {};
    this.onclick = null;
    this.width = 300;
    this.height = 600;
  }

  setAttribute(name, val) {
    this.attributes[name] = String(val);
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null;
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  addEventListener(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  querySelectorAll(selector) {
    return [];
  }

  querySelector(selector) {
    return new MockElement();
  }

  remove() {}

  getContext() {
    return {
      fillRect() {},
      clearRect() {},
      strokeRect() {},
      fillText() {},
      measureText() { return { width: 0 }; },
      beginPath() {},
      moveTo() {},
      lineTo() {},
      arc() {},
      fill() {},
      stroke() {},
      closePath() {},
      drawImage() {},
      save() {},
      restore() {},
      scale() {},
      translate() {}
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

class MockKeyboardEvent extends Event {
  constructor(type, init = {}) {
    super(type, init);
    this.key = init.key || '';
    this.code = init.code || '';
  }
}

// Set up mock window and document
const elements = new Map();
const sfxCalls = [];

const mockLocalStorage = {
  store: new Map(),
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  },
  setItem(key, value) {
    this.store.set(key, String(value));
  },
  removeItem(key) {
    this.store.delete(key);
  },
  clear() {
    this.store.clear();
  }
};

const windowListeners = new Map();
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
    playSfx(id) {
      sfxCalls.push(id);
    },
    toggleSfx() { return true; }
  },
  storageManager: {
    getHighScore() { return 0; },
    setHighScore() {},
    get(key, defaultVal) { return defaultVal !== undefined ? defaultVal : null; },
    set() {}
  },
  wasmBridge: {
    init: async () => {},
    lastExecTimeMs: 0.05,
    call: (fn) => (fn === 'tetris_get_level' ? 1 : 0),
    getUint8View: () => new Uint8Array(2048)
  },
  requestAnimationFrame(fn) {
    return setTimeout(() => fn(Date.now()), 16);
  },
  cancelAnimationFrame(id) {
    clearTimeout(id);
  }
};

const mockDocument = {
  documentElement: new MockElement('html'),
  body: new MockElement('body'),
  createElement(tag) {
    return new MockElement('', tag);
  },
  getElementById(id) {
    if (!elements.has(id)) {
      elements.set(id, new MockElement(id));
    }
    return elements.get(id);
  },
  querySelectorAll(selector) {
    const matched = [];
    elements.forEach(el => {
      if (selector.includes('.deck-dpad button') && el.className.includes('dpad-btn')) {
        matched.push(el);
      } else if (selector.includes('.action-buttons button') && el.className.includes('action-btn')) {
        matched.push(el);
      } else if (selector.includes('.deck-options button') && el.className.includes('pill-btn')) {
        matched.push(el);
      }
    });
    return matched;
  },
  addEventListener() {}
};

// Expose globals
globalThis.window = mockWindow;
globalThis.document = mockDocument;
globalThis.localStorage = mockLocalStorage;
globalThis.KeyboardEvent = MockKeyboardEvent;

const { App } = require('../js/app.js');

let currentApp = null;

function resetEnv() {
  if (currentApp && currentApp.activeModuleInstance && typeof currentApp.activeModuleInstance.destroy === 'function') {
    currentApp.activeModuleInstance.destroy();
    currentApp.activeModuleInstance = null;
  }

  elements.clear();
  windowListeners.clear();
  sfxCalls.length = 0;
  mockLocalStorage.clear();

  mockDocument.documentElement = new MockElement('html');
  mockDocument.body = new MockElement('body');

  // Register expected elements
  elements.set('handheld-chassis', new MockElement('handheld-chassis', 'handheld-chassis'));
  elements.set('handheld-screen', new MockElement('handheld-screen', 'handheld-screen'));
  elements.set('crt-toggle-btn', new MockElement('crt-toggle-btn', 'btn'));
  elements.set('theme-toggle-btn', new MockElement('theme-toggle-btn', 'btn'));
  elements.set('telemetry-ms', new MockElement('telemetry-ms'));
  elements.set('dash-telemetry', new MockElement('dash-telemetry'));
  elements.set('index-view', new MockElement('index-view'));
  elements.set('stage-view', new MockElement('stage-view'));
  elements.set('stage-mount', new MockElement('stage-mount'));
  elements.set('stage-title', new MockElement('stage-title'));
  elements.set('stage-stats', new MockElement('stage-stats'));
  elements.set('stage-actions', new MockElement('stage-actions'));
  elements.set('stage-kbd-hint', new MockElement('stage-kbd-hint'));

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
}

afterEach(() => {
  if (currentApp && currentApp.activeModuleInstance && typeof currentApp.activeModuleInstance.destroy === 'function') {
    currentApp.activeModuleInstance.destroy();
    currentApp.activeModuleInstance = null;
  }
});

test('CRT toggle: applies scanlines-on to #handheld-screen instead of body', () => {
  resetEnv();
  currentApp = new App();

  // Initial setup: default is CRT on
  currentApp.setupCrt();

  const screen = elements.get('handheld-screen');
  const crtBtn = elements.get('crt-toggle-btn');

  assert.strictEqual(screen.classList.contains('scanlines-on'), true, '#handheld-screen should have .scanlines-on initially');
  assert.strictEqual(mockDocument.body.classList.contains('scanlines-on'), false, 'body should NOT have .scanlines-on');
  assert.strictEqual(crtBtn.textContent, 'CRT: ON');

  // Toggle OFF
  crtBtn.click();
  assert.strictEqual(screen.classList.contains('scanlines-on'), false, '#handheld-screen should not have .scanlines-on after toggle off');
  assert.strictEqual(mockLocalStorage.getItem('zenith_crt'), 'false', 'zenith_crt localStorage should be "false"');
  assert.strictEqual(crtBtn.textContent, 'CRT: OFF');

  // Toggle ON again
  crtBtn.click();
  assert.strictEqual(screen.classList.contains('scanlines-on'), true, '#handheld-screen should have .scanlines-on after toggle on');
  assert.strictEqual(mockLocalStorage.getItem('zenith_crt'), 'true', 'zenith_crt localStorage should be "true"');
  assert.strictEqual(crtBtn.textContent, 'CRT: ON');
});

test('Theme toggle: applies data-theme to both documentElement and #handheld-chassis', () => {
  resetEnv();
  currentApp = new App();

  currentApp.setupTheme();

  const chassis = elements.get('handheld-chassis');
  const themeBtn = elements.get('theme-toggle-btn');

  assert.strictEqual(mockDocument.documentElement.getAttribute('data-theme'), 'arcade');
  assert.strictEqual(chassis.getAttribute('data-theme'), 'arcade', '#handheld-chassis must have data-theme synced');

  // Click theme button to advance to next theme (gameboy)
  themeBtn.click();

  assert.strictEqual(mockDocument.documentElement.getAttribute('data-theme'), 'gameboy');
  assert.strictEqual(chassis.getAttribute('data-theme'), 'gameboy', '#handheld-chassis must reflect new theme "gameboy"');
});

test('switchView wide layout detection: solitaire adds .layout-wide', () => {
  resetEnv();
  currentApp = new App();
  const chassis = elements.get('handheld-chassis');

  currentApp.switchView('stage', 'solitaire');

  assert.strictEqual(
    chassis.classList.contains('layout-wide'),
    true,
    '#handheld-chassis must have .layout-wide when active module is solitaire'
  );
});

test('switchView wide layout detection: minesweeper adds .layout-wide', () => {
  resetEnv();
  currentApp = new App();
  const chassis = elements.get('handheld-chassis');

  currentApp.switchView('stage', 'minesweeper');

  assert.strictEqual(
    chassis.classList.contains('layout-wide'),
    true,
    '#handheld-chassis must have .layout-wide when active module is minesweeper'
  );
});

test('switchView wide layout detection: tetris removes .layout-wide', () => {
  resetEnv();
  currentApp = new App();
  const chassis = elements.get('handheld-chassis');

  // Put into wide layout first
  currentApp.switchView('stage', 'solitaire');
  assert.strictEqual(chassis.classList.contains('layout-wide'), true);

  // Switch to tetris
  currentApp.switchView('stage', 'tetris');

  assert.strictEqual(
    chassis.classList.contains('layout-wide'),
    false,
    '#handheld-chassis must NOT have .layout-wide when active module is tetris'
  );
});

test('switchView wide layout detection: index view removes .layout-wide', () => {
  resetEnv();
  currentApp = new App();
  const chassis = elements.get('handheld-chassis');

  currentApp.switchView('stage', 'solitaire');
  assert.strictEqual(chassis.classList.contains('layout-wide'), true);

  currentApp.switchView('index');
  assert.strictEqual(
    chassis.classList.contains('layout-wide'),
    false,
    '#handheld-chassis must NOT have .layout-wide when returning to index'
  );
});

test('Handheld controls: clicking .dpad-up dispatches ArrowUp KeyboardEvent on window', async () => {
  resetEnv();
  currentApp = new App();
  currentApp.setupHandheldControls();

  const eventsDispatched = [];
  mockWindow.addEventListener('keydown', (ev) => {
    eventsDispatched.push({ type: 'keydown', key: ev.key, code: ev.code });
  });
  mockWindow.addEventListener('keyup', (ev) => {
    eventsDispatched.push({ type: 'keyup', key: ev.key, code: ev.code });
  });

  const dpadUp = elements.get('dpad-up');
  dpadUp.click();

  // Immediate check: keydown dispatched synchronously
  assert.strictEqual(eventsDispatched.length, 1, 'keydown should be dispatched immediately on click');
  assert.strictEqual(eventsDispatched[0].type, 'keydown');
  assert.strictEqual(eventsDispatched[0].key, 'ArrowUp');
  assert.strictEqual(eventsDispatched[0].code, 'ArrowUp');

  // SFX click sound triggered
  assert.strictEqual(sfxCalls.includes(0), true, 'audioController.playSfx(0) should be called');

  // Wait 80ms for keyup event (timer set to 60ms)
  await new Promise(resolve => setTimeout(resolve, 80));

  assert.strictEqual(eventsDispatched.length, 2, 'keyup should be dispatched after ~60ms');
  assert.strictEqual(eventsDispatched[1].type, 'keyup');
  assert.strictEqual(eventsDispatched[1].key, 'ArrowUp');
  assert.strictEqual(eventsDispatched[1].code, 'ArrowUp');
});

test('Handheld controls: action button A dispatches key "x" and code "KeyX"', async () => {
  resetEnv();
  currentApp = new App();
  currentApp.setupHandheldControls();

  const eventsDispatched = [];
  mockWindow.addEventListener('keydown', (ev) => {
    eventsDispatched.push({ type: 'keydown', key: ev.key, code: ev.code });
  });

  const btnA = elements.get('btn-a');
  btnA.click();

  assert.strictEqual(eventsDispatched.length, 1);
  assert.strictEqual(eventsDispatched[0].key, 'x');
  assert.strictEqual(eventsDispatched[0].code, 'KeyX');
});

test('Polish verification: modules.css focus rings and layout-wide min-width', () => {
  const cssPath = path.resolve(__dirname, '../styles/modules.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // 1. Accessible focus rings
  assert.match(
    css,
    /\.dpad-btn:focus-visible,\s*\.pill-btn:focus-visible,\s*\.action-btn:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-accent\);[^}]*outline-offset:\s*2px;/s,
    'Focus rings for .dpad-btn, .pill-btn, .action-btn must be defined with outline and outline-offset'
  );

  // 2. layout-wide min-width / minmax safety
  assert.match(
    css,
    /\.handheld-chassis\.layout-wide\s+\.handheld-lens\s*\{[^}]*min-width:\s*0;/,
    '.layout-wide .handheld-lens must have min-width: 0 to prevent grid track blowout'
  );
  assert.match(
    css,
    /\.handheld-chassis\.layout-wide\s*\{[^}]*grid-template-columns:\s*110px\s+minmax\(0,\s*1fr\)\s+110px;/,
    '.layout-wide grid-template-columns must use minmax(0, 1fr) for middle track'
  );
});
