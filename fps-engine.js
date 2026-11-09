/* =====================================================================
   FPS-ENGINE.JS — čtení konfigurace z popisu produktu + odhad FPS
   Bez závislostí, bez DOM (jde spustit i v Node pro testy).
   Data: fps-data.js (PCFPS_DATA)
   ===================================================================== */
(function (root, factory) {
  var api = factory(root.PCFPS_DATA || (typeof require === 'function' ? require('./fps-data.js') : null));
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PCFPS = api;
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';

  var RESOLUTIONS = [1080, 1440, 2160];
  var RES_LABEL = { 1080: 'Full HD', 1440: 'QHD', 2160: '4K' };
  var RES_PX = { 1080: '1920 × 1080', 1440: '2560 × 1440', 2160: '3840 × 2160' };
  var PRESETS = ['low', 'med', 'high', 'ultra'];
  var PRESET_LABEL = { low: 'Nízké', med: 'Střední', high: 'Vysoké', ultra: 'Ultra' };
  var PRESET_MUL = { low: 2.2, med: 1.7, high: 1.3, ultra: 1.0 };
  var PRESET_CAP = { low: 1.12, med: 1.06, high: 1.02, ultra: 1.0 };
  var PRESET_VRAM = { low: 0.6, med: 0.78, high: 0.9, ultra: 1.0 };
  var RES_VRAM = { 1080: 1.0, 1440: 1.25, 2160: 1.75 };
  var RES_PEN_EXP = { 1080: 1.0, 1440: 0.8, 2160: 0.5 };
  var UPSCALE = {
    off: { label: 'Vypnuto', scale: 1 },
    q: { label: 'Kvalita', scale: 0.667 },
    b: { label: 'Vyvážený', scale: 0.58 },
    p: { label: 'Výkon', scale: 0.5 }
  };
  var PHI = { 1080: 0.48, 1440: 0.36, 2160: 0.30 };
  var RT_PEN = { turing: 1.15, ampere: 1.0, ada: 0.85, blackwell: 0.8, rdna2: 1.35, rdna3: 1.15, rdna4: 0.9, arc: 1.0 };
  var RT_ARCH = { turing: 1, ampere: 1, ada: 1, blackwell: 1, rdna2: 1, rdna3: 1, rdna4: 1, arc: 1 };
  var SMOOTH_P = 5;
  /* kalibrace: geometrický průměr „a“ u 11 her z testu Tom's Hardware musí dát 71,5 FPS (RTX 4060) */
  var NORM = (function () {
    var sum = 0, n = 0;
    D.games.forEach(function (g) { if (g.tom) { sum += Math.log(g.a); n++; } });
    return n ? D.ref.g1080 / Math.exp(sum / n) : 1;
  })();

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  /* ------------------------------------------------------------------
     Normalizace textu a vyhledání GPU
     ------------------------------------------------------------------ */
  function normGpu(t) {
    return String(t || '').toLowerCase()
      .replace(/[®™]/g, ' ')
      .replace(/geforce|nvidia/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/([a-z])(\d)/g, '$1 $2')
      .replace(/(\d)([a-z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  var gpuRx = null;
  function buildGpuRx() {
    gpuRx = [];
    D.gpus.forEach(function (g, idx) {
      g.pats.forEach(function (p) {
        gpuRx.push({ idx: idx, rx: new RegExp('(?:^|[^a-z0-9])(' + p + ')(?![a-z0-9])', 'i') });
      });
    });
  }
  var gpuById = null;
  function getGpu(id) {
    if (!gpuById) { gpuById = {}; D.gpus.forEach(function (g) { gpuById[g.id] = g; }); }
    return gpuById[id];
  }

  /* Vrátí { gpu, matchEnd, text } z jednoho řetězce, nebo null */
  function findGpu(text) {
    if (!gpuRx) buildGpuRx();
    var n = normGpu(text), best = null;
    gpuRx.forEach(function (e) {
      var m = e.rx.exec(n);
      if (!m) return;
      var len = m[1].length;
      if (!best || len > best.len) best = { idx: e.idx, len: len, end: m.index + m[0].length, n: n };
    });
    if (!best) return null;
    return { gpu: D.gpus[best.idx], end: best.end, n: best.n };
  }

  function pickAlt(gpu, vramWanted) {
    var alts = gpu.alts, i;
    if (vramWanted) for (i = 0; i < alts.length; i++) if (alts[i][0] === vramWanted) return alts[i];
    return alts[0];
  }

  var VRAM_OK = { 2: 1, 3: 1, 4: 1, 6: 1, 8: 1, 10: 1, 11: 1, 12: 1, 16: 1, 20: 1, 24: 1, 32: 1 };
  function parseVramAfter(n, end) {
    var m = /^\s*(\d{1,2}) ?gb\b(?! ?(?:ram|ddr|lpddr|ssd|hdd|nvme|m 2))/.exec(n.slice(end, end + 24));
    var v = m ? parseInt(m[1], 10) : 0;
    return VRAM_OK[v] ? v : 0;
  }

  /* ------------------------------------------------------------------
     CPU
     ------------------------------------------------------------------ */
  var INTEL_BASE = {
    6: { 3: 42, 5: 53, 7: 57, 9: 57 }, 7: { 3: 46, 5: 55, 7: 59, 9: 59 }, 8: { 3: 48, 5: 64, 7: 65.6, 9: 70 },
    9: { 3: 52, 5: 65, 7: 71, 9: 76 }, 10: { 3: 62, 5: 72, 7: 78, 9: 84 }, 11: { 3: 70, 5: 81, 7: 90, 9: 93 },
    12: { 3: 79, 5: 88, 7: 94, 9: 100 }, 13: { 3: 85, 5: 100, 7: 116, 9: 128 }, 14: { 3: 88, 5: 102, 7: 122, 9: 132 }
  };
  var RYZEN_BASE = {
    1: { 3: 38, 5: 48, 7: 47, 9: 50 }, 2: { 3: 45, 5: 55.5, 7: 57.5, 9: 60 }, 3: { 3: 57.8, 5: 68.6, 7: 71.4, 9: 71.7 },
    4: { 3: 55, 5: 66, 7: 70, 9: 72 }, 5: { 3: 70, 5: 80, 7: 90, 9: 91 }, 6: { 3: 70, 5: 76, 7: 82, 9: 90 },
    7: { 3: 78, 5: 104, 7: 113, 9: 114 }, 8: { 3: 90, 5: 98, 7: 104, 9: 110 }, 9: { 3: 105, 5: 118, 7: 124, 9: 126 }
  };

  function intelThreads(gen, tier) {
    if (tier === 3) return gen >= 10 ? [4, 8] : (gen >= 8 ? [4, 4] : [2, 4]);
    if (tier === 5) return gen >= 12 ? [6, 12] : (gen >= 10 ? [6, 12] : (gen >= 8 ? [6, 6] : [4, 4]));
    if (tier === 7) return gen >= 12 ? [12, 20] : (gen >= 10 ? [8, 16] : (gen >= 9 ? [8, 8] : (gen >= 8 ? [6, 12] : [4, 8])));
    return gen >= 12 ? [16, 24] : (gen >= 10 ? [10, 20] : [8, 16]);
  }
  function ryzenThreads(gen, tier) {
    if (tier === 3) return [4, 8];
    if (tier === 5) return [6, 12];
    if (tier === 7) return [8, 16];
    return gen >= 5 ? [12, 24] : [12, 24];
  }

  function suffixMul(suf, mobileDefaultH) {
    suf = (suf || '').toLowerCase();
    if (/hx3d/.test(suf)) return 1.18;
    if (/x3d/.test(suf)) return 1.25;
    if (/hx/.test(suf)) return 0.95;
    if (/hs/.test(suf)) return 0.86;
    if (/^h/.test(suf)) return 0.82;
    if (/^(u|p)/.test(suf)) return 0.62;
    if (/^t/.test(suf)) return 0.88;
    if (/^g/.test(suf)) return 0.93;
    if (/^k/.test(suf)) return 1.03;
    return 1;
  }

  function findCpu(text) {
    var t = String(text || '').toLowerCase(), m, id, c;
    /* Intel Core iN-NNNN(N)[suffix] */
    m = /(?:^|[^a-z0-9])i([3579])[\s-]*(\d{4,5})([a-z]{1,2})?(?![a-z0-9])/.exec(t);
    if (m) {
      var tier = +m[1], num = m[2], suf = m[3] || '';
      id = 'i' + tier + '-' + num;
      var iLabel = 'Core i' + tier + '-' + num + suf.toUpperCase();
      if (C(id + suf)) return fromTable(id + suf, m, iLabel);
      if (suf && /^[kf]/.test(suf) && C(id + suf.charAt(0))) return fromTable(id + suf.charAt(0), m, iLabel);
      if (C(id) && (!suf || /^[fk]/.test(suf))) return fromTable(id, m, iLabel);
      var gen = num.length === 5 ? parseInt(num.slice(0, 2), 10) : parseInt(num.charAt(0), 10);
      var gb = INTEL_BASE[Math.min(Math.max(gen, 6), 14)];
      var base2 = (gb && gb[tier]) || 70;
      var th = intelThreads(gen, tier);
      var mobile = /^(h|u|p)/.test(suf);
      var sc = base2 * suffixMul(suf);
      if (/^h/.test(suf) && gen >= 12 && !/hx/.test(suf)) th = [Math.max(th[0], tier === 5 ? 8 : 10), th[1] + 4];
      if (/^(u|p)/.test(suf)) th = [Math.max(4, Math.min(th[0], 10)), th[1]];
      return { id: id + suf, name: 'Core i' + tier + '-' + num + suf.toUpperCase(), s: Math.round(sc * 10) / 10, c: th[0], t: th[1], est: true, mobile: mobile, idx: m.index, end: m.index + m[0].length };
    }
    /* Core Ultra N NNN(S/H/HX) */
    m = /core\s*ultra\s*([3579])\s*(\d{3})\s?([a-z]{0,2})/.exec(t);
    if (m) {
      var ut = +m[1], un = m[2], us = m[3] || '', uscore;
      var uBase = { 5: 112, 7: 125, 9: 134 }[ut] || 110;
      if (/^k/.test(us)) uscore = uBase; else if (/hx/.test(us)) uscore = uBase * 0.95; else if (/^h/.test(us)) uscore = uBase * 0.75; else if (/^(u|v)/.test(us)) uscore = uBase * 0.5; else uscore = uBase * 0.92;
      var uc = ut === 9 ? 24 : (ut === 7 ? 20 : 14);
      return { id: 'cu' + ut + '-' + un + us, name: 'Core Ultra ' + ut + ' ' + un + us.toUpperCase(), s: Math.round(uscore), c: uc, t: uc + (ut >= 7 ? 4 : 2), est: true, mobile: /^(h|u|v)/.test(us), idx: m.index, end: m.index + m[0].length };
    }
    /* Ryzen AI 9 HX 370 apod. */
    m = /ryzen\s*ai\s*([579])\s*(?:hx\s*)?(\d{3})/.exec(t);
    if (m) {
      return { id: 'rai' + m[1] + '-' + m[2], name: 'Ryzen AI ' + m[1] + ' ' + (/hx/.test(m[0]) ? 'HX ' : '') + m[2], s: m[1] === '9' ? 104 : 96, c: m[1] === '9' ? 12 : 10, t: m[1] === '9' ? 24 : 20, est: true, mobile: true, idx: m.index, end: m.index + m[0].length };
    }
    /* Ryzen N NNNN[suffix] */
    m = /ryzen\s*([3579])\s*(\d{4})(x3d|hx3d|hx|hs|x|gt|g|h|u)?(?![a-z0-9])/.exec(t);
    if (m) {
      var rt = +m[1], rn = m[2], rs = m[3] || '';
      id = 'r' + rt + '-' + rn + rs;
      if (C(id)) return fromTable(id, m, 'Ryzen ' + rt + ' ' + rn + rs.toUpperCase());
      var rgen = parseInt(rn.charAt(0), 10);
      var rb = RYZEN_BASE[rgen] || RYZEN_BASE[5];
      var rbase = (rb && rb[rt]) || 80;
      var rth = ryzenThreads(rgen, rt);
      var rsc = rbase * suffixMul(rs);
      if (/x3d/.test(rs) && !/hx/.test(rs)) rsc = Math.max(rsc, rbase * 1.25);
      /* RYZEN 7xxx "U" / 5xxx "U" jsou nízkopříkonové */
      return { id: id, name: 'Ryzen ' + rt + ' ' + rn + rs.toUpperCase(), s: Math.round(rsc * 10) / 10, c: rth[0], t: rth[1], est: true, mobile: /^(h|u|hs|hx)/.test(rs), idx: m.index, end: m.index + m[0].length };
    }
    return null;
  }
  function C(id) { return D.cpus[id]; }
  function fromTable(id, m, label) { var o = mk(C(id), m); if (label) o.name = label; return o; }
  function mk(c, m) { var o = {}; for (var k in c) o[k] = c[k]; o.idx = m.index; o.end = m.index + m[0].length; return o; }

  var CORE_WORDS = { 'dvoj': 2, 'čtyř': 4, 'ctyr': 4, 'pěti': 5, 'šesti': 6, 'sesti': 6, 'osmi': 8, 'deseti': 10, 'dvanácti': 12, 'dvanacti': 12, 'čtrnácti': 14, 'šestnácti': 16, 'sestnacti': 16 };

  /* Počet jader/vláken uvedený v textu u procesoru přepíše odhad tabulky */
  function overrideThreads(cpu, text) {
    var t = String(text || '').toLowerCase();
    var seg = t.slice(Math.max(0, cpu.idx - 50), cpu.end + 160);
    var cores = 0, thr = 0, m;
    if ((m = /(\d{1,2})\s*(?:jádr|jader|core)/.exec(seg))) cores = +m[1];
    else if ((m = /(dvoj|čtyř|ctyr|pěti|šesti|sesti|osmi|deseti|dvanácti|dvanacti|čtrnácti|šestnácti|sestnacti)jádr/.exec(seg))) cores = CORE_WORDS[m[1]];
    if ((m = /(\d{1,2})\s*vl[aá]ke?n/.exec(seg)) || (m = /(\d{1,2})\s*thread/.exec(seg))) thr = +m[1];
    if (cores >= 2 && cores <= 32) {
      cpu.c = cores;
      cpu.t = thr >= cores && thr <= 64 ? thr : cpu.t;
    }
    return cpu;
  }

  /* ------------------------------------------------------------------
     RAM, rozlišení displeje
     ------------------------------------------------------------------ */
  function parseRam(texts) {
    var ok = { 4: 1, 6: 1, 8: 1, 12: 1, 16: 1, 24: 1, 32: 1, 48: 1, 64: 1, 96: 1, 128: 1 };
    for (var i = 0; i < texts.length; i++) {
      var t = String(texts[i] || '').toLowerCase();
      var m = /(\d{1,3})\s?gb\s*(?:ddr[345]|lpddr\d?x?|ram|operačn|paměti ram)/.exec(t) || /ram[^0-9]{0,20}(\d{1,3})\s?gb/.exec(t);
      if (m && ok[+m[1]]) {
        var d = /ddr([345])/.exec(t.slice(m.index, m.index + 40));
        return { gb: +m[1], ddr: d ? +d[1] : 0 };
      }
    }
    return { gb: 0, ddr: 0 };
  }

  function parseDisplay(text) {
    var t = String(text || '').toLowerCase(), res = 0, hz = 0, m;
    if ((m = /(\d{4})\s*[x×]\s*(\d{3,4})/.exec(t))) {
      var w = +m[1];
      if (w >= 3200) res = 2160; else if (w >= 2300) res = 1440; else if (w >= 1700) res = 1080;
    } else if (/\b(?:wqxga|qhd|2k)\b/.test(t)) res = 1440; else if (/\b(?:uhd|4k)\b/.test(t)) res = 2160; else if (/\b(?:fhd|full ?hd)\b/.test(t)) res = 1080;
    if ((m = /(\d{2,3})\s?hz/.exec(t))) { hz = +m[1]; if (hz < 50 || hz > 540) hz = 0; }
    return { res: res, hz: hz };
  }

  /* ------------------------------------------------------------------
     Hlavní parser
     parts = { title, short, desc, params, vram, isLaptop, category }
     ------------------------------------------------------------------ */
  function parseConfig(parts) {
    var title = parts.title || '', params = parts.params || '', shortD = parts.short || '', desc = parts.desc || '';
    var all = [title, params, shortD, desc].join(' | ');
    var laptop = !!parts.isLaptop || /\b(notebook|laptop|ultrabook)\b/i.test(title);
    var found = null, src = '', k, chunks = [['title', title], ['params', params], ['short', shortD], ['desc', desc]];

    for (k = 0; k < chunks.length; k++) {
      var f = findGpu(chunks[k][1]);
      if (f) { found = f; src = chunks[k][0]; break; }
    }
    var gpu = null, notes = [];
    if (found) {
      var gp = found.gpu;
      if (laptop && gp.o.lap) gp = getGpu(gp.o.lap) || gp;
      var vr = parseVramAfter(found.n, found.end) || (parts.vram && VRAM_OK[+parts.vram] ? +parts.vram : 0);
      var alt = pickAlt(gp, vr);
      gpu = { id: gp.id, name: gp.name, vendor: gp.vendor, arch: gp.arch, vram: (vr && vr >= 2 && vr <= 48 && alt[0] === vr) ? vr : alt[0], g: [alt[1], alt[2], alt[3]], est: !!gp.o.est, laptop: !!gp.o.laptop };
      if (vr && alt[0] !== vr && vr >= 2 && vr <= 48) gpu.vram = vr; /* neznámá varianta: použij uvedenou paměť */
    }

    var cpu = null;
    for (k = 0; k < chunks.length; k++) {
      var cf = findCpu(chunks[k][1]);
      if (cf) { cpu = overrideThreads(cf, chunks[k][1]); break; }
    }
    if (cpu && parts.cores && parts.cores >= 2 && parts.cores <= 32) {
      var hadSmt = cpu.t > cpu.c;
      if (parts.cores !== cpu.c) { cpu.c = parts.cores; cpu.t = hadSmt ? parts.cores * 2 : parts.cores; }
    }
    var ram = parseRam([title, params, shortD, desc]);
    if (ram.gb && !ram.ddr) { var dm = /ddr([345])/i.exec(all); if (dm) ram.ddr = +dm[1]; }
    var disp = parseDisplay(params + ' ' + title + ' ' + shortD);
    return { gpu: gpu, cpu: cpu, ramGB: ram.gb, ddr: ram.ddr, laptop: laptop, res: disp.res, hz: disp.hz, gpuSource: src };
  }

  /* ------------------------------------------------------------------
     Dostupné technologie podle grafiky
     ------------------------------------------------------------------ */
  function techFor(gpu) {
    var a = gpu.arch, v = gpu.vendor;
    var dlss = v === 'nv' && (a === 'turing' || a === 'ampere' || a === 'ada' || a === 'blackwell');
    var rt = !!RT_ARCH[a];
    var fg = null;
    if (a === 'ada') fg = 'dlssfg'; else if (a === 'blackwell') fg = 'mfg';
    else if (a === 'turing' || a === 'ampere' || a === 'rdna1' || a === 'rdna2' || a === 'rdna3' || a === 'rdna4' || a === 'arc') fg = 'fsrfg';
    return { dlss: dlss, rt: rt, fg: fg,
      upName: dlss ? 'NVIDIA DLSS' : (v === 'amd' && a === 'rdna4' ? 'AMD FSR 4' : (v === 'intel' ? 'Intel XeSS' : 'AMD FSR')),
      fgName: fg === 'dlssfg' ? 'DLSS Frame Generation' : (fg === 'mfg' ? 'DLSS Multi Frame Generation' : 'AMD FSR Frame Generation') };
  }

  /* Dostupnost pro konkrétní hru */
  function gameTech(cfg, game) {
    var t = techFor(cfg.gpu), sup = { up: false, upName: '', rt: false, fg: 0, fgName: '', needsRt: false, unsupported: '' };
    if (game.up === 'df') { sup.up = true; sup.upName = t.upName; }
    else if (game.up === 'f') { sup.up = true; sup.upName = cfg.gpu.vendor === 'intel' ? 'Intel XeSS' : 'AMD FSR'; }
    sup.rt = !!(game.rt > 0 && t.rt);
    if (game.fg && t.fg && game.up === 'df') { sup.fg = t.fg === 'mfg' ? 2 : 1; sup.fgName = t.fgName; }
    if (game.needs === 'rt' && !t.rt) sup.unsupported = 'Hra vyžaduje grafiku s hardwarovým ray tracingem.';
    return sup;
  }

  /* ------------------------------------------------------------------
     Výpočet
     opts = { res: 1080|1440|2160, preset: 'low'|'med'|'high'|'ultra', up: 'off'|'q'|'b'|'p', rt: bool, fg: 0|1|2 }
     ------------------------------------------------------------------ */
  function smoothMin(a, b) {
    return Math.pow(Math.pow(a, -SMOOTH_P) + Math.pow(b, -SMOOTH_P), -1 / SMOOTH_P);
  }

  function coreFactor(cpu) {
    var c = cpu.c, t = cpu.t;
    if (c >= 8) return 1;
    if (c >= 6) return 0.96;
    if (c === 4) return t >= 8 ? 0.84 : 0.68;
    if (c === 3) return 0.6;
    return 0.5;
  }

  function estimate(cfg, game, o) {
    o = o || {};
    var res = o.res || 1080, preset = o.preset || 'high', upMode = o.up || 'off';
    var ri = RESOLUTIONS.indexOf(res);
    var gpu = cfg.gpu, cpu = cfg.cpu || { s: 75, c: 6, t: 12, est: true, name: '' };
    var sup = gameTech(cfg, game);
    if (sup.unsupported) return { supported: false, reason: sup.unsupported, fps: 0, low: 0 };

    /* GPU část */
    var gres = gpu.g[ri];
    var fg_ = game.nvx || 1, vb = gpu.vendor === 'nv' ? (game.nvx || 1) : (gpu.vendor === 'amd' ? (game.amx || 1) : 0.92);
    var Fg = game.a * NORM * (gres / D.ref.g1080) * vb * Math.pow(PRESET_MUL[preset], game.qs);

    /* ray tracing */
    var useRt = !!o.rt && sup.rt;
    if (useRt) Fg *= Math.pow(game.rt, RT_PEN[gpu.arch] || 1);

    /* upscaling */
    var useUp = upMode !== 'off' && sup.up;
    var scale = useUp ? UPSCALE[upMode].scale : 1;
    if (useUp) {
      var f = scale * scale;
      var sp = 1 / (PHI[res] + (1 - PHI[res]) * f) * 0.97;
      Fg *= sp;
    }

    /* VRAM */
    var need = game.v * RES_VRAM[res] * PRESET_VRAM[preset];
    if (useUp) need *= 1 - 0.35 * (1 - scale * scale);
    if (useRt) need += 1.2;
    var vramPen = 1, vramOver = false;
    if (need > gpu.vram) {
      var r = gpu.vram / need;
      vramPen = Math.max(0.25, Math.pow(r, 1.0 * RES_PEN_EXP[res]));
      vramOver = vramPen < 0.97;
      Fg *= vramPen;
    }

    /* CPU strop */
    var gamma = game.cap >= 350 ? 0.95 : 0.85;
    var capF = 1 - game.core * (1 - coreFactor(cpu));
    var Fc = game.cap * Math.pow(cpu.s / D.ref.cpuScore, gamma) * capF * PRESET_CAP[preset];
    if (useRt) Fc *= 0.93;

    var base = smoothMin(Fg, Fc);

    /* RAM */
    var ramPen = 1;
    if (cfg.ramGB && cfg.ramGB <= 8) ramPen = 1 - 0.22 * game.ram;
    else if (cfg.ramGB && cfg.ramGB <= 12) ramPen = 1 - 0.07 * game.ram;
    base *= ramPen;

    var capped = false;
    if (game.max && base > game.max) { base = game.max; capped = true; }

    /* generování snímků */
    var fgMode = (o.fg && sup.fg) ? Math.min(o.fg, sup.fg) : 0;
    var fps = base;
    if (fgMode) {
      var gen = (sup.fg === 2 ? (fgMode === 2 ? 3.2 : 1.8) : (cfg.gpu.arch === 'ada' ? 1.75 : 1.65));
      if (base < 25) gen = 1 + (gen - 1) * 0.6;
      fps = base * gen;
    }

    /* 1 % low */
    var L = 0.82;
    var ratio = Fg / Fc;
    var limiter = capped ? 'cap' : (ratio < 0.92 ? 'gpu' : (ratio > 1.08 ? 'cpu' : 'balanced'));
    if (limiter === 'cpu') L -= 0.05;
    if (cpu.c <= 4 && cpu.t <= 4) L -= 0.12; else if (cpu.c <= 4) L -= 0.05;
    if (vramOver) L -= 0.25 * (1 - vramPen);
    if (cfg.ramGB && cfg.ramGB <= 8) L -= 0.05;
    if (fgMode) L -= 0.1;
    L = clamp(L, 0.45, 0.9);

    return {
      supported: true,
      fps: fps, base: base, low: fps * L,
      gpuFps: Fg, cpuFps: Fc,
      limiter: limiter,
      vramOver: vramOver, vramNeed: need, vramPen: vramPen,
      ramLimited: ramPen < 0.97,
      fgMode: fgMode, rt: useRt, up: useUp ? upMode : 'off',
      cores4: cpu.c <= 4 && game.core >= 0.6
    };
  }

  /* Přehled všech her při zadaném nastavení */
  function overview(cfg, o) {
    return D.games.map(function (g) {
      var opts = { res: o.res, preset: o.preset, up: 'off', rt: false, fg: 0 };
      var sup = gameTech(cfg, g);
      if (o.up && o.up !== 'off' && sup.up) opts.up = o.up;
      if (o.rt && sup.rt) opts.rt = true;
      if (o.fg && sup.fg) opts.fg = Math.min(o.fg, sup.fg);
      var e = estimate(cfg, g, opts);
      e.game = g;
      return e;
    });
  }

  /* Doporučené nastavení: nejvyšší rozlišení a kvalita, která dá aspoň target FPS (bez RT a FG) */
  function recommend(cfg, game, target, allowUp) {
    var order = [];
    [2160, 1440, 1080].forEach(function (r) { ['ultra', 'high', 'med', 'low'].forEach(function (p) { order.push({ res: r, preset: p }); }); });
    /* nejdřív zkus max kvalitu v daném rozlišení, rozlišení preferuj od 1440 dolů, 4K jen když vyjde */
    var i, e;
    for (i = 0; i < order.length; i++) {
      e = estimate(cfg, game, { res: order[i].res, preset: order[i].preset });
      if (e.supported && e.low >= target * 0.9 && e.fps >= target) return { res: order[i].res, preset: order[i].preset, up: 'off', fps: e.fps };
    }
    if (allowUp && gameTech(cfg, game).up) {
      var ups = ['q', 'b', 'p'];
      for (var u = 0; u < ups.length; u++) {
        for (i = 0; i < order.length; i++) {
          e = estimate(cfg, game, { res: order[i].res, preset: order[i].preset, up: ups[u] });
          if (e.supported && e.fps >= target) return { res: order[i].res, preset: order[i].preset, up: ups[u], fps: e.fps };
        }
      }
    }
    return null;
  }

  function verdict(fps) {
    if (fps >= 144) return { id: 'top', label: 'Kompetitivní výkon', hint: '144+ Hz plynule' };
    if (fps >= 90) return { id: 'great', label: 'Velmi plynulé', hint: 'Skvělé i pro 100–120 Hz' };
    if (fps >= 60) return { id: 'good', label: 'Plynulé', hint: 'Stabilních 60 FPS' };
    if (fps >= 40) return { id: 'ok', label: 'Hratelné', hint: 'Pro příběhové hry stačí' };
    if (fps >= 30) return { id: 'low', label: 'Hraničně hratelné', hint: 'Snižte detaily nebo zapněte upscaling' };
    return { id: 'bad', label: 'Nedoporučeno', hint: 'Příliš nízký výkon' };
  }

  return {
    RESOLUTIONS: RESOLUTIONS, RES_LABEL: RES_LABEL, RES_PX: RES_PX, PRESETS: PRESETS, PRESET_LABEL: PRESET_LABEL, UPSCALE: UPSCALE,
    parseConfig: parseConfig, estimate: estimate, overview: overview, recommend: recommend, verdict: verdict,
    techFor: techFor, gameTech: gameTech, findGpu: findGpu, findCpu: findCpu, normGpu: normGpu, parseRam: parseRam, parseDisplay: parseDisplay,
    games: D.games, featured: D.featured, data: D
  };
});
