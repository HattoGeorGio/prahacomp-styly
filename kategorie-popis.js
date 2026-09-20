/* KATEGORIE-POPIS.JS — patří ke kategorie-popis.css (nadpis + popisy
   kategorie).
   Řeší jednu věc, kterou samotné CSS nezvládne: schovávací lištu
   "Zobrazit podrobnosti" nad dlouhým SEO popisem kategorie
   (.category__secondDescription), protože potřebuje kliknutím přepínat
   třídu (stejný princip jako rozbalovací "Doplňkové parametry" na
   detailu produktu v produkt.js).

   Co skript dělá — a co NEDĚLÁ — s obsahem popisu:
   1) Vezme existující ".category__secondDescription" (nadpisy H2/H3,
      odstavce — přesně to, co si klient nastaví v administraci
      kategorie kvůli SEO) a jen ji OBALÍ dvěma novými, prázdnými
      wrapper-divy (kvůli plynulé animaci výšky). Samotný element, jeho
      třída, atributy i všechny potomci zůstávají beze změny — nic se
      neupravuje, nemaže ani nepřejmenovává. Klientovo SEO nastavení v
      administraci kategorie tím není nijak dotčené.
   2) Před tenhle obal vloží tlačítko "Zobrazit podrobnosti" / "Skrýt
      podrobnosti", které při kliknutí přepíná třídu "kp-open" (vzhled a
      animace řeší kategorie-popis.css).
   3) Pokud je popis kategorie prázdný (klient ho u dané kategorie
      nevyplnil) nebo na stránce vůbec není, nic nevytváří — žádná
      prázdná lišta na stránce.

   Načítá se přes <script src="...kategorie-popis.js?v=1"> v Zápatí —
   soubor samotný je na GitHubu spolu s ostatními CSS/JS soubory, stejný
   princip jako style.css/kategorie.css/produkt.css/produkt.js (žádné
   kopírování kódu do administrace, jen jedna řádka <script src>). */
(function(){
  function setupSecondDescriptionToggle(){
    var desc = document.querySelector('.category__secondDescription');
    if(!desc || desc.dataset.toggleDone) return;

    // Prázdný popis (klient ho u téhle kategorie zatím nevyplnil) —
    // lištu vůbec nepřidáváme, nemá co skrývat/zobrazovat.
    if(!desc.textContent.trim()) return;

    desc.dataset.toggleDone = '1';

    // Potřebujeme "id" pro aria-controls; pokud Shoptet žádné nedal,
    // doplníme vlastní.
    if(!desc.id) desc.id = 'kp-second-description';

    var outer = document.createElement('div');
    outer.className = 'kp-collapse';
    var inner = document.createElement('div');
    inner.className = 'kp-collapse-inner';

    desc.parentNode.insertBefore(outer, desc);
    outer.appendChild(inner);
    inner.appendChild(desc);

    var bar = document.createElement('button');
    bar.type = 'button';
    bar.className = 'kp-toggle-bar';
    bar.setAttribute('aria-expanded', 'false');
    bar.setAttribute('aria-controls', desc.id);

    var label = document.createElement('span');
    label.className = 'kp-toggle-label';
    label.textContent = 'Zobrazit podrobnosti';

    var icon = document.createElement('span');
    icon.className = 'kp-toggle-icon';
    icon.setAttribute('aria-hidden', 'true');

    bar.appendChild(label);
    bar.appendChild(icon);
    outer.parentNode.insertBefore(bar, outer);

    bar.addEventListener('click', function(){
      var isOpen = outer.classList.toggle('kp-open');
      bar.classList.toggle('kp-open', isOpen);
      bar.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      label.textContent = isOpen ? 'Skrýt podrobnosti' : 'Zobrazit podrobnosti';
    });
  }

  function init(){
    setupSecondDescriptionToggle();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();