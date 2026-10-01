/* ============================================================
   Formación CX · utilidades compartidas del navegador
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Almacenamiento seguro ---------- */
  const memoria = {};
  const Store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return memoria[k] || null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { memoria[k] = v; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { delete memoria[k]; } }
  };

  /* ---------- Cliente de API ----------
     scope: 'asp' o 'admin' (cada uno guarda su propio token) */
  const API = {
    tokenKey(scope) { return 'elx_token_' + scope; },
    token(scope) { return Store.get(this.tokenKey(scope)); },
    guardarToken(scope, t) { Store.set(this.tokenKey(scope), t); },
    salir(scope) { Store.del(this.tokenKey(scope)); },
    async llamar(scope, fn, accion, data) {
      const token = this.token(scope);
      const body = Object.assign({ accion }, data || {});
      if (window.ElxDemo) return window.ElxDemo.llamar(fn, body, token);
      let r;
      try {
        r = await fetch('/api/' + fn, {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
          body: JSON.stringify(body)
        });
      } catch (e) { throw new Error('No hay conexión. Revisa tu internet e intenta de nuevo.'); }
      const j = await r.json().catch(() => ({}));
      if (r.status === 401 && fn !== 'auth') { this.salir(scope); const e = new Error(j.error || 'Tu sesión expiró.'); e.status = 401; throw e; }
      if (!r.ok) { const e = new Error(j.error || 'Algo falló. Intenta de nuevo.'); e.status = r.status; throw e; }
      return j;
    }
  };

  /* ---------- HTML ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function prosa(texto) {
    const bloques = String(texto || '').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    return bloques.map(b => {
      const lineas = b.split('\n');
      if (lineas.every(l => /^\s*[-•]\s+/.test(l))) return '<ul>' + lineas.map(l => '<li>' + esc(l.replace(/^\s*[-•]\s+/, '')) + '</li>').join('') + '</ul>';
      return '<p>' + lineas.map(esc).join('<br>') + '</p>';
    }).join('');
  }

  const ICONOS = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    play: '<path d="m7 4 13 8-13 8z"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
    quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><path d="M12 17.5h.01"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 13h6M7 16h10"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V21h16"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><path d="M7.5 7.5h.01"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'
  };
  const icon = (n, cls) => '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONOS[n] || '') + '</svg>';

  /* ---------- Medios ---------- */
  function youtubeId(url) {
    const s = String(url || '').trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    const m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }
  // Lightshot: prnt.sc/xxxx es una página (no se puede incrustar). image.prntscr.com/... sí es imagen directa.
  function tipoImagen(url) {
    const s = String(url || '').trim();
    if (/^data:image\//.test(s)) return 'directa';
    if (/^https?:\/\/(www\.)?(prnt\.sc|prntscr\.com)\/[\w]+\/?$/i.test(s)) return 'lightshot-pagina';
    if (/^https?:\/\//i.test(s)) return 'directa';
    return 'invalida';
  }

  /* ---------- Avisos y modales ---------- */
  function toast(msg, tipo) {
    let zona = document.querySelector('.toast-zone');
    if (!zona) { zona = document.createElement('div'); zona.className = 'toast-zone'; zona.setAttribute('role', 'status'); document.body.appendChild(zona); }
    const t = document.createElement('div'); t.className = 'toast ' + (tipo || ''); t.textContent = msg; zona.appendChild(t);
    setTimeout(() => t.remove(), 3800);
  }
  // Confirmación dentro de la página (sin confirm() del navegador)
  function confirmar({ titulo, texto, ok, cancelar, peligro }) {
    return new Promise(resolve => {
      const w = document.createElement('div'); w.className = 'modal-wrap';
      w.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mdl-t"><h2 id="mdl-t">' + esc(titulo) + '</h2>' +
        (texto ? '<p class="muted">' + texto + '</p>' : '') +
        '<div class="modal-actions"><button class="btn btn-secondary" data-r="0">' + esc(cancelar || 'Cancelar') + '</button>' +
        '<button class="btn ' + (peligro ? 'btn-danger' : 'btn-primary') + '" data-r="1">' + esc(ok || 'Confirmar') + '</button></div></div>';
      const cerrar = v => { w.remove(); document.removeEventListener('keydown', tecla); resolve(v); };
      const tecla = e => { if (e.key === 'Escape') cerrar(false); };
      w.addEventListener('click', e => { if (e.target === w) cerrar(false); const b = e.target.closest('[data-r]'); if (b) cerrar(b.dataset.r === '1'); });
      document.addEventListener('keydown', tecla);
      document.body.appendChild(w);
      w.querySelector('[data-r="1"]').focus();
    });
  }
  function lightbox(src) {
    const w = document.createElement('div'); w.className = 'lightbox'; w.innerHTML = '<img alt="">'; w.querySelector('img').src = src;
    const cerrar = () => { w.remove(); document.removeEventListener('keydown', k); };
    const k = e => { if (e.key === 'Escape') cerrar(); };
    w.addEventListener('click', cerrar); document.addEventListener('keydown', k);
    document.body.appendChild(w);
  }

  const fecha = iso => iso ? new Date(iso).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const fechaHora = iso => iso ? new Date(iso).toLocaleString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  const iniciales = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();

  // Barra de modo demo (solo cuando ElxDemo está activo)
  function barraDemo(otraPagina, etiqueta) {
    if (!window.ElxDemo) return;
    const b = document.createElement('div'); b.className = 'demo-bar no-print';
    b.innerHTML = '<span>Modo demo: los datos se guardan solo en este navegador.</span>' +
      (otraPagina ? '<a href="' + otraPagina + '">' + etiqueta + '</a>' : '') + '<button type="button">Reiniciar demo</button>';
    b.querySelector('button').addEventListener('click', async () => {
      if (await confirmar({ titulo: '¿Reiniciar la demo?', texto: 'Se borran los aspirantes y cambios de prueba y vuelve el contenido de ejemplo.', ok: 'Reiniciar', peligro: true })) {
        window.ElxDemo.reiniciar(); location.reload();
      }
    });
    document.body.prepend(b);
  }

  window.Elx = { Store, API, esc, prosa, icon, youtubeId, tipoImagen, toast, confirmar, lightbox, fecha, fechaHora, iniciales, barraDemo };
})();
