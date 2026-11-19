/* ============================================================
   Ridery Academy · Boost: actividades de memoria, escritura y empatía
   Cada actividad se juega dentro de la página de Boost y guarda su
   puntaje (0-100) con la acción «boostActividad».
   Uso: ElxBoost.jugar(actividad, { el, call, volver })
   ============================================================ */
(function () {
  'use strict';
  const { esc, icon, toast } = window.Elx;
  const K = () => window.ElxBoostContenido;
  const barajar = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const ICONO = { ruta: 'list', pares: 'refresh', flash: 'timer', redaccion: 'edit', minuto: 'timer', esto: 'chat', frases: 'alert', triage: 'up', tono: 'user' };
  const sinTildes = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  let parar = null;

  function marco(o, act, cuerpo) {
    o.el.innerHTML = '<nav class="crumbs"><a href="#" data-volver>Boost</a><span>›</span><span>' + esc(act.nombre) + '</span></nav>' +
      '<div class="stack-sm"><span class="eyebrow">' + esc(act.categoria) + '</span><h1>' + esc(act.nombre) + '</h1><p class="muted" style="max-width:62ch">' + esc(act.descripcion) + '</p></div>' +
      '<div class="card stack bx" id="bx">' + cuerpo + '</div>';
    o.el.querySelector('[data-volver]').addEventListener('click', e => { e.preventDefault(); salir(o); });
    return o.el.querySelector('#bx');
  }
  function salir(o) { if (parar) { parar(); parar = null; } o.volver(); }
  async function terminar(o, act, caja, r, detalle) {
    const puntaje = Math.round(r.total ? r.aciertos / r.total * 100 : r.puntaje || 0);
    let rec = null;
    try { rec = await o.call('boostActividad', { actividad: act.id, puntaje, aciertos: r.aciertos, total: r.total, segundos: r.segundos }); } catch (e) { toast(e.message, 'bad'); }
    const mejor = rec ? rec.resultados.mejor : puntaje;
    caja.innerHTML = '<div class="bx-fin"><b class="num">' + puntaje + '%</b><span>' + (r.total ? r.aciertos + ' de ' + r.total + ' correctas' : 'tu puntaje') + (r.segundos ? ' · ' + r.segundos + ' s' : '') + '</span>' +
      (rec && rec.record ? '<span class="pill pill-ok">' + icon('award') + '¡Nuevo récord!</span>' : '<span class="small muted">Tu mejor marca: ' + mejor + '%</span>') + '</div>' + (detalle || '') +
      '<div class="row"><button class="btn btn-primary" data-otra>' + icon('refresh') + 'Otra vez</button><button class="btn btn-secondary" data-salir>Volver a Boost</button></div>';
    caja.querySelector('[data-otra]').addEventListener('click', () => jugar(act, o));
    caja.querySelector('[data-salir]').addEventListener('click', () => salir(o));
  }
  const reloj = () => { const t0 = Date.now(); return () => Math.round((Date.now() - t0) / 1000); };

  /* ---------- Preguntas de opción (¿Dónde lo busco?, ¿Esto o esto?, Tono) ---------- */
  function preguntas(o, act, items, aPregunta) {
    const caja = marco(o, act, ''), seg = reloj();
    let k = 0, ok = 0; const det = [];
    const pintar = () => {
      const q = aPregunta(items[k]);
      caja.innerHTML = '<div class="row-between"><span class="small muted">Pregunta ' + (k + 1) + ' de ' + items.length + '</span><span class="small muted">' + ok + ' correctas</span></div>' +
        '<div class="bx-q">' + q.html + '</div><div class="bx-ops">' + q.ops.map((t, i) => '<button class="bx-op" data-i="' + i + '">' + esc(t) + '</button>').join('') + '</div><div class="bx-por" hidden></div>';
      caja.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => {
        const i = Number(b.dataset.i), bien = i === q.ok;
        if (bien) ok++; det.push(bien);
        caja.querySelectorAll('[data-i]').forEach(x => { x.disabled = true; const j = Number(x.dataset.i); x.classList.toggle('bien', j === q.ok); x.classList.toggle('mal', j === i && !bien); });
        const por = caja.querySelector('.bx-por'); por.hidden = false;
        por.innerHTML = '<b>' + (bien ? '¡Correcto!' : 'No era esa.') + '</b> ' + esc(q.por || '') + '<div class="row" style="margin-top:10px"><button class="btn btn-primary btn-sm" data-sig>' + (k + 1 < items.length ? 'Siguiente' : 'Ver resultado') + '</button></div>';
        por.querySelector('[data-sig]').addEventListener('click', () => { k++; if (k < items.length) pintar(); else terminar(o, act, caja, { aciertos: ok, total: items.length, segundos: seg() }); });
        por.querySelector('[data-sig]').focus();
      }));
    };
    pintar();
  }

  /* ---------- Pares de memoria ---------- */
  function pares(o, act) {
    const caja = marco(o, act, ''), seg = reloj();
    const ps = barajar(K().pares).slice(0, 6);
    const cartas = barajar(ps.flatMap((p, i) => [{ i, t: p[0], tipo: 't' }, { i, t: p[1], tipo: 's' }]));
    let abiertas = [], hechas = 0, intentos = 0, bloq = false;
    caja.innerHTML = '<div class="row-between"><span class="small muted">Une cada término con su significado</span><span class="small muted" data-int>0 intentos</span></div><div class="bx-mem">' +
      cartas.map((c, k) => '<button class="bx-carta" data-k="' + k + '" aria-label="Carta ' + (k + 1) + '"><span>' + esc(c.t) + '</span></button>').join('') + '</div>';
    caja.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
      if (bloq || b.classList.contains('abierta')) return;
      b.classList.add('abierta'); abiertas.push(b);
      if (abiertas.length < 2) return;
      intentos++; caja.querySelector('[data-int]').textContent = intentos + ' intentos';
      const [x, y] = abiertas.map(e => cartas[Number(e.dataset.k)]);
      if (x.i === y.i && x.tipo !== y.tipo) {
        abiertas.forEach(e => e.classList.add('hecha')); abiertas = []; hechas++;
        if (hechas === ps.length) setTimeout(() => terminar(o, act, caja, { puntaje: Math.max(10, Math.round(100 - (intentos - ps.length) * 6)), segundos: seg() },
          '<p class="small muted">' + intentos + ' intentos para ' + ps.length + ' pares. Menos intentos = mejor memoria.</p>'), 500);
      } else { bloq = true; setTimeout(() => { abiertas.forEach(e => e.classList.remove('abierta')); abiertas = []; bloq = false; }, 900); }
    }));
  }

  /* ---------- Ordenar (Flash de procesos y Triage) ---------- */
  function ordenar(o, act, titulo, correctos, previa) {
    const caja = marco(o, act, ''), seg = reloj();
    const jugarOrden = () => {
      const lista = barajar(correctos.map((t, i) => ({ t, i })));
      let elegidos = [];
      const pintar = () => {
        caja.innerHTML = '<h2>' + esc(titulo) + '</h2><p class="small muted">Toca los elementos en el orden correcto. Toca uno elegido para quitarlo.</p>' +
          '<ol class="bx-orden">' + elegidos.map(e => '<li><button data-quitar="' + e.i + '">' + esc(e.t) + '</button></li>').join('') + '</ol>' +
          '<div class="bx-ops">' + lista.filter(e => !elegidos.includes(e)).map(e => '<button class="bx-op" data-poner="' + e.i + '">' + esc(e.t) + '</button>').join('') + '</div>' +
          (elegidos.length === correctos.length ? '<div class="row"><button class="btn btn-primary" data-listo>' + icon('check') + 'Revisar</button></div>' : '');
        caja.querySelectorAll('[data-poner]').forEach(b => b.addEventListener('click', () => { elegidos.push(lista.find(e => e.i === Number(b.dataset.poner))); pintar(); }));
        caja.querySelectorAll('[data-quitar]').forEach(b => b.addEventListener('click', () => { elegidos = elegidos.filter(e => e.i !== Number(b.dataset.quitar)); pintar(); }));
        const l = caja.querySelector('[data-listo]');
        if (l) l.addEventListener('click', () => {
          const ok = elegidos.filter((e, k) => e.i === k).length;
          terminar(o, act, caja, { aciertos: ok, total: correctos.length, segundos: seg() },
            '<ol class="bx-sol">' + correctos.map((t, k) => '<li class="' + (elegidos[k] && elegidos[k].i === k ? 'bien' : 'mal') + '">' + esc(t) + '</li>').join('') + '</ol><p class="small muted">Este es el orden correcto. En verde, los que pusiste en su lugar.</p>');
        });
      };
      pintar();
    };
    if (!previa) return jugarOrden();
    let s = 20;
    caja.innerHTML = '<h2>' + esc(titulo) + '</h2><p class="small muted">Memoriza el orden. Desaparece en <b data-s>' + s + '</b> segundos.</p><ol class="bx-sol">' + correctos.map(t => '<li>' + esc(t) + '</li>').join('') + '</ol>' +
      '<div class="row"><button class="btn btn-secondary btn-sm" data-ya>Ya lo memoricé</button></div>';
    const t = setInterval(() => { s--; const e = caja.querySelector('[data-s]'); if (e) e.textContent = s; if (s <= 0) { clearInterval(t); jugarOrden(); } }, 1000);
    parar = () => clearInterval(t);
    caja.querySelector('[data-ya]').addEventListener('click', () => { clearInterval(t); jugarOrden(); });
  }

  /* ---------- Escribir (Redacción y Respuesta en 1 minuto) ---------- */
  function revisar(texto, claves) {
    const notas = (window.ElxHandlers && window.ElxHandlers.revisarOrtografia) ? window.ElxHandlers.revisarOrtografia(texto) : [];
    const t = sinTildes(texto), faltan = (claves || []).filter(grupo => !grupo.some(c => t.includes(sinTildes(c))));
    return { notas, faltan };
  }
  function redaccion(o, act) {
    const items = barajar(K().redaccion).slice(0, 3), caja = marco(o, act, ''), seg = reloj();
    let k = 0, suma = 0; const det = [];
    const pintar = () => {
      const it = items[k];
      caja.innerHTML = '<span class="small muted">Mensaje ' + (k + 1) + ' de ' + items.length + '</span><div class="bx-mal">' + esc(it.mal) + '</div><p class="small"><b>Idea:</b> ' + esc(it.idea) + '</p>' +
        '<textarea class="textarea" rows="4" data-txt placeholder="Escribe aquí tu versión" spellcheck="false"></textarea><div class="row"><button class="btn btn-primary" data-rev>Revisar</button></div><div data-res></div>';
      const ta = caja.querySelector('[data-txt]'); ta.focus();
      caja.querySelector('[data-rev]').addEventListener('click', () => {
        const txt = ta.value.trim(); if (txt.length < 15) return toast('Escribe un mensaje completo.', 'bad');
        const r = revisar(txt, it.claves), p = Math.max(0, 100 - r.notas.length * 15 - r.faltan.length * 20);
        suma += p; det.push(p);
        caja.querySelector('[data-rev]').disabled = true; ta.readOnly = true;
        caja.querySelector('[data-res]').innerHTML = '<div class="bx-por"><b>' + p + ' puntos.</b>' + (r.notas.length || r.faltan.length ? '<ul>' + r.notas.map(n => '<li>' + esc(n) + '</li>').join('') + (r.faltan.length ? '<li>Te faltó tocar la idea principal (' + esc(it.idea) + ')</li>' : '') + '</ul>' : ' ¡Muy bien escrito!') +
          '<div class="row" style="margin-top:10px"><button class="btn btn-primary btn-sm" data-sig>' + (k + 1 < items.length ? 'Siguiente' : 'Ver resultado') + '</button></div></div>';
        caja.querySelector('[data-sig]').addEventListener('click', () => { k++; if (k < items.length) pintar(); else terminar(o, act, caja, { puntaje: Math.round(suma / items.length), segundos: seg() }); });
      });
    };
    pintar();
  }
  function minuto(o, act) {
    const it = barajar(K().minuto)[0], caja = marco(o, act, '');
    let s = 60, t = null;
    caja.innerHTML = '<div class="bx-caso">' + esc(it.caso) + '</div><p class="small muted">Tienes 60 segundos. Incluye <b>saludo</b>, <b>la solución</b> y <b>un cierre</b>.</p>' +
      '<div class="row-between"><span class="pill pill-warn" data-s>' + icon('timer') + '60 s</span></div><textarea class="textarea" rows="5" data-txt placeholder="Empieza a escribir y arranca el reloj…" spellcheck="false"></textarea>' +
      '<div class="row"><button class="btn btn-primary" data-env>Enviar</button></div>';
    const ta = caja.querySelector('[data-txt]'); ta.focus();
    const fin = () => {
      clearInterval(t); parar = null;
      const txt = ta.value.trim(), tt = sinTildes(txt);
      const saludo = /\b(hola|buen[oa]s?)\b/.test(tt), accion = it.accion.some(a => tt.includes(sinTildes(a))), cierre = /(algo mas|quedo atent|quedamos atent|a la orden|gracias|que disfrutes|te aviso|cualquier cosa)/.test(tt);
      const notas = revisar(txt, []).notas;
      const p = Math.max(0, (saludo ? 30 : 0) + (accion ? 40 : 0) + (cierre ? 30 : 0) - notas.length * 8);
      terminar(o, act, caja, { puntaje: p, segundos: 60 - s }, '<ul class="bx-check"><li class="' + (saludo ? 'bien' : 'mal') + '">Saludo</li><li class="' + (accion ? 'bien' : 'mal') + '">Solución concreta del caso</li><li class="' + (cierre ? 'bien' : 'mal') + '">Cierre</li></ul>' +
        (notas.length ? '<ul class="small muted">' + notas.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul>' : '') + '<div class="bx-mal">' + esc(txt || '(sin respuesta)') + '</div>');
    };
    ta.addEventListener('input', () => {
      if (t) return;
      t = setInterval(() => { s--; const e = caja.querySelector('[data-s]'); if (e) e.innerHTML = icon('timer') + s + ' s'; if (s <= 0) fin(); }, 1000);
      parar = () => clearInterval(t);
    }, { once: true });
    caja.querySelector('[data-env]').addEventListener('click', fin);
  }

  /* ---------- Frases prohibidas ---------- */
  function frases(o, act) {
    const fs = barajar(K().frases).slice(0, 10), caja = marco(o, act, ''), seg = reloj(), marcadas = new Set();
    caja.innerHTML = '<p class="small muted">Toca todas las frases que <b>no</b> se deben decir a un cliente.</p><div class="bx-frases">' + fs.map((f, i) => '<button class="bx-frase" data-f="' + i + '">' + esc(f.t) + '</button>').join('') + '</div><div class="row"><button class="btn btn-primary" data-listo>' + icon('check') + 'Revisar</button></div>';
    caja.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { const i = Number(b.dataset.f); marcadas.has(i) ? marcadas.delete(i) : marcadas.add(i); b.classList.toggle('marcada'); }));
    caja.querySelector('[data-listo]').addEventListener('click', () => {
      const ok = fs.filter((f, i) => f.mala === marcadas.has(i)).length;
      terminar(o, act, caja, { aciertos: ok, total: fs.length, segundos: seg() }, '<div class="bx-frases">' + fs.map((f, i) => '<span class="bx-frase ' + (f.mala === marcadas.has(i) ? 'bien' : 'mal') + '">' + (f.mala ? '🚫 ' : '✅ ') + esc(f.t) + '</span>').join('') + '</div><p class="small muted">🚫 = no se dice · en rojo, las que marcaste mal.</p>');
    });
  }

  /* ---------- Entrada ---------- */
  function jugar(act, o) {
    if (parar) { parar(); parar = null; }
    const c = K();
    if (act.id === 'ruta') return preguntas(o, act, barajar(c.ruta).slice(0, 6), it => { const ops = barajar(it.ops.map((t, i) => ({ t, i }))); return { html: '<p>' + esc(it.p) + '</p>', ops: ops.map(x => x.t), ok: ops.findIndex(x => x.i === it.ok), por: it.por }; });
    if (act.id === 'esto') return preguntas(o, act, barajar(c.esto).slice(0, 5), it => { const ab = barajar([['a', it.a], ['b', it.b]]); return { html: '<p class="bx-cli">' + esc(it.caso) + '</p><p class="small muted">¿Qué responderías?</p>', ops: ab.map(x => x[1]), ok: ab.findIndex(x => x[0] === it.ok), por: it.por }; });
    if (act.id === 'tono') { const tonos = ['Molesto', 'Confundido', 'Urgido', 'Tranquilo']; return preguntas(o, act, barajar(c.tono).slice(0, 6), it => ({ html: '<p class="bx-cli">' + esc(it.t) + '</p><p class="small muted">¿Cómo se siente este cliente?</p>', ops: tonos, ok: tonos.indexOf(it.ok), por: 'Reconocer el tono te ayuda a elegir cómo responder: al molesto, empatía y acción; al confundido, pasos claros; al urgido, rapidez.' })); }
    if (act.id === 'pares') return pares(o, act);
    if (act.id === 'flash') { const f = barajar(c.flash)[0]; return ordenar(o, act, f.titulo, f.pasos, true); }
    if (act.id === 'triage') { const t = barajar(c.triage)[0]; return ordenar(o, act, t.titulo + ' · del más urgente al menos urgente', t.casos, false); }
    if (act.id === 'redaccion') return redaccion(o, act);
    if (act.id === 'minuto') return minuto(o, act);
    if (act.id === 'frases') return frases(o, act);
  }
  function tarjeta(a) {
    const r = a.resultados || {};
    return '<article class="boost-card"><div class="row-between"><span class="boost-ic">' + icon(ICONO[a.id] || 'bolt') + '</span>' + (r.mejor != null ? '<span class="pill ' + (r.mejor >= 80 ? 'pill-ok' : 'pill-warn') + '">Mejor: ' + r.mejor + '%</span>' : '<span class="pill">Sin intentos</span>') + '</div>' +
      '<div class="stack-sm" style="gap:4px"><h2>' + esc(a.nombre) + '</h2><p class="muted small">' + esc(a.descripcion) + '</p></div>' +
      '<div class="row-between"><span class="small muted">' + (r.intentos || 0) + (r.intentos === 1 ? ' intento' : ' intentos') + '</span><button class="btn btn-primary" data-boost="' + esc(a.id) + '">' + icon('play') + 'Practicar</button></div></article>';
  }
  window.ElxBoost = { jugar, tarjeta, salir: () => { if (parar) { parar(); parar = null; } } };
})();
