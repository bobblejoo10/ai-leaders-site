(function(){
  function ready(fn){
    if(document.readyState === "loading"){
      document.addEventListener("DOMContentLoaded", fn);
    }else{
      fn();
    }
  }

  ready(function(){
    function rootUrlFromHtmlIndex(url){
      if(!url || url.origin !== window.location.origin) return "";
      if(!/\/html\/index\.html$/i.test(url.pathname)) return "";
      return url.origin + url.pathname.replace(/\/html\/index\.html$/i, "/") + url.search + url.hash;
    }

    var currentRootUrl = rootUrlFromHtmlIndex(window.location);
    if(currentRootUrl){
      window.history.replaceState(window.history.state, document.title, currentRootUrl);
    }

    document.addEventListener("click", function(event){
      if(event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
      if(!link || link.target && link.target !== "_self") return;
      var normalized = rootUrlFromHtmlIndex(new URL(link.getAttribute("href"), document.baseURI));
      if(!normalized) return;
      event.preventDefault();
      window.location.href = normalized;
    }, true);

    var nav = document.getElementById("nav");
    var hamb = document.getElementById("hamb");
    if(!nav || !hamb || nav.__aiLeadersMobileNav) return;
    nav.__aiLeadersMobileNav = true;

    var items = Array.prototype.slice.call(nav.querySelectorAll(".nav-item")).filter(function(item){
      return item.querySelector(".dropdown") && item.querySelector(".nav-link");
    });

    function isMobileMenu(){
      return window.innerWidth <= 900 && nav.classList.contains("open");
    }

    function closeSubmenus(except){
      items.forEach(function(item){
        if(item === except) return;
        item.classList.remove("sub-open");
        var link = item.querySelector(".nav-link");
        if(link) link.setAttribute("aria-expanded", "false");
      });
    }

    items.forEach(function(item){
      var link = item.querySelector(".nav-link");
      link.setAttribute("aria-haspopup", "true");
      link.setAttribute("aria-expanded", "false");
      link.addEventListener("click", function(event){
        if(!isMobileMenu()) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        var willOpen = !item.classList.contains("sub-open");
        closeSubmenus(item);
        item.classList.toggle("sub-open", willOpen);
        link.setAttribute("aria-expanded", String(willOpen));
      }, true);
    });

    hamb.addEventListener("click", function(){
      window.setTimeout(function(){
        var open = nav.classList.contains("open");
        if(open) closeSubmenus();
        hamb.setAttribute("aria-expanded", String(open));
        hamb.setAttribute("aria-label", open ? "\uBA54\uB274 \uB2EB\uAE30" : "\uBA54\uB274 \uC5F4\uAE30");
      }, 0);
    });

    window.addEventListener("resize", function(){
      if(window.innerWidth > 900) closeSubmenus();
    }, { passive: true });
  });
})();
