// ============================================
//   PasteGold — app.js
//   Main application logic
// ============================================

const STORAGE_KEY = 'pastegold_pastes';
let currentPasteId = null;
let soundPlaying = false;

// ── GRAIN CANVAS ─────────────────────────────
(function initGrain() {
  const canvas = document.getElementById('grain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function drawGrain() {
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255 | 0;
      data[i] = data[i+1] = data[i+2] = v;
      data[i+3] = 20;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  resize();
  drawGrain();
  window.addEventListener('resize', () => { resize(); drawGrain(); });
  setInterval(drawGrain, 150);
})();

// ── LINE NUMBERS ─────────────────────────────
const codeEditor = document.getElementById('codeEditor');
const lineNums = document.getElementById('lineNums');

if (codeEditor && lineNums) {
  function updateLineNums() {
    const lines = codeEditor.value.split('\n').length;
    lineNums.textContent = Array.from({length: lines}, (_, i) => i + 1).join('\n');
  }

  codeEditor.addEventListener('input', updateLineNums);
  codeEditor.addEventListener('scroll', () => {
    lineNums.scrollTop = codeEditor.scrollTop;
  });

  // Tab support
  codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeEditor.selectionStart;
      const end = codeEditor.selectionEnd;
      codeEditor.value = codeEditor.value.slice(0, start) + '  ' + codeEditor.value.slice(end);
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;
      updateLineNums();
    }
  });

  updateLineNums();
}

// ── STORAGE ───────────────────────────────────
function getPastes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function savePastes(pastes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pastes));
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function generateLink(id) {
  return `${location.origin}${location.pathname.replace(/[^/]*$/, '')}paste.html?id=${id}`;
}

// ── SAVE PASTE ────────────────────────────────
function savePaste() {
  const code = codeEditor ? codeEditor.value.trim() : '';
  const title = document.getElementById('pasteTitle')?.value.trim() || 'Untitled Paste';
  const lang = document.getElementById('langSelect')?.value || 'plaintext';
  const expiry = document.getElementById('expiry')?.value || 'never';
  const visibility = document.getElementById('visibility')?.value || 'public';
  const tags = document.getElementById('tagInput')?.value.trim() || '';

  if (!code) {
    showToast('Tulis kode dulu ya!', true);
    return;
  }

  const id = generateId();
  const paste = {
    id,
    title: title || 'Untitled Paste',
    code,
    lang,
    expiry,
    visibility,
    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    created: Date.now(),
    link: generateLink(id),
  };

  const pastes = getPastes();
  pastes.unshift(paste);
  savePastes(pastes);

  currentPasteId = id;

  const link = document.getElementById('generatedLink');
  if (link) link.textContent = paste.link;

  const meta = document.getElementById('modalMeta');
  if (meta) {
    const expiryLabel = expiry === 'never' ? 'Tidak kedaluwarsa' : `Kedaluwarsa: ${expiryLabel_(expiry)}`;
    meta.innerHTML = `
      <span>🗂 ${lang.toUpperCase()}</span>
      <span>👁 ${visibility}</span>
      <span>⏱ ${expiryLabel}</span>
      <span>📅 ${new Date().toLocaleDateString('id-ID')}</span>
    `;
  }

  openModal('linkModal');
  playChime();
}

function expiryLabel_(v) {
  const map = { '1h': '1 Jam', '1d': '1 Hari', '7d': '7 Hari', '30d': '30 Hari', 'never': 'Selamanya' };
  return map[v] || v;
}

// ── CLEAR EDITOR ─────────────────────────────
function clearEditor() {
  if (codeEditor) codeEditor.value = '';
  const title = document.getElementById('pasteTitle');
  const tags = document.getElementById('tagInput');
  if (title) title.value = '';
  if (tags) tags.value = '';
  if (lineNums) lineNums.textContent = '1';
  showToast('Editor dibersihkan!');
}

// ── COPY LINK ─────────────────────────────────
function copyLink() {
  const link = document.getElementById('generatedLink')?.textContent;
  if (!link) return;
  copyToClipboard(link);
  const btn = document.getElementById('copyBtn');
  if (btn) {
    btn.innerHTML = `<img src="icons/check.svg" alt="" class="btn-icon" /> Tersalin!`;
    setTimeout(() => {
      btn.innerHTML = `<img src="icons/copy.svg" alt="" class="btn-icon" /> Salin`;
    }, 2000);
  }
  showToast('Link disalin!');
}

function copyRaw() {
  const link = document.getElementById('generatedLink')?.textContent;
  if (!link) return;
  const rawLink = link.replace('paste.html', 'raw.html');
  copyToClipboard(rawLink);
  showToast('Raw link disalin!');
}

function shareWA() {
  const link = document.getElementById('generatedLink')?.textContent;
  if (!link) return;
  window.open(`https://wa.me/?text=Cek paste ini: ${encodeURIComponent(link)}`, '_blank');
}

function shareTwitter() {
  const link = document.getElementById('generatedLink')?.textContent;
  if (!link) return;
  window.open(`https://twitter.com/intent/tweet?text=Cek kode ini di PasteGold!&url=${encodeURIComponent(link)}`, '_blank');
}

// ── CLIPBOARD ─────────────────────────────────
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

// ── MODAL ─────────────────────────────────────
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('linkModal')?.classList.remove('open');
  document.body.style.overflow = '';
}

function closeViewModal() {
  document.getElementById('viewModal')?.classList.remove('open');
  document.body.style.overflow = '';
}

// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});

// ── TOAST ─────────────────────────────────────
let toastTimer;
function showToast(msg, isError = false) {
  const toast = document.getElementById('resultToast');
  const msgEl = document.getElementById('toastMsg');
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  toast.style.background = isError ? 'rgba(255,80,80,0.15)' : '';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function closeToast() {
  document.getElementById('resultToast')?.classList.remove('show');
}

// ── SOUND ─────────────────────────────────────
const soundBtn = document.getElementById('soundBtn');
const soundIcon = document.getElementById('soundIcon');
const audio = document.getElementById('ambientAudio');

if (soundBtn && audio) {
  soundBtn.addEventListener('click', () => {
    if (soundPlaying) {
      audio.pause();
      if (soundIcon) soundIcon.src = 'icons/sound-off.svg';
    } else {
      audio.volume = 0.3;
      audio.play().catch(() => {});
      if (soundIcon) soundIcon.src = 'icons/sound-on.svg';
    }
    soundPlaying = !soundPlaying;
  });
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.5);
    });
  } catch {}
}

// ── PAGE LOAD ANIMATION ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.opacity = '0';
  document.body.style.transform = 'translateY(10px)';
  document.body.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
    document.body.style.transform = 'translateY(0)';
  });
});
        
