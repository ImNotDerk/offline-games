const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const htmlPath = path.resolve(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const modulesCssPath = path.resolve(__dirname, '../styles/modules.css');
const modulesCss = fs.readFileSync(modulesCssPath, 'utf8');

test('handheld-dom: required handheld chassis structure in index.html', () => {
  // 1. Chassis container
  assert.match(
    html,
    /<div[^>]*class="[^"]*handheld-chassis[^"]*"[^>]*id="handheld-chassis"/,
    '#handheld-chassis container must exist'
  );

  // 2. Lens and header
  assert.match(
    html,
    /<div[^>]*class="[^"]*handheld-lens[^"]*"/,
    '.handheld-lens must exist'
  );
  assert.match(
    html,
    /<span[^>]*(id="battery-led"[^>]*class="[^"]*battery-led[^"]*"|class="[^"]*battery-led[^"]*"[^>]*id="battery-led")[^>]*>/,
    '#battery-led must exist with battery-led class'
  );
  assert.match(
    html,
    /BATTERY/,
    'BATTERY label text must exist in lens header'
  );
  assert.match(
    html,
    /DOT MATRIX WITH STEREO SOUND/,
    'DOT MATRIX WITH STEREO SOUND title must exist in lens header'
  );

  // 3. Screen wrapping stage-mount
  assert.match(
    html,
    /<div[^>]*class="[^"]*handheld-screen[^"]*"[^>]*id="handheld-screen"[^>]*>[\s\S]*?<div[^>]*id="stage-mount"[^>]*class="[^"]*stage-mount[^"]*"/,
    '#handheld-screen must wrap #stage-mount'
  );

  // 4. Lower deck and D-pad
  assert.match(
    html,
    /<div[^>]*class="[^"]*handheld-deck[^"]*"[^>]*id="handheld-deck"/,
    '#handheld-deck must exist'
  );
  assert.match(
    html,
    /<div[^>]*class="[^"]*deck-dpad[^"]*"[^>]*id="deck-dpad"/,
    '.deck-dpad must exist'
  );

  // 5. D-pad buttons with proper data-key and data-code
  assert.match(
    html,
    /<button[^>]*class="[^"]*dpad-btn dpad-up[^"]*"[^>]*data-key="ArrowUp"[^>]*data-code="ArrowUp"/,
    'dpad-up button must have data-key="ArrowUp" and data-code="ArrowUp"'
  );
  assert.match(
    html,
    /<button[^>]*class="[^"]*dpad-btn dpad-left[^"]*"[^>]*data-key="ArrowLeft"[^>]*data-code="ArrowLeft"/,
    'dpad-left button must have data-key="ArrowLeft" and data-code="ArrowLeft"'
  );
  assert.match(
    html,
    /<button[^>]*class="[^"]*dpad-btn dpad-right[^"]*"[^>]*data-key="ArrowRight"[^>]*data-code="ArrowRight"/,
    'dpad-right button must have data-key="ArrowRight" and data-code="ArrowRight"'
  );
  assert.match(
    html,
    /<button[^>]*class="[^"]*dpad-btn dpad-down[^"]*"[^>]*data-key="ArrowDown"[^>]*data-code="ArrowDown"/,
    'dpad-down button must have data-key="ArrowDown" and data-code="ArrowDown"'
  );

  // 6. Deck meta (brand and options)
  assert.match(
    html,
    /ZENITH PORTABLE/,
    'ZENITH PORTABLE brand label must exist'
  );
  assert.match(
    html,
    /<button[^>]*id="deck-select"[^>]*data-key="Shift"[^>]*data-code="ShiftLeft"[^>]*>SELECT<\/button>/,
    'deck-select pill button must exist with Shift key mapping'
  );
  assert.match(
    html,
    /<button[^>]*id="deck-start"[^>]*data-key="Enter"[^>]*data-code="Enter"[^>]*>START<\/button>/,
    'deck-start pill button must exist with Enter key mapping'
  );

  // 7. Actions (buttons and speaker grille)
  assert.match(
    html,
    /<div[^>]*class="[^"]*action-buttons[^"]*"/,
    '.action-buttons container must exist'
  );
  assert.match(
    html,
    /<button[^>]*class="[^"]*action-btn btn-b[^"]*"[^>]*data-key="z"[^>]*data-code="KeyZ"[^>]*>B<\/button>/,
    'btn-b action button must exist with KeyZ mapping'
  );
  assert.match(
    html,
    /<button[^>]*class="[^"]*action-btn btn-a[^"]*"[^>]*data-key="x"[^>]*data-code="KeyX"[^>]*>A<\/button>/,
    'btn-a action button must exist with KeyX mapping'
  );
  assert.match(
    html,
    /<div[^>]*class="[^"]*speaker-grille[^"]*"/,
    '.speaker-grille must exist'
  );
});

test('handheld-css: chassis shell geometry, lens, and screen styling', () => {
  // .handheld-chassis definition
  assert.match(
    modulesCss,
    /\.handheld-chassis\s*\{/,
    '.handheld-chassis must be styled'
  );

  const chassisBlock = modulesCss.match(/\.handheld-chassis\s*\{([^}]+)\}/);
  assert.ok(chassisBlock, 'Could not extract .handheld-chassis rule body');
  const chassisBody = chassisBlock[1];

  assert.match(chassisBody, /border-radius:\s*16px\s+16px\s+32px\s+16px;/, 'chassis must have rounded top (16px) and angled corner (32px)');
  assert.match(chassisBody, /box-shadow:/, 'chassis must have drop shadow');

  // .stage-mount reset inside .handheld-screen
  assert.match(
    modulesCss,
    /\.handheld-screen\s+\.stage-mount\s*\{[^}]*border:\s*none;[^}]*background:\s*transparent;[^}]*padding:\s*0\.5rem;/,
    '.handheld-screen .stage-mount must reset border, background, and padding to 0.5rem'
  );

  // .handheld-screen recessed vignette
  assert.match(
    modulesCss,
    /\.handheld-screen\s*\{[^}]*box-shadow:\s*inset\s+0\s+3px\s+8px/,
    '.handheld-screen must have recessed inner shadow'
  );

  // battery-led animation
  assert.match(
    modulesCss,
    /@keyframes\s+battery-pulse/,
    '@keyframes battery-pulse must be defined'
  );
});

test('handheld-css: adaptive wide layout (.layout-wide) horizontally expands screen up to 940px', () => {
  assert.match(
    modulesCss,
    /\.handheld-chassis\.layout-wide\s*\{/,
    '.handheld-chassis.layout-wide selector must exist'
  );

  // Screen expands horizontally up to 940px
  assert.match(
    modulesCss,
    /\.handheld-chassis\.layout-wide\s+\.handheld-lens\s*\{[^}]*max-width:\s*940px;/,
    '.layout-wide .handheld-lens must allow expanding up to 940px'
  );

  // Flank layout: D-pad on left, deck-actions on right
  assert.match(
    modulesCss,
    /\.handheld-chassis\.layout-wide\s+\.deck-dpad\s*\{[^}]*grid-column:\s*1;/,
    '.layout-wide must place .deck-dpad in left flank (column 1)'
  );
  assert.match(
    modulesCss,
    /\.handheld-chassis\.layout-wide\s+\.deck-actions\s*\{[^}]*grid-column:\s*3;/,
    '.layout-wide must place .deck-actions in right flank (column 3)'
  );
});

test('handheld-css: responsive theme overrides for handheld chassis', () => {
  const themes = ['gameboy', 'arcade', 'nes', 'amber'];
  for (const theme of themes) {
    const pattern = new RegExp(`\\.handheld-chassis\\[data-theme=["']${theme}["']\\]`);
    assert.match(
      modulesCss,
      pattern,
      `Handheld chassis must support data-theme="${theme}"`
    );
  }
});
