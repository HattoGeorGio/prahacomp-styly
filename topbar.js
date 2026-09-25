/* TOPBAR.JS — patří k topbar.css (horní lišta e-shopu, .top-navigation-bar).

   Shoptet do téhle lišty nativně vykresluje jen telefon ("Zákaznická
   podpora: ..."), rozbalovací menu (Jak nakupovat / Obchodní podmínky /
   GDPR — to teď schováváme přes CSS, viz topbar.css) a Přihlášení.
   E-mail tu chybí úplně — tenhle soubor ho doplní hned za telefon,
   stejným stylem/technikou jako patička (viz footer.js).

   Guard přes dataset flag (stejný vzorec jako u ostatních *.js v tomhle
   projektu, např. footer.js) — jistota proti dvojímu spuštění, kdyby
   se skript z nějakého důvodu načetl dvakrát. */
(function(){
  var EMAIL = 'servis@prahacomp.cz';

  function addEmail(){
    var contacts = document.querySelector('.top-navigation-contacts');
    if(!contacts || contacts.dataset.emailDone) return;
    contacts.dataset.emailDone = '1';

    var a = document.createElement('a');
    a.className = 'pp-topbar-email';
    a.href = 'mailto:' + EMAIL;
    a.textContent = EMAIL;
    contacts.appendChild(a);
  }

  function init(){
    addEmail();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
