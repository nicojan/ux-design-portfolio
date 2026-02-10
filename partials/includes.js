/**
 * Lightweight HTML includes for static sites.
 *
 * Usage: add placeholder elements in your HTML —
 *   <div data-include="partials/nav.html"></div>
 *   <div data-include="partials/footer.html"></div>
 *
 * Works with file:// protocol (no server required) by using
 * synchronous XMLHttpRequest. Fires "includes:loaded" on
 * <document> after all partials are injected so page-level JS
 * can safely query elements inside partials.
 */
(function () {
  "use strict";

  var slots = document.querySelectorAll("[data-include]");

  slots.forEach(function (slot) {
    var url = slot.getAttribute("data-include");
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false); // synchronous
      xhr.send();
      if (xhr.status === 200 || xhr.status === 0) {
        // status 0 is normal for file:// protocol
        slot.outerHTML = xhr.responseText;
      }
    } catch (e) {
      console.error("Failed to load partial: " + url, e);
    }
  });

  document.dispatchEvent(new CustomEvent("includes:loaded"));
})();
