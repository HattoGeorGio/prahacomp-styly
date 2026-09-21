/* PRODUKT.JS — patří k produkt.css (detail produktu).
   Řeší pět věcí, které Shoptet sám neumí / kde je potřeba přesunout
   nebo doplnit prvky mimo jejich výchozí místo/podobu v DOM:
   1) ikony Tisk/Zeptat se/Sdílet — schované za tlačítko "•••", navíc
      přesunuté vedle "Skladem"
   2) rozbalovací "harmoniku" pro "Detailní popis produktu" (nadpis
      zůstává h3 se stejným textem, jen s vloženým <button>), viz
      buildToggle() + setupBasicDescriptionToggle() níž
   3) tutéž harmoniku i pro tabulku "Doplňkové parametry" — obě sekce
      sdílejí jednu funkci (buildToggle), takže vypadají i chovají se
      naprosto stejně, viz setupParams() níž
   4) přesun Značky (vedle nadpisu H1, do hlavičky produktu) a kódu
      produktu (vedle "Detailní informace") z hlavičky dolů/vedle,
      viz setupLayout() níž
   5) barevné popisové štítky s odznakem u variant (Nové/Repasované
      A/B/C) místo čtyř vizuálně identických koleček, viz
      setupVariantChips() níž
   Načítá se přes <script src="...produkt.js?v=8"> v Zápatí — soubor
   samotný je na GitHubu spolu s CSS soubory, stejný princip jako
   style.css/kategorie.css/produkt.css (žádné kopírování kódu do
   administrace, jen jedna řádka <script src>). */
(function(){
  function setupActionIcons(){
    var panel = document.querySelector('.social-buttons-wrapper .link-icons[data-testid="productDetailActionIcons"]');
    if(!panel || panel.dataset.enhanced) return;
    panel.dataset.enhanced = '1';
    panel.classList.add('link-icons-panel');

    // Jen tři tečky, bez textu "Další možnosti" — klient chtěl čistě
    // ikonu, popisek zůstává v aria-label pro čtečky/přístupnost.
    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'link-icons-toggle';
    toggle.setAttribute('aria-label', 'Další možnosti (tisk, sdílet, zeptat se)');
    toggle.innerHTML = '<span class="li-dots"><span></span><span></span><span></span></span>';
    var wrapper = panel.closest('.social-buttons-wrapper');
    wrapper.insertBefore(toggle, panel);

    toggle.addEventListener('click', function(e){
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', function(e){
      if(panel.classList.contains('open') && !panel.contains(e.target) && e.target !== toggle){
        panel.classList.remove('open');
      }
    });

    // Přesun celého bloku (tečky + rozbalovací karta) k řádku "Skladem"
    // — ať je po ruce u ceny/dostupnosti, místo aby zabíral místo dole
    // pod popisem.
    var availability = document.querySelector('.availability-value');
    if(availability){
      availability.appendChild(wrapper);
    }
  }

  // Sdílená "harmonika" pro Detailní popis produktu i Doplňkové
  // parametry — obě sekce ji volají stejně (viz níž), takže mají
  // zaručeně identický vzhled i chování a nemůžou se do budoucna při
  // další úpravě "rozejít".
  // heading: existující <h3> nadpis, jehož text se přesune do nového
  //   <button> (nadpis samotný zůstává v DOM beze změny tagu/textu).
  // contentEls: pole DOM prvků, které se přesunou do sbalitelného
  //   obalu za nadpisem (odstavce a seznamy popisu, nebo tabulka
  //   parametrů).
  // idBase: id pro nový obal (kvůli aria-controls).
  function buildToggle(heading, contentEls, idBase){
    if(!heading || !contentEls.length) return;

    heading.classList.add('pp-detail-toggle');

    // Text nadpisu zůstává přesně stejný — jen ho přesuneme dovnitř
    // nového <button>, ať je nadpis pořád h3 (kvůli SEO/struktuře), ale
    // klikatelný je skutečný button prvek (nativní klávesnicová
    // ovladatelnost, žádné ruční ošetřování Enter/mezerníku).
    var headingText = heading.textContent.trim();
    heading.textContent = '';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pp-detail-toggle-btn';
    btn.setAttribute('aria-expanded', 'false');

    var label = document.createElement('span');
    label.className = 'pp-detail-toggle-label';
    label.textContent = headingText;

    var icon = document.createElement('span');
    icon.className = 'pp-detail-toggle-icon';
    icon.setAttribute('aria-hidden', 'true');

    btn.appendChild(label);
    btn.appendChild(icon);
    heading.appendChild(btn);

    var outer = document.createElement('div');
    outer.className = 'pp-detail-collapse';
    outer.id = idBase;
    var inner = document.createElement('div');
    inner.className = 'pp-detail-collapse-inner';
    outer.appendChild(inner);

    // Obal vložíme přesně tam, kde byl první přesouvaný prvek (hned za
    // nadpisem), pak do něj přesuneme všechny přesouvané prvky.
    heading.parentNode.insertBefore(outer, contentEls[0]);
    contentEls.forEach(function(el){ inner.appendChild(el); });

    btn.setAttribute('aria-controls', outer.id);

    btn.addEventListener('click', function(){
      var isOpen = outer.classList.toggle('pp-open');
      btn.classList.toggle('pp-open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  function setupParams(){
    var headings = document.querySelectorAll('.extended-description h3');
    Array.prototype.forEach.call(headings, function(h){
      if(h.textContent.trim() !== 'Doplňkové parametry' || h.dataset.toggleDone) return;
      var table = h.nextElementSibling;
      if(!table || table.tagName !== 'TABLE') return;
      h.dataset.toggleDone = '1';
      buildToggle(h, [table], 'pp-params');
    });
  }

  function setupBasicDescriptionToggle(){
    var basicDesc = document.querySelector('.basic-description');
    if(!basicDesc || basicDesc.dataset.toggleDone) return;

    var heading = basicDesc.querySelector('h3');
    if(!heading) return;

    // Vše, co v DOM následuje za nadpisem (odstavce, seznamy...) —
    // tohle jde do sbalitelného obalu. Pokud by za nadpisem nic nebylo
    // (prázdný popis), lištu vůbec nevytváříme.
    var contentEls = [];
    var node = heading.nextElementSibling;
    while(node){
      contentEls.push(node);
      node = node.nextElementSibling;
    }
    if(!contentEls.length) return;

    basicDesc.dataset.toggleDone = '1';
    buildToggle(heading, contentEls, 'pp-basic-description');
  }

  function setupLayout(){
    var infoWrapper = document.querySelector('.p-info-wrapper');
    if(!infoWrapper || infoWrapper.dataset.layoutDone) return;
    infoWrapper.dataset.layoutDone = '1';

    // Značka (Dell) je normálně dole u příznaků/hodnocení, mimo hlavičku
    // s nadpisem. Klient chce značku přímo na úrovni nadpisu H1 — proto
    // ji přesouváme rovnou do `.p-detail-inner-header` (ta obsahuje jen
    // H1), ne do pravého sloupce s cenou/popisem jako dřív (tam by byla
    // vizuálně o kus níž, protože ten sloupec začíná až pod celou
    // hlavičkou). CSS (produkt.css, sekce "Nadpis produktu + značka")
    // pak z hlavičky udělá flex řádek: nadpis vlevo, značka vpravo.
    var brandLink = document.querySelector('.p-detail-info [data-testid="productCardBrandName"]');
    var header = document.querySelector('.p-detail-inner-header');
    if(brandLink && header){
      var brandWrap = brandLink.parentElement;
      brandWrap.classList.add('p-brand-moved');
      header.appendChild(brandWrap);
    }

    // Kód produktu (normálně u nadpisu) přesunout vedle odkazu
    // "Detailní informace" — oba obalíme společným řádkem, aby byly
    // vedle sebe na jedné lince.
    var infoToggle = infoWrapper.querySelector('p[data-testid="productCardDescr"]');
    var code = document.querySelector('.p-code');
    if(infoToggle && code){
      var row = document.createElement('div');
      row.className = 'p-meta-row';
      infoToggle.parentNode.insertBefore(row, infoToggle);
      row.appendChild(infoToggle);
      row.appendChild(code);
    }
  }

  function setupVariantChips(){
    var container = document.getElementById('simple-variants');
    if(!container || container.dataset.chipsDone) return;
    container.dataset.chipsDone = '1';

    // Shoptet u tohoto produktu vykresluje všechny varianty se stejnou
    // fotkou (na serveru je jen jeden obrázek), takže kolečka byla bez
    // popisku vzájemně k nerozeznání. Text stavu ("Stav zboží: X") už
    // Shoptet do stránky vypisuje, jen skrytě — jako nativní tooltip
    // (data-original-title) u každé varianty. Přečteme ho a vypíšeme
    // rovnou do štítku i s krátkým barevným odznakem (písmeno stavu);
    // barvu podle stavu (Nové/A/B/C) přidává CSS přes třídu, kterou tu
    // jen určíme z textu.
    var labels = container.querySelectorAll('label.advanced-parameter');
    Array.prototype.forEach.call(labels, function(label){
      var inner = label.querySelector('.advanced-parameter-inner');
      if(!inner) return;
      var title = inner.getAttribute('data-original-title') || inner.getAttribute('title') || '';
      var value = title.indexOf(':') !== -1 ? title.split(':').slice(1).join(':').trim() : title.trim();
      if(!value) return;

      var words = value.split(/\s+/);
      var last = words[words.length - 1];
      var key, avatarText;
      if(/^[A-D]$/.test(last)){
        key = 'grade-' + last.toLowerCase();
        avatarText = last.toUpperCase();
      } else if(/^nov/i.test(value)){
        key = 'new';
        avatarText = 'N';
      } else {
        key = 'default';
        avatarText = value.charAt(0).toUpperCase();
      }
      label.classList.add('variant-chip', 'variant-chip--' + key);

      var avatarEl = inner.querySelector('.variant-chip-avatar');
      if(!avatarEl){
        avatarEl = document.createElement('span');
        avatarEl.className = 'variant-chip-avatar';
        inner.appendChild(avatarEl);
      }
      avatarEl.textContent = avatarText;

      // "Repasované A" -> "Stav A" (klient si tohle po kole 8 ještě sám
      // doladil přímo v nasazeném souboru — místo zkratky "Rep." chtěl
      // "Stav", ať je hned jasné, že jde o stav zboží, ne o zkratku
      // slova "repasované"; ponecháváme stejné, ať se scratchpad shoduje
      // s tím, co je skutečně nasazené).
      var shortLabel = value.replace(/^Repasované\s+/i, 'Stav ');
      var textEl = inner.querySelector('.variant-chip-label');
      if(!textEl){
        textEl = document.createElement('span');
        textEl.className = 'variant-chip-label';
        inner.appendChild(textEl);
      }
      textEl.textContent = shortLabel;
    });
  }

  function init(){
    setupActionIcons();
    setupParams();
    setupBasicDescriptionToggle();
    setupLayout();
    setupVariantChips();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();