/* ============================================================
   Радикс Продукт — views2: Assistant, PlanBuilder, Analytics, Settings
   ============================================================ */

/* ---------------- PLAN BUILDER ---------------- */
const PLAN_STATUS = {
  draft: { l: "Черновик", c: "var(--ink-3)", tint: "var(--bg-soft)" },
  sent: { l: "Отправлен пациенту", c: "var(--warn)", tint: "var(--warn-tint)" },
  accepted: { l: "Принят · в работе", c: "var(--good)", tint: "var(--good-tint)" },
  declined: { l: "Отклонён", c: "var(--danger)", tint: "#FCE6E2" }
};

function PlanBuilder({ patient, ctx, embedded }) {
  const [plan, setPlanLocal] = useState(() => getPlan(patient.id));
  const draftItems = patient.findings.filter(f => findingInfo(f).price > 0).map(f => findingInfo(f));
  const sent = plan.status !== "draft" && plan.items && plan.items.length;
  const items = sent ? plan.items : draftItems;
  const [on, setOn] = useState(() => items.map(() => true));
  const [adv, setAdv] = useState(null); // { loading, text, mode }
  const [pmsg, setPmsg] = useState(null); // сообщение пациенту
  useEffect(() => {
    const p = getPlan(patient.id);
    setPlanLocal(p);
    const len = (p.status !== "draft" && p.items) ? p.items.length : patient.findings.filter(f => findingInfo(f).price > 0).length;
    setOn(Array.from({ length: len }, () => true));
    setAdv(null); setPmsg(null);
  }, [patient.id]);

  function patch(p) { setPlanLocal(setPlanState(patient.id, p)); }
  const fmt = n => n.toLocaleString("ru-RU") + " ₽";
  const selItems = sent ? items : items.filter((it, i) => on[i]);
  const total = selItems.reduce((s, it) => s + it.price, 0);
  const doneCount = sent ? items.filter((it, i) => plan.done && plan.done[i]).length : 0;
  const paidSum = sent ? items.reduce((s, it, i) => s + (plan.done && plan.done[i] ? it.price : 0), 0) : 0;
  const allDone = sent && items.length > 0 && doneCount === items.length;
  const st = PLAN_STATUS[plan.status] || PLAN_STATUS.draft;

  function sendPlan() {
    const sel = items.filter((it, i) => on[i]);
    if (!sel.length) return;
    const snap = sel.map(it => ({ type: it.type, label: it.label, tooth: it.tooth, price: it.price, sev: it.sev, pc: it.pc, tint: it.tint, c: it.c }));
    patch({ status: "sent", sentAt: new Date().toISOString(), items: snap, done: {} });
    const stage = crmSetStage(patient.id, "plan", { work: snap[0].label + (snap.length > 1 ? " +" + (snap.length - 1) : ""), val: snap.reduce((s, it) => s + it.price, 0) });
    ctx.toast("План отправлен пациенту " + patient.name.split(" ")[0] + (stage ? " · сделка → «" + stage.t + "»" : ""));
  }
  function acceptPlan() {
    patch({ status: "accepted" });
    const stage = crmSetStage(patient.id, "treat", { work: "План лечения", val: total });
    ctx.toast("План принят" + (stage ? " · сделка → «" + stage.t + "»" : "") + ". Отмечайте этапы по мере выполнения.");
  }
  function declinePlan() {
    patch({ status: "declined" });
    crmSetStage(patient.id, "consult");
    ctx.toast("План отклонён — сделка возвращена на «Консультацию»");
  }
  function resetPlan() {
    patch({ status: "draft", items: null, done: {}, sentAt: null });
    setOn(draftItems.map(() => true));
    ctx.toast("Новый черновик плана");
  }
  function completeStep(i) {
    if (plan.done && plan.done[i]) return;
    const done = Object.assign({}, plan.done, { [i]: true });
    patch({ done });
    const it = items[i];
    addPayment({ pid: patient.id, name: patient.name, label: it.label + " · зуб " + it.tooth, amount: it.price });
    const d = new Date();
    const dd = ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + d.getFullYear();
    updatePatient(patient.id, { visits: [{ t: it.label + " · зуб " + it.tooth, d: dd, c: "#18A06E" }].concat(patient.visits || []) });
    const all = items.every((x, k) => done[k]);
    if (all) {
      crmSetStage(patient.id, "done");
      ctx.toast("План завершён 🎉 Сделка → «Завершён», оплачено " + fmt(items.reduce((s, x) => s + x.price, 0)));
    } else {
      ctx.toast("Этап оплачен: " + fmt(it.price));
    }
  }
  function aiMessage() {
    setPmsg({ loading: true });
    const live = window.RadixAI && RadixAI.hasKey();
    const sel = selItems, tot = total;
    const demo = patient.name.split(" ")[0] + ", добрый день! Мы посмотрели ваш снимок — есть несколько участков, которые лучше полечить сейчас, пока это просто и недорого. Подготовили план из " + sel.length + " шагов на " + tot.toLocaleString("ru-RU") + " ₽. Напишите, когда вам удобно зайти, — подберём время 🙂 Клиника «Радикс»";
    const run = live ? RadixAI.patientMessage(patient, sel, tot) : new Promise(res => setTimeout(() => res(demo), 800));
    run.then(text => setPmsg({ text, mode: live ? RadixAI.models().chat : "демо" }))
      .catch(err => { setPmsg(null); ctx.toast("AI недоступен: " + err.message); });
  }
  function aiAdvice() {
    setAdv({ loading: true });
    const live = window.RadixAI && RadixAI.hasKey();
    const demo = "ПОРЯДОК\n1. Эндодонтия и глубокий кариес — в первую очередь (риск осложнений).\n2. Остальные кариозные полости.\n3. Профгигиена — завершающим этапом, закрепляет результат.\n\nАЛЬТЕРНАТИВА\nЭтапы можно разнести на 2 визита — нагрузка на бюджет меньше, клинический результат тот же.\n\nРИСКИ ОТКЛАДЫВАНИЯ\nКариес дентина за полгода может дойти до пульпы — лечение станет в 2-3 раза дороже.";
    const run = live ? RadixAI.planAdvice(patient, items) : new Promise(res => setTimeout(() => res(demo), 900));
    run.then(text => setAdv({ text, mode: live ? RadixAI.models().analysis : "демо" }))
      .catch(err => { setAdv(null); ctx.toast("AI недоступен: " + err.message); });
  }
  function toggle(i) { if (!sent) setOn(o => o.map((v, k) => k === i ? !v : v)); }
  function openPatientReport() {
    const mk = getMarketing();
    const withInfo = patient.findings.map(f => Object.assign({}, f, { info: findingInfo(f) }));
    const saved = RadixStore.get("img_" + patient.id, null);
    const d = {
      kind: "patient", patient, findings: withInfo, img: saved ? saved.url : null,
      planItems: selItems, upsells: pickUpsells(patient.findings, mk.upsells), marketing: mk,
      risk: (window.RadixAI && RadixAI.riskScore) ? RadixAI.riskScore({ findings: patient.findings }) : null,
      doctor: (RadixStore.get("user", null) || { name: "Алексей Петров" }).name
    };
    const live = window.RadixAI && RadixAI.hasKey();
    function show() {
      if (RadixReport.open(d)) ctx.toast("Отчёт пациента открыт");
      else ctx.toast("Браузер заблокировал окно — разрешите всплывающие окна");
    }
    if (!live) { d.mode = "демо-тексты"; show(); return; }
    ctx.toast("Готовлю персональный отчёт (" + RadixAI.models().analysis + ")…");
    RadixAI.patientReportTexts(patient, withInfo, d.upsells)
      .then(texts => { d.texts = texts; d.mode = RadixAI.models().analysis; show(); })
      .catch(err => { d.mode = "демо-тексты (AI: " + err.message + ")"; show(); });
  }

  // кнопки нижней панели по статусу
  let actions;
  if (plan.status === "draft") actions = [
    React.createElement("button", { key: "r", className: "btn-app gho", style: { color: "var(--good)" }, onClick: openPatientReport, disabled: !selItems.length }, React.createElement(Icon, { name: "doc", size: 16 }), "Отчёт пациенту"),
    React.createElement("button", { key: "a", className: "btn-app gho", onClick: aiAdvice, disabled: (adv && adv.loading) || !items.length }, React.createElement(Icon, { name: "bolt", size: 16 }), adv && adv.loading ? "Думаю…" : "Приоритизация AI"),
    React.createElement("button", { key: "m", className: "btn-app gho", onClick: aiMessage, disabled: (pmsg && pmsg.loading) || !selItems.length }, React.createElement(Icon, { name: "chat", size: 16 }), pmsg && pmsg.loading ? "Пишу…" : "Сообщение пациенту"),
    React.createElement("button", { key: "s", className: "btn-app pri", disabled: !selItems.length, onClick: sendPlan }, React.createElement(Icon, { name: "send", size: 16 }), "Отправить пациенту")
  ];
  else if (plan.status === "sent") actions = [
    React.createElement("button", { key: "r", className: "btn-app gho", style: { color: "var(--good)" }, onClick: openPatientReport }, React.createElement(Icon, { name: "doc", size: 16 }), "Отчёт пациенту"),
    React.createElement("button", { key: "m", className: "btn-app gho", onClick: aiMessage, disabled: pmsg && pmsg.loading }, React.createElement(Icon, { name: "chat", size: 16 }), pmsg && pmsg.loading ? "Пишу…" : "Напомнить пациенту"),
    React.createElement("button", { key: "d", className: "btn-app gho", style: { color: "var(--danger)" }, onClick: declinePlan }, React.createElement(Icon, { name: "x", size: 16 }), "Отклонил"),
    React.createElement("button", { key: "ok", className: "btn-app pri", onClick: acceptPlan }, React.createElement(Icon, { name: "check", size: 16 }), "Пациент принял")
  ];
  else if (plan.status === "accepted") actions = [
    allDone
      ? React.createElement("button", { key: "n", className: "btn-app pri", onClick: resetPlan }, React.createElement(Icon, { name: "plus", size: 16 }), "Новый план")
      : React.createElement("span", { key: "p", style: { fontSize: 13.5, color: "var(--ink-3)", alignSelf: "center" } }, "Выполнено " + doneCount + " из " + items.length + " · оплачено " + fmt(paidSum))
  ];
  else actions = [ // declined
    React.createElement("button", { key: "n", className: "btn-app pri", onClick: resetPlan }, React.createElement(Icon, { name: "plus", size: 16 }), "Новый план")
  ];

  const body = React.createElement("div", null,
    React.createElement("div", { style: { borderRadius: embedded ? 14 : "var(--r-lg)", border: "1px solid var(--line)", overflow: "hidden", background: "#fff" } },
      React.createElement("div", { style: { padding: "13px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } },
        React.createElement("span", { style: { color: "var(--primary)" } }, React.createElement(Icon, { name: "doc", size: 18 })),
        React.createElement("b", { style: { fontFamily: "var(--font-display)", fontSize: 15 } }, "План лечения"),
        React.createElement("span", { style: { fontSize: 11.5, fontWeight: 700, color: st.c, background: st.tint, padding: "3px 10px", borderRadius: 999 } }, allDone ? "Завершён · оплачен" : st.l),
        React.createElement("span", { style: { marginLeft: "auto", fontSize: 13, color: "var(--ink-3)" } },
          sent ? items.length + " этапов" + (plan.status === "accepted" ? " · " + doneCount + " выполнено" : "") : on.filter(Boolean).length + " из " + items.length + " этапов")),
      items.length ? items.map((it, i) => {
        const stepDone = sent && plan.done && plan.done[i];
        return React.createElement("div", { key: i, className: "plan-item" + (!sent && !on[i] ? " off" : "") },
          !sent
            ? React.createElement("div", { className: "pcheck" + (on[i] ? " on" : ""), onClick: () => toggle(i) }, React.createElement(Icon, { name: "check", size: 14 }))
            : null,
          React.createElement("div", { className: "plan-tooth", style: { background: it.tint, color: it.c } }, React.createElement(Icon, { name: "tooth", size: 18 })),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontWeight: 600, fontSize: 14.5, textDecoration: stepDone ? "line-through" : "none", opacity: stepDone ? .65 : 1 } }, it.label + " · зуб " + it.tooth),
            React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-3)" } }, "Приоритет: " + it.sev + " · уверенность ИИ " + it.pc + "%")),
          plan.status === "accepted"
            ? (stepDone
              ? React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--good)", background: "var(--good-tint)", padding: "5px 11px", borderRadius: 999, whiteSpace: "nowrap" } }, "✓ Оплачено")
              : React.createElement("button", { className: "btn-app pri sm", onClick: () => completeStep(i), style: { whiteSpace: "nowrap" } }, "Выполнен и оплачен"))
            : null,
          React.createElement("div", { style: { fontWeight: 700, fontFamily: "var(--font-display)", whiteSpace: "nowrap", marginLeft: 10 } }, fmt(it.price)));
      }) : React.createElement("div", { style: { textAlign: "center", color: "var(--ink-4)", fontSize: 14, padding: "26px 16px" } },
        "Этапов пока нет — подтвердите находки в анализе снимка, и план соберётся сам."),
      React.createElement("div", { className: "plan-total" },
        React.createElement("div", null,
          React.createElement("div", { style: { fontSize: 13, color: "var(--primary-700)", opacity: .85 } }, plan.status === "accepted" ? "Оплачено / итого" : "Итого по плану"),
          React.createElement("div", { style: { fontWeight: 800, fontSize: 26, fontFamily: "var(--font-display)", color: "var(--primary-700)", whiteSpace: "nowrap" } },
            plan.status === "accepted" ? fmt(paidSum) + " / " + fmt(total) : fmt(total))),
        React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, actions))),
    pmsg && !pmsg.loading ? React.createElement("div", { style: { marginTop: 14, borderRadius: 14, border: "1px solid var(--line)", background: "#fff", overflow: "hidden" } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, padding: "12px 16px", borderBottom: "1px solid var(--line)" } },
        React.createElement("span", { style: { color: "var(--good)" } }, React.createElement(Icon, { name: "chat", size: 16 })),
        React.createElement("b", { style: { fontFamily: "var(--font-display)", fontSize: 14 } }, "Сообщение для WhatsApp / SMS"),
        React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: pmsg.mode === "демо" ? "var(--warn)" : "var(--good)", background: pmsg.mode === "демо" ? "var(--warn-tint)" : "var(--good-tint)", padding: "2px 9px", borderRadius: 999 } }, pmsg.mode),
        React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 8 } },
          React.createElement("button", { className: "btn-app gho sm", onClick: () => { navigator.clipboard && navigator.clipboard.writeText(pmsg.text); ctx.toast("Сообщение скопировано — вставьте в мессенджер"); } }, "Копировать"),
          React.createElement("button", { style: { color: "var(--ink-3)" }, onClick: () => setPmsg(null) }, "✕"))),
      React.createElement("div", { style: { padding: "14px 18px", whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6 } }, pmsg.text)) : null,
    adv && !adv.loading ? React.createElement("div", { style: { marginTop: 14, borderRadius: 14, border: "1px solid var(--line)", background: "#fff", overflow: "hidden" } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, padding: "12px 16px", borderBottom: "1px solid var(--line)" } },
        React.createElement("span", { style: { color: "var(--primary)" } }, React.createElement(Icon, { name: "bolt", size: 16 })),
        React.createElement("b", { style: { fontFamily: "var(--font-display)", fontSize: 14 } }, "Рекомендация AI по порядку лечения"),
        React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: adv.mode === "демо" ? "var(--warn)" : "var(--good)", background: adv.mode === "демо" ? "var(--warn-tint)" : "var(--good-tint)", padding: "2px 9px", borderRadius: 999 } }, adv.mode),
        React.createElement("button", { style: { marginLeft: "auto", color: "var(--ink-3)" }, onClick: () => setAdv(null) }, "✕")),
      React.createElement("div", { style: { padding: "14px 18px", whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6 } }, adv.text)) : null,
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
      React.createElement("button", { className: "btn-app gho", style: { marginLeft: "auto" }, onClick: () => {
        const sel = selItems;
        const doctor = (RadixStore.get("user", null) || { name: "Алексей Петров" }).name;
        if (RadixPrint.open({ title: "План лечения", patient: patient.name, doctor,
          rows: sel.map(it => ({ label: it.label + " · зуб " + it.tooth, sub: "Приоритет: " + it.sev + " · уверенность ИИ " + it.pc + "%", price: it.price })),
          total: sel.reduce((s, it) => s + it.price, 0) })) ctx.toast("Бланк открыт — печать или сохранение в PDF");
        else ctx.toast("Браузер заблокировал окно печати — разрешите всплывающие окна");
      } }, React.createElement(Icon, { name: "print", size: 16 }), "Экспорт PDF")),
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
  function greeting(p) { return [{ who: "ai", text: "Здравствуйте, доктор. Я проанализировал снимок пациента " + p.name + " — нашёл " + p.findings.length + " находки. Спросите меня о диагнозе, плане лечения или о том, как объяснить это пациенту." }]; }
  const [msgs, setMsgs] = useState(() => RadixStore.get("chat_" + pid, null) || greeting(patient));
  const [val, setVal] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs, typing]);
  useEffect(() => { if (msgs.length > 1) RadixStore.set("chat_" + pid, msgs.slice(-30)); }, [msgs, pid]);
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
          React.createElement("select", { value: pid, onChange: e => { const np = +e.target.value; setPid(np); const pp = PATIENTS.find(p => p.id === np); setMsgs(RadixStore.get("chat_" + np, null) || [{ who: "ai", text: "Открыт пациент " + pp.name + ". Нашёл " + pp.findings.length + " находки на последнем снимке. Чем помочь?" }]); },
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

/* ---------------- PAYMENTS (живые оплаты) ---------------- */
function PaymentsCard({ ctx }) {
  const all = getPayments();
  const month = paymentsThisMonth();
  const monthSum = month.reduce((s, p) => s + p.amount, 0);
  const fmt = n => n.toLocaleString("ru-RU") + " ₽";
  return React.createElement("div", { className: "card", style: { marginTop: 20 } },
    React.createElement(CardHead, { title: "Оплаты по планам лечения", icon: "cash",
      right: month.length ? React.createElement(Tag, { c: "#18b27a", tint: "#E2F6EE" }, fmt(monthSum) + " за месяц") : null }),
    all.length ? React.createElement("div", null, all.slice(0, 7).map((p, i) =>
      React.createElement("div", { key: p.id, style: { display: "flex", alignItems: "center", gap: 13, padding: "12px 20px", borderBottom: i < Math.min(all.length, 7) - 1 ? "1px solid var(--line)" : "none", cursor: p.pid ? "pointer" : "default" }, onClick: () => { if (p.pid) ctx.openPatient(p.pid); } },
        React.createElement(Avatar, { name: p.name, color: "#18A06E", size: 36 }),
        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
          React.createElement("div", { style: { fontWeight: 600, fontSize: 14 } }, p.name),
          React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-3)" } }, p.label)),
        React.createElement("div", { style: { textAlign: "right" } },
          React.createElement("div", { style: { fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--good)" } }, "+" + fmt(p.amount)),
          React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-4)" } }, new Date(p.date).toLocaleDateString("ru-RU"))))))
      : React.createElement("div", { style: { padding: "26px 20px", textAlign: "center", color: "var(--ink-4)", fontSize: 14 } },
        "Оплат пока нет. Отметьте этап «Выполнен и оплачен» в принятом плане лечения — оплата появится здесь."));
}

/* ---------------- ANALYTICS ---------------- */
function BarsRow({ items, fmt, color }) {
  const max = Math.max.apply(null, items.map(i => i.value).concat([1]));
  return React.createElement("div", { className: "card-pad" }, items.length ? items.map((it, i) =>
    React.createElement("div", { key: i, style: { marginBottom: 13 } },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 } },
        React.createElement("span", { style: { fontWeight: 600 } }, it.label),
        React.createElement("span", { style: { color: "var(--ink-3)", fontWeight: 700, fontFamily: "var(--font-display)" } }, fmt(it.value))),
      React.createElement("div", { style: { height: 10, borderRadius: 99, background: "var(--bg-soft)", overflow: "hidden" } },
        React.createElement("div", { style: { width: Math.max(3, it.value / max * 100) + "%", height: "100%", borderRadius: 99, background: it.color || color || "var(--primary)", transition: "width .6s" } })))) :
    React.createElement("div", { style: { textAlign: "center", color: "var(--ink-4)", fontSize: 13.5, padding: "20px 0" } }, "Пока нет данных — появятся после первых оплат"));
}

function AIForecastCard({ a, ctx }) {
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  function run() {
    setBusy(true);
    const live = window.RadixAI && RadixAI.hasKey();
    const lo = Math.round((a.monthRevenue + a.weighted * 0.3) / 1000) * 1000;
    const hi = Math.round((a.monthRevenue + a.weighted * 0.55 + a.avgCheck * 5) / 1000) * 1000;
    const demo = "Прогноз на следующий месяц: " + lo.toLocaleString("ru-RU") + "–" + hi.toLocaleString("ru-RU") + " ₽.\n• Основной драйвер — взвешенный пайплайн " + a.weighted.toLocaleString("ru-RU") + " ₽ и конверсия " + a.conv + "%.\n• Поднимите конверсию: быстрее отправляйте планы и напоминания.\n• Средний чек " + a.avgCheck.toLocaleString("ru-RU") + " ₽ — предлагайте профгигиену и эстетику в отчётах.";
    const run = live ? RadixAI.forecast(a) : new Promise(res => setTimeout(() => res(demo), 700));
    run.then(text => { setF({ text, mode: live ? RadixAI.models().chat : "демо" }); setBusy(false); })
      .catch(err => { setBusy(false); ctx.toast("AI недоступен: " + err.message); });
  }
  return React.createElement("div", { className: "card", style: { marginTop: 20 } },
    React.createElement(CardHead, { title: "AI-прогноз выручки", icon: "bolt",
      right: React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
        f ? React.createElement(Tag, { c: f.mode === "демо" ? "var(--warn)" : "#18b27a", tint: f.mode === "демо" ? "var(--warn-tint)" : "#E2F6EE" }, f.mode) : null,
        React.createElement("button", { className: "btn-app gho sm", onClick: run, disabled: busy }, busy ? "Считаю…" : f ? "Обновить" : "Сделать прогноз")) }),
    React.createElement("div", { style: { padding: "16px 20px", whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.65, color: f ? "var(--ink)" : "var(--ink-4)" } },
      f ? f.text : "Прогноз выручки на месяц по взвешенной воронке и динамике оплат — одной кнопкой."));
}

function Analytics({ ctx }) {
  const a = analyticsData();
  const fmtR = n => Math.round(n).toLocaleString("ru-RU") + " ₽";
  const funnelMax = Math.max.apply(null, a.funnel.map(s => s.n).concat([1]));
  return React.createElement("div", { className: "content-pad" },
    React.createElement("h1", { style: { fontSize: 26, fontFamily: "var(--font-display)", marginBottom: 4 } }, "Аналитика"),
    React.createElement("p", { style: { color: "var(--ink-3)", marginBottom: 22 } }, "Финансы, воронка и эффективность ИИ на реальных данных клиники"),

    // верхние метрики
    React.createElement("div", { className: "stat-grid", style: { marginBottom: 20 } }, [
      { n: fmtR(a.monthRevenue), l: "Выручка за месяц", c: "#18b27a", bg: "#E2F6EE", ic: "cash" },
      { n: fmtR(a.weighted), l: "Взвешенный пайплайн", c: "#3B5BFF", bg: "#ECF0FF", ic: "filter" },
      { n: a.conv + "%", l: "Конверсия лид→лечение", c: "#E8941F", bg: "#FCF0DC", ic: "chart" },
      { n: fmtR(a.avgCheck), l: "Средний чек", c: "#7c5cff", bg: "#efeaff", ic: "doc" }
    ].map((s, i) => React.createElement("div", { className: "stat", key: i },
      React.createElement("div", { className: "s-ic", style: { background: s.bg, color: s.c } }, React.createElement(Icon, { name: s.ic, size: 20 })),
      React.createElement("div", { className: "s-num", style: { fontSize: 21 } }, s.n), React.createElement("div", { className: "s-lbl" }, s.l)))),

    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" } },
      React.createElement("div", { className: "card" },
        React.createElement(CardHead, { title: "Выручка по услугам", icon: "cash" }),
        React.createElement(BarsRow, { items: a.services, fmt: fmtR, color: "#18b27a" })),
      React.createElement("div", { className: "card" },
        React.createElement(CardHead, { title: "Выручка по врачам", icon: "users" }),
        React.createElement(BarsRow, { items: a.doctors, fmt: fmtR, color: "#3B5BFF" }))),

    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start", marginTop: 20 } },
      // воронка
      React.createElement("div", { className: "card" },
        React.createElement(CardHead, { title: "Воронка пациентов", icon: "filter", right: React.createElement(Tag, { c: "#18b27a", tint: "#E2F6EE" }, a.conv + "% конверсия") }),
        React.createElement("div", { className: "card-pad" }, a.funnel.map((s, i) =>
          React.createElement("div", { key: i, style: { marginBottom: 12 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 5 } },
              React.createElement("span", { style: { fontWeight: 600, display: "flex", alignItems: "center", gap: 7 } },
                React.createElement("span", { style: { width: 9, height: 9, borderRadius: "50%", background: s.c } }), s.t),
              React.createElement("span", { style: { color: "var(--ink-3)" } }, s.n + " · " + fmtR(s.val))),
            React.createElement("div", { style: { height: 10, borderRadius: 99, background: "var(--bg-soft)", overflow: "hidden" } },
              React.createElement("div", { style: { width: Math.max(3, s.n / funnelMax * 100) + "%", height: "100%", borderRadius: 99, background: s.c, transition: "width .6s" } })))) )),
      // структура находок
      React.createElement("div", { className: "card" },
        React.createElement(CardHead, { title: "Структура находок", icon: "shield" }),
        React.createElement("div", { className: "card-pad" }, a.dist.length ? a.dist.map((d, i) =>
          React.createElement("div", { key: i, style: { marginBottom: 14 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 } },
              React.createElement("span", { style: { fontWeight: 600 } }, d.label), React.createElement("span", { style: { color: "var(--ink-3)" } }, d.pct + "%")),
            React.createElement("div", { style: { height: 9, borderRadius: 99, background: "var(--bg-soft)", overflow: "hidden" } },
              React.createElement("div", { style: { width: d.pct + "%", height: "100%", borderRadius: 99, background: d.c } })))) :
          React.createElement("div", { style: { textAlign: "center", color: "var(--ink-4)", fontSize: 13.5, padding: "20px 0" } }, "Нет находок")))),

    React.createElement(AIForecastCard, { a: a, ctx: ctx }),
    React.createElement(PaymentsCard, { ctx: ctx }),

    // эффективность AI (реальные счётчики)
    React.createElement("div", { className: "stat-grid", style: { marginTop: 20 } }, [
      { n: "98,2%", l: "Точность детекции", c: "#3B5BFF", bg: "#ECF0FF", ic: "sparkle" },
      { n: a.aiAccept + "%", l: "Подтверждено врачом", c: "#18b27a", bg: "#E2F6EE", ic: "check" },
      { n: "" + a.reports, l: "AI-заключений создано", c: "#f0a12e", bg: "#FCF0DC", ic: "doc" },
      { n: "" + (a.aiAccepted + a.aiRejected), l: "Решений по находкам", c: "#7c5cff", bg: "#efeaff", ic: "scan" }
    ].map((s, i) => React.createElement("div", { className: "stat", key: i },
      React.createElement("div", { className: "s-ic", style: { background: s.bg, color: s.c } }, React.createElement(Icon, { name: s.ic, size: 20 })),
      React.createElement("div", { className: "s-num" }, s.n), React.createElement("div", { className: "s-lbl" }, s.l)))));
}

/* ---------------- SETTINGS ---------------- */
function AISettingsCard({ ctx }) {
  const [key, setKey] = useState(() => RadixAI.getKey());
  const [am, setAm] = useState(() => RadixAI.models().analysis);
  const [cm, setCm] = useState(() => RadixAI.models().chat);
  const [vm, setVm] = useState(() => RadixAI.models().vision);
  const [base, setBase] = useState(() => RadixAI.baseUrl());
  const [proxy, setProxy] = useState(() => RadixAI.proxyUrl());
  const [sys, setSys] = useState(() => RadixAI.getSys());
  const [rfKey, setRfKey] = useState(() => RadixAI.roboKey());
  const [rfModel, setRfModel] = useState(() => RadixAI.roboModel());
  const [det, setDet] = useState(() => RadixAI.detectorUrl());
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState(null); // null | "wait" | "ok" | "err: …"
  function save() {
    RadixAI.configure(key.trim(), am.trim(), cm.trim(), vm.trim(), base.trim(), proxy.trim(), sys.trim());
    RadixAI.setDetector({ key: rfKey.trim(), model: rfModel.trim(), url: det.trim() });
    const on = [];
    if (RadixAI.hasKey()) on.push("LLM (тексты)");
    if (RadixAI.detectorOn()) on.push("детектор Roboflow");
    ctx.toast(on.length ? "Подключено: " + on.join(" + ") : "AI отключён — демо-режим");
  }
  function check() {
    RadixAI.configure(key.trim(), am.trim(), cm.trim(), vm.trim(), base.trim(), proxy.trim(), sys.trim());
    RadixAI.setDetector({ key: rfKey.trim(), model: rfModel.trim(), url: det.trim() });
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
        React.createElement("div", { style: { fontSize: 12, color: "var(--ink-4)", marginTop: 6 } }, "Ключ хранится только в этом браузере (localStorage) и отправляется напрямую на адрес API ниже.")),
      React.createElement("div", { style: { marginBottom: 14 } },
        React.createElement("label", { style: lbl }, "Адрес API"),
        React.createElement("input", { style: inp, value: base, onChange: e => setBase(e.target.value), placeholder: "https://api.openai.com/v1" }),
        React.createElement("div", { style: { fontSize: 12, color: "var(--ink-4)", marginTop: 6 } }, "Оставьте для OpenAI. Для прокси/шлюза (если ключ не в формате sk-…) укажите его базовый URL — запросы идут на «/chat/completions».")),
      React.createElement("div", { style: { marginBottom: 14 } },
        React.createElement("label", { style: lbl }, "Серверный прокси (рекомендуется)"),
        React.createElement("input", { style: inp, value: proxy, onChange: e => setProxy(e.target.value), placeholder: "https://<проект>.supabase.co/functions/v1/ai-proxy" }),
        React.createElement("div", { style: { fontSize: 12, color: "var(--ink-4)", marginTop: 6 } }, "Если задан — запросы идут через вашу Supabase-функцию, а ключ хранится на сервере (не в браузере). Поля «Ключ API» и «Адрес API» при этом не нужны. Обходит CORS и геоблок.")),
      React.createElement("div", { style: { padding: "12px 14px", border: "1px dashed var(--line)", borderRadius: 12, marginBottom: 14 } },
        React.createElement("div", { style: { fontWeight: 700, fontSize: 13.5, marginBottom: 2 } }, "Детектор Roboflow (точные рамки)"),
        React.createElement("div", { style: { fontSize: 12, color: "var(--ink-4)", marginBottom: 10 } }, "Заполни оба поля — и рамки находок будет ставить специализированная CV-модель (точнее LLM). Тексты/заключения остаются на LLM. Пусто — рамки делает vision-модель."),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Roboflow API-ключ"),
            React.createElement("input", { style: inp, value: rfKey, onChange: e => setRfKey(e.target.value), placeholder: "app.roboflow.com/settings/api" })),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Модель (project/version)"),
            React.createElement("input", { style: inp, value: rfModel, onChange: e => setRfModel(e.target.value), placeholder: "project-group13/dental-caries-detection-using-dl/3" }))),
        React.createElement("div", { style: { fontSize: 12, color: "var(--ink-4)", marginTop: 8 } }, "Продвинуто: если прямой вызов из браузера заблокирован (CORS) — вместо ключа/модели укажи Edge Function URL:"),
        React.createElement("input", { style: Object.assign({}, inp, { marginTop: 6 }), value: det, onChange: e => setDet(e.target.value), placeholder: "https://<проект>.supabase.co/functions/v1/dental-detect" })),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 } },
        React.createElement("div", null,
          React.createElement("label", { style: lbl }, "Анализ снимков (vision)"),
          React.createElement("input", { style: inp, value: vm, onChange: e => setVm(e.target.value) }),
          React.createElement("div", { style: { fontSize: 12, color: "var(--ink-4)", marginTop: 5 } }, "Чтение рентгена · мультимодальная")),
        React.createElement("div", null,
          React.createElement("label", { style: lbl }, "Отчёты и анализ"),
          React.createElement("input", { style: inp, value: am, onChange: e => setAm(e.target.value) }),
          React.createElement("div", { style: { fontSize: 12, color: "var(--ink-4)", marginTop: 5 } }, "Заключения, планы, тексты")),
        React.createElement("div", null,
          React.createElement("label", { style: lbl }, "Ассистент и чат"),
          React.createElement("input", { style: inp, value: cm, onChange: e => setCm(e.target.value) }),
          React.createElement("div", { style: { fontSize: 12, color: "var(--ink-4)", marginTop: 5 } }, "Диалог, команды, скоринг"))),
      React.createElement("div", { style: { marginBottom: 16 } },
        React.createElement("label", { style: lbl }, "Спец-инструкция для ИИ (промпт клиники)"),
        React.createElement("textarea", { style: Object.assign({}, inp, { minHeight: 96, resize: "vertical", lineHeight: 1.5 }), value: sys, onChange: e => setSys(e.target.value), placeholder: "Напр.: смотри снимок как опытный рентгенолог. Особое внимание — вторичный кариес под пломбами, периимплантит, пародонтальную убыль кости. Уверенность 90%+ ставь только при явных признаках, спорное помечай 50–69%. Не ставь окончательный диагноз — только находки для проверки врачом." }),
        React.createElement("div", { style: { fontSize: 12, color: "var(--ink-4)", marginTop: 6 } }, "Подмешивается в КАЖДЫЙ запрос к ИИ (анализ снимков, заключения, ассистент). Здесь вы задаёте тон, приоритеты и правила — это и есть «обучение» модели под вашу клинику без смены модели.")),
      React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } },
        React.createElement("button", { className: "btn-app pri", onClick: save }, React.createElement(Icon, { name: "check", size: 16 }), "Сохранить"),
        React.createElement("button", { className: "btn-app gho", onClick: check, disabled: test === "wait" }, React.createElement(Icon, { name: "sparkle", size: 16 }), test === "wait" ? "Проверка…" : "Проверить соединение"),
        test === "ok" ? React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "#18b27a" } }, "✓ Соединение работает") : null,
        test && test.indexOf("err") === 0 ? React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--danger)" } }, test.slice(5)) : null)));
}

function PriceCard({ ctx }) {
  const [prices, setPrices] = useState(() => {
    const saved = RadixStore.get("prices", {});
    const out = {};
    Object.keys(FIND_LIB).forEach(k => { out[k] = saved[k] != null ? saved[k] : FIND_LIB[k].price; });
    return out;
  });
  function save() {
    const clean = {};
    Object.keys(prices).forEach(k => { const v = Math.max(0, Math.round(+prices[k] || 0)); clean[k] = v; });
    RadixStore.set("prices", clean); setPrices(clean);
    ctx.toast("Прайс сохранён — сметы пересчитаны");
  }
  function reset() {
    RadixStore.set("prices", null);
    const out = {}; Object.keys(FIND_LIB).forEach(k => { out[k] = FIND_LIB[k].price; });
    setPrices(out); ctx.toast("Прайс сброшен к значениям по умолчанию");
  }
  return React.createElement("div", { className: "card", style: { marginBottom: 18 } },
    React.createElement(CardHead, { title: "Прайс клиники", icon: "cash" }),
    React.createElement("div", { className: "card-pad" },
      Object.keys(FIND_LIB).map((k, i, arr) =>
        React.createElement("div", { key: k, style: { display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" } },
          React.createElement("span", { style: { width: 10, height: 10, borderRadius: "50%", background: FIND_LIB[k].c, flexShrink: 0 } }),
          React.createElement("span", { style: { flex: 1, fontSize: 14.5, fontWeight: 600 } }, FIND_LIB[k].label),
          React.createElement("input", { type: "number", min: 0, step: 100, value: prices[k],
            onChange: e => setPrices(p => ({ ...p, [k]: e.target.value })),
            style: { width: 110, padding: "8px 11px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", textAlign: "right", outline: "none", background: "#fff", color: "var(--ink)" } }),
          React.createElement("span", { style: { color: "var(--ink-3)", fontSize: 13.5 } }, "₽"))),
      React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 14 } },
        React.createElement("button", { className: "btn-app pri", onClick: save }, React.createElement(Icon, { name: "check", size: 16 }), "Сохранить прайс"),
        React.createElement("button", { className: "btn-app gho", onClick: reset }, "Сбросить"))));
}

function MarketingCard({ ctx }) {
  const [m, setM] = useState(() => getMarketing());
  const inp = { width: "100%", padding: "10px 13px", border: "1px solid var(--line)", borderRadius: 11, fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff", color: "var(--ink)" };
  const lbl = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", marginBottom: 5 };
  function save() {
    const clean = Object.assign({}, m, { discount: Math.max(0, Math.min(50, Math.round(+m.discount || 0))), days: Math.max(1, Math.min(90, Math.round(+m.days || 14))) });
    RadixStore.set("marketing", clean); setM(clean);
    ctx.toast("Маркетинг сохранён — новые отчёты используют эти настройки");
  }
  function Toggle({ on, onClick, children }) {
    return React.createElement("button", { onClick, style: { display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: 999, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", border: "1.5px solid " + (on ? "var(--primary)" : "var(--line)"), background: on ? "var(--primary-tint)" : "#fff", color: on ? "var(--primary-700)" : "var(--ink-3)" } },
      React.createElement("span", { style: { width: 8, height: 8, borderRadius: "50%", background: on ? "var(--good)" : "var(--ink-4)" } }), children);
  }
  const MECH = [["deadline", "Скидка с дедлайном"], ["delay", "График «цена откладывания»"], ["bonus", "Бонус-пакет"]];
  return React.createElement("div", { className: "card", style: { marginBottom: 18 } },
    React.createElement(CardHead, { title: "Маркетинг в отчётах пациентов", icon: "chart" }),
    React.createElement("div", { className: "card-pad" },
      React.createElement("p", { style: { fontSize: 13, color: "var(--ink-3)", marginBottom: 14 } }, "Эти механики встраиваются в персональный отчёт пациента. Настройте под акции вашей клиники — выключенные блоки в отчёт не попадают."),
      React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 } },
        MECH.map(([k, l]) => React.createElement(Toggle, { key: k, on: m.mech[k] !== false, onClick: () => setM({ ...m, mech: { ...m.mech, [k]: m.mech[k] === false } }) }, l))),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 } },
        React.createElement("div", null, React.createElement("label", { style: lbl }, "Скидка, %"),
          React.createElement("input", { style: inp, type: "number", min: 0, max: 50, value: m.discount, onChange: e => setM({ ...m, discount: e.target.value }) })),
        React.createElement("div", null, React.createElement("label", { style: lbl }, "Срок действия, дней"),
          React.createElement("input", { style: inp, type: "number", min: 1, max: 90, value: m.days, onChange: e => setM({ ...m, days: e.target.value }) }))),
      React.createElement("div", { style: { marginBottom: 14 } },
        React.createElement("label", { style: lbl }, "Текст бонуса"),
        React.createElement("input", { style: inp, value: m.bonusText, onChange: e => setM({ ...m, bonusText: e.target.value }) })),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 } },
        React.createElement("div", null, React.createElement("label", { style: lbl }, "Телефон клиники"),
          React.createElement("input", { style: inp, value: m.phone, onChange: e => setM({ ...m, phone: e.target.value }) })),
        React.createElement("div", null, React.createElement("label", { style: lbl }, "Адрес"),
          React.createElement("input", { style: inp, value: m.address, onChange: e => setM({ ...m, address: e.target.value }) }))),
      React.createElement("label", { style: lbl }, "Допуслуги в блоке «Рекомендовано именно вам»"),
      React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 } },
        UPSELLS.map(u => React.createElement(Toggle, { key: u.id, on: m.upsells[u.id] !== false, onClick: () => setM({ ...m, upsells: { ...m.upsells, [u.id]: m.upsells[u.id] === false } }) }, u.label))),
      React.createElement("button", { className: "btn-app pri", onClick: save }, React.createElement(Icon, { name: "check", size: 16 }), "Сохранить маркетинг")));
}

function DataCard({ ctx }) {
  const fileRef = useRef(null);
  function collect() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf("rdx_") === 0) out[k] = localStorage.getItem(k); // ключ AI (radix_ai_*) не попадает
    }
    return out;
  }
  function doExport() {
    const data = { app: "radix", exported: new Date().toISOString(), keys: collect() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "radix-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    ctx.toast("Резервная копия скачана (" + Object.keys(data.keys).length + " записей)");
  }
  function doImport(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = ""; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const data = JSON.parse(rd.result);
        if (!data || data.app !== "radix" || !data.keys) throw new Error("это не файл резервной копии Радикс");
        Object.keys(data.keys).forEach(k => { if (k.indexOf("rdx_") === 0) localStorage.setItem(k, data.keys[k]); });
        ctx.toast("Данные восстановлены — перезагружаю…");
        setTimeout(() => location.reload(), 900);
      } catch (err) { ctx.toast("Импорт не удался: " + err.message); }
    };
    rd.readAsText(f);
  }
  function doClear() {
    if (!window.confirm("Удалить все данные клиники из этого браузера (пациенты, снимки, заключения, воронка)? Ключ AI останется.")) return;
    const keys = Object.keys(collect());
    keys.forEach(k => localStorage.removeItem(k));
    ctx.toast("Данные очищены — перезагружаю…");
    setTimeout(() => location.reload(), 900);
  }
  return React.createElement("div", { className: "card", style: { marginBottom: 18 } },
    React.createElement(CardHead, { title: "Данные клиники", icon: "shield" }),
    React.createElement("div", { className: "card-pad" },
      React.createElement("p", { style: { fontSize: 13.5, color: "var(--ink-3)", marginBottom: 14 } },
        "Все данные хранятся в этом браузере. Скачайте копию, чтобы перенести клинику на другой компьютер или не потерять при очистке браузера. Ключ AI в копию не входит."),
      React.createElement("input", { ref: fileRef, type: "file", accept: "application/json", style: { display: "none" }, onChange: doImport }),
      React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } },
        React.createElement("button", { className: "btn-app pri", onClick: doExport }, React.createElement(Icon, { name: "doc", size: 16 }), "Экспорт данных"),
        React.createElement("button", { className: "btn-app gho", onClick: () => fileRef.current && fileRef.current.click() }, React.createElement(Icon, { name: "share", size: 16 }), "Импорт из файла"),
        React.createElement("button", { className: "btn-app gho", style: { color: "var(--danger)" }, onClick: doClear }, React.createElement(Icon, { name: "x", size: 16 }), "Очистить данные"))));
}

function Settings({ ctx }) {
  const integ = [["IDENT", true], ["Dental4Web", true], ["StomX", true], ["MedFlow", true], ["КлиникаПро", false], ["1С:Медицина", false]];
  return React.createElement("div", { className: "content-pad", style: { maxWidth: 820 } },
    React.createElement("h1", { style: { fontSize: 26, fontFamily: "var(--font-display)", marginBottom: 4 } }, "Настройки"),
    React.createElement("p", { style: { color: "var(--ink-3)", marginBottom: 22 } }, "Интеграции, модель и параметры клиники"),
    React.createElement("div", { className: "card", style: { marginBottom: 18 } },
      React.createElement(CardHead, { title: "Моя роль в клинике", icon: "users" }),
      React.createElement("div", { className: "card-pad", style: { display: "flex", gap: 10, flexWrap: "wrap" } },
        [["doc", "Врач", "снимки, планы, пациенты"], ["admin", "Админ", "CRM, расписание, биллинг"], ["assist", "Ассистент", "помощь врачу, без финансов"]].map(([k, l, s]) =>
          React.createElement("button", { key: k, onClick: () => { ctx.setRole(k); ctx.toast("Роль: " + l + " — разделы обновлены"); },
            style: { flex: "1 1 140px", textAlign: "left", padding: "13px 15px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
              border: "1.5px solid " + (ctx.role === k ? "var(--primary)" : "var(--line)"),
              background: ctx.role === k ? "var(--primary-tint)" : "#fff" } },
            React.createElement("div", { style: { fontWeight: 700, fontSize: 14.5, color: ctx.role === k ? "var(--primary-700)" : "var(--ink)" } }, l),
            React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-3)", marginTop: 3 } }, s))))),
    React.createElement(PriceCard, { ctx: ctx }),
    React.createElement(MarketingCard, { ctx: ctx }),
    React.createElement(AISettingsCard, { ctx: ctx }),
    React.createElement(DataCard, { ctx: ctx }),
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
