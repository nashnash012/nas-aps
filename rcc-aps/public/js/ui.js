// ── MODAL HELPERS ─────────────────────────────────────────────
function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('show');
  el.style.display = '';
}

// HTML-escape a dynamic value before interpolating it into innerHTML.
// Prevents user-entered names/emails/departments from injecting markup.
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));
}
document.querySelectorAll('.modal-overlay').forEach(o=>{
  o.addEventListener('click', e=>{
    if (e.target === o) {
      o.classList.remove('show');
      o.style.display = '';
    }
  });
});

// ── TOAST ─────────────────────────────────────────────────────
function showToast(icon, msg) {
  const t=document.getElementById('toast');
  document.getElementById('toastIcon').textContent=icon;
  document.getElementById('toastMsg').textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3500);
}