# Design Specification: Retro Game Cartridge Hub & Gameplay Previews

**Date:** 2026-11-15  
**Status:** Draft for Approval  
**Author:** Zenith Development Team & User  
**Target Branch:** `feat/retro-theme-and-game-consistency`

---

## 1. Problem Statement & User Intent

### The Problem
On the main selection screen (`#index-view`), the game cards currently display only a small text label for visual metadata (e.g. `> GRID: 9×9 [1..9]`). The user requested actual visual previews ("screenshots") of what each game looks like inside the selection screen cards, and chose **Option B: Retro Game Cartridge Box Art**.

### The Solution: Option B (Retro Cartridge Box Art)
Transform the game selection cards in `#index-grid` into authentic **90s Game Cartridges**:
1. **Physical Cartridge Casing:**
   - Sculpted plastic casing with top finger grip grooves (`|||`).
   - Authentic cartridge bevels and bottom connector notch.
   - Smooth hover micro-interaction: Cartridge slightly elevates (`translateY(-4px)`) with an arcade slot insertion shadow.
2. **Metallic Label Sticker:**
   - Glossy dark metallic label sticker with a shiny border.
   - Game Title, catalog badge (`ZENITH-01` .. `ZENITH-10`), and category chip.
   - **Mini-Gameplay Screenshot Window:** A high-fidelity, pure-CSS miniature representation of each game's live board.
3. **Action Footer:**
   - `[?] GUIDE` button opens the centered tutorial modal.
   - `INSERT [key] →` button launches the game into the handheld console chassis.

---

## 2. Miniature Gameplay Previews (All 10 Modules)

Each module's preview is constructed with lightweight, semantic CSS without external images:

1. **01 SUDOKU (`ZENITH-01`)**:
   - 9×9 grid with 3×3 bold block borders, given numbers in crisp mono font, and one active cell highlighted with accent color.
2. **02 WORDLE (`ZENITH-02`)**:
   - 3 rows of 5-letter tiles:
     - Row 1: `S` (yellow/present), `L` (dark/absent), `A` (green/correct), `T` (dark), `E` (green).
     - Row 2: `S·H·A·R·E` (all 5 green tiles).
     - Row 3: 5 empty bordered tile slots.
3. **03 2048 (`ZENITH-03`)**:
   - 4×4 grid with colored tile badges: `2`, `4`, `16`, `128`, `2048` (golden glow).
4. **04 TETRIS (`ZENITH-04`)**:
   - 10×11 matrix with a falling neon T-piece, blue I-bar, and stacked colored tetrominoes at the base.
5. **05 MINESWEEPER (`ZENITH-05`)**:
   - 8×6 grid with revealed cells (`1`, `2`, `3`), two retro red flag SVGs, and 3D unrevealed tiles.
6. **06 SCRATCHPAD (`ZENITH-06`)**:
   - Mini split-pane editor preview showing `# ZENITH NOTE`, bullet points, and code pills.
7. **07 SOLITAIRE (`ZENITH-07`)**:
   - Mini Klondike card layout: Ace of Spades in foundation slot, and 3 cascading tableau columns (`K♠`, `Q♥`, `J♠`).
8. **08 CONNECT 4 (`ZENITH-08`)**:
   - 7×6 blue grid with circular cutouts showing dropped red & yellow chips forming a winning diagonal.
9. **09 TIC-TAC-TOE (`ZENITH-09`)**:
   - 3×3 grid with neon blue `X` and pink `O` marks, plus a diagonal glowing win line.
10. **10 AI STUDIO (`ZENITH-10`)**:
    - Vintage green CRT terminal with `$ ollama run llama3`, status line, and blinking block cursor.

---

## 3. Architecture & Code Changes

### 3.1 Files to Modify
- **`js/app.js` (`App.prototype.renderIndex`)**:
  - Replace the current plain card HTML template with the cartridge shell structure:
    - `.cartridge-top-grooves`
    - `.cartridge-sticker` (title, badge, preview window)
    - `.cartridge-actions-bar` (`[?] GUIDE`, `INSERT [key] →`)
  - Add helper function `getModulePreviewHtml(moduleId)` returning the tailored mini-screenshot HTML for each game.
- **`styles/main.css`**:
  - Add CSS classes for `.cartridge-card`, `.cartridge-sticker`, `.cartridge-preview-window`, and the mini-game CSS components (`.mini-tetris-board`, `.mini-wordle-board`, `.mini-ms-board`, `.mini-2048-board`, `.mini-sol-board`, etc.).
  - Ensure theme adaptations: Cartridge plastic adapts to active theme (`arcade`, `gameboy`, `nes`, `amber`) while keeping outer page background dark and readable.

### 3.2 Non-Goals
- No changes to Rust WASM engine or game rules.
- No external raster image files or npm dependencies.

---

## 4. Verification & Testing

1. **DOM Structure:**
   - Automated Node test (`tests/cartridge-hub.test.cjs`) verifying all 10 cards render valid cartridge geometry, label stickers, and preview boards.
2. **Interaction:**
   - Clicking a cartridge or `INSERT` button launches the module.
   - Clicking `[?] GUIDE` opens the centered tutorial modal.
   - Keyboard shortcut keys (`1-9`, `0`) launch their respective cartridge.
3. **Regression Testing:**
   - All 18 Rust tests (`cargo test`) pass.
   - All existing Node tests pass.
