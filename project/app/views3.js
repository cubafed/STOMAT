/* ============================================================
   Радикс Продукт — views3: Community feed, Calendar, Notifications,
   Activity log, Billing
   ============================================================ */

/* ---------------- COMMUNITY FEED (Insta-like) ---------------- */
function Community({ ctx }) {
  const [posts, setPosts] = useState(() => FEED.map(p => ({ ...p })));
  const [open, setOpen] = useState({});      // postId -> bool (comments shown)
  const [drafts, setDrafts] = useState({});  // postId -> text
  const [extra, setExtra] = useState({});    // postId -> [comments]

  function like(id) {
    setPosts(ps => ps.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p));
  }
  function addComment(id) {
    const txt = (drafts[id] || "").trim(); if (!txt) return;
    setExtra(e => ({ ...e, [id]: [...(e[id] || []), { who: "Алексей Петров", color: "#18A06E", text: txt, time: "сейчас", me: true }] }));
    setPosts(ps => ps.map(p => p.id === id ? { ...p, comments: p.comments + 1 } : p));
    setDrafts(d => ({ ...d, [id]: "" }));
  }

  function postMedia(p) {
    if (p.shots >= 2) {
      return React.createElement("div", { className: "post-media two" }, [0, 1].map(i =>
        React.createElement("div", { key: i, className: "post-shot" },
          React.createElement(Arch, { count: 7, restoreAt: i ? 3 : null, decayAt: i ? [] : [3, 5] }),
          React.createElement("span", { className: "pulse-tag" }, i ? "После" : "До"))));
    }
    // banner for announcements
    const grad = { update: "linear-gradient(135deg,#FF5A36,#ff9d5c)", hygiene: "linear-gradient(135deg,#11AEC8,#5fd9ea)" }[p.img] || "linear-gradient(135deg,#2F4BF0,#7C5CFF)";
    return React.createElement("div", { className: "post-banner", style: { background: grad } },
      React.createElement("span", { style: { color: "#fff", opacity: .92 } }, React.createElement(Icon, { name: p.img === "update" ? "sparkle" : "shield", size: 54 })));
  }

  return React.createElement("div", { className: "content-pad" },
    React.createElement("div", { className: "feed-wrap" },
      React.createElement("div", { style: { display: "flex", alignItems: "flex-end", marginBottom: 18 } },
        React.createElement("div", null,
          React.createElement("h1", { className: "page-h1" }, "Сообщество"),
          React.createElement("p", { style: { color: "var(--ink-3)", marginTop: 4 } }, "Лента клинических случаев и обсуждений коллег")),
        React.createElement("button", { className: "btn-app pri", style: { marginLeft: "auto" }, onClick: () => ctx.toast("Редактор поста скоро") }, React.createElement(Icon, { name: "plus", size: 16 }), "Пост")),

      // stories
      React.createElement("div", { className: "stories" },
        React.createElement("div", { className: "story" },
          React.createElement("div", { className: "ring add" }, React.createElement("div", { style: { background: "var(--bg-soft)", color: "var(--primary)" } }, React.createElement(Icon, { name: "plus", size: 22 }))),
          React.createElement("span", { className: "s-name" }, "Ваш кейс")),
        TEAM.concat([{ name: "Аврора", color: "#FF5A36" }, { name: "ДентаЛюкс", color: "#2F4BF0" }]).map((u, i) =>
          React.createElement("div", { className: "story", key: i },
            React.createElement("div", { className: "ring" }, React.createElement("div", { style: { background: `linear-gradient(135deg, ${u.color}, ${u.color}bb)` } }, initials(u.name))),
            React.createElement("span", { className: "s-name" }, u.name.split(" ")[0])))),

      // composer
      React.createElement("div", { className: "feed-composer" },
        React.createElement(Avatar, { name: "Алексей Петров", color: "#18A06E", size: 42, radius: "13px" }),
        React.createElement("div", { className: "fc-input", onClick: () => ctx.toast("Редактор поста скоро") }, "Поделитесь клиническим случаем…"),
        React.createElement("button", { className: "icon-btn", onClick: () => ctx.toast("Загрузка снимка") }, React.createElement(Icon, { name: "scan", size: 18 }))),

      // posts
      posts.map(p => React.createElement("div", { className: "post", key: p.id },
        React.createElement("div", { className: "post-h" },
          React.createElement(Avatar, { name: p.author, color: p.color, size: 44, radius: "13px" }),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { className: "ph-name" }, p.author, p.official ? React.createElement("span", { className: "official-badge" }, React.createElement(Icon, { name: "shield", size: 15 })) : null),
            React.createElement("div", { className: "ph-role" }, p.role + " · " + p.time)),
          React.createElement("button", { className: "icon-btn", style: { width: 36, height: 36 } }, React.createElement(Icon, { name: "plus", size: 16, style: { transform: "rotate(45deg)" } }))),
        React.createElement("div", { className: "post-body" },
          React.createElement("div", { className: "post-text" }, p.text),
          React.createElement("div", { className: "post-tags" }, p.tags.map((t, i) => React.createElement("span", { key: i, className: "post-tag" }, t)))),
        postMedia(p),
        React.createElement("div", { className: "post-actions" },
          React.createElement("button", { className: "pa-btn" + (p.liked ? " liked" : ""), onClick: () => like(p.id) },
            React.createElement("span", { className: "heart" }, React.createElement(Icon, { name: "tooth", size: 18 })), p.likes),
          React.createElement("button", { className: "pa-btn", onClick: () => setOpen(o => ({ ...o, [p.id]: !o[p.id] })) },
            React.createElement(Icon, { name: "chat", size: 18 }), p.comments),
          React.createElement("button", { className: "pa-btn", style: { marginLeft: "auto" }, onClick: () => ctx.toast("Ссылка скопирована") },
            React.createElement(Icon, { name: "share", size: 18 }), "Поделиться")),
        open[p.id] ? React.createElement("div", { className: "post-comments" },
          (FEED_COMMENTS[p.id] || []).concat(extra[p.id] || []).map((c, i) =>
            React.createElement("div", { key: i, className: "pcomment" },
              React.createElement(Avatar, { name: c.who, color: c.color, size: 30, radius: "9px", fontSize: 11 }),
              React.createElement("div", { className: "pc-b" }, React.createElement("b", null, c.who), c.text,
                React.createElement("div", { style: { fontSize: 11.5, color: "var(--ink-4)", marginTop: 2 } }, c.time)))),
          React.createElement("div", { className: "comment-add" },
            React.createElement(Avatar, { name: "Алексей Петров", color: "#18A06E", size: 30, radius: "9px", fontSize: 11 }),
            React.createElement("input", { placeholder: "Добавить комментарий…", value: drafts[p.id] || "", onChange: e => setDrafts(d => ({ ...d, [p.id]: e.target.value })), onKeyDown: e => { if (e.key === "Enter") addComment(p.id); } }),
            React.createElement("button", { className: "btn-app pri sm", onClick: () => addComment(p.id) }, "Отпр."))) : null))));
}

/* ---------------- CALENDAR ---------------- */
function Calendar({ ctx }) {
  const [mode, setMode] = useState("week");
  const [day, setDay] = useState(0);
  const [bookings, setBookings] = useState(() => RadixStore.get("bookings", []));
  function bookingAction(b, accept) {
    const rest = bookings.filter(x => x.id !== b.id);
    setBookings(rest); RadixStore.set("bookings", rest);
    ctx.toast(accept ? b.name + " — запись подтверждена, добавим в расписание" : "Заявка " + b.name + " отклонена");
  }
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const H = 56;

  function eventStyle(ev, withLeft) {
    const top = (ev.start - hours[0]) * H;
    return { top: top + 2, height: ev.dur * H - 4, background: ev.color };
  }

  return React.createElement("div", { className: "content-pad" },
    React.createElement("div", { className: "cal-head" },
      React.createElement("div", null,
        React.createElement("h1", { className: "page-h1" }, "Расписание"),
        React.createElement("p", { style: { color: "var(--ink-3)", marginTop: 4 } }, "Июнь 2026 · 4 врача · 15 приёмов на неделе")),
      React.createElement("div", { className: "seg", style: { marginLeft: "auto" } },
        React.createElement("button", { className: mode === "day" ? "on" : "", onClick: () => setMode("day") }, "День"),
        React.createElement("button", { className: mode === "week" ? "on" : "", onClick: () => setMode("week") }, "Неделя")),
      React.createElement("button", { className: "btn-app pri", onClick: () => ctx.toast("Новая запись на приём") }, React.createElement(Icon, { name: "plus", size: 16 }), "Записать")),

    bookings.length ? React.createElement("div", { className: "card", style: { marginBottom: 18 } },
      React.createElement(CardHead, { title: "Онлайн-заявки с сайта", icon: "bell",
        right: React.createElement(Tag, { c: "var(--primary)", tint: "var(--primary-tint)" }, bookings.length) }),
      React.createElement("div", null, bookings.map((b, i) =>
        React.createElement("div", { key: b.id, style: { display: "flex", alignItems: "center", gap: 13, padding: "13px 20px", borderBottom: i < bookings.length - 1 ? "1px solid var(--line)" : "none", flexWrap: "wrap" } },
          React.createElement(Avatar, { name: b.name, color: "#FF5A36", size: 38 }),
          React.createElement("div", { style: { flex: 1, minWidth: 180 } },
            React.createElement("div", { style: { fontWeight: 700, fontSize: 14.5 } }, b.name, React.createElement("span", { style: { fontWeight: 500, color: "var(--ink-3)", marginLeft: 8, fontSize: 13 } }, b.phone)),
            React.createElement("div", { style: { fontSize: 13, color: "var(--ink-3)" } }, b.service + " · " + b.when + (b.note ? " · «" + b.note + "»" : ""))),
          React.createElement("div", { style: { display: "flex", gap: 8 } },
            React.createElement("button", { className: "btn-app pri sm", onClick: () => bookingAction(b, true) }, "Подтвердить"),
            React.createElement("button", { className: "btn-app gho sm", onClick: () => bookingAction(b, false) }, "Отклонить"))))))
      : null,

    mode === "week"
      ? React.createElement("div", { style: { overflowX: "auto" } },
          React.createElement("div", { className: "cal-week" },
            React.createElement("div", { className: "cal-corner" }),
            CAL_DAYS.map((d, i) => React.createElement("div", { key: i, className: "cal-dayhead" }, d.split(" ")[0], React.createElement("small", null, d.split(" ")[1]))),
            React.createElement("div", { className: "cal-hourcol" }, hours.map(h => React.createElement("div", { key: h, className: "cal-hour" }, h + ":00"))),
            CAL_DAYS.map((d, di) => React.createElement("div", { key: di, className: "cal-daycol" },
              hours.map(h => React.createElement("div", { key: h, className: "cal-slot", onClick: () => ctx.toast("Свободный слот · " + d + " " + h + ":00") })),
              CAL_EVENTS.filter(e => e.day === di).map((ev, i) =>
                React.createElement("div", { key: i, className: "cal-event", style: eventStyle(ev), onClick: () => { if (ev.pid) ctx.openPatient(ev.pid); else ctx.toast(ev.name + " · " + ev.work); } },
                  React.createElement("div", { className: "ce-t" }, ev.name.split(" ")[0] + " " + (ev.name.split(" ")[1] || "")),
                  React.createElement("div", { className: "ce-s" }, ev.work)))))))
      : React.createElement("div", null,
          React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" } }, CAL_DAYS.map((d, i) =>
            React.createElement("button", { key: i, className: "rv-fchip" + (day === i ? " on" : ""), onClick: () => setDay(i) }, d))),
          React.createElement("div", { className: "cal-day" }, hours.map(h => {
            const ev = CAL_EVENTS.find(e => e.day === day && Math.floor(e.start) === h);
            return React.createElement("div", { key: h, className: "cal-day-row" },
              React.createElement("div", { className: "cal-day-time" }, h + ":00"),
              ev ? React.createElement("div", { className: "cal-day-card", style: { background: ev.color }, onClick: () => { if (ev.pid) ctx.openPatient(ev.pid); else ctx.toast(ev.name); } },
                React.createElement(Avatar, { name: ev.name, color: "rgba(255,255,255,.25)", size: 38, radius: "11px" }),
                React.createElement("div", null,
                  React.createElement("div", { style: { fontWeight: 700 } }, ev.name),
                  React.createElement("div", { style: { fontSize: 13, opacity: .9 } }, ev.work)),
                React.createElement("span", { style: { marginLeft: "auto", fontWeight: 700, fontSize: 13 } }, ev.dur + " ч")) :
                React.createElement("div", { className: "cal-day-empty", onClick: () => ctx.toast("Записать на " + h + ":00") }, React.createElement(Icon, { name: "plus", size: 15 }), "Свободно"));
          }))));
}

/* ---------------- NOTIFICATIONS ---------------- */
function Notifications({ ctx }) {
  const [items, setItems] = useState(() => NOTIFS.map(n => ({ ...n })));
  const unread = items.filter(n => n.unread).length;
  return React.createElement("div", { className: "content-pad", style: { maxWidth: 760 } },
    React.createElement("div", { style: { display: "flex", alignItems: "flex-end", marginBottom: 18 } },
      React.createElement("div", null,
        React.createElement("h1", { className: "page-h1" }, "Уведомления"),
        React.createElement("p", { style: { color: "var(--ink-3)", marginTop: 4 } }, unread + " непрочитанных")),
      React.createElement("button", { className: "btn-app gho", style: { marginLeft: "auto" }, onClick: () => setItems(it => it.map(n => ({ ...n, unread: false }))) }, "Прочитать всё")),
    React.createElement("div", { className: "card", style: { overflow: "hidden" } }, items.map((n, i) =>
      React.createElement("div", { key: n.id, className: "notif" + (n.unread ? " unread" : ""), onClick: () => { setItems(it => it.map(x => x.id === n.id ? { ...x, unread: false } : x)); if (n.pid) ctx.openPatient(n.pid); } },
        React.createElement("span", { className: "n-ic", style: { background: n.c + "1a", color: n.c } }, React.createElement(Icon, { name: n.icon, size: 19 })),
        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
          React.createElement("div", { className: "n-t" }, n.title),
          React.createElement("div", { className: "n-x" }, n.text)),
        React.createElement("span", { className: "n-time" }, n.time)))));
}

/* ---------------- ACTIVITY LOG (embedded in settings or own) ---------------- */
function ActivityLog() {
  let lastDate = null;
  return React.createElement("div", { className: "card" },
    React.createElement(CardHead, { title: "Журнал активности", icon: "history" }),
    React.createElement("div", { className: "card-pad" }, ACTIVITY.map((a, i) => {
      const showDate = a.date !== lastDate; lastDate = a.date;
      return React.createElement("div", { key: i },
        showDate ? React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: ".08em", margin: (i ? 16 : 0) + "px 0 6px" } }, a.date) : null,
        React.createElement("div", { className: "act-row" },
          React.createElement("span", { className: "act-dot", style: { background: a.color } }, initials(a.who)),
          React.createElement("div", { className: "act-txt" }, React.createElement("b", null, a.who), " " + a.action + " · ", React.createElement("b", null, a.target)),
          React.createElement("span", { className: "act-time" }, a.time)));
    })));
}

/* ---------------- BILLING ---------------- */
function Billing({ ctx }) {
  const b = BILLING;
  const fmt = n => n.toLocaleString("ru-RU") + " ₽";
  return React.createElement("div", { className: "content-pad", style: { maxWidth: 980 } },
    React.createElement("h1", { className: "page-h1", style: { marginBottom: 4 } }, "Биллинг и подписка"),
    React.createElement("p", { style: { color: "var(--ink-3)", marginBottom: 22 } }, "Тариф, использование и история платежей"),
    React.createElement("div", { className: "bill-grid" },
      React.createElement("div", null,
        React.createElement("div", { className: "bill-plan" },
          React.createElement("div", { style: { position: "relative", display: "flex", alignItems: "flex-start" } },
            React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", opacity: .7 } }, "Текущий тариф"),
              React.createElement("div", { className: "bp-name" }, "«" + b.plan + "»"),
              React.createElement("div", { style: { opacity: .8, fontSize: 14, marginTop: 4 } }, b.seats + " активных врача · " + fmt(b.price) + " / врач · мес")),
            React.createElement("button", { className: "btn-app", style: { marginLeft: "auto", background: "#fff", color: "var(--ink)", position: "relative" }, onClick: () => ctx.toast("Смена тарифа") }, "Сменить")),
          React.createElement("div", { style: { position: "relative", display: "flex", alignItems: "baseline", gap: 8, marginTop: 18 } },
            React.createElement("span", { style: { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34 } }, fmt(b.seats * b.price)),
            React.createElement("span", { style: { opacity: .7, fontSize: 14 } }, "/ мес · следующее списание " + b.nextDate))),
        React.createElement("div", { className: "card", style: { marginTop: 16, overflow: "hidden" } },
          React.createElement(CardHead, { title: "История платежей", icon: "cash" }),
          React.createElement("div", { className: "card-pad", style: { paddingTop: 6 } }, b.history.map((h, i) =>
            React.createElement("div", { key: i, className: "bill-row" },
              React.createElement("span", { style: { width: 36, height: 36, borderRadius: 10, background: "var(--good-tint)", color: "var(--good)", display: "grid", placeItems: "center", flex: "0 0 auto" } }, React.createElement(Icon, { name: "check", size: 16 })),
              React.createElement("div", null, React.createElement("div", { style: { fontWeight: 600, fontSize: 14.5 } }, h.desc), React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-3)" } }, h.date)),
              React.createElement("span", { className: "br-amt" }, fmt(h.amount)))))) ),
      React.createElement("div", null,
        React.createElement("div", { className: "card" },
          React.createElement(CardHead, { title: "Использование", icon: "chart" }),
          React.createElement("div", { className: "card-pad" },
            React.createElement("div", { style: { marginBottom: 20 } },
              React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 } }, React.createElement("span", { style: { fontWeight: 600 } }, "AI-анализов"), React.createElement("span", { style: { color: "var(--ink-3)" } }, b.usage.analyses + " · безлимит")),
              React.createElement("div", { className: "usage-bar" }, React.createElement("i", { style: { width: "58%" } }))),
            React.createElement("div", null,
              React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 } }, React.createElement("span", { style: { fontWeight: 600 } }, "Хранилище снимков"), React.createElement("span", { style: { color: "var(--ink-3)" } }, b.usage.storage + " / " + b.usage.storageLimit + " ГБ")),
              React.createElement("div", { className: "usage-bar" }, React.createElement("i", { style: { width: (b.usage.storage / b.usage.storageLimit * 100) + "%" } }))))),
        React.createElement("div", { className: "card", style: { marginTop: 16 } },
          React.createElement(CardHead, { title: "Способ оплаты", icon: "cash" }),
          React.createElement("div", { className: "card-pad", style: { display: "flex", alignItems: "center", gap: 13 } },
            React.createElement("span", { style: { width: 46, height: 32, borderRadius: 7, background: "linear-gradient(135deg,#FF5A36,#ff9d5c)", flex: "0 0 auto" } }),
            React.createElement("div", { style: { flex: 1 } }, React.createElement("div", { style: { fontWeight: 600 } }, "•••• 4821"), React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-3)" } }, "Истекает 08/27")),
            React.createElement("button", { className: "btn-app gho sm", onClick: () => ctx.toast("Изменить карту") }, "Изменить")))))
  );
}

Object.assign(window, { Community, Calendar, Notifications, ActivityLog, Billing });
