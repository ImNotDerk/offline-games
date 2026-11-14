/**
 * Zenith Offline Arcade & Studio - App Orchestrator
 */

const GAMES_CATALOG = [
  {
    id: 'tetris',
    title: 'Tetra Blocks',
    icon: '🧱',
    category: 'puzzle',
    tag: 'Classic',
    desc: 'The timeless tetromino block-stacking puzzle with ghost drop and hold piece.',
    className: 'TetrisGame'
  },
  {
    id: 'game2048',
    title: '2048 Deluxe',
    icon: '🔢',
    category: 'puzzle',
    tag: 'Brain',
    desc: 'Slide matching number tiles together, merge them, and reach the elusive 2048 tile.',
    className: 'Game2048'
  },
  {
    id: 'snake',
    title: 'Snake Retro Deluxe',
    icon: '🐍',
    category: 'arcade',
    tag: 'Arcade',
    desc: 'Cyber serpent collecting energy orbs with glowing neon visuals and speed scaling.',
    className: 'SnakeGame'
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    icon: '💣',
    category: 'puzzle',
    tag: 'Logic',
    desc: 'Flag hazards and clear minefields with guaranteed first-click safety and chord reveals.',
    className: 'MinesweeperGame'
  },
  {
    id: 'spaceRunner',
    title: 'Cosmic Voyage',
    icon: '🚀',
    category: 'arcade',
    tag: 'Shooter',
    desc: 'Deep space action shooter: dodge asteroids, blast drone swarms, and upgrade blasters.',
    className: 'SpaceRunnerGame'
  },
  {
    id: 'dungeon',
    title: 'Shadow Crypt',
    icon: '⚔️',
    category: 'strategy',
    tag: 'Roguelike',
    desc: 'Turn-based tactical dungeon crawler with fog of war, loot, levels, and a crypt boss.',
    className: 'DungeonRoguelikeGame'
  },
  {
    id: 'connectFour',
    title: 'Tactics 4',
    icon: '🔴',
    category: 'strategy',
    tag: 'Strategy',
    desc: 'Connect four discs in a row against an intelligent Minimax AI or local 2-player.',
    className: 'ConnectFourGame'
  },
  {
    id: 'ambientSound',
    title: 'Zen Soundscape',
    icon: '🎧',
    category: 'tools',
    tag: 'Offline Tool',
    desc: 'Procedural rain, ocean surf, white noise, and 10Hz alpha beats for offline focus.',
    className: 'AmbientSoundTool'
  },
  {
    id: 'scratchpad',
    title: 'Markdown Studio',
    icon: '✍️',
    category: 'tools',
    tag: 'Offline Tool',
    desc: 'Distraction-free offline Markdown writing space with live preview & export to .md/.txt.',
    className: 'ScratchpadTool'
  },
  {
    id: 'retroGuide',
    title: 'Mac Retro Emulation Guide',
    icon: '🕹️',
    category: 'retro',
    tag: 'Guide & Setup',
    desc: 'How to play thousands of classic GBA, SNES, N64, and Arcade games on your Mac 100% offline.',
    isGuide: true
  }
];

class App {
  constructor() {
    this.currentCategory = 'all';
    this.activeGameInstance = null;
    this.modalEl = document.getElementById('game-modal');
    this.modalTitleEl = document.getElementById('modal-title');
    this.modalMountEl = document.getElementById('modal-mount');
    this.catalogGridEl = document.getElementById('catalog-grid');
  }

  init() {
    this.setupTheme();
    this.setupAudioToggle();
    this.setupFilterTabs();
    this.setupModal();
    this.renderCatalog();
  }

  setupTheme() {
    const savedTheme = localStorage.getItem('zenith_theme') || 'auto';
    const toggleBtn = document.getElementById('theme-toggle-btn');

    const applyTheme = (theme) => {
      if (theme === 'auto') {
        document.documentElement.removeAttribute('data-theme');
        toggleBtn.textContent = '🌓';
      } else if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleBtn.textContent = '🌙';
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        toggleBtn.textContent = '☀️';
      }
    };

    applyTheme(savedTheme);

    toggleBtn.onclick = () => {
      const current = localStorage.getItem('zenith_theme') || 'auto';
      let next = 'dark';
      if (current === 'auto') next = 'light';
      else if (current === 'light') next = 'dark';
      else next = 'auto';

      localStorage.setItem('zenith_theme', next);
      applyTheme(next);
      window.soundEngine.click();
    };
  }

  setupAudioToggle() {
    const audioBtn = document.getElementById('sound-toggle-btn');
    audioBtn.onclick = () => {
      const enabled = window.soundEngine.toggle();
      audioBtn.textContent = enabled ? '🔊' : '🔇';
      audioBtn.title = enabled ? 'Mute Audio' : 'Unmute Audio';
      if (enabled) window.soundEngine.click();
    };
  }

  setupFilterTabs() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.getAttribute('data-cat');
        window.soundEngine.click();
        this.renderCatalog();
      };
    });
  }

  setupModal() {
    const closeBtn = document.getElementById('modal-close-btn');
    closeBtn.onclick = () => this.closeGame();

    // Close on backdrop click (light dismiss for modal dialog)
    this.modalEl.addEventListener('click', (e) => {
      const rect = this.modalEl.getBoundingClientRect();
      const inDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!inDialog) {
        this.closeGame();
      }
    });

    // Handle Esc key
    this.modalEl.addEventListener('cancel', (e) => {
      e.preventDefault();
      this.closeGame();
    });
  }

  renderCatalog() {
    this.catalogGridEl.innerHTML = '';
    const filtered = GAMES_CATALOG.filter(item => {
      if (this.currentCategory === 'all') return true;
      return item.category === this.currentCategory;
    });

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'game-card';

      let scoreMarkup = '';
      if (item.category === 'puzzle' || item.category === 'arcade') {
        const highScore = window.offlineStorage.getHighScore(item.id);
        scoreMarkup = `<span class="card-score">Best: <strong>${highScore}</strong></span>`;
      } else if (item.isGuide) {
        scoreMarkup = `<span class="card-score">macOS Native</span>`;
      } else {
        scoreMarkup = `<span class="card-score">Ready Offline</span>`;
      }

      card.innerHTML = `
        <div class="card-top">
          <span class="card-icon">${item.icon}</span>
          <span class="card-tag">${item.tag}</span>
        </div>
        <h3 class="card-title">${item.title}</h3>
        <p class="card-desc">${item.desc}</p>
        <div class="card-footer">
          ${scoreMarkup}
          <button class="btn btn-primary" data-id="${item.id}">
            ${item.isGuide ? 'Read Guide' : (item.category === 'tools' ? 'Open Tool' : 'Play Now')}
          </button>
        </div>
      `;

      card.querySelector('button').onclick = () => this.launchGame(item);
      this.catalogGridEl.appendChild(card);
    });
  }

  launchGame(gameDef) {
    window.soundEngine.click();
    this.modalTitleEl.innerHTML = `<span>${gameDef.icon}</span> ${gameDef.title}`;

    if (this.activeGameInstance && typeof this.activeGameInstance.destroy === 'function') {
      this.activeGameInstance.destroy();
    }
    this.modalMountEl.innerHTML = '';

    if (gameDef.isGuide) {
      this.renderRetroGuide();
    } else {
      const GameClass = window[gameDef.className];
      if (GameClass) {
        this.activeGameInstance = new GameClass('modal-mount');
        this.activeGameInstance.mount();
      }
    }

    this.modalEl.showModal();
  }

  renderRetroGuide() {
    this.modalMountEl.innerHTML = `
      <div class="retro-guide-content">
        <div class="info-banner" style="margin-bottom: 1.5rem;">
          <h3>🎮 Complete Offline Retro Gaming on your 16GB Mac</h3>
          <p>Your Mac is extraordinarily capable of running classic console games completely offline with virtually zero RAM or battery overhead.</p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div>
            <h4 style="font-size: 1.15rem; margin-bottom: 0.5rem; color: var(--color-primary);">1. The #1 Recommended Mac App: OpenEmu</h4>
            <p style="color: var(--color-text-muted); margin-bottom: 0.5rem;">
              <strong>OpenEmu</strong> is an open-source, award-winning native macOS multi-system emulator with a gorgeous iTunes-style game library manager. It supports Game Boy, GBA, Nintendo DS, NES, SNES, Nintendo 64, Sega Genesis, Sony PlayStation 1, and PSP out of the box!
            </p>
            <ul style="padding-left: 1.25rem; color: var(--color-text-muted); font-size: 0.9rem; line-height: 1.6;">
              <li><strong>Memory usage:</strong> ~100MB to 250MB (featherlight on 16GB RAM).</li>
              <li><strong>Offline capability:</strong> 100% offline once downloaded. No internet needed ever.</li>
              <li><strong>Controller support:</strong> Plug-and-play support for PS4/PS5, Xbox, Switch Pro controllers, or keyboard.</li>
              <li><strong>Install via Homebrew:</strong> <code>brew install --cask openemu</code> (run while online once)</li>
              <li><strong>Website:</strong> <a href="https://openemu.org" target="_blank" style="color: var(--color-primary);">openemu.org</a></li>
            </ul>
          </div>

          <div>
            <h4 style="font-size: 1.15rem; margin-bottom: 0.5rem; color: var(--color-primary);">2. RetroArch (For Power Users & Advanced Shaders)</h4>
            <p style="color: var(--color-text-muted); margin-bottom: 0.5rem;">
              If you want CRT scanline filters, rewind support, or niche systems (Saturn, Dreamcast, Arcade MAME), RetroArch is the gold standard.
            </p>
            <ul style="padding-left: 1.25rem; color: var(--color-text-muted); font-size: 0.9rem; line-height: 1.6;">
              <li><strong>Install via Homebrew:</strong> <code>brew install --cask retroarch</code></li>
            </ul>
          </div>

          <div>
            <h4 style="font-size: 1.15rem; margin-bottom: 0.5rem; color: var(--color-primary);">3. Where to Get Safe Offline Games & Homebrew ROMs</h4>
            <p style="color: var(--color-text-muted); margin-bottom: 0.5rem;">
              Hundreds of classic and modern indie games are freely and legally available to download and keep on your Mac forever:
            </p>
            <ul style="padding-left: 1.25rem; color: var(--color-text-muted); font-size: 0.9rem; line-height: 1.6;">
              <li><strong>PICO-8 & GB Studio Games:</strong> Itch.io has thousands of free GBA/Game Boy ROMs created by modern indie game developers that you can download directly.</li>
              <li><strong>Internet Archive:</strong> Public domain retro software archives and classic arcade collections.</li>
              <li><strong>Tip:</strong> Create an <code>~/OfflineGames/ROMs</code> folder on your Mac and drag them into OpenEmu!</li>
            </ul>
          </div>

          <div>
            <h4 style="font-size: 1.15rem; margin-bottom: 0.5rem; color: var(--color-primary);">4. Native Open-Source Games for Mac (Zero Internet Needed)</h4>
            <div class="guide-cards-grid" style="margin-top: 0.5rem;">
              <div class="guide-mini-card">
                <h4>OpenTTD</h4>
                <p>Open-source transport simulation tycoon (like Transport Tycoon Deluxe). Hundreds of hours of deep offline gameplay.</p>
                <code>brew install --cask openttd</code>
              </div>
              <div class="guide-mini-card">
                <h4>SuperTuxKart</h4>
                <p>3D Mario Kart alternative with local split-screen multiplayer and story mode.</p>
                <code>brew install --cask supertuxkart</code>
              </div>
              <div class="guide-mini-card">
                <h4>0 A.D.</h4>
                <p>Epic historical RTS game inspired by Age of Empires II, completely free and open source.</p>
                <code>brew install --cask 0-ad</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  closeGame() {
    if (this.activeGameInstance && typeof this.activeGameInstance.destroy === 'function') {
      this.activeGameInstance.destroy();
    }
    this.activeGameInstance = null;
    this.modalEl.close();
    this.renderCatalog(); // refresh high scores
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
