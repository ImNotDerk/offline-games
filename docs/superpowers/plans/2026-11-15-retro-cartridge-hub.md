# Retro Game Cartridge Hub & Gameplay Previews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the game selection screen (`#index-grid`) into an authentic 90s retro game cartridge collection with sculpted plastic casings, metallic sticker labels, bottom PCB connector notch, and pure-CSS mini-gameplay screenshots for all 10 modules.

**Architecture:** Implement cartridge shell geometry, bottom connector notch, and mini-screenshot pixel-art styles in `styles/main.css`. Update `App.prototype.renderIndex()` in `js/app.js` to render the new cartridge markup with a helper `getModulePreviewHtml(moduleId)` generating tailored CSS board previews for each game. Wire launch and tutorial actions cleanly with retro audio feedback.

**Tech Stack:** Vanilla JavaScript (ES6+), Modern CSS3 (Grid, Flexbox, custom properties, gradients), Rust WASM engine.

**Spec:** [`docs/superpowers/specs/2026-11-15-retro-cartridge-hub-design.md`](file:///Users/derk/Documents/github-repositories/offline-games/docs/superpowers/specs/2026-11-15-retro-cartridge-hub-design.md)

## Global Constraints

- **Offline-First:** Zero external runtime dependencies, no CDN links, zero remote fonts or raster images. 100% portable via `file://` double-click.
- **Zero Rust Core Regressions:** All 18 existing Rust WASM unit tests must pass with 0 errors (`cargo test`).
- **Zero Raster Images:** All cartridge plastic bevels, grooves, bottom notches, stickers, and mini-screenshots must be rendered via pure CSS and SVG badges.
- **Testing Architecture:** Tests must run exclusively via Node's built-in `node:test` and `node:assert` modules without external npm packages. Run via `node --test tests/*.test.cjs`.
- **All 10 Modules Supported:** Every module (`sudoku`, `wordle`, `g2048`, `tetris`, `minesweeper`, `scratchpad`, `solitaire`, `connect4`, `tictactoe`, `aistudio`) must have a distinct, accurate mini-gameplay preview.

## Review Focus

1. **Pixel-Art Accuracy:** Mini-screenshots must faithfully represent actual gameplay (e.g. Wordle tiles with green/yellow/dark letters, Tetris matrix with tetrominoes, Minesweeper with number badges and flags).
2. **Cartridge Ergonomics:** Cards must retain easy-to-read titles, shortcut keys (`[1]`), category tags, and high score labels.
3. **Action & Audio Integrity:** Clicking a cartridge or `INSERT` button plays insertion chime (`playSfx(0)`) and launches the game into the handheld chassis; clicking `[?] GUIDE` opens the centered tutorial modal.
4. **Theme Responsiveness:** Cartridge casing plastic must adapt to the active theme palette (`arcade`, `gameboy`, `nes`, `amber`) while keeping outer page background dark and comfortable.
5. **Keyboard Quick-Launch:** Pressing top-row keys `1-9` and `0` on the index screen must launch the corresponding cartridge immediately.

---

### Task 1: Cartridge CSS Architecture & Mini-Screenshot Pixel Art

**Files:**
- Modify: `styles/main.css`
- Test: `tests/cartridge-css.test.cjs`

- [ ] **Step 1: Add Cartridge Shell, Bottom Notch & Sticker CSS in `styles/main.css`**
  Implement:
  - `.cartridge-card`: Molded plastic cartridge geometry with top rounded corners (10px), bottom corners (6px), 3px solid border, subtle bevel shadow, and hover elevation (`transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.8), 0 0 12px rgba(56, 189, 248, 0.25)`).
  - `.cartridge-card::after`: Bottom connector notch with gold PCB contact pins simulation.
  - `.cartridge-top-grooves`: 3 horizontal finger grip slots with inset shadow (`.cartridge-groove`).
  - `.cartridge-sticker`: Metallic/glossy dark label sticker with header (`.cartridge-sticker-title`, `.cartridge-sticker-badge`), preview window (`.cartridge-preview-window`), and category footer (`.cartridge-sticker-footer`).
  - `.cartridge-actions-bar`: Action buttons styled with tactile retro bevels (`.cart-btn-tut` and `.cart-btn-insert`).

- [ ] **Step 2: Add Mini-Screenshot CSS Pixel Art for All 10 Games**
  In `styles/main.css`:
  - `.mini-sudoku-board`: 9×9 grid with 3×3 bold dividers and active highlight.
  - `.mini-wordle-board`: 3 rows of 5 tiles with `.w-correct` (green), `.w-present` (yellow), `.w-absent` (dark).
  - `.mini-2048-board`: 4×4 grid with colored tile badges (`2`, `4`, `16`, `128`, `2048`).
  - `.mini-tetris-board`: 10×11 grid with neon falling T-piece and stacked tetrominoes (`.tet-i`, `.tet-o`, `.tet-t`, `.tet-s`, `.tet-z`).
  - `.mini-ms-board`: 8×6 grid with revealed cells (`.ms-1`, `.ms-2`, `.ms-3`), `.ms-flag` with red flag, and unrevealed 3D tiles.
  - `.mini-scratch-board`: Split editor preview with `# TITLE` and markdown bullet lines.
  - `.mini-sol-board`: 3 cascading card tableau stacks (`K♠`, `Q♥`, `J♠`) and Ace foundation slot.
  - `.mini-c4-board`: 7×6 blue grid with circular cutouts showing dropped red & yellow discs forming a winning diagonal.
  - `.mini-ttt-board`: 3×3 grid with neon blue `X`, pink `O`, and diagonal winning strike line.
  - `.mini-ai-board`: CRT green terminal text `$ ollama run llama3` with blinking cursor.

- [ ] **Step 3: Add Theme Variations for Cartridge Plastics**
  In `styles/main.css`:
  - `[data-theme="gameboy"] .cartridge-card`: Classic Game Boy DMG light olive-gray plastic with dark olive border.
  - `[data-theme="arcade"] .cartridge-card`: Deep midnight violet plastic with neon cyan border and magenta sticker badge.
  - `[data-theme="nes"] .cartridge-card`: Classic console two-tone gray plastic with red accent border.
  - `[data-theme="amber"] .cartridge-card`: Vintage dark amber/charcoal plastic with warm phosphor border.

- [ ] **Step 4: Automated test for Cartridge CSS**
  Write `tests/cartridge-css.test.cjs` using `node:test` and `node:assert`:
  - Verify `.cartridge-card`, `.cartridge-top-grooves`, `.cartridge-sticker`, and `.cartridge-preview-window` exist.
  - Verify bottom connector notch `.cartridge-card::after` exists.
  - Verify all 10 mini-board CSS classes exist.
  - Verify theme variations exist.
  Run: `node --test tests/cartridge-css.test.cjs`

- [ ] **Step 5: Commit**
  ```bash
  git add styles/main.css tests/cartridge-css.test.cjs
  git commit -m "style(hub): implement retro game cartridge casing and mini-screenshot pixel art"
  ```

---

### Task 2: Cartridge Template & Dynamic Previews in `js/app.js`

**Files:**
- Modify: `js/app.js`
- Test: `tests/cartridge-dom.test.cjs`

- [ ] **Step 1: Add `App.prototype.getModulePreviewHtml(moduleId)` in `js/app.js`**
  Implement the generator function returning the pure-CSS mini-screenshot HTML for each of the 10 modules:
  - `sudoku`: 9×9 grid markup
  - `wordle`: 3 rows of 5 tiles (`SLATE`, `SHARE`, empty)
  - `g2048`: 4×4 grid markup with numbers
  - `tetris`: 10×11 grid with falling piece
  - `minesweeper`: 8×6 grid with numbers and flags
  - `scratchpad`: Markdown editor simulation
  - `solitaire`: Cascading cards and foundation
  - `connect4`: 7×6 grid with winning diagonal
  - `tictactoe`: 3×3 grid with win line
  - `aistudio`: Terminal prompt simulation

- [ ] **Step 2: Update `App.prototype.renderIndex()` to Render Cartridge Cards**
  In `js/app.js`:
  Set `card.className = 'cartridge-card'; card.setAttribute('data-id', mod.id); card.setAttribute('data-key', mod.key);` and populate `card.innerHTML`:
  ```html
  <div class="cartridge-top-grooves">
    <div class="cartridge-groove"></div>
    <div class="cartridge-groove"></div>
    <div class="cartridge-groove"></div>
  </div>
  
  <div class="cartridge-sticker">
    <div class="cartridge-sticker-header">
      <h3 class="cartridge-sticker-title">${mod.title}</h3>
      <span class="cartridge-sticker-badge">ZENITH-${mod.num}</span>
    </div>
    
    <div class="cartridge-preview-window">
      ${this.getModulePreviewHtml(mod.id)}
    </div>

    <div class="cartridge-sticker-footer">
      <span class="cartridge-cat">${mod.cat}</span>
      ${scoreLabel}
    </div>
  </div>

  <div class="cartridge-actions-bar">
    <button class="cart-btn-tut" data-tut="${mod.id}" title="Read tutorial and strategy guide">[?] GUIDE</button>
    <button class="cart-btn-insert" data-launch="${mod.id}" title="Insert cartridge and play">INSERT [${mod.key}] &rarr;</button>
  </div>
  ```
  Wire click and keyboard events:
  - Clicking `[?] GUIDE` (`.cart-btn-tut`) calls `this.openTutorial(mod.id)`.
  - Clicking `INSERT` (`.cart-btn-insert`) or clicking anywhere on the cartridge plays `window.audioController.playSfx(0)` and calls `this.switchView('stage', mod.id)`.
  - Pressing `Enter` / `Space` on a focused cartridge plays `playSfx(0)` and launches the game.

- [ ] **Step 3: Automated test for Cartridge DOM & Interaction**
  Write `tests/cartridge-dom.test.cjs` using `node:test` and `node:assert`:
  - Verify `renderIndex()` generates 10 `.cartridge-card` elements in `#index-grid`.
  - Verify each card has `.cartridge-sticker`, `.cartridge-preview-window`, and its corresponding mini-screenshot.
  - Verify `data-id` and `data-key` are correctly assigned.
  - Verify clicking `INSERT` triggers `switchView('stage', mod.id)`.
  Run: `node --test tests/cartridge-dom.test.cjs`

- [ ] **Step 4: Commit**
  ```bash
  git add js/app.js tests/cartridge-dom.test.cjs
  git commit -m "feat(hub): render retro game cartridges with mini-gameplay screenshots"
  ```

---

### Task 3: Full System Verification & End-to-End Test

**Files:**
- Test all 10 cartridges and games
- Verify all test suites

- [ ] **Step 1: Run Rust unit tests**
  Run: `cargo test` (Ensure all 18 unit tests pass).

- [ ] **Step 2: Run all Node automated tests**
  Run: `node --test tests/*.test.cjs` (Ensure 100% pass rate across all suites).

- [ ] **Step 3: Verify in browser**
  Check that:
  - Selection hub renders 10 retro cartridges with active mini-screenshots.
  - Clicking `INSERT` plays insertion chime and launches into the handheld console cleanly.
  - Clicking `[?] GUIDE` opens the centered tutorial modal in the middle of the screen.
  - All 4 themes apply to cartridges cleanly.

- [ ] **Step 4: Final release commit**
  ```bash
  git commit -am "chore(release): complete retro game cartridge hub overhaul"
  ```
