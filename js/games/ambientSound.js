/**
 * Zen Ambient Sound Generator
 * Generates soothing focus sounds using Web Audio API completely offline.
 */
class AmbientSoundTool {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activeTracks = {
      rain: false,
      ocean: false,
      white: false,
      binaural: false
    };
    this.volumes = {
      rain: 0.5,
      ocean: 0.5,
      white: 0.4,
      binaural: 0.4
    };
    this.timerMinutes = 0;
    this.timerSecondsRemaining = 0;
    this.timerInterval = null;
  }

  mount() {
    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title-group">
          <h3>Zen Soundscape Studio</h3>
          <p class="game-subtitle">Pure procedural audio for offline focus, relaxation, and reading. 0 MB downloaded.</p>
        </div>
        <div class="stats-row">
          <div class="stat-pill"><span class="stat-label">AUDIO STATUS</span><span id="ambient-status" class="stat-value">Standby</span></div>
          <div class="stat-pill"><span class="stat-label">TIMER</span><span id="ambient-timer" class="stat-value">Infinite</span></div>
        </div>
      </div>
      <div class="game-controls-bar">
        <button class="btn btn-secondary" id="ambient-stop-all">Stop All Sounds</button>
        <select id="ambient-timer-select" class="form-select">
          <option value="0">Timer: Off (Continuous)</option>
          <option value="15">Timer: 15 Minutes</option>
          <option value="30">Timer: 30 Minutes</option>
          <option value="60">Timer: 60 Minutes</option>
        </select>
      </div>
      <div class="sound-grid">
        <div class="sound-card" id="card-rain">
          <div class="sound-icon">🌧️</div>
          <div class="sound-info">
            <h4>Gentle Rain</h4>
            <p>Soft rainfall soundscape synthesized with filtered noise</p>
          </div>
          <div class="sound-controls">
            <button class="btn btn-outline sound-toggle-btn" data-sound="rain">Start</button>
            <input type="range" class="sound-slider" data-sound="rain" min="0" max="1" step="0.05" value="0.5">
          </div>
        </div>

        <div class="sound-card" id="card-ocean">
          <div class="sound-icon">🌊</div>
          <div class="sound-info">
            <h4>Ocean Waves</h4>
            <p>Ebbing and flowing shore waves with low-frequency modulation</p>
          </div>
          <div class="sound-controls">
            <button class="btn btn-outline sound-toggle-btn" data-sound="ocean">Start</button>
            <input type="range" class="sound-slider" data-sound="ocean" min="0" max="1" step="0.05" value="0.5">
          </div>
        </div>

        <div class="sound-card" id="card-white">
          <div class="sound-icon">💨</div>
          <div class="sound-info">
            <h4>White Noise</h4>
            <p>Uniform acoustic blanket to block distracting background noises</p>
          </div>
          <div class="sound-controls">
            <button class="btn btn-outline sound-toggle-btn" data-sound="white">Start</button>
            <input type="range" class="sound-slider" data-sound="white" min="0" max="1" step="0.05" value="0.4">
          </div>
        </div>

        <div class="sound-card" id="card-binaural">
          <div class="sound-icon">🧠</div>
          <div class="sound-info">
            <h4>10Hz Alpha Focus Tone</h4>
            <p>Stereo binaural beats (headphones recommended) to induce flow state</p>
          </div>
          <div class="sound-controls">
            <button class="btn btn-outline sound-toggle-btn" data-sound="binaural">Start</button>
            <input type="range" class="sound-slider" data-sound="binaural" min="0" max="1" step="0.05" value="0.4">
          </div>
        </div>
      </div>
      <div class="game-instructions">
        <p><strong>Tip:</strong> You can combine multiple sounds together (e.g. Rain + Ocean Waves) for a custom blend!</p>
      </div>
    `;

    document.getElementById('ambient-stop-all').onclick = () => this.stopAll();

    document.querySelectorAll('.sound-toggle-btn').forEach(btn => {
      btn.onclick = () => {
        const sound = btn.getAttribute('data-sound');
        this.toggleSound(sound, btn);
      };
    });

    document.querySelectorAll('.sound-slider').forEach(slider => {
      slider.oninput = (e) => {
        const sound = slider.getAttribute('data-sound');
        this.volumes[sound] = parseFloat(e.target.value);
        if (this.activeTracks[sound]) {
          // Restart with updated volume
          this.startSoundEngine(sound);
        }
      };
    });

    document.getElementById('ambient-timer-select').onchange = (e) => {
      this.timerMinutes = parseInt(e.target.value, 10);
      this.startTimer(this.timerMinutes);
    };
  }

  toggleSound(sound, btn) {
    if (this.activeTracks[sound]) {
      this.stopSoundEngine(sound);
      this.activeTracks[sound] = false;
      btn.textContent = 'Start';
      btn.classList.remove('active');
    } else {
      this.startSoundEngine(sound);
      this.activeTracks[sound] = true;
      btn.textContent = 'Stop';
      btn.classList.add('active');
    }
    this.updateStatus();
  }

  startSoundEngine(sound) {
    const vol = this.volumes[sound];
    if (sound === 'rain') window.soundEngine.startRain(vol);
    else if (sound === 'ocean') window.soundEngine.startOcean(vol);
    else if (sound === 'white') window.soundEngine.startWhiteNoise(vol);
    else if (sound === 'binaural') window.soundEngine.startBinaural(vol);
  }

  stopSoundEngine(sound) {
    window.soundEngine.stopAmbient(sound);
  }

  stopAll() {
    window.soundEngine.stopAllAmbient();
    Object.keys(this.activeTracks).forEach(k => {
      this.activeTracks[k] = false;
    });
    document.querySelectorAll('.sound-toggle-btn').forEach(btn => {
      btn.textContent = 'Start';
      btn.classList.remove('active');
    });
    this.updateStatus();
  }

  updateStatus() {
    const activeCount = Object.values(this.activeTracks).filter(Boolean).length;
    const statusEl = document.getElementById('ambient-status');
    if (statusEl) {
      statusEl.textContent = activeCount > 0 ? `Playing (${activeCount})` : 'Standby';
      statusEl.style.color = activeCount > 0 ? '#10b981' : '#94a3b8';
    }
  }

  startTimer(mins) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const timerEl = document.getElementById('ambient-timer');
    if (mins <= 0) {
      if (timerEl) timerEl.textContent = 'Infinite';
      return;
    }

    this.timerSecondsRemaining = mins * 60;
    this.timerInterval = setInterval(() => {
      this.timerSecondsRemaining--;
      if (this.timerSecondsRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.stopAll();
        if (timerEl) timerEl.textContent = 'Ended';
      } else {
        const m = Math.floor(this.timerSecondsRemaining / 60);
        const s = this.timerSecondsRemaining % 60;
        if (timerEl) timerEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
      }
    }, 1000);
  }

  destroy() {
    this.stopAll();
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}

window.AmbientSoundTool = AmbientSoundTool;
