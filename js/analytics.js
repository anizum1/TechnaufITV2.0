/* ================= Analytics loader (opt-in) =================
   Nothing loads and no data leaves the browser until a measurement ID is
   set below. Google Analytics 4 is free — create a property at
   https://analytics.google.com, copy the "G-XXXXXXXXXX" measurement ID
   into MEASUREMENT_ID, and this file starts working. No other change needed.

   Leave it empty to ship the site with zero third-party tracking. */
(function () {
  "use strict";

  var MEASUREMENT_ID = ""; // e.g. "G-ABC1234567"

  if (!MEASUREMENT_ID) return;

  // Honour Do Not Track rather than ignoring it, as a security-first firm should.
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(MEASUREMENT_ID);
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID, { anonymize_ip: true });
})();
