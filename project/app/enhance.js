/* ============================================================
   МВП Продукт — motion enhancements (vanilla, post-React)
   custom cursor · magnetic buttons · number rise
   ============================================================ */
(function () {
  "use strict";
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- custom cursor ---- */
  function cursor() {
    if (!fine) return;
    var dot = document.createElement("div"); dot.className = "cursor-dot";
    var ring = document.createElement("div"); ring.className = "cursor-ring";
    document.body.appendChild(dot); document.body.appendChild(ring);
    document.body.classList.add("cursor-on");
    var rx = 0, ry = 0, mx = 0, my = 0;
    document.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)"; });
    document.addEventListener("mousedown", function () { ring.classList.add("down"); });
    document.addEventListener("mouseup", function () { ring.classList.remove("down"); });
    document.addEventListener("mouseleave", function () { dot.classList.add("cursor-hidden"); ring.classList.add("cursor-hidden"); });
    document.addEventListener("mouseenter", function () { dot.classList.remove("cursor-hidden"); ring.classList.remove("cursor-hidden"); });
    (function loop() { rx += (mx - rx) * .2; ry += (my - ry) * .2; ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)"; requestAnimationFrame(loop); })();
    var sel = "a,button,.nav-item,.pcard,.tooth-cell,.finding,.shot,.fbtn,.rv-tool,.suggest,.tab,input,select";
    document.addEventListener("mouseover", function (e) { if (e.target.closest(sel)) ring.classList.add("hover"); });
    document.addEventListener("mouseout", function (e) { if (e.target.closest(sel)) ring.classList.remove("hover"); });
  }

  /* ---- magnetic (event delegation — works with React re-renders) ---- */
  function magnetic() {
    if (!fine) return;
    var sel = ".btn-app, .icon-btn";
    var cur = null;
    document.addEventListener("mousemove", function (e) {
      var t = e.target.closest(sel);
      if (t !== cur) { if (cur) cur.style.transform = ""; cur = t; }
      if (t) {
        var r = t.getBoundingClientRect();
        t.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * .25 + "px," + (e.clientY - r.top - r.height / 2) * .35 + "px)";
      }
    });
    document.addEventListener("mouseout", function (e) { var t = e.target.closest(sel); if (t) t.style.transform = ""; });
  }

  /* ---- number rise on appear ---- */
  function counters() {
    if (reduce || !("IntersectionObserver" in window)) return;
    var seen = new WeakSet();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting && !seen.has(en.target)) { seen.add(en.target); rise(en.target); io.unobserve(en.target); } });
    }, { threshold: .6 });
    function scan() { Array.prototype.forEach.call(document.querySelectorAll(".s-num, .m-num"), function (n) { if (!seen.has(n)) io.observe(n); }); }
    function rise(n) {
      var raw = n.textContent.trim();
      var m = raw.match(/^([^\d−-]*)(−?\d[\d  .,]*)(.*)$/);
      if (!m) return;
      var pre = m[1], suf = m[3], numStr = m[2].replace(/\s/g, "").replace(",", ".");
      var neg = /−|-/.test(numStr); var target = parseFloat(numStr.replace(/[−-]/g, "")) || 0;
      var dec = (numStr.split(".")[1] || "").length, start = null;
      function step(ts) {
        if (start == null) start = ts; var p = Math.min(1, (ts - start) / 1100), e = 1 - Math.pow(1 - p, 3), v = target * e;
        n.textContent = pre + (neg ? "−" : "") + v.toFixed(dec).replace(".", ",") + suf;
        if (p < 1) requestAnimationFrame(step); else n.textContent = raw;
      }
      requestAnimationFrame(step);
    }
    scan();
    var mo = new MutationObserver(function () { scan(); });
    mo.observe(document.getElementById("root"), { childList: true, subtree: true });
  }

  function boot() { try { cursor(); magnetic(); counters(); } catch (e) { console.error("enhance", e); } }
  // React mounts after Babel transpile; wait a tick
  if (document.readyState === "complete") setTimeout(boot, 400);
  else window.addEventListener("load", function () { setTimeout(boot, 400); });
})();
