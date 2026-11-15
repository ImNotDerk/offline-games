# Retro Handheld Chassis & Eye-Friendly UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the game viewport into an authentic Retro Handheld Console Housing (Option C) while eliminating eye fatigue by keeping all outer navigation, headers, and telemetry clean, crisp, and 100% scanline-free.

**Architecture:** Remove full-viewport scanlines from `document.body` and confine all CRT/LCD effects, scanlines, and retro colorways strictly inside a new `.handheld-chassis` container surrounding `#stage-mount`. Provide an adaptive horizontal "Handheld Advance" layout for wide games (Solitaire, Minesweeper) and interactive clickable D-Pad/action buttons on the chassis.

**Tech Stack:** Vanilla JavaScript (ES6+), Modern CSS3 (Grid, Flexbox, custom properties, gradients), Rust WASM engine.

**Spec:** [`docs/superpowers/specs/2026-11-15-retro-handheld-chassis-design.md`](file:///Users/derk/Documents/github-repositories/offline-games/docs/superpowers/specs/2026-11-15-retro-handheld-chassis-design.md)

## Global Constraints

- **Offline-First:** Zero external runtime dependencies, no CDN links, zero remote fonts or stylesheets. 100% portable via `file://` double-click.
- **Zero Rust Core Regressions:** All 18 existing Rust WASM unit tests must pass with 0 errors (`cargo test`).
- **Zero Viewport Scanlines:** No fixed or full-screen scanline overlays on `body` or outer navigation.
- **Pure CSS Geometry:** All handheld casing, lens, D-pad, and buttons rendered via pure CSS styling without raster images.
- **Testing Architecture:** Tests must run exclusively via Node's built-in `node:test` and `node:assert` modules without external npm packages or `jsdom`. Run via `node --test tests/*.test.cjs` or `node tests/<name>.test.cjs`.
- **Module Agnostic:** All 10 existing modules (`sudoku`, `wordle`, `g2048`, `tetris`, `minesweeper`, `scratchpad`, `solitaire`, `connect4`, `tictactoe`, `aistudio`) must mount and play cleanly inside the handheld screen without UI clipping.

## Review Focus

1. **Outer UI Contrast & Scanline Elimination:** Outer navigation, search, dashboard, and hub cards must remain 100% scanline-free and high-contrast in all 4 theme modes.
2. **Wide Module Adaptability:** Solitaire's 7 tableau columns and Minesweeper's 16x16 / 30x16 grids must not overflow or become cramped inside the handheld screen.
3. **CRT Scanlines Confined to Screen:** Toggling CRT mode via top bar (`#crt-toggle-btn`) or `C` key must apply scanlines only to `.handheld-screen`.
4. **Interactive Handheld Controls:** Clicking on-screen D-pad and A/B buttons must dispatch standard KeyboardEvents (`new KeyboardEvent('keydown', { key, code, bubbles: true })`) to the active game without interfering with normal physical keyboard play.
5. **Stage Overlay Alignment:** Victory, Defeat, and Review Board overlays must fit seamlessly within the handheld display frame.

---

### Task 1: Outer UI De-escalation & Clean Eye-Friendly Styling

**Files:**
- Modify: `styles/main.css`
- Test: `tests/outer-ui.test.cjs`

**Interfaces:**
- Removes: `body.scanlines-on::after`
- Preserves: Root theme CSS custom properties for handheld scoping

- [x] **Step 1: Remove full-viewport scanline overlay from `styles/main.css`**
  Delete lines 131-145 in `styles/main.css` where `.scanlines-on::after` is pinned to `position: fixed; inset: 0; z-index: 9999;`.
  Replace with scoped screen scanlines:
  ```css
  .handheld-screen.scanlines-on::after {
    content: " ";
    display: block;
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 2px,
      rgba(0, 0, 0, 0.28) 2px,
      rgba(0, 0, 0, 0.28) 4px
    );
    z-index: 50;
    border-radius: inherit;
  }
  ```

- [x] **Step 2: Restructure outer app theme tokens for high readability**
  In `styles/main.css`:
  Lock outer UI colors (`:root, body`) to clean, comfortable, dark-slate tokens:
  ```css
  :root, body {
    --color-bg-base: #0b0f19;
    --color-bg-surface: #111827;
    --color-bg-card: #1f2937;
    --color-text-main: #f8fafc;
    --color-text-muted: #94a3b8;
    --color-border: #1e293b;
    --color-border-strong: #334155;
  }
  ```
  Rescope the aggressive high-saturation retro themes (`[data-theme="gameboy"]`, `[data-theme="amber"]`, `[data-theme="arcade"]`, `[data-theme="nes"]`) to target `.handheld-chassis[data-theme="..."]` and its descendant screens, preventing theme toggles from turning the outer navigation, search input, and index cards bright olive green or neon amber.

- [x] **Step 3: Automated test for outer UI styling**
  Write `tests/outer-ui.test.cjs` using built-in `node:test` and `node:assert`:
  - Assert that `styles/main.css` does not contain `position: fixed` or `inset: 0` attached to `body.scanlines-on::after`.
  - Assert that `.handheld-screen.scanlines-on::after` is defined with `pointer-events: none;`.
  - Assert that outer UI variables on `:root` or `body` maintain high-contrast dark-slate values.
  Run: `node --test tests/outer-ui.test.cjs`

- [x] **Step 4: Commit**
  ```bash
  git add styles/main.css tests/outer-ui.test.cjs
  git commit -m "style(ui): confine scanlines to screen and restore restful outer ui palette"
  ```

---

### Task 2: Retro Handheld Chassis DOM & CSS Architecture

**Files:**
- Modify: `index.html`
- Modify: `styles/modules.css`
- Modify: `styles/main.css`
- Test: `tests/handheld-dom.test.cjs`

- [x] **Step 1: Wrap `#stage-mount` in Handheld Chassis DOM in `index.html`**
  In `#stage-view`:
  Wrap `#stage-mount` with:
  ```html
  <div class="handheld-chassis" id="handheld-chassis">
    <!-- Handheld Lens & Display Frame -->
    <div class="handheld-lens">
      <div class="handheld-lens-header">
        <div class="handheld-battery">
          <span class="battery-led" id="battery-led"></span>
          <span class="battery-label">BATTERY</span>
        </div>
        <div class="lens-title">DOT MATRIX WITH STEREO SOUND</div>
      </div>
      
      <!-- Inner Game Screen Viewport -->
      <div class="handheld-screen" id="handheld-screen">
        <div id="stage-mount" class="stage-mount">
          <!-- Active Game UI rendered here -->
        </div>
      </div>
    </div>

    <!-- Handheld Lower Control Deck -->
    <div class="handheld-deck" id="handheld-deck">
      <div class="deck-dpad" id="deck-dpad" role="group" aria-label="Handheld D-Pad">
        <button class="dpad-btn dpad-up" data-key="ArrowUp" data-code="ArrowUp" aria-label="Up"></button>
        <button class="dpad-btn dpad-left" data-key="ArrowLeft" data-code="ArrowLeft" aria-label="Left"></button>
        <div class="dpad-center"></div>
        <button class="dpad-btn dpad-right" data-key="ArrowRight" data-code="ArrowRight" aria-label="Right"></button>
        <button class="dpad-btn dpad-down" data-key="ArrowDown" data-code="ArrowDown" aria-label="Down"></button>
      </div>

      <div class="deck-meta">
        <div class="handheld-brand">ZENITH PORTABLE</div>
        <div class="deck-options">
          <button class="pill-btn" id="deck-select" data-key="Shift" data-code="ShiftLeft" aria-label="Select">SELECT</button>
          <button class="pill-btn" id="deck-start" data-key="Enter" data-code="Enter" aria-label="Start">START</button>
        </div>
      </div>

      <div class="deck-actions">
        <div class="action-buttons">
          <button class="action-btn btn-b" data-key="z" data-code="KeyZ" aria-label="B Button">B</button>
          <button class="action-btn btn-a" data-key="x" data-code="KeyX" aria-label="A Button">A</button>
        </div>
        <div class="speaker-grille">
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </div>
  ```

- [x] **Step 2: Add Handheld Chassis & Adaptive Wide Layout CSS in `styles/modules.css`**
  Implement:
  - Authentic handheld shell geometry: rounded top corners (16px), angled bottom-right corner (32px), subtle matte chassis gradient, drop shadow.
  - Dark-tinted lens border with dual magenta/cyan pinstripes and pulsing red `BATTERY` LED.
  - Recessed screen bezel with inner shadow vignette.
  - Reset `.stage-mount` inner border and background inside `.handheld-screen` (`border: none; background: transparent; padding: 0.5rem;`) so the active game sits flush inside the lens.
  - Physical 3D molded D-pad, angled A/B round buttons, slanted rubber pills, and diagonal speaker slits.
  - `.handheld-chassis.layout-wide`:
    - Screen expands horizontally up to 940px.
    - Control deck shifts to horizontal flanks (D-pad on left flank, A/B on right flank) for wide games like Solitaire and Minesweeper.

- [x] **Step 3: Automated test for Handheld DOM & CSS classes**
  Write `tests/handheld-dom.test.cjs` using `node:test` and `node:assert`:
  - Read `index.html` and verify `#handheld-chassis`, `.handheld-lens`, `#handheld-screen`, `.deck-dpad`, and `.action-buttons` exist.
  - Read `styles/modules.css` and verify `.handheld-chassis`, `.layout-wide`, and `.stage-mount` resets are present.
  Run: `node --test tests/handheld-dom.test.cjs`

- [x] **Step 4: Commit**
  ```bash
  git add index.html styles/modules.css styles/main.css tests/handheld-dom.test.cjs
  git commit -m "feat(ui): implement retro handheld chassis with adaptive wide layout"
  ```

---

### Task 3: Chassis Controller & Game-Stage Integration

**Files:**
- Modify: `js/app.js`
- Test: `tests/chassis-controller.test.cjs`

- [x] **Step 1: Update CRT toggle and theme application in `js/app.js`**
  In `App.prototype.setupCrt()`:
  - Target `#handheld-screen` (and fall back gracefully if not yet loaded) instead of `document.body` for the `.scanlines-on` class.
  - Keep `localStorage.getItem('zenith_crt')` persistence.
  In `App.prototype.setupTheme()`:
  - Apply the active theme attribute `data-theme` to `#handheld-chassis` (and keep `document.documentElement` synced for CSS tokens without overriding outer UI tokens).

- [x] **Step 2: Add automatic wide layout detection in `switchView()`**
  In `App.prototype.switchView(viewName, moduleId = null)`:
  - When switching to `'stage'`, check `moduleId`.
  - If `moduleId === 'solitaire' || moduleId === 'minesweeper'`, add `.layout-wide` to `#handheld-chassis`.
  - Otherwise, remove `.layout-wide` from `#handheld-chassis` to present standard handheld portrait mode.

- [x] **Step 3: Add `setupHandheldControls()` in `js/app.js`**
  In `App.prototype.setupHandheldControls()` (called from `App.prototype.init()`):
  - Add click listeners to `.deck-dpad button`, `.action-buttons button`, and `.deck-options button`.
  - Extract `data-key` and `data-code` from the clicked button.
  - Dispatch a standard `KeyboardEvent`:
    ```javascript
    const evDown = new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true });
    window.dispatchEvent(evDown);
    setTimeout(() => {
      const evUp = new KeyboardEvent('keyup', { key, code, bubbles: true, cancelable: true });
      window.dispatchEvent(evUp);
    }, 60);
    ```
  - Play subtle mechanical click SFX (`window.audioController.playSfx(0)`).

- [x] **Step 4: Automated test for Chassis Controller**
  Write `tests/chassis-controller.test.cjs` using `node:test` and `node:assert`:
  - Test CRT toggle adds `.scanlines-on` to `#handheld-screen`.
  - Test `switchView('stage', 'solitaire')` adds `.layout-wide`.
  - Test `switchView('stage', 'tetris')` removes `.layout-wide`.
  - Test clicking `.dpad-up` dispatches `ArrowUp` KeyboardEvent on `window`.
  Run: `node --test tests/chassis-controller.test.cjs`

- [x] **Step 5: Commit**
  ```bash
  git add js/app.js tests/chassis-controller.test.cjs
  git commit -m "feat(ui): wire handheld chassis controller, wide layout detection, and dpad inputs"
  ```

---

### Task 4: Full System Verification & End-to-End Test

**Files:**
- Test all 10 modules inside the handheld chassis: `sudoku`, `wordle`, `g2048`, `tetris`, `minesweeper`, `scratchpad`, `solitaire`, `connect4`, `tictactoe`, `aistudio`.
- Clean up test files if necessary.

- [x] **Step 1: Run Rust unit tests**
  Run: `cargo test` (Ensure all 18 unit tests pass).

- [x] **Step 2: Run all Node automated tests**
  Run: `node --test tests/*.test.cjs` (Ensure 100% pass rate).

- [x] **Step 3: Verify all 10 modules in browser**
  Check that:
  - All 10 modules (`sudoku`, `wordle`, `g2048`, `tetris`, `minesweeper`, `scratchpad`, `solitaire`, `connect4`, `tictactoe`, `aistudio`) render without clipping.
  - Stage victory/defeat overlays fit nicely over the handheld screen.
  - Solitaire King placement, Minesweeper unblocked inspection, Sudoku error toggle, and 2048 undo all function seamlessly inside the handheld.
  - Outer UI navigation and search are clean, restful, and scanline-free.

- [x] **Step 4: Final release commit**
  ```bash
  git commit -am "chore(release): complete retro handheld chassis overhaul"
  ```
