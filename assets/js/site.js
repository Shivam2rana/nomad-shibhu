// Small progressive enhancements. Every page works without this file.
(function () {
  "use strict";
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // Trip filters and search (home page)
  var grid = document.getElementById("grid");
  if (grid) {
    var cards = $$(".card", grid);
    var empty = document.getElementById("no-match");
    var input = document.getElementById("q");
    var active = "All";
    var apply = function () {
      var q = (input && input.value || "").trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var tags = (c.getAttribute("data-tags") || "").split("|");
        var ok = (active === "All" || tags.indexOf(active) >= 0) &&
                 (!q || (c.getAttribute("data-text") || "").indexOf(q) >= 0);
        c.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    };
    $$(".chip").forEach(function (b) {
      b.addEventListener("click", function () {
        active = b.getAttribute("data-f");
        $$(".chip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        apply();
      });
    });
    var form = document.getElementById("search");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      apply();
      document.getElementById("trips").scrollIntoView();
    });
    if (input) input.addEventListener("input", apply);
  }

  // Rotating place name in the hero
  var rot = document.getElementById("rot");
  if (rot && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var names = (rot.getAttribute("data-names") || "").split("|").filter(Boolean);
    var i = 0;
    if (names.length > 1) setInterval(function () {
      rot.classList.add("out");
      setTimeout(function () { i = (i + 1) % names.length; rot.textContent = names[i]; rot.classList.remove("out"); }, 350);
    }, 2600);
  }

  // Photo lightbox (trip pages)
  $$(".gallery a[data-full]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var box = document.createElement("div");
      box.className = "lightbox";
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-label", "Photo");
      var img = document.createElement("img");
      img.src = a.getAttribute("href");
      img.alt = a.querySelector("img") ? a.querySelector("img").alt : "";
      var close = document.createElement("button");
      close.type = "button";
      close.className = "btn btn-soft";
      close.textContent = "Close";
      box.appendChild(img);
      box.appendChild(close);
      var done = function () { box.remove(); document.removeEventListener("keydown", onKey); a.focus(); };
      var onKey = function (ev) { if (ev.key === "Escape") done(); };
      box.addEventListener("click", done);
      document.addEventListener("keydown", onKey);
      document.body.appendChild(box);
      close.focus();
    });
  });
})();
