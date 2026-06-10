/* ============================================================
   Радикс Продукт — views2: Assistant, PlanBuilder, Analytics, Settings
   ============================================================ */

/* ---------------- PLAN BUILDER ---------------- */
function PlanBuilder({ patient, ctx, embedded }) {
  const items = patient.findings.filter(f => findingInfo(f).price > 0).map(f => findingInfo(f));
  const [on, setOn] = useState(() => items.map(() => true));
  const total = items.reduce((s, it, i) => s + (on[i] ? it.price : 0), 0);
  const fmt = n => n.toLocaleString("ru-RU") + " ₽";
  function toggle(i) { setOn(o => o.map((v, k) => k === i ? !v : v)); }
  const body = React.createElement("div", null,
    React.createElement("div", { style: { borderRadius: embedded ? 14 : "var(--r-lg)", border: "1px solid var(--line)", overflow: "hidden", background: "#fff" } },
      React.createElement("div", { style: { padding: "13px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 } },
        React.createElement("span", { style: { color: "var(--primary)" } }, React.createElement(Icon, { name: "doc", size: 18 })),
        React.createElement("b", { style: { fontFamily: "var(--font-display)", fontSize: 15 } }, "План лечения"),
        React.createElement("span", { style: { marginLeft: "auto", fontSize: 13, color: "var(--ink-3)" } }, on.filter(Boolean).length + " из " + items.length + " этапов")),
      items.map((it, i) => React.createElement("div", { key: i, className: "plan-item" + (on[i] ? "" : " off") },
        React.createElement("div", { className: "pcheck" + (on[i] ? " on" : ""), onClick: () => toggle(i) }, React.createElement(Icon, { name: "check", size: 14 })),
        React.createElement("div", { className: "plan-tooth", style: { background: it.tint, color: it.c } }, React.createElement(Icon, { name: "tooth", size: 18 })),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: { fontWeight: 600, fontSize: 14.5 } }, it.label + " · зуб " + it.tooth),
          React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-3)" } }, "Приоритет: " + it.sev + " · уверенность ИИ " + it.pc + "%")),
        React.createElement("div", { style: { fontWeight: 700, fontFamily: "var(--font-display)", whiteSpace: "nowrap" } }, fmt(it.price)))),
      React.createElement("div", { className: "plan-total" },
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 13, color: "var(--primary-700)", opacity: .85 } }, "Итого по плану"),
          React.createElement("div", { style: { fontWeight: 800, fontSize: 26, fontFamily: "var(--font-display)", color: "var(--primary-700)", whiteSpace: "nowrap" } }, fmt(total))),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("button", { className: "btn-app gho" }, React.createElement(Icon, { name: "share", size: 16 }), "Альтернатива"),
          React.createElement("button", { className: "btn-app pri", onClick: () => ctx.toast("План отправлен пациенту " + patient.name.split(" ")[0]) }, React.createElement(Icon, { name: "send", size: 16 }), "Отправить пациенту")))),
    React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 14, color: "var(--ink-3)", fontSize: 13, alignItems: "center" } },
      React.createElement(Icon, { name: "shield", size: 15 }),
      "Расчёт ориентировочный. По ДМС возможна частичная компенсация — уточняется при согласовании."));
  if (embedded) return body;
  return React.createElement("div", { className: "content-pad", style: { maxWidth: 820 } },
    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 } },
      React.createElement("button", { className: "icon-btn", onClick: () => ctx.openAnalysis(patient.id) }, React.createElement(Icon, { name: "arrow", size: 18, style: { transform: "rotate(180deg)" } })),
      React.createElement(Avatar, { name: patient.name, color: patient.color, size: 40 }),
      React.createElement("div", null,
        React.createElement("div", { style: { fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 18 } }, "План лечения · " + patient.name),
        React.createElement("div", { style: { fontSize: 13, color: "var(--ink-3)" } }, "Сформирован из подтверждённых находок ИИ")),
      React.createElement("button", { className: "btn-app gho", style: { marginLeft: "auto" }, onClick: () => { ctx.toast("Готовим PDF…"); setTimeout(() => window.print(), 400); } }, React.createElement(Icon, { name: "print", size: 16 }), "Экспорт PDF")),
    body);
}

/* ---------------- AI ASSISTANT ---------------- */
function buildAnswer(text, patient) {
  const q = text.toLowerCase();
  const f0 = patient.findings[0] ? findingInfo(patient.findings[0]) : null;
  if (q.includes("план") || q.includes("лечен"))
    return { text: "Для " + patient.name.split(" ")[0] + " предлагаю план из " + patient.findings.filter(f => findingInfo(f).price > 0).length + " этапов по приоритету: сначала лечение кариеса и эндодонтия, затем профгигиена. Ориентировочная стоимость рассчитана в разделе «Планы лечения».", ref: "Открыть план лечения", refAct: "plan" };
  if (q.includes("объясн") || q.includes("пациент") || q.includes("простыми"))
    return { text: "«На снимке видно, что на одном из зубов началось разрушение твёрдых тканей. Если вылечить его сейчас — небольшой пломбой, — лечение будет простым, быстрым и недорогим. Если откладывать, может потребоваться лечение нерва.»" };
  if (q.includes("26") || q.includes("кариес"))
    return { text: f0 ? "На зубе " + f0.tooth + " (" + f0.loc + ") обнаружен " + f0.label.toLowerCase() + " с уверенностью " + f0.pc + "%. Рекомендую прямую реставрацию композитом. При сомнении — прицельный снимок для оценки глубины." : "Кариозных поражений на текущем снимке не выявлено.", ref: "Показать на снимке", refAct: "analysis" };
  if (q.includes("риск") || q.includes("прогноз"))
    return { text: "Учитывая " + patient.findings.length + " находки и историю визитов, риск прогрессирования — умеренный. Рекомендую контрольный снимок через 6 месяцев и усиление домашней гигиены." };
  return { text: "Я опираюсь на снимок и историю " + patient.name.split(" ")[0] + ". Могу предложить дифференциальный диагноз, помочь с планом лечения или объяснить ситуацию пациенту простыми словами. О чём рассказать подробнее?" };
}

function Assistant({ ctx }) {
  const [pid, setPid] = useState(ctx.patientId || PATIENTS[0].id);
  const patient = PATIENTS.find(p => p.id === pid);
  const [msgs, setMsgs] = useState([{ who: "ai", text: "Здравствуйте, доктор. Я проанализировал снимок пациента " + patient.name + " — нашёл " + patient.findings.length + " находки. Спросите меня о диагнозе, плане лечения или о том, как объяснить это пациенту." }]);
  const [val, setVal] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs, typing]);
  function send(text) {
    const q = (text != null ? text : val).trim(); if (!q) return;
    setVal("");
    const hist = [...msgs, { who: "me", text: q }];
    setMsgs(hist); setTyping(true);
    if (window.RadixAI && RadixAI.hasKey()) {
      RadixAI.ask(patient, hist)
        .then(t => { setTyping(false); setMsgs(m => [...m, { who: "ai", text: t }]); })
        .catch(err => {
          setTyping(false);
          setMsgs(m => [...m, { who: "ai", ...buildAnswer(q, patient) }]);
          ctx.toast("AI недоступен (" + err.message + ") — демо-ответ");
        });
    } else {
      setTimeout(() => {
        const a = buildAnswer(q, patient);
        setTyping(false); setMsgs(m => [...m, { who: "ai", ...a }]);
      }, 950);
    }
  }
  const live = window.RadixAI && RadixAI.hasKey();
  const suggests = ["Что видно на снимке?", "Объясни пациенту простыми словами", "Предложи план лечения", "Оцени риск и прогноз"];
  return React.createElement("div", { className: "chatview" },
    React.createElement("div", { className: "chat-wrap" },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "14px 26px", borderBottom: "1px solid var(--line)", background: "#fff" } },
        React.createElement("div", { style: { width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,var(--primary),#6a83ff)", display: "grid", placeItems: "center", color: "#fff" } }, React.createElement(Icon, { name: "bolt", size: 18 })),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: { fontWeight: 700, fontFamily: "var(--font-display)" } }, "Радикс Ассистент"),
          React.createElement("div", { style: { fontSize: 12.5, color: live ? "var(--good)" : "var(--ink-3)", fontWeight: live ? 600 : 400 } },
            live ? "● Live · " + RadixAI.models().chat + " · контекст пациента" : "Демо-режим · подключите AI в Настройках")),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, background: "var(--bg-soft)", border: "1px solid var(--line)", borderRadius: 999, padding: "5px 6px 5px 12px" } },
          React.createElement(Avatar, { name: patient.name, color: patient.color, size: 26, fontSize: 11 }),
          React.createElement("select", { value: pid, onChange: e => { const np = +e.target.value; setPid(np); const pp = PATIENTS.find(p => p.id === np); setMsgs([{ who: "ai", text: "Открыт пациент " + pp.name + ". Нашёл " + pp.findings.length + " находки на последнем снимке. Чем помочь?" }]); },
            style: { border: "none", background: "none", font: "inherit", fontWeight: 600, fontSize: 13.5, color: "var(--ink)", outline: "none", cursor: "pointer" } },
            PATIENTS.map(p => React.createElement("option", { key: p.id, value: p.id }, p.name))))),
      React.createElement("div", { className: "chat-scroll", ref: scrollRef },
        React.createElement("div", { className: "chat-inner" },
          msgs.map((m, i) => React.createElement("div", { key: i, className: "msg " + (m.who === "ai" ? "ai" : "me") },
            React.createElement("div", { className: "m-av", style: { background: m.who === "ai" ? "linear-gradient(135deg,var(--primary),#6a83ff)" : "var(--ink)" } },
              m.who === "ai" ? React.createElement(Icon, { name: "bolt", size: 15 }) : "Я"),
            React.createElement("div", { className: "m-body" }, m.text,
              m.ref ? React.createElement("div", { className: "ref", onClick: () => { if (m.refAct === "plan") ctx.openPlan(pid); else ctx.openAnalysis(pid); } },
                React.createElement(Icon, { name: m.refAct === "plan" ? "doc" : "scan", size: 15 }), m.ref) : null))),
          typing ? React.createElement("div", { className: "msg ai" },
            React.createElement("div", { className: "m-av", style: { background: "linear-gradient(135deg,var(--primary),#6a83ff)" } }, React.createElement(Icon, { name: "bolt", size: 15 })),
            React.createElement("div", { className: "m-body" }, React.createElement("div", { className: "typing" }, React.createElement("i"), React.createElement("i"), React.createElement("i")))) : null)),
      React.createElement("div", { className: "chat-suggest" }, suggests.map((s, i) =>
        React.createElement("button", { key: i, className: "suggest", onClick: () => send(s) }, s))),
      React.createElement("div", { className: "chat-bar" },
        React.createElement("div", { className: "chat-bar-inner" },
          React.createElement("input", { placeholder: "Спросите про снимок, диагноз или план…", value: val, onChange: e => setVal(e.target.value), onKeyDown: e => { if (e.key === "Enter") send(); } }),
          React.createElement("button", { className: "chat-send", disabled: !val.trim(), onClick: () => send() }, React.createElement(Icon, { name: "send", size: 18 }))),
        React.createElement("div", { style: { textAlign: "center", fontSize: 11.5, color: "var(--ink-4)", marginTop: 8 } }, "Радикс Ассистент помогает врачу и не является медицинским заключением"))));
}

/* ---------------- ANALYTICS ---------------- */
function Analytics({ ctx }) {
  const bars = [
    { m: "Янв", v: 62 }, { m: "Фев", v: 78 }, { m: "Мар", v: 71 }, { m: "Апр", v: 92 }, { m: "Май", v: 110 }, { m: "Июн", v: 142 }
  ];
  const max = 150;
  const dist = [
    { l: "Кариес", v: 48, c: "#f0533f" }, { l: "Зубной камень", v: 27, c: "#f0a12e" },
    { l: "Периапикальные", v: 14, c: "#7c5cff" }, { l: "Реставрации", v: 11, c: "#12b8d6" }
  ];
  return React.createElement("div", { className: "content-pad" },
    React.createElement("h1", { style: { fontSize: 26, fontFamily: "var(--font-display)", marginBottom: 4 } }, "Аналитика"),
    React.createElement("p", { style: { color: "var(--ink-3)", marginBottom: 22 } }, "Эффективность диагностики и принятия планов по клинике"),
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start" } },
      React.createElement("div", { className: "card" },
        React.createElement(CardHead, { title: "Снимков проанализировано", icon: "chart", right: React.createElement(Tag, { c: "#18b27a", tint: "#E2F6EE" }, "+129% за полгода") }),
        React.createElement("div", { style: { padding: "26px 22px", display: "flex", alignItems: "flex-end", gap: 18, height: 240 } }, bars.map((b, i) =>
          React.createElement("div", { key: i, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 9, height: "100%", justifyContent: "flex-end" } },
            React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--ink-2)" } }, b.v),
            React.createElement("div", { style: { width: "100%", maxWidth: 46, height: (b.v / max * 100) + "%", borderRadius: "10px 10px 4px 4px", background: i === bars.length - 1 ? "linear-gradient(180deg,#3B5BFF,#6a83ff)" : "var(--primary-tint-2)", transition: "height .6s" } }),
            React.createElement("div", { style: { fontSize: 12, color: "var(--ink-3)" } }, b.m)))) ),
      React.createElement("div", { className: "card" },
        React.createElement(CardHead, { title: "Структура находок", icon: "shield" }),
        React.createElement("div", { className: "card-pad" }, dist.map((d, i) =>
          React.createElement("div", { key: i, style: { marginBottom: 16 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 } },
              React.createElement("span", { style: { fontWeight: 600 } }, d.l), React.createElement("span", { style: { color: "var(--ink-3)" } }, d.v + "%")),
            React.createElement("div", { style: { height: 9, borderRadius: 99, background: "var(--bg-soft)", overflow: "hidden" } },
              React.createElement("div", { style: { width: d.v + "%", height: "100%", borderRadius: 99, background: d.c } }))))) )),
    React.createElement("div", { className: "stat-grid", style: { marginTop: 20 } }, [
      { n: "98,2%", l: "Точность детекции", c: "#3B5BFF", bg: "#ECF0FF", ic: "sparkle" },
      { n: "91%", l: "Подтверждено врачом", c: "#18b27a", bg: "#E2F6EE", ic: "check" },
      { n: "3 мин", l: "Экономия на пациенте", c: "#f0a12e", bg: "#FCF0DC", ic: "clock" },
      { n: "82%", l: "Планов принято", c: "#7c5cff", bg: "#efeaff", ic: "doc" }
    ].map((s, i) => React.createElement("div", { className: "stat", key: i },
      React.createElement("div", { className: "s-ic", style: { background: s.bg, color: s.c } }, React.createElement(Icon, { name: s.ic, size: 20 })),
      React.createElement("div", { className: "s-num" }, s.n), React.createElement("div", { className: "s-lbl" }, s.l)))));
}

/* ---------------- SETTINGS ---------------- */
function AISettingsCard({ ctx }) {
  const [key, setKey] = useState(() => RadixAI.getKey());
  const [am, setAm] = useState(() => RadixAI.models().analysis);
  const [cm, setCm] = useState(() => RadixAI.models().chat);
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState(null); // null | "wait" | "ok" | "err: …"
  function save() {
    RadixAI.configure(key.trim(), am.trim(), cm.trim());
    ctx.toast(key.trim() ? "AI подключён — заключения и чат работают вживую" : "Ключ удалён — приложение в демо-режиме");
  }
  function check() {
    RadixAI.configure(key.trim(), am.trim(), cm.trim());
    setTest("wait");
    RadixAI.ping().then(() => setTest("ok")).catch(e => setTest("err: " + e.message));
  }
  const inp = { width: "100%", padding: "11px 14px", border: "1px solid var(--line)", borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff", color: "var(--ink)" };
  const lbl = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink-2)", marginBottom: 6 };
  return React.createElement("div", { className: "card", style: { marginBottom: 18 } },
    React.createElement(CardHead, { title: "Подключение AI (OpenAI)", icon: "bolt", right: RadixAI.hasKey() ? React.createElement(Tag, { c: "#18b27a", tint: "#E2F6EE" }, "Подключено") : React.createElement(Tag, { c: "var(--warn)", tint: "var(--warn-tint)" }, "Демо-режим") }),
    React.createElement("div", { className: "card-pad" },
      React.createElement("div", { style: { marginBottom: 14 } },
        React.createElement("label", { style: lbl }, "Ключ API"),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("input", { style: Object.assign({}, inp, { flex: 1 }), type: showKey ? "text" : "password", placeholder: "sk-…", value: key, onChange: e => setKey(e.target.value) }),
          React.createElement("button", { className: "btn-app gho", onClick: () => setShowKey(s => !s) }, showKey ? "Скрыть" : "Показать")),
        React.createElement("div", { style: { fontSize: 12, color: "var(--ink-4)", marginTop: 6 } }, "Ключ хранится только в этом браузере (localStorage) и отправляется напрямую в OpenAI.")),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 } },
        React.createElement("div", null,
          React.createElement("label", { style: lbl }, "Модель анализа снимков"),
          React.createElement("input", { style: inp, value: am, onChange: e => setAm(e.target.value) }),
          React.createElement("div", { style: { fontSize: 12, color: "var(--ink-4)", marginTop: 5 } }, "Заключения и объяснения · премиум")),
        React.createElement("div", null,
          React.createElement("label", { style: lbl }, "Модель чата"),
          React.createElement("input", { style: inp, value: cm, onChange: e => setCm(e.target.value) }),
          React.createElement("div", { style: { fontSize: 12, color: "var(--ink-4)", marginTop: 5 } }, "Ассистент · общий доступ"))),
      React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } },
        React.createElement("button", { className: "btn-app pri", onClick: save }, React.createElement(Icon, { name: "check", size: 16 }), "Сохранить"),
        React.createElement("button", { className: "btn-app gho", onClick: check, disabled: test === "wait" }, React.createElement(Icon, { name: "sparkle", size: 16 }), test === "wait" ? "Проверка…" : "Проверить соединение"),
        test === "ok" ? React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "#18b27a" } }, "✓ Соединение работает") : null,
        test && test.indexOf("err") === 0 ? React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--danger)" } }, test.slice(5)) : null)));
}

function Settings({ ctx }) {
  const integ = [["IDENT", true], ["Dental4Web", true], ["StomX", true], ["MedFlow", true], ["КлиникаПро", false], ["1С:Медицина", false]];
  return React.createElement("div", { className: "content-pad", style: { maxWidth: 820 } },
    React.createElement("h1", { style: { fontSize: 26, fontFamily: "var(--font-display)", marginBottom: 4 } }, "Настройки"),
    React.createElement("p", { style: { color: "var(--ink-3)", marginBottom: 22 } }, "Интеграции, модель и параметры клиники"),
    React.createElement(AISettingsCard, { ctx: ctx }),
    React.createElement("div", { className: "card", style: { marginBottom: 18 } },
      React.createElement(CardHead, { title: "Интеграции с CRM", icon: "layers" }),
      React.createElement("div", { className: "card-pad", style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, integ.map(([n, on], i) =>
        React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: 14, border: "1px solid var(--line)", borderRadius: 12 } },
          React.createElement("b", { style: { fontFamily: "var(--font-display)", fontSize: 15 } }, n),
          React.createElement("span", { style: { marginLeft: "auto", fontSize: 11.5, fontWeight: 700, color: on ? "#18b27a" : "var(--ink-3)", background: on ? "#E2F6EE" : "var(--bg-soft)", padding: "3px 9px", borderRadius: 999 } }, on ? "Подключено" : "Подключить"))))),
    React.createElement("div", { className: "card" },
      React.createElement(CardHead, { title: "Модель анализа", icon: "sparkle" }),
      React.createElement("div", { className: "card-pad" },
        [["Порог уверенности для показа находок", "70%"], ["Авто-формирование плана из находок", "Включено"], ["Версия модели", "Радикс-Vision 3.1"]].map((r, i) =>
          React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: i < 2 ? "1px solid var(--line)" : "none" } },
            React.createElement("span", { style: { fontSize: 14.5 } }, r[0]),
            React.createElement("b", { style: { color: "var(--primary)", fontSize: 14 } }, r[1]))))),
    React.createElement("div", { style: { marginTop: 18 } }, React.createElement(ActivityLog, null)));
}

Object.assign(window, { PlanBuilder, Assistant, Analytics, Settings });
