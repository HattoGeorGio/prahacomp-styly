/* =====================================================================
   FPS-LOADER.JS — malý spouštěč modulu „Výkon ve vašich hrách“
   Do Záhlaví se vkládá jen tento soubor (jeden řádek). Na všech stránkách,
   které nejsou detailem herního PC / notebooku, hned skončí a nestáhne nic
   dalšího. Na herních produktech dotáhne styl, data, výpočet a modul.
   Verze (?v=) se zvyšuje v konstantě V — jedna změna, žádné úpravy Záhlaví.
   Rollback: smazat <script> řádek tohoto souboru ze Záhlaví.
   ===================================================================== */
(function () {
  'use strict';
  var V = '1';
  var body = document.body;
  if (!body || !/\btype-detail\b/.test(body.className)) return;

  var cls = body.className;
  var crumbs = '';
  var nodes = document.querySelectorAll('.breadcrumbs a, #navigator a');
  for (var i = 0; i < nodes.length; i++) crumbs += ' > ' + (nodes[i].textContent || '');
  var h1 = document.querySelector('h1');
  var title = h1 ? (h1.textContent || '') : '';
  var gaming = /\bin-herni-pocitace\b|\bin-herni-notebooky\b/.test(cls) ||
    /Herní (počítače|notebooky)/i.test(crumbs) ||
    (/(Počítače|Notebooky)/i.test(crumbs) && /herní|gaming|gamer/i.test(title));
  if (!gaming) return;

  var base = 'https://hattogeorgio.github.io/prahacomp-styly/';
  var cs = document.currentScript;
  if (cs && cs.src) base = cs.src.replace(/[^\/]*(\?.*)?$/, '');

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = base + 'fps-modul.css?v=' + V;
  document.head.appendChild(link);

  ['fps-data.js', 'fps-engine.js', 'fps-modul.js'].forEach(function (f) {
    var s = document.createElement('script');
    s.src = base + f + '?v=' + V;
    s.async = false;
    document.head.appendChild(s);
  });
})();
