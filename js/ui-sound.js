/* ================= Technauf UI sound ==================
   Soft macOS-style interface ticks, synthesized with the Web Audio API.
   No audio files, no network, no autoplay: the context is only created
   after the visitor's first gesture, which is also what browsers require.

   window.TechnaufSound.tick()  — carousel step / detent
   window.TechnaufSound.pop()   — panel open
   window.TechnaufSound.close() — panel close
   window.TechnaufSound.toggle()/isOn() — user preference, persisted */
(function () {
  "use strict";

  var STORAGE_KEY = "technauf-sound";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }

  // Default on, but never for visitors who asked for reduced motion.
  var enabled = stored === null ? !reduced : stored === "on";
  var ctx = null;

  function context() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    return ctx;
  }

  /* One short enveloped oscillator — the whole vocabulary of the UI. */
  function blip(opts) {
    if (!enabled) return;
    var ac = context();
    if (!ac) return;
    if (ac.state === "suspended") ac.resume();

    var now = ac.currentTime;
    var dur = opts.duration || 0.06;
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    var filter = ac.createBiquadFilter();

    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(opts.from, now);
    if (opts.to && opts.to !== opts.from) {
      osc.frequency.exponentialRampToValueAtTime(opts.to, now + dur);
    }

    // Rolling off the top end is what keeps these reading as soft "detents"
    // rather than beeps.
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(opts.cutoff || 2600, now);

    var peak = opts.gain || 0.05;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  var API = {
    tick: function () {
      blip({ from: 880, to: 660, duration: 0.05, gain: 0.045, cutoff: 2400 });
    },
    pop: function () {
      blip({ from: 520, to: 900, duration: 0.11, gain: 0.05, cutoff: 3000 });
    },
    close: function () {
      blip({ from: 780, to: 380, duration: 0.10, gain: 0.04, cutoff: 2200 });
    },
    isOn: function () { return enabled; },
    set: function (on) {
      enabled = !!on;
      try { localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off"); } catch (e) {}
      document.documentElement.setAttribute("data-sound", enabled ? "on" : "off");
      if (enabled) API.tick();
      return enabled;
    },
    toggle: function () { return API.set(!enabled); }
  };

  document.documentElement.setAttribute("data-sound", enabled ? "on" : "off");
  window.TechnaufSound = API;

  /* Wire any sound toggle button on the page. */
  function wireToggles() {
    document.querySelectorAll("[data-sound-toggle]").forEach(function (btn) {
      function paint() {
        btn.setAttribute("aria-pressed", String(enabled));
        btn.setAttribute("aria-label", enabled ? "Mute interface sounds" : "Unmute interface sounds");
        btn.title = enabled ? "Sound on" : "Sound off";
      }
      btn.addEventListener("click", function () { API.toggle(); paint(); });
      paint();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireToggles);
  } else {
    wireToggles();
  }
})();
