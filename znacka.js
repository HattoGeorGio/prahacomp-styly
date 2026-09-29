/* ZNACKA.JS — patří ke znacka.css (stránka jedné značky, např. /zalman/).
   Řeší jednu věc, kterou samotné CSS nezvládne: klient chtěl nadpis
   značky (H1) vizuálně oddělený od karty s popisem/odkazem na web
   výrobce — stejně jako na stránce kategorie, kde je H1 samostatně
   NAD kartou `.category-perex`, ne uvnitř ní.

   Na stránce značky je ale H1 i zbytek (strong s odkazem, popisný
   odstavec) od Shoptetu vykreslený jako sourozenci v jednom společném
   <div class="manufacturerDetail"> — čistě CSS nejde nadpis "vyndat"
   z boxu, aniž by box obsahoval i jeho plochu (box by musel obalovat
   všechny tři prvky včetně H1). Řešení (stejný princip jako sbalovací
   lišta v kategorie-popis.js): po načtení stránky přesuneme všechno,
   co stojí ZA H1, do nového obalového <div class="manufacturer-info-box">
   — H1 zůstává na svém místě, mimo box, box dostává v znacka.css
   stejný vizuální styl jako .category-perex na kategorii.

   Co skript dělá — a co NEDĚLÁ:
   1) Najde <h1 class="category-title"> uvnitř .manufacturerDetail.
   2) Vytvoří nový prázdný <div class="manufacturer-info-box"> a vloží
      ho hned za H1.
   3) Do něj přesune (ne zkopíruje) VŠECHNY uzly, které v DOM stály za
      H1 — bez ohledu na to, kolik jich je a jaký mají tag (dnes je to
      <strong> s odkazem a <p> s popisem, ale skript se na přesný počet
      ani typ nijak neváže, aby fungoval i kdyby Shoptet strukturu
      časem změnil). Obsah samotný (text, odkazy, atributy) se nijak
      needituje ani nemaže.
   4) Pokud by po H1 nic nezbylo (značka bez popisu i bez odkazu na
      web), prázdnou kartu vůbec nevkládá.

   Načítá se přes <script src="...znacka.js?v=1"> v Zápatí — soubor je
   na stejném GitHub repozitáři jako ostatní CSS/JS soubory, stejný
   princip jako kategorie-popis.js/produkt.js (žádné kopírování kódu do
   administrace, jen jedna řádka <script src>). */
(function(){
  function setupManufacturerHero(){
    var wrap = document.querySelector('.manufacturerDetail');
    if(!wrap || wrap.dataset.splitDone) return;

    var h1 = wrap.querySelector(':scope > h1.category-title');
    if(!h1) return;

    wrap.dataset.splitDone = '1';

    var box = document.createElement('div');
    box.className = 'manufacturer-info-box';

    var node = h1.nextSibling;
    while(node){
      var next = node.nextSibling;
      box.appendChild(node);
      node = next;
    }

    // Značka bez popisu i bez odkazu na web (po H1 nic nezbylo) —
    // prázdnou kartu vůbec nevkládáme.
    if(box.children.length === 0) return;

    wrap.appendChild(box);
  }

  function init(){
    setupManufacturerHero();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
