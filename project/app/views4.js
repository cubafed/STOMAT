/* ============================================================
   Радикс Продукт — views4: Пародонтальная карта (Perio) + Склад (Inventory)
   ============================================================ */

/* ---------------- PERIO (пародонтальная карта) ---------------- */
const PERIO_UP = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const PERIO_LO = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const SITES = ["МЩ", "Щ", "ДЩ", "МЯ", "Я", "ДЯ"]; // мез/центр/дист · щёчно/язычно

function pdColor(v) { return v <= 3 ? "#18A06E" : v <= 5 ? "#E8941F" : "#ED4422"; }
function emptyChart() {
  const c = {};
  PERIO_UP.concat(PERIO_LO).forEach(t => { c[t] = { pd: [2, 2, 2, 2, 2, 2], bop: [false, false, false, false, false, false], mob: 0 }; });
  return c;
}
function perioStats(chart) {
  let sum = 0, n = 0, bop = 0, deep = 0, mob = 0;
  Object.keys(chart).forEach(t => {
    const c = chart[t];
    c.pd.forEach((v, i) => { sum += v; n++; if (c.bop[i]) bop++; if (v >= 5) deep++; });
    if (c.mob > 0) mob++;
  });
  const mean = n ? Math.round(sum / n * 10) / 10 : 0;
  const bopPct = n ? Math.round(bop / n * 100) : 0;
  const risk = deep >= 8 || bopPct >= 30 ? { t: "высокий", c: "#ED4422" } : deep >= 3 || bopPct >= 10 ? { t: "умеренный", c: "#E8941F" } : { t: "низкий", c: "#18A06E" };
  return { mean, bopPct, deep, mob, risk };
}

function Perio({ ctx }) {
  const [pid, setPid] = useState(ctx.patientId || (PATIENTS[0] && PATIENTS[0].id));
  const patient = PATIENTS.find(p => p.id === pid) || PATIENTS[0];
  const key = "perio_" + (patient ? patient.id : "x");
  const [chart, setChart] = useState(() => Object.assign(emptyChart(), RadixStore.get(key + "_chart", {})));
  const [sel, setSel] = useState(null);
  const [hist, setHist] = useState(() => RadixStore.get(key, []));
  useEffect(() => {
    setChart(Object.assign(emptyChart(), RadixStore.get("perio_" + patient.id + "_chart", {})));
    setHist(RadixStore.get("perio_" + patient.id, [])); setSel(null);
  }, [pid]);
  if (!patient) return null;

  const stats = perioStats(chart);
  function setSite(tooth, i, field, value) {
    setChart(c => {
      const nc = Object.assign({}, c);
      const cell = Object.assign({}, nc[tooth]);
      cell[field] = cell[field].slice(); cell[field][i] = value;
      nc[tooth] = cell;
      RadixStore.set("perio_" + patient.id + "_chart", nc);
      return nc;
    });
  }
  function setMob(tooth, v) {
    setChart(c => { const nc = Object.assign({}, c); nc[tooth] = Object.assign({}, nc[tooth], { mob: v }); RadixStore.set("perio_" + patient.id + "_chart", nc); return nc; });
  }
  function saveSnapshot() {
    const s = perioStats(chart);
    const d = new Date();
    const snap = { date: ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + d.getFullYear(), mean: s.mean, bopPct: s.bopPct, deep: s.deep };
    const nh = [snap].concat(hist).slice(0, 12);
    setHist(nh); RadixStore.set("perio_" + patient.id, nh);
    ctx.toast("Замер сохранён: средняя ГК " + s.mean + " мм, BoP " + s.bopPct + "%");
  }
  const prev = hist[0];
  const trend = prev ? Math.round((stats.mean - prev.mean) * 10) / 10 : null;

  function toothCell(t) {
    const c = chart[t], maxPd = Math.max.apply(null, c.pd), anyBop = c.bop.some(Boolean);
    return React.createElement("button", { key: t, onClick: () => setSel(t),
      style: { position: "relative", aspectRatio: "1", borderRadius: 9, border: "1.5px solid " + (sel === t ? "var(--primary)" : "var(--line)"), background: sel === t ? "var(--primary-tint)" : "#fff", display: "grid", placeItems: "center", cursor: "pointer", fontFamily: "inherit" } },
      React.createElement("span", { style: { fontSize: 9, color: "var(--ink-4)", position: "absolute", top: 2, left: 0, right: 0 } }, t),
      React.createElement("span", { style: { fontWeight: 800, fontFamily: "var(--font-display)", color: pdColor(maxPd), fontSize: 15 } }, maxPd),
      anyBop ? React.createElement("span", { style: { position: "absolute", bottom: 3, width: 6, height: 6, borderRadius: "50%", background: "#ED4422" } }) : null,
      c.mob > 0 ? React.createElement("span", { style: { position: "absolute", top: 2, right: 3, fontSize: 8, fontWeight: 700, color: "#7C5CFF" } }, "M" + c.mob) : null);
  }

  const sc = sel != null ? chart[sel] : null;
  return React.createElement("div", { className: "content-pad" },
    React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 18, flexWrap: "wrap" } },
      React.createElement("div", null,
        React.createElement("h1", { className: "page-h1" }, "Пародонтальная карта"),
        React.createElement("p", { style: { color: "var(--ink-3)", marginTop: 4 } }, "Глубина карманов, кровоточивость и подвижность · " + patient.name)),
      React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } },
        React.createElement("select", { value: pid, onChange: e => setPid(+e.target.value), style: { border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", font: "inherit", fontSize: 14, background: "#fff", color: "var(--ink)" } },
          PATIENTS.map(p => React.createElement("option", { key: p.id, value: p.id }, p.name))),
        React.createElement("button", { className: "btn-app pri", onClick: saveSnapshot }, React.createElement(Icon, { name: "check", size: 16 }), "Сохранить замер"))),

    // статистика
    React.createElement("div", { className: "stat-grid", style: { marginBottom: 18 } }, [
      { n: stats.mean + " мм", l: "Средняя глубина кармана", c: pdColor(stats.mean), bg: "var(--bg-soft)", ic: "ruler" },
      { n: stats.bopPct + "%", l: "Кровоточивость (BoP)", c: stats.bopPct >= 30 ? "#ED4422" : stats.bopPct >= 10 ? "#E8941F" : "#18A06E", bg: "var(--bg-soft)", ic: "shield" },
      { n: "" + stats.deep, l: "Карманов ≥5 мм", c: stats.deep ? "#ED4422" : "#18A06E", bg: "var(--bg-soft)", ic: "scan" },
      { n: stats.risk.t, l: "Риск пародонтита", c: stats.risk.c, bg: "var(--bg-soft)", ic: "chart" }
    ].map((s, i) => React.createElement("div", { className: "stat", key: i },
      React.createElement("div", { className: "s-ic", style: { background: s.bg, color: s.c } }, React.createElement(Icon, { name: s.ic, size: 20 })),
      React.createElement("div", { className: "s-num", style: { color: s.c, fontSize: 22 } }, s.n),
      React.createElement("div", { className: "s-lbl" }, s.l)))),

    React.createElement("div", { className: "card", style: { padding: 18, marginBottom: 18 } },
      React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-3)", marginBottom: 10 } }, "Верхняя челюсть · кликните зуб для ввода 6 точек"),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(16,1fr)", gap: 5, marginBottom: 12 } }, PERIO_UP.map(toothCell)),
      React.createElement("div", { style: { fontSize: 12.5, color: "var(--ink-3)", margin: "6px 0 10px" } }, "Нижняя челюсть"),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(16,1fr)", gap: 5 } }, PERIO_LO.map(toothCell)),
      React.createElement("div", { style: { display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap", fontSize: 12, color: "var(--ink-3)" } },
        [["#18A06E", "норма ≤3 мм"], ["#E8941F", "4–5 мм"], ["#ED4422", "≥6 мм · карман"], ["#ED4422", "● кровоточивость"], ["#7C5CFF", "M — подвижность"]].map((l, i) =>
          React.createElement("span", { key: i, style: { display: "flex", alignItems: "center", gap: 5 } },
            React.createElement("span", { style: { width: 9, height: 9, borderRadius: "50%", background: l[0] } }), l[1])))),

    // редактор выбранного зуба
    sc ? React.createElement("div", { className: "card", style: { padding: 20, marginBottom: 18 } },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 } },
        React.createElement("b", { style: { fontFamily: "var(--font-display)", fontSize: 17 } }, "Зуб " + sel),
        React.createElement("span", { style: { marginLeft: "auto", fontSize: 13, color: "var(--ink-3)" } }, "Подвижность:"),
        [0, 1, 2, 3].map(m => React.createElement("button", { key: m, onClick: () => setMob(sel, m), style: { width: 32, height: 32, borderRadius: 8, border: "1.5px solid " + (sc.mob === m ? "#7C5CFF" : "var(--line)"), background: sc.mob === m ? "#efeaff" : "#fff", fontWeight: 700, color: sc.mob === m ? "#7C5CFF" : "var(--ink-3)", cursor: "pointer" } }, m))),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 } }, SITES.map((site, i) =>
        React.createElement("div", { key: i, style: { textAlign: "center" } },
          React.createElement("div", { style: { fontSize: 11, color: "var(--ink-3)", marginBottom: 5 } }, site),
          React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 6 } },
            React.createElement("button", { onClick: () => setSite(sel, i, "pd", Math.max(1, sc.pd[i] - 1)), style: { width: 24, height: 24, borderRadius: 7, border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontWeight: 700 } }, "−"),
            React.createElement("span", { style: { width: 26, fontWeight: 800, fontFamily: "var(--font-display)", color: pdColor(sc.pd[i]) } }, sc.pd[i]),
            React.createElement("button", { onClick: () => setSite(sel, i, "pd", Math.min(12, sc.pd[i] + 1)), style: { width: 24, height: 24, borderRadius: 7, border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontWeight: 700 } }, "+")),
          React.createElement("button", { onClick: () => setSite(sel, i, "bop", !sc.bop[i]), style: { fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 999, border: "none", cursor: "pointer", background: sc.bop[i] ? "#FCE6E2" : "var(--bg-soft)", color: sc.bop[i] ? "#ED4422" : "var(--ink-4)" } }, sc.bop[i] ? "● кровь" : "нет")))) ) : null,

    // динамика
    hist.length ? React.createElement("div", { className: "card" },
      React.createElement(CardHead, { title: "Динамика по визитам", icon: "history",
        right: trend != null ? React.createElement(Tag, { c: trend <= 0 ? "#18b27a" : "#ED4422", tint: trend <= 0 ? "#E2F6EE" : "#FCE6E2" }, (trend <= 0 ? "▼ " : "▲ +") + Math.abs(trend) + " мм к прошлому") : null }),
      React.createElement("div", null, hist.map((h, i) =>
        React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 14, padding: "11px 20px", borderBottom: i < hist.length - 1 ? "1px solid var(--line)" : "none" } },
          React.createElement("span", { style: { fontWeight: 700, fontFamily: "var(--font-display)", width: 90 } }, h.date),
          React.createElement("span", { style: { fontSize: 13.5 } }, "Средняя ГК: ", React.createElement("b", { style: { color: pdColor(h.mean) } }, h.mean + " мм")),
          React.createElement("span", { style: { fontSize: 13.5, marginLeft: 16 } }, "BoP: ", React.createElement("b", null, h.bopPct + "%")),
          React.createElement("span", { style: { fontSize: 13.5, marginLeft: "auto", color: "var(--ink-3)" } }, "карманов ≥5: " + h.deep))))) : null);
}

/* ---------------- INVENTORY (склад материалов) ---------------- */
const INV_SEED = [
  { id: "i1", name: "Композит (шприц)", unit: "шт", qty: 24, min: 10, perUse: 1, price: 1200 },
  { id: "i2", name: "Анестетик (карпула)", unit: "шт", qty: 60, min: 30, perUse: 2, price: 90 },
  { id: "i3", name: "Перчатки (пара)", unit: "пар", qty: 8, min: 50, perUse: 2, price: 25 },
  { id: "i4", name: "Боры (набор)", unit: "шт", qty: 14, min: 8, perUse: 1, price: 350 },
  { id: "i5", name: "Слюноотсосы", unit: "шт", qty: 120, min: 80, perUse: 2, price: 6 },
  { id: "i6", name: "Стоматологические маски", unit: "шт", qty: 35, min: 40, perUse: 1, price: 15 }
];
function invStatus(it) {
  if (it.qty <= 0) return { t: "Нет в наличии", c: "#ED4422", tint: "#FCE6E2" };
  if (it.qty <= it.min) return { t: "Заканчивается", c: "#E8941F", tint: "#FBEFD9" };
  return { t: "В наличии", c: "#18A06E", tint: "#E1F4EC" };
}

function Inventory({ ctx }) {
  const [items, setItems] = useState(() => {
    const saved = RadixStore.get("inventory", null);
    return saved && saved.length ? saved : INV_SEED.slice();
  });
  const [form, setForm] = useState(false);
  function persist(next) { setItems(next); RadixStore.set("inventory", next); }
  function adj(id, d) { persist(items.map(it => it.id === id ? Object.assign({}, it, { qty: Math.max(0, it.qty + d) }) : it)); }
  function useUp(it) { persist(items.map(x => x.id === it.id ? Object.assign({}, x, { qty: Math.max(0, x.qty - x.perUse) }) : x)); ctx.toast("Списано: " + it.name + " ×" + it.perUse); }
  function remove(id) { persist(items.filter(it => it.id !== id)); }
  function add(data) {
    persist([{ id: "i" + Date.now(), name: data.name, unit: data.unit || "шт", qty: +data.qty || 0, min: +data.min || 0, perUse: +data.perUse || 1, price: +data.price || 0 }].concat(items));
    setForm(false); ctx.toast("Позиция добавлена: " + data.name);
  }
  const low = items.filter(it => it.qty <= it.min);
  const totalVal = items.reduce((s, it) => s + it.qty * it.price, 0);

  return React.createElement("div", { className: "content-pad" },
    form ? React.createElement(InvForm, { onSave: add, onClose: () => setForm(false) }) : null,
    React.createElement("div", { style: { display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 18, flexWrap: "wrap" } },
      React.createElement("div", null,
        React.createElement("h1", { className: "page-h1" }, "Склад и материалы"),
        React.createElement("p", { style: { color: "var(--ink-3)", marginTop: 4 } }, items.length + " позиций · запас на " + totalVal.toLocaleString("ru-RU") + " ₽")),
      React.createElement("button", { className: "btn-app pri", style: { marginLeft: "auto" }, onClick: () => setForm(true) }, React.createElement(Icon, { name: "plus", size: 16 }), "Добавить позицию")),

    low.length ? React.createElement("div", { className: "card", style: { marginBottom: 18, borderColor: "#E8941F", background: "#FBEFD9" } },
      React.createElement("div", { style: { padding: "13px 20px", display: "flex", alignItems: "center", gap: 10, color: "#9a6212", fontWeight: 600, fontSize: 14 } },
        React.createElement(Icon, { name: "bell", size: 18 }),
        "Пора дозаказать (" + low.length + "): " + low.map(it => it.name).join(", "))) : null,

    React.createElement("div", { className: "card", style: { overflow: "hidden" } },
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1.2fr auto", gap: 10, padding: "12px 20px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-4)", fontWeight: 700 } },
        React.createElement("span", null, "Материал"), React.createElement("span", null, "Остаток"), React.createElement("span", null, "Статус"), React.createElement("span", null, "Действия"), React.createElement("span", null)),
      items.map((it, i) => {
        const st = invStatus(it);
        return React.createElement("div", { key: it.id, style: { display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1.2fr auto", gap: 10, padding: "13px 20px", borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none", alignItems: "center" } },
          React.createElement("div", null,
            React.createElement("div", { style: { fontWeight: 600, fontSize: 14.5 } }, it.name),
            React.createElement("div", { style: { fontSize: 12, color: "var(--ink-3)" } }, it.price.toLocaleString("ru-RU") + " ₽/" + it.unit + " · мин " + it.min)),
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            React.createElement("button", { onClick: () => adj(it.id, -1), style: { width: 26, height: 26, borderRadius: 7, border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontWeight: 700 } }, "−"),
            React.createElement("b", { style: { minWidth: 38, textAlign: "center", fontFamily: "var(--font-display)", color: st.c } }, it.qty + " " + it.unit),
            React.createElement("button", { onClick: () => adj(it.id, 1), style: { width: 26, height: 26, borderRadius: 7, border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontWeight: 700 } }, "+")),
          React.createElement(Tag, { c: st.c, tint: st.tint }, st.t),
          React.createElement("button", { className: "btn-app gho sm", onClick: () => useUp(it) }, "Списать ×" + it.perUse),
          React.createElement("button", { className: "icon-btn", style: { width: 30, height: 30 }, title: "Удалить", onClick: () => remove(it.id) }, React.createElement(Icon, { name: "x", size: 15 }))); }))
  );
}

function InvForm({ onSave, onClose }) {
  const [f, setF] = useState({ name: "", unit: "шт", qty: "", min: "", perUse: "1", price: "" });
  const inp = { width: "100%", padding: "10px 13px", border: "1px solid var(--line)", borderRadius: 11, fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff", color: "var(--ink)" };
  const lbl = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", margin: "12px 0 5px" };
  return React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 300, background: "rgba(10,8,5,.45)", display: "grid", placeItems: "center", padding: 16 }, onClick: onClose },
    React.createElement("div", { className: "card", style: { width: "min(440px,100%)", padding: 24 }, onClick: e => e.stopPropagation() },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 } },
        React.createElement("h3", { style: { fontFamily: "var(--font-display)", fontSize: 19, flex: 1 } }, "Новая позиция"),
        React.createElement("button", { className: "icon-btn", onClick: onClose }, React.createElement(Icon, { name: "x", size: 16 }))),
      React.createElement("label", { style: lbl }, "Название"),
      React.createElement("input", { style: inp, value: f.name, autoFocus: true, placeholder: "Композит, анестетик…", onChange: e => setF(Object.assign({}, f, { name: e.target.value })) }),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 } },
        React.createElement("div", null, React.createElement("label", { style: lbl }, "Остаток"), React.createElement("input", { style: inp, type: "number", value: f.qty, onChange: e => setF(Object.assign({}, f, { qty: e.target.value })) })),
        React.createElement("div", null, React.createElement("label", { style: lbl }, "Минимум"), React.createElement("input", { style: inp, type: "number", value: f.min, onChange: e => setF(Object.assign({}, f, { min: e.target.value })) })),
        React.createElement("div", null, React.createElement("label", { style: lbl }, "Ед."), React.createElement("input", { style: inp, value: f.unit, onChange: e => setF(Object.assign({}, f, { unit: e.target.value })) }))),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
        React.createElement("div", null, React.createElement("label", { style: lbl }, "Расход за приём"), React.createElement("input", { style: inp, type: "number", value: f.perUse, onChange: e => setF(Object.assign({}, f, { perUse: e.target.value })) })),
        React.createElement("div", null, React.createElement("label", { style: lbl }, "Цена за ед., ₽"), React.createElement("input", { style: inp, type: "number", value: f.price, onChange: e => setF(Object.assign({}, f, { price: e.target.value })) }))),
      React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 20 } },
        React.createElement("button", { className: "btn-app pri", style: { flex: 1 }, disabled: !f.name.trim(), onClick: () => f.name.trim() && onSave(f) }, "Добавить"),
        React.createElement("button", { className: "btn-app gho", onClick: onClose }, "Отмена"))));
}

Object.assign(window, { Perio, Inventory });
