const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const cssPath = path.resolve(__dirname, '../styles/main.css');
const css = fs.readFileSync(cssPath, 'utf8');

test('cartridge-css: cartridge casing geometry, bottom notch, and grooves are defined', () => {
  // 1. .cartridge-card shell geometry
  assert.match(
    css,
    /\.cartridge-card\s*\{[^}]+\}/,
    '.cartridge-card class must be defined in main.css'
  );

  const cardMatch = css.match(/\.cartridge-card\s*\{([^}]+)\}/);
  assert.ok(cardMatch, 'Could not extract .cartridge-card rule body');
  const cardBody = cardMatch[1];

  // Top rounded corners (10px) and bottom corners (6px)
  assert.match(
    cardBody,
    /border-top-left-radius:\s*10px;/,
    '.cartridge-card must have border-top-left-radius: 10px'
  );
  assert.match(
    cardBody,
    /border-top-right-radius:\s*10px;/,
    '.cartridge-card must have border-top-right-radius: 10px'
  );
  assert.match(
    cardBody,
    /border-bottom-left-radius:\s*6px;/,
    '.cartridge-card must have border-bottom-left-radius: 6px'
  );
  assert.match(
    cardBody,
    /border-bottom-right-radius:\s*6px;/,
    '.cartridge-card must have border-bottom-right-radius: 6px'
  );

  // 3px solid border
  assert.match(
    cardBody,
    /border:\s*3px\s+solid/,
    '.cartridge-card must have 3px solid border'
  );

  // Hover elevation and shadow
  const hoverMatch = css.match(/\.cartridge-card:hover\s*\{([^}]+)\}/);
  assert.ok(hoverMatch, '.cartridge-card:hover rule must exist');
  assert.match(
    hoverMatch[1],
    /transform:\s*translateY\(-4px\);/,
    '.cartridge-card:hover must elevate with translateY(-4px)'
  );
  assert.match(
    hoverMatch[1],
    /box-shadow:[^;]*0\s+12px\s+28px\s+rgba\(0,\s*0,\s*0,\s*0\.8\)/,
    '.cartridge-card:hover must have deep drop shadow'
  );
  assert.match(
    hoverMatch[1],
    /box-shadow:[^;]*0\s+0\s+12px\s+rgba\(56,\s*189,\s*248,\s*0\.25\)/,
    '.cartridge-card:hover must have subtle cyan glow'
  );

  // Focus visible navigation styling
  assert.match(
    css,
    /\.cartridge-card:focus-visible\s*\{/,
    '.cartridge-card:focus-visible must be defined for keyboard navigation'
  );

  // 2. .cartridge-card::after bottom connector notch with gold PCB pins
  const afterMatch = css.match(/\.cartridge-card::after\s*\{([^}]+)\}/);
  assert.ok(afterMatch, '.cartridge-card::after must be defined');
  const afterBody = afterMatch[1];

  assert.match(afterBody, /content:\s*["']["'];/, '::after must define content');
  assert.match(afterBody, /position:\s*absolute;/, '::after must have position: absolute');
  assert.match(afterBody, /repeating-linear-gradient/, '::after must simulate gold PCB contact pins via repeating-linear-gradient');

  // 3. .cartridge-top-grooves & .cartridge-groove
  assert.match(
    css,
    /\.cartridge-top-grooves\s*\{[^}]+\}/,
    '.cartridge-top-grooves container must be defined'
  );
  const grooveMatch = css.match(/\.cartridge-groove\s*\{([^}]+)\}/);
  assert.ok(grooveMatch, '.cartridge-groove must be defined');
  assert.match(
    grooveMatch[1],
    /box-shadow:[^;]*inset/,
    '.cartridge-groove must have inset shadow for tactile finger grip slot'
  );
});

test('cartridge-css: metallic sticker label, preview window, and action buttons are defined', () => {
  // .cartridge-sticker
  assert.match(
    css,
    /\.cartridge-sticker\s*\{[^}]+\}/,
    '.cartridge-sticker must be defined'
  );
  assert.match(
    css,
    /\.cartridge-sticker-title\s*\{[^}]+\}/,
    '.cartridge-sticker-title must be defined'
  );
  assert.match(
    css,
    /\.cartridge-sticker-badge\s*\{[^}]+\}/,
    '.cartridge-sticker-badge must be defined'
  );
  assert.match(
    css,
    /\.cartridge-sticker-footer\s*\{[^}]+\}/,
    '.cartridge-sticker-footer must be defined'
  );
  assert.match(
    css,
    /\.cartridge-cat\s*\{[^}]+\}/,
    '.cartridge-cat must be defined'
  );

  // .cartridge-preview-window
  const windowMatch = css.match(/\.cartridge-preview-window\s*\{([^}]+)\}/);
  assert.ok(windowMatch, '.cartridge-preview-window must be defined');
  assert.match(
    windowMatch[1],
    /overflow:\s*hidden;/,
    '.cartridge-preview-window must clip pixel art overflow'
  );

  // Action buttons
  assert.match(
    css,
    /\.cartridge-actions-bar\s*\{[^}]+\}/,
    '.cartridge-actions-bar must be defined'
  );
  assert.match(
    css,
    /\.cart-btn-tut\s*\{[^}]+\}/,
    '.cart-btn-tut must be defined'
  );
  assert.match(
    css,
    /\.cart-btn-insert\s*\{[^}]+\}/,
    '.cart-btn-insert must be defined'
  );
});

test('cartridge-css: all 10 mini-gameplay screenshot board classes are defined', () => {
  const boards = [
    { name: 'mini-sudoku-board', requiredChild: /\.s-active/ },
    { name: 'mini-wordle-board', requiredChild: /\.w-correct/ },
    { name: 'mini-2048-board', requiredChild: /\.tile-2048/ },
    { name: 'mini-tetris-board', requiredChild: /\.tet-t/ },
    { name: 'mini-ms-board', requiredChild: /\.ms-flag/ },
    { name: 'mini-scratch-board', requiredChild: /\.mini-scratch-h1/ },
    { name: 'mini-sol-board', requiredChild: /\.mini-sol-card/ },
    { name: 'mini-c4-board', requiredChild: /\.c4-red/ },
    { name: 'mini-ttt-board', requiredChild: /\.mini-ttt-strike/ },
    { name: 'mini-ai-board', requiredChild: /\.mini-ai-cursor/ }
  ];

  for (const board of boards) {
    const boardPattern = new RegExp(`\\.${board.name}\\s*\\{`);
    assert.match(
      css,
      boardPattern,
      `.${board.name} class must be defined in main.css`
    );

    assert.match(
      css,
      board.requiredChild,
      `Child class for ${board.name} matching ${board.requiredChild} must be defined`
    );
  }
});

test('cartridge-css: theme variations for cartridge plastic casings exist', () => {
  const themes = ['gameboy', 'arcade', 'nes', 'amber'];
  for (const theme of themes) {
    const themePattern = new RegExp(`\\[data-theme=["']${theme}["']\\]\\s+\\.cartridge-card\\s*\\{`);
    assert.match(
      css,
      themePattern,
      `[data-theme="${theme}"] .cartridge-card override must be defined`
    );
  }
});
