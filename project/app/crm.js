/* ============================================================
   Радикс Продукт — CRM (pipeline / kanban / follow-ups)
   ============================================================ */
function CRM({ ctx }) {
  const [cards, setCards] = useState(() => {
    const st = RadixStore.get("crm_stages", {});
    return CRM_CARDS.map(c => st[c.id] ? { ...c, stage: st[c.id] } : c);
  });
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const [advice, setAdvice] = useState(null); // { cardId, loading, text, mode }
  function scoreDeal(card, stage) {
    if (advice && advice.cardId === card.id && !advice.loading) { setAdvice(null); return; } // повторный клик — скрыть
    setAdvice({ cardId: card.id, loading: true });
    const live = window.RadixAI && RadixAI.hasKey();
    const demo = card.prob >= 75
      ? "Сделка горячая (" + card.prob + "%) — пациент почти готов. Следующий шаг: позвоните сегодня и предложите конкретное время записи."
      : card.prob >= 45
        ? "Средняя готовность (" + card.prob + "%). Следующий шаг: отправьте короткое сообщение с планом и ответьте на вопросы по стоимости — источник «" + card.src + "» хорошо конвертируется после личного контакта."
        : "Холодный лид (" + card.prob + "%). Следующий шаг: не продавайте лечение сразу — пригласите на бесплатную консультацию со снимком.";
    const run = live ? RadixAI.dealAdvice(card, stage.t) : new Promise(res => setTimeout(() => res(demo), 600));
    run.then(text => setAdvice({ cardId: card.id, text, mode: live ? RadixAI.models().chat : "демо" }))
      .catch(err => { setAdvice(null); ctx.toast("AI недоступен: " + err.message); });
  }

  const byStage = {};
  CRM_STAGES.forEach(s => { byStage[s.id] = cards.filter(c => c.stage === s.id); });

  const totalVal = cards.filter(c => c.stage !== "done").reduce((s, c) => s + c.val, 0);
  const weighted = Math.round(cards.filter(c => c.stage !== "done").reduce((s, c) => s + c.val * c.prob / 100, 0));
  // выручка месяца: реальные оплаты + done-сделки без оплат (чтобы не считать дважды)
  const paidMonth = paymentsThisMonth();
  const paidPids = {}; paidMonth.forEach(p => { paidPids[p.pid] = true; });
  const wonMonth = paidMonth.reduce((s, p) => s + p.amount, 0) +
    cards.filter(c => c.stage === "done" && !paidPids[c.pid]).reduce((s, c) => s + c.val, 0);
  const convRate = 68;
  const fmt = n => n.toLocaleString("ru-RU") + " ₽";

  function move(cardId, stage) {
    setCards(cs => {
      const ns = cs.map(c => c.id === cardId ? { ...c, stage } : c);
      const st = {}; ns.forEach(c => { st[c.id] = c.stage; });
      RadixStore.set("crm_stages", st);
      return ns;
    });
  }
  function advance(card) {
    const idx = CRM_STAGES.findIndex(s => s.id === card.stage);
    if (idx < CRM_STAGES.length - 1) { move(card.id, CRM_STAGES[idx + 1].id); ctx.toast(card.name + " → " + CRM_STAGES[idx + 1].t); }
  }

  const stats = [
    { ic: "filter", c: "#2F4BF0", bg: "#E6EAFF", num: fmt(totalVal), lbl: "В активном пайплайне" },
    { ic: "sparkle", c: "#FF5A36", bg: "#FFE6DD", num: fmt(weighted), lbl: "Взвешенный прогноз" },
    { ic: "cash", c: "#18A06E", bg: "#E1F4EC", num: fmt(wonMonth), lbl: "Выручка за месяц" },
    { ic: "chart", c: "#E8941F", bg: "#FBEFD9", num: convRate + "%", lbl: "Конверсия лид → лечение" }
  ];

  return React.createElement("div", { className: "content-pad" },
    React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 22, flexWrap: "wrap" } },
      React.createElement("div", null,
        React.createElement("h1", { className: "page-h1" }, "Воронка пациентов"),
        React.createElement("p", { style: { color: "var(--ink-3)", marginTop: 4 } }, "Лиды, консультации и план лечения — от заявки до завершённого случая")),
      React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 10 } },
        React.createElement("button", { className: "btn-app gho" }, React.createElement(Icon, { name: "filter", size: 16 }), "Фильтры"),
        React.createElement("button", { className: "btn-app pri" }, React.createElement(Icon, { name: "plus", size: 16 }), "Новый лид"))),

    React.createElement("div", { className: "crm-stats" }, stats.map((s, i) =>
      React.createElement("div", { className: "stat", key: i },
        React.createElement("div", { className: "s-ic", style: { background: s.bg, color: s.c } }, React.createElement(Icon, { name: s.ic, size: 20 })),
        React.createElement("div", { className: "s-num", style: { fontSize: 26 } }, s.num),
        React.createElement("div", { className: "s-lbl" }, s.lbl)))),

    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr", gap: 20 } },
      // KANBAN
      React.createElement("div", null,
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 } },
          React.createElement("h3", { style: { fontFamily: "var(--font-display)", fontSize: 17 } }, "Канбан сделок"),
          React.createElement("span", { style: { fontSize: 13, color: "var(--ink-3)" } }, "перетащите карточку или нажмите → чтобы продвинуть")),
        React.createElement("div", { className: "kanban" }, CRM_STAGES.map(stage =>
          React.createElement("div", {
            key: stage.id, className: "kcol", style: over === stage.id ? { borderColor: stage.c, background: "#fff" } : null,
            onDragOver: e => { e.preventDefault(); setOver(stage.id); },
            onDragLeave: () => setOver(o => o === stage.id ? null : o),
            onDrop: () => { if (drag) { move(drag, stage.id); setDrag(null); setOver(null); } }
          },
            React.createElement("div", { className: "kcol-h" },
              React.createElement("span", { className: "kdot", style: { background: stage.c } }),
              React.createElement("span", { className: "kt" }, stage.t),
              React.createElement("span", { className: "kn" }, byStage[stage.id].length)),
            React.createElement("div", { className: "kcol-body" }, byStage[stage.id].map(card =>
              React.createElement("div", {
                key: card.id, className: "kcard rise", draggable: true,
                onDragStart: () => setDrag(card.id), onDragEnd: () => { setDrag(null); setOver(null); },
                onClick: () => { if (card.pid) ctx.openPatient(card.pid); }
              },
                React.createElement("div", { className: "kc-top" },
                  React.createElement(Avatar, { name: card.name, color: card.color, size: 34, radius: "11px", fontSize: 13 }),
                  React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { className: "kc-name" }, card.name),
                    React.createElement("div", { className: "kc-sub" }, card.work)),
                  React.createElement("button", {
                    className: "fbtn", title: "AI-оценка сделки", style: { width: 28, height: 28, color: "var(--primary)" },
                    onClick: e => { e.stopPropagation(); scoreDeal(card, stage); }
                  }, advice && advice.cardId === card.id && advice.loading ? "…" : React.createElement(Icon, { name: "sparkle", size: 14 })),
                  stage.id !== "done" ? React.createElement("button", {
                    className: "fbtn", title: "Продвинуть", style: { width: 28, height: 28 },
                    onClick: e => { e.stopPropagation(); advance(card); }
                  }, React.createElement(Icon, { name: "arrow", size: 14 })) : React.createElement("span", { style: { color: "var(--good)" } }, React.createElement(Icon, { name: "check", size: 16 }))),
                React.createElement("div", { className: "kc-bar" }, React.createElement("i", { style: { width: card.prob + "%", background: stage.c } })),
                React.createElement("div", { className: "kc-foot" },
                  React.createElement("span", { className: "kc-val", style: { color: stage.c } }, fmt(card.val)),
                  React.createElement("span", { style: { fontSize: 11, color: "var(--ink-4)", fontWeight: 600 } }, card.prob + "%"),
                  React.createElement("span", { className: "kc-date" }, card.date)),
                advice && advice.cardId === card.id && !advice.loading ? React.createElement("div", {
                  onClick: e => e.stopPropagation(),
                  style: { marginTop: 9, padding: "9px 11px", borderRadius: 10, background: "var(--primary-tint)", fontSize: 12, lineHeight: 1.5, color: "var(--primary-700)", cursor: "default" } },
                  React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, fontWeight: 700, marginBottom: 4, fontSize: 11 } },
                    React.createElement(Icon, { name: "sparkle", size: 12 }), "AI · " + advice.mode),
                  advice.text) : null)),
              byStage[stage.id].length === 0 ? React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-4)", textAlign: "center", padding: "18px 0" } }, "Пусто") : null))))),

      // FOLLOW-UPS + sources
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, alignItems: "start" } },
        React.createElement("div", { className: "card", style: { overflow: "hidden" } },
          React.createElement(CardHead, { title: "Задачи и follow-up на сегодня", icon: "clock",
            right: React.createElement("span", { className: "tag", style: { background: "var(--primary-tint)", color: "var(--primary)" } }, CRM_FOLLOWUPS.length + " задачи") }),
          React.createElement("div", null, CRM_FOLLOWUPS.map((f, i) =>
            React.createElement("div", { key: i, className: "followup" },
              React.createElement("span", { className: "fu-ic", style: { background: f.c + "1a", color: f.c } }, React.createElement(Icon, { name: f.type === "call" ? "bell" : "chat", size: 18 })),
              React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { fontWeight: 600, fontSize: 14.5 } }, f.action),
                React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-3)" } }, f.who + " · " + f.due)),
              React.createElement("button", { className: "btn-app gho sm", onClick: () => ctx.toast("Задача отмечена выполненной") }, "Выполнить")))) ),
        React.createElement("div", { className: "card" },
          React.createElement(CardHead, { title: "Источники лидов", icon: "share" }),
          React.createElement("div", { className: "card-pad" }, [
            { l: "Повторные пациенты", v: 38, c: "#18A06E" }, { l: "Сайт и онлайн-запись", v: 27, c: "#2F4BF0" },
            { l: "Рекомендации", v: 21, c: "#FF5A36" }, { l: "Соцсети", v: 14, c: "#E8941F" }
          ].map((d, i) => React.createElement("div", { key: i, style: { marginBottom: 15 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 6 } },
              React.createElement("span", { style: { fontWeight: 600 } }, d.l), React.createElement("span", { style: { color: "var(--ink-3)" } }, d.v + "%")),
            React.createElement("div", { style: { height: 9, borderRadius: 99, background: "var(--bg-soft)", overflow: "hidden" } },
              React.createElement("div", { style: { width: d.v + "%", height: "100%", borderRadius: 99, background: d.c, transition: "width .8s var(--ease)" } }))))))) )
  );
}

Object.assign(window, { CRM });
