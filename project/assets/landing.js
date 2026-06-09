/* ============================================================
   МВП Лендинг — interactivity, i18n, X-ray rendering
   ============================================================ */
(function () {
  "use strict";
  var lang = "ru";

  /* ---------- tiny helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function t(obj) { return (obj && obj[lang] != null) ? obj[lang] : obj; }
  var tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>';

  /* ============================================================
     1. STATIC TEXT i18n (data-i18n nodes)
     ============================================================ */
  var EN = {
    brand_sub: "Dentistry · AI",
    nav_features: "Features", nav_analysis: "AI analysis", nav_workflow: "How it works",
    nav_pricing: "Pricing", nav_faq: "FAQ", nav_demo: "Product demo",
    cta_main: "Try for free", cta_main2: "Try for free",
    hero_eyebrow: "AI platform for dentistry",
    hero_h1_a: "Analyze X-rays", hero_h1_b: "in seconds, not minutes",
    hero_lead: "МВП detects caries, calculus and pathologies on radiographs, keeps the patient chart and helps you explain the treatment plan — with AI in every step.",
    hero_watch: "Open the product",
    hero_stat1: "detection accuracy", hero_stat2: "per X-ray analysis", hero_stat3: "accepted plans",
    viewer_status: "МВП Analysis · image processed", viewer_patient: "Patient #2048",
    ro_caries: "Caries · 2", ro_tartar: "Calculus · 1", ro_resto: "Filling · 1",
    viewer_model: "model МВП-Vision 3.1",
    float1_t: "Plan ready", float1_s: "estimate generated",
    float2_t: "AI assistant", float2_s: "answers your questions",
    logos_label: "Trusted by clinics and private practices",
    pkg_eyebrow: "The МВП platform", pkg_h: "The whole digital visit — in one subscription",
    pkg_p: "One account unlocks every module: from AI image analysis to treatment plans and integration with your clinic.",
    pkg_cta1: "See pricing", pkg_cta2: "Open the product",
    pkg_i1l: "AI image analyses", pkg_i1s: "periapical, bitewing, OPG, CBCT",
    pkg_i2l: "AI assistant", pkg_i2s: "knows the patient's context",
    pkg_i3l: "Patient charts", pkg_i3s: "images, history, documents",
    pkg_i4n: "Auto", pkg_i4l: "Plans & estimates", pkg_i4s: "generated from AI findings",
    pkg_i5l: "Oral cavity model", pkg_i5s: "to explain to the patient",
    pkg_i6l: "CRM integrations", pkg_i6s: "schedule, cashbox, API",
    an_found: "Found: 4", an_rescan: "Run analysis",
    sub_analysis: "AI X-ray analysis", sub_pathology: "Pathology detection", sub_compare: "Before / after",
    sub_patient: "Patient chart", sub_assistant: "AI assistant", sub_plans: "Plans & estimates",
    sub_3d: "3D model", sub_crm: "CRM integration",
    feat_eyebrow: "One platform · the whole visit",
    feat_h: "From X-ray to an approved treatment plan",
    feat_p: "МВП unites AI diagnostics, patient management and communication in a single interface. Less routine — more time for treatment.",
    an_eyebrow: "AI X-ray analysis", an_h: "Radiographs are analyzed automatically in seconds",
    an_p: "Upload a periapical, bitewing or panoramic image — МВП-Vision marks findings, scores confidence and highlights zones that need attention.",
    an_l1: "Periapical, bitewing, OPG and CBCT slices supported",
    an_l2: "Per-finding confidence score in percent",
    an_l3: "The doctor confirms or rejects — AI stays an assistant",
    an_cta: "See it in the product →", an_mock_top: "Analysis queue · 1 of 1",
    pa_eyebrow: "Pathology detection", pa_h: "Caries, calculus, periapical changes — under control",
    pa_p: "The model is trained on dentist-labeled images and recognizes key conditions, prioritizing them for the visit.",
    pa_mock_title: "Findings · image #2048",
    co_eyebrow: "Before / after", co_h: "Show the patient progress visually",
    co_p: "Overlay images from different visits with a single drag. Perfect for showing dynamics and justifying recommendations.",
    co_l1: "Synchronized overlay of images by visit date",
    co_l2: "Trend charts: periodontal pockets, bleeding",
    ba_before: "March · before", ba_after: "September · after",
    pt_eyebrow: "Patient chart", pt_h: "The entire patient history in one place",
    pt_p: "Images, findings, treatment plans, visits and messages — in a single chart. Hand off a patient between doctors without losing context.",
    pt_l1: "Dental chart with history for every tooth",
    pt_l2: "Timeline of visits and completed work",
    pt_l3: "Consents, documents and photos in one click",
    as_eyebrow: "AI assistant", as_h: "Ask the AI — it knows the patient's context",
    as_p: "The built-in assistant relies on images and patient history: it suggests a differential diagnosis, hints at the protocol and helps explain treatment in plain words.",
    as_l1: "Answers linked to specific findings on the image",
    as_l2: "Explanation for the patient and for the doctor — in one tap",
    as_mock: "МВП Assistant", as_input: "Ask about the patient's image…",
    pl_eyebrow: "Treatment plans & estimates", pl_h: "A treatment plan and estimate in a couple of clicks",
    pl_p: "From confirmed findings МВП assembles a structured plan, calculates the cost and formats it so the patient understands and agrees.",
    pl_l1: "Treatment stages with priority and cost",
    pl_l2: "Alternative options and insurance calculation",
    td_eyebrow: "3D model of the oral cavity", td_h: "Explain on an interactive 3D model",
    td_p: "Caries, plaque, gum inflammation and crowns are shown right on the 3D model — it's easier for the patient to understand what's happening.",
    td_cta: "Open 3D view",
    cr_eyebrow: "Clinic CRM integration", cr_h: "Works with your systems",
    cr_p: "МВП syncs with the clinic's schedule, charts and cashbox. Analysis and plans land straight in your system — no double entry.",
    me_eyebrow: "Outcome for the clinic", me_h: "Less routine. More accepted plans.",
    me_1: "time spent describing an X-ray", me_2: "approved treatment plans",
    me_3: "finding detection accuracy", me_4: "average saving per patient",
    wf_eyebrow: "How it works", wf_h: "Four steps from X-ray to consent",
    pr_eyebrow: "Pricing", pr_h: "Start free, grow with your clinic",
    pr_p: "No hardware lock-in. Pay per active doctor. Cancel anytime.",
    fq_eyebrow: "Questions", fq_h: "Frequently asked questions",
    cta_eyebrow: "Start today", cta_h: "Try МВП for free",
    cta_p: "14 days of full access. Upload your first image and get the analysis in five seconds. No card required.",
    cta_btn1: "Open the product", cta_btn2: "Book a demo",
    cta_s1: "Sign up in a minute", cta_s2: "Upload an image", cta_s3: "Get analysis and plan",
    foot_about: "AI platform for X-ray analysis, patient management and treatment planning in dentistry.",
    foot_product: "Product", foot_p1: "AI X-ray analysis", foot_p2: "AI assistant", foot_p3: "Treatment plans", foot_p4: "Product demo",
    foot_company: "Company", foot_c1: "About", foot_c2: "Blog", foot_c3: "Careers", foot_c4: "Contacts",
    foot_legal: "Support", foot_l1: "FAQ", foot_l2: "Documentation", foot_l3: "Data security", foot_l4: "Privacy policy",
    foot_rights: "All rights reserved.", foot_made: "Made for dentists · not a medical conclusion"
  };

  var RU = {}; // captured from DOM
  function captureRU() { $all("[data-i18n]").forEach(function (n) { RU[n.getAttribute("data-i18n")] = n.innerHTML; }); }
  function applyStatic() {
    $all("[data-i18n]").forEach(function (n) {
      var k = n.getAttribute("data-i18n");
      var v = lang === "ru" ? RU[k] : (EN[k] != null ? EN[k] : RU[k]);
      if (v != null) n.innerHTML = v;
    });
    document.documentElement.lang = lang;
  }

  /* ============================================================
     2. DENTAL X-RAY rendering (schematic radiograph)
     ============================================================ */
  function toothPath(cx, halfW, biteY, dir, rootLen, crownH, twoRoots) {
    // dir: 1 = lower jaw (crown up toward bite, roots down), -1 = upper (crown down, roots up)
    var x0 = cx - halfW, x1 = cx + halfW;
    var crownTop = biteY - dir * crownH;     // edge near bite line
    var crownBase = biteY;                    // at bite line
    var r = halfW * 0.55;
    // crown: rounded rectangle from biteline outward by crownH
    var p = "";
    p += "M" + x0 + "," + crownBase;
    p += "L" + x0 + "," + (crownTop + dir * r);
    p += "Q" + x0 + "," + crownTop + " " + (x0 + r) + "," + crownTop;
    p += "L" + (x1 - r) + "," + crownTop;
    p += "Q" + x1 + "," + crownTop + " " + x1 + "," + (crownTop + dir * r);
    p += "L" + x1 + "," + crownBase + "Z";
    // roots extend from crownBase away from bite line (dir positive => downward)
    var rootTipY = crownBase + dir * rootLen;
    var roots = "";
    if (twoRoots) {
      roots += "M" + (x0 + halfW * 0.15) + "," + crownBase + " L" + (cx - halfW * 0.18) + "," + rootTipY + " L" + (cx - halfW * 0.05) + "," + crownBase + "Z";
      roots += "M" + (x1 - halfW * 0.15) + "," + crownBase + " L" + (cx + halfW * 0.18) + "," + rootTipY + " L" + (cx + halfW * 0.05) + "," + crownBase + "Z";
    } else {
      roots += "M" + (x0 + halfW * 0.2) + "," + crownBase + " L" + cx + "," + rootTipY + " L" + (x1 - halfW * 0.2) + "," + crownBase + "Z";
    }
    return { crown: p, roots: roots };
  }

  function drawArch(svg, opts) {
    opts = opts || {};
    var W = 680, H = svg.viewBox.baseVal.height || 460;
    var ns = "http://www.w3.org/2000/svg";
    svg.innerHTML = "";
    // defs: gradients
    var defs = document.createElementNS(ns, "defs");
    defs.innerHTML =
      '<linearGradient id="enamel" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#dfe5ef"/><stop offset="1" stop-color="#9aa3b6"/></linearGradient>' +
      '<linearGradient id="enamelInv" x1="0" y1="1" x2="0" y2="0">' +
      '<stop offset="0" stop-color="#dfe5ef"/><stop offset="1" stop-color="#9aa3b6"/></linearGradient>' +
      '<linearGradient id="bone" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#2a3350"/><stop offset="1" stop-color="#141a30"/></linearGradient>';
    svg.appendChild(defs);

    // bone/background bands near bite line
    var bite = H * 0.5;
    var bg = document.createElementNS(ns, "rect");
    bg.setAttribute("x", 0); bg.setAttribute("y", 0); bg.setAttribute("width", W); bg.setAttribute("height", H);
    bg.setAttribute("fill", "url(#bone)"); svg.appendChild(bg);

    var n = opts.count || 7;
    var gap = W / n;
    var halfW = gap * 0.40;
    for (var i = 0; i < n; i++) {
      var cx = gap * (i + 0.5);
      var molar = (i === 0 || i === n - 1 || i === 1 || i === n - 2);
      // upper tooth (dir -1)
      addTooth(svg, ns, cx, halfW * (molar ? 1.05 : 0.82), bite - 6, -1, molar ? 86 : 70, 56, molar, opts);
      // lower tooth (dir +1)
      addTooth(svg, ns, cx, halfW * (molar ? 1.05 : 0.82), bite + 6, 1, molar ? 92 : 74, 58, molar, opts);
    }
    // occlusal dark line
    var line = document.createElementNS(ns, "rect");
    line.setAttribute("x", 0); line.setAttribute("y", bite - 5); line.setAttribute("width", W); line.setAttribute("height", 10);
    line.setAttribute("fill", "rgba(8,11,22,.7)"); svg.appendChild(line);
  }

  function addTooth(svg, ns, cx, halfW, biteY, dir, rootLen, crownH, twoRoots, opts) {
    var tp = toothPath(cx, halfW, biteY, dir, rootLen, crownH, twoRoots);
    var roots = document.createElementNS(ns, "path");
    roots.setAttribute("d", tp.roots);
    roots.setAttribute("fill", dir < 0 ? "url(#enamelInv)" : "url(#enamel)");
    roots.setAttribute("opacity", "0.62");
    svg.appendChild(roots);
    var crown = document.createElementNS(ns, "path");
    crown.setAttribute("d", tp.crown);
    crown.setAttribute("fill", dir < 0 ? "url(#enamelInv)" : "url(#enamel)");
    crown.setAttribute("stroke", "rgba(20,26,48,.5)");
    crown.setAttribute("stroke-width", "1");
    svg.appendChild(crown);
    // existing restoration (bright white) on a marked tooth
    if (opts.restoreAt != null && Math.abs(cx - opts.restoreAt) < 6 && dir > 0) {
      var fill = document.createElementNS(ns, "rect");
      fill.setAttribute("x", cx - halfW * 0.5); fill.setAttribute("y", biteY - 2);
      fill.setAttribute("width", halfW); fill.setAttribute("height", 16); fill.setAttribute("rx", 3);
      fill.setAttribute("fill", "#f4f7fc"); svg.appendChild(fill);
    }
  }

  // detection boxes (percent coords relative to film)
  function renderDetections(layer, dets) {
    if (!layer) return;
    layer.innerHTML = "";
    dets.forEach(function (d, i) {
      var box = el("div", "det");
      box.style.left = d.x + "%"; box.style.top = d.y + "%";
      box.style.width = d.w + "%"; box.style.height = d.h + "%";
      box.style.setProperty("--c", d.c);
      box.innerHTML = '<div class="box"></div><div class="lbl">' + t(d.label) + (d.pc ? ' <span class="pc">' + d.pc + '</span>' : '') + '</div>';
      layer.appendChild(box);
      (function (b, delay) { setTimeout(function () { b.classList.add("show"); }, delay); })(box, 700 + i * 260);
    });
  }

  var heroDets = [
    { x: 19, y: 30, w: 11, h: 15, c: "var(--danger)", label: { ru: "Кариес", en: "Caries" }, pc: "94%" },
    { x: 63, y: 56, w: 12, h: 16, c: "var(--danger)", label: { ru: "Кариес", en: "Caries" }, pc: "88%" },
    { x: 40, y: 47, w: 9, h: 12, c: "var(--warn)", label: { ru: "Камень", en: "Calculus" }, pc: "81%" },
    { x: 76, y: 30, w: 10, h: 13, c: "var(--cyan)", label: { ru: "Пломба", en: "Filling" }, pc: "" }
  ];

  /* ============================================================
     3. DYNAMIC CONTENT (cards, lists, mocks…)
     ============================================================ */
  var ICONS = {
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M3 12h18"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
    compare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18M5 8l-3 4 3 4M19 8l3 4-3 4"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12Z"/><path d="M8 11h8M8 14h5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    tooth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4c-1.6 0-2.2 1-3.6 1S6 4 4.8 5C4 6 4 7.6 4.6 10c.4 1.7.7 3.4 1.1 5.2.3 1.4.6 3.3 1.8 3.3 1 0 1-1.8 1.3-3 .2-.9.5-1.5 1.2-1.5s1 .6 1.2 1.5c.3 1.2.3 3 1.3 3 1.2 0 1.5-1.9 1.8-3.3.4-1.8.7-3.5 1.1-5.2C19 7.6 19 6 18.2 5 17 4 16 5 14.6 5S13.6 4 12 4Z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>'
  };

  var FEATURES = [
    { ic: "scan", c: "var(--primary)", bg: "var(--primary-tint)", t: { ru: "AI-анализ снимков", en: "AI X-ray analysis" }, p: { ru: "Автоматическая разметка находок на рентгене за секунды.", en: "Automatic finding markup on X-rays in seconds." } },
    { ic: "shield", c: "var(--danger)", bg: "var(--danger-tint)", t: { ru: "Распознавание патологий", en: "Pathology detection" }, p: { ru: "Кариес, камень, периапикальные изменения с приоритетом.", en: "Caries, calculus and periapical changes, prioritized." } },
    { ic: "compare", c: "var(--cyan)", bg: "var(--cyan-tint)", t: { ru: "Сравнение до / после", en: "Before / after" }, p: { ru: "Наглядная динамика между визитами в один слайдер.", en: "Visual dynamics between visits in a single slider." } },
    { ic: "user", c: "var(--good)", bg: "var(--good-tint)", t: { ru: "Карточка пациента", en: "Patient chart" }, p: { ru: "Снимки, история, планы и переписка в одной карточке.", en: "Images, history, plans and chat in one chart." } },
    { ic: "chat", c: "var(--violet)", bg: "#efeaff", t: { ru: "AI-консультант", en: "AI assistant" }, p: { ru: "Чат, который знает контекст пациента и снимков.", en: "A chat that knows the patient and image context." } },
    { ic: "doc", c: "var(--warn)", bg: "var(--warn-tint)", t: { ru: "Планы и сметы", en: "Plans & estimates" }, p: { ru: "Структурированный план лечения и расчёт стоимости.", en: "A structured treatment plan and cost estimate." } }
  ];

  function renderFeatures() {
    $all(".fcard[data-ic]").forEach(function (card, i) {
      var f = FEATURES[i]; if (!f) return;
      card.innerHTML =
        '<div class="fc-ic" style="background:' + f.bg + ';color:' + f.c + '">' + ICONS[f.ic] + '</div>' +
        '<h4>' + t(f.t) + '</h4><p>' + t(f.p) + '</p>';
    });
  }

  var FINDINGS = [
    { c: "var(--danger)", sev: { ru: "Высокий", en: "High" }, t: { ru: "Кариес дентина", en: "Dentin caries" }, loc: "26 · дистально", pc: 94 },
    { c: "var(--danger)", sev: { ru: "Высокий", en: "High" }, t: { ru: "Кариес эмали", en: "Enamel caries" }, loc: "37 · окклюзионно", pc: 88 },
    { c: "var(--warn)", sev: { ru: "Средний", en: "Medium" }, t: { ru: "Зубной камень", en: "Calculus" }, loc: "31–41 · придёсенно", pc: 81 },
    { c: "var(--cyan)", sev: { ru: "Норма", en: "Normal" }, t: { ru: "Реставрация", en: "Restoration" }, loc: "46 · композит", pc: 99 }
  ];
  function renderFindings() {
    var box = $("#findings"); if (!box) return; box.innerHTML = "";
    FINDINGS.forEach(function (f) {
      var row = el("div", "");
      row.style.cssText = "display:flex;align-items:center;gap:13px;padding:13px 14px;border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:var(--sh-sm)";
      row.innerHTML =
        '<span style="width:38px;height:38px;border-radius:10px;flex:0 0 auto;display:grid;place-items:center;background:' + f.c + '1a;color:' + f.c + '">' + ICONS.tooth + '</span>' +
        '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:15px">' + t(f.t) + '</div>' +
        '<div style="font-size:13px;color:var(--ink-3)">' + f.loc + '</div>' +
        '<div class="conf-bar"><i data-w="' + f.pc + '" style="background:' + f.c + '"></i></div></div>' +
        '<div style="text-align:right"><div style="font-weight:800;font-family:var(--font-display);color:' + f.c + '">' + f.pc + '%</div>' +
        '<div style="font-size:11px;color:var(--ink-4)">' + t(f.sev) + '</div></div>';
      box.appendChild(row);
    });
  }

  var PATHTAGS = [
    { ru: "Кариес", en: "Caries" }, { ru: "Зубной камень", en: "Calculus" }, { ru: "Периапикальные очаги", en: "Periapical lesions" },
    { ru: "Резорбция кости", en: "Bone resorption" }, { ru: "Дефекты реставраций", en: "Restoration defects" }, { ru: "Ретенция", en: "Impaction" },
    { ru: "Перелом корня", en: "Root fracture" }, { ru: "Расширение периодонта", en: "PDL widening" }
  ];
  function renderPathList() {
    var box = $("#pathList"); if (!box) return;
    box.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;margin-top:24px";
    box.innerHTML = "";
    PATHTAGS.forEach(function (p) {
      var chip = el("span", "chip", '<span style="color:var(--primary)">' + ICONS.tooth.replace(/width="[^"]*"/, '') + '</span>' + t(p));
      box.appendChild(chip);
    });
  }

  /* ----- chat demo ----- */
  var CHAT = [
    { who: "me", text: { ru: "Что видно на снимке зуба 26?", en: "What do you see on tooth 26?" } },
    { who: "ai", text: { ru: "На дистальной поверхности зуба 26 — очаг кариеса дентина, уверенность 94%. Рекомендую прямую реставрацию.", en: "On the distal surface of tooth 26 there's a dentin caries lesion, 94% confidence. I recommend a direct restoration." },
      card: { ru: "📌 Находка привязана к зубу 26 · смотреть на снимке", en: "📌 Finding linked to tooth 26 · view on image" } },
    { who: "me", text: { ru: "Объясни это пациенту простыми словами", en: "Explain this to the patient simply" } },
    { who: "ai", text: { ru: "«На внутренней стороне верхнего жевательного зуба началось разрушение. Если поставить пломбу сейчас, лечение будет простым и недорогим.»", en: "\"The inner side of an upper chewing tooth has started to decay. A filling now keeps treatment simple and affordable.\"" } }
  ];
  function renderChat() {
    var box = $("#chatDemo"); if (!box) return; box.innerHTML = "";
    CHAT.forEach(function (m, i) {
      var b = el("div", "bubble " + (m.who === "ai" ? "ai" : "me"));
      var inner = "";
      if (m.who === "ai") inner += '<div class="b-name">' + ICONS.bolt.replace(/stroke-width="[^"]*"/, 'stroke-width="2"') + ' МВП ИИ</div>';
      inner += '<div>' + t(m.text) + '</div>';
      if (m.card) inner += '<div class="b-card">' + t(m.card) + '</div>';
      b.innerHTML = inner;
      b.style.opacity = "0"; b.style.transform = "translateY(10px)"; b.style.transition = "all .5s";
      box.appendChild(b);
      (function (bb, d) { setTimeout(function () { bb.style.opacity = "1"; bb.style.transform = "none"; }, 300 + d * 700); })(b, i);
    });
  }

  /* ----- patient mock ----- */
  function renderPatientMock() {
    var box = $("#patientMock"); if (!box) return;
    var L = lang === "ru"
      ? { title: "Карточка пациента", name: "Анна Ковалёва", meta: "34 года · с 2021 · ДМС", tabs: ["Снимки", "Зубная формула", "Визиты", "Документы"], v1: "Лечение кариеса 26", v2: "Профгигиена", v3: "Консультация · план", next: "Следующий визит" }
      : { title: "Patient chart", name: "Anna Kovaleva", meta: "34 y.o. · since 2021 · insured", tabs: ["Images", "Dental chart", "Visits", "Documents"], v1: "Caries treatment 26", v2: "Hygiene", v3: "Consultation · plan", next: "Next visit" };
    box.innerHTML =
      '<div class="mock-head"><div class="mock-dots"><i></i><i></i><i></i></div><span class="mock-title">' + L.title + '</span></div>' +
      '<div style="padding:18px">' +
      '<div style="display:flex;align-items:center;gap:13px;margin-bottom:16px">' +
        '<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#3B5BFF,#7c9bff);color:#fff;display:grid;place-items:center;font-weight:800;font-family:var(--font-display)">АК</div>' +
        '<div><div style="font-weight:700;font-size:16px">' + L.name + '</div><div style="font-size:13px;color:var(--ink-3)">' + L.meta + '</div></div>' +
        '<span class="chip" style="margin-left:auto;background:var(--good-tint);color:var(--good)">●  ' + (lang==="ru"?"Активна":"Active") + '</span>' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">' + L.tabs.map(function (tb, i) { return '<span style="font-size:13px;font-weight:600;padding:6px 12px;border-radius:999px;' + (i === 0 ? 'background:var(--primary-tint);color:var(--primary)' : 'color:var(--ink-3)') + '">' + tb + '</span>'; }).join("") + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">' +
        toothCells() + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
        visitRow("var(--good)", L.v1, "12.09.2025") + visitRow("var(--primary)", L.v2, "03.06.2025") + visitRow("var(--ink-4)", L.v3, "21.02.2025") +
      '</div></div>';
  }
  function toothCells() {
    var states = ["var(--good)", "var(--danger)", "var(--good)", "var(--warn)", "var(--good)", "var(--good)", "var(--cyan)", "var(--good)"];
    return states.map(function (c, i) {
      return '<div style="aspect-ratio:1;border:1px solid var(--line);border-radius:10px;display:grid;place-items:center;background:#fff;color:' + c + '">' + ICONS.tooth + '</div>';
    }).join("");
  }
  function visitRow(c, label, date) {
    return '<div style="display:flex;align-items:center;gap:11px;font-size:14px">' +
      '<span style="width:9px;height:9px;border-radius:50%;background:' + c + '"></span>' +
      '<span style="font-weight:600">' + label + '</span>' +
      '<span style="margin-left:auto;color:var(--ink-3);font-size:13px">' + date + '</span></div>';
  }

  /* ----- plan mock ----- */
  function renderPlanMock() {
    var box = $("#planMock"); if (!box) return;
    var ru = lang === "ru";
    var rows = ru ? [
      ["Лечение кариеса 26", "Приоритет 1", "6 500 ₽", "var(--danger)"],
      ["Лечение кариеса 37", "Приоритет 1", "6 500 ₽", "var(--danger)"],
      ["Удаление зубного камня", "Приоритет 2", "4 200 ₽", "var(--warn)"],
      ["Профгигиена", "Профилактика", "3 800 ₽", "var(--good)"]
    ] : [
      ["Caries treatment 26", "Priority 1", "6 500 ₽", "var(--danger)"],
      ["Caries treatment 37", "Priority 1", "6 500 ₽", "var(--danger)"],
      ["Calculus removal", "Priority 2", "4 200 ₽", "var(--warn)"],
      ["Hygiene", "Prevention", "3 800 ₽", "var(--good)"]
    ];
    box.innerHTML =
      '<div class="mock-head"><div class="mock-dots"><i></i><i></i><i></i></div><span class="mock-title">' + (ru ? "План лечения · Анна К." : "Treatment plan · Anna K.") + '</span></div>' +
      '<div style="padding:18px">' +
      rows.map(function (r) {
        return '<div style="display:flex;align-items:center;gap:12px;padding:13px 4px;border-bottom:1px solid var(--line)">' +
          '<span style="width:30px;height:30px;border-radius:8px;flex:0 0 auto;display:grid;place-items:center;background:' + r[3] + '1a;color:' + r[3] + '">' + ICONS.tooth + '</span>' +
          '<div style="flex:1"><div style="font-weight:600;font-size:14.5px">' + r[0] + '</div><div style="font-size:12px;color:var(--ink-3)">' + r[1] + '</div></div>' +
          '<div style="font-weight:700;font-family:var(--font-display);white-space:nowrap">' + r[2] + '</div></div>';
      }).join("") +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding:14px 16px;background:var(--primary-tint);border-radius:14px">' +
        '<span style="font-weight:600;color:var(--primary-700)">' + (ru ? "Итого по плану" : "Plan total") + '</span>' +
        '<span style="font-weight:800;font-size:22px;font-family:var(--font-display);color:var(--primary-700);white-space:nowrap">21 000 ₽</span></div>' +
      '<button class="btn btn-primary" style="width:100%;margin-top:12px">' + (ru ? "Отправить пациенту" : "Send to patient") + '</button>' +
      '</div>';
  }

  /* ----- 3D mock ----- */
  function render3D() {
    var box = $("#model3dMock"); if (!box) return;
    var ru = lang === "ru";
    box.innerHTML =
      '<div class="media-card" style="background:linear-gradient(160deg,#11182e,#0a0f1f);border-color:rgba(255,255,255,.08)">' +
      '<div style="padding:20px;position:relative;min-height:300px;display:grid;place-items:center">' +
        '<svg viewBox="0 0 300 240" style="width:100%;max-width:340px">' +
          archShape() +
        '</svg>' +
        '<div style="position:absolute;left:18px;top:18px;display:flex;flex-direction:column;gap:7px">' +
          legend("var(--danger)", ru ? "Кариес" : "Caries") + legend("var(--warn)", ru ? "Налёт" : "Plaque") + legend("var(--cyan)", ru ? "Коронки" : "Crowns") +
        '</div>' +
        '<div style="position:absolute;right:18px;bottom:18px;display:flex;gap:6px">' +
          '<span class="viewer-tag">◐ ' + (ru ? "Вращать" : "Rotate") + '</span><span class="viewer-tag">⊕ ' + (ru ? "Приблизить" : "Zoom") + '</span></div>' +
      '</div></div>';
  }
  function legend(c, label) { return '<span style="display:flex;align-items:center;gap:7px;color:var(--on-dark);font-size:12.5px;font-weight:600"><i style="width:9px;height:9px;border-radius:50%;background:' + c + '"></i>' + label + '</span>'; }
  function archShape() {
    // schematic dental arch of teeth as ellipses in a U
    var teeth = "";
    var N = 14;
    for (var i = 0; i < N; i++) {
      var ang = Math.PI * (0.08 + 0.84 * (i / (N - 1)));
      var rx = 120, ry = 92, cx0 = 150, cy0 = 70;
      var x = cx0 - Math.cos(ang) * rx;
      var y = cy0 + Math.sin(ang) * ry;
      var hl = (i === 3) ? "var(--danger)" : (i === 9) ? "var(--warn)" : (i === 11) ? "var(--cyan)" : "#cdd6ea";
      var ang2 = ang * 180 / Math.PI;
      teeth += '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + (ang2 - 90).toFixed(1) + ')">' +
        '<rect x="-8" y="-12" width="16" height="24" rx="6" fill="' + hl + '" stroke="rgba(10,15,31,.5)"/></g>';
    }
    return teeth;
  }

  /* ----- crm ----- */
  var CRMS = [
    { ic: "calendar", t: { ru: "Расписание и онлайн-запись", en: "Schedule & online booking" } },
    { ic: "user", t: { ru: "Карточки пациентов", en: "Patient records" } },
    { ic: "cash", t: { ru: "Касса и оплата", en: "Cashbox & payments" } },
    { ic: "link", t: { ru: "API и вебхуки", en: "API & webhooks" } }
  ];
  function renderCRM() {
    var box = $("#crmGrid"); if (box) {
      box.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:24px";
      box.innerHTML = CRMS.map(function (c) {
        return '<div style="display:flex;align-items:center;gap:11px;padding:13px 14px;border:1px solid var(--line);border-radius:14px;background:#fff">' +
          '<span style="width:36px;height:36px;border-radius:10px;flex:0 0 auto;display:grid;place-items:center;background:var(--primary-tint);color:var(--primary)">' + ICONS[c.ic] + '</span>' +
          '<span style="font-weight:600;font-size:14px">' + t(c.t) + '</span></div>';
      }).join("");
    }
    var mock = $("#crmMock"); if (mock) {
      var ru = lang === "ru";
      var systems = ["IDENT", "Dental4Web", "StomX", "MedFlow", "КлиникаПро", "1С:Мед"];
      mock.innerHTML =
        '<div class="mock-head"><div class="mock-dots"><i></i><i></i><i></i></div><span class="mock-title">' + (ru ? "Интеграции" : "Integrations") + '</span></div>' +
        '<div style="padding:22px">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        systems.map(function (s, i) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px;border:1px solid var(--line);border-radius:14px;background:#fff">' +
            '<span style="font-weight:700;font-family:var(--font-display);font-size:15px">' + s + '</span>' +
            '<span style="font-size:11px;font-weight:700;color:var(--good);background:var(--good-tint);padding:3px 8px;border-radius:999px">' + (i < 4 ? (ru ? "Подключено" : "Connected") : (ru ? "Скоро" : "Soon")) + '</span></div>';
        }).join("") + '</div>' +
        '<div style="margin-top:16px;display:flex;align-items:center;gap:10px;padding:14px;background:var(--bg-tint);border-radius:14px;color:var(--primary-700);font-size:13.5px;font-weight:600">' +
        ICONS.bolt + (ru ? "Двусторонняя синхронизация в реальном времени" : "Real-time two-way sync") + '</div>' +
        '</div>';
    }
  }

  /* ----- steps ----- */
  var STEPS = [
    { t: { ru: "Загрузите снимок", en: "Upload an X-ray" }, p: { ru: "Перетащите рентген или подключите через CRM клиники.", en: "Drop the radiograph or connect via the clinic CRM." } },
    { t: { ru: "ИИ находит патологии", en: "AI finds pathologies" }, p: { ru: "МВП-Vision размечает находки и оценивает уверенность.", en: "МВП-Vision marks findings and scores confidence." } },
    { t: { ru: "Врач подтверждает", en: "Doctor confirms" }, p: { ru: "Вы принимаете или отклоняете находки одним кликом.", en: "You accept or reject findings in one click." } },
    { t: { ru: "План и согласие", en: "Plan & consent" }, p: { ru: "Готовый план и смета — пациент видит и соглашается.", en: "A ready plan and estimate — the patient sees and agrees." } }
  ];
  function renderSteps() {
    var box = $("#steps"); if (!box) return;
    box.innerHTML = STEPS.map(function (s, i) {
      return '<div class="step reveal reveal-d' + (i + 1) + '"><div class="s-num">' + (i + 1) + '</div><h4>' + t(s.t) + '</h4><p>' + t(s.p) + '</p></div>';
    }).join("");
  }

  /* ----- pricing ----- */
  function renderPricing() {
    var box = $("#pricing"); if (!box) return;
    var ru = lang === "ru";
    var plans = [
      { name: ru ? "Старт" : "Start", desc: ru ? "Для частной практики" : "For private practice", price: "0", unit: ru ? "₽ / 14 дней" : "₽ / 14 days", feat: false,
        list: ru ? ["50 анализов снимков", "Карточки пациентов", "AI-консультант (база)", "1 врач"] : ["50 image analyses", "Patient charts", "AI assistant (basic)", "1 doctor"], cta: ru ? "Попробовать" : "Try it" },
      { name: ru ? "Клиника" : "Clinic", desc: ru ? "Для растущей клиники" : "For a growing clinic", price: "2 900", unit: ru ? "₽ / врач · мес" : "₽ / doctor · mo", feat: true,
        list: ru ? ["Безлимит анализов", "Планы лечения и сметы", "Сравнение до/после", "3D-модель", "Интеграция с CRM"] : ["Unlimited analyses", "Treatment plans & estimates", "Before/after compare", "3D model", "CRM integration"], cta: ru ? "Выбрать" : "Choose" },
      { name: ru ? "Сеть" : "Network", desc: ru ? "Для сети клиник" : "For clinic networks", price: ru ? "Договорная" : "Custom", unit: "", feat: false,
        list: ru ? ["Всё из «Клиника»", "Единый дашборд сети", "SSO и роли", "Выделенная поддержка", "SLA и приватный контур"] : ["Everything in Clinic", "Network-wide dashboard", "SSO & roles", "Dedicated support", "SLA & private cloud"], cta: ru ? "Связаться" : "Contact us" }
    ];
    box.innerHTML = plans.map(function (p, i) {
      return '<div class="plan reveal reveal-d' + i + (p.feat ? ' feat' : '') + '">' +
        (p.feat ? '<span class="feat-badge">' + (ru ? "Популярный" : "Popular") + '</span>' : '') +
        '<h4>' + p.name + '</h4><div class="p-desc">' + p.desc + '</div>' +
        '<div class="p-price"><span class="pp">' + p.price + '</span><span class="pu">' + p.unit + '</span></div>' +
        '<ul>' + p.list.map(function (li) { return '<li><span class="tick">' + tick + '</span>' + li + '</li>'; }).join("") + '</ul>' +
        '<a class="btn ' + (p.feat ? 'btn-primary' : 'btn-ghost') + '" href="#cta">' + p.cta + '</a></div>';
    }).join("");
  }

  /* ----- faq ----- */
  var FAQ = [
    { q: { ru: "Заменяет ли МВП врача?", en: "Does МВП replace the doctor?" }, a: { ru: "Нет. МВП — ассистент: он подсвечивает находки и считает уверенность, но окончательное решение всегда принимает врач. Заключение формирует специалист.", en: "No. МВП is an assistant: it highlights findings and scores confidence, but the final decision is always the doctor's. The conclusion is made by a specialist." } },
    { q: { ru: "С какими снимками работает система?", en: "What images does it work with?" }, a: { ru: "Прицельные, bitewing, ортопантомограммы (ОПТГ) и срезы КЛКТ. Поддерживаются форматы DICOM, JPG и PNG.", en: "Periapical, bitewing, panoramic (OPG) and CBCT slices. DICOM, JPG and PNG formats are supported." } },
    { q: { ru: "Где хранятся данные пациентов?", en: "Where is patient data stored?" }, a: { ru: "Данные шифруются и хранятся в соответствии с требованиями к медицинским данным. Для сетей доступен приватный контур и размещение на ваших серверах.", en: "Data is encrypted and stored in line with medical data requirements. Networks can use a private cloud or on-premise hosting." } },
    { q: { ru: "Сколько времени занимает внедрение?", en: "How long does onboarding take?" }, a: { ru: "Частная практика начинает работу в день регистрации. Интеграция с CRM клиники обычно занимает от нескольких дней.", en: "A private practice starts on sign-up day. Clinic CRM integration usually takes a few days." } },
    { q: { ru: "Можно ли отменить подписку?", en: "Can I cancel the subscription?" }, a: { ru: "Да, в любой момент. Оплата помесячная за активных врачей, без скрытых условий и привязки оборудования.", en: "Yes, anytime. Billing is monthly per active doctor, with no hidden terms or hardware lock-in." } }
  ];
  function renderFAQ() {
    var box = $("#faq"); if (!box) return;
    box.innerHTML = FAQ.map(function (f, i) {
      return '<div class="faq-item' + (i === 0 ? ' open' : '') + '"><button class="faq-q">' + t(f.q) +
        '<span class="faq-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg></span></button>' +
        '<div class="faq-a"><div class="faq-a-inner">' + t(f.a) + '</div></div></div>';
    }).join("");
    $all(".faq-q", box).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.parentElement, a = $(".faq-a", item), open = item.classList.contains("open");
        $all(".faq-item", box).forEach(function (it) { it.classList.remove("open"); $(".faq-a", it).style.maxHeight = null; });
        if (!open) { item.classList.add("open"); a.style.maxHeight = a.scrollHeight + "px"; }
      });
    });
    var first = $(".faq-item.open .faq-a", box); if (first) first.style.maxHeight = first.scrollHeight + "px";
  }

  /* ============================================================
     4. Before/After slider
     ============================================================ */
  function initBA() {
    var ba = $("#ba"); if (!ba) return;
    var handle = $("#baHandle"), after = $(".ba-after", ba);
    var split = 50, dragging = false;
    function set(pct) { split = Math.max(2, Math.min(98, pct)); ba.style.setProperty("--split", split + "%"); }
    set(50);
    function move(clientX) { var r = ba.getBoundingClientRect(); set(((clientX - r.left) / r.width) * 100); }
    ba.addEventListener("pointerdown", function (e) { dragging = true; ba.setPointerCapture(e.pointerId); move(e.clientX); });
    ba.addEventListener("pointermove", function (e) { if (dragging) move(e.clientX); });
    ba.addEventListener("pointerup", function () { dragging = false; });
    ba.addEventListener("pointercancel", function () { dragging = false; });
  }

  /* ============================================================
     5. Scroll reveal + subnav scrollspy + nav state
     ============================================================ */
  function initReveal() {
    var nodes = $all(".reveal");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) { nodes.forEach(function (n) { n.classList.add("in"); }); return; }
    document.body.classList.add("anim-ready");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    nodes.forEach(function (n) { io.observe(n); });
    // safety net: never leave anything hidden permanently
    setTimeout(function () { $all(".reveal:not(.in)").forEach(function (n) { var r = n.getBoundingClientRect(); if (r.top < window.innerHeight) n.classList.add("in"); }); }, 1400);
  }
  function initNav() {
    var nav = $("#nav");
    function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 16); }
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  }
  function initScrollspy() {
    var links = $all("#subnav a");
    var map = links.map(function (a) { return { a: a, sec: $(a.getAttribute("href")) }; }).filter(function (m) { return m.sec; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          var m = map.filter(function (x) { return x.sec === en.target; })[0];
          if (m) m.a.classList.add("active");
        }
      });
    }, { rootMargin: "-30% 0px -55% 0px" });
    map.forEach(function (m) { spy.observe(m.sec); });
  }

  /* ============================================================
     5b. Interactive: counters, parallax, rescan, conf-bars
     ============================================================ */
  function fmtNum(v, dec) { return v.toFixed(dec).replace(".", ","); }
  function runCount(n) {
    if (n.getAttribute("data-count") == null) return;
    var target = parseFloat(n.getAttribute("data-count")) || 0;
    var dec = parseInt(n.getAttribute("data-decimals") || "0", 10);
    var pre = n.getAttribute("data-prefix") || "", suf = n.getAttribute("data-suffix") || "";
    var dur = 1300, start = null;
    function step(ts) {
      if (start == null) start = ts;
      var p = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - p, 3);
      n.textContent = pre + fmtNum(target * e, dec) + suf;
      if (p < 1) requestAnimationFrame(step); else n.textContent = pre + fmtNum(target, dec) + suf;
    }
    requestAnimationFrame(step);
  }
  function initCounters() {
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); io.unobserve(en.target); } });
    }, { threshold: .5 });
    $all("[data-count]").forEach(function (n) { io.observe(n); });
  }
  function initConfBars() {
    if (!("IntersectionObserver" in window)) { $all(".conf-bar > i").forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; }); return; }
    $all(".conf-bar > i").forEach(function (b) { b.style.width = "0"; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.style.width = en.target.getAttribute("data-w") + "%"; io.unobserve(en.target); } });
    }, { threshold: .4 });
    $all(".conf-bar > i").forEach(function (b) { io.observe(b); });
  }
  function initParallax() {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    var hv = $(".hero-visual"), v = $(".viewer", hv);
    if (hv && v) {
      hv.addEventListener("mousemove", function (e) {
        var r = hv.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        v.style.transform = "perspective(1100px) rotateY(" + (x * 6) + "deg) rotateX(" + (-y * 6) + "deg)";
      });
      hv.addEventListener("mouseleave", function () { v.style.transform = "none"; });
    }
    window.addEventListener("scroll", function () {
      if (hv && window.scrollY < 1000) hv.style.transform = "translateY(" + (window.scrollY * -0.045) + "px)";
    }, { passive: true });
  }
  function rescan() {
    var layer = $("#detLayer2"), film = $("#film2"); if (!layer || !film) return;
    layer.classList.add("scanning"); layer.innerHTML = "";
    var sl = film.querySelector(".scanline");
    if (sl) { sl.style.animation = "none"; void sl.offsetWidth; sl.style.animation = ""; }
    var btn = $("#rescanBtn"); if (btn) btn.disabled = true;
    setTimeout(function () {
      layer.classList.remove("scanning");
      renderDetections(layer, heroDets);
      if (btn) btn.disabled = false;
    }, 1700);
  }
  function initRescan() { var b = $("#rescanBtn"); if (b) b.addEventListener("click", rescan); }

  /* ============================================================
     6. Boot
     ============================================================ */
  function renderDynamic() {
    renderFeatures(); renderFindings(); renderPathList(); renderChat();
    renderPatientMock(); renderPlanMock(); render3D(); renderCRM();
    renderSteps(); renderPricing(); renderFAQ();
    renderDetections($("#detLayer"), heroDets);
    renderDetections($("#detLayer2"), heroDets);
  }

  function setLang(l) {
    lang = l; applyStatic(); renderDynamic();
    initConfBars();
    $all("#langToggle button").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-lang") === l); });
    // re-observe newly created reveal nodes
    $all(".reveal:not(.in)").forEach(function (n) { n.classList.add("in"); });
  }

  document.addEventListener("DOMContentLoaded", function () {
   try {
    captureRU();
    // draw radiographs
    var a1 = $("#archSvg"); if (a1) drawArch(a1, { count: 7, restoreAt: 530 });
    var a2 = $("#archSvg2"); if (a2) drawArch(a2, { count: 7, restoreAt: 530 });
    var bb = $("#baBefore"); if (bb) drawArch(bb, { count: 8 });
    var ba2 = $("#baAfter"); if (ba2) drawArch(ba2, { count: 8, restoreAt: 360 });

    renderDynamic();
    initBA(); initReveal(); initNav(); initScrollspy();
    initCounters(); initConfBars(); initParallax(); initRescan();
   } catch(err){ console.error('boot error', err); }

    $("#langToggle").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-lang]"); if (b) setLang(b.getAttribute("data-lang"));
    });
    var burger = $("#burger");
    if (burger) burger.addEventListener("click", function () { document.querySelector(".subnav").scrollIntoView({ behavior: "smooth" }); });
  });
})();
