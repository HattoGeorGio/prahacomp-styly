/* =====================================================================
   NOVINKY.JS — vloží rámeček „Novinky ze světa IT“ do bočního panelu
   těsně nad box „Top 10 produktů“ a odkaz „Novinky ze světa IT“ do
   sloupce „Užitečné odkazy“ v patičce (před „Kontakt“). Vzhled řeší
   novinky.css.

   - rámeček se vkládá jen tam, kde existuje box Top 10 produktů;
   - odkaz v patičce se vkládá až po načtení stránky (patičku staví
     footer.js, který běží později než Záhlaví);
   - vloží se nejvýše jednou, žádná síť, žádná externí data;
   - cíl je /nase-novinky/ (rubrika Novinky ve Shoptetu).
   Rollback: smazat <script> a <link> řádek ze Záhlaví.
   ===================================================================== */
(function () {
  'use strict';

  var URL = '/nase-novinky/';

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4 5h13a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5z"/><path d="M19 9h1a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2"/>' +
    '<path d="M8 9h7M8 13h7M8 16h4"/></svg>';

  function addBox() {
    var top = document.querySelector('.sidebar-inner .box-topProducts');
    if (!top || document.querySelector('.sidebar-inner .box-novinky')) return;

    var box = document.createElement('div');
    box.className = 'box box-bg-default box-sm box-novinky';
    box.innerHTML =
      '<h3 class="pageElement__heading"><span>Novinky ze světa IT</span></h3>' +
      '<p class="novinky-text"><strong>Zajímají vás novinky ze světa IT?</strong> Čtěte naše články o počítačích, hrách a technice.</p>' +
      '<a class="novinky-btn" href="' + URL + '">' + ICON + '<span>Číst novinky</span></a>';

    top.parentNode.insertBefore(box, top);
  }

  function addFooterLink() {
    var cols = document.querySelectorAll('#footer .pp-footer-col');
    for (var i = 0; i < cols.length; i++) {
      var h = cols[i].querySelector('h3');
      if (!h || h.textContent.trim() !== 'Užitečné odkazy') continue;
      var ul = cols[i].querySelector('ul');
      if (!ul || ul.querySelector('a[href="' + URL + '"]')) return;

      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = URL;
      a.textContent = 'Novinky ze světa IT';
      li.appendChild(a);

      var last = ul.lastElementChild;           // „Kontakt“ zůstane poslední
      ul.insertBefore(li, last);
      return;
    }
  }

  // Rámeček hned po sestavení DOM (sidebar už existuje), patičku až po
  // načtení stránky (staví ji footer.js, který běží později než Záhlaví).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addBox);
  } else {
    addBox();
  }
  if (document.readyState === 'complete') {
    addFooterLink();
  } else {
    window.addEventListener('load', addFooterLink);
  }
})();
