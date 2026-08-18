/* ================= Lead magnet: gated security checklist =================
   Submits the email to the same Formspree endpoint the contact form uses,
   then reveals the checklist in place. If the endpoint is unreachable we
   still show the checklist — a failed form submission is our problem, not
   a reason to withhold something we promised. */
(function () {
  "use strict";

  var form = document.getElementById("checklist-form");
  var gate = document.getElementById("chk-gate");
  var content = document.getElementById("chk-content");
  var printBtn = document.getElementById("chk-print");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
  if (!form || !gate || !content) return;

  var STORAGE_KEY = "technauf-checklist-unlocked";

  function reveal(scroll) {
    content.hidden = false;
    gate.classList.add("is-done");
    if (scroll) {
      content.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    }
  }

  // Returning visitors shouldn't have to hand over an email twice.
  try {
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      gate.hidden = true;
      reveal(false);
      return;
    }
  } catch (e) { /* private mode — just show the gate */ }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var status = form.querySelector(".form-status");
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    status.textContent = "Unlocking…";
    status.style.color = "";

    try {
      await fetch(form.action, {
        method: form.method || "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      });
      status.textContent = "✓ Sent — a copy is on its way to your inbox.";
    } catch (err) {
      status.textContent = "We couldn't email a copy, but the checklist is open below.";
    } finally {
      btn.disabled = false;
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch (e2) {}
      reveal(true);
      if (window.TechnaufSound) window.TechnaufSound.pop();
    }
  });
})();
