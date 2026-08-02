/* Bodyframe — progressive enhancement only.
   The page is complete, readable and installable with this file removed.
   The `.js` class is set by a tiny inline snippet in <head>, so reveal
   states never strand content and there is no flash-of-hidden-content. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMQ = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener: null };
  var reduce = reduceMQ.matches;

  /* ------------------------------------------------------------
     1. Year
     ------------------------------------------------------------ */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------
     2. Masthead hairline once the page has moved
     ------------------------------------------------------------ */
  var masthead = document.getElementById("masthead");
  if (masthead) {
    var stuck = false;
    var onScroll = function () {
      var next = window.scrollY > 12;
      if (next !== stuck) {
        stuck = next;
        masthead.classList.toggle("is-stuck", stuck);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------
     3. Scroll reveals.
        The hero is deliberately excluded: the LCP element is never
        animated from opacity:0.
     ------------------------------------------------------------ */
  var revealed = [];
  if (!reduce && root.classList.contains("js") && "IntersectionObserver" in window) {
    var selectors = [
      ".sec-head",
      ".pole",
      ".contents__head",
      ".programs tbody tr",
      ".specimen > *",
      ".prog-close > *",
      ".step",
      ".callout",
      ".plate__type > *",
      ".circle-grid > *",
      ".cheer-spread > *",
      ".idx",
      ".index-note",
      ".qa",
      ".endcta__inner > *"
    ].join(",");

    revealed = Array.prototype.slice.call(document.querySelectorAll(selectors));

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    revealed.forEach(function (el) {
      el.classList.add("reveal");
      var sibs = el.parentElement ? el.parentElement.children : null;
      var i = sibs ? Array.prototype.indexOf.call(sibs, el) : 0;
      el.style.transitionDelay = Math.min(i, 6) * 55 + "ms";
      io.observe(el);
    });

    /* Safety net, scoped to the viewport: on load, anything that is
       already on screen but somehow never fired is shown immediately.
       Off-screen elements are left to the observer, so nothing mass-
       animates at an arbitrary moment. */
    window.addEventListener(
      "load",
      function () {
        revealed.forEach(function (el) {
          if (el.classList.contains("is-in")) return;
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) {
            el.style.transitionDelay = "0ms";
            el.classList.add("is-in");
          }
        });
      },
      { once: true }
    );
  }

  /* If the visitor turns motion off mid-session, unhide everything. */
  if (reduceMQ.addEventListener) {
    reduceMQ.addEventListener("change", function (e) {
      if (!e.matches) return;
      reduce = true;
      revealed.forEach(function (el) { el.classList.add("is-in"); });
    });
  }

  /* ------------------------------------------------------------
     4. "Hold to cheer her on" — the app's real gesture, on the web.
        Reduced-motion users get an instant result rather than losing
        the interaction entirely.
     ------------------------------------------------------------ */
  var btn = document.getElementById("cheerBtn");
  var hint = document.getElementById("cheerHint");

  if (btn && hint) {
    /* the fill sweep is timed by --hold in styles.css; read it so the bar
       and the gesture can never drift apart */
    var HOLD_MS = reduce
      ? 0
      : parseFloat(getComputedStyle(root).getPropertyValue("--hold")) || 1050;
    var IDLE_HINT = "Press and hold — just like in the app.";
    var timer = null;
    var sent = false;
    var resetTimer = null;
    var label = btn.querySelector(".cheer__label");
    var idleHTML = label.innerHTML;

    var complete = function () {
      sent = true;
      btn.classList.remove("is-holding");
      btn.classList.add("is-done");
      label.innerHTML = '<span class="cheer__spark" aria-hidden="true">✦</span> Cheer sent to Camille';
      hint.textContent = "That lands on her phone. One cheer per friend, per day.";
      resetTimer = window.setTimeout(function () {
        sent = false;
        btn.classList.remove("is-done");
        label.innerHTML = idleHTML;
        hint.textContent = IDLE_HINT;
      }, 4600);
    };

    var start = function (e) {
      if (sent) return;
      if (e && e.type === "pointerdown" && e.button !== 0) return;
      window.clearTimeout(timer);
      btn.classList.add("is-holding");
      hint.textContent = HOLD_MS ? "Keep holding…" : IDLE_HINT;
      timer = window.setTimeout(complete, HOLD_MS);
    };

    var cancel = function () {
      if (sent) return;
      window.clearTimeout(timer);
      timer = null;
      if (btn.classList.contains("is-holding")) {
        btn.classList.remove("is-holding");
        hint.textContent = IDLE_HINT;
      }
    };

    btn.addEventListener("pointerdown", start);
    btn.addEventListener("pointerup", cancel);
    btn.addEventListener("pointerleave", cancel);
    btn.addEventListener("pointercancel", cancel);
    /* stop iOS summoning the callout menu on a long press */
    btn.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    btn.addEventListener("keydown", function (e) {
      if ((e.key === " " || e.key === "Enter") && !e.repeat) {
        e.preventDefault();
        start();
      }
    });
    btn.addEventListener("keyup", function (e) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        cancel();
      }
    });
    btn.addEventListener("click", function (e) { e.preventDefault(); });
    /* Blur must only abandon an in-progress hold. It must NOT clear
       resetTimer — that timer is the sole route back to the idle state,
       and killing it strands the button on "Cheer sent" forever. */
    btn.addEventListener("blur", function () {
      cancel();
    });
  }

  /* ------------------------------------------------------------
     5. Masthead readout — which spread you are reading
     ------------------------------------------------------------ */
  var readout = document.getElementById("readout");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".masthead__nav a"));
  var spreads = [
    { id: "top", no: "Nº 00", name: "Cover" },
    { id: "programs", no: "Nº 01", name: "Programs" },
    { id: "method", no: "Nº 02", name: "How it works" },
    { id: "circle", no: "Nº 03", name: "Your circle" },
    { id: "index", no: "Nº 04", name: "Inside the app" },
    { id: "questions", no: "Nº 05", name: "Questions" }
  ].filter(function (s) {
    s.el = document.getElementById(s.id);
    return !!s.el;
  });

  if (spreads.length) {
    var current = -1;
    var update = function () {
      var line = window.scrollY + window.innerHeight * 0.32;
      var idx = 0;
      for (var i = 0; i < spreads.length; i++) {
        if (spreads[i].el.getBoundingClientRect().top + window.scrollY <= line) idx = i;
      }
      if (idx === current) return;
      current = idx;
      if (readout) readout.textContent = spreads[idx].no + " — " + spreads[idx].name;
      navLinks.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + spreads[idx].id;
        a.classList.toggle("is-current", on);
        if (on) {
          a.setAttribute("aria-current", "true");
        } else {
          a.removeAttribute("aria-current");
        }
      });
    };
    var ticking = false;
    var schedule = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        update();
      });
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  }
})();
