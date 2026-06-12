/* ============================================================
   Радикс Продукт — views: Dashboard, Patients, Analysis
   ============================================================ */

/* ---------------- DASHBOARD ---------------- */
function BriefingCard({ ctx, schedule, bookingsN, monthSum }) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const cached = RadixStore.get("briefing", null);
  const [brief, setBrief] = useState(() => (cached && cached.day === todayKey) ? cached : null);
  const [busy, setBusy] = useState(false);
  function buildSummary() {
    const probl = PATIENTS.filter(p => p.flag !== "ok").map(p => p.name + " (" + statusTag(p.flag).t.toLowerCase() + ")");
    const pipeline = CRM_STAGES.map(s => {
      const st = RadixStore.get("crm_stages", {});
      const n = CRM_CARDS.filter(c => (st[c.id] || c.stage) === s.id).length;
      return s.t + ": " + n;
    }).join(", ");
    return "Приёмы сегодня (" + schedule.length + "): " + (schedule.map(a => a.t + " " + a.n + " — " + a.w).join("; ") || "нет") +
      ".\nНовые онлайн-заявки: " + bookingsN +
      ".\nВоронка: " + pipeline +
      ".\nОплачено за месяц: " + monthSum.toLocaleString("ru-RU") + " ₽." +
      "\nПациенты, требующие внимания: " + (probl.join(", ") || "нет") + ".";
  }
  function run() {
    setBusy(true);
    const live = window.RadixAI && RadixAI.hasKey();
    const demo = "• Сегодня " + schedule.length + " приёмов — первый в " + (schedule[0] ? schedule[0].t + " (" + schedule[0].n + ")" : "—") + ".\n" +
      (bookingsN ? "• " + bookingsN + " новых заявок с сайта ждут подтверждения в расписании.\n" : "") +
      "• Оплачено за месяц: " + monthSum.toLocaleString("ru-RU") + " ₽.\n" +
      "• Пациенты с активными находками: " + PATIENTS.filter(p => p.flag !== "ok").length + " — проверьте статусы планов.\n" +
      "Рекомендация: начните с подтверждения заявок и отправки незакрытых планов лечения.";
    const p = live ? RadixAI.briefing(buildSummary()) : new Promise(res => setTimeout(() => res(demo), 700));
    p.then(text => {
      const b = { day: todayKey, text, mode: live ? RadixAI.models().chat : "демо" };
      RadixStore.set("briefing", b); setBrief(b); setBusy(false);
    }).catch(err => { setBusy(false); ctx.toast("AI недоступен: " + err.message); });
  }
  return React.createElement("div", { className: "card", style: { marginTop: 20 } },
    React.createElement(CardHead, { title: "AI-брифинг дня", icon: "bolt",
      right: React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
        brief ? React.createElement(Tag, { c: brief.mode === "демо" ? "var(--warn)" : "#18b27a", tint: brief.mode === "демо" ? "var(--warn-tint)" : "#E2F6EE" }, brief.mode) : null,
        React.createElement("button", { className: "btn-app gho sm", onClick: run, disabled: busy }, busy ? "Готовлю…" : brief ? "Обновить" : "Собрать брифинг")) }),
    React.createElement("div", { style: { padding: "16px 20px", whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.65, color: brief ? "var(--ink)" : "var(--ink-4)" } },
      brief ? brief.text : "Сводка дня одной кнопкой: приёмы, заявки, деньги, на что обратить внимание. Кэшируется на день."));
}

function Dashboard({ ctx }) {
  const uname = (RadixStore.get("user", null) || { name: "Алексей Петров" }).name.split(" ")[0];
  const h = new Date().getHours();
  const hello = h < 5 ? "Доброй ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер";
  const today = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  const bookingsN = RadixStore.get("bookings", []).length;
  const reportsN = countReports();
  const monthSum = paymentsThisMonth().reduce((s, p) => s + p.amount, 0);
  const fmtK = n => n >= 1000 ? Math.round(n / 1000).toLocaleString("ru-RU") + " тыс ₽" : n + " ₽";
  const stats = [
    { ic: "users", c: "#3B5BFF", bg: "#ECF0FF", num: "" + PATIENTS.length, lbl: "Пациентов в базе", tr: "живые данные", up: true },
    { ic: "doc", c: "#7c5cff", bg: "#efeaff", num: "" + reportsN, lbl: "AI-заключений сохранено", tr: "все пациенты", up: true },
    { ic: "bell", c: "#f0533f", bg: "#FCE6E2", num: "" + bookingsN, lbl: "Онлайн-заявки ждут", tr: bookingsN ? "подтвердите" : "пусто", up: !bookingsN },
    { ic: "cash", c: "#18b27a", bg: "#E2F6EE", num: monthSum ? fmtK(monthSum) : "0 ₽", lbl: "Оплачено за месяц", tr: "из планов", up: true }
  ];
  const fmtTime = s => Math.floor(s) + ":" + ("0" + Math.round((s % 1) * 60)).slice(-2);
  const schedule = CAL_EVENTS.filter(e => e.day === 0).sort((a, b) => a.start - b.start).slice(0, 6)
    .map((e, i) => ({ t: fmtTime(e.start), n: e.name, w: e.work, c: e.color, pid: e.pid, st: i === 0 ? "Сейчас" : "" }));
  const queue = PATIENTS.filter(p => p.flag !== "ok").slice(0, 3);
  return React.createElement("div", { className: "content-pad" },
    React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 24, flexWrap: "wrap" } },
      React.createElement("div", null,
        React.createElement("h1", { style: { fontSize: 28, fontFamily: "var(--font-display)", letterSpacing: "-.02em" } }, hello + ", " + uname),
        React.createElement("p", { style: { color: "var(--ink-3)", marginTop: 4 } }, today.charAt(0).toUpperCase() + today.slice(1) + " · " + schedule.length + " приёмов сегодня" + (bookingsN ? " · " + bookingsN + " новых заявок" : ""))),
      React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 10 } },
        React.createElement("button", { className: "btn-app gho", onClick: () => ctx.setView("assistant") }, React.createElement(Icon, { name: "sparkle", size: 16 }), "Спросить ИИ"),
        React.createElement("button", { className: "btn-app pri", onClick: () => ctx.setView("patients") }, React.createElement(Icon, { name: "plus", size: 16 }), "Новый анализ"))),

    React.createElement("div", { className: "stat-grid" }, stats.map((s, i) =>
      React.createElement("div", { className: "stat", key: i },
        React.createElement("div", { className: "s-ic", style: { background: s.bg, color: s.c } }, React.createElement(Icon, { name: s.ic, size: 20 })),
        React.createElement("div", { className: "s-num" }, s.num),
        React.createElement("div", { className: "s-lbl" }, s.lbl),
        React.createElement("div", { className: "s-trend " + (s.up ? "s-up" : "s-down") }, React.createElement(Icon, { name: "arrow", size: 13, style: { transform: "rotate(-45deg)" } }), s.tr)))),

    React.createElement(BriefingCard, { ctx, schedule, bookingsN, monthSum }),

    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginTop: 20, alignItems: "start" } },
      React.createElement("div", { className: "card" },
        React.createElement(CardHead, { title: "Расписание на сегодня", icon: "calendar",
          right: React.createElement("button", { className: "btn-app gho sm", onClick: () => ctx.setView("calendar") }, "Весь день") }),
        React.createElement("div", null, schedule.map((a, i) =>
          React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < schedule.length - 1 ? "1px solid var(--line)" : "none" } },
            React.createElement("div", { style: { fontWeight: 700, fontFamily: "var(--font-display)", width: 52, color: "var(--ink-2)" } }, a.t),
            React.createElement(Avatar, { name: a.n, color: a.c, size: 38 }),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontWeight: 600, fontSize: 14.5 } }, a.n),
              React.createElement("div", { style: { fontSize: 13, color: "var(--ink-3)" } }, a.w)),
            a.st ? React.createElement(Tag, { c: "#18b27a", tint: "#E2F6EE" }, a.st) :
              React.createElement("button", { className: "btn-app gho sm", onClick: () => { if (a.pid && PATIENTS.find(p => p.id === a.pid)) ctx.openPatient(a.pid); else ctx.setView("calendar"); } }, "Открыть")))) ),

      React.createElement("div", { className: "card", style: { overflow: "hidden" } },
        React.createElement(CardHead, { title: "Очередь анализа ИИ", icon: "sparkle" }),
        React.createElement("div", { style: { padding: 14 } }, queue.map((p, i) => {
          const st = statusTag(p.flag);
          return React.createElement("button", { key: p.id, onClick: () => ctx.openAnalysis(p.id),
            style: { display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", padding: 11, border: "1px solid var(--line)", borderRadius: 12, background: "#fff", cursor: "pointer", marginBottom: 8, fontFamily: "inherit" } },
            React.createElement(Avatar, { name: p.name, color: p.color, size: 36 }),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { style: { fontWeight: 600, fontSize: 14 } }, p.name),
              React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-3)" } }, p.findings.length + " находки · ожидает проверки")),
            React.createElement("span", { style: { color: "var(--primary)" } }, React.createElement(Icon, { name: "arrow", size: 16 }))); })),
        React.createElement("div", { style: { margin: "0 14px 14px", padding: 14, borderRadius: 12, background: "linear-gradient(160deg,#11182e,#0a0f1f)", color: "var(--on-dark)", position: "relative", overflow: "hidden" } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13.5 } }, React.createElement(Icon, { name: "bolt", size: 15 }), "Радикс-Vision 3.1"),
          React.createElement("div", { style: { fontSize: 12.5, color: "var(--on-dark-2)", marginTop: 5 } }, "Средняя точность детекции за неделю — 98,2%. Подтверждено врачом: 91% находок."))))
  );
}

/* ---------------- PATIENTS (master-detail) ---------------- */
function PatientForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(() => initial || { name: "", age: "", phone: "", ins: "ДМС" });
  const inp = { width: "100%", padding: "11px 14px", border: "1px solid var(--line)", borderRadius: 12, fontSize: 14.5, fontFamily: "inherit", outline: "none", background: "#fff", color: "var(--ink)" };
  const lbl = { display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink-2)", margin: "14px 0 6px" };
  function save() {
    if (!f.name.trim()) return;
    onSave({ name: f.name.trim(), age: f.age ? +f.age : "—", phone: f.phone.trim(), ins: f.ins });
  }
  return React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,8,5,.45)", display: "grid", placeItems: "center", padding: 16 }, onClick: onClose },
    React.createElement("div", { className: "card", style: { width: "min(440px, 100%)", padding: 24 }, onClick: e => e.stopPropagation() },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 } },
        React.createElement("h3", { style: { fontFamily: "var(--font-display)", fontSize: 19, flex: 1 } }, initial ? "Редактировать пациента" : "Новый пациент"),
        React.createElement("button", { className: "icon-btn", onClick: onClose }, React.createElement(Icon, { name: "x", size: 16 }))),
      React.createElement("label", { style: lbl }, "Имя и фамилия"),
      React.createElement("input", { style: inp, value: f.name, autoFocus: true, placeholder: "Иван Иванов", onChange: e => setF({ ...f, name: e.target.value }) }),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
        React.createElement("div", null,
          React.createElement("label", { style: lbl }, "Возраст"),
          React.createElement("input", { style: inp, type: "number", min: 1, max: 120, value: f.age === "—" ? "" : f.age, onChange: e => setF({ ...f, age: e.target.value }) })),
        React.createElement("div", null,
          React.createElement("label", { style: lbl }, "Страховка"),
          React.createElement("select", { style: inp, value: f.ins, onChange: e => setF({ ...f, ins: e.target.value }) },
            ["ДМС", "ОМС", "—"].map(v => React.createElement("option", { key: v, value: v }, v))))),
      React.createElement("label", { style: lbl }, "Телефон"),
      React.createElement("input", { style: inp, value: f.phone, placeholder: "+7 ___ ___-__-__", onChange: e => setF({ ...f, phone: e.target.value }) }),
      React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 20 } },
        React.createElement("button", { className: "btn-app pri", style: { flex: 1 }, disabled: !f.name.trim(), onClick: save }, React.createElement(Icon, { name: "check", size: 16 }), initial ? "Сохранить" : "Создать"),
        React.createElement("button", { className: "btn-app gho", onClick: onClose }, "Отмена"))));
}

function Patients({ ctx }) {
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null); // null | "new" | patient
  const list = PATIENTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  const patient = PATIENTS.find(p => p.id === ctx.patientId) || null;
  function saveForm(data) {
    if (form === "new") {
      const p = addPatient(data);
      ctx.setPatientId(p.id);
      ctx.toast("Пациент создан: " + p.name);
    } else {
      updatePatient(form.id, data);
      ctx.toast("Карточка обновлена");
    }
    setForm(null);
  }
  return React.createElement("div", { className: "content-pad" },
    form ? React.createElement(PatientForm, { initial: form === "new" ? null : { name: form.name, age: form.age, phone: form.phone, ins: form.ins }, onSave: saveForm, onClose: () => setForm(null) }) : null,
    React.createElement("div", { className: "split" },
      React.createElement("div", null,
        React.createElement("button", { className: "btn-app pri", style: { width: "100%", marginBottom: 12 }, onClick: () => setForm("new") },
          React.createElement(Icon, { name: "plus", size: 16 }), "Новый пациент"),
        React.createElement("div", { className: "side-search", style: { margin: "0 0 12px" } },
          React.createElement(Icon, { name: "search", size: 16 }),
          React.createElement("input", { placeholder: "Поиск пациента…", value: q, onChange: e => setQ(e.target.value) })),
        React.createElement("div", { className: "plist" }, list.map(p => {
          const st = statusTag(p.flag);
          return React.createElement("button", { key: p.id, className: "pcard" + (ctx.patientId === p.id ? " sel" : ""), onClick: () => ctx.setPatientId(p.id) },
            React.createElement(Avatar, { name: p.name, color: p.color }),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { className: "p-name" }, p.name),
              React.createElement("div", { className: "p-meta" }, p.age + " лет · " + p.ins)),
            React.createElement("span", { className: "p-flag" }, React.createElement("i", { style: { display: "block", width: 9, height: 9, borderRadius: "50%", background: st.c } }))); })),
        list.length === 0 ? React.createElement("div", { className: "empty" }, "Никого не найдено") : null),
      patient ? React.createElement(PatientDetail, { patient, ctx, onEdit: () => setForm(patient) }) :
        React.createElement("div", { className: "card empty" },
          React.createElement("div", { className: "e-ic" }, React.createElement(Icon, { name: "users", size: 28 })),
          React.createElement("div", { style: { fontWeight: 600, color: "var(--ink-2)" } }, "Выберите пациента"),
          React.createElement("div", { style: { fontSize: 14 } }, "Откройте карточку слева, чтобы увидеть снимки, находки и план лечения")))
  );
}

function PatientDetail({ patient, ctx, onEdit }) {
  function archive() {
    if (!window.confirm("Перенести пациента " + patient.name + " в архив?")) return;
    archivePatient(patient.id);
    if (PATIENTS.length) ctx.setPatientId(PATIENTS[0].id);
    ctx.toast("Пациент в архиве: " + patient.name);
  }
  const [tab, setTab] = useState("over");
  const [tooth, setTooth] = useState(null);
  const st = statusTag(patient.flag);
  const tabs = [["over", "Обзор"], ["shots", "Снимки"], ["chart", "Зубная формула"], ["plan", "План лечения"], ["reports", "Заключения"], ["team", "Команда"]];
  return React.createElement("div", { className: "card" },
    React.createElement("div", { className: "pdetail-head" },
      React.createElement(Avatar, { name: patient.name, color: patient.color, size: 64, radius: "18px", fontSize: 24 }),
      React.createElement("div", { style: { flex: 1 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
          React.createElement("h2", { style: { fontSize: 22, fontFamily: "var(--font-display)" } }, patient.name),
          React.createElement(Tag, { c: st.c, tint: st.tint }, st.t)),
        React.createElement("div", { style: { color: "var(--ink-3)", fontSize: 14, marginTop: 3 } },
          patient.age + " лет · пациент с " + patient.since + " · " + patient.ins + " · " + patient.phone)),
      React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
        onEdit ? React.createElement("button", { className: "btn-app gho", onClick: onEdit }, React.createElement(Icon, { name: "settings", size: 16 }), "Редактировать") : null,
        onEdit ? React.createElement("button", { className: "btn-app gho", title: "В архив", onClick: archive }, React.createElement(Icon, { name: "x", size: 16 })) : null,
        React.createElement("button", { className: "btn-app gho", onClick: () => ctx.openAssistant(patient.id) }, React.createElement(Icon, { name: "chat", size: 16 }), "Спросить ИИ"),
        React.createElement("button", { className: "btn-app pri", onClick: () => ctx.openAnalysis(patient.id) }, React.createElement(Icon, { name: "scan", size: 16 }), "Анализ снимка"))),
    React.createElement("div", { className: "tabs" }, tabs.map(([k, l]) =>
      React.createElement("button", { key: k, className: "tab" + (tab === k ? " active" : ""), onClick: () => setTab(k) }, l))),
    React.createElement("div", { className: "card-pad" },
      tab === "over" ? React.createElement(PatientOverview, { patient, ctx }) :
      tab === "shots" ? React.createElement(PatientShots, { patient, ctx }) :
      tab === "chart" ? React.createElement("div", null,
        React.createElement(ToothChart, { patient, onTooth: (n, info) => setTooth({ n, info }) }),
        tooth ? React.createElement("div", { style: { marginTop: 18, padding: 16, borderRadius: 12, background: "var(--bg-soft)", border: "1px solid var(--line)" } },
          React.createElement("div", { style: { fontWeight: 700 } }, "Зуб " + tooth.n),
          React.createElement("div", { style: { color: "var(--ink-3)", fontSize: 14, marginTop: 4 } },
            tooth.info ? tooth.info.label + " · уверенность " + tooth.info.pc + "%" : "Патологий не обнаружено")) :
          React.createElement("div", { style: { marginTop: 16, fontSize: 14, color: "var(--ink-3)" } }, "Нажмите на зуб, чтобы увидеть историю и находки")) :
      tab === "reports" ? React.createElement(PatientReports, { patient, ctx }) :
      tab === "team" ? React.createElement(PatientTeam, { patient, ctx }) :
      React.createElement(PlanBuilder, { patient, ctx, embedded: true }))
  );
}

function PatientReports({ patient, ctx }) {
  const [open, setOpen] = useState(0);
  const reports = RadixStore.get("reports_" + patient.id, []);
  const KINDS = { doc: "AI-заключение", second: "Второе мнение", dyn: "Динамика", dict: "Из диктовки", patient: "Для пациента" };
  if (!reports.length) return React.createElement("div", { style: { textAlign: "center", color: "var(--ink-4)", padding: "34px 0", fontSize: 14.5 } },
    "Заключений пока нет.", React.createElement("br"),
    React.createElement("button", { className: "btn-app pri", style: { marginTop: 14 }, onClick: () => ctx.openAnalysis(patient.id) }, React.createElement(Icon, { name: "scan", size: 16 }), "Сделать анализ снимка"));
  return React.createElement("div", null, reports.map((r, i) =>
    React.createElement("div", { key: i, style: { border: "1px solid var(--line)", borderRadius: 13, marginBottom: 10, overflow: "hidden", background: "#fff" } },
      React.createElement("button", { onClick: () => setOpen(open === i ? -1 : i),
        style: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 15px", textAlign: "left", fontFamily: "inherit", cursor: "pointer", background: "none" } },
        React.createElement("span", { style: { color: "var(--primary)" } }, React.createElement(Icon, { name: "doc", size: 16 })),
        React.createElement("b", { style: { fontSize: 14 } }, KINDS[r.kind] || "Заключение"),
        React.createElement("span", { style: { fontSize: 11.5, fontWeight: 700, color: r.mode === "демо" ? "var(--warn)" : "var(--good)", background: r.mode === "демо" ? "var(--warn-tint)" : "var(--good-tint)", padding: "2px 8px", borderRadius: 999 } }, r.mode),
        React.createElement("span", { style: { marginLeft: "auto", fontSize: 12.5, color: "var(--ink-3)" } }, r.date),
        React.createElement(Icon, { name: "arrow", size: 14, style: { transform: open === i ? "rotate(90deg)" : "rotate(0)", transition: "transform .2s", color: "var(--ink-3)" } })),
      open === i ? React.createElement("div", { style: { padding: "0 15px 14px" } },
        React.createElement("div", { style: { whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.6, padding: "12px 14px", background: "var(--bg-soft)", borderRadius: 10 } }, r.text),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 10 } },
          React.createElement("button", { className: "btn-app gho sm", onClick: () => {
            const doctor = (RadixStore.get("user", null) || { name: "Алексей Петров" }).name;
            RadixPrint.open({ title: (KINDS[r.kind] || "Заключение") + " от " + r.date, patient: patient.name, doctor, bodyText: r.text });
          } }, React.createElement(Icon, { name: "print", size: 14 }), "Печать"),
          React.createElement("button", { className: "btn-app gho sm", onClick: () => { navigator.clipboard && navigator.clipboard.writeText(r.text); ctx.toast("Скопировано"); } }, "Копировать"))) : null)));
}

function PatientTeam({ patient, ctx }) {
  const [notes, setNotes] = useState(() => (PATIENT_NOTES[patient.id] || []).slice());
  const [val, setVal] = useState("");
  function send() {
    const t = val.trim(); if (!t) return;
    setNotes(n => [...n, { who: "Алексей Петров", color: "#18A06E", text: t, time: "сейчас", me: true }]);
    setVal("");
  }
  return React.createElement("div", null,
    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 } },
      React.createElement("div", { style: { display: "flex" } }, TEAM.slice(0, 4).map((u, i) =>
        React.createElement("div", { key: i, style: { marginLeft: i ? -10 : 0, border: "2px solid var(--bg)", borderRadius: "50%" } }, React.createElement(Avatar, { name: u.name, color: u.color, size: 30, fontSize: 11 })))),
      React.createElement("span", { style: { fontSize: 13.5, color: "var(--ink-3)" } }, "Команда видит обсуждение этого пациента")),
    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 } }, notes.length ? notes.map((m, i) =>
      React.createElement("div", { key: i, style: { display: "flex", gap: 11, flexDirection: m.me ? "row-reverse" : "row" } },
        React.createElement(Avatar, { name: m.who, color: m.color, size: 34, radius: "11px", fontSize: 12 }),
        React.createElement("div", { style: { maxWidth: "78%" } },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--ink-3)", marginBottom: 3, textAlign: m.me ? "right" : "left" } }, m.who.split(" ")[0] + " · " + m.time),
          React.createElement("div", { style: { padding: "11px 14px", borderRadius: 15, fontSize: 14.5, lineHeight: 1.5, background: m.me ? "var(--blue)" : "var(--bg-soft)", color: m.me ? "#fff" : "var(--ink)", border: m.me ? "none" : "1px solid var(--line)" } }, m.text)))) :
      React.createElement("div", { style: { textAlign: "center", color: "var(--ink-4)", fontSize: 14, padding: "24px 0" } }, "Обсуждений пока нет — начните первым")),
    React.createElement("div", { style: { display: "flex", gap: 9, alignItems: "center" } },
      React.createElement("input", { className: "", placeholder: "Напишите команде… (упомяните через @)", value: val, onChange: e => setVal(e.target.value), onKeyDown: e => { if (e.key === "Enter") send(); }, style: { flex: 1, border: "1px solid var(--line)", background: "var(--bg-soft)", borderRadius: 999, padding: "12px 18px", font: "inherit", fontSize: 14.5, outline: "none", color: "var(--ink)" } }),
      React.createElement("button", { className: "btn-app pri", onClick: send }, React.createElement(Icon, { name: "send", size: 16 }), "Отправить")));
}

function PatientOverview({ patient, ctx }) {
  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 } },
    React.createElement("div", null,
      React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 } }, "Находки на последнем снимке"),
      patient.findings.map((f, i) => { const info = findingInfo(f); return React.createElement("div", { key: i, className: "finding", onClick: () => ctx.openAnalysis(patient.id), style: { marginTop: i ? 9 : 0 } },
        React.createElement("div", { className: "f-ic", style: { background: info.tint, color: info.c } }, React.createElement(Icon, { name: "tooth", size: 18 })),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { className: "f-t" }, info.label),
          React.createElement("div", { className: "f-s" }, "Зуб " + info.tooth + " · " + info.loc)),
        React.createElement("div", { style: { textAlign: "right" } },
          React.createElement("div", { style: { fontWeight: 800, fontFamily: "var(--font-display)", color: info.c } }, info.pc + "%"),
          React.createElement("div", { style: { fontSize: 11, color: "var(--ink-4)" } }, info.sev))); })),
    React.createElement("div", null,
      React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 } }, "Ближайший визит"),
      React.createElement("div", { style: { padding: 16, borderRadius: 14, background: "var(--primary-tint)", display: "flex", alignItems: "center", gap: 12, marginBottom: 18 } },
        React.createElement("span", { style: { color: "var(--primary)" } }, React.createElement(Icon, { name: "calendar", size: 22 })),
        React.createElement("div", null,
          React.createElement("div", { style: { fontWeight: 700, color: "var(--primary-700)" } }, patient.next === "—" ? "Не назначен" : patient.next),
          React.createElement("div", { style: { fontSize: 13, color: "var(--primary-700)", opacity: .8 } }, patient.next === "—" ? "Запланируйте следующий приём" : "Плановый приём"))),
      React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 } }, "История визитов"),
      patient.visits.map((v, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 11, fontSize: 14, padding: "7px 0" } },
        React.createElement("span", { style: { width: 9, height: 9, borderRadius: "50%", background: v.c, flex: "0 0 auto" } }),
        React.createElement("span", { style: { fontWeight: 600 } }, v.t),
        React.createElement("span", { style: { marginLeft: "auto", color: "var(--ink-3)", fontSize: 13 } }, v.d))))
  );
}

function PatientShots({ patient, ctx }) {
  const shots = [
    { t: "Bitewing справа", d: "12.09.2025", main: true },
    { t: "Прицельный 26", d: "12.09.2025" },
    { t: "ОПТГ", d: "21.02.2025" }
  ];
  return React.createElement("div", null,
    React.createElement("div", { style: { display: "flex", alignItems: "center", marginBottom: 14 } },
      React.createElement("div", { style: { fontSize: 14, color: "var(--ink-3)" } }, "3 снимка · нажмите для AI-анализа"),
      React.createElement("button", { className: "btn-app gho sm", style: { marginLeft: "auto" } }, React.createElement(Icon, { name: "plus", size: 14 }), "Загрузить снимок")),
    React.createElement("div", { className: "gallery" }, shots.map((s, i) =>
      React.createElement("div", { key: i, className: "shot", onClick: () => ctx.openAnalysis(patient.id) },
        React.createElement("div", { className: "shot-img" }, React.createElement(Arch, Object.assign({}, patient.arch, i ? { restoreAt: null } : {})),
          s.main ? React.createElement("span", { style: { position: "absolute", top: 8, left: 8, fontSize: 10.5, fontWeight: 700, color: "#fff", background: "var(--primary)", padding: "3px 7px", borderRadius: 6 } }, patient.findings.length + " находки") : null),
        React.createElement("div", { className: "shot-meta" },
          React.createElement("span", { className: "sm-t" }, s.t),
          React.createElement("span", { className: "sm-d" }, s.d)))))
  );
}

/* ---------------- ANALYSIS VIEWER (enhanced) ---------------- */
function Analysis({ ctx }) {
  const patient = PATIENTS.find(p => p.id === ctx.patientId);
  const [hot, setHot] = useState(-1);
  const [showDet, setShowDet] = useState(true);
  const [decided, setDecided] = useState(() => RadixStore.get("decided_" + ctx.patientId, {}));
  const [compare, setCompare] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [invert, setInvert] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [filter, setFilter] = useState("all");   // all | caries | tartar | periap | resto
  const [sort, setSort] = useState("conf");        // conf | tooth
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [minPc, setMinPc] = useState(70);
  const [aiRep, setAiRep] = useState(null); // { loading, kind, text, mode }
  const saved = RadixStore.get("img_" + ctx.patientId, null);
  const [queue, setQueue] = useState([]); // очередь мульти-загрузки
  const [dict, setDict] = useState(null); // { on, text } — голосовая диктовка
  const recRef = useRef(null);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const [img, setImg] = useState(saved ? saved.url : null);           // dataURL загруженного снимка
  const [imgFinds, setImgFinds] = useState(saved ? saved.finds : null); // находки vision-анализа
  const fileRef = useRef(null);
  useEffect(() => {
    setDecided(RadixStore.get("decided_" + ctx.patientId, {}));
    const s = RadixStore.get("img_" + ctx.patientId, null);
    setImg(s ? s.url : null); setImgFinds(s ? s.finds : null);
    setAiRep(null); setHot(-1);
  }, [ctx.patientId]);
  if (!patient) return null;

  const findings = imgFinds || patient.findings;
  const aip = imgFinds ? { name: patient.name, findings } : patient; // контекст для AI-вызовов

  function decide(i, v) {
    setDecided(d => {
      const nd = { ...d, [i]: d[i] === v ? null : v };
      RadixStore.set("decided_" + patient.id, nd);
      return nd;
    });
  }
  function demoVisionFinds() {
    const tpl = [
      { type: "caries", tooth: 36, loc: "дистально", pc: 91 }, { type: "cariesE", tooth: 15, loc: "медиально", pc: 84 },
      { type: "tartar", tooth: "нижний фронт", loc: "придёсенно", pc: 79 }, { type: "resto", tooth: 46, loc: "композит", pc: 97 },
      { type: "periap", tooth: 16, loc: "апекс", pc: 87 }
    ];
    const n = 3 + Math.floor(Math.random() * 2);
    return tpl.slice(0, n).map((f, i) => ({ ...f, box: { x: 10 + (i * 22) % 70, y: 18 + (i * 17) % 55, w: 11 + (i % 3) * 2, h: 13 + (i % 2) * 3 } }));
  }
  function analyzeOne(url) {
    const live = window.RadixAI && RadixAI.hasKey();
    return live ? RadixAI.analyzeImage(url) : new Promise(res => setTimeout(() => res(demoVisionFinds()), 1400));
  }
  function showResult(url, fs, persist) {
    setImg(url); setImgFinds(fs); setDecided({}); setAiRep(null); setShowDet(true);
    if (persist) {
      RadixStore.set("decided_" + patient.id, null);
      RadixStore.set("img_" + patient.id, { url, finds: fs }); // может не влезть в квоту — тогда просто без сохранения
    }
  }
  function openQueueItem(it) { if (it.status === "done") showResult(it.url, it.finds, true); }
  function processQueue(items) {
    let chain = Promise.resolve();
    items.forEach((it, idx) => {
      chain = chain.then(() => {
        setQueue(q => q.map(x => x.id === it.id ? { ...x, status: "run" } : x));
        return analyzeOne(it.url).then(fs => {
          setQueue(q => q.map(x => x.id === it.id ? { ...x, status: "done", finds: fs } : x));
          if (idx === 0) { showResult(it.url, fs, true); setScanning(false); }
        }).catch(err => {
          setQueue(q => q.map(x => x.id === it.id ? { ...x, status: "err", err: err.message } : x));
          if (idx === 0) { setScanning(false); ctx.toast("Vision-анализ не удался: " + err.message); }
        });
      });
    });
    chain.then(() => { if (items.length > 1) ctx.toast("Очередь анализа завершена: " + items.length + " снимков"); });
  }
  function onFile(e) {
    const files = Array.prototype.slice.call(e.target.files || []);
    e.target.value = ""; if (!files.length) return;
    Promise.all(files.map((f, i) => new Promise(res => {
      const rd = new FileReader();
      rd.onload = () => res({ id: Date.now() + "_" + i, name: f.name, url: rd.result, status: "wait", finds: null });
      rd.readAsDataURL(f);
    }))).then(items => {
      setQueue(items.length > 1 ? items : []);
      setImg(items[0].url); setImgFinds(null); setDecided({}); setAiRep(null); setCompare(false);
      setScanning(true); setShowDet(false);
      processQueue(items);
    });
  }
  function resetImg() {
    setImg(null); setImgFinds(null); setDecided({}); setAiRep(null); setShowDet(true); setQueue([]);
    RadixStore.set("img_" + patient.id, null); RadixStore.set("decided_" + patient.id, null);
  }
  function localReport(kind) {
    const lines = findings.map(f => { const inf = findingInfo(f); return "• Зуб " + inf.tooth + " — " + inf.label + " (" + inf.loc + "), уверенность " + f.pc + "%"; });
    if (kind === "second")
      return "ПО НАХОДКАМ\n" + findings.map(f => { const inf = findingInfo(f); return "• " + inf.label + " зуб " + inf.tooth + " — " + (f.pc >= 85 ? "СОГЛАСЕН: высокая уверенность, картина типичная." : "СОМНЕВАЮСЬ: уверенность " + f.pc + "%, рекомендую перепроверить."); }).join("\n") + "\n\nЧТО ПЕРЕПРОВЕРИТЬ\nЗондирование сомнительных полостей, термопроба при подозрении на эндо, прицельный снимок при низкой уверенности.\n\nЧТО МОГЛО БЫТЬ ПРОПУЩЕНО\nНачальный апроксимальный кариес и поддёсенный камень на таком типе снимка различимы плохо.";
    if (kind === "patient")
      return "На снимке мы нашли несколько участков, которые требуют внимания — в том числе начинающееся разрушение на " + findings.length + " зубах. Сейчас всё это лечится просто и быстро. Если отложить, лечение станет сложнее и дороже. Рекомендуем записаться на лечение в ближайшие недели.";
    return "ОПИСАНИЕ СНИМКА\nBitewing-снимок удовлетворительного качества, зубные ряды визуализируются полностью.\n\nНАХОДКИ (" + findings.length + ")\n" + lines.join("\n") + "\n\nРЕКОМЕНДАЦИИ\nЛечение по приоритету уверенности находок; начать с кариозных поражений.\n\nКОНТРОЛЬ\nКонтрольный снимок через 6 месяцев.";
  }
  function keepReport(kind, text, mode) {
    setAiRep({ kind, text, mode });
    const list = RadixStore.get("reports_" + patient.id, []);
    list.unshift({ date: new Date().toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }), kind, mode, text });
    RadixStore.set("reports_" + patient.id, list.slice(0, 20));
  }
  function aiReport(kind) {
    setAiRep({ loading: true, kind });
    const live = window.RadixAI && RadixAI.hasKey();
    const run = live
      ? (kind === "patient" ? RadixAI.explain(aip) : kind === "second" ? RadixAI.secondOpinion(aip) : RadixAI.report(aip))
      : new Promise(res => setTimeout(() => res(localReport(kind)), 900));
    run.then(text => keepReport(kind, text, live ? RadixAI.models().analysis : "демо"))
      .catch(err => { setAiRep(null); ctx.toast("AI недоступен: " + err.message); });
  }
  function rescan() {
    if (img) {
      setScanning(true); setShowDet(false); setDecided({});
      const live = window.RadixAI && RadixAI.hasKey();
      const run = live ? RadixAI.analyzeImage(img) : new Promise(res => setTimeout(() => res(demoVisionFinds()), 2100));
      run.then(fs => {
        setImgFinds(fs); setScanning(false); setShowDet(true);
        RadixStore.set("decided_" + patient.id, null);
        RadixStore.set("img_" + patient.id, { url: img, finds: fs });
        ctx.toast("Повторный анализ: найдено " + fs.length);
      })
        .catch(err => { setScanning(false); setShowDet(true); ctx.toast("Ошибка: " + err.message); });
      return;
    }
    setScanning(true); setShowDet(false);
    setTimeout(() => { setScanning(false); setShowDet(true); ctx.toast("Повторный анализ: найдено " + findings.length + " находки"); }, 2100);
  }
  function resetView() { setZoom(1); setContrast(1); setInvert(false); setPan({ x: 50, y: 50 }); }
  function reportData() {
    const mk = getMarketing();
    const withInfo = findings.map(f => Object.assign({}, f, { info: findingInfo(f) }));
    const planState = getPlan(patient.id);
    const planItems = (planState.status !== "draft" && planState.items && planState.items.length)
      ? planState.items
      : withInfo.filter(f => f.info.price > 0).map(f => f.info);
    return {
      patient, findings: withInfo, img: img || null, planItems,
      upsells: pickUpsells(findings, mk.upsells), marketing: mk,
      doctor: (RadixStore.get("user", null) || { name: "Алексей Петров" }).name
    };
  }
  function openPatientReport() {
    const d = reportData();
    d.kind = "patient";
    const live = window.RadixAI && RadixAI.hasKey();
    function show() {
      if (RadixReport.open(d)) ctx.toast("Отчёт пациента открыт — покажите на экране или скачайте PDF");
      else ctx.toast("Браузер заблокировал окно — разрешите всплывающие окна");
    }
    if (!live) { d.mode = "демо-тексты"; show(); return; }
    ctx.toast("Готовлю персональный отчёт (" + RadixAI.models().analysis + ")…");
    RadixAI.patientReportTexts(aip, d.findings, d.upsells)
      .then(texts => { d.texts = texts; d.mode = RadixAI.models().analysis; show(); })
      .catch(err => { d.mode = "демо-тексты (AI: " + err.message + ")"; show(); });
  }
  function toggleDict() {
    if (recRef.current) { recRef.current.stop(); return; } // остановка — обработается в onend
    const rec = new SR();
    rec.lang = "ru-RU"; rec.continuous = true; rec.interimResults = true;
    let finalText = (dict && dict.text) ? dict.text + " " : "";
    rec.onresult = e => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setDict({ on: true, text: (finalText + interim).trim() });
    };
    rec.onend = () => { recRef.current = null; setDict(d => d ? { ...d, on: false } : null); };
    rec.onerror = ev => { recRef.current = null; setDict(d => d ? { ...d, on: false } : null); ctx.toast("Микрофон: " + (ev.error === "not-allowed" ? "нет доступа — разрешите в браузере" : ev.error)); };
    recRef.current = rec;
    setDict(d => ({ on: true, text: d ? d.text : "" }));
    rec.start();
  }
  function formatDict() {
    if (!dict || !dict.text.trim()) return;
    if (recRef.current) recRef.current.stop();
    setAiRep({ loading: true, kind: "dict" });
    const live = window.RadixAI && RadixAI.hasKey();
    const demo = "ОПИСАНИЕ\nЗаключение составлено по диктовке врача.\n\nНАХОДКИ И НАБЛЮДЕНИЯ\n" + dict.text.trim() + "\n\nРЕКОМЕНДАЦИИ\nСогласно изложенному выше; контроль по плану лечения.";
    const run = live ? RadixAI.formatDictation(dict.text.trim(), patient) : new Promise(res => setTimeout(() => res(demo), 800));
    run.then(text => { keepReport("dict", text, live ? RadixAI.models().analysis : "демо"); setDict(null); })
      .catch(err => { setAiRep(null); ctx.toast("AI недоступен: " + err.message); });
  }
  function aiDynamics() {
    const done = queue.filter(it => it.status === "done");
    if (done.length < 2) return;
    setAiRep({ loading: true, kind: "dyn" });
    const live = window.RadixAI && RadixAI.hasKey();
    const demo = "ДИНАМИКА\nКоличество находок: " + done[0].finds.length + " → " + done[1].finds.length + ". " + (done[1].finds.length <= done[0].finds.length ? "Тенденция положительная." : "Появились новые зоны внимания.") + "\n\nНОВЫЕ НАХОДКИ\nСм. различия в списках — типы: " + done[1].finds.map(f => f.type).join(", ") + ".\n\nВЫВОД\nСопоставьте снимки в просмотрщике и подтвердите изменения клинически.";
    const run = live ? RadixAI.dynamics(patient, done[0].finds, done[1].finds) : new Promise(res => setTimeout(() => res(demo), 900));
    run.then(text => keepReport("dyn", text, live ? RadixAI.models().analysis : "демо"))
      .catch(err => { setAiRep(null); ctx.toast("AI недоступен: " + err.message); });
  }

  const accepted = findings.filter((f, i) => decided[i] === "acc").length;
  const rejected = findings.filter((f, i) => decided[i] === "rej").length;
  const pending = findings.length - accepted - rejected;

  // findings with original index, filtered + sorted
  let rows = findings.map((f, i) => ({ f, i, info: findingInfo(f) }));
  if (filter !== "all") rows = rows.filter(r => (r.f.type === "cariesE" ? "caries" : r.f.type) === filter);
  rows = rows.filter(r => r.f.pc >= minPc);
  rows = rows.slice().sort((a, b) => sort === "conf" ? b.f.pc - a.f.pc : (("" + a.f.tooth).localeCompare("" + b.f.tooth)));
  const visibleDets = findings.filter((f, i) => decided[i] !== "rej" && f.pc >= minPc && (filter === "all" || (f.type === "cariesE" ? "caries" : f.type) === filter));

  const filmStyle = {
    transform: `scale(${zoom})`, transformOrigin: `${pan.x}% ${pan.y}%`,
    filter: `contrast(${contrast}) ${invert ? "invert(1) hue-rotate(180deg)" : ""}`
  };

  const filterChips = [
    ["all", "Все"], ["caries", "Кариес"], ["tartar", "Камень"], ["periap", "Эндо"], ["resto", "Пломбы"]
  ];

  return React.createElement("div", { className: "content-pad" },
    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" } },
      React.createElement("button", { className: "icon-btn", onClick: () => ctx.openPatient(patient.id) }, React.createElement(Icon, { name: "arrow", size: 18, style: { transform: "rotate(180deg)" } })),
      React.createElement(Avatar, { name: patient.name, color: patient.color, size: 42, radius: "13px" }),
      React.createElement("div", null,
        React.createElement("div", { style: { fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 19 } }, patient.name),
        React.createElement("div", { style: { fontSize: 13, color: "var(--ink-3)" } }, img ? "Загруженный снимок · vision-анализ" : "Bitewing справа · 12.09.2025 · 2.4 МП · DICOM")),
      React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" } },
        React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", multiple: true, style: { display: "none" }, onChange: onFile }),
        React.createElement("button", { className: "btn-app gho", onClick: () => fileRef.current && fileRef.current.click() }, React.createElement(Icon, { name: "scan", size: 16 }), "Загрузить снимок"),
        img ? React.createElement("button", { className: "btn-app gho", onClick: resetImg }, React.createElement(Icon, { name: "x", size: 16 }), "К снимку из карточки") : null,
        React.createElement("button", { className: "btn-app gho", onClick: rescan }, React.createElement(Icon, { name: "sparkle", size: 16 }), "Повторный анализ"),
        img ? null : React.createElement("button", { className: "btn-app gho", onClick: () => setCompare(c => !c) }, React.createElement(Icon, { name: "history", size: 16 }), compare ? "Один снимок" : "До / после"),
        React.createElement("button", { className: "btn-app pri", onClick: () => aiReport("doc"), disabled: aiRep && aiRep.loading }, React.createElement(Icon, { name: "bolt", size: 16 }), aiRep && aiRep.loading ? "Генерация…" : "AI-заключение"),
        React.createElement("button", { className: "btn-app gho", onClick: () => aiReport("patient"), disabled: aiRep && aiRep.loading }, React.createElement(Icon, { name: "chat", size: 16 }), "Объяснить пациенту"),
        React.createElement("button", { className: "btn-app gho", onClick: () => aiReport("second"), disabled: aiRep && aiRep.loading }, React.createElement(Icon, { name: "shield", size: 16 }), "Второе мнение"),
        React.createElement("button", { className: "btn-app pri", onClick: openPatientReport, style: { background: "var(--good)" } }, React.createElement(Icon, { name: "doc", size: 16 }), "Отчёт пациенту"),
        SR ? React.createElement("button", { className: "btn-app " + (dict && dict.on ? "pri" : "gho"), onClick: toggleDict, title: "Голосовая диктовка заключения" },
          React.createElement("span", { style: dict && dict.on ? { width: 9, height: 9, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "pulse 1s infinite" } : { display: "none" } }),
          dict && dict.on ? "Идёт запись…" : "🎤 Диктовка") : null,
        React.createElement("button", { className: "btn-app gho", onClick: () => {
          const d = reportData();
          d.kind = "doctor";
          d.clinicalText = aiRep && aiRep.text && aiRep.kind !== "patient" ? aiRep.text : localReport("doc");
          d.mode = aiRep && aiRep.mode ? aiRep.mode : "демо";
          if (RadixReport.open(d)) ctx.toast("Клинический отчёт открыт — печать или сохранение в PDF");
          else ctx.toast("Браузер заблокировал окно — разрешите всплывающие окна");
        } }, React.createElement(Icon, { name: "print", size: 16 }), "Отчёт врача"))),

    // очередь мульти-анализа
    queue.length > 1 ? React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" } },
      React.createElement("span", { style: { fontSize: 13, fontWeight: 700, color: "var(--ink-3)" } }, "Очередь анализа:"),
      queue.map(it => React.createElement("button", { key: it.id, onClick: () => openQueueItem(it),
        title: it.status === "err" ? it.err : it.name,
        style: { display: "flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit",
          cursor: it.status === "done" ? "pointer" : "default",
          border: "1.5px solid " + (img === it.url ? "var(--primary)" : "var(--line)"),
          background: img === it.url ? "var(--primary-tint)" : "#fff",
          color: it.status === "err" ? "var(--danger)" : "var(--ink-2)" } },
        React.createElement("span", { style: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: it.status === "done" ? "var(--good)" : it.status === "run" ? "var(--warn)" : it.status === "err" ? "var(--danger)" : "var(--ink-4)" } }),
        (it.name.length > 18 ? it.name.slice(0, 16) + "…" : it.name),
        it.status === "done" ? React.createElement("b", null, it.finds.length) : it.status === "run" ? "…" : null)),
      queue.filter(it => it.status === "done").length >= 2
        ? React.createElement("button", { className: "btn-app gho sm", onClick: aiDynamics, disabled: aiRep && aiRep.loading }, React.createElement(Icon, { name: "chart", size: 14 }), "Динамика (AI)")
        : null) : null,

    // progress strip
    React.createElement("div", { style: { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" } },
      [["Подтверждено", accepted, "var(--good)", "var(--good-tint)"], ["На проверке", pending, "var(--warn)", "var(--warn-tint)"], ["Отклонено", rejected, "var(--ink-3)", "var(--bg-soft)"]].map((s, i) =>
        React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 9, padding: "9px 15px", borderRadius: 999, background: s[3], color: s[2], fontWeight: 600, fontSize: 13.5 } },
          React.createElement("span", { style: { width: 9, height: 9, borderRadius: "50%", background: s[2] } }), s[0], React.createElement("b", { style: { fontFamily: "var(--font-display)" } }, s[1])))),

    React.createElement("div", { className: "rv card", style: { overflow: "hidden" } },
      // STAGE
      React.createElement("div", { className: "rv-stage" },
        React.createElement("div", { className: "rv-toolbar" },
          React.createElement("span", { className: "rv-chip" }, React.createElement("span", { style: { width: 8, height: 8, borderRadius: "50%", background: scanning ? "var(--warn)" : "#18A06E", display: "inline-block" } }), scanning ? "Анализ…" : "Анализ завершён"),
          React.createElement("span", { className: "rv-chip" }, img ? (window.RadixAI && RadixAI.hasKey() ? RadixAI.models().analysis + " vision" : "Демо-Vision") : "Радикс-Vision 3.1"),
          React.createElement("div", { className: "rv-spacer" }),
          React.createElement("button", { className: "rv-tool" + (showDet ? " on" : ""), title: "Показать находки", onClick: () => setShowDet(s => !s) }, React.createElement(Icon, { name: "eye", size: 16 })),
          React.createElement("button", { className: "rv-tool" + (invert ? " on" : ""), title: "Инверсия / контраст", onClick: () => setInvert(v => !v) }, React.createElement(Icon, { name: "contrast", size: 16 })),
          React.createElement("button", { className: "rv-tool", title: "Уменьшить", onClick: () => setZoom(z => Math.max(1, +(z - .25).toFixed(2))) }, React.createElement(Icon, { name: "ruler", size: 16 })),
          React.createElement("button", { className: "rv-tool", title: "Увеличить", onClick: () => setZoom(z => Math.min(2.5, +(z + .25).toFixed(2))) }, React.createElement(Icon, { name: "zoom", size: 16 })),
          React.createElement("button", { className: "rv-tool", title: "Сбросить вид", onClick: resetView }, React.createElement(Icon, { name: "history", size: 16 }))),
        compare
          ? React.createElement(BeforeAfter, { before: Object.assign({}, patient.arch), after: Object.assign({}, patient.arch, { decayAt: [], restoreAt: patient.arch.decayAt[0] != null ? patient.arch.decayAt[0] : patient.arch.restoreAt }), tagBefore: "До · март", tagAfter: "После · сентябрь" })
          : React.createElement("div", { className: "rv-film", onMouseMove: e => { if (zoom > 1) { const r = e.currentTarget.getBoundingClientRect(); setPan({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); } } },
              React.createElement("div", { className: "rv-film-inner", style: filmStyle },
                img
                  ? React.createElement("img", { src: img, alt: "Снимок", style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } })
                  : React.createElement(Arch, patient.arch)),
              scanning ? React.createElement("div", { className: "scanline" }) : null,
              showDet && !scanning ? React.createElement("div", { className: "det-layer" }, visibleDets.map((f) => {
                const oi = findings.indexOf(f); const info = findingInfo(f);
                return React.createElement("div", { key: oi, className: "det" + (hot === oi ? " hot" : ""), style: { left: f.box.x + "%", top: f.box.y + "%", width: f.box.w + "%", height: f.box.h + "%", "--c": info.c }, onMouseEnter: () => setHot(oi), onMouseLeave: () => setHot(-1) },
                  React.createElement("div", { className: "box" }),
                  React.createElement("div", { className: "lbl" }, info.label.split(" ")[0], React.createElement("span", { className: "pc" }, f.pc + "%"))); })) : null,
              React.createElement("div", { className: "rv-zoomhint" }, zoom > 1 ? "Зум " + zoom.toFixed(2) + "× · двигайте мышью" : "Кнопками + / − приблизьте"))),

      // SIDE
      React.createElement("div", { className: "rv-side" },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
          React.createElement("h4", null, "Находки ИИ"),
          React.createElement("span", { style: { marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "var(--primary)", background: "var(--primary-tint)", padding: "2px 9px", borderRadius: 999 } }, rows.length)),
        // filter chips
        React.createElement("div", { className: "rv-filterbar" }, filterChips.map(([k, l]) =>
          React.createElement("button", { key: k, className: "rv-fchip" + (filter === k ? " on" : ""), onClick: () => setFilter(k) }, l))),
        // sort
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-3)", marginBottom: 4 } }, "Сортировка:",
          React.createElement("button", { className: "rv-fchip" + (sort === "conf" ? " on" : ""), style: { padding: "3px 9px" }, onClick: () => setSort("conf") }, "по уверенности"),
          React.createElement("button", { className: "rv-fchip" + (sort === "tooth" ? " on" : ""), style: { padding: "3px 9px" }, onClick: () => setSort("tooth") }, "по зубу")),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "var(--ink-3)", margin: "4px 0 2px" } }, "Порог:",
          React.createElement("input", { type: "range", min: 50, max: 95, value: minPc, onChange: e => setMinPc(+e.target.value), style: { flex: 1, accentColor: "var(--primary)" } }),
          React.createElement("b", { style: { color: "var(--primary)", fontVariantNumeric: "tabular-nums", minWidth: 34, textAlign: "right" } }, minPc + "%")),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", margin: "6px -4px 0", padding: "0 4px" } }, rows.length ? rows.map(({ f, i, info }) => {
          const d = decided[i];
          return React.createElement("div", { key: i, className: "finding" + (d === "rej" ? " dim" : "") + (hot === i ? " hot" : ""), onMouseEnter: () => setHot(i), onMouseLeave: () => setHot(-1) },
            React.createElement("div", { className: "f-ic", style: { background: info.tint, color: info.c } }, React.createElement(Icon, { name: "tooth", size: 17 })),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { className: "f-t" }, info.label),
              React.createElement("div", { className: "f-s" }, "Зуб " + info.tooth + " · " + info.loc),
              React.createElement("div", { className: "fconf" }, React.createElement("i", { style: { width: f.pc + "%", background: info.c } }))),
            React.createElement("div", { className: "f-act" },
              React.createElement("button", { className: "fbtn acc" + (d === "acc" ? " on" : ""), title: "Подтвердить", onClick: () => decide(i, "acc") }, React.createElement(Icon, { name: "check", size: 15 })),
              React.createElement("button", { className: "fbtn rej" + (d === "rej" ? " on" : ""), title: "Отклонить", onClick: () => decide(i, "rej") }, React.createElement(Icon, { name: "x", size: 15 })))); }) :
          React.createElement("div", { style: { textAlign: "center", color: "var(--ink-4)", fontSize: 13.5, padding: "30px 0" } }, "Нет находок этого типа")),
        React.createElement("button", { className: "btn-app pri", style: { marginTop: 14, width: "100%" }, onClick: () => {
          if (imgFinds) { // vision-находки становятся официальными находками пациента
            const keep = findings.filter((f, i) => decided[i] !== "rej");
            updatePatient(patient.id, { findings: keep, flag: keep.some(f => f.type === "caries" || f.type === "cariesE") ? "caries" : keep.some(f => f.type === "periap") ? "periap" : "ok" });
            ctx.toast("Находки сохранены в карточку: " + keep.length);
          }
          crmSetStage(patient.id, "consult");
          ctx.openPlan(patient.id);
        } },
          React.createElement(Icon, { name: "doc", size: 16 }), "Сформировать план (" + (accepted || pending) + ")"))),

    // панель диктовки
    dict && (dict.text || dict.on) ? React.createElement("div", { className: "card", style: { marginTop: 18 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderBottom: "1px solid var(--line)" } },
        React.createElement("span", { style: { width: 10, height: 10, borderRadius: "50%", background: dict.on ? "var(--danger)" : "var(--ink-4)", flexShrink: 0 } }),
        React.createElement("b", { style: { fontFamily: "var(--font-display)", fontSize: 14 } }, dict.on ? "Запись идёт — говорите" : "Диктовка остановлена"),
        React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 8 } },
          React.createElement("button", { className: "btn-app pri sm", disabled: !dict.text.trim() || (aiRep && aiRep.loading), onClick: formatDict }, React.createElement(Icon, { name: "bolt", size: 14 }), aiRep && aiRep.loading ? "Оформляю…" : "Оформить (AI)"),
          React.createElement("button", { className: "btn-app gho sm", onClick: () => { if (recRef.current) recRef.current.stop(); setDict(null); } }, "Сбросить"))),
      React.createElement("div", { style: { padding: "14px 18px", fontSize: 14.5, lineHeight: 1.6, minHeight: 50, color: dict.text ? "var(--ink)" : "var(--ink-4)" } },
        dict.text || "Скажите, что видите на снимке — текст появится здесь…")) : null,

    // AI report panel
    aiRep && !aiRep.loading ? React.createElement("div", { className: "card", style: { marginTop: 18 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid var(--line)" } },
        React.createElement("span", { style: { color: "var(--primary)" } }, React.createElement(Icon, { name: "bolt", size: 18 })),
        React.createElement("b", { style: { fontFamily: "var(--font-display)", fontSize: 15 } }, aiRep.kind === "patient" ? "Объяснение для пациента" : aiRep.kind === "second" ? "Второе мнение AI" : aiRep.kind === "dyn" ? "Динамика между снимками" : aiRep.kind === "dict" ? "Заключение из диктовки" : "AI-заключение по снимку"),
        React.createElement("span", { style: { fontSize: 11.5, fontWeight: 700, color: aiRep.mode === "демо" ? "var(--warn)" : "var(--good)", background: aiRep.mode === "демо" ? "var(--warn-tint)" : "var(--good-tint)", padding: "3px 10px", borderRadius: 999 } }, aiRep.mode === "демо" ? "Демо · подключите ключ в Настройках" : aiRep.mode),
        React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 8 } },
          React.createElement("button", { className: "btn-app gho", onClick: () => { navigator.clipboard && navigator.clipboard.writeText(aiRep.text); ctx.toast("Заключение скопировано"); } }, React.createElement(Icon, { name: "doc", size: 15 }), "Копировать"),
          React.createElement("button", { className: "btn-app gho", onClick: () => setAiRep(null) }, React.createElement(Icon, { name: "x", size: 15 })))),
      React.createElement("div", { style: { padding: "18px 22px", whiteSpace: "pre-wrap", fontSize: 14.5, lineHeight: 1.65, maxWidth: 860 } }, aiRep.text)) : null);
}

Object.assign(window, { Dashboard, Patients, PatientDetail, Analysis });
