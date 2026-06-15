/* ============================================================
   Радикс — Cinematic Landing logic
   ============================================================ */
(function () {
  "use strict";
  var lang = "ru";
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function tt(o) { return o && o[lang] != null ? o[lang] : o; }
  var TOOTH = "M12 4c-1.6 0-2.2 1-3.6 1S6 4 4.8 5C4 6 4 7.6 4.6 10c.4 1.7.7 3.4 1.1 5.2.3 1.4.6 3.3 1.8 3.3 1 0 1-1.8 1.3-3 .2-.9.5-1.5 1.2-1.5s1 .6 1.2 1.5c.3 1.2.3 3 1.3 3 1.2 0 1.5-1.9 1.8-3.3.4-1.8.7-3.5 1.1-5.2C19 7.6 19 6 18.2 5 17 4 16 5 14.6 5S13.6 4 12 4Z";
  var tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>';
  function toothSvg(size, color) { return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24"><path d="' + TOOTH + '" fill="' + color + '"/></svg>'; }
  function fmtN(v, d) { return v.toFixed(d || 0).replace(".", ","); }
  function fmtRub(v) { return Math.round(v).toLocaleString("ru-RU") + " ₽"; }
  function mix(a, b, t) {
    function h(x) { return [parseInt(x.slice(1, 3), 16), parseInt(x.slice(3, 5), 16), parseInt(x.slice(5, 7), 16)]; }
    var c1 = h(a), c2 = h(b); var r = c1.map(function (v, i) { return Math.round(v + (c2[i] - v) * t); });
    return "rgb(" + r[0] + "," + r[1] + "," + r[2] + ")";
  }

  /* ---------- i18n ---------- */
  var EN = {
    brand_sub: "Dentistry · AI", pre_label: "Loading · Радикс-Vision",
    nav_scan: "AI analysis", nav_path: "Pathologies", nav_calc: "Calculator", nav_pricing: "Pricing", nav_faq: "FAQ",
    cta_main: "Try for free", hero_eyebrow: "AI platform for dentistry", nav_login: "Sign in",
    hero_l1: "An X-ray", hero_l2: "that", hero_l3: "thinks.",
    hero_lead: "Радикс detects pathologies on the image in seconds, keeps the patient chart and builds a treatment plan — with AI at every step of the visit.",
    hero_cta1: "Open the product", hero_cta2: "See how it works", sec: "sec", scroll: "Scroll",
    hero_m1: "finding detection accuracy", hero_m2: "to analyze one image", hero_m3: "accepted treatment plans",
    tn1: "Caries · 94%", tn2: "Calculus · 81%", tn3: "Filling · 99%",
    scan_eyebrow: "AI image analysis · in real time",
    logos_label: "Trusted by clinics and private practices",
    path_eyebrow: "Pathology detection", path_h: "Tap a tooth — see<br>what the AI sees",
    ba_eyebrow: "Before / after", ba_h: "Treatment dynamics<br>you can see at once",
    ba_p: "Overlay images from different visits with one drag. Switch between clinical cases and show the patient the result clearly.",
    pt_eyebrow: "Patient chart", pt_h: "The whole patient history —<br>in one place",
    pt_p: "Images, findings, plans, visits and messages in a single chart. Hand a patient between doctors without losing context.",
    pt_l1: "Dental chart with history for every tooth", pt_l2: "Timeline of visits and completed work", pt_l3: "Consents, documents and photos in one click",
    as_eyebrow: "AI assistant", as_h: "Ask the AI —<br>it knows the patient",
    as_p: "The built-in assistant relies on images and history: it suggests a diagnosis, hints the protocol and helps explain treatment simply.",
    as_l1: "Answers linked to findings on the image", as_l2: "Explanation for patient and doctor — in one tap",
    as_mock: "Радикс Assistant", as_input: "Ask about the patient's image…",
    pl_eyebrow: "Treatment plans & estimates", pl_h: "A plan and estimate —<br>in a couple of clicks",
    pl_p: "From confirmed findings Радикс builds a structured plan, calculates the cost and formats it so the patient understands and agrees.",
    pl_l1: "Treatment stages with priority and cost", pl_l2: "Alternatives and insurance calculation",
    calc_eyebrow: "Value calculator", calc_h: "How much your clinic will save",
    calc_f1: "Patients per day", calc_f2: "Doctors in the clinic", calc_f3: "Minutes to describe an X-ray",
    calc_note: "Радикс takes image description off your hands and speeds up plan approval. Estimate is approximate.",
    calc_o1: "Time saved per month", calc_o1s: "hours of doctors' working time",
    calc_o2: "Extra revenue per month", calc_o2s: "from accepted plans and visits",
    td_eyebrow: "3D model of the oral cavity", td_h: "Explain<br>on a 3D model",
    td_p: "Caries, plaque, gum inflammation and crowns are shown right on the interactive 3D model — easier for the patient to understand.",
    td_cta: "Open 3D view",
    wf_eyebrow: "How it works", wf_h: "Four steps from X-ray to consent",
    pr_eyebrow: "Pricing", pr_h: "Start free,<br>grow with your clinic",
    pr_p: "No hardware lock-in. Pay per active doctor. Cancel anytime.",
    fq_eyebrow: "Questions", fq_h: "Frequently asked questions",
    cta_eyebrow: "Start today", cta_h: "Try it<br>for free",
    cta_p: "14 days of full access. Upload your first image and get the analysis in five seconds. No card required.",
    cta_b1: "Open the product", cta_b2: "Book a demo",
    cta_s1: "Sign up in a minute", cta_s2: "Upload an image", cta_s3: "Get analysis and plan",
    foot_about: "AI platform for X-ray analysis, patient management and treatment planning in dentistry.",
    foot_product: "Product", foot_p1: "AI X-ray analysis", foot_p2: "AI assistant", foot_p3: "Calculator", foot_p4: "Product demo",
    foot_company: "Company", foot_c1: "About", foot_c2: "Blog", foot_c3: "Careers", foot_c4: "Contacts",
    foot_legal: "Support", foot_l1: "FAQ", foot_l2: "Documentation", foot_l3: "Data security", foot_l4: "Privacy",
    foot_made: "Made for dentists · not a medical conclusion"
  };
  var RU = {};
  function captureRU() { $all("[data-i18n]").forEach(function (n) { RU[n.getAttribute("data-i18n")] = n.innerHTML; }); }
  function applyStatic() {
    $all("[data-i18n]").forEach(function (n) {
      var k = n.getAttribute("data-i18n"), v = lang === "ru" ? RU[k] : (EN[k] != null ? EN[k] : RU[k]);
      if (v != null) n.innerHTML = v;
    });
    document.documentElement.lang = lang;
  }

  /* ---------- radiograph SVG ---------- */
  function toothPaths(cx, hw, biteY, dir, rl, ch, two) {
    var x0 = cx - hw, x1 = cx + hw, r = hw * 0.55, ct = biteY - dir * ch, b = biteY;
    var crown = "M" + x0 + "," + b + "L" + x0 + "," + (ct + dir * r) + "Q" + x0 + "," + ct + " " + (x0 + r) + "," + ct +
      "L" + (x1 - r) + "," + ct + "Q" + x1 + "," + ct + " " + x1 + "," + (ct + dir * r) + "L" + x1 + "," + b + "Z";
    var tip = b + dir * rl;
    var roots = two ? "M" + (x0 + hw * .15) + "," + b + " L" + (cx - hw * .18) + "," + tip + " L" + (cx - hw * .05) + "," + b + "Z" +
      "M" + (x1 - hw * .15) + "," + b + " L" + (cx + hw * .18) + "," + tip + " L" + (cx + hw * .05) + "," + b + "Z"
      : "M" + (x0 + hw * .2) + "," + b + " L" + cx + "," + tip + " L" + (x1 - hw * .2) + "," + b + "Z";
    return { crown: crown, roots: roots };
  }
  function drawArch(svg, o) {
    o = o || {}; var H = svg.viewBox.baseVal.height || 460, W = 680, bite = H * .5, n = o.count || 7, gap = W / n, hb = gap * .4;
    var ns = "http://www.w3.org/2000/svg"; svg.innerHTML = "";
    var defs = document.createElementNS(ns, "defs");
    defs.innerHTML = '<linearGradient id="en1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe5ef"/><stop offset="1" stop-color="#9aa3b6"/></linearGradient>' +
      '<linearGradient id="en2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#dfe5ef"/><stop offset="1" stop-color="#9aa3b6"/></linearGradient>' +
      '<linearGradient id="bn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3350"/><stop offset="1" stop-color="#141a30"/></linearGradient>';
    svg.appendChild(defs);
    var bg = document.createElementNS(ns, "rect"); bg.setAttribute("width", W); bg.setAttribute("height", H); bg.setAttribute("fill", "url(#bn)"); svg.appendChild(bg);
    for (var i = 0; i < n; i++) {
      var cx = gap * (i + .5), molar = (i <= 1 || i >= n - 2), hw = hb * (molar ? 1.05 : .82);
      [[-1, molar ? 86 : 70, 56], [1, molar ? 92 : 74, 58]].forEach(function (a, k) {
        var dir = a[0], tp = toothPaths(cx, hw, bite + dir * 6, dir, a[1], a[2], molar), fill = dir < 0 ? "url(#en2)" : "url(#en1)";
        var rt = document.createElementNS(ns, "path"); rt.setAttribute("d", tp.roots); rt.setAttribute("fill", fill); rt.setAttribute("opacity", ".62"); svg.appendChild(rt);
        var cr = document.createElementNS(ns, "path"); cr.setAttribute("d", tp.crown); cr.setAttribute("fill", fill); cr.setAttribute("stroke", "rgba(20,26,48,.5)"); svg.appendChild(cr);
        if (o.restoreAt === i && dir > 0) { var f = document.createElementNS(ns, "rect"); f.setAttribute("x", cx - hw * .5); f.setAttribute("y", bite + 4); f.setAttribute("width", hw); f.setAttribute("height", 16); f.setAttribute("rx", 3); f.setAttribute("fill", "#f4f7fc"); svg.appendChild(f); }
        if ((o.decayAt || []).indexOf(i) > -1) { var d = document.createElementNS(ns, "ellipse"); d.setAttribute("cx", cx + hw * .3); d.setAttribute("cy", bite + dir * a[2] * .5); d.setAttribute("rx", hw * .28); d.setAttribute("ry", a[2] * .28); d.setAttribute("fill", "rgba(8,11,22,.6)"); svg.appendChild(d); }
      });
    }
    var ln = document.createElementNS(ns, "rect"); ln.setAttribute("y", bite - 5); ln.setAttribute("width", W); ln.setAttribute("height", 10); ln.setAttribute("fill", "rgba(8,11,22,.7)"); svg.appendChild(ln);
  }

  /* ============================================================ PRELOADER */
  function initPreloader() {
    var pl = $("#preloader"), bar = $("#preBar"), pc = $("#prePc");
    var p = 0, start = null, dur = 1500;
    function step(ts) {
      if (start == null) start = ts;
      p = Math.min(1, (ts - start) / dur); var e = 1 - Math.pow(1 - p, 2);
      bar.style.width = (e * 100) + "%"; pc.textContent = Math.round(e * 100) + "%";
      if (p < 1) requestAnimationFrame(step);
      else setTimeout(function () { pl.classList.add("done"); document.body.classList.add("loaded"); startHero(); }, 250);
    }
    requestAnimationFrame(step);
  }
  function startHero() {
    $all(".clip-line").forEach(function (n, i) { setTimeout(function () { n.classList.add("in"); }, 120 + i * 110); });
    setTimeout(function () { $all(".hero .reveal").forEach(function (n) { n.classList.add("in"); }); initCounters(); }, 350);
  }

  /* ============================================================ CURSOR + MAGNETIC */
  function initCursor() {
    if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.body.classList.add("cursor-on");
    var dot = $("#cDot"), ring = $("#cRing");
    var rx = 0, ry = 0, mx = 0, my = 0;
    document.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)"; });
    document.addEventListener("mousedown", function () { ring.classList.add("down"); });
    document.addEventListener("mouseup", function () { ring.classList.remove("down"); });
    document.addEventListener("mouseleave", function () { dot.classList.add("cursor-hidden"); ring.classList.add("cursor-hidden"); });
    document.addEventListener("mouseenter", function () { dot.classList.remove("cursor-hidden"); ring.classList.remove("cursor-hidden"); });
    function loop() { rx += (mx - rx) * .18; ry += (my - ry) * .18; ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)"; requestAnimationFrame(loop); }
    loop();
    var hov = "a,button,.magnetic,.tcell,.ba,.faq-q,input,.ba-tab,.range";
    document.addEventListener("mouseover", function (e) { if (e.target.closest(hov)) ring.classList.add("hover"); });
    document.addEventListener("mouseout", function (e) { if (e.target.closest(hov)) ring.classList.remove("hover"); });
  }
  function initMagnetic() {
    if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    $all(".magnetic").forEach(function (m) {
      m.addEventListener("mousemove", function (e) {
        var r = m.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        m.style.transform = "translate(" + x * .3 + "px," + y * .4 + "px)";
      });
      m.addEventListener("mouseleave", function () { m.style.transform = ""; });
    });
  }

  /* ============================================================ SOUND */
  var snd = { on: false, ctx: null };
  function ensureCtx() { if (!snd.ctx) { try { snd.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (snd.ctx && snd.ctx.state === "suspended") snd.ctx.resume(); }
  function blip(freq, dur, vol) {
    if (!snd.on || !snd.ctx) return;
    var o = snd.ctx.createOscillator(), g = snd.ctx.createGain();
    o.type = "sine"; o.frequency.value = freq; g.gain.value = 0;
    o.connect(g); g.connect(snd.ctx.destination);
    var t = snd.ctx.currentTime; g.gain.linearRampToValueAtTime(vol || .05, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + (dur || .12));
    o.start(t); o.stop(t + (dur || .12));
  }
  function initSound() {
    var btn = $("#soundBtn"), icon = $("#soundIcon");
    function render() { icon.querySelector(".wave").style.opacity = snd.on ? 1 : .25; btn.style.color = snd.on ? "var(--coral)" : ""; btn.style.borderColor = snd.on ? "var(--coral)" : ""; }
    btn.addEventListener("click", function () { ensureCtx(); snd.on = !snd.on; render(); if (snd.on) blip(660, .12, .06); });
    document.addEventListener("mouseover", function (e) { if (e.target.closest("a,button,.tcell,.ba-tab")) blip(880, .05, .025); });
    document.addEventListener("click", function (e) { if (e.target.closest("a,button,.tcell,.ba-tab")) blip(523, .1, .045); });
    render();
  }

  /* ============================================================ 3D TOOTH */
  function build3DTooth() {
    var host = $("#tooth3d"); if (!host) return; host.innerHTML = ""; var N = 16;
    for (var i = 0; i < N; i++) {
      var z = (i - (N - 1) / 2) * 5, t = i / (N - 1);
      var col = i === N - 1 ? "#ff8a5c" : mix("#3a1206", "#FF5A36", t);
      var lay = el("div", "layer"); lay.style.transform = "translateZ(" + z + "px)";
      lay.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + TOOTH + '" fill="' + col + '"/></svg>';
      host.appendChild(lay);
    }
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    host.style.animation = "none";
    var wrap = $("#tooth3dWrap"), mx = 0, my = 0, ay = 0;
    if (wrap) wrap.addEventListener("mousemove", function (e) { var r = wrap.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - .5; my = (e.clientY - r.top) / r.height - .5; });
    if (wrap) wrap.addEventListener("mouseleave", function () { mx = 0; my = 0; });
    if (reduce) { host.style.transform = "rotateX(-8deg) rotateY(18deg)"; return; }
    (function loop() { ay += .25; host.style.transform = "rotateX(" + (-my * 16) + "deg) rotateY(" + (ay + mx * 30) + "deg)"; requestAnimationFrame(loop); })();
  }

  /* ============================================================ SCAN SEQUENCE */
  var SCAN_DETS = [
    { x: 18, y: 26, w: 12, h: 16, c: "#FF5A36", lab: { ru: "Кариес", en: "Caries" }, pc: "94%", at: .42 },
    { x: 62, y: 54, w: 13, h: 16, c: "#FF5A36", lab: { ru: "Кариес", en: "Caries" }, pc: "88%", at: .56 },
    { x: 40, y: 45, w: 10, h: 12, c: "#E8941F", lab: { ru: "Камень", en: "Calculus" }, pc: "81%", at: .7 },
    { x: 75, y: 27, w: 11, h: 13, c: "#11AEC8", lab: { ru: "Пломба", en: "Filling" }, pc: "99%", at: .84 }
  ];
  var SCAN_STEPS = [
    { n: "01", t: { ru: "Снимок загружен", en: "Image uploaded" }, p: { ru: "Радикс-Vision получает рентген и подготавливает изображение к анализу.", en: "Радикс-Vision receives the radiograph and prepares the image for analysis." } },
    { n: "02", t: { ru: "Идёт анализ", en: "Analyzing" }, p: { ru: "Модель сканирует каждый зуб и оценивает плотность тканей.", en: "The model scans every tooth and evaluates tissue density." } },
    { n: "03", t: { ru: "Находки размечены", en: "Findings marked" }, p: { ru: "Кариес, камень и реставрации выделены с оценкой уверенности.", en: "Caries, calculus and restorations are marked with a confidence score." } },
    { n: "04", t: { ru: "План готов", en: "Plan ready" }, p: { ru: "Из подтверждённых находок собирается план лечения и смета.", en: "A treatment plan and estimate are built from the confirmed findings." } }
  ];
  function renderScan() {
    var stepsBox = $("#scanSteps"), prog = $("#scanProg"), dets = $("#scanDets");
    if (stepsBox) stepsBox.innerHTML = SCAN_STEPS.map(function (s, i) {
      return '<div class="st' + (i === 0 ? " on" : "") + '" data-i="' + i + '"><div class="scan-num">' + s.n + '</div><h2 class="h3">' + tt(s.t) + '</h2><p class="lead">' + tt(s.p) + '</p></div>';
    }).join("");
    if (prog) prog.innerHTML = SCAN_STEPS.map(function () { return '<i><b></b></i>'; }).join("");
    if (dets) dets.innerHTML = SCAN_DETS.map(function (d, i) {
      return '<div class="scan-det" data-i="' + i + '" style="left:' + d.x + '%;top:' + d.y + '%;width:' + d.w + '%;height:' + d.h + '%;--dc:' + d.c + '"><div class="bx"></div><div class="lb">' + tt(d.lab) + '<span class="pc">' + d.pc + '</span></div></div>';
    }).join("");
  }
  function initScan() {
    var sec = $("#scan"), film = $("#scanFilm"), grade = $("#scanGrade"), arch = $("#scanArch"), line = $("#scanLine");
    if (!sec) return;
    function onScroll() {
      var r = sec.getBoundingClientRect(), vh = window.innerHeight;
      var total = sec.offsetHeight - vh;
      var p = Math.max(0, Math.min(1, (-r.top) / total));
      // develop image
      var dev = Math.min(1, p / .32);
      grade.style.opacity = (1 - dev);
      arch.style.filter = "blur(" + (10 * (1 - dev)) + "px) brightness(" + (0.45 + 0.55 * dev) + ")";
      // scan line
      if (p > .08 && p < .42) { line.style.opacity = 1; line.style.top = (((p - .08) / .34) * 100) + "%"; } else line.style.opacity = 0;
      // detections
      $all(".scan-det", sec).forEach(function (d) { var at = SCAN_DETS[+d.getAttribute("data-i")].at; d.classList.toggle("on", p >= at); });
      // active step
      var idx = p < .3 ? 0 : p < .55 ? 1 : p < .8 ? 2 : 3;
      $all(".scan-step .st", sec).forEach(function (s) { s.classList.toggle("on", +s.getAttribute("data-i") === idx); });
      // progress
      $all(".scan-progress i b", sec).forEach(function (b, i) {
        var seg = Math.max(0, Math.min(1, (p * 4) - i)); b.style.width = (seg * 100) + "%";
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  /* ============================================================ INTERACTIVE TOOTH CHART */
  var TC_UP = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  var TC_LO = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  var TC_FIND = {
    26: { c: "#FF5A36", t: { ru: "Кариес дентина", en: "Dentin caries" }, loc: { ru: "дистальная поверхность", en: "distal surface" }, pc: 94, rec: { ru: "Прямая реставрация композитом.", en: "Direct composite restoration." } },
    37: { c: "#FF5A36", t: { ru: "Кариес эмали", en: "Enamel caries" }, loc: { ru: "окклюзионно", en: "occlusal" }, pc: 88, rec: { ru: "Минимально-инвазивное лечение.", en: "Minimally invasive treatment." } },
    16: { c: "#7c5cff", t: { ru: "Периапикальный очаг", en: "Periapical lesion" }, loc: { ru: "апекс щёчного корня", en: "buccal root apex" }, pc: 90, rec: { ru: "Эндодонтическое лечение.", en: "Endodontic treatment." } },
    41: { c: "#E8941F", t: { ru: "Зубной камень", en: "Calculus" }, loc: { ru: "язычно, придёсенно", en: "lingual, subgingival" }, pc: 81, rec: { ru: "Профессиональная гигиена.", en: "Professional hygiene." } },
    46: { c: "#11AEC8", t: { ru: "Реставрация", en: "Restoration" }, loc: { ru: "композит, состоятельна", en: "composite, sound" }, pc: 99, rec: { ru: "Наблюдение.", en: "Monitor." } }
  };
  var tcSel = 26;
  function renderToothChart() {
    var box = $("#toothChart"); if (!box) return;
    function cell(n) {
      var f = TC_FIND[n], col = f ? f.c : "var(--ink-4)";
      return '<button class="tcell magnetic' + (n === tcSel ? " sel" : "") + '" data-n="' + n + '" style="color:' + col + '">' + toothSvg("60%", "currentColor").replace('width="60%" height="60%"', '') +
        (f ? '<span class="dotc" style="background:' + f.c + '"></span>' : '') + '</button>';
    }
    box.innerHTML = '<div class="row">' + TC_UP.map(cell).join("") + '</div><div class="row">' + TC_LO.map(cell).join("") + '</div>';
    $all(".tcell", box).forEach(function (c) { c.addEventListener("click", function () { tcSel = +c.getAttribute("data-n"); renderToothChart(); renderToothInfo(); }); });
  }
  function renderToothInfo() {
    var box = $("#toothInfo"); if (!box) return; var f = TC_FIND[tcSel];
    if (!f) {
      box.innerHTML = '<div style="color:var(--ink-3);font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase">' + (lang === "ru" ? "Зуб " : "Tooth ") + tcSel + '</div>' +
        '<div class="ti-pc" style="color:var(--good)">' + (lang === "ru" ? "Норма" : "Healthy") + '</div>' +
        '<p class="lead" style="font-size:15px">' + (lang === "ru" ? "Патологий не обнаружено. Профилактический контроль." : "No pathology detected. Routine check-up.") + '</p>';
      return;
    }
    box.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="color:' + f.c + '">' + toothSvg(22, "currentColor") + '</span>' +
      '<span style="font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)">' + (lang === "ru" ? "Зуб " : "Tooth ") + tcSel + '</span></div>' +
      '<div class="ti-pc" style="color:' + f.c + '">' + f.pc + '%</div>' +
      '<div style="font-weight:700;font-size:20px;margin-top:4px;font-family:var(--ui)">' + tt(f.t) + '</div>' +
      '<p class="lead" style="font-size:15px;margin-top:6px">' + tt(f.loc) + '</p>' +
      '<div style="margin-top:16px;padding:13px 15px;border-radius:12px;background:var(--coral-soft);color:var(--coral-600);font-size:14px;font-weight:600">' + (lang === "ru" ? "Рекомендация ИИ: " : "AI suggestion: ") + tt(f.rec) + '</div>';
  }

  /* ============================================================ BEFORE / AFTER MULTI-CASE */
  var BA_CASES = [
    { name: { ru: "Кариес 26", en: "Caries 26" }, before: { count: 8, decayAt: [3, 5] }, after: { count: 8, restoreAt: 3, decayAt: [5] }, l: { ru: "Март · до", en: "March · before" }, r: { ru: "Сентябрь · после", en: "September · after" } },
    { name: { ru: "Эндодонтия 16", en: "Endo 16" }, before: { count: 7, decayAt: [1] }, after: { count: 7, restoreAt: 1 }, l: { ru: "До лечения", en: "Before" }, r: { ru: "После", en: "After" } },
    { name: { ru: "Гигиена", en: "Hygiene" }, before: { count: 9, decayAt: [4, 5] }, after: { count: 9, decayAt: [] }, l: { ru: "До чистки", en: "Before" }, r: { ru: "После чистки", en: "After" } }
  ];
  var baCase = 0;
  function renderBATabs() {
    var box = $("#baTabs"); if (!box) return;
    box.innerHTML = BA_CASES.map(function (c, i) { return '<button class="ba-tab magnetic' + (i === baCase ? " on" : "") + '" data-i="' + i + '">' + tt(c.name) + '</button>'; }).join("");
    $all(".ba-tab", box).forEach(function (b) { b.addEventListener("click", function () { baCase = +b.getAttribute("data-i"); renderBATabs(); drawBA(); }); });
  }
  function drawBA() {
    var c = BA_CASES[baCase]; var b = $("#baBefore"), a = $("#baAfter");
    if (b) drawArch(b, c.before); if (a) drawArch(a, c.after);
    $("#baTagL").textContent = tt(c.l); $("#baTagR").textContent = tt(c.r);
  }
  function initBA() {
    var ba = $("#ba"); if (!ba) return; var drag = false;
    function set(x) { var r = ba.getBoundingClientRect(); ba.style.setProperty("--sp", Math.max(2, Math.min(98, ((x - r.left) / r.width) * 100)) + "%"); }
    ba.style.setProperty("--sp", "50%");
    ba.addEventListener("pointerdown", function (e) { drag = true; ba.setPointerCapture(e.pointerId); set(e.clientX); });
    ba.addEventListener("pointermove", function (e) { if (drag) set(e.clientX); });
    ba.addEventListener("pointerup", function () { drag = false; });
    ba.addEventListener("pointercancel", function () { drag = false; });
  }

  /* ============================================================ CALCULATOR */
  function initCalc() {
    var r1 = $("#calcR1"), r2 = $("#calcR2"), r3 = $("#calcR3");
    if (!r1) return;
    var prev1 = 0, prev2 = 0;
    function tween(elm, to, fmt) {
      var from = parseFloat(elm.getAttribute("data-v") || "0"), start = null;
      function st(ts) { if (start == null) start = ts; var p = Math.min(1, (ts - start) / 500), e = 1 - Math.pow(1 - p, 3), v = from + (to - from) * e; elm.textContent = fmt(v); if (p < 1) requestAnimationFrame(st); else { elm.textContent = fmt(to); elm.setAttribute("data-v", to); } }
      requestAnimationFrame(st);
    }
    function calc() {
      var pat = +r1.value, doc = +r2.value, min = +r3.value;
      $("#calcV1").textContent = pat; $("#calcV2").textContent = doc; $("#calcV3").textContent = min;
      var hours = Math.round(pat * min * 0.72 * 22 / 60);
      var money = Math.round(hours * 2200 + pat * 22 * 350 + doc * 6000);
      tween($("#calcOut1"), hours, function (v) { return Math.round(v) + (lang === "ru" ? " ч" : " h"); });
      tween($("#calcOut2"), money, function (v) { return fmtRub(v); });
    }
    [r1, r2, r3].forEach(function (r) { r.addEventListener("input", calc); });
    calc();
  }

  /* ============================================================ CHAT */
  var CHAT = [
    { who: "me", text: { ru: "Что видно на снимке зуба 26?", en: "What's on tooth 26?" } },
    { who: "ai", text: { ru: "На дистальной поверхности зуба 26 — кариес дентина, уверенность 94%. Рекомендую прямую реставрацию.", en: "On the distal surface of tooth 26 — dentin caries, 94% confidence. I recommend a direct restoration." }, card: { ru: "📌 Находка привязана к зубу 26 · смотреть на снимке", en: "📌 Finding linked to tooth 26 · view on image" } },
    { who: "me", text: { ru: "Объясни это пациенту простыми словами", en: "Explain to the patient simply" } },
    { who: "ai", text: { ru: "«На внутренней стороне верхнего жевательного зуба началось разрушение. Если поставить пломбу сейчас — лечение будет простым и недорогим.»", en: "\"The inner side of an upper chewing tooth has started to decay. A filling now keeps treatment simple and affordable.\"" } }
  ];
  function renderChat() {
    var box = $("#chatDemo"); if (!box) return; box.innerHTML = "";
    CHAT.forEach(function (m, i) {
      var b = el("div", "bubble " + (m.who === "ai" ? "ai" : "me"));
      var h = "";
      if (m.who === "ai") h += '<div class="bn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg> Радикс ИИ</div>';
      h += "<div>" + tt(m.text) + "</div>"; if (m.card) h += '<div class="bcard">' + tt(m.card) + '</div>';
      b.innerHTML = h; b.style.opacity = "0"; b.style.transform = "translateY(10px)"; b.style.transition = "all .5s var(--ease)";
      box.appendChild(b);
      (function (bb, d) { setTimeout(function () { bb.style.opacity = "1"; bb.style.transform = "none"; }, 200 + d * 650); })(b, i);
    });
  }

  /* ============================================================ MOCKS (patient / plan / 3d) */
  function renderPatientMock() {
    var box = $("#patientMock"); if (!box) return; var ru = lang === "ru";
    var tabs = ru ? ["Снимки", "Формула", "Визиты", "Документы"] : ["Images", "Chart", "Visits", "Docs"];
    var states = ["var(--good)", "var(--coral)", "var(--good)", "var(--warn)", "var(--good)", "var(--good)", "var(--cyan)", "var(--good)"];
    box.innerHTML = '<div class="mock-bar"><i></i><i></i><i></i><span class="mt">' + (ru ? "Карточка пациента" : "Patient chart") + '</span></div>' +
      '<div style="padding:20px"><div style="display:flex;align-items:center;gap:13px;margin-bottom:16px">' +
      '<div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#2F4BF0,#7c9bff);color:#fff;display:grid;place-items:center;font-weight:700;font-family:var(--display)">АК</div>' +
      '<div><div style="font-weight:700;font-size:16px">' + (ru ? "Анна Ковалёва" : "Anna Kovaleva") + '</div><div style="font-size:13px;color:var(--ink-3)">' + (ru ? "34 года · с 2021 · ДМС" : "34 y.o. · since 2021") + '</div></div>' +
      '<span style="margin-left:auto;font-size:12px;font-weight:700;color:var(--good);background:#E2F6EE;padding:5px 11px;border-radius:999px">● ' + (ru ? "Активна" : "Active") + '</span></div>' +
      '<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">' + tabs.map(function (t, i) { return '<span style="font-size:12.5px;font-weight:600;padding:6px 12px;border-radius:999px;' + (i === 0 ? "background:var(--blue-soft);color:var(--blue)" : "color:var(--ink-3)") + '">' + t + '</span>'; }).join("") + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px;margin-bottom:16px">' + states.map(function (c) { return '<div style="aspect-ratio:1;border:1px solid var(--line);border-radius:9px;display:grid;place-items:center;color:' + c + '">' + toothSvg(20, "currentColor") + '</div>'; }).join("") + '</div>' +
      [[ru ? "Лечение кариеса 26" : "Caries 26", "12.09", "var(--good)"], [ru ? "Профгигиена" : "Hygiene", "03.06", "var(--blue)"], [ru ? "Консультация" : "Consult", "21.02", "var(--ink-4)"]].map(function (v) { return '<div style="display:flex;align-items:center;gap:11px;font-size:14px;padding:6px 0"><span style="width:9px;height:9px;border-radius:50%;background:' + v[2] + '"></span><span style="font-weight:600">' + v[0] + '</span><span style="margin-left:auto;color:var(--ink-3);font-size:13px">' + v[1] + '</span></div>'; }).join("") + '</div>';
  }
  function renderPlanMock() {
    var box = $("#planMock"); if (!box) return; var ru = lang === "ru";
    var rows = ru ? [["Лечение кариеса 26", "6 500 ₽", "var(--coral)"], ["Лечение кариеса 37", "6 500 ₽", "var(--coral)"], ["Удаление камня", "4 200 ₽", "var(--warn)"], ["Профгигиена", "3 800 ₽", "var(--good)"]]
      : [["Caries treatment 26", "6 500 ₽", "var(--coral)"], ["Caries treatment 37", "6 500 ₽", "var(--coral)"], ["Calculus removal", "4 200 ₽", "var(--warn)"], ["Hygiene", "3 800 ₽", "var(--good)"]];
    box.innerHTML = '<div class="mock-bar"><i></i><i></i><i></i><span class="mt">' + (ru ? "План лечения · Анна К." : "Plan · Anna K.") + '</span></div><div style="padding:18px">' +
      rows.map(function (r) { return '<div style="display:flex;align-items:center;gap:12px;padding:13px 4px;border-bottom:1px solid var(--line)"><span style="width:30px;height:30px;border-radius:8px;display:grid;place-items:center;background:' + r[2] + '22;color:' + r[2] + '">' + toothSvg(17, "currentColor") + '</span><div style="flex:1;font-weight:600;font-size:14.5px">' + r[0] + '</div><div style="font-weight:700;font-family:var(--display);white-space:nowrap">' + r[1] + '</div></div>'; }).join("") +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding:15px 17px;background:var(--coral-soft);border-radius:14px"><span style="font-weight:600;color:var(--coral-600)">' + (ru ? "Итого" : "Total") + '</span><span style="font-weight:700;font-size:22px;font-family:var(--display);color:var(--coral-600);white-space:nowrap">21 000 ₽</span></div>' +
      '<button class="btn btn-coral magnetic" style="width:100%;margin-top:12px"><span class="lab">' + (ru ? "Отправить пациенту" : "Send to patient") + '</span></button></div>';
  }
  function render3D() {
    var box = $("#model3dMock"); if (!box) return; var ru = lang === "ru";
    var teeth = ""; var N = 14;
    for (var i = 0; i < N; i++) {
      var ang = Math.PI * (0.08 + 0.84 * (i / (N - 1))), x = 150 - Math.cos(ang) * 120, y = 70 + Math.sin(ang) * 92;
      var hl = i === 3 ? "#FF5A36" : i === 9 ? "#E8941F" : i === 11 ? "#11AEC8" : "#cdd6ea";
      teeth += '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + (ang * 180 / Math.PI - 90).toFixed(1) + ')"><rect x="-8" y="-12" width="16" height="24" rx="6" fill="' + hl + '" stroke="rgba(10,15,31,.5)"/></g>';
    }
    box.innerHTML = '<div class="media" style="background:linear-gradient(160deg,#141319,#0b0b0e);border-color:var(--line-dark)"><div style="padding:24px;position:relative;min-height:300px;display:grid;place-items:center">' +
      '<svg viewBox="0 0 300 240" style="width:100%;max-width:360px">' + teeth + '</svg>' +
      '<div style="position:absolute;left:20px;top:20px;display:flex;flex-direction:column;gap:8px">' +
      [["#FF5A36", ru ? "Кариес" : "Caries"], ["#E8941F", ru ? "Налёт" : "Plaque"], ["#11AEC8", ru ? "Коронки" : "Crowns"]].map(function (l) { return '<span style="display:flex;align-items:center;gap:7px;color:var(--on-dark);font-size:12.5px;font-weight:600"><i style="width:9px;height:9px;border-radius:50%;background:' + l[0] + '"></i>' + l[1] + '</span>'; }).join("") + '</div></div></div>';
  }

  /* ============================================================ STEPS / METRICS / PRICING / FAQ */
  var STEPS = [
    { t: { ru: "Загрузите снимок", en: "Upload an X-ray" }, p: { ru: "Перетащите рентген или подключите через CRM клиники.", en: "Drop the radiograph or connect via the clinic CRM." } },
    { t: { ru: "ИИ находит патологии", en: "AI finds pathologies" }, p: { ru: "Радикс-Vision размечает находки и оценивает уверенность.", en: "Радикс-Vision marks findings and scores confidence." } },
    { t: { ru: "Врач подтверждает", en: "Doctor confirms" }, p: { ru: "Вы принимаете или отклоняете находки одним кликом.", en: "You accept or reject findings in one click." } },
    { t: { ru: "План и согласие", en: "Plan & consent" }, p: { ru: "Готовый план и смета — пациент видит и соглашается.", en: "A ready plan and estimate — the patient sees and agrees." } }
  ];
  function renderSteps() {
    var box = $("#steps"); if (!box) return;
    box.innerHTML = STEPS.map(function (s, i) { return '<div class="step reveal d' + (i + 1) + '"><span class="bar"></span><div class="sn">0' + (i + 1) + '</div><h4>' + tt(s.t) + '</h4><p>' + tt(s.p) + '</p></div>'; }).join("");
  }
  var METRICS = [
    { n: "72", pre: "−", suf: "%", l: { ru: "времени на описание снимка", en: "time describing an X-ray" } },
    { n: "34", pre: "+", suf: "%", l: { ru: "согласованных планов", en: "approved plans" } },
    { n: "98.2", dec: 1, suf: "%", l: { ru: "точность детекции", en: "detection accuracy" } },
    { n: "3", suf: { ru: " мин", en: " min" }, l: { ru: "экономия на пациенте", en: "saved per patient" } }
  ];
  function renderMetrics() {
    var box = $("#metrics"); if (!box) return;
    box.innerHTML = METRICS.map(function (m, i) {
      var suf = typeof m.suf === "object" ? tt(m.suf) : (m.suf || "");
      return '<div class="step reveal d' + (i + 1) + '"><span class="bar"></span><h4 class="h2" style="font-size:clamp(38px,5vw,62px);color:var(--on-dark)" data-count="' + m.n + '"' + (m.dec ? ' data-decimals="' + m.dec + '"' : "") + (m.pre ? ' data-prefix="' + m.pre + '"' : "") + ' data-suffix="' + suf + '">' + (m.pre || "") + m.n.replace(".", ",") + suf + '</h4><p>' + tt(m.l) + '</p></div>';
    }).join("");
  }
  function renderPricing() {
    var box = $("#pricing"); if (!box) return; var ru = lang === "ru";
    var plans = [
      { name: ru ? "Старт" : "Start", desc: ru ? "Для частной практики" : "For private practice", price: "0", unit: ru ? "₽ / 14 дней" : "₽ / 14 days", feat: false, list: ru ? ["50 анализов снимков", "Карточки пациентов", "AI-консультант (база)", "1 врач"] : ["50 analyses", "Patient charts", "AI assistant (basic)", "1 doctor"], cta: ru ? "Попробовать" : "Try it" },
      { name: ru ? "Клиника" : "Clinic", desc: ru ? "Для растущей клиники" : "For a growing clinic", price: "2 900", unit: ru ? "₽ / врач · мес" : "₽ / doctor · mo", feat: true, list: ru ? ["Безлимит анализов", "Планы лечения и сметы", "Сравнение до/после", "3D-модель", "Интеграция с CRM"] : ["Unlimited analyses", "Plans & estimates", "Before/after", "3D model", "CRM integration"], cta: ru ? "Выбрать" : "Choose" },
      { name: ru ? "Сеть" : "Network", desc: ru ? "Для сети клиник" : "For networks", price: ru ? "Договорная" : "Custom", unit: "", feat: false, list: ru ? ["Всё из «Клиника»", "Дашборд сети", "SSO и роли", "Выделенная поддержка", "SLA и приватный контур"] : ["Everything in Clinic", "Network dashboard", "SSO & roles", "Dedicated support", "SLA & private cloud"], cta: ru ? "Связаться" : "Contact us" }
    ];
    box.innerHTML = plans.map(function (p, i) {
      return '<div class="plan reveal d' + i + (p.feat ? " feat" : "") + '">' + (p.feat ? '<span class="fb">' + (ru ? "Популярный" : "Popular") + '</span>' : "") +
        '<h4>' + p.name + '</h4><div class="pd">' + p.desc + '</div><div class="price"><span class="pp">' + p.price + '</span><span class="pu">' + p.unit + '</span></div>' +
        '<ul>' + p.list.map(function (li) { return '<li><span class="tk">' + tick + '</span>' + li + '</li>'; }).join("") + '</ul>' +
        '<a class="btn ' + (p.feat ? "btn-coral" : "btn-out") + ' magnetic" href="Продукт МВП.html"><span class="lab">' + p.cta + '</span></a></div>';
    }).join("");
  }
  var FAQ = [
    { q: { ru: "Заменяет ли Радикс врача?", en: "Does Радикс replace the doctor?" }, a: { ru: "Нет. Радикс — ассистент: он подсвечивает находки и считает уверенность, но окончательное решение всегда принимает врач.", en: "No. Радикс is an assistant: it highlights findings and scores confidence, but the final decision is always the doctor's." } },
    { q: { ru: "С какими снимками работает система?", en: "What images does it support?" }, a: { ru: "Прицельные, bitewing, ОПТГ и срезы КЛКТ. Поддерживаются DICOM, JPG и PNG.", en: "Periapical, bitewing, OPG and CBCT slices. DICOM, JPG and PNG are supported." } },
    { q: { ru: "Где хранятся данные пациентов?", en: "Where is patient data stored?" }, a: { ru: "Данные шифруются и хранятся по требованиям к медицинским данным. Для сетей доступен приватный контур.", en: "Data is encrypted and stored per medical data requirements. Networks can use a private cloud." } },
    { q: { ru: "Сколько занимает внедрение?", en: "How long does onboarding take?" }, a: { ru: "Частная практика начинает в день регистрации. Интеграция с CRM — от нескольких дней.", en: "A private practice starts on sign-up day. CRM integration takes a few days." } },
    { q: { ru: "Можно ли отменить подписку?", en: "Can I cancel?" }, a: { ru: "Да, в любой момент. Оплата помесячная за активных врачей, без скрытых условий.", en: "Yes, anytime. Monthly billing per active doctor, no hidden terms." } }
  ];
  function renderFAQ() {
    var box = $("#faq"); if (!box) return;
    box.innerHTML = FAQ.map(function (f, i) {
      return '<div class="faq-item' + (i === 0 ? " open" : "") + '"><button class="faq-q">' + tt(f.q) + '<span class="faq-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg></span></button><div class="faq-a"><div class="faq-ai">' + tt(f.a) + '</div></div></div>';
    }).join("");
    $all(".faq-q", box).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var it = btn.parentElement, a = $(".faq-a", it), open = it.classList.contains("open");
        $all(".faq-item", box).forEach(function (x) { x.classList.remove("open"); $(".faq-a", x).style.maxHeight = null; });
        if (!open) { it.classList.add("open"); a.style.maxHeight = a.scrollHeight + "px"; }
      });
    });
    var f0 = $(".faq-item.open .faq-a", box); if (f0) f0.style.maxHeight = f0.scrollHeight + "px";
  }
  function renderMarquee() {
    var box = $("#marquee"); if (!box) return;
    var items = ["◈ AI-детекция патологий", "◇ Карточка пациента", "✚ План лечения", "◉ Онлайн-запись", "❖ CRM-воронка", "✦ Аналитика клиники", "◐ Пародонтальная карта", "✶ Склад материалов", "◆ AI-ассистент"];
    var html = items.concat(items).map(function (s) { return '<span class="m-logo">' + s + '</span>'; }).join("");
    box.innerHTML = html;
  }

  /* ============================================================ COUNTERS / REVEAL / NAV */
  function runCount(n) {
    if (n.getAttribute("data-count") == null) return;
    var target = parseFloat(n.getAttribute("data-count")) || 0, dec = parseInt(n.getAttribute("data-decimals") || "0", 10);
    var pre = n.getAttribute("data-prefix") || "", suf = n.getAttribute("data-suffix") || "", start = null;
    function step(ts) { if (start == null) start = ts; var p = Math.min(1, (ts - start) / 1300), e = 1 - Math.pow(1 - p, 3); n.textContent = pre + fmtN(target * e, dec) + suf; if (p < 1) requestAnimationFrame(step); else n.textContent = pre + fmtN(target, dec) + suf; }
    requestAnimationFrame(step);
  }
  function initCounters() {
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); io.unobserve(en.target); } }); }, { threshold: .5 });
    $all("[data-count]").forEach(function (n) { io.observe(n); });
  }
  function initReveal() {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var nodes = $all(".reveal"); if (reduce || !("IntersectionObserver" in window)) { nodes.forEach(function (n) { n.classList.add("in"); }); return; }
    document.body.classList.add("anim-on");
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
    nodes.forEach(function (n) { io.observe(n); });
    setTimeout(function () { $all(".reveal:not(.in)").forEach(function (n) { if (n.getBoundingClientRect().top < innerHeight) n.classList.add("in"); }); }, 1400);
  }
  function initNav() {
    var nav = $("#nav");
    function s() { nav.classList.toggle("solid", scrollY > 20); }
    s(); addEventListener("scroll", s, { passive: true });
    var bg = $("#burger"); if (bg) bg.addEventListener("click", function () { $("#scan").scrollIntoView({ behavior: "smooth" }); });
  }

  /* ============================================================ BOOT */
  function renderDynamic() {
    renderScan(); renderToothChart(); renderToothInfo(); renderBATabs(); drawBA();
    renderChat(); renderPatientMock(); renderPlanMock(); render3D();
    renderSteps(); renderMetrics(); renderPricing(); renderFAQ(); renderMarquee();
  }
  function setLang(l) {
    lang = l; applyStatic(); renderDynamic();
    $all("#lang button").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-lang") === l); });
    $all(".reveal:not(.in)").forEach(function (n) { n.classList.add("in"); });
    initCounters();
  }
  document.addEventListener("DOMContentLoaded", function () {
    try {
      captureRU();
      var sa = $("#scanArch"); if (sa) drawArch(sa, { count: 8, restoreAt: 5, decayAt: [1, 4] });
      renderDynamic();
      build3DTooth(); initScan(); initBA(); initCalc();
      initReveal(); initNav(); initCursor(); initMagnetic(); initSound();
      initPreloader();
      $("#lang").addEventListener("click", function (e) { var b = e.target.closest("button[data-lang]"); if (b) setLang(b.getAttribute("data-lang")); });
      // safety: never leave the page gated behind the preloader
      function forceReveal() { var pl = $("#preloader"); if (pl && !pl.classList.contains("done")) { pl.classList.add("done"); document.body.classList.add("loaded"); startHero(); } }
      setTimeout(forceReveal, 2200);
      window.addEventListener("load", function () { setTimeout(forceReveal, 600); });
    } catch (err) { console.error("boot", err); var pl = $("#preloader"); if (pl) pl.classList.add("done"); }
  });
})();
