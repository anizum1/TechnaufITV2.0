/* ================= Downtime cost calculator =================
   Pure client-side arithmetic — no API, no tracking, no network.
   Deliberately conservative and clearly labelled as an estimate. */
(function () {
  "use strict";

  var root = document.getElementById("roi-calc");
  if (!root) return;

  // Share of unplanned downtime typically removed by proactive monitoring
  // and patching. Stated on the page so the number is never a black box.
  var REDUCTION = 0.7;

  var fields = {
    employees: { input: "calc-employees", out: "out-employees", fmt: function (v) { return String(v); } },
    salary:    { input: "calc-salary",    out: "out-salary",    fmt: money },
    hours:     { input: "calc-hours",     out: "out-hours",     fmt: function (v) { return String(v); } },
    spend:     { input: "calc-spend",     out: "out-spend",     fmt: money }
  };

  var resCurrent = document.getElementById("res-current");
  var resManaged = document.getElementById("res-managed");
  var resSaved = document.getElementById("res-saved");

  function money(v) {
    return "$" + Math.round(v).toLocaleString("en-US");
  }

  function val(key) {
    return parseFloat(document.getElementById(fields[key].input).value);
  }

  function paintTrack(input) {
    var min = parseFloat(input.min), max = parseFloat(input.max);
    var pct = ((parseFloat(input.value) - min) / (max - min)) * 100;
    input.style.setProperty("--fill", pct + "%");
  }

  function compute() {
    var employees = val("employees");
    var salary = val("salary");
    var hours = val("hours");

    // Lost productive hours per year × loaded hourly cost.
    var current = employees * hours * 12 * salary;
    var managed = current * (1 - REDUCTION);
    var saved = current - managed;

    resCurrent.textContent = money(current);
    resManaged.textContent = money(managed);
    resSaved.textContent = money(saved);

    Object.keys(fields).forEach(function (key) {
      var f = fields[key];
      var out = document.getElementById(f.out);
      if (out) out.textContent = f.fmt(val(key));
    });
  }

  Object.keys(fields).forEach(function (key) {
    var input = document.getElementById(fields[key].input);
    if (!input) return;
    input.addEventListener("input", function () {
      paintTrack(input);
      compute();
    });
    paintTrack(input);
  });

  compute();
})();
