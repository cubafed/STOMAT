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

Object.assign(window, { DetBox, Film, BeforeAfter, ToothChart, Toast, Tag, Avatar, CardHead, Skeleton });
