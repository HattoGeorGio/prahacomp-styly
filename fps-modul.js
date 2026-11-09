/* =====================================================================
   FPS-MODUL.JS — „Výkon ve vašich hrách“ na detailu herního PC / notebooku
   PrahaComp.cz

   Co dělá:
   1) Na detailu produktu přečte název, parametry a popis (procesor, grafika,
      RAM, případně displej) a rozpozná sestavu.
   2) Pod fotkami produktu (před „Související produkty“) vloží modul, kde si
      návštěvník vybere hru, kvalitu, rozlišení, upscaling (DLSS/FSR),
      ray tracing a generování snímků a hned uvidí odhad FPS.
   3) Nic nevkládá, pokud produkt není herní PC / notebook nebo se nepodaří
      rozpoznat grafickou kartu — stránka zůstane beze změny.

   Závisí na: PCFPS (fps-engine.js) a PCFPS_DATA (fps-data.js).
   Rollback: smazat <script> řádek fps-loader.js ze Záhlaví.
   ===================================================================== */
(function () {
  'use strict';
  var E = window.PCFPS;
  if (!E) return;
  if (document.getElementById('pcfps')) return;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function txt(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function reduced() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  /* ---------------- 1) čtení stránky ---------------- */
  function readPage() {
    var title = txt($('h1'));
    var shortD = txt($('.p-short-description'));
    var descEl = $('#description .basic-description') || $('#description');
    var desc = txt(descEl);
    var rows = $$('.extended-description table tr, .p-detail-tabs table tr');
    var params = [], vram = 0, cores = 0, m;
    rows.forEach(function (r) {
      var th = txt($('th', r)).replace(/^\?\s*/, ''), td = txt($('td', r));
      if (!th) { var all = txt(r).replace(/^\?\s*/, ''); var ix = all.indexOf(':'); if (ix > 0) { th = all.slice(0, ix); td = all.slice(ix + 1).trim(); } }
      if (!th || !td) return;
      params.push(th + ': ' + td);
      if (/VRAM|paměti GPU/i.test(th) && (m = /(\d{1,2})/.exec(td))) vram = +m[1];
      if (/počet jader/i.test(th) && (m = /(\d{1,2})/.exec(td))) cores = +m[1];
    });
    var crumbs = $$('.breadcrumbs a, #navigator a').map(txt).join(' > ');
    var cls = document.body.className || '';
    return { title: title, short: shortD, desc: desc, params: params.join(' | '), vram: vram, cores: cores, crumbs: crumbs, cls: cls };
  }

  function isGamingProduct(p) {
    if (/\bin-herni-pocitace\b|\bin-herni-notebooky\b/.test(p.cls)) return true;
    if (/Herní (počítače|notebooky)/i.test(p.crumbs)) return true;
    if (/(Počítače|Notebooky)/i.test(p.crumbs) && /herní|gaming|gamer/i.test(p.title)) return true;
    return false;
  }

  var page = readPage();
  if (!isGamingProduct(page)) return;
  var laptop = /\bin-herni-notebooky\b/.test(page.cls) || /notebook/i.test(page.crumbs);
  var cfg = E.parseConfig({ title: page.title, short: page.short, desc: page.desc, params: page.params, vram: page.vram, cores: page.cores, isLaptop: laptop });
  if (!cfg.gpu) return;
  var anchor = $('.p-detail-inner');
  if (!anchor || !anchor.parentNode) return;

  /* ---------------- 2) stav ---------------- */
  var games = E.games;
  var state = {
    game: 'cs2', preset: 'high', res: cfg.res || 1080, up: 'off', rt: false, fg: 0,
    search: '', sort: 'perf'
  };
  var gameById = {};
  games.forEach(function (g) { gameById[g.id] = g; });

  function cur() { return gameById[state.game]; }
  function normState() {
    var sup = E.gameTech(cfg, cur());
    if (!sup.up) state.up = 'off';
    if (!sup.rt) state.rt = false;
    if (!sup.fg) state.fg = 0; else if (state.fg > sup.fg) state.fg = sup.fg;
    return sup;
  }
  function optsFor(extra) {
    var o = { res: state.res, preset: state.preset, up: state.up, rt: state.rt, fg: state.fg };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }

  /* ---------------- 3) kostra ---------------- */
  var ICON_BOLT = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M13.2 2 4.5 13.4c-.4.5 0 1.2.6 1.2h5.2l-1.4 7c-.1.7.8 1 1.2.4l8.7-11.5c.4-.5 0-1.2-.6-1.2h-5.2l1.4-6.9c.2-.7-.8-1-1.2-.4Z"/></svg>';
  var ICON_CPU = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M9 2h2v2h2V2h2v2h1a2 2 0 0 1 2 2v1h2v2h-2v2h2v2h-2v2h2v2h-2v1a2 2 0 0 1-2 2h-1v2h-2v-2h-2v2H9v-2H8a2 2 0 0 1-2-2v-1H4v-2h2v-2H4v-2h2V9H4V7h2V6a2 2 0 0 1 2-2h1V2Zm-1 4v12h8V6H8Zm2 2h4v8h-4V8Z"/></svg>';
  var ICON_GPU = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M3 6h2v2h16v9h-3v2h-3v-2H9v2H6v-2H3V6Zm4 4v5h12v-5H7Zm3 1h2.5a1.5 1.5 0 0 1 0 3H10v-3Zm5 0h2v3h-2v-3Z"/></svg>';
  var ICON_RAM = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M3 7h18v8h-1v3h-2v-3h-2v3h-2v-3h-2v3h-2v-3H8v3H6v-3H4v-0H3V7Zm2 2v4h14V9H5Zm2 1h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z"/></svg>';
  var ICON_HZ = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M3 5h18v11H3V5Zm2 2v7h14V7H5Zm4 11h6v2H9v-2Z"/></svg>';
  var ICON_INFO = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 5h2v2h-2V7Zm0 4h2v6h-2v-6Z"/></svg>';
  var ICON_WARN = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2 1 21h22L12 2Zm-1 7h2v6h-2V9Zm0 8h2v2h-2v-2Z"/></svg>';
  var ICON_OK = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.4-4-4 1.4-1.4 2.6 2.6 5-5 1.4 1.4-6.4 6.4Z"/></svg>';
  var ICON_SEARCH = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M10 2a8 8 0 0 1 6.3 12.9l5.4 5.4-1.4 1.4-5.4-5.4A8 8 0 1 1 10 2Zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"/></svg>';
  var ICON_ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="m9 5 7 7-7 7-1.5-1.5L13 12 7.5 6.5 9 5Z"/></svg>';

  function chip(cls, icon, label, val, est) {
    return '<li class="pcfps__chip ' + cls + '"><span class="pcfps__chipico">' + icon + '</span><span class="pcfps__chiptxt"><small>' + label + '</small><b>' + esc(val) + '</b></span></li>';
  }

  var chips = '';
  chips += chip('pcfps__chip--cpu', ICON_CPU, 'Procesor', cfg.cpu ? cfg.cpu.name : 'Nerozpoznán (průměr)', cfg.cpu && cfg.cpu.est);
  chips += chip('pcfps__chip--gpu', ICON_GPU, 'Grafika', cfg.gpu.name + ' · ' + cfg.gpu.vram + ' GB', cfg.gpu.est);
  chips += chip('pcfps__chip--ram', ICON_RAM, 'Paměť', cfg.ramGB ? cfg.ramGB + ' GB' + (cfg.ddr ? ' DDR' + cfg.ddr : '') : 'Neuvedena (16 GB)', false);
  if (cfg.hz) chips += chip('pcfps__chip--hz', ICON_HZ, 'Displej', cfg.hz + ' Hz', false);

  var html = '' +
    '<div class="pcfps__head">' +
      '<div class="pcfps__titlebox">' +
        '<span class="pcfps__ico">' + ICON_BOLT + '</span>' +
        '<div><h2 class="pcfps__h" id="pcfps-h">Výkon ve vašich hrách</h2>' +
        '<p class="pcfps__sub">Odhad snímků za sekundu přesně pro tuto sestavu. Konfiguraci jsme načetli z popisu produktu.</p></div>' +
      '</div>' +
      '<div class="pcfps__res" aria-live="polite" aria-atomic="true">' +
        '<div class="pcfps__fpsrow"><span class="pcfps__num" data-el="num">0</span><span class="pcfps__unit">FPS</span></div>' +
        '<span class="pcfps__verdict" data-el="verdict"></span>' +
        '<div class="pcfps__low" data-el="low"></div>' +
      '</div>' +
    '</div>' +
    '<ul class="pcfps__chips" aria-label="Rozpoznaná sestava">' + chips + '</ul>' +
    '<div class="pcfps__panel">' +
      '<div class="pcfps__searchrow">' +
        '<label class="pcfps__search"><span class="pcfps__sr">Hledat hru</span>' + ICON_SEARCH + '<input type="search" data-el="search" placeholder="Hledat hru…" autocomplete="off" spellcheck="false"></label>' +
        '<div class="pcfps__arrows"><button type="button" class="pcfps__arrow pcfps__arrow--l" data-act="scroll-l" aria-label="Předchozí hry">' + ICON_ARROW + '</button><button type="button" class="pcfps__arrow" data-act="scroll-r" aria-label="Další hry">' + ICON_ARROW + '</button></div>' +
      '</div>' +
      '<div class="pcfps__games" data-el="games" role="group" aria-label="Výběr hry"></div>' +
      '<p class="pcfps__empty" data-el="empty" hidden>Žádná hra neodpovídá hledání.</p>' +
      '<div class="pcfps__game" data-el="gameinfo"></div>' +
      '<div class="pcfps__controls">' +
        '<div class="pcfps__ctl"><span class="pcfps__lbl" id="pcfps-l1">Kvalita detailů</span><div class="pcfps__seg" role="group" aria-labelledby="pcfps-l1" data-grp="preset"></div></div>' +
        '<div class="pcfps__ctl"><span class="pcfps__lbl" id="pcfps-l2">Rozlišení</span><div class="pcfps__seg" role="group" aria-labelledby="pcfps-l2" data-grp="res"></div></div>' +
        '<div class="pcfps__ctl"><span class="pcfps__lbl" id="pcfps-l3">Upscaling <em data-el="upname"></em></span><div class="pcfps__seg" role="group" aria-labelledby="pcfps-l3" data-grp="up"></div></div>' +
        '<div class="pcfps__ctl pcfps__ctl--sw" data-el="swbox"></div>' +
      '</div>' +
      '<div class="pcfps__meter" aria-hidden="true"><div class="pcfps__track"><div class="pcfps__fill" data-el="fill"></div><div class="pcfps__hz" data-el="hz" hidden></div></div><ul class="pcfps__ticks" data-el="ticks"></ul></div>' +
      '<div class="pcfps__insights" data-el="insights"></div>' +
    '</div>' +
    '<details class="pcfps__more" data-el="more">' +
      '<summary><span>Přehled všech her při tomto nastavení</span></summary>' +
      '<div class="pcfps__moretools"><span>Řadit:</span><button type="button" class="pcfps__pill" data-act="sort-perf" aria-pressed="true">Podle výkonu</button><button type="button" class="pcfps__pill" data-act="sort-abc" aria-pressed="false">Abecedně</button></div>' +
      '<div class="pcfps__list" data-el="list"></div>' +
    '</details>' +
    '<details class="pcfps__how">' +
      '<summary><span>Jak odhad vzniká</span></summary>' +
      '<div class="pcfps__howtxt">' +
        '<p>Výkon grafiky vychází z naměřených výsledků nezávislých testů (Tom\'s Hardware, desítky moderních her ve Full HD, QHD a 4K). Výkon procesoru z herních testů procesorů. Do výpočtu vstupuje i velikost grafické paměti, počet jader procesoru a kapacita RAM, protože i ty ovlivňují plynulost.</p>' +
        '<p>Pro každou hru známe její nároky (náročná na grafiku, nebo spíš na procesor), podporu DLSS / FSR, ray tracingu a generování snímků. Odhad bere nižší z obou limitů, tedy grafiku nebo procesor.</p>' +
        '<p><b>Jde o orientační odhad.</b> Skutečné FPS závisí na verzi hry, ovladačích, scéně a nastavení Windows. Hodnota „1 % low“ ukazuje, kolik snímků za sekundu bude i v nejhorších okamžicích.</p>' +
      '</div>' +
    '</details>';

  var sec = document.createElement('section');
  sec.id = 'pcfps';
  sec.className = 'pcfps';
  sec.setAttribute('aria-labelledby', 'pcfps-h');
  sec.innerHTML = html;

  /* ---------------- 4) dílčí vykreslení ---------------- */
  var el = {};
  $$('[data-el]', sec).forEach(function (n) { el[n.getAttribute('data-el')] = n; });

  function segBtns(grp, items) {
    var box = $('[data-grp="' + grp + '"]', sec);
    box.innerHTML = items.map(function (it) {
      return '<button type="button" class="pcfps__segb" data-grp-val="' + grp + ':' + it.v + '" aria-pressed="false"' + (it.dis ? ' disabled' : '') + (it.title ? ' title="' + esc(it.title) + '"' : '') + '>' + esc(it.l) + '</button>';
    }).join('');
  }
  function setPressed() {
    $$('[data-grp-val]', sec).forEach(function (b) {
      var pr = b.getAttribute('data-grp-val').split(':'), on = false;
      if (pr[0] === 'preset') on = state.preset === pr[1];
      else if (pr[0] === 'res') on = String(state.res) === pr[1];
      else if (pr[0] === 'up') on = state.up === pr[1];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function renderControls(sup) {
    segBtns('preset', E.PRESETS.map(function (p) { return { v: p, l: E.PRESET_LABEL[p] }; }));
    segBtns('res', E.RESOLUTIONS.map(function (r) { return { v: r, l: E.RES_LABEL[r], title: E.RES_PX[r] }; }));
    var ups = ['off', 'q', 'b', 'p'].map(function (u) {
      return { v: u, l: E.UPSCALE[u].label, dis: u !== 'off' && !sup.up, title: (u !== 'off' && !sup.up) ? 'Tato hra upscaling nepodporuje.' : '' };
    });
    segBtns('up', ups);
    el.upname.textContent = sup.up ? '· ' + sup.upName : '';
    /* přepínače RT a FG */
    var sw = '';
    var rtOk = sup.rt, fgOk = sup.fg > 0;
    sw += '<div class="pcfps__swrow"><button type="button" class="pcfps__sw" role="switch" data-sw="rt" aria-checked="' + (state.rt ? 'true' : 'false') + '"' + (rtOk ? '' : ' disabled') + '><span class="pcfps__swk"></span><span class="pcfps__swl">Ray tracing' + (rtOk ? '' : ' <small>' + (cur().rt > 0 ? '(grafika nepodporuje)' : '(hra nemá)') + '</small>') + '</span></button></div>';
    if (sup.fg === 2) {
      sw += '<div class="pcfps__swrow"><button type="button" class="pcfps__sw" role="switch" data-sw="fg" aria-checked="' + (state.fg ? 'true' : 'false') + '"><span class="pcfps__swk"></span><span class="pcfps__swl">' + 'Generování snímků' + '</span></button>' +
        '<span class="pcfps__swmode" ' + (state.fg ? '' : 'hidden') + '><button type="button" class="pcfps__pill" data-fgm="1" aria-pressed="' + (state.fg === 1) + '">2×</button><button type="button" class="pcfps__pill" data-fgm="2" aria-pressed="' + (state.fg === 2) + '">4×</button></span></div>';
    } else {
      sw += '<div class="pcfps__swrow"><button type="button" class="pcfps__sw" role="switch" data-sw="fg" aria-checked="' + (state.fg ? 'true' : 'false') + '"' + (fgOk ? '' : ' disabled') + '><span class="pcfps__swk"></span><span class="pcfps__swl">Generování snímků' + (fgOk ? ' <small>' + esc(sup.fgName.replace('DLSS Frame Generation', 'DLSS FG').replace('AMD FSR Frame Generation', 'FSR FG')) + '</small>' : ' <small>' + (cur().fg ? '(grafika nepodporuje)' : '(hra nemá)') + '</small>') + '</span></button></div>';
    }
    el.swbox.innerHTML = sw;
    setPressed();
  }

  function levelClass(v) { return 'pcfps--' + v.id; }

  function tileFps(g) {
    var sup = E.gameTech(cfg, g);
    var e = E.estimate(cfg, g, { res: state.res, preset: state.preset, up: (state.up !== 'off' && sup.up) ? state.up : 'off', rt: state.rt && sup.rt, fg: (state.fg && sup.fg) ? Math.min(state.fg, sup.fg) : 0 });
    return e;
  }

  /* Oficiální bannery ze Steamu (hotlink, nic nekopírujeme na vlastní server).
     Hry bez Steam stránky (Fortnite, Valorant, LoL, WoW, Tarkov, Alan Wake II) mají barevný štítek. */
  var STEAM = { cs2: 730, dota2: 570, r6: 359550, ow2: 2357570, rocketleague: 252950, apex: 1172470, warzone: 1938090,
    pubg: 578080, marvelrivals: 2767030, bf6: 2807960, arcraiders: 1808500, doomtda: 3017860, cyberpunk: 1091500,
    witcher3: 292030, bg3: 1086940, eldenring: 1245620, clairobscur: 1903340, hogwarts: 990080, stalker2: 1643320,
    rdr2: 1174180, gta5: 271590, spiderman2: 2651280, wukong: 2358720, mhwilds: 2246340, acshadows: 3159330,
    helldivers2: 553850, fh5: 1551360, poe2: 2694490 };
  var STEAM_FILE = { bf6: 'library_hero.jpg' }; // header.jpg je u BF6 prázdný
  function artUrl(g) {
    var id = STEAM[g.id];
    return id ? 'https://cdn.akamai.steamstatic.com/steam/apps/' + id + '/' + (STEAM_FILE[g.id] || 'header.jpg') : '';
  }

  function buildTiles() {
    el.games.innerHTML = games.map(function (g) {
      var u = artUrl(g);
      var img = u ? '<img class="pcfps__img" src="' + u + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" width="460" height="215">' : '';
      return '<button type="button" class="pcfps__tile" data-game="' + g.id + '" aria-pressed="false" style="--h:' + g.hue + '">' +
        '<span class="pcfps__art' + (u ? ' pcfps__art--photo' : '') + '"><span class="pcfps__mono">' + esc(g.short) + '</span>' + img + '<span class="pcfps__year">' + g.year + '</span></span>' +
        '<span class="pcfps__tname">' + esc(g.name) + '</span>' +
        '<span class="pcfps__tfps" data-tfps></span></button>';
    }).join('');
    // když se banner nenačte (síť, blokace), vrátí se barevný štítek s názvem
    el.games.addEventListener('error', function (ev) {
      var t = ev.target;
      if (t && t.tagName === 'IMG') { var a = t.parentNode; a.className = a.className.replace(' pcfps__art--photo', ''); a.removeChild(t); }
    }, true);
  }
  function updateTiles() {
    var q = state.search.toLowerCase(), shown = 0;
    $$('.pcfps__tile', sec).forEach(function (b) {
      var g = gameById[b.getAttribute('data-game')];
      var hit = !q || g.name.toLowerCase().indexOf(q) >= 0 || g.short.toLowerCase().indexOf(q) >= 0 || g.genre.toLowerCase().indexOf(q) >= 0;
      b.hidden = !hit;
      if (hit) shown++;
      b.setAttribute('aria-pressed', g.id === state.game ? 'true' : 'false');
      var e = tileFps(g), f = $('[data-tfps]', b);
      if (!e.supported) { f.textContent = 'Nejde'; f.className = 'pcfps__tfps pcfps__tfps--bad'; }
      else { var v = E.verdict(e.fps); f.textContent = Math.round(e.fps) + ' FPS'; f.className = 'pcfps__tfps pcfps__tfps--' + v.id; }
    });
    el.empty.hidden = shown > 0;
  }

  var shownNum = 0, raf = 0;
  function animateTo(n) {
    var node = el.num;
    if (reduced() || !window.requestAnimationFrame) { node.textContent = n; shownNum = n; return; }
    cancelAnimationFrame(raf);
    var from = shownNum, t0 = null, dur = 380;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(from + (n - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step); else shownNum = n;
    }
    raf = requestAnimationFrame(step);
    setTimeout(function () { node.textContent = n; shownNum = n; }, dur + 120);
  }

  function fmtSetting(o) {
    var s = E.RES_LABEL[o.res] + ' · ' + E.PRESET_LABEL[o.preset];
    if (o.up && o.up !== 'off') s += ' + ' + E.UPSCALE[o.up].label.toLowerCase() + ' upscaling';
    return s;
  }

  function insight(kind, icon, html) {
    return '<div class="pcfps__ins pcfps__ins--' + kind + '"><span class="pcfps__insico">' + icon + '</span><div>' + html + '</div></div>';
  }

  function renderResult() {
    var g = cur(), sup = E.gameTech(cfg, g);
    var e = E.estimate(cfg, g, optsFor());
    var ins = '';

    el.gameinfo.innerHTML = '<span class="pcfps__gname">' + esc(g.name) + '</span><span class="pcfps__gmeta">' + esc(g.genre) + ' · ' + g.year + '</span>';

    if (!e.supported) {
      animateTo(0);
      el.verdict.textContent = 'Nepodporováno';
      el.verdict.className = 'pcfps__verdict pcfps__verdict--bad';
      el.low.textContent = '';
      sec.className = sec.className.replace(/\bpcfps--\w+/g, '').trim() + ' pcfps--bad';
      el.fill.style.width = '0%';
      el.insights.innerHTML = insight('warn', ICON_WARN, '<b>' + esc(e.reason) + '</b> Tato sestava ji nespustí, doporučujeme zvolit jinou hru nebo modernější grafickou kartu.');
      return;
    }

    var fps = Math.round(e.fps), v = E.verdict(fps);
    animateTo(fps);
    el.verdict.textContent = v.label;
    el.verdict.className = 'pcfps__verdict pcfps__verdict--' + v.id;
    el.low.innerHTML = '1 % low <b>' + Math.round(e.low) + '</b> FPS';
    sec.className = sec.className.replace(/\bpcfps--\w+/g, '').trim() + ' ' + levelClass(v);

    /* meter */
    var max = fps > 240 ? 480 : 240;
    el.fill.style.width = Math.max(1.5, Math.min(100, fps / max * 100)) + '%';
    var tk = max === 240 ? [30, 60, 120, 144, 240] : [60, 144, 240, 360, 480];
    el.ticks.innerHTML = tk.map(function (t) { return '<li style="left:' + (t / max * 100) + '%">' + t + '</li>'; }).join('');
    if (cfg.hz && cfg.hz <= max) { el.hz.hidden = false; el.hz.style.left = (cfg.hz / max * 100) + '%'; el.hz.title = 'Obnovovací frekvence displeje: ' + cfg.hz + ' Hz'; }
    else el.hz.hidden = true;

    /* poznámky */
    var lim = e.limiter;
    if (lim === 'gpu') ins += insight('info', ICON_INFO, '<b>Výkon omezuje grafická karta.</b> Nižší detaily, nižší rozlišení nebo upscaling FPS zvýší.');
    else if (lim === 'cpu') ins += insight('info', ICON_INFO, '<b>Výkon omezuje procesor.</b> Vyšší rozlišení nebo kvalita FPS skoro neovlivní, protože grafika má rezervu.');
    else if (lim === 'cap') ins += insight('info', ICON_INFO, '<b>Hra má pevný strop ' + g.max + ' FPS.</b> Víc snímků nabídne jen s úpravou souborů hry.');
    else ins += insight('ok', ICON_OK, '<b>Vyvážená sestava.</b> Grafika i procesor se v této hře využijí podobně.');

    if (e.vramOver) ins += insight('warn', ICON_WARN, '<b>Málo grafické paměti.</b> Při tomto nastavení hra potřebuje cca ' + (Math.round(e.vramNeed * 2) / 2) + ' GB VRAM, karta má ' + cfg.gpu.vram + ' GB. Čekejte záseky, nižší detaily nebo upscaling pomůžou.');
    if (e.ramLimited) ins += insight('warn', ICON_WARN, '<b>Jen ' + cfg.ramGB + ' GB RAM.</b> Moderní hry potřebují alespoň 16 GB, výkon je kvůli tomu nižší.');
    if (e.cores4) ins += insight('warn', ICON_WARN, '<b>Čtyřjádrový procesor.</b> Nové hry využívají víc jader, mohou se objevit záseky.');
    if (e.fgMode) ins += insight('info', ICON_INFO, '<b>Generování snímků</b> zvyšuje plynulost obrazu, ne rychlost odezvy. Hrát se doporučuje, když bez něj dosáhnete aspoň ' + (fps > 150 ? '45' : '40') + ' FPS (nyní zhruba ' + Math.round(e.base) + ' FPS).');
    if (cfg.hz) {
      if (fps >= cfg.hz) ins += insight('ok', ICON_OK, 'Displej s <b>' + cfg.hz + ' Hz</b> využijete naplno.');
      else ins += insight('info', ICON_INFO, 'Displej má <b>' + cfg.hz + ' Hz</b>, při tomto nastavení ho nevyužijete celý. Pomůže nižší kvalita nebo upscaling.');
    }

    /* doporučení */
    var rec = E.recommend(cfg, g, 60, true);
    {
      if (rec) {
        var rs = fmtSetting({ res: rec.res, preset: rec.preset, up: rec.up });
        ins += insight('rec', ICON_BOLT, 'Doporučené nastavení pro <b>60+ FPS</b>: <b>' + esc(rs) + '</b> (zhruba ' + Math.round(rec.fps) + ' FPS).');
      } else {
        ins += insight('warn', ICON_WARN, 'V této hře sestava 60 FPS ani na nejnižším nastavení nedosáhne. Na příběhových hrách může stačit 30 FPS.');
      }
    }
    el.insights.innerHTML = ins;
  }

  function renderOverview() {
    if (!el.more.open) return;
    var rows = E.overview(cfg, { res: state.res, preset: state.preset, up: state.up, rt: state.rt, fg: state.fg });
    if (state.sort === 'perf') rows.sort(function (a, b) { return (b.supported ? b.fps : -1) - (a.supported ? a.fps : -1); });
    else rows.sort(function (a, b) { return a.game.name.localeCompare(b.game.name, 'cs'); });
    var max = 0;
    rows.forEach(function (r) { if (r.supported && r.fps > max) max = r.fps; });
    max = Math.max(max, 60);
    el.list.innerHTML = rows.map(function (r) {
      var g = r.game;
      if (!r.supported) return '<button type="button" class="pcfps__row" data-game="' + g.id + '"><span class="pcfps__rname">' + esc(g.name) + '</span><span class="pcfps__rbar"><i style="width:0"></i></span><b class="pcfps__rnum pcfps__tfps--bad">Nejde</b></button>';
      var v = E.verdict(r.fps);
      return '<button type="button" class="pcfps__row' + (g.id === state.game ? ' is-on' : '') + '" data-game="' + g.id + '"><span class="pcfps__rname">' + esc(g.name) + '</span><span class="pcfps__rbar pcfps__rbar--' + v.id + '"><i style="width:' + Math.max(2, r.fps / max * 100) + '%"></i></span><b class="pcfps__rnum pcfps__tfps--' + v.id + '">' + Math.round(r.fps) + '</b></button>';
    }).join('');
  }

  function refresh(opt) {
    var sup = normState();
    if (!opt || opt.controls !== false) renderControls(sup);
    updateTiles();
    renderResult();
    renderOverview();
  }

  /* ---------------- 5) události ---------------- */
  function selectGame(id) {
    if (!gameById[id]) return;
    state.game = id;
    refresh();
    var t = $('.pcfps__tile[data-game="' + id + '"]', sec);
    if (t && t.scrollIntoView) { try { t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { } }
  }

  sec.addEventListener('click', function (ev) {
    var t = ev.target;
    var gt = t.closest && t.closest('[data-game]');
    if (gt && sec.contains(gt)) { selectGame(gt.getAttribute('data-game')); return; }
    var sv = t.closest && t.closest('[data-grp-val]');
    if (sv && !sv.disabled) {
      var pr = sv.getAttribute('data-grp-val').split(':');
      if (pr[0] === 'preset') state.preset = pr[1];
      else if (pr[0] === 'res') state.res = +pr[1];
      else if (pr[0] === 'up') state.up = pr[1];
      refresh(); return;
    }
    var sw = t.closest && t.closest('[data-sw]');
    if (sw && !sw.disabled) {
      var k = sw.getAttribute('data-sw');
      if (k === 'rt') state.rt = !state.rt;
      else if (k === 'fg') { var sup = E.gameTech(cfg, cur()); state.fg = state.fg ? 0 : (sup.fg === 2 ? 1 : 1); }
      refresh(); return;
    }
    var fm = t.closest && t.closest('[data-fgm]');
    if (fm) { state.fg = +fm.getAttribute('data-fgm'); refresh(); return; }
    var act = t.closest && t.closest('[data-act]');
    if (act) {
      var a = act.getAttribute('data-act');
      if (a === 'scroll-l' || a === 'scroll-r') {
        var w = el.games.clientWidth * 0.8;
        try { el.games.scrollBy({ left: a === 'scroll-l' ? -w : w, behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { el.games.scrollLeft += a === 'scroll-l' ? -w : w; }
      } else if (a === 'sort-perf' || a === 'sort-abc') {
        state.sort = a === 'sort-perf' ? 'perf' : 'abc';
        $$('[data-act^="sort-"]', sec).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-act') === a ? 'true' : 'false'); });
        renderOverview();
      }
    }
  });
  el.search.addEventListener('input', function () { state.search = el.search.value.trim(); updateTiles(); });
  el.more.addEventListener('toggle', renderOverview);

  /* ---------------- 6) vložení do stránky ---------------- */
  buildTiles();
  anchor.parentNode.insertBefore(sec, anchor.nextSibling);
  refresh();
  var first = $('.pcfps__tile[aria-pressed="true"]', sec);
  if (first) { try { el.games.scrollLeft = Math.max(0, first.offsetLeft - el.games.clientWidth / 2 + first.clientWidth / 2); } catch (e) { } }
  sec.setAttribute('data-ready', '1');
  try { window.PCFPS_CONFIG = cfg; } catch (e) { }
})();
