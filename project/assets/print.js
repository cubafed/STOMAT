/* ============================================================
   Радикс Print — фирменный бланк для печати/PDF.
   RadixPrint.open({ title, patient, doctor, bodyText, rows, total })
   rows (опц.): [{label, sub, price}] — таблица этапов плана.
   ============================================================ */
(function () {
  "use strict";
  var MARK = '<svg width="34" height="34" viewBox="0 0 24 24" style="background:#0B0B0E;border-radius:9px;padding:5px;box-sizing:border-box"><path d="M12 3c-2.2 0-3 1.4-5 1.4S4 3.6 4 6.5c0 4 1.4 6 2.2 9.2.5 2 .8 4.3 2.3 4.3 1.3 0 1.2-2.4 2-4 .4-.8.8-1.2 1.5-1.2s1.1.4 1.5 1.2c.8 1.6.7 4 2 4 1.5 0 1.8-2.3 2.3-4.3C18.6 12.5 20 10.5 20 6.5 20 3.6 19 4.4 17 4.4S14.2 3 12 3Z" fill="#fff"/><rect x="6.2" y="10.7" width="11.6" height="1.5" rx=".75" fill="#FF5A36"/></svg>';

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function fmtRub(v) { return v.toLocaleString("ru-RU") + " ₽"; }

  function open(o) {
    var d = new Date();
    var date = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    var rowsHtml = "";
    if (o.rows && o.rows.length) {
      rowsHtml = '<table><thead><tr><th>Этап</th><th class="r">Стоимость</th></tr></thead><tbody>' +
        o.rows.map(function (r) {
          return "<tr><td><b>" + esc(r.label) + "</b>" + (r.sub ? '<div class="sub">' + esc(r.sub) + "</div>" : "") + '</td><td class="r">' + fmtRub(r.price) + "</td></tr>";
        }).join("") +
        (o.total != null ? '<tr class="tot"><td>Итого по плану</td><td class="r">' + fmtRub(o.total) + "</td></tr>" : "") +
        "</tbody></table>";
    }
    var html = '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>' + esc(o.title) + " — Радикс</title>" +
      '<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700&family=Golos+Text:wght@400;500;600;700&display=swap" rel="stylesheet">' +
      "<style>" +
      "*{margin:0;padding:0;box-sizing:border-box}" +
      "body{font-family:'Golos Text',system-ui,sans-serif;color:#14110C;padding:48px 54px;font-size:14px;line-height:1.6}" +
      ".head{display:flex;align-items:center;gap:12px;padding-bottom:18px;border-bottom:2.5px solid #14110C}" +
      ".head b{font-family:'Unbounded',sans-serif;font-size:21px}" +
      ".head small{display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#837C6E}" +
      ".head .date{margin-left:auto;text-align:right;color:#4B463C;font-size:13px}" +
      "h1{font-family:'Unbounded',sans-serif;font-size:21px;margin:28px 0 6px;letter-spacing:-.01em}" +
      ".meta{color:#4B463C;font-size:13.5px;margin-bottom:22px}" +
      ".meta b{color:#14110C}" +
      ".body{white-space:pre-wrap;font-size:14px}" +
      "table{width:100%;border-collapse:collapse;margin:8px 0 4px}" +
      "th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#837C6E;text-align:left;padding:8px 2px;border-bottom:1.5px solid #DCD6C8}" +
      "td{padding:11px 2px;border-bottom:1px solid #ECE7DB;vertical-align:top}" +
      "td .sub{font-size:12px;color:#837C6E}" +
      ".r{text-align:right;white-space:nowrap}" +
      "tr.tot td{border-bottom:none;border-top:2px solid #14110C;font-weight:700;font-size:16px;font-family:'Unbounded',sans-serif}" +
      ".sign{display:flex;gap:60px;margin-top:54px}" +
      ".sign div{flex:1}" +
      ".sign .line{border-bottom:1px solid #14110C;height:34px}" +
      ".sign small{color:#837C6E;font-size:11.5px}" +
      ".foot{margin-top:40px;padding-top:14px;border-top:1px solid #DCD6C8;color:#837C6E;font-size:11px;display:flex;justify-content:space-between}" +
      "@media print{body{padding:24px 10px}}" +
      "</style></head><body>" +
      '<div class="head">' + MARK + "<span><b>Радикс</b><small>Стоматология · AI-платформа</small></span>" +
      '<span class="date">' + esc(date) + "<br>Радикс-Vision · AI-ассистированная диагностика</span></div>" +
      "<h1>" + esc(o.title) + "</h1>" +
      '<div class="meta">Пациент: <b>' + esc(o.patient || "—") + "</b> &nbsp;·&nbsp; Врач: <b>" + esc(o.doctor || "—") + "</b></div>" +
      (o.bodyText ? '<div class="body">' + esc(o.bodyText) + "</div>" : "") +
      rowsHtml +
      '<div class="sign"><div><div class="line"></div><small>Подпись врача</small></div><div><div class="line"></div><small>Подпись пациента</small></div></div>' +
      '<div class="foot"><span>Сформировано в платформе Радикс</span><span>Не является медицинским заключением — решение принимает врач</span></div>' +
      "<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script>" +
      "</body></html>";
    var w = window.open("", "_blank");
    if (!w) return false;
    w.document.write(html);
    w.document.close();
    return true;
  }

  window.RadixPrint = { open: open };
})();
