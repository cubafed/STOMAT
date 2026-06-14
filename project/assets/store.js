/* ============================================================
   Радикс Store — лёгкая персистентность поверх localStorage.
   Все ключи с префиксом rdx_. Падения квоты глотаются молча
   (большие dataURL-снимки могут не поместиться — это ок).
   ============================================================ */
(function () {
  "use strict";
  function get(k, d) {
    try { var v = localStorage.getItem("rdx_" + k); return v == null ? d : JSON.parse(v); }
    catch (e) { return d; }
  }
  function set(k, v) {
    try {
      if (v == null) localStorage.removeItem("rdx_" + k);
      else localStorage.setItem("rdx_" + k, JSON.stringify(v));
    } catch (e) { /* квота — игнор */ }
    // зеркалим в облако, если бэкенд подключён
    try { if (window.RadixDB && RadixDB.mirror) RadixDB.mirror("rdx_" + k, v == null ? null : v); } catch (e) {}
    return true;
  }
  window.RadixStore = { get: get, set: set };
})();
