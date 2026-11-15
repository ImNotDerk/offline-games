# Technical Design Document: Retro Theming & Game Consistency Suite

- **Date**: 2026-11-15
- **Status**: Complete & Approved by Reviewer (Updated with User Feedback)
- **Author**: Antigravity & User

---

## 1. Intent & Problem Statement

Zenith was originally designed as an ultra-minimalist, industrial "avionics/airplane cockpit" dashboard with stark monochrome colors, zero emojis, and cold telemetry metrics. While its zero-allocation Rust/WASM core and procedural 8-bit Web Audio DSP are technically impressive, the minimalist visual design feels sterile for an offline gaming collection.

Furthermore, several games suffer from mechanical defects and UX inconsistencies:
1. **Solitaire**: Players cannot move Kings to empty tableau columns due to event bubbling blockage on empty slot elements; victory lacks a celebratory modal overlay.
2. **Wordle**: The embedded dictionary contains only 150 words, rejecting common openers like `SLATE` and `ROAST` (which are explicitly recommended in the tutorial!).
3. **Connect 4 & Tic-Tac-Toe**: Lack game-over/victory overlay dialogs and replay prompts.
4. **Sudoku**: Errors trigger sound but provide zero visual feedback on the board. Furthermore, mistakes are hard-capped at 3 with no option for casual/practice play without an error limit.
5. **Minesweeper**: Displays raw ASCII `P` and `*` instead of retro sprites. Crucially, when a mine is detonated, an opaque overlay immediately pops up directly over the grid, completely blocking the player from inspecting where the other hidden bombs were and analyzing their mistake.
6. **2048**: Tutorial mentions an Undo key (`U`) that does not exist.
7. **Dead Code**: An orphaned 812-line stylesheet (`styles/games.css`) is unreferenced.

The goal is to overhaul Zenith into a vibrant, nostalgic, tactile retro gaming suite with 4 selectable retro themes, optional CRT scanlines, unified stage overlays, and seamless game mechanics across all 10 modules.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **4-Mode Retro Theme Engine**:
  - `Arcade Neon` (16-bit cyber cabinet: deep obsidian `#0a0a14`, neon magenta `#ff007f`, cyan `#00f5d4`, arcade yellow `#ffbe0b`).
  - `Game Boy DMG` (Authentic 4-shade LCD matrix: `#9bbc0f`, `#8bac0f`, `#306230`, `#0f380f`).
  - `NES 8-Bit` (Famicom charcoal `#202024`, crimson `#d90429`, cream `#fdf0d5`, pixel beveled borders).
  - `Amber CRT Phosphor` (Pitch black `#000000`, glowing amber `#ffb703`, phosphor orange `#fb8500`).
- **Tactile 3D Beveled Controls**: Physical button depression states (`transform: translateY(2px)`, inset/outset box-shadows, active sound cues).
- **Optional CRT Scanlines Overlay**: Toggleable via the top utility bar (`CRT: ON/OFF`), persisted in `localStorage`.
- **Unified Game Lifecycle & Overlays**: All games use a standardized, arcade-themed `StageOverlay` with fanfare audio, score breakdowns, and `[R] PLAY AGAIN` / `[ESC] INDEX` buttons.
- **Bug Fixes & Feature Polish**:
  - **Solitaire**: Fix King placement on empty tableau slots; add celebratory victory overlay.
  - **Wordle**: Expand dictionary to standard 5-letter English words (including tutorial starters like `SLATE`, `ROAST`) in pure Rust with binary search.
  - **2048**: Implement zero-allocation snapshot Undo in Rust WASM (`g2048_undo`), add `[U] UNDO` button and `U` shortcut.
  - **Sudoku**:
    - Add cell mistake flash/shake feedback.
    - Add a mistake limit toggle: `ERRORS: 3 MAX` vs `ERRORS: ∞ (UNLIMITED)` so players can play casually without an instant game-over kicking them out.
  - **Minesweeper**:
    - Upgrade ASCII markers to theme-adaptive retro pixel SVG icons for flags and mines.
    - **Board Inspection on Defeat**: Prevent an opaque modal from blocking the minefield when detonated. Instead, reveal all mines on the grid, highlight the triggered mine in red, mark false flags with an X, and display a non-blocking header/banner alert (`MINE DETONATED // [R] RESTART MATCH`) with a "REVIEW BOARD" / "DISMISS OVERLAY" toggle so players can freely examine the entire layout.
  - **Connect 4 & Tic-Tac-Toe**: Standardize end-of-game flows with modal overlays.
  - **Dead Code**: Remove orphaned `styles/games.css`.

### Non-Goals
- Rewriting DOM games into Canvas or WebGL (preserves DOM accessibility and responsive scaling).
- Adding online networking or server-side high score tracking.
- Adding large raster image assets (all assets remain inline SVG, CSS, or procedural Rust DSP audio).

### Anti-Goals
- Heavy CSS blurs or expensive `backdrop-filter` effects that drain laptop battery in offline/airplane mode.
- Obscuring the game board when the player wants to inspect post-match state.

---

## 3. Approaches Considered & Selected

### Approach 1: CSS-Driven Semantic Token Theming & Unified Stage Overlays (SELECTED)
- **Description**: Map all visual styling through CSS custom properties on `<html>[data-theme="..."]`. Standardize stage overlays through an `App`-level controller with non-blocking / review modes. Fix mechanics directly in Rust WASM and JS.
- **Pros**:
  - Preserves 54 KB WASM binary size and zero-allocation memory bridge.
  - Zero battery drain; 0.0% CPU at idle.
  - Clean separation of concerns.
- **Cons**: Requires updating CSS selectors across all 10 modules in `styles/modules.css`.

---

## 4. Detailed Architectural Specifications

### 4.1 Theme Palette Matrix
Theme definitions for `arcade`, `gameboy`, `nes`, and `amber` as detailed in Section 4.1.

### 4.2 Top Bar Carousel & CRT Scanlines
Top bar cycling button `THEME: ...` across the 4 retro themes, plus `CRT: ON/OFF` toggle with persistent `localStorage`.

### 4.3 Tactile Beveled Button Architecture
All buttons receive 3D pixel beveled borders (`box-shadow: 2px 2px 0 var(--border-strong)`) with physical active depression states (`transform: translate(2px, 2px)`).

### 4.4 Solitaire Repair
1. Fix empty tableau slot click target resolution so Kings and stacks can be placed without event blockage.
2. Add celebratory victory overlay with score, time, and move summary.

### 4.5 Wordle Dictionary Expansion
1. In `src/wordle.rs`, expand the dictionary from 150 words to a sorted list of common 5-letter English words (~1,000 words), ensuring valid search words such as `SLATE`, `ROAST`, `CRANE`, `AUDIO`, `LIGHT`, `STARE`, `RAISE`, etc., pass binary search validation.
2. Run `cargo test` and `./build.sh` to update `wasm/zenith_core.wasm` and `js/wasm_inline.js`.

### 4.6 Unified Stage Overlay & Non-Blocking Review Mode
1. Add `App.prototype.showStageOverlay(title, subtitle, stats = [], onRestart, options = {})`.
2. Support `options.allowReview = true`: includes a `[EYE] REVIEW BOARD` button that collapses the modal into a compact top/bottom banner so players can inspect the final board state, with a `RE-OPEN OVERLAY` button to bring it back.

### 4.7 Sudoku Enhancements
1. **Cell Error Feedback**: When an incorrect number is entered, apply a temporary `.cell-error` class to the active cell for 400ms that flashes red and shakes.
2. **Mistake Limit Setting**:
   - Add a mode toggle button in actions: `[L] ERRORS: 3` / `[L] ERRORS: ∞`.
   - In `src/sudoku.rs`, add `pub unlimited_mistakes: bool` and export `sudoku_set_unlimited_mistakes(unlimited: bool)`.
   - When unlimited is enabled, mistakes still increment the counter for player scoring/stats, but `is_game_over` is never triggered.

### 4.8 Minesweeper Defeat & Post-Game Inspection
1. **Pixel SVG Badges**: Replace text `'P'` and `'*'` with theme-adaptive SVG icons for flags and mines.
2. **Board Visibility on Defeat**:
   - When a mine is triggered, reveal all mines on the board and mark the detonated mine with `.exploded`.
   - Do NOT immediately cover the board with an unyielding modal! Instead, display an arcade banner:
     `<div class="ms-banner detonated"><span>MINE DETONATED! [R] PLAY AGAIN</span> <button class="stage-btn" id="ms-retry-btn">RETRY</button></div>`
   - Players can freely study the entire board, count numbers, and see exactly where each bomb was buried without obstruction.

### 4.9 2048 Undo Feature
1. In `src/game2048.rs`, add an undo snapshot buffer:
   - `prev_board: u64`
   - `prev_score: u32`
   - `prev_moves: u32`
   - `can_undo: bool`
2. Implement `Game2048::undo(&mut self) -> bool` to restore the previous state and clear `can_undo`.
3. Export `g2048_undo() -> bool` in `src/lib.rs`.
4. In `js/app.js`, add `[U] UNDO` button in `Mod2048.mount()` actions and bind the `U` key in `keyHandler`.

---

## 5. Verification & Testing Plan

1. **Rust Core Tests**: Run `cargo test` to ensure all unit tests (2048 with Undo, Sudoku unlimited mistakes, Tetris, Minesweeper, Wordle, PRNG, DSP) pass.
2. **WASM Build Verification**: Run `./build.sh` and ensure binary compiles clean to `wasm/zenith_core.wasm` and updates `js/wasm_inline.js`.
3. **2048 Undo Verification**: Slide tiles, verify score increases, press `U` / click `[U] UNDO`, confirm board and score revert accurately.
4. **Sudoku Verification**:
   - Test entering wrong digits with 3 errors limit: verify game over at 3 mistakes.
   - Toggle to `ERRORS: ∞`: enter 4+ wrong digits, verify mistakes counter increments but game continues until solved.
5. **Minesweeper Verification**:
   - Click a mine: verify all bombs are revealed on the grid, the detonated mine is highlighted, and the entire grid remains 100% visible and unobstructed to inspect.
6. **Solitaire Verification**: Test moving a King to an empty tableau column; verify auto-complete and victory overlay trigger properly.
7. **Wordle Verification**: Test `SLATE`, `ROAST`, `CRANE`, `AUDIO`; verify they are recognized as valid words and evaluated correctly.
8. **Theme Switching Verification**: Test clicking `THEME: ...` across Arcade, Game Boy, NES, and Amber; confirm all 10 modules adapt colors properly.
9. **Offline Portability**: Confirm double-clicking `index.html` on `file://` protocol loads and plays without network access.
