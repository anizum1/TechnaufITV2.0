/* ================= Technauf services carousel =================
   A true 360° ring: the five service categories sit on the face of a
   virtual cylinder that spins side to side. Drag, swipe, scroll, arrow
   keys, or the nav buttons rotate it; the card at the front is active,
   and activating it expands that category's sub-services below.

   Progressive enhancement: the markup is a plain readable list until
   this script marks the carousel ready, so it degrades gracefully. */
(function () {
  "use strict";

  var carousel = document.getElementById("svc-carousel");
  if (!carousel) return;

  var ring = carousel.querySelector(".svc-ring");
  var cards = Array.prototype.slice.call(carousel.querySelectorAll(".svc-card"));
  var detail = carousel.querySelector(".svc-detail");
  var dotsBox = carousel.querySelector(".svc-dots");
  var prevBtn = carousel.querySelector(".svc-prev");
  var nextBtn = carousel.querySelector(".svc-next");
  var label = carousel.querySelector(".svc-active-label");
  var n = cards.length;
  if (!ring || n === 0) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var sound = function (name) {
    if (window.TechnaufSound && window.TechnaufSound[name]) window.TechnaufSound[name]();
  };

  var step = 360 / n;
  var index = 0;          // unbounded: lets the ring spin past 360° forever
  var angle = 0;          // current ring rotation in degrees
  var target = 0;         // where the ring is easing toward
  var radius = 420;
  var raf = null;
  var dragging = false;

  function activeIndex() { return ((index % n) + n) % n; }

  function measure() {
    var w = cards[0].getBoundingClientRect().width || 360;
    // Radius that places n cards evenly around a circle without overlap,
    // plus breathing room so neighbours read as separate objects.
    radius = Math.round((w / 2) / Math.tan(Math.PI / n) * 1.42);
    ring.style.setProperty("--radius", radius + "px");
    cards.forEach(function (card, i) {
      card.style.transform = "rotateY(" + (i * step) + "deg) translateZ(" + radius + "px)";
    });
    render();
  }

  /* Paint depth cues from each card's real angular distance to the front,
     so partial rotations mid-drag look continuous rather than stepped. */
  function render() {
    cards.forEach(function (card, i) {
      var a = i * step + angle;
      a = ((a % 360) + 540) % 360 - 180;   // normalize to [-180, 180]
      var d = Math.min(Math.abs(a) / 90, 1);
      card.style.setProperty("--d", d.toFixed(3));
      card.style.zIndex = String(100 - Math.round(Math.abs(a)));
      var isFront = Math.abs(a) < step / 2;
      card.classList.toggle("is-front", isFront);
      card.setAttribute("aria-hidden", isFront ? "false" : "true");
      card.querySelectorAll("button, a").forEach(function (el) {
        if (isFront) el.removeAttribute("tabindex");
        else el.setAttribute("tabindex", "-1");
      });
    });
    ring.style.transform = "translateZ(-" + radius + "px) rotateY(" + angle + "deg)";
  }

  function loop() {
    var diff = target - angle;
    // Snap once the remaining travel is sub-pixel — the exponential tail is
    // invisible but keeps the ring "moving", which blocks clicks on the card.
    if (Math.abs(diff) < 0.3) {
      angle = target;
      render();
      raf = null;
      return;
    }
    angle += diff * 0.2;
    render();
    raf = requestAnimationFrame(loop);
  }

  function animate() {
    if (reduced) { angle = target; render(); return; }
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function syncChrome() {
    var a = activeIndex();
    if (dotsBox) {
      dotsBox.querySelectorAll("button").forEach(function (d, i) {
        d.classList.toggle("on", i === a);
        d.setAttribute("aria-selected", String(i === a));
      });
    }
    if (label) label.textContent = cards[a].dataset.title || "";
    // Only the active category's panel is reachable.
    if (detail) {
      detail.querySelectorAll(".svc-panel").forEach(function (p) {
        p.classList.toggle("on", p.dataset.panel === cards[a].dataset.cat);
      });
    }
  }

  function go(i, opts) {
    opts = opts || {};
    var changed = i !== index;
    index = i;
    target = -index * step;
    animate();
    syncChrome();
    if (changed && opts.silent !== true) sound("tick");
  }

  /* Rotate to whichever card is nearest, respecting the direction the
     ring is already wound so it never spins the long way round. */
  function goToCategory(cat, opts) {
    var want = cards.findIndex(function (c) { return c.dataset.cat === cat; });
    if (want < 0) return;
    var cur = activeIndex();
    var delta = want - cur;
    if (delta > n / 2) delta -= n;
    if (delta < -n / 2) delta += n;
    go(index + delta, opts);
  }

  /* ---------- expand / collapse a category's sub-services ---------- */
  function panelFor(cat) {
    return detail && detail.querySelector('.svc-panel[data-panel="' + cat + '"]');
  }

  function setExpanded(cat, open) {
    var panel = panelFor(cat);
    if (!panel) return;
    var body = panel.querySelector(".svc-panel-body");
    panel.classList.toggle("open", open);
    if (body) body.style.maxHeight = open ? body.scrollHeight + "px" : "0px";
    cards.forEach(function (c) {
      if (c.dataset.cat !== cat) return;
      var btn = c.querySelector(".svc-card-cta");
      if (btn) {
        btn.setAttribute("aria-expanded", String(open));
        var txt = btn.querySelector(".svc-card-cta-text");
        if (txt) txt.textContent = open ? "Hide services" : "View services";
      }
    });
    sound(open ? "pop" : "close");
    if (open) {
      // The panel changed height; keep it in view without yanking the page.
      requestAnimationFrame(function () {
        var r = panel.getBoundingClientRect();
        if (r.bottom > window.innerHeight) {
          panel.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
        }
      });
    }
  }

  function toggleExpanded(cat) {
    var panel = panelFor(cat);
    if (!panel) return;
    // One open category at a time keeps the page from ballooning.
    detail.querySelectorAll(".svc-panel.open").forEach(function (p) {
      if (p !== panel) setExpanded(p.dataset.panel, false);
    });
    setExpanded(cat, !panel.classList.contains("open"));
  }

  /* ---------- sub-service items expand for their own detail ---------- */
  if (detail) {
    detail.querySelectorAll(".svc-item-head").forEach(function (head) {
      head.addEventListener("click", function () {
        var item = head.closest(".svc-item");
        var body = item.querySelector(".svc-item-more");
        var open = item.classList.toggle("open");
        head.setAttribute("aria-expanded", String(open));
        if (body) body.style.maxHeight = open ? body.scrollHeight + "px" : "0px";
        // Re-measure the parent panel, which just grew or shrank.
        var panel = item.closest(".svc-panel");
        var pbody = panel && panel.querySelector(".svc-panel-body");
        if (pbody && panel.classList.contains("open")) {
          pbody.style.maxHeight = "none";
          var h = pbody.scrollHeight;
          pbody.style.maxHeight = h + "px";
        }
        sound(open ? "pop" : "close");
      });
    });
  }

  /* ---------- build dots ---------- */
  if (dotsBox) {
    cards.forEach(function (card, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", card.dataset.title || "Category " + (i + 1));
      b.addEventListener("click", function () { goToCategory(card.dataset.cat); });
      dotsBox.appendChild(b);
    });
  }

  /* ---------- controls ---------- */
  if (prevBtn) prevBtn.addEventListener("click", function () { go(index - 1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { go(index + 1); });

  cards.forEach(function (card) {
    // Bound directly rather than delegated from the card: the stage holds
    // pointer capture during a drag, which makes delegated clicks unreliable.
    var cta = card.querySelector(".svc-card-cta");
    if (cta) {
      cta.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (dragged) return;
        if (!card.classList.contains("is-front")) goToCategory(card.dataset.cat);
        else toggleExpanded(card.dataset.cat);
      });
    }
    card.addEventListener("click", function () {
      if (dragged || card.classList.contains("is-front")) return;
      goToCategory(card.dataset.cat);
    });
  });

  carousel.setAttribute("tabindex", "0");
  carousel.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    else if (e.key === "Enter" || e.key === " ") {
      if (e.target === carousel) {
        e.preventDefault();
        toggleExpanded(cards[activeIndex()].dataset.cat);
      }
    }
  });

  /* ---------- drag / swipe ---------- */
  var startX = 0, startAngle = 0, dragged = false, pointerId = null;
  var stage = carousel.querySelector(".svc-stage");

  var pending = false;

  stage.addEventListener("pointerdown", function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    pending = true;
    dragging = false;
    dragged = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startAngle = angle;
  });

  stage.addEventListener("pointermove", function (e) {
    if (!pending) return;
    var dx = e.clientX - startX;
    if (!dragging) {
      if (Math.abs(dx) <= 4) return;
      // Only now is this a drag. Capture is deliberately deferred to here:
      // capturing on pointerdown would retarget the following click to the
      // stage, so buttons inside the cards would never fire.
      dragging = true;
      dragged = true;
      try { stage.setPointerCapture(pointerId); } catch (err) {}
      carousel.classList.add("is-dragging");
    }
    // ~0.35° per pixel: a comfortable full-card sweep in a short flick.
    angle = startAngle + dx * 0.35;
    target = angle;
    render();
  });

  function endDrag() {
    if (!pending) return;
    pending = false;
    var wasDragging = dragging;
    dragging = false;
    carousel.classList.remove("is-dragging");
    if (pointerId !== null) {
      try { stage.releasePointerCapture(pointerId); } catch (err) {}
      pointerId = null;
    }
    if (!wasDragging) return;   // a plain click — leave the ring alone
    go(Math.round(-angle / step));
    setTimeout(function () { dragged = false; }, 0);
  }
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  // No pointerleave handler: the 3D-transformed cards make hit-testing
  // flicker, firing spurious leave events mid-drag. Pointer capture already
  // guarantees pointerup reaches the stage even outside its bounds.

  /* ---------- horizontal wheel / trackpad ---------- */
  var wheelLock = false;
  stage.addEventListener("wheel", function (e) {
    // Only claim horizontal intent — vertical scrolling must stay the page's.
    var dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
    if (!dx) return;
    e.preventDefault();
    if (wheelLock) return;
    wheelLock = true;
    go(index + (dx > 0 ? 1 : -1));
    setTimeout(function () { wheelLock = false; }, 320);
  }, { passive: false });

  /* ---------- deep links: services.html#cloud etc. ---------- */
  function fromHash(silent) {
    var cat = (location.hash || "").replace("#", "");
    if (!cat) return false;
    var found = cards.some(function (c) { return c.dataset.cat === cat; });
    if (!found) return false;
    goToCategory(cat, { silent: silent });
    setExpanded(cat, true);
    return true;
  }
  window.addEventListener("hashchange", function () { fromHash(false); });

  /* ---------- go ---------- */
  carousel.classList.add("is-ready");
  measure();
  window.addEventListener("resize", measure);

  /* Banner images settle after first paint and change panel heights, so
     re-measure any open panel once everything has actually loaded. */
  function remeasureOpen() {
    detail && detail.querySelectorAll(".svc-panel.open .svc-panel-body").forEach(function (b) {
      b.style.maxHeight = b.scrollHeight + "px";
    });
  }
  window.addEventListener("load", remeasureOpen);
  window.addEventListener("resize", remeasureOpen);

  if (!fromHash(true)) {
    go(0, { silent: true });
    setExpanded(cards[0].dataset.cat, true);
  }
  // The first paint shouldn't make noise; expansions above are silent-safe
  // because no gesture has happened yet and the audio context stays closed.
})();
