/* ================= Technauf Assistant =================
   Self-contained chat widget: answers visitor questions about
   services, pricing, response times, service area, and routes
   them to booking a consultation or emailing the team.
   No backend/API — matches visitor text against a small intent set. */
(function () {
  "use strict";

  var BOT_NAME = "Technauf Assistant";
  var STORAGE_KEY = "technauf-chat-history";

  var LOGO_SVG =
    '<svg viewBox="0 0 520 380" fill="none" aria-hidden="true">' +
    '<g stroke="url(#tcbGrad)" stroke-width="34" stroke-linecap="round">' +
    '<path d="M150 300 H370 C438 300 478 254 478 208 C478 166 448 134 410 128 C400 82 356 50 310 55 C272 59 242 84 230 118"/>' +
    '<path d="M40 178 H295 M20 222 H240 M55 262 H290"/></g>' +
    '<defs><linearGradient id="tcbGrad" x1="0" y1="0" x2="520" y2="0" gradientUnits="userSpaceOnUse">' +
    '<stop offset="0" stop-color="#2f7fff"/><stop offset="1" stop-color="#3fd9e8"/></linearGradient></defs></svg>';

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function onPage(href) {
    var here = location.pathname.split("/").pop() || "index.html";
    return here === href.split("#")[0];
  }

  function svcLink(anchor, label) {
    var href = (onPage("services.html") ? "" : "services.html") + "#" + anchor;
    return '<a href="' + href + '">' + label + "</a>";
  }
  function contactLink(label) {
    var href = (onPage("contact.html") ? "" : "contact.html") + "#contact-form";
    return '<a href="' + href + '">' + label + "</a>";
  }

  var INTENTS = [
    {
      id: "greeting",
      keywords: ["hi", "hello", "hey", "howdy", "greetings"],
      reply: "Hey there! I'm the " + BOT_NAME + ". I can point you to the right service, tell you about response times, service area, pricing, or get you booked with an engineer. What do you need?",
      chips: ["Our services", "Book a consultation", "Response time"]
    },
    {
      id: "services",
      keywords: ["service", "services", "offer", "what do you do", "capabilities", "catalog"],
      reply: "Technauf covers five disciplines: " + svcLink("cloud", "Cloud Solutions") + ", " + svcLink("security", "Cybersecurity") + ", " + svcLink("network", "Network Infrastructure") + ", " + svcLink("infrastructure", "Infrastructure &amp; Servers") + ", and " + svcLink("consulting", "Consulting") + ". Want details on any of those?",
      chips: ["Cloud", "Cybersecurity", "Network", "Consulting"]
    },
    {
      id: "cloud",
      keywords: ["cloud", "migration", "migrate", "backup", "disaster recovery", "email hosting", "office 365", "microsoft 365", "google workspace"],
      reply: "Our " + svcLink("cloud", "Cloud Solutions") + " cover migration, cloud infrastructure, cloud security, backup, disaster recovery, and email hosting on Microsoft 365 or Google Workspace — with zero-downtime cutover plans.",
      chips: ["Book a consultation", "Pricing"]
    },
    {
      id: "security",
      keywords: ["security", "cyber", "cybersecurity", "phishing", "ransomware", "pen test", "penetration", "firewall", "endpoint", "hipaa", "soc 2", "compliance", "pci"],
      reply: "Our " + svcLink("security", "Cybersecurity") + " services include security assessments, firewall management, endpoint protection, identity &amp; access management, awareness training, vulnerability scanning, penetration testing, and 24/7 incident response. We also support HIPAA, SOC 2, PCI-DSS, and CMMC readiness.",
      chips: ["Book a consultation", "Response time"]
    },
    {
      id: "network",
      keywords: ["network", "wifi", "wi-fi", "sd-wan", "sdwan", "vpn", "cabling"],
      reply: "Our " + svcLink("network", "Network Infrastructure") + " work spans network design and implementation, Wi-Fi optimization, VPN, SD-WAN, and troubleshooting for chronic slowdowns.",
      chips: ["Book a consultation"]
    },
    {
      id: "infrastructure",
      keywords: ["server", "servers", "storage", "virtualization", "data center", "vmware", "hyper-v", "san", "nas"],
      reply: "Our " + svcLink("infrastructure", "Infrastructure &amp; Servers") + " services include server installation, storage solutions, data center setup, and virtualization with VMware or Hyper-V.",
      chips: ["Book a consultation"]
    },
    {
      id: "consulting",
      keywords: ["consulting", "consultant", "strategy", "roadmap", "transformation", "procurement", "budget"],
      reply: "Our " + svcLink("consulting", "Consulting") + " services align technology spend with where your business is heading — IT strategy, digital transformation roadmaps, and DR planning.",
      chips: ["Book a consultation"]
    },
    {
      id: "pricing",
      keywords: ["price", "pricing", "cost", "how much", "contract", "month-to-month", "fees", "quote"],
      reply: "Pricing depends on your environment and service mix — the fastest way to get a real number is a free 30-minute assessment with a senior engineer. Managed agreements run month-to-month after a 90-day onboarding period, no long-term lock-in.",
      chips: ["Book a consultation", "Onboarding process"]
    },
    {
      id: "response-time",
      keywords: ["response time", "how fast", "how quickly", "sla", "24/7", "24-7", "monitoring", "uptime"],
      reply: "Managed clients typically reach a live engineer within a couple of hours, and critical outages are worked immediately, around the clock. Routine requests are usually resolved the same business day.",
      chips: ["Book a consultation", "Service area"]
    },
    {
      id: "service-area",
      keywords: ["where", "location", "area", "nationwide", "national", "usa", "united states", "remote", "dallas", "fort worth", "plano", "texas", "on-site", "onsite"],
      reply: "Technauf serves businesses across the United States. Remote monitoring, management, and support are delivered nationwide, and our engineers are headquartered in Plano, Texas. On-site visits are arranged wherever a client needs them.",
      chips: ["Book a consultation"]
    },
    {
      id: "onboarding",
      keywords: ["onboarding", "get started", "getting started", "how do i start", "process", "how it works"],
      reply: "Onboarding runs about 90 days: weeks 1–2 document your environment and set a security baseline, weeks 3–6 roll out monitoring, backup verification, and quick-win fixes, and by day 90 you have a full asset inventory, hardened security, and a 12-month roadmap.",
      chips: ["Book a consultation"]
    },
    {
      id: "industries",
      keywords: ["industry", "industries", "healthcare", "legal", "manufacturing", "construction", "financial", "education", "retail", "nonprofit", "logistics"],
      reply: "We work across healthcare, legal firms, manufacturing, construction, financial services, education, retail, professional services, nonprofits, and logistics — each with compliance and uptime needs we already speak the language of.",
      chips: ["Book a consultation"]
    },
    {
      id: "co-managed",
      keywords: ["existing it", "internal it", "in-house", "co-managed", "our own team"],
      reply: "Yes — co-managed IT is one of our most common arrangements. Your team keeps day-to-day ownership while we handle security monitoring, projects, escalations, or after-hours coverage. You define the split.",
      chips: ["Book a consultation"]
    },
    {
      id: "hours",
      keywords: ["hours", "open", "business hours", "when are you"],
      reply: "Our business hours are Monday–Friday, 8:00 AM–6:00 PM CT. Managed clients get 24/7/365 monitoring on top of that.",
      chips: ["Book a consultation"]
    },
    {
      id: "book",
      keywords: ["book", "consultation", "schedule", "meeting", "talk to", "call", "appointment", "demo", "assessment"],
      reply: "Let's get you on the calendar — " + contactLink("book a free 30-minute consultation") + " with a senior engineer, no sales script.",
      chips: ["Email instead"]
    },
    {
      id: "email",
      keywords: ["email", "e-mail", "contact you", "reach you", "your email"],
      reply: "The quickest way to reach us is the contact form — replies land within one business day. " + contactLink("Open the contact form") + ".",
      chips: ["Book a consultation"]
    },
    {
      id: "thanks",
      keywords: ["thanks", "thank you", "appreciate", "cool", "great", "awesome"],
      reply: "Happy to help! Anything else about our services, pricing, or getting started?",
      chips: ["Book a consultation", "Our services"]
    },
    {
      id: "human",
      keywords: ["human", "person", "real person", "engineer", "agent"],
      reply: "Every inquiry lands with a real senior US-based engineer, not a call center. " + contactLink("Book a consultation") + " and a person will reply within one business day.",
      chips: ["Book a consultation"]
    }
  ];

  var FALLBACK = {
    reply: "I don't have a canned answer for that yet, but a real engineer can help directly — " + contactLink("book a free consultation") + ".",
    chips: ["Our services", "Book a consultation", "Response time"]
  };

  var CHIP_TO_QUERY = {
    "Our services": "services",
    "Book a consultation": "book a consultation",
    "Response time": "response time",
    "Cloud": "cloud",
    "Cybersecurity": "cybersecurity",
    "Network": "network",
    "Consulting": "consulting",
    "Pricing": "pricing",
    "Onboarding process": "onboarding process",
    "Service area": "service area",
    "Email instead": "email"
  };

  function matchIntent(text) {
    var t = text.toLowerCase();
    var best = null;
    var bestScore = 0;
    for (var i = 0; i < INTENTS.length; i++) {
      var intent = INTENTS[i];
      var score = 0;
      for (var k = 0; k < intent.keywords.length; k++) {
        if (t.indexOf(intent.keywords[k]) !== -1) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = intent;
      }
    }
    return best;
  }

  function buildWidget() {
    var root = document.createElement("div");
    root.className = "tcb-root";
    root.innerHTML =
      '<button class="tcb-launcher" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="tcb-panel" aria-label="Open chat with the Technauf Assistant">' +
        '<span class="tcb-launcher-icon tcb-icon-chat">' + LOGO_SVG + "</span>" +
        '<span class="tcb-launcher-icon tcb-icon-close" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        "</span>" +
        '<span class="tcb-badge" aria-hidden="true">1</span>' +
      "</button>" +
      '<section id="tcb-panel" class="tcb-panel" role="dialog" aria-label="' + BOT_NAME + '" aria-hidden="true">' +
        '<header class="tcb-head">' +
          '<span class="tcb-head-logo">' + LOGO_SVG + "</span>" +
          '<div class="tcb-head-text"><strong>' + BOT_NAME + "</strong><span>Usually replies instantly</span></div>" +
          '<button type="button" class="tcb-close" aria-label="Close chat">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
          "</button>" +
        "</header>" +
        '<div class="tcb-messages" role="log" aria-live="polite"></div>' +
        '<div class="tcb-chips" aria-label="Suggested questions"></div>' +
        '<form class="tcb-form">' +
          '<input type="text" class="tcb-input" placeholder="Ask about services, pricing, response time…" aria-label="Message" autocomplete="off">' +
          '<button type="submit" class="tcb-send" aria-label="Send message">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>' +
          "</button>" +
        "</form>" +
      "</section>";
    document.body.appendChild(root);
    return root;
  }

  function init() {
    var root = buildWidget();
    var launcher = root.querySelector(".tcb-launcher");
    var panel = root.querySelector(".tcb-panel");
    var closeBtn = root.querySelector(".tcb-close");
    var messages = root.querySelector(".tcb-messages");
    var chipsWrap = root.querySelector(".tcb-chips");
    var form = root.querySelector(".tcb-form");
    var input = root.querySelector(".tcb-input");
    var badge = root.querySelector(".tcb-badge");
    var open = false;
    var greeted = false;

    function scrollToBottom() {
      messages.scrollTop = messages.scrollHeight;
    }

    function addMessage(text, who) {
      var row = document.createElement("div");
      row.className = "tcb-msg tcb-msg-" + who;
      var bubble = document.createElement("div");
      bubble.className = "tcb-bubble";
      bubble.innerHTML = text;
      row.appendChild(bubble);
      messages.appendChild(row);
      scrollToBottom();
    }

    function setChips(list) {
      chipsWrap.innerHTML = "";
      if (!list || !list.length) return;
      list.forEach(function (label) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "tcb-chip";
        b.textContent = label;
        b.addEventListener("click", function () {
          handleQuery(CHIP_TO_QUERY[label] || label, label);
        });
        chipsWrap.appendChild(b);
      });
    }

    function showTyping() {
      var row = document.createElement("div");
      row.className = "tcb-msg tcb-msg-bot tcb-typing-row";
      row.innerHTML = '<div class="tcb-bubble tcb-typing"><span></span><span></span><span></span></div>';
      messages.appendChild(row);
      scrollToBottom();
      return row;
    }

    function handleQuery(rawText, displayText) {
      var text = (rawText || "").trim();
      if (!text) return;
      addMessage(escapeHtml(displayText != null ? displayText : rawText), "user");
      setChips([]);
      var typingRow = showTyping();
      window.setTimeout(function () {
        typingRow.remove();
        var intent = matchIntent(text);
        var result = intent || FALLBACK;
        addMessage(result.reply, "bot");
        setChips(result.chips);
      }, 380 + Math.random() * 260);
    }

    function greet() {
      if (greeted) return;
      greeted = true;
      addMessage(
        "Hi, I'm the " + BOT_NAME + ". Ask me about our services, pricing, response times, or the areas we serve — or I can get you booked with an engineer.",
        "bot"
      );
      setChips(["Our services", "Book a consultation", "Response time", "Service area"]);
    }

    function openPanel() {
      open = true;
      root.classList.add("tcb-open");
      launcher.setAttribute("aria-expanded", "true");
      panel.setAttribute("aria-hidden", "false");
      badge.style.display = "none";
      greet();
      window.setTimeout(function () { input.focus(); }, 200);
    }

    function closePanel() {
      open = false;
      root.classList.remove("tcb-open");
      launcher.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");
      launcher.focus();
    }

    launcher.addEventListener("click", function () {
      open ? closePanel() : openPanel();
    });
    closeBtn.addEventListener("click", closePanel);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) closePanel();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = input.value;
      input.value = "";
      handleQuery(val);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
