const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const cssPath = path.resolve(__dirname, '../styles/main.css');
const css = fs.readFileSync(cssPath, 'utf8');

test('outer-ui: scanlines overlay is removed from body/viewport', () => {
  // Verify body.scanlines-on::after or viewport-attached scanlines with position: fixed are gone
  assert.doesNotMatch(
    css,
    /body\.scanlines-on::after/,
    'body.scanlines-on::after selector must not exist'
  );
  assert.doesNotMatch(
    css,
    /\.scanlines-on::after\s*\{[^}]*position:\s*fixed/s,
    'Scanlines with position: fixed must not be attached to general .scanlines-on::after'
  );
  assert.doesNotMatch(
    css,
    /\.scanlines-on::after\s*\{[^}]*z-index:\s*9999/s,
    'Viewport-covering z-index: 9999 scanlines must not exist'
  );
});

test('outer-ui: handheld-screen scoped scanlines are defined properly', () => {
  assert.match(
    css,
    /\.handheld-screen\.scanlines-on::after\s*\{/,
    '.handheld-screen.scanlines-on::after must be defined'
  );

  const screenScanlinesMatch = css.match(/\.handheld-screen\.scanlines-on::after\s*\{([^}]+)\}/);
  assert.ok(screenScanlinesMatch, 'Could not find .handheld-screen.scanlines-on::after rule block');
  const ruleBody = screenScanlinesMatch[1];

  assert.match(ruleBody, /position:\s*absolute;/, 'screen scanlines must have position: absolute');
  assert.match(ruleBody, /inset:\s*0;/, 'screen scanlines must have inset: 0');
  assert.match(ruleBody, /pointer-events:\s*none;/, 'screen scanlines must have pointer-events: none');
  assert.match(ruleBody, /z-index:\s*50;/, 'screen scanlines must have z-index: 50');
  assert.match(ruleBody, /border-radius:\s*inherit;/, 'screen scanlines must have border-radius: inherit');
  assert.match(ruleBody, /repeating-linear-gradient/, 'screen scanlines must use repeating-linear-gradient');
});

test('outer-ui: restful dark-slate tokens on :root and body', () => {
  const rootBodyMatch = css.match(/:root\s*,\s*body\s*\{([^}]+)\}/);
  assert.ok(rootBodyMatch, 'Must define :root, body rule block');
  const tokens = rootBodyMatch[1];

  assert.match(tokens, /--color-bg-base:\s*#0b0f19;/, '--color-bg-base must be #0b0f19');
  assert.match(tokens, /--color-bg-surface:\s*#111827;/, '--color-bg-surface must be #111827');
  assert.match(tokens, /--color-bg-card:\s*#1f2937;/, '--color-bg-card must be #1f2937');
  assert.match(tokens, /--color-text-main:\s*#f8fafc;/, '--color-text-main must be #f8fafc');
  assert.match(tokens, /--color-text-muted:\s*#94a3b8;/, '--color-text-muted must be #94a3b8');
  assert.match(tokens, /--color-border:\s*#1e293b;/, '--color-border must be #1e293b');
  assert.match(tokens, /--color-border-strong:\s*#334155;/, '--color-border-strong must be #334155');
});

test('outer-ui: retro themes rescoped to handheld chassis and screen', () => {
  const themes = ['arcade', 'gameboy', 'nes', 'amber'];
  for (const theme of themes) {
    // Assert no unscoped global root theme rule exists like `[data-theme="gameboy"] {`
    const unscopedPattern = new RegExp(`(?<![\\w.-])\\[data-theme=["']${theme}["']\\]\\s*\\{`);
    assert.doesNotMatch(
      css,
      unscopedPattern,
      `[data-theme="${theme}"] must not be attached unscoped to root`
    );

    // Assert that handheld-chassis scoping exists for each theme
    const chassisPattern = new RegExp(`\\.handheld-chassis\\[data-theme=["']${theme}["']\\]`);
    assert.match(
      css,
      chassisPattern,
      `.handheld-chassis[data-theme="${theme}"] scoping must exist`
    );
  }
});
