# ⚡ Zenith Offline Arcade & Studio

A 100% offline-ready collection of games, focus tools, and audio synthesis built specifically for your Mac. When your Wi-Fi drops or you're traveling, this hub keeps you entertained and productive with **zero internet connection required**.

---

## 🚀 How to Launch Anytime (Offline)

### Option 1: Double-Click (Zero Setup)
Simply double-click [`index.html`](file:///Users/derk/Documents/github-repositories/offline-games/index.html) in Finder or run in your terminal:
```bash
open index.html
```
It will open instantly in Safari, Chrome, or your default browser.

### Option 2: Mac Desktop Shortcut
You can drag `index.html` to your **macOS Dock** or your **Desktop** for 1-click access whenever you lose internet!

### Option 3: Local Server (Optional)
If you prefer running a local port:
```bash
python3 -m http.server 8080
```
Then navigate to `http://localhost:8080`.

---

## 🎮 Included Games & Tools

| Title | Category | Features |
| :--- | :--- | :--- |
| **Sudoku Deluxe** | Puzzles & Casual | Generates infinite unique 9×9 boards with Notes mode, smart hints, conflict checks, and difficulty levels. |
| **Wordle Offline** | Puzzles & Casual | Offline 5-letter word game with 6 tries, color clues (🟩 🟨 ⬛), virtual & physical keyboard, and streak tracking. |
| **Klondike Solitaire** | Puzzles & Casual | Classic 52-card solitaire with smart click auto-move, foundation auto-send, undo, and auto-complete. |
| **Tetra Blocks** | Puzzles & Casual | Classic 10x20 Tetris with ghost piece projection, piece holding (`C`), wall kicks, and instant restart (`Space`/`Enter`/`R`). |
| **2048 Deluxe** | Puzzles & Casual | Smooth tile slide & merge animations, high score saving, undo button, and instant restart (`R`). |
| **Minesweeper** | Puzzles & Casual | Easy, Medium, and Hard boards. 100% guaranteed safe first-click, chord revealing, flag mode, and quick restart (`R`). |
| **Snake Retro Deluxe** | Action & Arcade | Cyber serpent with neon grid visuals, bonus golden orbs, combo particles, and one-tap restart (`Space`/`Enter`/`R`). |
| **Cosmic Voyage** | Action & Arcade | Deep space retro shooter: dodge asteroids, blast alien drone swarms, collect shields, and upgrade blasters with quick restart. |
| **Zen Soundscape** | Offline Tools | Procedural ambient audio synthesizer: Gentle Rain, Ocean Surf, White Noise, and 10Hz Alpha Focus tones. 0 MB audio downloads. |
| **Markdown Studio** | Offline Tools | Distraction-free Markdown editor with live preview, word/character/reading stats, auto-save, and export to `.md` or `.txt`. |
| **Retro Guide** | Emulation | In-depth guide for running OpenEmu, RetroArch, and open-source games on macOS. |

---

## 💻 Is this too heavy for a 16GB Mac?

**Short answer: Absolutely not!** A 16GB Mac is a powerhouse. Here is a breakdown of memory usage:

1. **Zenith Offline Hub**: Uses only **~50–80 MB** of RAM and **0% CPU** at idle. It runs directly inside your browser engine.
2. **Kiwix (Offline Wikipedia / StackOverflow)**: Kiwix only uses **~70 MB** of RAM. It reads compressed `.zim` archives directly from your SSD on-demand, without loading the whole encyclopedia into memory.
3. **Local AI (Ollama)**: Running lightweight 3B models (like `llama3.2:3b` or `qwen2.5:3b`) uses **~2.8 GB** of unified memory. On a 16GB Mac, that leaves over **13 GB** completely untouched!
4. **OpenEmu (Retro Consoles)**: Emulating GBA, SNES, Genesis, or PS1 uses only **~120–250 MB** of RAM.

---

## 🛠️ Recommended Offline Apps to Pair with Zenith

If you want an even bigger offline software suite on your Mac, here are the best free tools you can install:

### 1. Kiwix (Offline Wikipedia & Docs)
Allows you to download the entire Wikipedia (with or without images), Project Gutenberg books, or Wikivoyage travel guides to read completely offline.
```bash
brew install --cask kiwix
```

### 2. OpenEmu (Retro Console Emulation)
The best retro console frontend for Mac. Drag and drop Game Boy Advance, SNES, or Genesis ROMs to play with keyboard or controller.
```bash
brew install --cask openemu
```

### 3. Ollama (Offline Local AI Chatbot)
Have an AI assistant ready to chat, brainstorm, and answer questions even with airplane mode on:
```bash
brew install ollama
ollama run llama3.2:3b
```

### 4. Open-Source Offline Games
- **OpenTTD** (Deep transport tycoon simulation): `brew install --cask openttd`
- **SuperTuxKart** (3D arcade kart racer): `brew install --cask supertuxkart`
- **0 A.D.** (Historical RTS like Age of Empires): `brew install --cask 0-ad`
