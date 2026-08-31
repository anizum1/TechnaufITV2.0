/* ============================================================
   TECHNAUF — home page scroll-telling
   Extracted from an inline <script> so the Content-Security-Policy
   can use script-src 'self' with no 'unsafe-inline'.
   ============================================================ */
/* Page-specific scroll-telling: hero intro, manifesto, pinned 3D stack, timeline fill */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const manifesto = document.getElementById("manifesto");

  // Split manifesto into word spans (works with or without GSAP)
  let words = [];
  if (manifesto) {
    const text = manifesto.textContent.trim().split(/\s+/);
    manifesto.innerHTML = text.map(w => `<span class="w">${w}</span>`).join(" ");
    words = Array.from(manifesto.querySelectorAll(".w"));
  }

  function staticFallback() {
    document.querySelectorAll("#hero-title .line > span").forEach(s => { s.style.transform = "none"; });
    document.querySelectorAll(".scene-step").forEach(el => {
      el.style.position = "static"; el.style.transform = "none";
      el.style.opacity = 1; el.style.marginBottom = "44px";
    });
    document.querySelectorAll(".plane-in, .stack-mark-in").forEach(el => {
      el.style.opacity = 1; el.style.transform = "none";
    });
    words.forEach(w => w.classList.add("lit"));
    const fill = document.getElementById("tl-fill");
    if (fill) fill.style.transform = "scaleY(1)";
  }

  if (typeof gsap === "undefined" || reduced) { staticFallback(); return; }

  /* Hero headline reveal */
  gsap.to("#hero-title .line > span", {
    y: 0, duration: 1.1, ease: "power4.out", stagger: 0.14, delay: 0.2
  });
  gsap.from(".hero .eyebrow, .hero .lede, .hero-ctas, .hero-note", {
    opacity: 0, y: 24, duration: 1, ease: "power3.out", stagger: 0.1, delay: 0.6
  });

  /* Manifesto: word-by-word light-up on scroll */
  if (words.length) {
    ScrollTrigger.create({
      trigger: ".manifesto",
      start: "top 72%",
      end: "center 42%",
      scrub: true,
      onUpdate(self) {
        const lit = Math.floor(self.progress * words.length);
        words.forEach((w, i) => w.classList.toggle("lit", i < lit));
      }
    });
  }

  /* Pinned 3D stack assembly */
  gsap.set(".plane-in", { opacity: 0, y: 170 });
  gsap.set(".stack-mark-in", { opacity: 0, scale: 0.7 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#scene-stage",
      start: "top top",
      end: "+=3000",
      pin: true,
      scrub: 0.6
    }
  });

  const stepIn  = t => ({ opacity: 1, y: 0, duration: 1 });
  const stepOut = t => ({ opacity: 0, y: -50, duration: 0.8 });

  tl.fromTo("#sc-1", { opacity: 0, y: 50 }, stepIn())
    .to(".p-net .plane-in", { opacity: 1, y: 0, duration: 1.1, ease: "power2.out" }, "<")
    .to("#sc-1", stepOut(), "+=0.9")
    .fromTo("#sc-2", { opacity: 0, y: 50 }, stepIn(), "-=0.25")
    .to(".p-sec .plane-in", { opacity: 1, y: 0, duration: 1.1, ease: "power2.out" }, "<")
    .to("#sc-2", stepOut(), "+=0.9")
    .fromTo("#sc-3", { opacity: 0, y: 50 }, stepIn(), "-=0.25")
    .to(".p-cloud .plane-in", { opacity: 1, y: 0, duration: 1.1, ease: "power2.out" }, "<")
    .to("#sc-3", stepOut(), "+=0.9")
    .fromTo("#sc-4", { opacity: 0, y: 50 }, stepIn(), "-=0.25")
    .to(".stack-mark-in", { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" }, "<")
    .to("#sc-4", { opacity: 1, duration: 0.8 }, "+=0.8");

  /* Timeline rail fill (scrubbed) */
  gsap.to("#tl-fill", {
    scaleY: 1, ease: "none",
    scrollTrigger: {
      trigger: "#timeline",
      start: "top 70%",
      end: "bottom 65%",
      scrub: 0.8
    }
  });
})();
