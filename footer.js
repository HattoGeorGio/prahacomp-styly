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
   "Hlavní kategorie", "Kontakt") a spodní pruh s IČO/DIČ a právními
   odkazy (Obchodní podmínky/Reklamace/GDPR).

   Řešení: před existující nativní pruh (#footer .footer-bottom) vložíme
   nový blok se sloupci, a do samotného nativního pruhu jen DOPLNÍME
   (nic nemažeme) IČO/DIČ a právní odkazy vedle stávajícího copyright
   textu — podpis Shoptetu i odkaz na cookies zůstávají zcela beze změny.

   Poznámka k odkazu "Reklamace": e-shop zatím nemá samostatnou stránku
   reklamačního řádu (ověřeno v administraci → Stránky — existují jen
   "Jak nakupovat", "Kontakty", "Obchodní podmínky" a "Podmínky ochrany
   osobních údajů"). Reklamační řád bývá obvykle součástí obchodních
   podmínek, proto odkaz "Reklamace" prozatím míří na /obchodni-podminky/
   — až bude mít samostatnou stránku, stačí tu jen upravit "href" u
   jedné položky níž (viz LEGAL_LINKS). */
(function(){
  // ===== Odkazy pro sloupce a spodní pruh — jedno centrální místo, kde
  // je do budoucna snadné cokoliv přidat/upravit/přeuspořádat. =====

  // "Výkup a servis" — stejné cílové adresy jako položky "SERVIS" /
  // "VÝKUP ZBOŽÍ" v hlavním menu (viz claude/eshop-menu-servis-odkaz-v1.md),
  // schválně beze změny, ať je chování v celém e-shopu jednotné.
  var SERVICE_LINKS = [
    {href:'https://www.prahacomputer.cz', label:'Servis počítačů a notebooků', blank:true},
    {href:'https://www.prahacomputer.cz/#vykup', label:'Výkup a odkup techniky', blank:true}
  ];

  // "Hlavní kategorie" — 4 hlavní kategorie e-shopu (stejné jako první
  // úroveň hlavního menu).
  var CATEGORY_LINKS = [
    {href:'/pocitace/', label:'Počítače'},
    {href:'/notebooky/', label:'Notebooky'},
    {href:'/komponenty/', label:'Komponenty'},
    {href:'/prislusenstvi/', label:'Příslušenství'}
  ];

  // Spodní pruh — právní a informační odkazy vedle copyright textu.
  var LEGAL_LINKS = [
    {href:'/kontakty/', label:'Kontakt'},
    {href:'/obchodni-podminky/', label:'Obchodní podmínky'},
    {href:'/obchodni-podminky/', label:'Reklamace'},
    {href:'/podminky-ochrany-osobnich-udaju/', label:'Zásady zpracování osobních údajů'}
  ];

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
      {type:'pin', href:null, label:'Kolbenova 912/5c, 190 00 Praha 9 – Vysočany'}
    ];
    items.forEach(function(item){
      var li = document.createElement('li');
      li.className = 'pp-footer-contact-' + item.type;
      if(item.href){
        var a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.label;
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
    main.appendChild(buildColumn('Hlavní kategorie', CATEGORY_LINKS));
    main.appendChild(buildContactColumn());

    footer.insertBefore(main, bar);

    // Do nativního copyright bloku doplníme IČO/DIČ a právní odkazy —
    // vkládáme je těsně PŘED odkaz na cookies, ať zůstane (jak bývá
    // zvykem) úplně poslední v pořadí.
    var copyright = bar.querySelector('.copyright');
    var cookiesLink = copyright && copyright.querySelector('.cookies-settings');
    if(copyright && cookiesLink){
      var ico = document.createElement('span');
      ico.className = 'pp-footer-ico';
      ico.textContent = 'IČO 14219689 · DIČ CZ14219689';
      copyright.insertBefore(ico, cookiesLink);

      var legalLinks = document.createElement('span');
      legalLinks.className = 'pp-footer-legal-links';
      LEGAL_LINKS.forEach(function(l){
        var a = document.createElement('a');
        a.href = l.href;
        a.textContent = l.label;
        legalLinks.appendChild(a);
      });
      copyright.insertBefore(legalLinks, cookiesLink);
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