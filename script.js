(function(){
  function forceMenu(){
    var nav = document.querySelector('#navigation .menu-level-1');
    var burger = document.querySelector('#navigation .menu-helper, #navigation [data-testid="hamburgerMenu"]');
    if (window.innerWidth >= 1024) {
      if (nav) {
        nav.style.setProperty('display','flex','important');
        nav.style.setProperty('flex-wrap','nowrap','important');
      }
      if (burger) burger.style.setProperty('display','none','important');
    }
  }
  forceMenu();
  window.addEventListener('resize', forceMenu);
  var navEl = document.querySelector('#navigation .menu-level-1');
  if (navEl && window.MutationObserver) {
    new MutationObserver(forceMenu).observe(navEl, {attributes:true, attributeFilter:['style','class']});
  }
})();