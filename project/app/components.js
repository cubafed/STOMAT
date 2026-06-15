/* ============================================================
   Радикс Продукт — shared UI components
   ============================================================ */

/* Detection box over a radiograph film */
function DetBox({ d, idx, hot, onHover }) {
  const info = findingInfo(d);
  return React.createElement("div", {
    className: "det" + (hot === idx ? " hot" : ""),
    style: { left: d.box.x + "%", top: d.box.y + "%", width: d.box.w + "%", height: d.box.h + "%", "--c": info.c },
    onMouseEnter: () => onHover && onHover(idx),
    onMouseLeave: () => onHover && onHover(-1)
  },
    React.createElement("div", { className: "box" }),
    React.createElement("div", { className: "lbl" }, info.label.split(" ")[0],
      d.pc ? React.createElement("span", { className: "pc" }, d.pc + "%") : null));
}

/* Dark radiograph film with optional scanning + detections */
function Film({ patient, dets, showDet = true, hot = -1, onHover, scanning = false, style }) {
  return React.createElement("div", { className: "rv-film", style },
    React.createElement(Arch, patient.arch),
    scanning ? React.createElement("div", { className: "scanline" }) : null,
    showDet && dets ? React.createElement("div", { className: "det-layer" },
      dets.map((d, i) => React.createElement(DetBox, { key: i, d, idx: i, hot, onHover }))) : null);
}

/* Before / after comparison slider */
function BeforeAfter({ before, after, tagBefore = "До лечения", tagAfter = "После" }) {
  const ref = useRef(null);
  const [split, setSplit] = useState(50);
  const drag = useRef(false);
  function move(clientX) {
    const r = ref.current.getBoundingClientRect();
    setSplit(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
  }
  return React.createElement("div", {
    className: "ba", ref,
    style: { "--split": split + "%" },
    onPointerDown: e => { drag.current = true; ref.current.setPointerCapture(e.pointerId); move(e.clientX); },
    onPointerMove: e => { if (drag.current) move(e.clientX); },
    onPointerUp: () => { drag.current = false; }
  },
    React.createElement("div", { className: "ba-layer ba-before" }, React.createElement(Arch, before)),
    React.createElement("div", { className: "ba-layer ba-after" }, React.createElement(Arch, after)),
    React.createElement("div", { className: "ba-tag l" }, tagBefore),
    React.createElement("div", { className: "ba-tag r" }, tagAfter),
    React.createElement("div", { className: "ba-handle" },
      React.createElement("div", { className: "ba-knob" },
        React.createElement("svg", { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 },
          React.createElement("path", { d: "m9 7-5 5 5 5M15 7l5 5-5 5" })))));
}

/* Tooth chart (16 cells) reflecting findings state */
function ToothChart({ patient, onTooth }) {
  const upper = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lower = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  const map = {};
  patient.findings.forEach(f => { if (typeof f.tooth === "number") map[f.tooth] = findingInfo(f); });
  function cell(n) {
    const info = map[n];
    const color = info ? info.c : "#c2cadb";
    return React.createElement("button", {
      key: n, className: "tooth-cell", style: { color }, title: info ? info.label + " · " + n : "Зуб " + n,
      onClick: () => onTooth && onTooth(n, info)
    },
      React.createElement(Icon, { name: "tooth", size: 24 }),
      React.createElement("span", { className: "tnum", style: { color: "var(--ink-4)" } }, n));
  }
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
    React.createElement("div", { style: { fontSize: 12, color: "var(--ink-3)", fontWeight: 600 } }, "Верхняя челюсть"),
    React.createElement("div", { className: "toothchart" }, upper.map(cell)),
    React.createElement("div", { style: { fontSize: 12, color: "var(--ink-3)", fontWeight: 600, marginTop: 6 } }, "Нижняя челюсть"),
    React.createElement("div", { className: "toothchart" }, lower.map(cell)));
}

/* Toast */
function Toast({ msg, show }) {
  return React.createElement("div", { className: "toast" + (show ? " show" : "") },
    React.createElement("span", { className: "t-ic" }, React.createElement(Icon, { name: "check", size: 18 })), msg);
}

/* Small status tag */
function Tag({ c, tint, children }) {
  return React.createElement("span", { className: "tag", style: { background: tint, color: c } },
    React.createElement("i", { style: { background: c } }), children);
}

/* Avatar */
function Avatar({ name, color, size = 42, radius = "50%", fontSize }) {
  return React.createElement("div", {
    style: { width: size, height: size, borderRadius: radius, background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: fontSize || size * 0.36, flex: "0 0 auto", fontFamily: "var(--font-display)" }
  }, initials(name));
}

/* Section card header */
function CardHead({ title, icon, right }) {
  return React.createElement("div", { className: "card-h" },
    icon ? React.createElement("span", { style: { color: "var(--primary)" } }, React.createElement(Icon, { name: icon, size: 18 })) : null,
    React.createElement("h3", null, title),
    React.createElement("div", { className: "ch-spacer" }),
    right || null);
}

/* Loading skeleton — generic dashboard-ish placeholder */
function Skeleton() {
  const bar = (w, h, mt) => React.createElement("div", { className: "skel", style: { width: w, height: h || 14, marginTop: mt || 0 } });
  const card = (children, key) => React.createElement("div", { className: "skel-card", key, style: { marginBottom: 16 } }, children);
  return React.createElement("div", { className: "content-pad skel-page" },
    bar("220px", 30), bar("320px", 14, 12),
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, margin: "22px 0" } },
      [0, 1, 2, 3].map(i => React.createElement("div", { className: "skel-card", key: i },
        React.createElement("div", { className: "skel", style: { width: 40, height: 40, borderRadius: 11 } }),
        bar("60%", 26, 14), bar("80%", 12, 8)))),
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 } },
      card([0, 1, 2, 3].map(i => React.createElement("div", { className: "skel-row", key: i, style: { marginBottom: 16 } },
        React.createElement("div", { className: "skel", style: { width: 38, height: 38, borderRadius: 11, flex: "0 0 auto" } }),
        React.createElement("div", { style: { flex: 1 } }, bar("50%", 13), bar("70%", 11, 7))))),
      card([0, 1, 2].map(i => React.createElement("div", { className: "skel-row", key: i, style: { marginBottom: 16 } },
        React.createElement("div", { className: "skel", style: { width: 34, height: 34, borderRadius: 10, flex: "0 0 auto" } }),
        React.createElement("div", { style: { flex: 1 } }, bar("60%", 12), bar("85%", 10, 6)))))));
}

/* Универсальное пустое состояние — единый брендовый вид для всех разделов.
   props: icon, title, sub, cta (текст кнопки), onCta, tone ("soft" | "card") */
function EmptyState({ icon, title, sub, cta, onCta, tone }) {
  return React.createElement("div", { className: "empty-state" + (tone === "card" ? " es-card" : "") },
    React.createElement("div", { className: "es-ic" }, React.createElement(Icon, { name: icon || "sparkle", size: 26 })),
    React.createElement("div", { className: "es-title" }, title),
    sub ? React.createElement("div", { className: "es-sub" }, sub) : null,
    cta ? React.createElement("button", { className: "btn-app pri", style: { marginTop: 18 }, onClick: onCta },
      React.createElement(Icon, { name: "plus", size: 16 }), cta) : null);
}

/* Планировщик приёма — единый для воронки CRM и расписания.
   patient: фиксированный пациент (из карточки сделки) либо null → выбор из списка.
   onPick({ pid, name, color, day, start, dur, work }) */
function Scheduler({ patient, work, onPick, onClose }) {
  const DAYS = window.CAL_DAYS || [];
  const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const people = window.PATIENTS || [];
  const [pid, setPid] = useState(patient ? patient.id : (people[0] ? people[0].id : ""));
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState(10);
  const [dur, setDur] = useState(1);
  const [w, setW] = useState(work || "Приём");
  const inp = { width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff", color: "var(--ink)" };
  const lbl = { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)", margin: "14px 0 6px" };
  const target = patient || people.find(x => x.id === +pid);
  function confirm() {
    if (!target) return;
    onPick({ pid: target.id, name: target.name, color: target.color, day: +day, start: +hour, dur: +dur, work: (w || "").trim() || "Приём" });
  }
  return React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 320, background: "rgba(10,8,5,.45)", display: "grid", placeItems: "center", padding: 16 }, onClick: onClose },
    React.createElement("div", { className: "card", style: { width: "min(420px, 100%)", padding: 22 }, onClick: e => e.stopPropagation() },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 } },
        React.createElement("span", { style: { color: "var(--primary)" } }, React.createElement(Icon, { name: "calendar", size: 18 })),
        React.createElement("h3", { style: { fontFamily: "var(--font-display)", fontSize: 18, flex: 1 } }, "Записать на приём"),
        React.createElement("button", { className: "icon-btn", onClick: onClose }, React.createElement(Icon, { name: "x", size: 16 }))),
      patient
        ? React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginTop: 8 } },
            React.createElement(Avatar, { name: patient.name, color: patient.color, size: 36 }),
            React.createElement("div", { style: { fontWeight: 600 } }, patient.name))
        : (people.length
            ? React.createElement("div", null,
                React.createElement("label", { style: lbl }, "Пациент"),
                React.createElement("select", { style: inp, value: pid, onChange: e => setPid(e.target.value) },
                  people.map(p => React.createElement("option", { key: p.id, value: p.id }, p.name))))
            : React.createElement("div", { style: { marginTop: 10, fontSize: 13.5, color: "var(--ink-3)" } }, "Сначала добавьте пациента в разделе «Пациенты».")),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
        React.createElement("div", null,
          React.createElement("label", { style: lbl }, "День"),
          React.createElement("select", { style: inp, value: day, onChange: e => setDay(e.target.value) },
            DAYS.map((d, i) => React.createElement("option", { key: i, value: i }, d)))),
        React.createElement("div", null,
          React.createElement("label", { style: lbl }, "Время"),
          React.createElement("select", { style: inp, value: hour, onChange: e => setHour(e.target.value) },
            HOURS.map(h => React.createElement("option", { key: h, value: h }, h + ":00"))))),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
        React.createElement("div", null,
          React.createElement("label", { style: lbl }, "Длительность"),
          React.createElement("select", { style: inp, value: dur, onChange: e => setDur(e.target.value) },
            [["0.5", "30 мин"], ["1", "1 час"], ["1.5", "1,5 часа"], ["2", "2 часа"]].map(o =>
              React.createElement("option", { key: o[0], value: o[0] }, o[1])))),
        React.createElement("div", null,
          React.createElement("label", { style: lbl }, "Тип приёма"),
          React.createElement("input", { style: inp, value: w, onChange: e => setW(e.target.value), placeholder: "Приём" }))),
      React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 20 } },
        React.createElement("button", { className: "btn-app pri", style: { flex: 1 }, disabled: !target, onClick: confirm }, React.createElement(Icon, { name: "check", size: 16 }), "Записать"),
        React.createElement("button", { className: "btn-app gho", onClick: onClose }, "Отмена"))));
}

Object.assign(window, { DetBox, Film, BeforeAfter, ToothChart, Toast, Tag, Avatar, CardHead, Skeleton, EmptyState, Scheduler });
