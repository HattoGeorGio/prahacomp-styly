/* FOOTER.JS — patří k footer.css (patička e-shopu).
   Shoptet defaultně vykresluje v patičce jen jeden úzký pruh:
   - povinný podpis "Vytvořil Shoptet" (licenční podmínky Shoptetu, NESMÍ
     se odstranit)
   - copyright text s názvem obchodu (bere se z administrace, aktuálně
     "Můj e-shop" — až si klient v Nastavení → Obecné nastavení přejmenuje
     e-shop na "Prahacomputer s.r.o.", projeví se to tu automaticky, beze
     změny v tomto souboru)
   - odkaz "Upravit nastavení cookies" (funkční, otevírá cookištní lištu —
     taky nutné zachovat)

   Klient chce místo toho bohatou patičku ve stylu firemního webu
   prahacomputer.cz: logo + slogan, sloupce s odkazy ("Výkup a servis",
   "Užitečné odkazy", "Kontakt") a spodní pruh jen s IČO/DIČ (právní
   odkazy žijí teď ve sloupci "Užitečné odkazy", ne dole).

   Řešení: před existující nativní pruh (#footer .footer-bottom) vložíme
   nový blok se sloupci, a do samotného nativního pruhu jen DOPLNÍME
   (nic nemažeme) IČO/DIČ vedle stávajícího copyright textu — podpis
   Shoptetu i odkaz na cookies zůstávají zcela beze změny.

   Poznámka k odkazu "Reklamace": e-shop zatím nemá samostatnou stránku
   reklamačního řádu (ověřeno v administraci → Stránky — existují jen
   "Jak nakupovat", "Kontakty", "Obchodní podmínky" a "Podmínky ochrany
   osobních údajů"). Reklamační řád bývá obvykle součástí obchodních
   podmínek, proto odkaz "Reklamace" prozatím míří na /obchodni-podminky/
   — až bude mít samostatnou stránku, stačí tu jen upravit "href" u
   jedné položky níž (viz USEFUL_LINKS).

   REVIZE (2. kolo): na žádost klienta sloupec "Hlavní kategorie" nahrazen
   sloupcem "Užitečné odkazy" (Obchodní podmínky/Zásady zpracování osobních
   údajů/Reklamace/Jak nakupovat/Kontakt) — tyto odkazy se tím pádem ze
   spodní lišty odstranily (byly by duplicitní). Adresa v Kontaktu je teď
   klikací odkaz na Google Mapy. */
(function(){
  // ===== Odkazy pro sloupce a spodní pruh — jedno centrální místo, kde
  // je do budoucna snadné cokoliv přidat/upravit/přeuspořádat. =====

  // "Výkup a servis" — cílové adresy potvrzené klientem přímo (konkrétní
  // kotvy na firemním webu, ne jen kořenová doména):
  // https://www.prahacomputer.cz/#servis-pc  = servis
  // https://www.prahacomputer.cz/#vykup      = výkup
  // Pozn.: položka "SERVIS" v hlavním menu (viz
  // claude/eshop-menu-servis-odkaz-v1.md) zatím míří jen na kořenovou
  // doménu bez kotvy — klient zatím žádal upravit jen patičku, menu
  // beze změny (lze sjednotit později, bude-li chtít).
  var SERVICE_LINKS = [
    {href:'https://www.prahacomputer.cz/#servis-pc', label:'Servis počítačů a notebooků', blank:true},
    {href:'https://www.prahacomputer.cz/#vykup', label:'Výkup a odkup techniky', blank:true}
  ];

  // "Užitečné odkazy" — právní a informační odkazy, dřív žily jen ve
  // spodní liště, teď mají vlastní sloupec (nahrazuje "Hlavní kategorie").
  // "Jak nakupovat" href ověřen živě v DOM (nativní stránka Shoptetu,
  // stejná jako v horní liště). "Reklamace" — viz poznámka výš, zatím
  // beze změny míří na /obchodni-podminky/.
  var USEFUL_LINKS = [
    {href:'/obchodni-podminky/', label:'Obchodní podmínky'},
    {href:'/podminky-ochrany-osobnich-udaju/', label:'Zásady zpracování osobních údajů'},
    {href:'/obchodni-podminky/', label:'Reklamace'},
    {href:'/jak-nakupovat/', label:'Jak nakupovat'},
    {href:'/kontakty/', label:'Kontakt'}
  ];

  // Odkaz na Google Mapy pro adresu v Kontaktu — přesná adresa firmy.
  var MAPS_LINK = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Kolbenova 912/5c, 190 00 Praha 9');

  function buildColumn(title, links){
    var col = document.createElement('div');
    col.className = 'pp-footer-col';
    var h = document.createElement('h3');
    h.textContent = title;
    col.appendChild(h);
    var ul = document.createElement('ul');
    links.forEach(function(l){
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = l.href;
      a.textContent = l.label;
      if(l.blank){
        a.target = '_blank';
        a.rel = 'noopener';
      }
      li.appendChild(a);
      ul.appendChild(li);
    });
    col.appendChild(ul);
    return col;
  }

  function buildContactColumn(){
    var col = document.createElement('div');
    col.className = 'pp-footer-col pp-footer-contact';
    var h = document.createElement('h3');
    h.textContent = 'Kontakt';
    col.appendChild(h);

    var ul = document.createElement('ul');
    var items = [
      {type:'tel', href:'tel:+420606350650', label:'+420 606 350 650'},
      {type:'mail', href:'mailto:servis@prahacomp.cz', label:'servis@prahacomp.cz'},
      // Adresa je klikací odkaz rovnou na Google Mapy (nová záložka) —
      // stejná technika (blank:true → target/rel) jako u vnějších odkazů
      // v buildColumn().
      {type:'pin', href:MAPS_LINK, label:'Kolbenova 912/5c, 190 00 Praha 9 – Vysočany', blank:true}
    ];
    items.forEach(function(item){
      var li = document.createElement('li');
      li.className = 'pp-footer-contact-' + item.type;
      if(item.href){
        var a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.label;
        if(item.blank){
          a.target = '_blank';
          a.rel = 'noopener';
        }
        li.appendChild(a);
      } else {
        li.textContent = item.label;
      }
      ul.appendChild(li);
    });
    col.appendChild(ul);
    return col;
  }

  function buildBrand(){
    var brand = document.createElement('div');
    brand.className = 'pp-footer-brand';

    // Znovu použijeme přesně to samé logo, jaké je v hlavičce (stejný
    // <img src>), místo aby si tenhle soubor nesl vlastní kopii obrázku
    // — pokud si klient logo v administraci (Vzhled a obsah) někdy
    // vymění, patička se automaticky změní spolu s hlavičkou.
    var headerLogo = document.querySelector('#header .site-name a img');
    if(headerLogo){
      var logoLink = document.createElement('a');
      logoLink.href = '/';
      logoLink.className = 'pp-footer-logo';
      var logo = document.createElement('img');
      logo.src = headerLogo.src;
      logo.alt = headerLogo.alt || 'PrahaComp';
      logoLink.appendChild(logo);
      brand.appendChild(logoLink);
    }

    var tagline = document.createElement('p');
    tagline.className = 'pp-footer-tagline';
    tagline.textContent = 'Profesionální servis a prodej výpočetní techniky se zárukou. Praha 9 – Vysočany.';
    brand.appendChild(tagline);

    return brand;
  }

  function setupFooterColumns(){
    var footer = document.getElementById('footer');
    var bar = footer && footer.querySelector('.footer-bottom');
    if(!footer || !bar || footer.dataset.footerDone) return;
    footer.dataset.footerDone = '1';

    var main = document.createElement('div');
    main.className = 'pp-footer-main';
    main.appendChild(buildBrand());
    main.appendChild(buildColumn('Výkup a servis', SERVICE_LINKS));
    main.appendChild(buildColumn('Užitečné odkazy', USEFUL_LINKS));
    main.appendChild(buildContactColumn());

    footer.insertBefore(main, bar);

    // Do nativního copyright bloku doplníme jen IČO/DIČ — právní odkazy
    // (Obchodní podmínky/Reklamace/GDPR/Kontakt) teď žijí ve sloupci
    // "Užitečné odkazy" výš, takže by tu dole byly zbytečně duplicitní.
    // Vkládáme těsně PŘED odkaz na cookies, ať zůstane (jak bývá zvykem)
    // úplně poslední v pořadí.
    var copyright = bar.querySelector('.copyright');
    var cookiesLink = copyright && copyright.querySelector('.cookies-settings');
    if(copyright && cookiesLink){
      var ico = document.createElement('span');
      ico.className = 'pp-footer-ico';
      ico.textContent = 'IČO 14219689 · DIČ CZ14219689';
      copyright.insertBefore(ico, cookiesLink);
    }
  }

  function init(){
    setupFooterColumns();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
