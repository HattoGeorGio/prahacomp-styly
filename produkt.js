/* PRODUKT.JS — patří k produkt.css (detail produktu).
   Řeší tři věci, které Shoptet sám neumí / kde je potřeba přesunout
   prvky mimo jejich výchozí místo v DOM:
   1) ikony Tisk/Zeptat se/Sdílet — schované za tlačítko "•••", navíc
      přesunuté vedle "Skladem"
   2) tabulku "Doplňkové parametry" schovanou pod klikací nadpis
   3) přesun Značky (vedle nadpisu H1, do hlavičky produktu) a kódu
      produktu (vedle "Detailní informace") z hlavičky dolů/vedle,
      viz setupLayout() níž
   Načítá se přes <script src="...produkt.js?v=3"> v Zápatí — soubor
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

  function setupParams(){
    var headings = document.querySelectorAll('.extended-description h3');
    Array.prototype.forEach.call(headings, function(h){
      if(h.textContent.trim() !== 'Doplňkové parametry' || h.dataset.enhanced) return;
      h.dataset.enhanced = '1';
      var table = h.nextElementSibling;
      if(!table || table.tagName !== 'TABLE') return;
      h.classList.add('params-toggle');
      table.classList.add('params-collapsible');
      h.addEventListener('click', function(){
        h.classList.toggle('open');
        table.classList.toggle('open');
      });
    });
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

  function init(){
    setupActionIcons();
    setupParams();
    setupLayout();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();