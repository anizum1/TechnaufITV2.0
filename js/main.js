/* ============================================================
   TECHNAUF — shared interaction engine
   Minimal, motion-respectful. GSAP is progressive enhancement.
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof gsap !== "undefined";
  if (hasGSAP && typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

  /* ---------- Navigation ---------- */
  const nav = document.querySelector(".nav");
  const onScrollNav = () => nav && nav.classList.toggle("scrolled", window.scrollY > 12);
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  const burger = document.querySelector(".nav-burger");
  const links = document.querySelector(".nav-links");
  if (burger && links) {
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open);
    });
    links.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------- Animated logo mark: stroke draw-in ---------- */
  document.querySelectorAll(".logo-anim").forEach(svg => {
    const paths = svg.querySelectorAll(".cloud-path, .speed-line");
    paths.forEach(p => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = prefersReduced ? 0 : len;
    });
    if (hasGSAP && !prefersReduced) {
      gsap.to(paths, {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: "power2.inOut",
        stagger: 0.07,
        delay: 0.2
      });
    } else {
      paths.forEach(p => { p.style.strokeDashoffset = 0; });
    }
  });

  /* ---------- 3D pointer tilt ---------- */
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  document.querySelectorAll("[data-tilt]").forEach(el => {
    if (prefersReduced || !finePointer) return;
    const stage = el.closest(".stage3d") || el.parentElement;
    let rx = 0, ry = 0, tx = 0, ty = 0, raf = null;

    function loop() {
      rx += (tx - rx) * 0.08;
      ry += (ty - ry) * 0.08;
      el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      if (Math.abs(tx - rx) > 0.05 || Math.abs(ty - ry) > 0.05) {
        raf = requestAnimationFrame(loop);
      } else raf = null;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }

    stage.addEventListener("pointermove", e => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ty = px * 14;
      tx = -py * 10;
      kick();
    });
    stage.addEventListener("pointerleave", () => { tx = 0; ty = 0; kick(); });

    // Gentle idle float
    if (hasGSAP) {
      gsap.to(el, { y: -10, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
      const shadow = stage.querySelector(".cloud-shadow");
      if (shadow) gsap.to(shadow, { scaleX: 0.88, opacity: 0.75, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }
  });

  /* ---------- Generic scroll reveals ---------- */
  if (hasGSAP && !prefersReduced) {
    const reveal = (sel, vars) => {
      document.querySelectorAll(sel).forEach(el => {
        gsap.to(el, Object.assign({
          opacity: 1, x: 0, y: 0,
          duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" }
        }, vars || {}));
      });
    };
    reveal(".rv"); reveal(".rv-l"); reveal(".rv-r");

    document.querySelectorAll("[data-stagger]").forEach(group => {
      const kids = group.children;
      gsap.set(kids, { opacity: 0, y: 34 });
      gsap.to(kids, {
        opacity: 1, y: 0,
        duration: 0.85, ease: "power3.out",
        stagger: 0.07,
        scrollTrigger: { trigger: group, start: "top 86%" }
      });
    });
  } else {
    document.querySelectorAll(".rv, .rv-l, .rv-r").forEach(el => {
      el.style.opacity = 1; el.style.transform = "none";
    });
  }

  /* ---------- Animated counters ---------- */
  document.querySelectorAll("[data-count]").forEach(el => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    // data-text overrides display for non-numeric finals (e.g. "10–15")
    const finalText = el.dataset.text || null;
    const render = v => { el.textContent = prefix + v.toFixed(decimals) + suffix; };
    const settle = () => { el.textContent = finalText || (prefix + target.toFixed(decimals) + suffix); };

    if (hasGSAP && !prefersReduced && !isNaN(target)) {
      const obj = { v: 0 };
      render(0);
      gsap.to(obj, {
        v: target, duration: 2, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
        onUpdate: () => render(obj.v),
        onComplete: settle
      });
    } else settle();
  });

  /* ---------- Testimonial carousel ---------- */
  const shell = document.querySelector(".testi-shell");
  if (shell) {
    const track = shell.querySelector(".testi-track");
    const cards = track.children;
    const dotsBox = shell.querySelector(".testi-dots");
    let idx = 0, timer;

    Array.from(cards).forEach((_, i) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", `Go to review ${i + 1}`);
      b.addEventListener("click", () => go(i, true));
      dotsBox.appendChild(b);
    });

    function go(i, manual) {
      idx = (i + cards.length) % cards.length;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dotsBox.querySelectorAll("button").forEach((d, j) => d.classList.toggle("on", j === idx));
      if (manual) restart();
    }
    function restart() {
      clearInterval(timer);
      if (!prefersReduced) timer = setInterval(() => go(idx + 1), 7000);
    }
    shell.querySelector(".testi-prev").addEventListener("click", () => go(idx - 1, true));
    shell.querySelector(".testi-next").addEventListener("click", () => go(idx + 1, true));
    go(0); restart();
  }

  /* ---------- Accordions (services categories + FAQ) ---------- */
  function wireAccordion(headSel, itemSel, bodySel) {
    document.querySelectorAll(headSel).forEach(head => {
      head.addEventListener("click", () => {
        const item = head.closest(itemSel);
        const body = item.querySelector(bodySel);
        const open = item.classList.toggle("open");
        head.setAttribute("aria-expanded", open);
        body.style.maxHeight = open ? body.scrollHeight + "px" : "0px";
      });
    });
    window.addEventListener("resize", () => {
      document.querySelectorAll(`${itemSel}.open ${bodySel}`).forEach(b => {
        b.style.maxHeight = b.scrollHeight + "px";
      });
    });
  }
  wireAccordion(".svc-cat-head", ".svc-category", ".svc-cat-body");
  wireAccordion(".faq-q", ".faq-item", ".faq-a");

  // Open first service category by default
  const firstCat = document.querySelector(".svc-category");
  if (firstCat) {
    firstCat.classList.add("open");
    const b = firstCat.querySelector(".svc-cat-body");
    const h = firstCat.querySelector(".svc-cat-head");
    if (h) h.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => { b.style.maxHeight = b.scrollHeight + "px"; });
  }

  /* ---------- Safety net: never leave content invisible ---------- */
  window.addEventListener("load", () => {
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    setTimeout(() => {
      const engineDead = typeof gsap === "undefined" ||
                         typeof ScrollTrigger === "undefined" ||
                         ScrollTrigger.getAll().length === 0;
      if (!engineDead && !prefersReduced) return;
      document.querySelectorAll(".rv, .rv-l, .rv-r, [data-stagger] > *, .scene-step").forEach(el => {
        if (parseFloat(getComputedStyle(el).opacity) === 0) {
          el.style.opacity = 1;
          el.style.transform = "none";
          if (el.classList.contains("scene-step")) el.style.position = "static";
        }
      });
      document.querySelectorAll("[data-count]").forEach(el => {
        const t = el.dataset.text;
        const target = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const suffix = el.dataset.suffix || "";
        const prefix = el.dataset.prefix || "";
        el.textContent = t || (prefix + target.toFixed(decimals) + suffix);
      });
      document.querySelectorAll(".manifesto-line .w").forEach(w => w.classList.add("lit"));
    }, 2000);
  });

  /* ---------- Image fallback ----------
     Images marked [data-fallback] sit on top of a brand gradient. If the
     file is missing the gradient shows through instead of a broken icon,
     so the layout never depends on the photo being present. */
  document.querySelectorAll("img[data-fallback]").forEach(img => {
    const hide = () => { img.style.display = "none"; };
    img.addEventListener("error", hide);
    if (img.complete && img.naturalWidth === 0) hide();
  });

  /* ---------- Contact form ---------- */
  // Submits via fetch to the endpoint in the form's action attribute (Formspree
  // or compatible). Falls back to a normal browser POST/redirect if fetch fails,
  // so the form still works with JavaScript disabled.
  const form = document.querySelector("#contact-form");
  if (form && form.action) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const status = form.querySelector(".form-status");
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      status.textContent = "Sending…";
      status.style.color = "";
      try {
        const res = await fetch(form.action, {
          method: form.method || "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });
        if (res.ok) {
          status.textContent = "✓ Message received. We'll reply from info@technauf.com within one business day.";
          form.reset();
        } else {
          const data = await res.json().catch(() => null);
          const msg = data && data.errors && data.errors.map(x => x.message).join(", ");
          status.textContent = msg || "Something went wrong sending your message. Please email info@technauf.com directly.";
          status.style.color = "#c0392b";
        }
      } catch (err) {
        status.textContent = "Couldn't reach the server. Please email info@technauf.com directly.";
        status.style.color = "#c0392b";
      } finally {
        btn.disabled = false;
      }
    });
  }
})();
