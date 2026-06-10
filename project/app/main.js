/* ============================================================
   Радикс Продукт — App shell, routing, dark theme, mobile, ⌘K
   ============================================================ */
function useDarkTheme() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("mvp-theme") === "dark"; } catch (e) { return false; }
  });
  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    try { localStorage.setItem("mvp-theme", dark ? "dark" : "light"); } catch (e) {}
  }, [dark]);
  return [dark, setDark];
}

/* ---------- ⌘K Command palette ---------- */
function CommandK({ open, onClose, ctx }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiAns, setAiAns] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { if (open) { setQ(""); setSel(0); setAiAns(null); setAiBusy(false); setTimeout(() => inputRef.current && inputRef.current.focus(), 50); } }, [open]);

  // локальный разбор команды без ключа API (демо-режим)
  function localCommand(query) {
    const s = query.toLowerCase();
    const pat = PATIENTS.find(p => s.includes(p.name.split(" ")[0].toLowerCase()) || s.includes(p.name.split(" ")[1].toLowerCase()));
    if (s.includes("кариес")) {
      const list = PATIENTS.filter(p => p.findings.some(f => f.type === "caries" || f.type === "cariesE"));
      return { action: "answer", text: "Пациенты с кариесом (" + list.length + "): " + list.map(p => p.name).join(", ") + "." };
    }
    if (pat && (s.includes("план"))) return { action: "open_plan", patientId: pat.id };
    if (pat && (s.includes("анализ") || s.includes("снимок"))) return { action: "open_analysis", patientId: pat.id };
    if (pat) return { action: "open_patient", patientId: pat.id };
    if (s.includes("воронк") || s.includes("crm") || s.includes("сделк")) return { action: "open_view", view: "crm" };
    if (s.includes("расписан") || s.includes("календар")) return { action: "open_view", view: "calendar" };
    if (s.includes("анализ") || s.includes("снимок")) return { action: "open_view", view: "analysis" };
    if (s.includes("биллинг") || s.includes("оплат")) return { action: "open_view", view: "billing" };
    if (s.includes("настройк")) return { action: "open_view", view: "settings" };
    return { action: "open_view", view: "assistant" };
  }
  function execCmd(cmd) {
    if (cmd.action === "answer" && cmd.text) { setAiAns(cmd.text); return; }
    onClose();
    setTimeout(() => {
      if (cmd.action === "open_patient") ctx.openPatient(cmd.patientId);
      else if (cmd.action === "open_analysis") ctx.openAnalysis(cmd.patientId);
      else if (cmd.action === "open_plan") ctx.openPlan(cmd.patientId);
      else if (cmd.action === "open_view" && cmd.view) ctx.setView(cmd.view);
      else ctx.setView("assistant");
    }, 60);
  }
  function runAI() {
    if (!q.trim() || aiBusy) return;
    setAiBusy(true); setAiAns(null);
    const live = window.RadixAI && RadixAI.hasKey();
    const run = live ? RadixAI.command(q, PATIENTS) : new Promise(res => setTimeout(() => res(localCommand(q)), 600));
    run.then(cmd => { setAiBusy(false); execCmd(cmd); })
      .catch(err => { setAiBusy(false); setAiAns("Не получилось: " + err.message); });
  }

  const nav = [
    { t: "Дашборд", s: "Обзор клиники", ic: "home", act: () => ctx.setView("dashboard") },
    { t: "Пациенты", s: "Карточки и снимки", ic: "users", act: () => ctx.setView("patients") },
    { t: "Воронка CRM", s: "Лиды и сделки", ic: "filter", act: () => ctx.setView("crm") },
    { t: "Расписание", s: "Календарь приёмов", ic: "calendar", act: () => ctx.setView("calendar") },
    { t: "Сообщество", s: "Лента коллег", ic: "users", act: () => ctx.setView("community") },
    { t: "AI-консультант", s: "Чат с ИИ", ic: "chat", act: () => ctx.setView("assistant") },
    { t: "Биллинг", s: "Подписка и оплата", ic: "cash", act: () => ctx.setView("billing") }
  ];
  const ai = [
    { t: "Проанализировать снимок", s: "AI-команда", ic: "sparkle", act: () => ctx.setView("analysis") },
    { t: "Сформировать план лечения", s: "AI-команда", ic: "doc", act: () => ctx.openPlan(ctx.patientId) },
    { t: "Спросить про пациента", s: "AI-команда", ic: "bolt", act: () => ctx.setView("assistant") }
  ];
  const pats = PATIENTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5).map(p => ({
    t: p.name, s: p.age + " лет · " + p.ins, ic: "users", pat: p, act: () => ctx.openPatient(p.id)
  }));

  const ql = q.toLowerCase();
  const navF = nav.filter(n => n.t.toLowerCase().includes(ql));
  const aiF = ai.filter(n => n.t.toLowerCase().includes(ql) || "ии ai команда".includes(ql));
  const groups = [];
  if (pats.length && q) groups.push(["Пациенты", pats]);
  if (navF.length) groups.push(["Разделы", navF]);
  if (aiF.length) groups.push(["AI-команды", aiF]);
  if (q.trim().length > 2) groups.push(["Спросить AI", [{
    t: aiBusy ? "Думаю…" : "AI: «" + q + "»",
    s: (window.RadixAI && RadixAI.hasKey() ? RadixAI.models().chat : "демо") + " · выполнит команду или ответит",
    ic: "bolt", act: runAI, keep: true
  }]]);
  const flat = groups.flatMap(g => g[1]);

  function run(item) {
    if (item.keep) { item.act && item.act(); return; }
    onClose(); setTimeout(() => item.act && item.act(), 60);
  }
  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(flat.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (flat[sel]) run(flat[sel]); }
    else if (e.key === "Escape") onClose();
  }
  let idx = -1;
  return React.createElement("div", { className: "cmdk-scrim" + (open ? " open" : ""), onClick: onClose },
    React.createElement("div", { className: "cmdk", onClick: e => e.stopPropagation() },
      React.createElement("div", { className: "cmdk-input" },
        React.createElement(Icon, { name: "search", size: 20, style: { color: "var(--ink-3)" } }),
        React.createElement("input", { ref: inputRef, placeholder: "Поиск пациентов, разделов, AI-команд…", value: q, onChange: e => { setQ(e.target.value); setSel(0); }, onKeyDown: onKey }),
        React.createElement("span", { className: "ci-k", style: { fontSize: 11 } }, "ESC")),
      aiAns ? React.createElement("div", { style: { margin: "10px 14px 0", padding: "13px 16px", borderRadius: 12, background: "var(--primary-tint)", color: "var(--primary-700)", fontSize: 14, lineHeight: 1.55, display: "flex", gap: 10, alignItems: "flex-start" } },
        React.createElement(Icon, { name: "bolt", size: 16, style: { flexShrink: 0, marginTop: 2 } }),
        React.createElement("span", { style: { flex: 1 } }, aiAns),
        React.createElement("button", { onClick: () => setAiAns(null), style: { color: "inherit", opacity: .6 } }, "✕")) : null,
      React.createElement("div", { className: "cmdk-list" }, flat.length ? groups.map((g, gi) =>
        React.createElement("div", { key: gi },
          React.createElement("div", { className: "cmdk-sec" }, g[0]),
          g[1].map((item, ii) => { idx++; const my = idx; return React.createElement("div", { key: ii, className: "cmdk-item" + (sel === my ? " sel" : ""), onMouseEnter: () => setSel(my), onClick: () => run(item) },
            React.createElement("span", { className: "ci-ic" }, item.pat ? React.createElement(Avatar, { name: item.pat.name, color: item.pat.color, size: 34, radius: "10px", fontSize: 12 }) : React.createElement(Icon, { name: item.ic, size: 17 })),
            React.createElement("div", { style: { flex: 1 } }, React.createElement("div", { className: "ci-t" }, item.t), React.createElement("div", { className: "ci-s" }, item.s)),
            React.createElement("span", { className: "ci-k" }, "↵")); }))) :
        React.createElement("div", { style: { padding: "30px", textAlign: "center", color: "var(--ink-4)" } }, "Ничего не найдено"))));
}

/* ---------- Onboarding coach ---------- */
function Coach({ ctx }) {
  const STEPS = [
    { t: "Добро пожаловать в Радикс", x: "Это рабочее место врача. Слева — разделы клиники, здесь будет ваша работа со снимками и пациентами." },
    { t: "Анализ снимков с ИИ", x: "Откройте «Анализ снимков» — Радикс-Vision размечает патологии за секунды. Вы подтверждаете находки." },
    { t: "Сообщество коллег", x: "Делитесь клиническими случаями в ленте «Сообщество» и обсуждайте их с командой." },
    { t: "Быстрый поиск ⌘K", x: "Нажмите ⌘K (или Ctrl+K) в любой момент, чтобы найти пациента или дать AI-команду." }
  ];
  const [i, setI] = useState(0);
  const [show, setShow] = useState(() => { try { return localStorage.getItem("mvp-coach") !== "done"; } catch (e) { return true; } });
  if (!show) return null;
  function close() { setShow(false); try { localStorage.setItem("mvp-coach", "done"); } catch (e) {} }
  function next() { if (i < STEPS.length - 1) setI(i + 1); else close(); }
  const s = STEPS[i];
  return React.createElement("div", { className: "coach" },
    React.createElement("div", { className: "co-step" }, "ШАГ " + (i + 1) + " / " + STEPS.length),
    React.createElement("div", { className: "co-t" }, s.t),
    React.createElement("div", { className: "co-x" }, s.x),
    React.createElement("div", { className: "co-foot" },
      React.createElement("div", { className: "co-dots" }, STEPS.map((_, k) => React.createElement("i", { key: k, className: k === i ? "on" : "" }))),
      React.createElement("button", { className: "btn-app", style: { background: "rgba(255,255,255,.1)", color: "#fff" }, onClick: close }, "Пропустить"),
      React.createElement("button", { className: "btn-app pri", onClick: next }, i < STEPS.length - 1 ? "Далее" : "Понятно")));
}

const ROLE_INFO = {
  doc: { l: "Врач", sub: "Стоматолог-терапевт", hide: [] },
  admin: { l: "Админ", sub: "Администратор", hide: ["analysis", "assistant", "plan"] },
  assist: { l: "Ассистент", sub: "Ассистент врача", hide: ["crm", "billing", "analytics"] }
};

function App() {
  const USER = RadixStore.get("user", null) || { name: "Алексей Петров" };
  const [view, setView] = useState("dashboard");
  const [role, setRoleState] = useState(() => RadixStore.get("role", "doc"));
  const [, forceTick] = useState(0);
  useEffect(() => { window.__rerender = () => forceTick(x => x + 1); return () => { window.__rerender = null; }; }, []);
  function setRole(r) { setRoleState(r); RadixStore.set("role", r); }
  const hidden = (ROLE_INFO[role] || ROLE_INFO.doc).hide;
  useEffect(() => { if (hidden.indexOf(view) > -1) setView("dashboard"); }, [role]);
  const [patientId, setPatientId] = useState(1);
  const [toast, setToastState] = useState({ msg: "", show: false });
  const [dark, setDark] = useDarkTheme();
  const [drawer, setDrawer] = useState(false);
  const [cmdk, setCmdk] = useState(false);
  const [loading, setLoading] = useState(false);
  const toastTimer = useRef(null);
  const loadTimer = useRef(null);

  // brief skeleton on view change for data-heavy screens
  useEffect(() => {
    if (view === "assistant") return; // chat shouldn't flash
    setLoading(true);
    clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => setLoading(false), 340);
    return () => clearTimeout(loadTimer.current);
  }, [view]);

  function showToast(msg) {
    setToastState({ msg, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastState(s => ({ ...s, show: false })), 2600);
  }

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdk(c => !c); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { document.body.classList.toggle("drawer-open", drawer); }, [drawer]);

  const ctx = {
    view, setView: v => { setView(v); setDrawer(false); }, patientId, setPatientId,
    openPatient: id => { if (id) setPatientId(id); setView("patients"); setDrawer(false); },
    openAnalysis: id => { if (id) setPatientId(id); setView("analysis"); setDrawer(false); },
    openPlan: id => { if (id) setPatientId(id); setView("plan"); setDrawer(false); },
    openAssistant: id => { if (id) setPatientId(id); setView("assistant"); setDrawer(false); },
    toast: showToast, role, setRole
  };

  const notifCount = 3 + RadixStore.get("bookings", []).length;
  const NAV = [
    { sec: "Клиника" },
    { k: "dashboard", ic: "home", l: "Дашборд" },
    { k: "patients", ic: "users", l: "Пациенты", badge: PATIENTS.length },
    { k: "crm", ic: "filter", l: "Воронка CRM" },
    { k: "calendar", ic: "calendar", l: "Расписание" },
    { sec: "Работа" },
    { k: "analysis", ic: "scan", l: "Анализ снимков" },
    { k: "assistant", ic: "chat", l: "AI-консультант" },
    { k: "plan", ic: "doc", l: "Планы лечения" },
    { k: "analytics", ic: "chart", l: "Аналитика" },
    { sec: "Команда" },
    { k: "community", ic: "users", l: "Сообщество" },
    { k: "notifications", ic: "bell", l: "Уведомления", soft: notifCount },
    { k: "billing", ic: "cash", l: "Биллинг" },
    { k: "settings", ic: "settings", l: "Настройки" }
  ];

  const titles = {
    dashboard: ["Дашборд", "Обзор клиники на сегодня"],
    patients: ["Пациенты", "Карточки, снимки и планы лечения"],
    crm: ["Воронка CRM", "Лиды и сделки от заявки до завершения"],
    calendar: ["Расписание", "Календарь приёмов"],
    assistant: ["AI-консультант", "Помощник, который знает контекст пациента"],
    analysis: ["Анализ снимка", "AI-разметка находок на рентгене"],
    plan: ["План лечения", "Сформирован из подтверждённых находок"],
    analytics: ["Аналитика", "Эффективность диагностики"],
    community: ["Сообщество", "Лента клинических случаев"],
    notifications: ["Уведомления", "Центр оповещений"],
    billing: ["Биллинг", "Подписка и оплата"],
    settings: ["Настройки", "Интеграции и параметры"]
  };

  const patient = PATIENTS.find(p => p.id === patientId) || PATIENTS[0];
  let main;
  if (view === "dashboard") main = React.createElement(Dashboard, { ctx });
  else if (view === "patients") main = React.createElement(Patients, { ctx });
  else if (view === "crm") main = React.createElement(CRM, { ctx });
  else if (view === "calendar") main = React.createElement(Calendar, { ctx });
  else if (view === "assistant") main = React.createElement(Assistant, { ctx });
  else if (view === "analysis") main = React.createElement(Analysis, { ctx });
  else if (view === "plan") main = React.createElement(PlanBuilder, { patient, ctx });
  else if (view === "analytics") main = React.createElement(Analytics, { ctx });
  else if (view === "community") main = React.createElement(Community, { ctx });
  else if (view === "notifications") main = React.createElement(Notifications, { ctx });
  else if (view === "billing") main = React.createElement(Billing, { ctx });
  else if (view === "settings") main = React.createElement(Settings, { ctx });

  const isChat = view === "assistant";
  if (loading && !isChat) main = React.createElement(Skeleton, null);
  const [t1, t2] = titles[view] || ["", ""];

  // mobile bottom tabs
  const MTABS = [
    { k: "dashboard", ic: "home", l: "Главная" },
    { k: "patients", ic: "users", l: "Пациенты" },
    { k: "analysis", ic: "scan", l: "Анализ" },
    { k: "community", ic: "chat", l: "Лента" },
    { k: "notifications", ic: "bell", l: "Увед.", soft: notifCount }
  ];

  return React.createElement("div", { className: "app" },
    React.createElement(CommandK, { open: cmdk, onClose: () => setCmdk(false), ctx }),
    React.createElement("div", { className: "drawer-scrim", onClick: () => setDrawer(false) }),
    // Sidebar
    React.createElement("aside", { className: "side" },
      React.createElement("div", { className: "side-brand" },
        React.createElement("div", { className: "brand-mark" },
          React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", dangerouslySetInnerHTML: { __html: '<path d="M12 3c-2.2 0-3 1.4-5 1.4S4 3.6 4 6.5c0 4 1.4 6 2.2 9.2.5 2 .8 4.3 2.3 4.3 1.3 0 1.2-2.4 2-4 .4-.8.8-1.2 1.5-1.2s1.1.4 1.5 1.2c.8 1.6.7 4 2 4 1.5 0 1.8-2.3 2.3-4.3C18.6 12.5 20 10.5 20 6.5 20 3.6 19 4.4 17 4.4S14.2 3 12 3Z" fill="#fff"/><rect x="6.2" y="10.7" width="11.6" height="1.5" rx="0.75" fill="#FF5A36"/>' } })),
        React.createElement("div", null, React.createElement("b", null, "Радикс"), React.createElement("small", null, "Стоматология · AI"))),
      React.createElement("div", { className: "side-search", onClick: () => setCmdk(true) },
        React.createElement(Icon, { name: "search", size: 16 }),
        React.createElement("span", { style: { flex: 1 } }, "Поиск…"),
        React.createElement("kbd", null, "⌘K")),
      React.createElement("nav", { className: "side-nav" }, NAV.filter(n => n.sec || hidden.indexOf(n.k) === -1).map((n, i) =>
        n.sec ? React.createElement("div", { key: i, className: "side-sec" }, n.sec) :
          React.createElement("button", { key: i, className: "nav-item" + (view === n.k ? " active" : ""), onClick: () => ctx.setView(n.k) },
            React.createElement(Icon, { name: n.ic, size: 19 }), React.createElement("span", { style: { flex: 1 } }, n.l),
            n.badge ? React.createElement("span", { className: "badge-n" }, n.badge) : null,
            n.soft ? React.createElement("span", { className: "badge-soft" }, n.soft) : null))),
      React.createElement("div", { className: "side-foot" },
        React.createElement("div", { className: "side-upgrade" },
          React.createElement("div", { className: "su-t" }, "Тариф «Клиника»"),
          React.createElement("div", { className: "su-s" }, "Безлимит анализов · 142 за месяц"),
          React.createElement("button", { className: "btn-app", style: { background: "#fff", color: "var(--ink)", width: "100%", position: "relative" }, onClick: () => ctx.setView("billing") }, "Управлять подпиской")),
        React.createElement("div", { className: "doctor" },
          React.createElement("div", { className: "av" }, initials(USER.name)),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { className: "d-name" }, USER.name),
            React.createElement("div", { className: "d-role" }, (ROLE_INFO[role] || ROLE_INFO.doc).sub)),
          React.createElement("button", { className: "icon-btn", style: { width: 34, height: 34 }, onClick: () => ctx.setView("settings") }, React.createElement(Icon, { name: "settings", size: 16 }))))),
    // Main
    React.createElement("div", { className: "main" },
      // mobile top bar
      React.createElement("header", { className: "mtop" },
        React.createElement("button", { className: "m-burger", onClick: () => setDrawer(true) }, React.createElement(Icon, { name: "users", size: 18, style: { display: "none" } }), React.createElement("svg", { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 }, React.createElement("path", { d: "M3 6h18M3 12h18M3 18h18" }))),
        React.createElement("span", { className: "m-title" }, t1),
        React.createElement("span", { className: "m-sp" }),
        React.createElement("button", { className: "m-burger", onClick: () => setCmdk(true) }, React.createElement(Icon, { name: "search", size: 18 })),
        React.createElement("button", { className: "m-burger", onClick: () => setDark(d => !d) }, React.createElement(Icon, { name: dark ? "sparkle" : "shield", size: 18 }))),
      // desktop topbar
      React.createElement("header", { className: "topbar" },
        React.createElement("div", null,
          React.createElement("div", { className: "tb-title" }, t1),
          React.createElement("div", { className: "tb-sub" }, t2)),
        React.createElement("div", { className: "tb-spacer" }),
        React.createElement("div", { className: "theme-toggle" },
          React.createElement("button", { className: !dark ? "on" : "", onClick: () => setDark(false), title: "Светлая" }, React.createElement(Icon, { name: "shield", size: 15 })),
          React.createElement("button", { className: dark ? "on" : "", onClick: () => setDark(true), title: "Тёмная" }, React.createElement(Icon, { name: "sparkle", size: 15 }))),
        React.createElement("button", { className: "btn-app gho", onClick: () => ctx.setView("assistant") }, React.createElement(Icon, { name: "sparkle", size: 16 }), "Спросить ИИ"),
        React.createElement("button", { className: "icon-btn", onClick: () => ctx.setView("notifications") }, React.createElement(Icon, { name: "bell", size: 18 }), React.createElement("span", { className: "dot" })),
        React.createElement("a", { className: "icon-btn", href: "Лендинг МВП.html", title: "На сайт" }, React.createElement(Icon, { name: "home", size: 18 }))),
      React.createElement("div", { key: view + (loading ? "-l" : ""), className: isChat ? "" : "content", style: isChat ? { flex: 1, minHeight: 0 } : null }, main)),
    // mobile bottom tab bar
    React.createElement("nav", { className: "mtab" }, MTABS.map(t =>
      React.createElement("button", { key: t.k, className: "mtab-btn" + (view === t.k ? " on" : ""), onClick: () => ctx.setView(t.k) },
        t.soft ? React.createElement("span", { className: "mt-badge" }, t.soft) : null,
        React.createElement(Icon, { name: t.ic, size: 22 }), t.l))),
    React.createElement(Coach, { ctx }),
    React.createElement(Toast, { msg: toast.msg, show: toast.show }));
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
