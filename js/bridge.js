/**
 * Zenith Core WebAssembly Bridge
 * Zero-copy FFI bridge with microsecond telemetry and dual-mode loader.
 */

class WasmBridge {
  constructor() {
    this.instance = null;
    this.memory = null;
    this.lastExecTimeMs = 0;
    this.exports = null;
  }

  async init() {
    let wasmBytes = null;

    // 1. Try streaming/fetching binary (works on http://, https://, localhost)
    try {
      const response = await fetch('wasm/zenith_core.wasm');
      if (response.ok) {
        wasmBytes = await response.arrayBuffer();
      }
    } catch (e) {
      // Fetch failed, likely local file:// protocol
    }

    // 2. Fallback to inline Base64 (works on file:// protocol without server)
    if (!wasmBytes && window.ZENITH_WASM_BASE64) {
      const binStr = atob(window.ZENITH_WASM_BASE64);
      const len = binStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binStr.charCodeAt(i);
      }
      wasmBytes = bytes.buffer;
    }

    if (!wasmBytes) {
      throw new Error('Unable to load Zenith WASM binary via fetch or inline fallback.');
    }

    const { instance } = await WebAssembly.instantiate(wasmBytes, {});
    this.instance = instance;
    this.exports = instance.exports;
    this.memory = instance.exports.memory;
    return this;
  }

  /**
   * Benchmarked call wrapper that tracks execution latency in microseconds
   */
  call(fnName, ...args) {
    if (!this.exports || !this.exports[fnName]) {
      console.error(`Unknown WASM export: ${fnName}`);
      return null;
    }
    const t0 = performance.now();
    const result = this.exports[fnName](...args);
    this.lastExecTimeMs = performance.now() - t0;
    return result;
  }

  getUint8View(ptr, len) {
    return new Uint8Array(this.memory.buffer, ptr, len);
  }

  getUint16View(ptr, len) {
    return new Uint16Array(this.memory.buffer, ptr, len);
  }

  getUint32View(ptr, len) {
    return new Uint32Array(this.memory.buffer, ptr, len);
  }

  getFloat32View(ptr, len) {
    return new Float32Array(this.memory.buffer, ptr, len);
  }
}

window.wasmBridge = new WasmBridge();
