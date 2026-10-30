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

  // Season calendar: highlight this month and list the trips that are at their best now
  var season = document.getElementById("season");
  if (season) {
    var m = new Date().getMonth();
    $$('[data-m="' + m + '"]', season).forEach(function (c) { c.classList.add("cur"); });
    var monthName = season.querySelectorAll("thead th")[m + 1].textContent;
    var best = $$("tbody tr", season).filter(function (r) {
      var cell = r.querySelector('td[data-m="' + m + '"]');
      return cell && cell.getAttribute("data-s") === "b";
    }).map(function (r) { return r.querySelector("th a"); });
    var now = document.getElementById("now-good");
    if (now && best.length) {
      var label = document.createElement("b");
      label.textContent = "Best in " + monthName + ":";
      now.appendChild(label);
      best.forEach(function (a, i) {
        var link = document.createElement("a");
        link.href = a.getAttribute("href");
        link.textContent = a.textContent;
        now.appendChild(link);
        if (i < best.length - 1) now.appendChild(document.createTextNode("·"));
      });
      now.hidden = false;
    }
  }

  // Share and copy-link buttons (trip pages)
  var msg = document.querySelector(".copy-msg");
  var say = function (text) { if (msg) { msg.textContent = text; setTimeout(function () { msg.textContent = ""; }, 2500); } };
  $$("[data-share]").forEach(function (b) {
    if (!navigator.share) return;
    b.hidden = false;
    b.addEventListener("click", function () {
      navigator.share({ title: b.getAttribute("data-title"), url: b.getAttribute("data-share") }).catch(function () {});
    });
  });
  $$("[data-copy]").forEach(function (b) {
    if (!navigator.clipboard) return;
    b.hidden = false;
    b.addEventListener("click", function () {
      navigator.clipboard.writeText(b.getAttribute("data-copy"))
        .then(function () { say("Link copied."); })
        .catch(function () { say("Couldn’t copy. Copy the address from your browser instead."); });
    });
  });

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
