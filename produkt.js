/* PRODUKT.JS — patří k produkt.css (detail produktu). */
(function(){
  function setupActionIcons(){
    var panel = document.querySelector('.social-buttons-wrapper .link-icons[data-testid="productDetailActionIcons"]');
    if(!panel || panel.dataset.enhanced) return;
    panel.dataset.enhanced = '1';
    panel.classList.add('link-icons-panel');

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'link-icons-toggle';
    toggle.setAttribute('aria-label', 'Další možnosti (tisk, sdílet, zeptat se)');
    toggle.innerHTML = '<span class="li-dots"><span></span><span></span><span></span></span><span>Další možnosti</span>';
    panel.parentNode.insertBefore(toggle, panel);

    toggle.addEventListener('click', function(e){
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    document.addEventListener('click', function(e){
      if(panel.classList.contains('open') && !panel.contains(e.target) && e.target !== toggle){
        panel.classList.remove('open');
      }
    });
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

  function init(){
    setupActionIcons();
    setupParams();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();