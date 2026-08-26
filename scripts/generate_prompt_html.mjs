import fs from 'fs';
import path from 'path';

const mdPath = path.resolve('docs/SLIDE_PRESENTASI.md');
const outputPath = path.resolve('slide_prompts.html');

const content = fs.readFileSync(mdPath, 'utf8');

// 1. Extract BLOK SISTEM
const systemMatch = content.match(/# BLOK SISTEM[\s\S]*?```text\r?\n([\s\S]*?)```/);
if (!systemMatch) {
  console.error('Could not find BLOK SISTEM in SLIDE_PRESENTASI.md');
  process.exit(1);
}
const systemBlock = systemMatch[1].trim();

// 2. Extract Slide Prompts
// Regex looks for `## (S\d+|A\d+)\s*—\s*(.+)` followed by text block
const slideRegex = /## ([SA]\d+)\s*—\s*([^\r\n]+)[\s\S]*?```text\r?\n([\s\S]*?)```/g;
const slides = [];

let match;
while ((match = slideRegex.exec(content)) !== null) {
  const id = match[1].trim();
  const title = match[2].trim();
  const rawPrompt = match[3].trim();

  // Extract metadata from prompt text if available
  // e.g. BABAK: HOOK  ·  LANTAI: TINT  ·  ARKETIPE: angka penuh layar
  let babak = 'UMUM';
  let lantai = 'OAT';
  let arketipe = 'Kartu';

  const metaMatch = rawPrompt.match(/BABAK:\s*([^·\n]+)(?:·\s*LANTAI:\s*([^·\n]+))?(?:·\s*ARKETIPE:\s*([^\n]+))?/i);
  if (metaMatch) {
    if (metaMatch[1]) babak = metaMatch[1].trim();
    if (metaMatch[2]) lantai = metaMatch[2].trim();
    if (metaMatch[3]) arketipe = metaMatch[3].trim();
  }

  slides.push({
    id,
    title,
    babak,
    lantai,
    arketipe,
    prompt: rawPrompt
  });
}

console.log(`Parsed BLOK SISTEM (${systemBlock.length} chars)`);
console.log(`Parsed ${slides.length} slides.`);

// HTML Template Generation
const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PANTAS — Prompt Deck Presentasi Copier</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --canvas: #f2ede3;
      --surface: #fcfbf8;
      --overlay: #ffffff;
      --sunken: #eae3d7;
      --ink: #1e1b15;
      --muted: #544d40;
      --label: #655c4e;
      --line: #d8cebb;
      --line-strong: #b7a98f;
      --brand: #246634;
      --brand-deep: #1a4d26;
      --brand-dark: #12361b;
      --brand-tint: #eaf6ed;
      --brand-tint-strong: #d2ead8;
      --on-brand: #ffffff;
      --font-display: 'Bricolage Grotesque', system-ui, sans-serif;
      --font-sans: 'Inter', system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --shadow-e2: 0 1px 2px rgba(61, 56, 46, 0.09), 0 8px 24px -8px rgba(61, 56, 46, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.7);
      --shadow-e3: 0 2px 6px -1px rgba(61, 56, 46, 0.09), 0 22px 52px -14px rgba(61, 56, 46, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.7);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--canvas);
      color: var(--ink);
      font-family: var(--font-sans);
      line-height: 1.5;
      padding-bottom: 80px;
    }

    header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(252, 251, 248, 0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--line);
      padding: 16px 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }

    .header-container {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      background: var(--brand-deep);
      color: var(--on-brand);
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 16px;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      letter-spacing: 0.05em;
    }
    .header-title {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 700;
      color: var(--ink);
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 260px;
      max-width: 450px;
    }
    .search-box input {
      width: 100%;
      padding: 10px 16px 10px 40px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--line-strong);
      background: var(--surface);
      font-family: var(--font-sans);
      font-size: 14px;
      color: var(--ink);
      outline: none;
      transition: all 0.2s;
    }
    .search-box input:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px rgba(36, 102, 52, 0.15);
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--label);
      pointer-events: none;
    }

    .top-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: var(--radius-sm);
      font-family: var(--font-sans);
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      user-select: none;
    }
    .btn-brand {
      background: linear-gradient(180deg, #2b7a3e 0%, var(--brand) 60%, var(--brand-deep) 100%);
      color: var(--on-brand);
      box-shadow: var(--shadow-e2);
    }
    .btn-brand:hover {
      background: var(--brand-deep);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: var(--surface);
      border: 1px solid var(--line-strong);
      color: var(--ink);
    }
    .btn-secondary:hover {
      background: var(--sunken);
      border-color: var(--muted);
    }
    .btn-copy-prompt {
      background: var(--brand-tint);
      border: 1px solid var(--brand-tint-strong);
      color: var(--brand-dark);
    }
    .btn-copy-prompt:hover {
      background: var(--brand-tint-strong);
      color: var(--brand-dark);
      transform: translateY(-1px);
    }
    .btn-copy-full {
      background: var(--brand-deep);
      color: var(--on-brand);
      box-shadow: var(--shadow-e2);
    }
    .btn-copy-full:hover {
      background: var(--brand-dark);
      transform: translateY(-1px);
    }

    .btn.copied {
      background: #15803d !important;
      color: #ffffff !important;
      border-color: #15803d !important;
    }

    main {
      max-width: 1280px;
      margin: 32px auto;
      padding: 0 24px;
    }

    /* System Block Section */
    .system-card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-e2);
      margin-bottom: 32px;
      overflow: hidden;
    }
    .system-header {
      padding: 20px 24px;
      background: linear-gradient(140deg, var(--brand-tint) 0%, var(--surface) 100%);
      border-bottom: 1px solid var(--line);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .system-title-area {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .system-title {
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 700;
      color: var(--brand-dark);
    }
    .system-body {
      padding: 20px 24px;
      display: none;
      background: #faf8f5;
      border-top: 1px solid var(--line);
    }
    .system-body.open {
      display: block;
    }
    pre.code-block {
      font-family: var(--font-mono);
      font-size: 13px;
      line-height: 1.6;
      color: #24211b;
      white-space: pre-wrap;
      word-break: break-word;
      background: var(--surface);
      border: 1px solid var(--line);
      padding: 16px;
      border-radius: var(--radius-sm);
      max-height: 380px;
      overflow-y: auto;
    }

    /* Grid Layout for Prompts */
    .section-title {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 800;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .count-badge {
      font-family: var(--font-mono);
      font-size: 14px;
      background: var(--sunken);
      padding: 4px 12px;
      border-radius: 999px;
      color: var(--muted);
      font-weight: 600;
    }

    .prompts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(580px, 1fr));
      gap: 24px;
    }

    @media (max-width: 640px) {
      .prompts-grid {
        grid-template-columns: 1fr;
      }
    }

    .prompt-card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-e2);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .prompt-card:hover {
      box-shadow: var(--shadow-e3);
    }

    .card-top {
      padding: 20px;
    }
    .card-header-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }
    .slide-id {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 20px;
      background: var(--brand-tint-strong);
      color: var(--brand-dark);
      padding: 4px 12px;
      border-radius: var(--radius-sm);
    }
    .slide-title {
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 700;
      color: var(--ink);
      flex: 1;
      margin-top: 2px;
    }
    .meta-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }
    .badge {
      font-size: 12px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-babak { background: var(--sunken); color: var(--muted); }
    .badge-lantai { background: var(--brand-tint); color: var(--brand-deep); }
    .badge-arketipe { background: #eee7da; color: var(--label); }

    .prompt-preview {
      font-family: var(--font-mono);
      font-size: 12.5px;
      line-height: 1.5;
      background: #faf8f5;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      padding: 14px;
      color: #332f28;
      max-height: 180px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .card-actions {
      padding: 16px 20px;
      background: #f7f4ed;
      border-top: 1px solid var(--line);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--ink);
      color: var(--surface);
      padding: 14px 22px;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 10px;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 1000;
    }
    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }
    .toast-icon {
      color: #4ade80;
      font-weight: bold;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--muted);
      font-size: 16px;
      grid-column: 1 / -1;
    }
  </style>
</head>
<body>

  <header>
    <div class="header-container">
      <div class="logo-area">
        <span class="logo-badge">PANTAS</span>
        <span class="header-title">Prompt Deck Copier</span>
      </div>

      <div class="search-box">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" id="searchInput" placeholder="Cari nomor slide (S09), judul, atau kata kunci...">
      </div>

      <div class="top-actions">
        <button class="btn btn-brand" id="copySystemTopBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Salin BLOK SISTEM
        </button>
      </div>
    </div>
  </header>

  <main>
    <!-- System Block Section -->
    <div class="system-card">
      <div class="system-header">
        <div class="system-title-area">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span class="system-title">BLOK SISTEM (Sistem Desain Wajib PANTAS)</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary" id="toggleSystemBtn">
            Lihat Isi Blok
          </button>
          <button class="btn btn-brand" id="copySystemMainBtn">
            Salin BLOK SISTEM
          </button>
        </div>
      </div>
      <div class="system-body" id="systemBody">
        <pre class="code-block" id="systemText"></pre>
      </div>
    </div>

    <!-- Prompts Section -->
    <div class="section-title">
      <span>Daftar Prompt Slide</span>
      <span class="count-badge" id="slideCount">28 Slide</span>
    </div>

    <div class="prompts-grid" id="promptsGrid">
      <!-- Injected via JS -->
    </div>
  </main>

  <div class="toast" id="toast">
    <span class="toast-icon">✓</span>
    <span id="toastMsg">Teks berhasil disalin ke clipboard!</span>
  </div>

  <script>
    // Embedded Data
    const SYSTEM_BLOCK = ${JSON.stringify(systemBlock)};
    const SLIDES = ${JSON.stringify(slides, null, 2)};

    // DOM Elements
    const systemTextEl = document.getElementById('systemText');
    const systemBodyEl = document.getElementById('systemBody');
    const toggleSystemBtn = document.getElementById('toggleSystemBtn');
    const copySystemTopBtn = document.getElementById('copySystemTopBtn');
    const copySystemMainBtn = document.getElementById('copySystemMainBtn');
    const searchInput = document.getElementById('searchInput');
    const promptsGrid = document.getElementById('promptsGrid');
    const slideCountEl = document.getElementById('slideCount');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');

    systemTextEl.textContent = SYSTEM_BLOCK;

    // Toggle System View
    toggleSystemBtn.addEventListener('click', () => {
      const isOpen = systemBodyEl.classList.toggle('open');
      toggleSystemBtn.textContent = isOpen ? 'Sembunyikan Isi' : 'Lihat Isi Blok';
    });

    // Copy Helper with feedback
    function copyToClipboard(text, successMessage, triggerBtn) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showFeedback(successMessage, triggerBtn);
        }).catch(err => {
          fallbackCopy(text, successMessage, triggerBtn);
        });
      } else {
        fallbackCopy(text, successMessage, triggerBtn);
      }
    }

    function fallbackCopy(text, successMessage, triggerBtn) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showFeedback(successMessage, triggerBtn);
      } catch (err) {
        alert('Gagal menyalin otomatis. Silakan salin manual.');
      }
      document.body.removeChild(textarea);
    }

    function showFeedback(message, btn) {
      toastMsg.textContent = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);

      if (btn) {
        const originalText = btn.innerHTML;
        btn.classList.add('copied');
        btn.innerHTML = \`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Tercopy!\`;
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = originalText;
        }, 1800);
      }
    }

    copySystemTopBtn.addEventListener('click', (e) => {
      copyToClipboard(SYSTEM_BLOCK, 'BLOK SISTEM berhasil disalin!', e.currentTarget);
    });

    copySystemMainBtn.addEventListener('click', (e) => {
      copyToClipboard(SYSTEM_BLOCK, 'BLOK SISTEM berhasil disalin!', e.currentTarget);
    });

    // Render Cards
    function renderSlides(filterQuery = '') {
      promptsGrid.innerHTML = '';
      const query = filterQuery.toLowerCase().trim();

      const filtered = SLIDES.filter(slide => {
        return slide.id.toLowerCase().includes(query) ||
               slide.title.toLowerCase().includes(query) ||
               slide.babak.toLowerCase().includes(query) ||
               slide.prompt.toLowerCase().includes(query);
      });

      slideCountEl.textContent = \`\${filtered.length} Slide\`;

      if (filtered.length === 0) {
        promptsGrid.innerHTML = \`<div class="empty-state">Tidak ada prompt slide yang cocok dengan "\${filterQuery}".</div>\`;
        return;
      }

      filtered.forEach(slide => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        card.id = \`card-\${slide.id}\`;

        card.innerHTML = \`
          <div class="card-top">
            <div class="card-header-row">
              <span class="slide-id">\${slide.id}</span>
              <h3 class="slide-title">\${escapeHtml(slide.title)}</h3>
            </div>
            <div class="meta-badges">
              <span class="badge badge-babak">\${escapeHtml(slide.babak)}</span>
              <span class="badge badge-lantai">Lantai: \${escapeHtml(slide.lantai)}</span>
              <span class="badge badge-arketipe">\${escapeHtml(slide.arketipe)}</span>
            </div>
            <div class="prompt-preview">\${escapeHtml(slide.prompt)}</div>
          </div>
          <div class="card-actions">
            <button class="btn btn-copy-prompt" onclick="copyPromptOnly('\${slide.id}', this)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Salin Prompt Saja
            </button>
            <button class="btn btn-copy-full" onclick="copySystemAndPrompt('\${slide.id}', this)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
              Salin System + Prompt
            </button>
          </div>
        \`;

        promptsGrid.appendChild(card);
      });
    }

    function escapeHtml(text) {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    window.copyPromptOnly = function(slideId, btn) {
      const slide = SLIDES.find(s => s.id === slideId);
      if (slide) {
        copyToClipboard(slide.prompt, \`Prompt \${slideId} berhasil disalin!\`, btn);
      }
    };

    window.copySystemAndPrompt = function(slideId, btn) {
      const slide = SLIDES.find(s => s.id === slideId);
      if (slide) {
        const fullContent = SYSTEM_BLOCK + "\\n\\n" + slide.prompt;
        copyToClipboard(fullContent, \`BLOK SISTEM + Prompt \${slideId} berhasil disalin!\`, btn);
      }
    };

    // Filter event listener
    searchInput.addEventListener('input', (e) => {
      renderSlides(e.target.value);
    });

    // Initial render
    renderSlides();
  </script>
</body>
</html>
`;

fs.writeFileSync(outputPath, htmlContent, 'utf8');
console.log(`Successfully generated ${outputPath}`);
