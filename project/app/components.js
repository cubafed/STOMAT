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

/* полуширина зуба по типу (FDI единицы): резцы уже, моляры шире */
function toothHalfW(n) {
  const u = n % 10;
  if (u <= 1) return 7;        // центральный резец
  if (u === 2) return 6.5;     // боковой резец
  if (u === 3) return 7;       // клык
  if (u <= 5) return 8;        // премоляры
  return 10.5;                 // моляры 6,7,8
}

/* анатомический глиф зуба по типу (коронка вниз +y, корень вверх -y, шейка y=0) */
function toothPaths(n, w, ch, rh) {
  const u = n % 10;
  if (u <= 2) return { // резец — долото
    crown: "M " + (-w) + " 0 L " + w + " 0 L " + (w * 0.96) + " " + (ch * 0.78) + " Q 0 " + (ch + 2) + " " + (-w * 0.96) + " " + (ch * 0.78) + " Z",
    root: "M " + (-w * 0.5) + " 0 L " + (w * 0.5) + " 0 L 0 " + (-rh) + " Z" };
  if (u === 3) return { // клык
    crown: "M " + (-w) + " 0 L " + w + " 0 L " + (w * 0.6) + " " + (ch * 0.6) + " L 0 " + (ch + 4) + " L " + (-w * 0.6) + " " + (ch * 0.6) + " Z",
    root: "M " + (-w * 0.5) + " 0 L " + (w * 0.5) + " 0 L 0 " + (-rh * 1.15) + " Z" };
  if (u <= 5) return { // премоляр — 2 бугра
    crown: "M " + (-w) + " 0 L " + w + " 0 L " + w + " " + (ch * 0.68) + " Q " + (w * 0.5) + " " + ch + " " + (w * 0.25) + " " + (ch * 0.72) + " Q 0 " + (ch * 0.52) + " " + (-w * 0.25) + " " + (ch * 0.72) + " Q " + (-w * 0.5) + " " + ch + " " + (-w) + " " + (ch * 0.68) + " Z",
    root: "M " + (-w * 0.45) + " 0 L " + (w * 0.45) + " 0 L 0 " + (-rh) + " Z" };
  return { // моляр — квадрат с буграми, 2 корня
    crown: "M " + (-w) + " 0 L " + w + " 0 L " + w + " " + (ch * 0.72) + " Q " + (w * 0.66) + " " + ch + " " + (w * 0.4) + " " + (ch * 0.74) + " Q " + (w * 0.2) + " " + (ch * 0.92) + " 0 " + (ch * 0.74) + " Q " + (-w * 0.2) + " " + (ch * 0.92) + " " + (-w * 0.4) + " " + (ch * 0.74) + " Q " + (-w * 0.66) + " " + ch + " " + (-w) + " " + (ch * 0.72) + " Z",
    root: "M " + (-w * 0.78) + " 0 L " + (-w * 0.12) + " 0 L " + (-w * 0.4) + " " + (-rh) + " Z M " + (w * 0.12) + " 0 L " + (w * 0.78) + " 0 L " + (w * 0.4) + " " + (-rh) + " Z" };
}

/* 2D-челюсть: анатомические зубы по дуге, дёсны, подсветка проблемных */
function JawMap({ findings, hot, onTooth }) {
  const { map, legend } = jawFindingMap(findings);
  const W = 560, H = 340, cx = W / 2, spanX = 244;
  function layout(list, baseY, depth, lower) {
    return list.map((n, i) => {
      const t = (i / (list.length - 1)) * 2 - 1;
      return { n, t, lower, x: cx + t * spanX, y: lower ? baseY - (1 - t * t) * depth : baseY + (1 - t * t) * depth, rot: (lower ? -1 : 1) * t * 58 };
    });
  }
  const up = layout(FDI_UPPER, 54, 92, false);
  const lo = layout(FDI_LOWER, H - 54, 92, true);
  const gum = pts => pts.map((p, i) => (i ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" ");
  function tooth(p) {
    const d = map[p.n], c = d ? d.info.c : null, w = toothHalfW(p.n);
    const paths = toothPaths(p.n, w, 17, 16);
    return React.createElement("g", { key: p.n, transform: "translate(" + p.x.toFixed(1) + "," + p.y.toFixed(1) + ")", style: { cursor: "pointer" }, onClick: () => onTooth && onTooth(p.n, d ? d.info : null) },
      React.createElement("g", { transform: "rotate(" + p.rot.toFixed(1) + ") scale(1," + (p.lower ? -1 : 1) + ")" },
        React.createElement("path", { d: paths.root, fill: d ? c : "#e6dfce", opacity: 0.82 }),
        React.createElement("path", { d: paths.crown, fill: d ? (d.info.tint || "#fff") : "url(#enamelG)", stroke: d ? c : "#c9cedd", strokeWidth: d ? 2 : 1.1, strokeLinejoin: "round", style: hot === p.n ? { filter: "drop-shadow(0 0 8px " + c + ")" } : null })),
      d && d.sev >= 3 ? React.createElement("circle", { cx: w * 0.9, cy: p.lower ? 15 : -15, r: 4.4, fill: c, stroke: "#fff", strokeWidth: 1 }) : null,
      React.createElement("text", { x: 0, y: p.lower ? 30 : -22, textAnchor: "middle", fontSize: 8.5, fontWeight: 700, fill: d ? c : "#a7adbb" }, p.n));
  }
  return React.createElement("div", { className: "jawmap" },
    React.createElement("svg", { viewBox: "0 0 " + W + " " + H, style: { width: "100%", maxWidth: 660, display: "block", margin: "0 auto" } },
      React.createElement("defs", null,
        React.createElement("linearGradient", { id: "enamelG", x1: 0, y1: 0, x2: 0, y2: 1 },
          React.createElement("stop", { offset: 0, stopColor: "#ffffff" }),
          React.createElement("stop", { offset: 1, stopColor: "#e7eaf1" }))),
      React.createElement("path", { d: gum(up), fill: "none", stroke: "#eeb6bf", strokeWidth: 20, strokeLinecap: "round", opacity: 0.55 }),
      React.createElement("path", { d: gum(lo), fill: "none", stroke: "#eeb6bf", strokeWidth: 20, strokeLinecap: "round", opacity: 0.55 }),
      React.createElement("text", { x: cx, y: 16, textAnchor: "middle", fontSize: 10, fontWeight: 700, fill: "#9aa0b0", letterSpacing: ".12em" }, "ВЕРХНЯЯ"),
      up.map(tooth), lo.map(tooth),
      React.createElement("text", { x: cx, y: H - 4, textAnchor: "middle", fontSize: 10, fontWeight: 700, fill: "#9aa0b0", letterSpacing: ".12em" }, "НИЖНЯЯ")),
    jawLegend(legend));
}

/* Загрузка three.js (UMD + examples/js — версия с глобальным THREE и аддонами) */
var JAW_GLB = (typeof window !== "undefined" && window.RADIX_CFG && window.RADIX_CFG.jawModel) || "";
var THREE_BASE = "https://cdn.jsdelivr.net/npm/three@0.137.5/";
var TEETH_BASE = (typeof window !== "undefined" && window.RADIX_CFG && window.RADIX_CFG.teethBase) || "project/assets/models/teeth/";
function loadScriptOnce(src) {
  return new Promise(function (res, rej) {
    if (Array.prototype.some.call(document.scripts, function (s) { return s.src === src; })) return res();
    var el = document.createElement("script"); el.src = src; el.onload = function () { res(); }; el.onerror = function () { rej(new Error("Не загрузился " + src)); };
    document.head.appendChild(el);
  });
}
function ensureThree(needGltf) {
  return Promise.resolve()
    .then(function () { return window.THREE ? null : loadScriptOnce(THREE_BASE + "build/three.min.js"); })
    .then(function () { return Promise.all([
      window.THREE.OrbitControls ? null : loadScriptOnce(THREE_BASE + "examples/js/controls/OrbitControls.js").catch(function () { return null; }),
      window.THREE.RoomEnvironment ? null : loadScriptOnce(THREE_BASE + "examples/js/environments/RoomEnvironment.js").catch(function () { return null; }),
      (needGltf && !window.THREE.GLTFLoader) ? loadScriptOnce(THREE_BASE + "examples/js/loaders/GLTFLoader.js").catch(function () { return null; }) : null
    ]); })
    .then(function () { return window.THREE; });
}

/* 3D-челюсть: дёсны + зубы (или .glb-модель, если задана RADIX_CFG.jawModel), подсветка */
function JawMap3D({ findings }) {
  const ref = useRef(null);
  const { legend } = jawFindingMap(findings);
  useEffect(() => {
    let frame = 0, disposed = false, cleanup = function () {};
    const map = {};
    (findings || []).forEach(f => { const n = toothNum(f.tooth); if (n == null) return; const info = findingInfo(f); const sev = f.severity || 2; if (!map[n] || sev > map[n].sev) map[n] = { c: info.c, sev }; });

    function build(THREE) {
      const el = ref.current; if (disposed || !el) return;
      const W = el.clientWidth || 480, H = 340;
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(42, W / H, 0.1, 100); cam.position.set(0, 3.2, 15);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
      el.innerHTML = ""; el.appendChild(renderer.domElement);
      let envTex = null;
      try { const pm = new THREE.PMREMGenerator(renderer); envTex = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture; scene.environment = envTex; } catch (e) {}
      scene.add(new THREE.HemisphereLight(0xffffff, 0x404a5a, 0.55));
      const keyL = new THREE.DirectionalLight(0xffffff, 0.8); keyL.position.set(5, 9, 8); scene.add(keyL);
      const rimL = new THREE.DirectionalLight(0x9fc0ff, 0.4); rimL.position.set(-6, 3, -7); scene.add(rimL);
      const group = new THREE.Group(); group.rotation.x = -0.22; scene.add(group);
      const PhysMat = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;
      const SPAN = 5.6, DEPTH = 4.4, FWD = 1.2;
      const archZ = t => -(1 - t * t) * DEPTH + FWD;
      // дёсны — труба вдоль дуги
      function gum(yBase) {
        const pts = [];
        for (let i = 0; i <= 20; i++) { const t = i / 20 * 2 - 1; pts.push(new THREE.Vector3(t * SPAN, yBase, archZ(t))); }
        const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.6, 16, false);
        return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xe09aa4, roughness: 0.82 }));
      }
      // запасные «коронки» (если 3D-модели зубов не загрузятся)
      function procTooth(n, yGum, upper, t) {
        const d = map[n], u = n % 10;
        const wide = u >= 6 ? 1.4 : u === 3 ? 0.8 : u <= 2 ? 0.72 : 1.0;
        const enamel = new PhysMat({ color: new THREE.Color(d ? d.c : 0xf4f2ea), roughness: 0.25, metalness: 0, clearcoat: 0.9, clearcoatRoughness: 0.25, emissive: d ? new THREE.Color(d.c).multiplyScalar(0.32) : new THREE.Color(0x000000) });
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.46, 18, 14), enamel);
        m.scale.set(wide, 1.15, wide * 0.92);
        m.position.set(t * SPAN, yGum + (upper ? -0.6 : 0.6), archZ(t));
        group.add(m);
      }
      function placeProcedural() {
        FDI_UPPER.forEach((n, i) => procTooth(n, 1.05, true, (i / 15) * 2 - 1));
        FDI_LOWER.forEach((n, i) => procTooth(n, -1.05, false, (i / 15) * 2 - 1));
      }
      // нормализовать модель зуба: центр в 0, единичная высота
      function normTooth(obj) {
        const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
        obj.position.sub(center);
        const h = size.y || size.x || size.z || 1; obj.scale.multiplyScalar(1 / h);
        const wrap = new THREE.Group(); wrap.add(obj); return wrap;
      }
      // собрать реальную челюсть из анатомических моделей зубов
      function placeReal(protos) {
        const TS = 1.7, YUP = 0.5, YLO = -0.5, TILT = 0.15, RADIAL = 0.5;
        function put(order, upper) {
          order.forEach((n, i) => {
            const file = (upper ? "u" : "l") + (n % 10) + ".glb"; const proto = protos[file]; if (!proto) return;
            const t = (i / (order.length - 1)) * 2 - 1; const u = n % 10;
            const wide = u >= 6 ? 1.35 : u === 3 ? 0.85 : u <= 2 ? 0.82 : 1.0;
            const th = proto.clone(true);
            th.scale.multiplyScalar(TS * wide);
            const q = Math.floor(n / 10), mirror = (q === 1 || q === 4);
            if (mirror) th.scale.x *= -1;
            th.rotation.x = upper ? Math.PI - TILT : TILT;   // коронкой к линии смыкания
            th.rotation.y = (mirror ? 1 : -1) * Math.abs(t) * RADIAL;
            th.position.set(t * SPAN, upper ? YUP : YLO, archZ(t));
            const d = map[n];
            if (d) th.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.emissive = new THREE.Color(d.c); o.material.emissiveIntensity = 0.65; if (o.material.color) o.material.color.lerp(new THREE.Color(d.c), 0.55); } });
            group.add(th);
          });
        }
        put(FDI_UPPER, true); put(FDI_LOWER, false);
      }

      group.add(gum(1.05)); group.add(gum(-1.05));   // дёсны всегда
      let controls = null, dragging = false, px = 0, py = 0, cleanupExtra = function () {};
      const dom = renderer.domElement;
      if (THREE.OrbitControls) {
        controls = new THREE.OrbitControls(cam, dom); controls.enablePan = false; controls.enableDamping = true; controls.minDistance = 8; controls.maxDistance = 24; controls.autoRotate = true; controls.autoRotateSpeed = 0.7; controls.target.set(0, 0, FWD - 1);
      } else { // ручное вращение, если OrbitControls не загрузился
        const down = e => { dragging = true; px = e.clientX; py = e.clientY; };
        const upE = () => { dragging = false; };
        const mv = e => { if (!dragging) return; group.rotation.y += (e.clientX - px) * 0.01; group.rotation.x += (e.clientY - py) * 0.008; px = e.clientX; py = e.clientY; };
        dom.addEventListener("pointerdown", down); window.addEventListener("pointerup", upE); window.addEventListener("pointermove", mv);
        cleanupExtra = () => { dom.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", upE); window.removeEventListener("pointermove", mv); };
      }
      cam.lookAt(0, 0, FWD - 1);
      function loop() { frame = requestAnimationFrame(loop); if (controls) controls.update(); else if (!dragging) group.rotation.y += 0.005; renderer.render(scene, cam); }
      loop();
      cleanup = function () { cancelAnimationFrame(frame); if (controls) controls.dispose(); cleanupExtra(); try { renderer.dispose(); } catch (e) {} if (envTex) { try { envTex.dispose(); } catch (e) {} } if (el) el.innerHTML = ""; };

      // собрать челюсть из 16 анатомических моделей зубов (запасной вариант — процедурная)
      if (THREE.GLTFLoader) {
        const loader = new THREE.GLTFLoader();
        const files = []; for (let i = 1; i <= 8; i++) { files.push("u" + i + ".glb"); files.push("l" + i + ".glb"); }
        const protos = {};
        Promise.all(files.map(f => loader.loadAsync(TEETH_BASE + f).then(g => { protos[f] = normTooth(g.scene); }).catch(() => {})))
          .then(() => { if (disposed) return; Object.keys(protos).length >= 8 ? placeReal(protos) : placeProcedural(); })
          .catch(() => { if (!disposed) placeProcedural(); });
      } else {
        placeProcedural();
      }
    }
    ensureThree(true).then(build).catch(() => { if (ref.current) ref.current.innerHTML = '<div style="padding:46px;text-align:center;color:#9aa0b0;font-size:13px">3D-движок не загрузился — используйте 2D.</div>'; });
    return () => { disposed = true; cleanup(); };
  }, [findings]);
  return React.createElement("div", null,
    React.createElement("div", { ref, className: "jaw3d", style: { width: "100%", height: 340, borderRadius: 14, overflow: "hidden", background: "radial-gradient(120% 90% at 50% 16%, #243150, #0c1120)", cursor: "grab" } }),
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
