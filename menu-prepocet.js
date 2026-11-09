/* =====================================================================
   MENU-PREPOCET.JS — oprava překrytí menu tlačítkem „≡“ na tabletu

   Problém (Jirka, 9. 11. 2026): v šířkách cca 768–1199 px šablona při
   načtení změří, kolik položek menu se vejde, a ty, co se nevejdou,
   přesune pod tlačítko „≡“. Pokud se po tom stránka prodlouží a objeví
   se svislý posuvník (okno se zúží o ~15 px), menu se už znovu nezměří
   a poslední položka („Výkup zboží“) zůstane částečně schovaná pod „≡“.
   Pomoc: po dokončení načtení (a po načtení písem) jednou vyvoláme
   běžnou událost „resize“ — šablona si menu přepočítá úplně stejně,
   jako když uživatel změní velikost okna.

   Spouští se jen v šířkách 768–1199 px; na mobilu a velkém desktopu
   skript nedělá nic. Žádný zásah do DOM, žádné styly.
   Rollback: smazat <script> řádek ze Záhlaví.
   ===================================================================== */
(function () {
  'use strict';
  var mq = window.matchMedia && window.matchMedia('(min-width:768px) and (max-width:1199px)');
  if (!mq || !mq.matches) return;

  function fire() {
    try {
      window.dispatchEvent(new Event('resize'));
    } catch (e) { /* starší prohlížeč – nic se neděje */ }
  }
  function later() { setTimeout(fire, 350); }

  if (document.readyState === 'complete') {
    later();
  } else {
    window.addEventListener('load', later);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(later);
  }
})();
