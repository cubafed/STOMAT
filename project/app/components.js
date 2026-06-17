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
/* Номер зуба (FDI) из находки: число, строка «36», диапазон «31-41» → int|null */
function toothNum(t) {
  if (typeof t === "number") return t;
  if (t == null) return null;
  var m = String(t).match(/\d{1,2}/);
  return m ? +m[0] : null;
}

/* Одонтограмма: карта зубов FDI с подсветкой проблемных. findings — массив
   находок (или patient.findings). hot — номер зуба для акцента. */
function ToothChart({ patient, findings, onTooth, hot }) {
  const list = findings || (patient && patient.findings) || [];
  const upper = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lower = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  const map = {}; // tooth -> { info, sev }
  const legend = []; const seen = {};
  list.forEach(f => {
    const info = findingInfo(f); const sev = f.severity || 2;
    if (!seen[info.label]) { seen[info.label] = 1; legend.push(info); }
    const n = toothNum(f.tooth); if (n == null) return;
    if (!map[n] || sev > map[n].sev) map[n] = { info, sev, label: info.label };
  });
  function cell(n) {
    const d = map[n];
    const c = d ? d.info.c : null;
    return React.createElement("button", {
      key: n, className: "odo-cell" + (d ? " on" : "") + (hot === n ? " hot" : ""),
      style: d ? { "--c": c, background: d.info.tint || "#fff", borderColor: c } : null,
      title: d ? d.label + " · зуб " + n : "Зуб " + n + " · норма",
      onClick: () => onTooth && onTooth(n, d ? d.info : null)
    },
      React.createElement(Icon, { name: "tooth", size: 20 }),
      d && d.sev >= 2 ? React.createElement("span", { className: "odo-sev", style: { background: c } }, d.sev === 3 ? "!" : "") : null,
      React.createElement("span", { className: "odo-num", style: d ? { color: c } : null }, n));
  }
  return React.createElement("div", { className: "odo" },
    React.createElement("div", { className: "odo-lbl" }, "Верхняя челюсть"),
    React.createElement("div", { className: "odo-arch" }, upper.map(cell)),
    React.createElement("div", { className: "odo-arch" }, lower.map(cell)),
    React.createElement("div", { className: "odo-lbl", style: { marginTop: 6 } }, "Нижняя челюсть"),
    legend.length
      ? React.createElement("div", { className: "odo-legend" }, legend.map((info, i) =>
          React.createElement("span", { key: i, className: "odo-leg" }, React.createElement("i", { style: { background: info.c } }), info.label)))
      : React.createElement("div", { className: "odo-empty" }, "Находок нет — зубы в норме"));
}

/* Общая раскладка: находки → карта зуб→{info,sev} + легенда */
function jawFindingMap(list) {
  const map = {}, legend = [], seen = {};
  (list || []).forEach(f => {
    const info = findingInfo(f); const sev = f.severity || 2;
    if (!seen[info.label]) { seen[info.label] = 1; legend.push(info); }
    const n = toothNum(f.tooth); if (n == null) return;
    if (!map[n] || sev > map[n].sev) map[n] = { info, sev };
  });
  return { map, legend };
}
function jawLegend(legend) {
  return legend.length
    ? React.createElement("div", { className: "odo-legend" }, legend.map((info, i) =>
        React.createElement("span", { key: i, className: "odo-leg" }, React.createElement("i", { style: { background: info.c } }), info.label)))
    : React.createElement("div", { className: "odo-empty" }, "Находок нет — зубы в норме");
}
const FDI_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const FDI_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

/* 2D-челюсть: зубы по анатомической дуге (а не сеткой), подсветка проблемных */
function JawMap({ findings, hot, onTooth }) {
  const { map, legend } = jawFindingMap(findings);
  const W = 480, H = 300, cx = W / 2, spanX = 200;
  function arch(list, baseY, depth, lower) {
    return list.map((n, i) => {
      const t = (i / (list.length - 1)) * 2 - 1;            // -1..1
      const x = cx + t * spanX;
      const y = lower ? baseY - (1 - t * t) * depth : baseY + (1 - t * t) * depth;
      const rot = (lower ? -1 : 1) * t * 46;
      const d = map[n]; const c = d ? d.info.c : null;
      return React.createElement("g", {
        key: n, transform: "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ") rotate(" + rot.toFixed(1) + ")",
        style: { cursor: "pointer" }, onClick: () => onTooth && onTooth(n, d ? d.info : null)
      },
        React.createElement("rect", {
          x: -9.5, y: -13, width: 19, height: 26, rx: 6,
          fill: d ? (d.info.tint || "#fff") : "#fff",
          stroke: d ? c : "#d6dae6", strokeWidth: d ? 2.2 : 1.2,
          style: hot === n ? { filter: "drop-shadow(0 0 7px " + c + ")" } : null
        }),
        d && d.sev >= 3 ? React.createElement("circle", { cx: 8, cy: -12, r: 4.6, fill: c }) : null,
        React.createElement("text", { x: 0, y: 4, textAnchor: "middle", fontSize: 8, fontWeight: 700, fill: d ? c : "#9aa0b0", transform: "rotate(" + (-rot).toFixed(1) + ")" }, n));
    });
  }
  return React.createElement("div", { className: "jawmap" },
    React.createElement("svg", { viewBox: "0 0 " + W + " " + H, style: { width: "100%", maxWidth: 600, display: "block", margin: "0 auto" } },
      React.createElement("text", { x: cx, y: 13, textAnchor: "middle", fontSize: 10, fontWeight: 700, fill: "#9aa0b0", letterSpacing: ".1em" }, "ВЕРХНЯЯ"),
      arch(FDI_UPPER, 42, 72, false),
      arch(FDI_LOWER, H - 42, 72, true),
      React.createElement("text", { x: cx, y: H - 4, textAnchor: "middle", fontSize: 10, fontWeight: 700, fill: "#9aa0b0", letterSpacing: ".1em" }, "НИЖНЯЯ")),
    jawLegend(legend));
}

/* 3D-челюсть: процедурная дуга зубов на three.js, подсветка проблемных, drag-вращение */
function JawMap3D({ findings }) {
  const ref = useRef(null);
  const { legend } = jawFindingMap(findings);
  useEffect(() => {
    let frame = 0, disposed = false, cleanup = function () {};
    function boot(THREE) {
      const el = ref.current; if (disposed || !el) return;
      const W = el.clientWidth || 480, H = 320;
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(45, W / H, 0.1, 100); cam.position.set(0, 1.5, 15);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      el.innerHTML = ""; el.appendChild(renderer.domElement);
      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const dl = new THREE.DirectionalLight(0xffffff, 0.85); dl.position.set(4, 9, 10); scene.add(dl);
      const group = new THREE.Group(); group.rotation.x = -0.35; scene.add(group);
      const map = {};
      (findings || []).forEach(f => { const n = toothNum(f.tooth); if (n == null) return; const info = findingInfo(f); const sev = f.severity || 2; if (!map[n] || sev > map[n].sev) map[n] = { c: info.c, sev }; });
      function makeGeo() { return THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.34, 0.7, 4, 10) : new THREE.CylinderGeometry(0.32, 0.26, 1.1, 12); }
      function row(list, yBase) {
        list.forEach((n, i) => {
          const t = (i / (list.length - 1)) * 2 - 1;
          const x = t * 5.4, z = (1 - t * t) * 3.4;
          const d = map[n];
          const col = new THREE.Color(d ? d.c : 0xe9ebf2);
          const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.08, emissive: d ? new THREE.Color(d.c).multiplyScalar(0.28) : new THREE.Color(0x000000) });
          const m = new THREE.Mesh(makeGeo(), mat); m.position.set(x, yBase, z); group.add(m);
        });
      }
      row(FDI_UPPER, 1.15); row(FDI_LOWER, -1.15);
      let dragging = false, px = 0, py = 0;
      const dom = renderer.domElement;
      const down = e => { dragging = true; px = e.clientX; py = e.clientY; };
      const up = () => { dragging = false; };
      const move = e => { if (!dragging) return; group.rotation.y += (e.clientX - px) * 0.01; group.rotation.x += (e.clientY - py) * 0.008; px = e.clientX; py = e.clientY; };
      dom.addEventListener("pointerdown", down); window.addEventListener("pointerup", up); window.addEventListener("pointermove", move);
      function loop() { frame = requestAnimationFrame(loop); if (!dragging) group.rotation.y += 0.004; renderer.render(scene, cam); }
      loop();
      cleanup = function () { cancelAnimationFrame(frame); dom.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", up); window.removeEventListener("pointermove", move); try { renderer.dispose(); } catch (e) {} if (el) el.innerHTML = ""; };
    }
    if (window.THREE) boot(window.THREE);
    else {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js";
      s.onload = () => boot(window.THREE);
      s.onerror = () => { if (ref.current) ref.current.innerHTML = '<div style="padding:40px;text-align:center;color:#9aa0b0;font-size:13px">3D-библиотека не загрузилась — переключитесь на 2D.</div>'; };
      document.head.appendChild(s);
    }
    return () => { disposed = true; cleanup(); };
  }, [findings]);
  return React.createElement("div", null,
    React.createElement("div", { ref, className: "jaw3d", style: { width: "100%", height: 320, borderRadius: 14, overflow: "hidden", background: "radial-gradient(120% 90% at 50% 18%, #222b44, #0d1220)", cursor: "grab" } }),
    React.createElement("div", { style: { fontSize: 12, color: "var(--ink-4)", textAlign: "center", marginTop: 6 } }, "Зажмите и тяните, чтобы вращать"),
    jawLegend(legend));
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

Object.assign(window, { DetBox, Film, BeforeAfter, ToothChart, toothNum, JawMap, JawMap3D, Toast, Tag, Avatar, CardHead, Skeleton, EmptyState, Scheduler });
