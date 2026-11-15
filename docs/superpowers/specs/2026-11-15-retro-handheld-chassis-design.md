# Design Specification: Retro Handheld Chassis & Eye-Friendly UI Architecture

**Date:** 2026-11-15  
**Status:** Draft for Approval  
**Author:** Zenith Development Team & User  
**Target Branch:** `feat/retro-theme-and-game-consistency`

---

## 1. Problem Statement & User Intent

### The Problem
During hands-on testing, the global retro theme and CRT scanlines caused notable visual discomfort and eye fatigue:
1. **Full-Viewport Scanlines:** An overlay of repeating horizontal scanlines was drawn across the entire browser viewport (`body.scanlines-on::after`), vibrating over text, navigation buttons, telemetry, and cards.
2. **Aggressive Outer Palette Shifts:** Recoloring the whole page (including search boxes, navigation menus, and system stats) in high-saturation monochromatic tones (such as all-amber or all-olive-green) reduces legibility and strains the eyes during prolonged use.

### The Solution: Option C (Retro Handheld Console Housing)
The user selected **Option C**:
- **Outer Application UI:** Becomes a clean, restful, high-contrast, modern dark gaming station (deep slate/charcoal tones, crisp typography, zero flicker, zero scanlines).
- **Game Stage Only:** Encased in an authentic **Retro Handheld Console Chassis** (inspired by the classic Game Boy DMG & portable consoles).
- **Contained CRT / LCD Effects:** Scanlines, screen vignettes, and retro color palettes apply **strictly inside the handheld console screen**, turning each game into a playable retro handheld experience without compromising workspace ergonomics.

---

## 2. Architecture & Visual Components

### 2.1 Clean Outer Application Shell
- **Full-Viewport Scanlines Removed:** Delete `body.scanlines-on::after`. Scanlines are no longer rendered globally.
- **Restful Outer UI Tokens:**
  - Background: Deep slate/charcoal (`#0b0f19` / `#0f172a`).
  - Text: Crisp, high-readability off-white (`#f8fafc`) and muted slate (`#94a3b8`).
  - Borders: Subtle neutral charcoal (`#1e293b`).
  - Top Bar & Navigation: Unflickering, modern, tactile navigation buttons.
- **Top Bar Controls Persistence:**
  - `THEME` button cycles the handheld console's aesthetic (Game Boy DMG, Arcade Neon, NES, Amber Phosphor).
  - `CRT` button toggles scanlines strictly on the handheld's inner screen glass.

---

### 2.2 Retro Handheld Chassis (`.handheld-chassis`)
Inside `#stage-view`, `#stage-mount` is wrapped in a dedicated retro handheld console shell:

```
+-------------------------------------------------------------+
|                        STAGE NAV                            |
|  [ESC] INDEX           MODULE TITLE           [STATS / ACT] |
+-------------------------------------------------------------+
|                                                             |
|   .handheld-chassis                                         |
|   +-----------------------------------------------------+   |
|   |  .handheld-bezel-top                                |   |
|   |    [BATTERY LED]   DOT MATRIX WITH STEREO SOUND     |   |
|   |  +-----------------------------------------------+  |   |
|   |  |  .handheld-screen (holds #stage-mount)        |  |   |
|   |  |  [Active Game: Solitaire / Sudoku / 2048 ...] |  |   |
|   |  |  (Optional Scanlines + LCD/CRT Vignette)      |  |   |
|   |  +-----------------------------------------------+  |   |
|   |  .handheld-brand: "ZENITH PORTABLE"                 |   |
|   |  +-----------------------------------------------+  |   |
|   |  |  .handheld-deck (Controls Silhouettes)         |  |   |
|   |  |   [D-PAD]       [SELECT] [START]     [B] [A]  |  |   |
|   |  |                                  /// SPEAKER  |  |   |
|   |  +-----------------------------------------------+  |   |
|   +-----------------------------------------------------+   |
|                                                             |
+-------------------------------------------------------------+
```

#### Detailed Chassis Elements:
1. **Outer Shell (`.handheld-chassis`):**
   - Styled with classic handheld console geometry: rounded top corners (18px), ergonomic angled lower corner (32px), subtle matte texture, and drop shadow.
   - Theme-responsive chassis coloring:
     - *Game Boy / Default:* Classic warm gray-offwhite or slate DMG casing.
     - *Arcade:* Deep midnight violet casing with neon cyan trim.
     - *NES:* Classic 8-bit two-tone console gray casing with dark gray stripe.
     - *Amber:* Vintage warm dark-amber/charcoal casing.
2. **Display Lens (`.handheld-lens`):**
   - Dark-tinted acrylic lens border around the screen.
   - Classic dual accent pinstripes (magenta / royal blue).
   - `BATTERY` indicator with a realistic red glowing LED pip that subtly pulses.
   - Embossed vintage banner: `"DOT MATRIX WITH STEREO SOUND"`.
3. **Inner Game Screen (`.handheld-screen`):**
   - Recessed display frame with subtle inner shadow/glass reflection.
   - Houses the existing `#stage-mount` containing the active game.
   - When CRT mode is ON: `.handheld-screen.scanlines-on::after` adds scanlines *only* over the game screen.
4. **Lower Control Deck (`.handheld-deck`):**
   - Molded directional pad (D-Pad) with tactile center pivot.
   - Angled A and B round action buttons (magenta/burgundy) with physical 3D bevels.
   - Slanted rubber `SELECT` and `START` pill moldings.
   - Diagonal speaker grille slits etched into the lower-right corner.
   - Interactive bonus: clicking the on-screen A/B/D-pad buttons can trigger keyboard events for games or trigger tactile micro-animations!

---

### 2.3 Adaptive Sizing for Wide Games
- **Standard Mode (Square/Portrait Games):** Tetris, 2048, Tic-Tac-Toe, Wordle, Snake, Pong fit the classic Game Boy aspect ratio naturally (~480px–640px wide).
- **Wide Mode (Landscape Games):** Games with wide layouts (Solitaire's 7 tableau columns, Minesweeper 16x16 / 30x16 grids) automatically expand the handheld chassis into a **"Handheld Advance"** horizontal layout:
  - `.handheld-chassis.layout-wide`: Screen expands up to 900px wide, moving the D-Pad to the left flank and A/B buttons to the right flank, mirroring classic landscape handhelds (like the GBA / Game Gear).
  - Ensures Solitaire and Minesweeper never feel cramped.

---

## 3. Scope & Non-Goals

### Goals
- Eliminate all eye strain caused by full-viewport scanlines and aggressive monochromatic navigation bars.
- Retain the clean, crisp, comfortable navigation, search, and hub view.
- Deliver an authentic, charming retro handheld experience strictly inside the game stage.
- Maintain zero runtime dependencies, zero external assets, pure CSS/HTML/JS, and full offline `file://` compatibility.

### Non-Goals
- We are not changing the core Rust WASM game engines or game rules (all 18 unit tests remain identical).
- We are not replacing or removing any of the 10 games.

---

## 4. Verification & Testing Plan

1. **Visual Ergonomics:**
   - Verify top bar, search, dashboard, and hub cards have crisp, clear typography with no scanlines or visual noise.
   - Verify `CRT: ON/OFF` toggles scanlines strictly inside `.handheld-screen`.
2. **Theme Switching:**
   - Cycle all 4 themes (`Arcade`, `Game Boy`, `NES`, `Amber`). Verify the outer UI maintains comfortable readability while the handheld chassis and screen graphics adapt to the selected theme.
3. **All 10 Games in Handheld Chassis:**
   - Verify all games render seamlessly within the handheld screen (Solitaire wide tableau, Minesweeper grid, Sudoku, 2048, Tetris, etc.).
   - Verify Stage Overlays (Victory, Game Over, Review Board) fit cleanly inside or over the handheld display.
4. **Offline Portability:**
   - Verify double-click launch on `file://` remains 100% functional with zero network requests.
