// Version « planification familiale » : filtre des méthodes contraceptives.
// Sans JavaScript, toutes les méthodes restent affichées (les filtres sont masqués).
(function () {
  "use strict";

  var chips = document.querySelectorAll(".filters .chip");
  var methods = document.querySelectorAll(".method");
  if (!chips.length || !methods.length) return;

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var filter = chip.dataset.filter;
      chips.forEach(function (c) {
        var active = c === chip;
        c.classList.toggle("on", active);
        c.setAttribute("aria-pressed", String(active));
      });
      methods.forEach(function (method) {
        var tags = (method.dataset.tags || "").split(" ");
        var show = filter === "all" || tags.indexOf(filter) !== -1;
        method.hidden = !show;
        // Les cartes révélées par le filtre doivent être visibles immédiatement.
        if (show) method.classList.add("is-visible");
      });
    });
  });
})();
