/* ================= Resources topic filter =================
   Filters the guide grid by tag. Progressive enhancement: without JS the
   filter row is hidden by CSS and every card stays visible. */
(function () {
  "use strict";

  var grid = document.getElementById("res-grid");
  var filters = document.querySelectorAll(".res-filter");
  var empty = document.getElementById("res-empty");
  if (!grid || !filters.length) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".res-card"));
  document.documentElement.classList.add("has-res-filter");

  function apply(tag) {
    var shown = 0;
    cards.forEach(function (card) {
      var match = tag === "All" || card.dataset.tag === tag;
      card.hidden = !match;
      if (match) shown++;
    });
    if (empty) empty.hidden = shown > 0;

    filters.forEach(function (b) {
      var on = b.dataset.filter === tag;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
    });

    if (window.TechnaufSound) window.TechnaufSound.tick();
  }

  filters.forEach(function (b) {
    b.setAttribute("aria-pressed", String(b.classList.contains("on")));
    b.addEventListener("click", function () { apply(b.dataset.filter); });
  });
})();
