/* ============================================================
   Радикс Report — комплексные отчёты для пациента и врача.
   RadixReport.open({ kind: "patient"|"doctor", patient, findings,
     img, texts, planItems, upsells, marketing, doctor, mode })
   Автономный HTML в новом окне: показ на планшете + печать в PDF.
   Вся графика — SVG-строки, без зависимостей.
   ============================================================ */
(function () {
  "use strict";

  var TOOTH_PATH = "M12 4c-1.6 0-2.2 1-3.6 1S6 4 4.8 5C4 6 4 7.6 4.6 10c.4 1.7.7 3.4 1.1 5.2.3 1.4.6 3.3 1.8 3.3 1 0 1-1.8 1.3-3 .2-.9.5-1.5 1.2-1.5s1 .6 1.2 1.5c.3 1.2.3 3 1.3 3 1.2 0 1.5-1.9 1.8-3.3.4-1.8.7-3.5 1.1-5.2C19 7.6 19 6 18.2 5 17 4 16 5 14.6 5S13.6 4 12 4Z";
  var MARK = '<svg width="30" height="30" viewBox="0 0 24 24" style="background:#0B0B0E;border-radius:8px;padding:4px;box-sizing:border-box;flex:0 0 auto"><path d="M12 3c-2.2 0-3 1.4-5 1.4S4 3.6 4 6.5c0 4 1.4 6 2.2 9.2.5 2 .8 4.3 2.3 4.3 1.3 0 1.2-2.4 2-4 .4-.8.8-1.2 1.5-1.2s1.1.4 1.5 1.2c.8 1.6.7 4 2 4 1.5 0 1.8-2.3 2.3-4.3C18.6 12.5 20 10.5 20 6.5 20 3.6 19 4.4 17 4.4S14.2 3 12 3Z" fill="#fff"/><rect x="6.2" y="10.7" width="11.6" height="1.5" rx=".75" fill="#FF5A36"/></svg>';

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function rub(v) { return Math.round(v).toLocaleString("ru-RU") + " ₽"; }
  function plural(n, a, b, c) { var m = n % 100; if (m > 10 && m < 20) return c; m = n % 10; return m === 1 ? a : (m > 1 && m < 5 ? b : c); }
  function ruDate(d) { return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }); }

  /* ---------- индекс здоровья ---------- */
  var PENALTY = { caries: 12, periap: 18, cariesE: 8, tartar: 6, resto: 0 };
  function healthScore(findings) {
    var s = 100;
    findings.forEach(function (f) { s -= PENALTY[f.type] || 8; });
    s = Math.max(25, Math.round(s));
    var zone = s >= 85 ? { t: "Отличное состояние", c: "#18A06E" }
      : s >= 70 ? { t: "Хорошее, есть нюансы", c: "#8BBF2E" }
      : s >= 50 ? { t: "Требует внимания", c: "#E8941F" }
      : { t: "Нужно лечение", c: "#ED4422" };
    return { score: s, zone: zone };
  }
  function gaugeSVG(score, zoneColor) {
    // полукруг 180° из цветовых сегментов + стрелка
    function arc(a0, a1, color) {
      var r = 80, cx = 100, cy = 100;
      var x0 = cx - r * Math.cos(a0 * Math.PI / 180), y0 = cy - r * Math.sin(a0 * Math.PI / 180);
      var x1 = cx - r * Math.cos(a1 * Math.PI / 180), y1 = cy - r * Math.sin(a1 * Math.PI / 180);
      return '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A80 80 0 0 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" stroke="' + color + '" stroke-width="17" fill="none" stroke-linecap="round"/>';
    }
    var ang = score / 100 * 180;
    var nx = 100 - 62 * Math.cos(ang * Math.PI / 180), ny = 100 - 62 * Math.sin(ang * Math.PI / 180);
    return '<svg id="health-gauge" viewBox="0 0 200 118" style="width:210px">' +
      arc(2, 58, "#ED4422") + arc(64, 116, "#E8941F") + arc(122, 178, "#18A06E") +
      '<line x1="100" y1="100" x2="' + nx.toFixed(1) + '" y2="' + ny.toFixed(1) + '" stroke="#14110C" stroke-width="3.5" stroke-linecap="round"/>' +
      '<circle cx="100" cy="100" r="7" fill="#14110C"/>' +
      '<text x="100" y="84" text-anchor="middle" font-size="30" font-weight="800" font-family="Unbounded,sans-serif" fill="' + zoneColor + '">' + score + '</text>' +
      '</svg>';
  }

  /* ---------- зубная формула ---------- */
  var FDI_UP = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  var FDI_LO = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  function toothColors(findings) {
    var map = {};
    findings.forEach(function (f) {
      var c = (f.info && f.info.c) || "#FF5A36";
      var nums = String(f.tooth).match(/\d{2}/g);
      if (nums) nums.forEach(function (n) { map[n] = c; });
      else if (/нижн/i.test(String(f.tooth))) [42, 41, 31, 32].forEach(function (n) { map[n] = c; });
      else if (/верхн/i.test(String(f.tooth))) [12, 11, 21, 22].forEach(function (n) { map[n] = c; });
    });
    return map;
  }
  function formulaSVG(findings) {
    var map = toothColors(findings), w = 21, html = "";
    function row(list, y) {
      return list.map(function (n, i) {
        var c = map[n] || "#E4DECF";
        var hl = !!map[n];
        return '<g transform="translate(' + (i * w + 4) + ',' + y + ') scale(.78)">' +
          '<path d="' + TOOTH_PATH + '" fill="' + c + '"' + (hl ? ' stroke="' + c + '" stroke-width="1.4"' : '') + '/>' +
          '<text x="12" y="30" text-anchor="middle" font-size="6.5" fill="' + (hl ? c : "#A8A192") + '" font-weight="' + (hl ? 700 : 400) + '">' + n + '</text></g>';
      }).join("");
    }
    html = '<svg viewBox="0 0 ' + (16 * w + 8) + ' 68" style="width:100%;max-width:560px">' + row(FDI_UP, 2) + row(FDI_LO, 36) + '</svg>';
    return html;
  }

  /* ---------- снимок с разметкой (или SVG-схема дуги) ---------- */
  function archSchemaSVG(findings) {
    // упрощённая рентген-схема: фон + два ряда «зубов»
    var teeth = "";
    for (var i = 0; i < 8; i++) {
      var x = 20 + i * 80;
      teeth += '<rect x="' + x + '" y="60" width="52" height="88" rx="14" fill="url(#en)"/>' +
        '<rect x="' + x + '" y="172" width="52" height="88" rx="14" fill="url(#en)"/>';
    }
    return '<svg viewBox="0 0 680 320" style="position:absolute;inset:0;width:100%;height:100%">' +
      '<defs><linearGradient id="bn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3350"/><stop offset="1" stop-color="#141a30"/></linearGradient>' +
      '<linearGradient id="en" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe5ef"/><stop offset="1" stop-color="#9aa3b6"/></linearGradient></defs>' +
      '<rect width="680" height="320" fill="url(#bn)"/>' + teeth +
      '<rect y="155" width="680" height="10" fill="rgba(8,11,22,.7)"/></svg>';
  }
  function xrayHTML(img, findings) {
    var boxes = findings.map(function (f) {
      if (!f.box) return "";
      var c = (f.info && f.info.c) || "#FF5A36";
      var label = ((f.info && f.info.label) || f.type).split(" ")[0];
      return '<div style="position:absolute;left:' + f.box.x + '%;top:' + f.box.y + '%;width:' + f.box.w + '%;height:' + f.box.h + '%;border:2px solid ' + c + ';border-radius:7px;box-shadow:0 0 14px -2px ' + c + '">' +
        '<span style="position:absolute;top:-19px;left:-2px;background:' + c + ';color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:5px;white-space:nowrap">' + esc(label) + ' · зуб ' + esc(f.tooth) + '</span></div>';
    }).join("");
    return '<div style="position:relative;border-radius:16px;overflow:hidden;aspect-ratio:680/320;background:#0c1122">' +
      (img ? '<img src="' + img + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">' : archSchemaSVG(findings)) +
      boxes + '</div>';
  }

  /* ---------- таймлайн лечения ---------- */
  function buildVisits(planItems) {
    var order = { "Высокий": 0, "Средний": 1, "Норма": 2 };
    var sorted = planItems.slice().sort(function (a, b) { return (order[a.sev] != null ? order[a.sev] : 1) - (order[b.sev] != null ? order[b.sev] : 1); });
    var visits = [];
    sorted.forEach(function (it) {
      var last = visits[visits.length - 1];
      if (last && last.items.length < 2 && last.sev === it.sev) last.items.push(it);
      else visits.push({ items: [it], sev: it.sev });
    });
    var today = new Date();
    visits.forEach(function (v, i) {
      var d = new Date(today.getTime() + (i + 1) * 7 * 86400000);
      v.date = ruDate(d);
      v.sum = v.items.reduce(function (s, it) { return s + it.price; }, 0);
    });
    return visits;
  }
  function timelineHTML(visits) {
    if (!visits.length) return "";
    var steps = visits.map(function (v, i) {
      return '<div style="flex:1;min-width:120px;position:relative;padding-top:34px">' +
        '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:' + (i === 0 ? "#FF5A36" : "#E4DECF") + ';border-radius:2px"></div>' +
        '<div style="position:absolute;top:-9px;left:0;width:22px;height:22px;border-radius:50%;background:' + (i === 0 ? "#FF5A36" : "#fff") + ';color:' + (i === 0 ? "#fff" : "#FF5A36") + ';border:2.5px solid #FF5A36;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">' + (i + 1) + '</div>' +
        '<div style="font-size:11px;font-weight:700;color:#FF5A36;text-transform:uppercase;letter-spacing:.06em">Визит ' + (i + 1) + ' · ~' + esc(v.date) + '</div>' +
        v.items.map(function (it) { return '<div style="font-size:12.5px;font-weight:600;margin-top:4px">' + esc(it.label) + ' <span style="color:#837C6E">· зуб ' + esc(it.tooth) + '</span></div>'; }).join("") +
        '<div style="font-size:13px;font-weight:800;font-family:Unbounded,sans-serif;margin-top:5px">' + rub(v.sum) + '</div></div>';
    }).join('<div style="width:14px;flex:0 0 auto"></div>');
    return '<div id="timeline" style="display:flex;gap:0;margin-top:6px">' + steps + '</div>';
  }

  /* ---------- цена откладывания ---------- */
  function delayChartSVG(total) {
    if (!total) return "";
    var bars = [
      { l: "Сейчас", v: total, c: "#18A06E" },
      { l: "Через 6 мес", v: Math.round(total * 2.2), c: "#E8941F" },
      { l: "Через год", v: Math.round(total * 3), c: "#ED4422" }
    ];
    var max = bars[2].v, W = 560, bw = 120;
    var els = bars.map(function (b, i) {
      var h = Math.max(26, b.v / max * 130), x = 40 + i * (bw + 60), y = 168 - h;
      return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="10" fill="' + b.c + '"/>' +
        '<text x="' + (x + bw / 2) + '" y="' + (y - 10) + '" text-anchor="middle" font-size="15" font-weight="800" font-family="Unbounded,sans-serif" fill="' + b.c + '">' + b.v.toLocaleString("ru-RU") + ' ₽</text>' +
        '<text x="' + (x + bw / 2) + '" y="188" text-anchor="middle" font-size="12" fill="#4B463C" font-weight="600">' + b.l + '</text>';
    }).join("");
    return '<svg viewBox="0 0 ' + W + ' 200" style="width:100%;max-width:560px">' + els + '</svg>';
  }

  /* ---------- демо-тексты (фолбэк без AI) ---------- */
  var SIMPLE = {
    caries: "начался кариес — разрушение твёрдых тканей. Сейчас это лечится небольшой пломбой за один визит",
    cariesE: "самое начало кариеса на эмали. Поймали вовремя — лечение будет минимальным и бережным",
    tartar: "зубной камень — затвердевший налёт, который раздражает десну. Снимается за один сеанс гигиены",
    periap: "воспаление у корня. Это важно вылечить в первую очередь, чтобы сохранить зуб",
    resto: "стоит пломба — она в хорошем состоянии, просто наблюдаем"
  };
  function defaultTexts(patient, findings, upsells) {
    var first = patient.name.split(" ")[0];
    return {
      greeting: first + ", мы внимательно изучили ваш снимок вместе с ИИ-системой Радикс-Vision. Ниже — всё, что мы увидели, и понятный план, как привести улыбку в идеальное состояние.",
      findings: findings.map(function (f) {
        return { tooth: f.tooth, text: "На зубе " + f.tooth + " " + (SIMPLE[f.type] || "есть изменение, которое стоит обсудить с врачом") + "." };
      }),
      whyNow: "Кариес не останавливается сам: маленькая полость за полгода может дойти до нерва, и вместо простой пломбы понадобится лечение каналов и коронка — это в 2–3 раза дороже и дольше. Сейчас всё решается быстро, бережно и за разумные деньги.",
      upsell: upsells.reduce(function (acc, u) { acc[u.id] = u.desc; return acc; }, {})
    };
  }

  /* ---------- общий каркас страницы ---------- */
  function shell(title, bodyHtml, bookingUrl) {
    return '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(title) + ' — Радикс</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700;800&family=Golos+Text:wght@400;500;600;700&display=swap" rel="stylesheet">' +
      '<style>' +
      '*{margin:0;padding:0;box-sizing:border-box}' +
      'body{font-family:"Golos Text",system-ui,sans-serif;color:#14110C;background:#F4F1EA;font-size:14.5px;line-height:1.6}' +
      '.page{max-width:820px;margin:0 auto;padding:86px 28px 50px}' +
      '.abar{position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(20,17,12,.92);backdrop-filter:blur(8px);display:flex;align-items:center;gap:12px;padding:11px 20px;color:#fff}' +
      '.abar b{font-family:Unbounded,sans-serif;font-size:15px}' +
      '.abar .sp{flex:1}' +
      '.abtn{border:none;border-radius:999px;padding:10px 20px;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:7px}' +
      '.abtn.pri{background:#FF5A36;color:#fff}.abtn.gho{background:rgba(255,255,255,.12);color:#fff}' +
      '.card{background:#fff;border:1px solid #DCD6C8;border-radius:20px;padding:24px 26px;margin-bottom:18px;page-break-inside:avoid}' +
      'h1{font-family:Unbounded,sans-serif;font-size:clamp(22px,4vw,32px);line-height:1.1;letter-spacing:-.02em}' +
      'h2{font-family:Unbounded,sans-serif;font-size:17px;margin-bottom:14px;display:flex;align-items:center;gap:9px}' +
      'h2 .n{width:26px;height:26px;border-radius:8px;background:#FFE6DD;color:#ED4422;display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex:0 0 auto}' +
      'table{width:100%;border-collapse:collapse}' +
      'td,th{padding:9px 4px;border-bottom:1px solid #ECE7DB;text-align:left;font-size:13.5px}' +
      'th{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#837C6E}' +
      '.r{text-align:right;white-space:nowrap}' +
      '.tot td{border-bottom:none;border-top:2px solid #14110C;font-weight:800;font-family:Unbounded,sans-serif;font-size:15px}' +
      '.muted{color:#837C6E;font-size:12.5px}' +
      '@media print{.abar{display:none}body{background:#fff}.page{padding-top:20px}.card{border-color:#DCD6C8;box-shadow:none}}' +
      '</style></head><body>' +
      '<div class="abar">' + MARK + '<b>Радикс</b><span style="font-size:12px;opacity:.65">персональный отчёт</span><span class="sp"></span>' +
      (bookingUrl ? '<a class="abtn gho" href="' + esc(bookingUrl) + '" target="_blank">Записаться онлайн</a>' : '') +
      '<button class="abtn pri" onclick="window.print()">Скачать PDF</button></div>' +
      '<div class="page">' + bodyHtml + '</div></body></html>';
  }

  /* ---------- отчёт пациента ---------- */
  function buildPatient(d) {
    var findings = d.findings || [];
    var texts = d.texts || defaultTexts(d.patient, findings, d.upsells || []);
    var hs = healthScore(findings);
    var planItems = d.planItems || [];
    var total = planItems.reduce(function (s, it) { return s + it.price; }, 0);
    var visits = buildVisits(planItems);
    var mk = d.marketing || {};
    var mech = mk.mech || {};
    var deadline = new Date(Date.now() + (mk.days || 14) * 86400000);
    var discounted = Math.round(total * (1 - (mk.discount || 0) / 100));

    var h = '';
    // обложка
    h += '<div class="card" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;background:linear-gradient(135deg,#fff, #FFF4EF)">' +
      '<div style="flex:1;min-width:230px">' +
      '<div style="font-size:11.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#ED4422">Персональный отчёт о здоровье улыбки</div>' +
      '<h1 style="margin:8px 0 10px">' + esc(d.patient.name) + '</h1>' +
      '<div class="muted">Снимок проанализирован ' + ruDate(new Date()) + ' · врач: ' + esc(d.doctor || "—") + ' · ИИ Радикс-Vision</div>' +
      '<p style="margin-top:12px;font-size:14.5px">' + esc(texts.greeting) + '</p></div>' +
      '<div style="text-align:center">' + gaugeSVG(hs.score, hs.zone.c) +
      '<div style="font-weight:800;color:' + hs.zone.c + ';font-size:14px;margin-top:-6px">' + hs.zone.t + '</div>' +
      '<div class="muted">индекс здоровья полости рта</div></div></div>';

    // что мы увидели
    h += '<div class="card"><h2><span class="n">1</span>Что мы увидели на снимке</h2>' +
      xrayHTML(d.img, findings) +
      '<div style="margin:18px 0 6px;text-align:center">' + formulaSVG(findings) + '</div>' +
      (texts.findings || []).map(function (t) {
        return '<div style="display:flex;gap:10px;margin-top:10px;align-items:flex-start"><span style="width:8px;height:8px;border-radius:50%;background:#FF5A36;margin-top:7px;flex:0 0 auto"></span><span>' + esc(t.text) + '</span></div>';
      }).join("") + '</div>';

    // план по шагам
    if (planItems.length) {
      h += '<div class="card"><h2><span class="n">2</span>Ваш план лечения по шагам</h2>' +
        timelineHTML(visits) +
        '<table style="margin-top:20px"><tr><th>Что делаем</th><th class="r">Стоимость</th></tr>' +
        planItems.map(function (it) { return '<tr><td><b>' + esc(it.label) + '</b> <span class="muted">· зуб ' + esc(it.tooth) + '</span></td><td class="r">' + rub(it.price) + '</td></tr>'; }).join("") +
        '<tr class="tot"><td>Весь план под ключ</td><td class="r">' + rub(total) + '</td></tr></table>' +
        '<div class="muted" style="margin-top:8px">' + visits.length + ' ' + plural(visits.length, "визит", "визита", "визитов") + ' · можно разбить оплату по визитам</div></div>';
    }

    // почему сейчас
    if (mech.delay !== false && total) {
      h += '<div class="card"><h2><span class="n">3</span>Почему не стоит откладывать</h2>' +
        '<p style="margin-bottom:14px">' + esc(texts.whyNow) + '</p>' +
        '<div style="text-align:center">' + delayChartSVG(total) + '</div>' +
        '<div class="muted" style="text-align:center;margin-top:4px">Оценка средней стоимости при развитии текущих находок</div></div>';
    }

    // рекомендовано именно вам
    if ((d.upsells || []).length) {
      h += '<div class="card" id="upsells"><h2><span class="n">' + (total ? "4" : "2") + '</span>Рекомендовано именно вам</h2>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">' +
        d.upsells.map(function (u) {
          return '<div style="border:1.5px solid #ECE7DB;border-radius:15px;padding:15px">' +
            '<div style="font-weight:800;font-size:14px;font-family:Unbounded,sans-serif;letter-spacing:-.01em">' + esc(u.label) + '</div>' +
            '<div style="font-size:12.5px;color:#4B463C;margin:7px 0 9px">' + esc((texts.upsell && texts.upsell[u.id]) || u.desc) + '</div>' +
            '<div style="font-weight:800;color:#ED4422">' + (u.price ? rub(u.price) : "Бесплатная консультация") + '</div></div>';
        }).join("") + '</div></div>';
    }

    // маркетинг-блок
    if ((mech.deadline !== false && mk.discount) || (mech.bonus !== false && mk.bonusText)) {
      h += '<div class="card" id="promo" style="background:#14110C;color:#F4F1EA;border-color:#14110C">' +
        (mech.deadline !== false && mk.discount ?
          '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
          '<div style="font-family:Unbounded,sans-serif;font-size:40px;font-weight:800;color:#FF5A36">−' + mk.discount + '%</div>' +
          '<div style="flex:1;min-width:200px"><div style="font-weight:700;font-size:15.5px">на весь план при записи до ' + ruDate(deadline) + '</div>' +
          (total ? '<div style="font-size:13px;opacity:.75;margin-top:3px">' + rub(total) + ' → <b style="color:#FF5A36">' + rub(discounted) + '</b> — экономия ' + rub(total - discounted) + '</div>' : '') +
          '</div></div>' : '') +
        (mech.bonus !== false && mk.bonusText ?
          '<div style="margin-top:' + (mech.deadline !== false && mk.discount ? '14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.14)' : '0') + ';display:flex;gap:10px;align-items:center">' +
          '<span style="font-size:20px">🎁</span><span style="font-size:14px;font-weight:600">' + esc(mk.bonusText) + '</span></div>' : '') +
        '</div>';
    }

    // CTA
    var qr = d.bookingUrl ? '<img src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=' + encodeURIComponent(d.bookingUrl) + '" width="110" height="110" style="border-radius:10px;background:#fff;padding:6px" onerror="this.style.display=\'none\'">' : '';
    h += '<div class="card" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">' + qr +
      '<div style="flex:1;min-width:220px"><div style="font-family:Unbounded,sans-serif;font-weight:800;font-size:18px">Запишитесь, пока всё лечится просто</div>' +
      '<div style="margin-top:6px;font-size:14px">' + (qr ? 'Наведите камеру на QR-код или позвоните: ' : 'Позвоните нам: ') + '<b>' + esc(mk.phone || "") + '</b></div>' +
      (mk.address ? '<div class="muted" style="margin-top:3px">' + esc(mk.address) + '</div>' : '') + '</div></div>';

    h += '<div class="muted" style="text-align:center;padding-top:6px">Отчёт сформирован платформой Радикс' + (d.mode ? ' · ' + esc(d.mode) : '') + ' · не является медицинским заключением — окончательные решения принимает врач</div>';
    return shell("Отчёт для " + d.patient.name, h, d.bookingUrl);
  }

  /* ---------- отчёт врача ---------- */
  function buildDoctor(d) {
    var findings = d.findings || [];
    var planItems = d.planItems || [];
    var total = planItems.reduce(function (s, it) { return s + it.price; }, 0);
    var h = '';
    h += '<div class="card"><div style="display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap">' +
      '<div><div style="font-size:11.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#ED4422">Клинический отчёт · Радикс-Vision</div>' +
      '<h1 style="margin:8px 0 6px;font-size:24px">' + esc(d.patient.name) + '</h1>' +
      '<div class="muted">' + ruDate(new Date()) + ' · врач: ' + esc(d.doctor || "—") + (d.img ? ' · загруженный снимок · vision-анализ' : ' · bitewing · архивный снимок') + '</div></div>' +
      '<div style="text-align:right" class="muted">Находок: <b style="color:#14110C;font-size:18px;font-family:Unbounded,sans-serif">' + findings.length + '</b></div></div></div>';
    h += '<div class="card"><h2><span class="n">1</span>Снимок с разметкой</h2>' + xrayHTML(d.img, findings) + '</div>';
    h += '<div class="card"><h2><span class="n">2</span>Находки</h2><table><tr><th>Зуб</th><th>Находка</th><th>Локализация</th><th class="r">Уверенность ИИ</th></tr>' +
      findings.map(function (f) {
        var info = f.info || {};
        return '<tr><td><b>' + esc(f.tooth) + '</b></td><td><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + (info.c || "#FF5A36") + ';margin-right:7px"></span>' + esc(info.label || f.type) + '</td><td class="muted">' + esc(f.loc || "—") + '</td><td class="r"><b>' + f.pc + '%</b></td></tr>';
      }).join("") + '</table></div>';
    if (d.clinicalText) h += '<div class="card"><h2><span class="n">3</span>Заключение</h2><div style="white-space:pre-wrap;font-size:13.5px;line-height:1.65">' + esc(d.clinicalText) + '</div></div>';
    if (planItems.length) {
      h += '<div class="card"><h2><span class="n">' + (d.clinicalText ? 4 : 3) + '</span>План лечения</h2><table><tr><th>Этап</th><th class="r">Стоимость</th></tr>' +
        planItems.map(function (it) { return '<tr><td><b>' + esc(it.label) + '</b> <span class="muted">· зуб ' + esc(it.tooth) + ' · приоритет ' + esc(it.sev) + '</span></td><td class="r">' + rub(it.price) + '</td></tr>'; }).join("") +
        '<tr class="tot"><td>Итого</td><td class="r">' + rub(total) + '</td></tr></table></div>';
    }
    h += '<div style="display:flex;gap:60px;margin:30px 0 14px"><div style="flex:1"><div style="border-bottom:1px solid #14110C;height:32px"></div><div class="muted">Подпись врача</div></div><div style="flex:1"><div style="border-bottom:1px solid #14110C;height:32px"></div><div class="muted">Подпись пациента</div></div></div>';
    h += '<div class="muted" style="text-align:center">Сформировано платформой Радикс' + (d.mode ? ' · ' + esc(d.mode) : '') + ' · решение о лечении принимает врач</div>';
    return shell("Клинический отчёт — " + d.patient.name, h, null);
  }

  function build(d) { return d.kind === "doctor" ? buildDoctor(d) : buildPatient(d); }
  function open(d) {
    try {
      if (!d.bookingUrl && d.kind !== "doctor") {
        try { d.bookingUrl = new URL("Запись.html", window.location.href).href; } catch (e) {}
      }
      var w = window.open("", "_blank");
      if (!w) return false;
      w.document.write(build(d));
      w.document.close();
      return true;
    } catch (e) { return false; }
  }

  window.RadixReport = { build: build, open: open, healthScore: healthScore };
})();
