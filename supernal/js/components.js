// Just something I learned while building my own sites to avoid adjusting every navbar and footer.

(function () {
  "use strict";

  var path = window.location.pathname;
  var filename = path.substring(path.lastIndexOf("/") + 1) || "index.html";
  var slug = filename.replace(".html", "") || "index";
  var isHome = slug === "index";

  var logoTag = isHome ? "h1" : "p";

  var footerSearchId = isHome ? "footer-search" : "footer-search-" + slug;

  var headerHTML = [
    '<div class="container header-inner">',
    "  <" +
      logoTag +
      ' class="logo"><a href="index.html">Supernal</a></' +
      logoTag +
      ">",
    '  <button class="nav-toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Menu">',
    '    <i class="fa-solid fa-bars" aria-hidden="true"></i>',
    "  </button>",
    '  <nav id="nav-menu" aria-label="Main navigation">',
    '    <ul class="nav-links">',
    '      <li><a href="story.html">Cosmography</a></li>',
    '      <li><a href="romantic-abyss.html">Iconography</a></li>',
    '      <li><a href="nuremberg.html">Phenomena</a></li>',
    '      <li><a href="caetani.html">Cartography</a></li>',
    "    </ul>",
    "  </nav>",
    '  <form class="search-form header-search" role="search">',
    '    <label for="search" class="sr-only">Search articles</label>',
    '    <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>',
    '    <input type="search" id="search" placeholder="Search...">',
    "  </form>",
    "</div>",
  ].join("\n");

  var footerHTML = [
    '<div class="container footer-inner">',
    '  <div class="footer-grid">',
    '    <div class="footer-column">',
    "      <h3>Sections</h3>",
    "      <ul>",
    '        <li><a href="story.html">Cosmography</a></li>',
    '        <li><a href="romantic-abyss.html">Iconography</a></li>',
    '        <li><a href="nuremberg.html">Phenomena</a></li>',
    '        <li><a href="caetani.html">Cartography</a></li>',
    "      </ul>",
    "    </div>",
    '    <div class="footer-column">',
    "      <h3>About</h3>",
    "      <ul>",
    '        <li><a href="about.html">About This Project</a></li>',
    '        <li><a href="about.html">Sources</a></li>',
    '        <li><a href="contact.html">Contact</a></li>',
    "      </ul>",
    "    </div>",
    '    <div class="footer-column">',
    "      <h3>Resources</h3>",
    "      <ul>",
    '        <li><a href="https://publicdomainreview.org/" target="_blank" rel="noopener">Public Domain Review</a></li>',
    '        <li><a href="https://archive.org/" target="_blank" rel="noopener">Internet Archive</a></li>',
    '        <li><a href="https://digital.library.cornell.edu/" target="_blank" rel="noopener">Cornell Libraries</a></li>',
    "      </ul>",
    "    </div>",
    '    <div class="footer-column">',
    "      <h3>Search</h3>",
    '      <form class="search-form footer-search" role="search">',
    '        <label for="' +
      footerSearchId +
      '" class="sr-only">Search articles</label>',
    '        <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>',
    '        <input type="search" id="' +
      footerSearchId +
      '" placeholder="Search articles...">',
    "      </form>",
    "    </div>",
    "  </div>",
    '  <div class="footer-bottom">',
    '    <p class="footer-copyright">All images sourced from the public domain.</p>',
    '    <nav class="social-links" aria-label="Social media">',
    '      <a href="404.html" aria-label="Twitter / X"><i class="fa-brands fa-x-twitter" aria-hidden="true"></i></a>',
    '      <a href="404.html" aria-label="Instagram"><i class="fa-brands fa-instagram" aria-hidden="true"></i></a>',
    '      <a href="404.html" aria-label="RSS feed"><i class="fa-solid fa-rss" aria-hidden="true"></i></a>',
    "    </nav>",
    "  </div>",
    "</div>",
  ].join("\n");

  var headerEl = document.getElementById("site-header");
  var footerEl = document.getElementById("site-footer");

  if (headerEl) {
    headerEl.innerHTML = headerHTML;
  }
  if (footerEl) {
    footerEl.innerHTML = footerHTML;
  }

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("#nav-menu");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", !expanded);
      nav.classList.toggle("is-open");
    });
  }
})();
