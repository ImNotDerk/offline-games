# Retro Theming & Game Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul Zenith into a tactile 4-palette retro gaming suite (Arcade Neon, Game Boy DMG, NES 8-Bit, Amber CRT) with CRT scanlines, tactile 3D buttons, unified stage overlays, and seamless bug-fixed mechanics across all 10 offline games.

**Architecture:** Implement semantic CSS theme tokens and a lightweight CRT scanline layer in `styles/main.css`; unify match lifecycle and game-over dialogs via `App.prototype.showStageOverlay`; fix Solitaire empty tableau slot event delegation; expand Wordle's binary-search dictionary in Rust; add zero-allocation snapshot Undo to 2048; add optional Sudoku error limit removal; update Minesweeper with SVG pixel badges and non-blocking post-defeat board inspection.

**Tech Stack:** Pure Rust (wasm32-unknown-unknown), WebAssembly zero-copy memory bridge, Web Audio DSP, Vanilla JS (ES6+), Semantic HTML5, CSS Custom Properties.

**Spec:** [`docs/superpowers/specs/2026-11-15-retro-theme-and-game-consistency-design.md`](file:///Users/derk/Documents/github-repositories/offline-games/docs/superpowers/specs/2026-11-15-retro-theme-and-game-consistency-design.md)

## Global Constraints

- Zero runtime dependencies / external npm packages.
- Zero battery drain at idle (0.0% CPU when not processing input or active ticks).
- 100% offline functionality (must run via double-click on raw `file://` protocol using inline WASM fallback).
- WASM binary must stay compact ($< 60\text{ KB}$ release).
- Zero-copy linear memory access across the FFI boundary preserved.

## Review Focus

1. **Solitaire King Placement**: Placing a King onto an empty tableau column must reliably trigger from both mouse click and smart-move without event bubbling failure.
2. **Wordle Common Words**: Standard openers (`SLATE`, `ROAST`, `CRANE`, `AUDIO`, `RAISE`, `STARE`) must pass binary search without "INVALID WORD" rejection.
3. **Minesweeper Defeat Visibility**: Detonating a mine must reveal all mines on the grid while leaving the entire minefield 100% visible and inspectable.
4. **Sudoku Error Limit Toggle**: When `ERRORS: ∞` is active, mistakes must increment past 3 without triggering game over.
5. **2048 Undo Consistency**: Pressing `U` or clicking `[U] UNDO` must restore the exact previous board bitboard, score, and move counter without memory leaks.

---

### Task 1: Rust Core Engine Upgrades (2048 Undo, Sudoku Unlimited Errors, Wordle Dictionary Expansion) & WASM Build

**Files:**
- Modify: `src/game2048.rs`
- Modify: `src/sudoku.rs`
- Modify: `src/wordle.rs`
- Modify: `src/lib.rs`
- Modify: `js/bridge.js`
- Generate: `wasm/zenith_core.wasm`
- Generate: `js/wasm_inline.js`

**Interfaces:**
- Produces in WASM FFI:
  - `g2048_undo() -> bool`
  - `sudoku_set_unlimited_mistakes(unlimited: bool)`
  - `wordle_is_valid(c0: u8, c1: u8, c2: u8, c3: u8, c4: u8) -> bool` (expanded vocabulary)

- [x] **Step 1: Write failing Rust unit tests for 2048 Undo, Sudoku unlimited errors, and Wordle expanded dictionary**

In `src/game2048.rs`:
```rust
#[test]
fn test_2048_undo() {
    let mut game = Game2048::new(42);
    let initial_board = game.board;
    let initial_score = game.score;
    // Force a move
    if game.move_dir(0) || game.move_dir(1) || game.move_dir(2) || game.move_dir(3) {
        assert!(game.undo());
        assert_eq!(game.board, initial_board);
        assert_eq!(game.score, initial_score);
        assert!(!game.undo()); // Second undo without move should fail
    }
}
```

In `src/sudoku.rs`:
```rust
#[test]
fn test_sudoku_unlimited_mistakes() {
    let mut sdk = Sudoku::new(42);
    sdk.generate(0, 42);
    sdk.unlimited_mistakes = true;
    sdk.mistakes = 2;
    // Enter wrong digit
    let wrong = if sdk.solution[0] == 1 { 2 } else { 1 };
    let ok = sdk.enter_number(0, 0, wrong);
    assert!(!ok);
    assert_eq!(sdk.mistakes, 3);
    assert!(!sdk.is_game_over); // Should NOT be game over when unlimited is active
}
```

In `src/wordle.rs`:
```rust
#[test]
fn test_wordle_expanded_common_words() {
    assert!(Wordle::is_valid_word(b"SLATE"));
    assert!(Wordle::is_valid_word(b"ROAST"));
    assert!(Wordle::is_valid_word(b"AUDIO"));
    assert!(Wordle::is_valid_word(b"CRANE"));
    assert!(Wordle::is_valid_word(b"LIGHT"));
}
```

- [x] **Step 2: Run `cargo test` to verify tests fail**

Run: `cargo test`
Expected: Failures (unknown method `undo`, missing `unlimited_mistakes`, words not in dictionary).

- [x] **Step 3: Implement 2048 Undo in `src/game2048.rs`**

Add snapshot fields `prev_board: u64`, `prev_score: u32`, `prev_moves: u32`, `can_undo: bool`.
Before applying any valid move in `move_dir()`, record `self.prev_board = self.board`, `self.prev_score = self.score`, `self.prev_moves = self.moves`, `self.can_undo = true`.
Implement `pub fn undo(&mut self) -> bool`:
If `!self.can_undo`, return `false`. Revert `self.board = self.prev_board`, `self.score = self.prev_score`, `self.moves = self.prev_moves`, `self.can_undo = false`, `self.game_over = false`, `self.won = false`, return `true`.

- [x] **Step 4: Implement Sudoku Unlimited Mistakes in `src/sudoku.rs`**

Add `pub unlimited_mistakes: bool` to `Sudoku`. In `enter_number()`, update mistake handling:
```rust
self.mistakes += 1;
if !self.unlimited_mistakes && self.mistakes >= 3 {
    self.is_game_over = true;
}
```
Add `pub fn set_unlimited_mistakes(&mut self, unlimited: bool) { self.unlimited_mistakes = unlimited; }`.

- [x] **Step 5: Expand Wordle Dictionary in `src/wordle.rs`**

Expand `DICTIONARY` from 150 words to a sorted list of common 5-letter English words (sorted alphabetically to maintain $O(\log N)$ binary search). Ensure `SLATE`, `ROAST`, `AUDIO`, `CRANE`, `LIGHT`, `STARE`, `RAISE` are included.

- [x] **Step 6: Export C-ABI functions in `src/lib.rs`**

Export:
```rust
#[no_mangle]
pub extern "C" fn g2048_undo() -> bool {
    unsafe { G2048.undo() }
}

#[no_mangle]
pub extern "C" fn sudoku_set_unlimited_mistakes(unlimited: bool) {
    unsafe { SUDOKU.set_unlimited_mistakes(unlimited) };
}
```

- [x] **Step 7: Run `cargo test` to verify all tests pass**

Run: `cargo test`
Expected: PASS (all tests ok).

- [x] **Step 8: Recompile WASM and generate base64 fallback**

Run: `./build.sh`
Expected: `wasm/zenith_core.wasm` compiled cleanly and `js/wasm_inline.js` generated.

- [x] **Step 9: Commit**

```bash
git add src/game2048.rs src/sudoku.rs src/wordle.rs src/lib.rs wasm/zenith_core.wasm js/wasm_inline.js
git commit -m "feat(core): add 2048 undo, sudoku unlimited errors, and expanded wordle dictionary"
```

---

### Task 2: Dead Code Cleanup & Global Retro Theming Engine

**Files:**
- Delete: `styles/games.css`
- Modify: `index.html`
- Modify: `styles/main.css`
- Modify: `js/app.js`

**Interfaces:**
- Consumes: CSS custom properties on `<html>`
- Produces: `[data-theme="arcade|gameboy|nes|amber"]`, `body.scanlines-on`, 3D button classes

- [x] **Step 1: Delete orphaned `styles/games.css`**

Run: `rm -f styles/games.css`

- [x] **Step 2: Add theme definitions and CRT scanline overlay in `styles/main.css`**

Implement CSS custom property matrices for:
- `[data-theme="arcade"]` (Deep obsidian, neon magenta, cyan, arcade yellow)
- `[data-theme="gameboy"]` (4-shade olive green `#9bbc0f`, `#8bac0f`, `#306230`, `#0f380f`)
- `[data-theme="nes"]` (Famicom charcoal `#202024`, crimson `#d90429`, cream `#fdf0d5`)
- `[data-theme="amber"]` (Black `#050505`, amber `#ffb703`, phosphor `#fb8500`)

Add `.scanlines-on::after` scanline overlay with pointer-events none.
Add tactile 3D beveled button styles (`.stage-btn`, `.btn-ctrl`, `.keypad-digit-btn`, `.filter-chip`).

- [x] **Step 3: Update `index.html` top utility bar controls**

Replace old theme toggle with:
```html
<button id="theme-toggle-btn" class="top-btn" title="Cycle Retro Themes (Arcade / Game Boy / NES / Amber)">THEME: ARCADE</button>
<button id="crt-toggle-btn" class="top-btn" title="Toggle CRT Scanline Overlay">CRT: ON</button>
```

- [x] **Step 4: Update Theme & CRT event handlers in `js/app.js`**

In `App.prototype.setupTheme()`:
Support carousel cycling: `arcade` → `gameboy` → `nes` → `amber` → `arcade`.
Save preference to `localStorage.getItem('zenith_retro_theme')`.
Add `App.prototype.setupCrt()` to toggle `body.classList.toggle('scanlines-on')` and persist in `localStorage.getItem('zenith_crt')`.

- [x] **Step 5: Verify theme cycling and scanlines in browser**

Test clicking `THEME: ...` button: verify attributes update to `arcade`, `gameboy`, `nes`, `amber`.
Test clicking `CRT: ...` button: verify `scanlines-on` class toggles.

- [x] **Step 6: Commit**

```bash
git add styles/main.css index.html js/app.js
git rm styles/games.css
git commit -m "feat(ui): add 4-mode retro theme carousel, crt scanlines, and tactile 3d buttons"
```

---

### Task 3: Unified Retro Stage Overlay Architecture

**Files:**
- Modify: `styles/main.css`
- Modify: `styles/modules.css`
- Modify: `js/app.js`

**Interfaces:**
- Produces: `App.prototype.showStageOverlay(title, subtitle, stats, onRestart, options)`

- [x] **Step 1: Write CSS for `.stage-overlay` and `.retro-box` in `styles/main.css`**

Add retro arcade popup styling:
- Deep beveled 3-pixel border with theme accent glow.
- Arcade header tag `★ MATCH FINISHED ★` or custom status.
- Stats summary chips in high-contrast grid.
- Arcade action buttons `[R] PLAY AGAIN` and `[ESC] RETURN TO HUB`.
- Support non-blocking / review banner mode (`.stage-overlay.banner-mode`).

- [x] **Step 2: Implement `App.prototype.showStageOverlay` in `js/app.js`**

Implement standardized overlay method accepting `title`, `subtitle`, `stats`, `onRestart`, and `options = { allowReview: false }`.
When `allowReview` is true, include a `[EYE] REVIEW BOARD` button that hides the modal box and displays a slim floating bar with `RE-OPEN OVERLAY`, allowing full board inspection.
Trigger chiptune victory/game-over sound effect on display.

- [x] **Step 3: Verify overlay rendering**

Call `app.showStageOverlay('TEST VICTORY', 'Stage cleared', [{label: 'SCORE', val: '100'}], () => {})` in console and verify visual appearance, keybinds, and dismissal.

- [x] **Step 4: Commit**

```bash
git add styles/main.css styles/modules.css js/app.js
git commit -m "feat(ui): implement unified retro stage overlay with review board mode"
```

---

### Task 4: Solitaire Mechanics Repair & Victory Overlay

**Files:**
- Modify: `js/app.js` (`ModSolitaire`)
- Modify: `styles/modules.css`

**Interfaces:**
- Consumes: `App.prototype.showStageOverlay`

- [x] **Step 1: Fix empty tableau column click delegation in `ModSolitaire`**

In `ModSolitaire.prototype.render()`:
Ensure empty columns render:
```javascript
<div class="sol-column sol-empty-col" data-tableau="${colIdx}">
  <div class="sol-slot sol-empty-slot" data-tableau="${colIdx}">K</div>
</div>
```
In `ModSolitaire.prototype.handleClick(el)`:
Resolve `tableauIdx`:
```javascript
const tableauIdx = el.getAttribute('data-tableau') !== null
  ? parseInt(el.getAttribute('data-tableau'), 10)
  : (el.closest('[data-tableau]') ? parseInt(el.closest('[data-tableau]').getAttribute('data-tableau'), 10) : null);
```

- [x] **Step 2: Add Victory Stage Overlay to Solitaire**

In `ModSolitaire.prototype.checkWin()`:
When all foundations reach 13:
```javascript
this.app.showStageOverlay(
  'SOLITAIRE VICTORY',
  'All 4 foundations completed!',
  [
    { label: 'SCORE', val: this.score },
    { label: 'MOVES', val: this.moves },
    { label: 'TIME', val: document.getElementById('sol-timer')?.textContent || '00:00' }
  ],
  () => this.initGame()
);
```

- [x] **Step 3: Add retro playing card styles in `styles/modules.css`**

Add crisp pixel styling for cards, suits (`♣`, `♦`, `♥`, `♠`), red/black high-contrast colors, and selected card elevation.

- [x] **Step 4: Verify Solitaire King placement & auto-complete**

Test clicking a King and clicking an empty tableau slot: confirm King moves cleanly.
Test clearing cards to foundations: confirm victory overlay appears.

- [x] **Step 5: Commit**

```bash
git add js/app.js styles/modules.css
git commit -m "fix(solitaire): resolve empty tableau king placement bug and add victory overlay"
```

---

### Task 5: Sudoku & Minesweeper Visual Polish & Non-Blocking Defeat Inspection

**Files:**
- Modify: `js/app.js` (`ModSudoku`, `ModMinesweeper`)
- Modify: `styles/modules.css`

**Interfaces:**
- Consumes: `sudoku_set_unlimited_mistakes` from WASM bridge

- [x] **Step 1: Add Error Limit Toggle & Visual Shake Feedback to Sudoku**

In `ModSudoku.mount()`:
Add mistake limit toggle button:
`<button class="btn-ctrl" id="sdk-btn-errors">[L] ERRORS: 3</button>`
On click, toggle between `ERRORS: 3` and `ERRORS: ∞`. Call `window.wasmBridge.call('sudoku_set_unlimited_mistakes', this.unlimitedErrors)`.
When an incorrect number is entered in `inputNumber()`, add `.cell-error` class to the active cell for 400ms:
```css
@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.sudoku-cell.cell-error {
  background: #ef4444 !important;
  color: #fff !important;
  animation: error-shake 0.3s ease-in-out;
}
```

- [x] **Step 2: Update Sudoku victory/game over to use `showStageOverlay`**

Replace old inline overlay with `this.app.showStageOverlay('SUDOKU SOLVED', ...)`.

- [x] **Step 3: Update Minesweeper with SVG pixel badges & non-blocking defeat banner**

In `ModMinesweeper.prototype.sync()`:
Replace `'P'` and `'*'` with inline theme-colored SVGs for retro flags and mines.
When detonated (`state === 3`):
- Reveal all mines across the grid.
- Mark the clicked mine with `.exploded` (red flashing border).
- **Do NOT cover the grid with an opaque overlay!**
- Instead, mount a retro defeat alert banner above/below the grid:
  ```html
  <div class="ms-banner detonated">
    <span>★ MINE DETONATED! REVIEW FIELD OR PRESS [R] TO RETRY ★</span>
    <button class="stage-btn btn-primary" id="ms-retry-btn">[R] RETRY</button>
  </div>
  ```
- Wire `[R] RETRY` button and key to `this.resetGame()`.

- [x] **Step 4: Verify Sudoku unlimited mistakes and Minesweeper board inspection**

Test Sudoku: enter 4+ wrong numbers in unlimited mode, verify no game-over kick.
Test Minesweeper: click a mine, verify all bombs reveal, the board is completely visible and unobscured, and retry works.

- [x] **Step 5: Commit**

```bash
git add js/app.js styles/modules.css
git commit -m "feat(sudoku,minesweeper): add sudoku error toggle and minesweeper unblocked defeat inspection"
```

---

### Task 6: 2048 Undo, Connect 4 & Tic-Tac-Toe Controls & Overlays Integration

**Files:**
- Modify: `js/app.js` (`Mod2048`, `ModConnect4`, `ModTicTacToe`)
- Modify: `styles/modules.css`

**Interfaces:**
- Consumes: `g2048_undo` from WASM bridge, `App.prototype.showStageOverlay`

- [x] **Step 1: Wire 2048 Undo in `Mod2048`**

In `Mod2048.mount()`:
Add `<button class="btn-ctrl" id="g2048-btn-undo">[U] UNDO</button>`.
In `keyHandler`: bind `'u'` / `'U'` to call `window.wasmBridge.call('g2048_undo')`, play SFX 2, and sync.
Update `sync()` to use `this.app.showStageOverlay('GAME OVER', ...)`.

- [x] **Step 2: Add Stage Overlays to Connect 4 & Tic-Tac-Toe**

In `ModConnect4`:
In `handleWin(winner)` and `handleDraw()`: call `this.app.showStageOverlay(winner === 1 ? 'VICTORY' : 'DEFEAT', ...)`.
In `ModTicTacToe`:
In `handleWin(winner)` and `handleDraw()`: call `this.app.showStageOverlay(winner === 'X' ? 'VICTORY' : 'DEFEAT', ...)`.

- [x] **Step 3: Update Tic-Tac-Toe Keyboard Controls for Laptops**

Support standard top row number keys `1-9` (`1` = A1, `2` = B1, `3` = C1, `4` = A2, etc.) as well as desktop Numpad.

- [x] **Step 4: Verify 2048 undo, Connect 4, and Tic-Tac-Toe match completions**

Test sliding in 2048 and pressing `U`: board returns to previous state.
Test winning Connect 4 and Tic-Tac-Toe: verify stage overlays appear with `[R] PLAY AGAIN`.

- [x] **Step 5: Commit**

```bash
git add js/app.js styles/modules.css
git commit -m "feat(games): wire 2048 undo, connect 4/tic-tac-toe stage overlays, and laptop controls"
```

---

### Task 7: Full System Verification, Offline Double-Click Portability & End-to-End Test

**Files:**
- Test all games across `index.html`

- [x] **Step 1: Run Rust unit tests**

Run: `cargo test`
Expected: 16+ tests passing with 0 errors.

- [x] **Step 2: Run WASM build verification**

Run: `./build.sh`
Expected: Build passes, binary is under 60 KB, and `js/wasm_inline.js` is fresh.

- [x] **Step 3: End-to-end theme & gameplay verification**

Verify:
- All 4 themes cycle smoothly and apply to all 10 modules.
- CRT scanlines toggle and persist across page reload.
- Solitaire King placement and victory overlay.
- Wordle starter words (`SLATE`, `ROAST`).
- Sudoku error toggle and mistake flash.
- Minesweeper defeat board inspection.
- 2048 undo button & key.
- Connect 4 & Tic-Tac-Toe victory overlays.
- Offline `file://` double-click portability.

- [x] **Step 4: Final commit**

```bash
git commit -am "chore(release): complete retro themer and consistency overhaul"
```
