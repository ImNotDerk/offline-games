/**
 * Offline Markdown Studio & Scratchpad
 */
class ScratchpadTool {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.storageKey = 'offline_scratchpad_content';
  }

  mount() {
    const saved = localStorage.getItem(this.storageKey) || `# Welcome to Offline Studio ✍️\n\nWhen the internet drops, this offline studio gives you a clean space to brainstorm, draft documents, take notes, or write stories.\n\n### Highlights:\n- **100% Offline**: Saves continuously to your browser's local cache.\n- **Export**: One-click download as a \`.md\` or \`.txt\` file straight to your Mac.\n- **Zero Latency**: Instant live Markdown preview.\n\n> "Simplicity is the soul of efficiency."\n\nWrite your thoughts below!`;

    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title-group">
          <h3>Markdown Studio & Scratchpad</h3>
          <p class="game-subtitle">Zero-distraction offline writing with live preview & auto-save.</p>
        </div>
        <div class="stats-row">
          <div class="stat-pill"><span class="stat-label">WORDS</span><span id="sp-words" class="stat-value">0</span></div>
          <div class="stat-pill"><span class="stat-label">CHARS</span><span id="sp-chars" class="stat-value">0</span></div>
          <div class="stat-pill"><span class="stat-label">READ TIME</span><span id="sp-time" class="stat-value">0 min</span></div>
        </div>
      </div>
      <div class="game-controls-bar">
        <button class="btn btn-primary" id="sp-export-md">💾 Save as .md</button>
        <button class="btn btn-secondary" id="sp-export-txt">📄 Save as .txt</button>
        <button class="btn btn-outline" id="sp-copy">📋 Copy All</button>
        <button class="btn btn-outline" id="sp-clear">🗑️ Clear</button>
      </div>
      <div class="scratchpad-layout">
        <div class="sp-pane">
          <textarea id="sp-editor" class="sp-textarea" placeholder="Start typing markdown here..."></textarea>
        </div>
        <div class="sp-pane">
          <div id="sp-preview" class="sp-preview-box"></div>
        </div>
      </div>
    `;

    this.editor = document.getElementById('sp-editor');
    this.preview = document.getElementById('sp-preview');

    this.editor.value = saved;
    this.editor.oninput = () => {
      this.update();
    };

    document.getElementById('sp-export-md').onclick = () => this.exportFile('notes.md', 'text/markdown');
    document.getElementById('sp-export-txt').onclick = () => this.exportFile('notes.txt', 'text/plain');
    document.getElementById('sp-copy').onclick = () => this.copyToClipboard();
    document.getElementById('sp-clear').onclick = () => {
      if (confirm('Clear all scratchpad text?')) {
        this.editor.value = '';
        this.update();
      }
    };

    this.update();
  }

  update() {
    const text = this.editor.value;
    localStorage.setItem(this.storageKey, text);

    // Compute stats
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const readTime = Math.ceil(words / 200);

    const wEl = document.getElementById('sp-words');
    const cEl = document.getElementById('sp-chars');
    const tEl = document.getElementById('sp-time');
    if (wEl) wEl.textContent = words;
    if (cEl) cEl.textContent = chars;
    if (tEl) tEl.textContent = `${readTime} min`;

    // Simple robust markdown parser
    this.preview.innerHTML = this.parseMarkdown(text);
  }

  parseMarkdown(md) {
    if (!md) return '<p class="empty-hint">Preview will appear here...</p>';
    let html = md
      // Escaping
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```code```
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Unordered lists
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');

    // Paragraphs
    html = html.split(/\n\n+/).map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<block')) return p;
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
  }

  exportFile(filename, mimeType) {
    const blob = new Blob([this.editor.value], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.soundEngine.victory();
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.editor.value).then(() => {
      const btn = document.getElementById('sp-copy');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      }
      window.soundEngine.coin();
    });
  }

  destroy() {}
}

window.ScratchpadTool = ScratchpadTool;
