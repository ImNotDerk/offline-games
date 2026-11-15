/**
 * Zenith Web Audio Controller
 * Plays PCM audio synthesized directly by Rust DSP in WebAssembly.
 * Zero external audio files. Includes idle auto-suspend for battery conservation.
 */

class AudioController {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.activeAmbient = null;
    this.ambientSource = null;
    this.ambientGain = null;
    this.idleTimer = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx({ sampleRate: 44100 });
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.resetIdleTimer();
  }

  resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    // Auto suspend after 6 seconds of silence if no ambient track is active
    if (!this.activeAmbient) {
      this.idleTimer = setTimeout(() => {
        if (this.ctx && this.ctx.state === 'running' && !this.activeAmbient) {
          this.ctx.suspend();
        }
      }, 6000);
    }
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  playSfx(sfxType) {
    if (!this.sfxEnabled || !window.wasmBridge || !window.wasmBridge.exports) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const numSamples = window.wasmBridge.call('dsp_render_sfx', sfxType);
      if (!numSamples || numSamples === 0) return;

      const ptr = window.wasmBridge.call('dsp_get_sfx_ptr');
      const pcmView = window.wasmBridge.getFloat32View(ptr, numSamples);

      const buffer = this.ctx.createBuffer(1, numSamples, 44100);
      buffer.copyToChannel(pcmView, 0, 0);

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start();

      this.resetIdleTimer();
    } catch (e) {
      console.warn('SFX playback error:', e);
    }
  }

  playAmbient(ambientType, volume = 0.5) {
    if (!window.wasmBridge || !window.wasmBridge.exports) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.stopAmbient();

    try {
      const totalSamples = window.wasmBridge.call('dsp_render_ambient', ambientType, volume);
      const frames = totalSamples / 2;
      const ptr = window.wasmBridge.call('dsp_get_ambient_ptr');
      const interleaved = window.wasmBridge.getFloat32View(ptr, totalSamples);

      const buffer = this.ctx.createBuffer(2, frames, 44100);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      for (let i = 0; i < frames; i++) {
        left[i] = interleaved[i * 2];
        right[i] = interleaved[i * 2 + 1];
      }

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 1.0;

      this.ambientSource = this.ctx.createBufferSource();
      this.ambientSource.buffer = buffer;
      this.ambientSource.loop = true;
      this.ambientSource.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);
      this.ambientSource.start();

      this.activeAmbient = ambientType;
      if (this.idleTimer) clearTimeout(this.idleTimer);
    } catch (e) {
      console.warn('Ambient playback error:', e);
    }
  }

  stopAmbient() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
      } catch (e) {}
      this.ambientSource = null;
    }
    this.activeAmbient = null;
    this.resetIdleTimer();
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

window.audioController = new AudioController();
