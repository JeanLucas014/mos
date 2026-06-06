/* ============================================================
   JL OS — Dashboard interactions (vanilla, localStorage-backed)
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('jlos:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('jlos:' + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* enable view entrance animation only when focused + motion allowed */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function enableAnim() { if (!reduceMotion) document.documentElement.classList.add('dash-anim'); }
  if (document.hasFocus()) enableAnim();
  window.addEventListener('focus', enableAnim);

  /* ---------- SIDEBAR (mobile) ---------- */
  const side = $('.side'), scrim = $('.scrim'), hamb = $('.hamb');
  function openSide() { side.classList.add('open'); scrim.classList.add('show'); }
  function closeSide() { side.classList.remove('open'); scrim.classList.remove('show'); }
  hamb && hamb.addEventListener('click', openSide);
  scrim && scrim.addEventListener('click', closeSide);

  /* ---------- VIEW SWITCHING ---------- */
  const crumb = $('#crumb-current');
  const validViews = $$('.view').map(v => v.id.replace('view-', ''));
  function showView(id) {
    if (!validViews.includes(id)) id = 'dashboard';
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + id));
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === id));
    const item = $(`.nav-item[data-view="${id}"]`);
    if (item && crumb) crumb.textContent = item.dataset.label || item.textContent.trim();
    LS.set('view', id);
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    closeSide();
    window.scrollTo(0, 0);
  }
  $$('.nav-item[data-view]').forEach(n => n.addEventListener('click', () => showView(n.dataset.view)));
  // jump links inside cards
  $$('[data-jump]').forEach(el => el.addEventListener('click', () => showView(el.dataset.jump)));
  // initial view: hash wins, then last-used, then dashboard
  const hashView = (location.hash || '').replace('#', '');
  showView(hashView || LS.get('view', 'dashboard'));
  window.addEventListener('hashchange', () => {
    const h = (location.hash || '').replace('#', '');
    if (h && validViews.includes(h)) showView(h);
  });

  /* ---------- CLOCK / GREETING ---------- */
  const hr = new Date().getHours();
  const greetWord = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
  const gw = $('#greet-word'); if (gw) gw.textContent = greetWord;
  const dateEl = $('#tb-date');
  if (dateEl) {
    const d = new Date();
    const dias = ['dom','seg','ter','qua','qui','sex','sáb'];
    const mes = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
    dateEl.textContent = `${dias[d.getDay()]} ${String(d.getDate()).padStart(2,'0')} ${mes[d.getMonth()]}`;
  }

  /* ---------- COUNTERS ---------- */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function easeOut(t){return 1-Math.pow(1-t,3);}
  $$('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || '0', 10);
    if (reduce || !document.hasFocus()) { el.textContent = target.toFixed(dec); return; }
    const start = performance.now(), dur = 1200;
    (function f(now){
      const p = Math.min(1,(now-start)/dur);
      el.textContent = (target*easeOut(p)).toFixed(dec);
      if (p<1) requestAnimationFrame(f); else el.textContent = target.toFixed(dec);
    })(start);
  });

  /* ---------- PROGRESS BARS (animate to data-fill) ---------- */
  requestAnimationFrame(() => {
    $$('.bar > i[data-fill]').forEach(i => { i.style.width = i.dataset.fill + '%'; });
    $$('.chart .b[data-h]').forEach(b => { b.style.height = b.dataset.h + '%'; });
  });

  /* ---------- TASKS (rendered into all [data-tasks]) ---------- */
  const defaultTasks = [
    { t: 'Treino longo — 18km', p: 'corrida', done: false },
    { t: 'Deploy v2.1 Super Kart', p: 'nata', done: false },
    { t: 'Revisar proposta AWC Airsoft', p: 'nata', done: true },
    { t: 'Ler 30 páginas', p: 'pessoal', done: false },
    { t: 'Atualizar landing JL OS', p: 'jl os', done: true }
  ];
  let tasks = LS.get('tasks', defaultTasks);
  const taskTargets = $$('[data-tasks]');
  function pendingCount() { return tasks.filter(t => !t.done).length; }
  function renderTasks() {
    taskTargets.forEach(target => {
      target.innerHTML = '';
      tasks.forEach((task, i) => {
        const row = document.createElement('div');
        row.className = 'task' + (task.done ? ' done' : '');
        row.innerHTML = `
          <span class="checkbox"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          <span class="tx"></span>
          <span class="proj"></span>
          <span class="del" title="Remover">×</span>`;
        row.querySelector('.tx').textContent = task.t;
        row.querySelector('.proj').textContent = task.p;
        row.addEventListener('click', (e) => {
          if (e.target.classList.contains('del')) { tasks.splice(i, 1); persistTasks(); return; }
          task.done = !task.done; persistTasks();
        });
        target.appendChild(row);
      });
    });
    [$('#tasks-pending'), $('#tasks-pending-2'), $('#tile-tasks')].forEach(el => { if (el) el.textContent = pendingCount(); });
  }
  function persistTasks() { LS.set('tasks', tasks); renderTasks(); }
  renderTasks();

  function addTaskFrom(input) {
    const v = (input.value || '').trim();
    if (!v) return;
    tasks.unshift({ t: v, p: 'novo', done: false });
    input.value = '';
    persistTasks();
  }
  $$('[data-task-add]').forEach(btn => {
    const input = btn.closest('.add-row').querySelector('[data-task-input]');
    btn.addEventListener('click', () => addTaskFrom(input));
  });
  $$('[data-task-input]').forEach(input => {
    input.addEventListener('keydown', e => { if (e.key === 'Enter') addTaskFrom(input); });
  });

  /* ---------- SHOPPING LIST ---------- */
  const defaultShop = [
    { t: 'Banana e aveia', done: false }, { t: 'Whey protein', done: false },
    { t: 'Café', done: true }, { t: 'Gel de carboidrato (treino longo)', done: false },
    { t: 'Ovos', done: false }, { t: 'Detergente', done: true }
  ];
  let shop = LS.get('shop', defaultShop);
  const shopTargets = $$('[data-shop]');
  function renderShop() {
    shopTargets.forEach(target => {
      target.innerHTML = '';
      shop.forEach((it, i) => {
        const row = document.createElement('div');
        row.className = 'task' + (it.done ? ' done' : '');
        row.innerHTML = `
          <span class="checkbox"><svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          <span class="tx"></span>
          <span class="del" title="Remover">×</span>`;
        row.querySelector('.tx').textContent = it.t;
        row.addEventListener('click', (e) => {
          if (e.target.classList.contains('del')) { shop.splice(i, 1); persistShop(); return; }
          it.done = !it.done; persistShop();
        });
        target.appendChild(row);
      });
    });
    const sp = $('#shop-pending'); if (sp) sp.textContent = shop.filter(s => !s.done).length;
  }
  function persistShop() { LS.set('shop', shop); renderShop(); }
  if (shopTargets.length) renderShop();
  function addShopFrom(input) {
    const v = (input.value || '').trim(); if (!v) return;
    shop.push({ t: v, done: false }); input.value = ''; persistShop();
  }
  $$('[data-shop-add]').forEach(btn => {
    const input = btn.closest('.add-row').querySelector('[data-shop-input]');
    btn.addEventListener('click', () => addShopFrom(input));
  });
  $$('[data-shop-input]').forEach(input => {
    input.addEventListener('keydown', e => { if (e.key === 'Enter') addShopFrom(input); });
  });

  /* ---------- HABITS ---------- */
  const habitDefs = [
    { id: 'run', name: 'Correr', streak: 12 },
    { id: 'read', name: 'Ler 30min', streak: 8 },
    { id: 'water', name: '3L de água', streak: 23 },
    { id: 'code', name: 'Commit diário', streak: 41 }
  ];
  let habits = LS.get('habits', { run:[1,1,1,0,1,1,0], read:[1,0,1,1,1,0,0], water:[1,1,1,1,1,1,0], code:[1,1,1,1,1,1,1] });
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0..Sun=6
  const habitWrap = $('#habit-list');
  function renderHabits() {
    if (!habitWrap) return;
    habitWrap.innerHTML = '';
    const labels = ['S','T','Q','Q','S','S','D'];
    habitDefs.forEach(def => {
      const arr = habits[def.id];
      const doneToday = arr[todayIdx] === 1;
      const row = document.createElement('div');
      row.className = 'habit';
      const days = arr.map((on, i) =>
        `<span class="day${on ? ' on' : ''}${i === todayIdx ? ' today' : ''}" title="${labels[i]}"></span>`).join('');
      row.innerHTML = `
        <div class="hn">${def.name}<div class="streak"><b>${def.streak + (doneToday?1:0)}</b> dias seguidos</div></div>
        <div class="week">${days}</div>
        <button class="htoggle${doneToday ? ' on' : ''}" aria-label="marcar hoje">
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>`;
      row.querySelector('.htoggle').addEventListener('click', () => {
        arr[todayIdx] = arr[todayIdx] === 1 ? 0 : 1;
        LS.set('habits', habits);
        renderHabits();
        updateHabitTile();
      });
      habitWrap.appendChild(row);
    });
  }
  function updateHabitTile() {
    const done = habitDefs.filter(d => habits[d.id][todayIdx] === 1).length;
    const el = $('#tile-habits'); if (el) el.textContent = done;
    const tot = $('#tile-habits-total'); if (tot) tot.textContent = '/' + habitDefs.length;
  }
  renderHabits(); updateHabitTile();

  /* ---------- NOTES (autosave) ---------- */
  const notes = $('#notes-area'), savedEl = $('#notes-saved');
  if (notes) {
    notes.value = LS.get('notes', 'Ideias para o JL OS v2:\n— widget de clima\n— integração com Strava\n— modo foco com pomodoro');
    let tmr;
    notes.addEventListener('input', () => {
      clearTimeout(tmr);
      tmr = setTimeout(() => {
        LS.set('notes', notes.value);
        if (savedEl) {
          savedEl.classList.add('show');
          savedEl.innerHTML = '<b>✓ salvo</b> · localmente';
          setTimeout(() => savedEl.classList.remove('show'), 1800);
        }
      }, 500);
    });
  }
  /* ---------- VAULT (senhas) ---------- */
  const vaultData = [
    { svc: 'GitHub', user: 'jeanlucas', pass: 'gh_9xK2mPq7vL' },
    { svc: 'Vercel', user: 'jean@nata.com', pass: 'vrc_Tz4Rb8nW' },
    { svc: 'Supabase', user: 'admin@nata', pass: 'sb_Qa1Lm6Yd3' },
    { svc: 'WordPress — Nata', user: 'jeanadmin', pass: 'Wp!7HnZ2kQ9' },
    { svc: 'Google Workspace', user: 'jean@nata.com', pass: 'Gw#5Pf8Xc1' }
  ];
  const vaultWrap = $('#vault-list');
  function renderVault() {
    if (!vaultWrap) return;
    vaultWrap.innerHTML = '';
    vaultData.forEach(item => {
      const row = document.createElement('div');
      row.className = 'vault-row';
      let shown = false;
      row.innerHTML = `
        <div><div class="vault-svc"></div><div class="vault-user"></div></div>
        <div class="vault-pass">••••••••••</div>
        <div class="vault-actions">
          <button class="reveal" title="Mostrar/ocultar"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8z" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="1.8" stroke="currentColor" stroke-width="1.2"/></svg></button>
          <button class="copy" title="Copiar"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="9" rx="1.4" stroke="currentColor" stroke-width="1.2"/><path d="M3 11V3a1 1 0 0 1 1-1h7" stroke="currentColor" stroke-width="1.2"/></svg></button>
        </div>`;
      row.querySelector('.vault-svc').textContent = item.svc;
      row.querySelector('.vault-user').textContent = item.user;
      const passEl = row.querySelector('.vault-pass');
      row.querySelector('.reveal').addEventListener('click', () => {
        shown = !shown;
        passEl.textContent = shown ? item.pass : '••••••••••';
      });
      const copyBtn = row.querySelector('.copy');
      copyBtn.addEventListener('click', () => {
        try { navigator.clipboard && navigator.clipboard.writeText(item.pass); } catch (e) {}
        copyBtn.classList.add('copied');
        setTimeout(() => copyBtn.classList.remove('copied'), 1200);
      });
      vaultWrap.appendChild(row);
    });
  }
  renderVault();

  /* ---------- INTEGRATIONS ---------- */
  const integrDefs = [
    { id: 'drive', name: 'Google Drive', mark: 'D', desc: 'Arquivos e backups' },
    { id: 'notion', name: 'Notion', mark: 'N', desc: 'Bases e documentos' },
    { id: 'gcal', name: 'Google Agenda', mark: 'A', desc: 'Eventos do calendário' },
    { id: 'vercel', name: 'Vercel', mark: 'V', desc: 'Deploys dos apps' },
    { id: 'github', name: 'GitHub', mark: 'G', desc: 'Commits e repositórios' },
    { id: 'supabase', name: 'Supabase', mark: 'S', desc: 'Banco de dados' }
  ];
  let integrState = LS.get('integr', { drive:1, notion:1, gcal:1, vercel:1, github:1, supabase:1 });
  const integrWrap = $('#integr-list');
  function renderIntegr() {
    if (!integrWrap) return;
    integrWrap.innerHTML = '';
    integrDefs.forEach(def => {
      const on = integrState[def.id] === 1;
      const row = document.createElement('div');
      row.className = 'vault-row';
      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;">
          <span class="integr-mark display">${def.mark}</span>
          <div><div class="vault-svc">${def.name}</div><div class="vault-user">${def.desc}</div></div>
        </div>
        <span class="pill ${on ? 'green' : 'gray'}"><span class="d"></span>${on ? 'conectado' : 'desconectado'}</span>
        <div class="vault-actions"><button class="conn">${on ? 'Desconectar' : 'Conectar'}</button></div>`;
      const btn = row.querySelector('.conn');
      btn.style.cssText = 'width:auto;padding:0 12px;font-size:11.5px;font-weight:600;';
      btn.addEventListener('click', () => {
        integrState[def.id] = on ? 0 : 1;
        LS.set('integr', integrState);
        renderIntegr();
      });
      integrWrap.appendChild(row);
    });
  }
  renderIntegr();

  /* ---------- CALENDAR (agenda) ---------- */
  const calGrid = $('#cal-grid');
  if (calGrid) {
    const dows = ['S','T','Q','Q','S','S','D'];
    const today = new Date();
    const year = 2026, month = 4; // maio (0-indexed)
    const eventDays = { 6:['g'], 12:['b'], 15:['b','a'], 21:['g'], 28:['g'], 29:['g','b','a'] };
    function buildCal() {
      calGrid.innerHTML = '';
      dows.forEach(d => { const c = document.createElement('div'); c.className = 'cal-dow'; c.textContent = d; calGrid.appendChild(c); });
      const first = new Date(year, month, 1);
      const startDow = (first.getDay() + 6) % 7; // Mon=0
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const prevDays = new Date(year, month, 0).getDate();
      const todayN = (today.getFullYear() === year && today.getMonth() === month) ? today.getDate() : 29;
      // leading
      for (let i = 0; i < startDow; i++) {
        const c = document.createElement('div'); c.className = 'cal-day muted';
        c.innerHTML = `<span class="n">${prevDays - startDow + i + 1}</span>`;
        calGrid.appendChild(c);
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const c = document.createElement('div');
        c.className = 'cal-day' + (d === todayN ? ' today' : '');
        const evs = eventDays[d] ? `<div class="ev">${eventDays[d].map(t => `<i class="${t}"></i>`).join('')}</div>` : '';
        c.innerHTML = `<span class="n">${d}</span>${evs}`;
        c.addEventListener('click', () => {
          calGrid.querySelectorAll('.cal-day.sel').forEach(x => x.classList.remove('sel'));
          c.classList.add('sel');
          const dl = $('#agenda-day'); if (dl) dl.textContent = (d === todayN ? 'Hoje · ' : '') + 'ter ' + d;
        });
        calGrid.appendChild(c);
      }
    }
    buildCal();
  }
})();
