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

// Enquiry form: builds the message and opens the visitor's WhatsApp, email or Instagram.
(function () {
  "use strict";
  var form = document.getElementById("enq");
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var err = $("enq-err"), ok = $("enq-ok"), fb = $("enq-fallback");
  try {
    var want = new URLSearchParams(location.search).get("trip");
    if (want && /^[a-z0-9-]{2,60}$/.test(want)) {
      var sel = $("e-trip");
      for (var i = 0; i < sel.options.length; i++) if (sel.options[i].value === want) sel.selectedIndex = i;
    }
  } catch (e) {}
  form.addEventListener("submit", function (e) { e.preventDefault(); });

  var clean = function (s, n) { return String(s || "").replace(/[\u0000-\u0008\u000b-\u001f]/g, "").trim().slice(0, n); };
  var build = function () {
    var name = clean($("e-name").value, 60);
    if (!name) {
      $("e-name").setAttribute("aria-invalid", "true");
      err.textContent = "Add your name so I know who’s asking.";
      $("e-name").focus();
      return null;
    }
    $("e-name").removeAttribute("aria-invalid");
    err.textContent = "";
    var tripSel = $("e-trip");
    var people = Math.max(1, Math.min(50, parseInt($("e-people").value, 10) || 1));
    var lines = [
      "Hi Shivam, I found your trip site and want to plan a trip.",
      "",
      "Name: " + name,
      "Trip: " + (tripSel.value ? tripSel.options[tripSel.selectedIndex].text : "Please suggest one"),
      "When: " + ($("e-month").value || "Flexible"),
      "People: " + people,
      "Experience: " + $("e-exp").value
    ];
    var phone = clean($("e-phone").value, 20).replace(/[^\d+\s-]/g, "");
    if (phone) lines.push("Phone: " + phone);
    var msg = clean($("e-msg").value, 800);
    if (msg) lines.push("", msg);
    return { text: lines.join("\n"), trip: tripSel.value ? tripSel.options[tripSel.selectedIndex].text : "Trip enquiry" };
  };
  var open = function (url) {
    var w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) location.href = url;
  };

  Array.prototype.forEach.call(form.querySelectorAll("[data-send]"), function (b) {
    b.addEventListener("click", function () {
      var m = build();
      if (!m) return;
      ok.textContent = ""; fb.hidden = true;
      var how = b.getAttribute("data-send");
      if (how === "whatsapp") {
        open("https://wa.me/" + form.getAttribute("data-wa") + "?text=" + encodeURIComponent(m.text));
        ok.textContent = "WhatsApp is opening with your message. Tap Send there.";
      } else if (how === "email") {
        location.href = "mailto:" + form.getAttribute("data-email") +
          "?subject=" + encodeURIComponent("Trip enquiry: " + m.trip) + "&body=" + encodeURIComponent(m.text);
        ok.textContent = "Your email app is opening with the message. Tap Send there.";
      } else {
        var go = function (copied) {
          if (copied) ok.textContent = "Message copied. Paste it in the Instagram chat that opens, then send.";
          else { $("e-copy").value = m.text; fb.hidden = false; ok.textContent = "Copy the message below and paste it in the Instagram chat."; }
          open(form.getAttribute("data-ig"));
        };
        if (navigator.clipboard) navigator.clipboard.writeText(m.text).then(function () { go(true); }, function () { go(false); });
        else go(false);
      }
    });
  });
})();
