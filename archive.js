// ============================================
//   PasteGold — archive.js
//   Archive page logic
// ============================================

let allPastes = [];
let activePasteId = null;

function loadArchive() {
  allPastes = getPastes();
  renderPastes(allPastes);
}

function renderPastes(pastes) {
  const grid = document.getElementById('pasteGrid');
  const empty = document.getElementById('emptyState');
  if (!grid) return;

  grid.innerHTML = '';

  if (pastes.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  pastes.forEach(paste => {
    const card = document.createElement('div');
    card.className = 'paste-card';
    card.onclick = () => openPaste(paste.id);

    const tagsHtml = (paste.tags || []).slice(0, 3).map(t =>
      `<span class="paste-tag">${escapeHtml(t)}</span>`
    ).join('');

    const date = new Date(paste.created).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    card.innerHTML = `
      <div class="paste-card-header">
        <img src="icons/code.svg" alt="" class="paste-card-icon" />
        <span class="paste-card-title">${escapeHtml(paste.title)}</span>
      </div>
      <div class="paste-card-preview">${escapeHtml(paste.code.slice(0, 200))}</div>
      <div class="paste-card-footer">
        <span class="paste-tag">${paste.lang || 'text'}</span>
        ${tagsHtml}
        <span class="paste-date">${date}</span>
      </div>
    `;

    grid.appendChild(card);
  });
}

function filterPastes() {
  const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
  if (!q) { renderPastes(allPastes); return; }
  const filtered = allPastes.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.code.toLowerCase().includes(q) ||
    (p.tags || []).some(t => t.toLowerCase().includes(q))
  );
  renderPastes(filtered);
}

function openPaste(id) {
  const paste = allPastes.find(p => p.id === id);
  if (!paste) return;
  activePasteId = id;

  const titleEl = document.getElementById('viewTitle');
  const metaEl = document.getElementById('viewMeta');
  const codeEl = document.getElementById('viewCode');
  const lineNumsEl = document.getElementById('viewLineNums');

  if (titleEl) titleEl.textContent = paste.title;

  if (metaEl) {
    const date = new Date(paste.created).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    metaEl.innerHTML = `
      <span>${paste.lang || 'plaintext'}</span>
      <span>${paste.visibility || 'public'}</span>
      <span>${date}</span>
      ${(paste.tags || []).map(t => `<span class="paste-tag">${escapeHtml(t)}</span>`).join('')}
    `;
  }

  if (codeEl) {
    codeEl.textContent = paste.code;
  }

  if (lineNumsEl) {
    const lines = paste.code.split('\n').length;
    lineNumsEl.textContent = Array.from({length: lines}, (_, i) => i + 1).join('\n');
  }

  openModal('viewModal');
}

function copyViewCode() {
  const paste = allPastes.find(p => p.id === activePasteId);
  if (!paste) return;
  copyToClipboard(paste.code);
  showToast('Kode disalin!');
}

function copyViewLink() {
  const paste = allPastes.find(p => p.id === activePasteId);
  if (!paste) return;
  copyToClipboard(paste.link || generateLink(paste.id));
  showToast('Link disalin!');
}

function deleteCurrent() {
  if (!activePasteId) return;
  if (!confirm('Yakin hapus paste ini?')) return;
  const pastes = getPastes().filter(p => p.id !== activePasteId);
  savePastes(pastes);
  allPastes = pastes;
  closeViewModal();
  renderPastes(allPastes);
  showToast('Paste dihapus!');
}

function clearAll() {
  if (!confirm('Hapus SEMUA paste? Tidak bisa dikembalikan!')) return;
  savePastes([]);
  allPastes = [];
  renderPastes([]);
  showToast('Semua paste dihapus!');
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

loadArchive();
                                         
