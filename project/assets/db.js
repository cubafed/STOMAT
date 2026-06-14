/* ============================================================
   Радикс DB — облачный слой (Supabase) поверх RadixStore.
   · Авторизация (email+пароль), профиль → clinic_id.
   · KV-синхронизация: rdx_* ключи зеркалятся в таблицу kv.
   · Если Supabase не настроен / недоступен — всё работает локально
     (localStorage), приложение не ломается.
   Не синхронизируем тяжёлые/секретные ключи: rdx_img_*, radix_ai_*.
   ============================================================ */
(function () {
  "use strict";
  var cfg = window.RADIX_CFG || {};
  var SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
  var client = null, clinicId = null, ready = false;
  var listeners = [];
  function on(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(function (f) { try { f(state()); } catch (e) {} }); }

  function configured() { return !!(cfg.supabaseUrl && cfg.supabaseAnonKey); }
  function noSync(k) { return k.indexOf("rdx_img_") === 0 || k.indexOf("radix_ai_") === 0; }

  function loadSDK() {
    return new Promise(function (res, rej) {
      if (window.supabase && window.supabase.createClient) return res();
      var s = document.createElement("script");
      s.src = SDK; s.onload = res; s.onerror = function () { rej(new Error("supabase-js CDN недоступен")); };
      document.head.appendChild(s);
    });
  }

  function state() {
    return { enabled: configured() && !!client, ready: ready, clinicId: clinicId, user: client && client.auth ? curUser : null };
  }
  var curUser = null;

  /* ---- инициализация: поднять клиент, восстановить сессию ---- */
  function init() {
    if (!configured()) { ready = true; return Promise.resolve(state()); }
    return loadSDK().then(function () {
      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      return client.auth.getSession();
    }).then(function (r) {
      var session = r && r.data ? r.data.session : null;
      return session ? afterLogin(session.user) : null;
    }).catch(function (e) {
      console.warn("Radix DB: офлайн-режим —", e.message); client = null;
    }).then(function () { ready = true; emit(); return state(); });
  }

  function afterLogin(user) {
    curUser = user;
    return client.from("profiles").select("clinic_id,name,role").eq("id", user.id).single()
      .then(function (r) {
        if (r.data) { clinicId = r.data.clinic_id; }
        return hydrate();
      });
  }

  /* ---- загрузить kv клиники в localStorage (облако = источник правды) ---- */
  function hydrate() {
    if (!client || !clinicId) return Promise.resolve();
    return client.from("kv").select("key,value").eq("clinic_id", clinicId).then(function (r) {
      if (r.error || !r.data) return;
      r.data.forEach(function (row) {
        try { localStorage.setItem(row.key, JSON.stringify(row.value)); } catch (e) {}
      });
    });
  }

  /* ---- зеркалирование одного ключа (вызывается из RadixStore.set) ---- */
  function mirror(key, value) {
    if (!client || !clinicId || !key || noSync(key)) return;
    var payload = { clinic_id: clinicId, key: key, value: value === undefined ? null : value, updated_at: new Date().toISOString() };
    client.from("kv").upsert(payload, { onConflict: "clinic_id,key" }).then(function (r) {
      if (r && r.error) console.warn("kv sync:", r.error.message);
    });
  }

  /* ---- авторизация ---- */
  function signUp(email, password, meta) {
    if (!client) return Promise.reject(new Error("Бэкенд не настроен"));
    return client.auth.signUp({ email: email, password: password, options: { data: meta || {} } })
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function signIn(email, password) {
    if (!client) return Promise.reject(new Error("Бэкенд не настроен"));
    return client.auth.signInWithPassword({ email: email, password: password })
      .then(function (r) { if (r.error) throw r.error; return afterLogin(r.data.user).then(function () { return r.data; }); });
  }
  function signOut() {
    if (!client) return Promise.resolve();
    return client.auth.signOut().then(function () { curUser = null; clinicId = null; emit(); });
  }

  /* ---- публичная онлайн-заявка (без авторизации) ---- */
  function submitBooking(clinic, data) {
    if (!client) return Promise.reject(new Error("Бэкенд не настроен"));
    return client.from("public_bookings").insert({ clinic_id: clinic || null, data: data })
      .then(function (r) { if (r.error) throw r.error; return true; });
  }

  window.RadixDB = {
    configured: configured, init: init, state: state, on: on, mirror: mirror,
    signUp: signUp, signIn: signIn, signOut: signOut, submitBooking: submitBooking,
    hydrate: hydrate
  };
})();
