/* ============================================================
   Радикс Продукт — shared data, icons, radiograph renderer
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;

/* ---------- Icons (stroke, currentColor) ---------- */
const ICONS = {
  home: '<path d="M3 11 12 3l9 8M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5"/><path d="M16 5.5a3 3 0 0 1 0 5.5M21 20c0-2.6-1.3-4.2-3.5-4.8"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M3 12h18"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12Z"/><path d="M8 11h8M8 14h5"/>',
  doc: '<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  chart: '<path d="M4 20V4M4 20h16M8 16V11M12 16V7M16 16v-3M20 16V9"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.7-1.3-1.7-3-2 .8a7.5 7.5 0 0 0-2.6-1.5L14.4 2H9.6l-.4 2a7.5 7.5 0 0 0-2.6 1.5l-2-.8-1.7 3 1.7 1.3a7.6 7.6 0 0 0 0 3l-1.7 1.3 1.7 3 2-.8a7.5 7.5 0 0 0 2.6 1.5l.4 2h4.8l.4-2a7.5 7.5 0 0 0 2.6-1.5l2 .8 1.7-3-1.7-1.3Z"/>',
  tooth: '<path d="M12 4c-1.6 0-2.2 1-3.6 1S6 4 4.8 5C4 6 4 7.6 4.6 10c.4 1.7.7 3.4 1.1 5.2.3 1.4.6 3.3 1.8 3.3 1 0 1-1.8 1.3-3 .2-.9.5-1.5 1.2-1.5s1 .6 1.2 1.5c.3 1.2.3 3 1.3 3 1.2 0 1.5-1.9 1.8-3.3.4-1.8.7-3.5 1.1-5.2C19 7.6 19 6 18.2 5 17 4 16 5 14.6 5S13.6 4 12 4Z"/>',
  bell: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  send: '<path d="m3 3 18 9-18 9 4-9-4-9Z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  ruler: '<path d="m3 8 5-5 13 13-5 5L3 8ZM7 7l1.5 1.5M10 4l2 2M5 10l2 2"/>',
  contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18" fill="currentColor"/>',
  zoom: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4-4M11 8v6M8 11h6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5ZM3 14l9 5 9-5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/>',
  print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/>'
};

function Icon({ name, size = 19, style }) {
  return React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round",
    style, dangerouslySetInnerHTML: { __html: ICONS[name] || "" }
  });
}

/* ---------- Schematic dental radiograph (SVG) ---------- */
function toothPaths(cx, halfW, biteY, dir, rootLen, crownH, twoRoots) {
  const x0 = cx - halfW, x1 = cx + halfW, r = halfW * 0.55;
  const crownTop = biteY - dir * crownH, base = biteY;
  let crown = `M${x0},${base}L${x0},${crownTop + dir * r}Q${x0},${crownTop} ${x0 + r},${crownTop}` +
    `L${x1 - r},${crownTop}Q${x1},${crownTop} ${x1},${crownTop + dir * r}L${x1},${base}Z`;
  const tip = base + dir * rootLen;
  let roots = twoRoots
    ? `M${x0 + halfW * 0.15},${base} L${cx - halfW * 0.18},${tip} L${cx - halfW * 0.05},${base}Z` +
      `M${x1 - halfW * 0.15},${base} L${cx + halfW * 0.18},${tip} L${cx + halfW * 0.05},${base}Z`
    : `M${x0 + halfW * 0.2},${base} L${cx},${tip} L${x1 - halfW * 0.2},${base}Z`;
  return { crown, roots };
}

function Arch({ count = 7, restoreAt = null, decayAt = [], viewH = 460 }) {
  const W = 680, bite = viewH * 0.5, gap = W / count, halfBase = gap * 0.40;
  const els = [];
  els.push(React.createElement("rect", { key: "bg", x: 0, y: 0, width: W, height: viewH, fill: "url(#mvpBone)" }));
  for (let i = 0; i < count; i++) {
    const cx = gap * (i + 0.5);
    const molar = (i <= 1 || i >= count - 2);
    const hw = halfBase * (molar ? 1.05 : 0.82);
    [[-1, molar ? 86 : 70, 56], [1, molar ? 92 : 74, 58]].forEach(([dir, rl, ch], k) => {
      const tp = toothPaths(cx, hw, bite + dir * 6, dir, rl, ch, molar);
      const fill = dir < 0 ? "url(#mvpEnamelInv)" : "url(#mvpEnamel)";
      els.push(React.createElement("path", { key: `r${i}${k}`, d: tp.roots, fill, opacity: .62 }));
      els.push(React.createElement("path", { key: `c${i}${k}`, d: tp.crown, fill, stroke: "rgba(20,26,48,.5)", strokeWidth: 1 }));
      if (restoreAt === i && dir > 0)
        els.push(React.createElement("rect", { key: `f${i}`, x: cx - hw * 0.5, y: bite + 4, width: hw, height: 16, rx: 3, fill: "#f4f7fc" }));
      if (decayAt.indexOf(i) > -1)
        els.push(React.createElement("ellipse", { key: `d${i}${k}`, cx: cx + hw * 0.3, cy: bite + dir * (ch * 0.5), rx: hw * 0.28, ry: ch * 0.28, fill: "rgba(8,11,22,.6)" }));
    });
  }
  els.push(React.createElement("rect", { key: "bite", x: 0, y: bite - 5, width: W, height: 10, fill: "rgba(8,11,22,.7)" }));
  return React.createElement("svg", { className: "arch", viewBox: `0 0 680 ${viewH}`, preserveAspectRatio: "xMidYMid slice" },
    React.createElement("defs", null,
      React.createElement("linearGradient", { id: "mvpEnamel", x1: 0, y1: 0, x2: 0, y2: 1 },
        React.createElement("stop", { offset: 0, stopColor: "#dfe5ef" }), React.createElement("stop", { offset: 1, stopColor: "#9aa3b6" })),
      React.createElement("linearGradient", { id: "mvpEnamelInv", x1: 0, y1: 1, x2: 0, y2: 0 },
        React.createElement("stop", { offset: 0, stopColor: "#dfe5ef" }), React.createElement("stop", { offset: 1, stopColor: "#9aa3b6" })),
      React.createElement("linearGradient", { id: "mvpBone", x1: 0, y1: 0, x2: 0, y2: 1 },
        React.createElement("stop", { offset: 0, stopColor: "#2a3350" }), React.createElement("stop", { offset: 1, stopColor: "#141a30" }))),
    els);
}

/* ---------- Mock data ---------- */
const PALS = ["#FF5A36", "#18A06E", "#E8941F", "#7C5CFF", "#11AEC8", "#2F4BF0"];
function initials(name) { return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase(); }

const FIND_LIB = {
  caries: { c: "#FF5A36", tint: "#FFE6DD", label: "Кариес дентина", sev: "Высокий", price: 6500, group: "caries" },
  cariesE: { c: "#FF5A36", tint: "#FFE6DD", label: "Кариес эмали", sev: "Средний", price: 4800, group: "caries" },
  tartar: { c: "#E8941F", tint: "#FBEFD9", label: "Зубной камень", sev: "Средний", price: 4200, group: "perio" },
  periap: { c: "#7C5CFF", tint: "#EFEAFF", label: "Периапикальный очаг", sev: "Высокий", price: 12000, group: "endo" },
  periodontitis: { c: "#C0392B", tint: "#F8E2DE", label: "Периодонтит", sev: "Высокий", price: 9000, group: "perio" },
  resorption: { c: "#D81B60", tint: "#FBE3EC", label: "Резорбция корня", sev: "Высокий", price: 11000, group: "endo" },
  cyst: { c: "#8E44AD", tint: "#F0E7F7", label: "Киста / гранулёма", sev: "Высокий", price: 14000, group: "endo" },
  crowding: { c: "#2E86DE", tint: "#E2EEFB", label: "Скученность зубов", sev: "Средний", price: 1900, group: "ortho" },
  impacted: { c: "#16A085", tint: "#DEF3EE", label: "Ретенция зуба мудрости", sev: "Средний", price: 8000, group: "surgery" },
  resto: { c: "#11AEC8", tint: "#DBF4F8", label: "Реставрация", sev: "Норма", price: 0, group: "ok" }
};
// Стадии тяжести (ICDAS-подобно): 1 начальная · 2 умеренная · 3 выраженная
const SEVERITY = {
  1: { label: "Начальная", c: "#18A06E", tint: "#E1F4EC", risk: 1 },
  2: { label: "Умеренная", c: "#E8941F", tint: "#FBEFD9", risk: 2 },
  3: { label: "Выраженная", c: "#ED4422", tint: "#FCE6E2", risk: 3 }
};
function severityInfo(s) { return SEVERITY[s] || null; }

const PATIENTS = [
  {
    id: 1, name: "Анна Ковалёва", age: 34, since: "2021", ins: "ДМС", color: PALS[0], status: "active",
    next: "24 июня · 10:00", phone: "+7 916 320-18-04", flag: "caries",
    findings: [
      { type: "caries", tooth: 26, loc: "дистально", pc: 94, box: { x: 17, y: 28, w: 12, h: 16 } },
      { type: "cariesE", tooth: 37, loc: "окклюзионно", pc: 88, box: { x: 62, y: 55, w: 13, h: 16 } },
      { type: "tartar", tooth: "31–41", loc: "придёсенно", pc: 81, box: { x: 40, y: 46, w: 10, h: 12 } },
      { type: "resto", tooth: 46, loc: "композит", pc: 99, box: { x: 75, y: 29, w: 11, h: 13 } }
    ],
    arch: { count: 7, restoreAt: 5, decayAt: [1, 4] },
    visits: [
      { t: "Лечение кариеса 26", d: "12.09.2025", c: "#18b27a" },
      { t: "Профгигиена", d: "03.06.2025", c: "#3B5BFF" },
      { t: "Консультация · план", d: "21.02.2025", c: "#9AA2BB" }
    ]
  },
  {
    id: 2, name: "Игорь Семёнов", age: 47, since: "2019", ins: "ОМС", color: PALS[1], status: "active",
    next: "26 июня · 14:30", phone: "+7 903 114-77-20", flag: "periap",
    findings: [
      { type: "periap", tooth: 16, loc: "апекс щёчного корня", pc: 90, box: { x: 20, y: 22, w: 13, h: 18 } },
      { type: "caries", tooth: 24, loc: "медиально", pc: 86, box: { x: 45, y: 30, w: 11, h: 14 } },
      { type: "tartar", tooth: "нижний фронт", loc: "язычно", pc: 78, box: { x: 55, y: 58, w: 14, h: 12 } }
    ],
    arch: { count: 7, restoreAt: 2, decayAt: [0, 3] },
    visits: [
      { t: "Эндодонтия 16 · этап 1", d: "08.09.2025", c: "#f0a12e" },
      { t: "Снимок КЛКТ", d: "01.09.2025", c: "#7c5cff" }
    ]
  },
  {
    id: 3, name: "Мария Лебедева", age: 28, since: "2023", ins: "ДМС", color: PALS[2], status: "active",
    next: "—", phone: "+7 925 880-43-19", flag: "ok",
    findings: [
      { type: "tartar", tooth: "верхний фронт", loc: "нёбно", pc: 76, box: { x: 38, y: 30, w: 12, h: 13 } },
      { type: "resto", tooth: 36, loc: "композит", pc: 98, box: { x: 64, y: 56, w: 12, h: 14 } }
    ],
    arch: { count: 7, restoreAt: 4, decayAt: [] },
    visits: [
      { t: "Профгигиена", d: "14.08.2025", c: "#3B5BFF" },
      { t: "Отбеливание", d: "20.05.2025", c: "#12b8d6" }
    ]
  },
  {
    id: 4, name: "Дмитрий Орлов", age: 52, since: "2018", ins: "ОМС", color: PALS[3], status: "review",
    next: "23 июня · 09:00", phone: "+7 909 233-55-71", flag: "caries",
    findings: [
      { type: "caries", tooth: 47, loc: "дистально", pc: 92, box: { x: 66, y: 54, w: 13, h: 17 } },
      { type: "caries", tooth: 17, loc: "окклюзионно", pc: 89, box: { x: 18, y: 26, w: 12, h: 15 } },
      { type: "periap", tooth: 36, loc: "бифуркация", pc: 84, box: { x: 60, y: 60, w: 12, h: 13 } },
      { type: "tartar", tooth: "генерализованно", loc: "придёсенно", pc: 83, box: { x: 40, y: 47, w: 11, h: 12 } }
    ],
    arch: { count: 7, restoreAt: 3, decayAt: [0, 6] },
    visits: [
      { t: "Консультация · план", d: "10.09.2025", c: "#9AA2BB" }
    ]
  },
  {
    id: 5, name: "Елена Васина", age: 41, since: "2020", ins: "ДМС", color: PALS[4], status: "active",
    next: "27 июня · 16:00", phone: "+7 916 700-12-88", flag: "ok",
    findings: [
      { type: "cariesE", tooth: 25, loc: "медиально", pc: 79, box: { x: 44, y: 28, w: 11, h: 13 } },
      { type: "resto", tooth: 16, loc: "вкладка", pc: 97, box: { x: 20, y: 27, w: 12, h: 14 } }
    ],
    arch: { count: 7, restoreAt: 1, decayAt: [3] },
    visits: [
      { t: "Реставрация 16", d: "02.07.2025", c: "#18b27a" },
      { t: "Профгигиена", d: "15.03.2025", c: "#3B5BFF" }
    ]
  },
  {
    id: 6, name: "Павел Гущин", age: 36, since: "2022", ins: "ОМС", color: PALS[5], status: "active",
    next: "—", phone: "+7 903 451-09-33", flag: "ok",
    findings: [
      { type: "resto", tooth: 46, loc: "композит", pc: 99, box: { x: 70, y: 55, w: 12, h: 14 } }
    ],
    arch: { count: 7, restoreAt: 5, decayAt: [] },
    visits: [
      { t: "Профгигиена", d: "30.07.2025", c: "#3B5BFF" }
    ]
  },
  {
    id: 7, name: "Ольга Титова", age: 29, since: "2026", ins: "ДМС", color: "#11AEC8", status: "active",
    next: "23 июня · 12:00", phone: "+7 905 661-22-90", flag: "ok",
    findings: [
      { type: "tartar", tooth: "нижний фронт", loc: "язычно", pc: 74, box: { x: 50, y: 56, w: 13, h: 12 } }
    ],
    arch: { count: 7, restoreAt: null, decayAt: [] },
    visits: [{ t: "Первичный приём", d: "23.06.2026", c: "#11AEC8" }]
  },
  {
    id: 8, name: "Сергей Мальков", age: 58, since: "2024", ins: "ОМС", color: "#2F4BF0", status: "review",
    next: "25 июня · 13:00", phone: "+7 916 042-77-13", flag: "periap",
    findings: [
      { type: "periap", tooth: 36, loc: "отсутствует, атрофия", pc: 87, box: { x: 58, y: 58, w: 14, h: 16 } },
      { type: "tartar", tooth: "генерализованно", loc: "придёсенно", pc: 80, box: { x: 36, y: 46, w: 11, h: 12 } }
    ],
    arch: { count: 8, restoreAt: 2, decayAt: [5] },
    visits: [{ t: "КЛКТ · планирование имплантации", d: "18.06.2026", c: "#2F4BF0" }]
  },
  {
    id: 9, name: "Никита Власов", age: 24, since: "2025", ins: "ДМС", color: "#7C5CFF", status: "active",
    next: "26 июня · 16:00", phone: "+7 903 778-50-41", flag: "ok",
    findings: [
      { type: "cariesE", tooth: 14, loc: "медиально", pc: 77, box: { x: 42, y: 30, w: 11, h: 13 } }
    ],
    arch: { count: 7, restoreAt: 3, decayAt: [4] },
    visits: [{ t: "Ортодонтия · элайнеры этап 2", d: "12.06.2026", c: "#7C5CFF" }]
  },
  {
    id: 10, name: "Татьяна Реброва", age: 45, since: "2021", ins: "ДМС", color: "#E8941F", status: "active",
    next: "—", phone: "+7 925 113-88-02", flag: "caries",
    findings: [
      { type: "caries", tooth: 45, loc: "дистально", pc: 91, box: { x: 64, y: 52, w: 12, h: 16 } },
      { type: "resto", tooth: 26, loc: "композит", pc: 98, box: { x: 22, y: 28, w: 12, h: 13 } }
    ],
    arch: { count: 7, restoreAt: 1, decayAt: [5] },
    visits: [{ t: "Профгигиена", d: "20.05.2026", c: "#18A06E" }]
  }
];

function findingInfo(f) {
  const lib = FIND_LIB[f.type];
  const custom = (window.RadixStore ? RadixStore.get("prices", {}) : {})[f.type];
  return { ...lib, ...(custom != null ? { price: custom } : {}), ...f };
}
function statusTag(flag) {
  if (flag === "caries") return { t: "Требует лечения", c: "#FF5A36", tint: "#FFE6DD" };
  if (flag === "periap") return { t: "Эндодонтия", c: "#7C5CFF", tint: "#EFEAFF" };
  return { t: "Здоров", c: "#18A06E", tint: "#E1F4EC" };
}

/* ---------- CRM pipeline ---------- */
const CRM_STAGES = [
  { id: "new", t: "Новый лид", c: "#2F4BF0" },
  { id: "consult", t: "Консультация", c: "#11AEC8" },
  { id: "plan", t: "План отправлен", c: "#E8941F" },
  { id: "treat", t: "В лечении", c: "#7C5CFF" },
  { id: "done", t: "Завершён", c: "#18A06E" }
];
const CRM_CARDS = [
  { id: "c1", pid: 4, name: "Дмитрий Орлов", color: PALS[3], stage: "new", work: "Кариес · эндодонтия", val: 21000, date: "Сегодня", prob: 35, src: "Сайт" },
  { id: "c2", pid: 7, name: "Ольга Титова", color: "#E8941F", stage: "new", work: "Первичная консультация", val: 3500, date: "Сегодня", prob: 25, src: "Instagram" },
  { id: "c3", pid: 1, name: "Анна Ковалёва", color: PALS[0], stage: "consult", work: "Лечение кариеса 26", val: 13000, date: "Завтра", prob: 60, src: "Повторный" },
  { id: "c4", pid: 8, name: "Сергей Мальков", color: "#2F4BF0", stage: "consult", work: "Имплантация", val: 78000, date: "26 июня", prob: 55, src: "Рекомендация" },
  { id: "c5", pid: 2, name: "Игорь Семёнов", color: PALS[1], stage: "plan", work: "Эндодонтия 16", val: 24000, date: "Ожидает 2 дня", prob: 70, src: "Сайт" },
  { id: "c6", pid: 5, name: "Елена Васина", color: PALS[4], stage: "plan", work: "Реставрация + гигиена", val: 11000, date: "Ожидает 1 день", prob: 75, src: "Повторный" },
  { id: "c7", pid: 9, name: "Никита Власов", color: "#7C5CFF", stage: "treat", work: "Ортодонтия · элайнеры", val: 145000, date: "Этап 2 из 8", prob: 90, src: "Рекомендация" },
  { id: "c8", pid: 3, name: "Мария Лебедева", color: PALS[2], stage: "treat", work: "Отбеливание", val: 18000, date: "Этап 1 из 2", prob: 92, src: "Повторный" },
  { id: "c9", pid: 6, name: "Павел Гущин", color: PALS[5], stage: "done", work: "Профгигиена", val: 3800, date: "30.07", prob: 100, src: "Повторный" }
];
const CRM_FOLLOWUPS = [
  { who: "Анна Ковалёва", color: PALS[0], action: "Напомнить о визите 24 июня", type: "call", due: "через 2 часа", c: "#FF5A36" },
  { who: "Игорь Семёнов", color: PALS[1], action: "План лечения ждёт ответа", type: "msg", due: "сегодня", c: "#E8941F" },
  { who: "Сергей Мальков", color: "#2F4BF0", action: "Отправить расчёт по имплантации", type: "msg", due: "завтра", c: "#2F4BF0" },
  { who: "Ольга Титова", color: "#E8941F", action: "Перезвонить новому лиду", type: "call", due: "сегодня", c: "#FF5A36" }
];

/* ---------- Team members ---------- */
const TEAM = [
  { id: "u1", name: "Алексей Петров", role: "Стоматолог-терапевт", color: "#18A06E", me: true },
  { id: "u2", name: "Ольга Зайцева", role: "Ортодонт", color: "#7C5CFF" },
  { id: "u3", name: "Марат Хуснуллин", role: "Хирург-имплантолог", color: "#2F4BF0" },
  { id: "u4", name: "Дарья Кравец", role: "Гигиенист", color: "#11AEC8" },
  { id: "u5", name: "Виктор Лозовой", role: "Администратор", color: "#E8941F" }
];

/* ---------- Calendar (week schedule) ---------- */
const CAL_DAYS = ["Пн 23", "Вт 24", "Ср 25", "Чт 26", "Пт 27", "Сб 28"];
const CAL_EVENTS = [
  { day: 0, start: 9, dur: 1, pid: 4, name: "Дмитрий Орлов", work: "Консультация · план", color: "#7C5CFF" },
  { day: 0, start: 10, dur: 1.5, pid: 1, name: "Анна Ковалёва", work: "Лечение кариеса 26", color: "#FF5A36" },
  { day: 0, start: 12, dur: 1, pid: null, name: "Ольга Титова", work: "Первичный приём", color: "#E8941F" },
  { day: 0, start: 14.5, dur: 1, pid: 5, name: "Елена Васина", work: "Реставрация 25", color: "#11AEC8" },
  { day: 1, start: 9.5, dur: 2, pid: 2, name: "Игорь Семёнов", work: "Эндодонтия 16 · этап 2", color: "#7C5CFF" },
  { day: 1, start: 12, dur: 1, pid: 3, name: "Мария Лебедева", work: "Отбеливание", color: "#11AEC8" },
  { day: 1, start: 15, dur: 1, pid: 6, name: "Павел Гущин", work: "Профгигиена", color: "#18A06E" },
  { day: 2, start: 10, dur: 1, pid: 1, name: "Анна Ковалёва", work: "Контрольный осмотр", color: "#FF5A36" },
  { day: 2, start: 13, dur: 2.5, pid: null, name: "Сергей Мальков", work: "Имплантация", color: "#2F4BF0" },
  { day: 3, start: 9, dur: 1, pid: 5, name: "Елена Васина", work: "Снятие швов", color: "#11AEC8" },
  { day: 3, start: 11, dur: 1.5, pid: 2, name: "Игорь Семёнов", work: "Эндодонтия 16 · этап 3", color: "#7C5CFF" },
  { day: 3, start: 16, dur: 1, pid: null, name: "Никита Власов", work: "Ортодонтия · контроль", color: "#7C5CFF" },
  { day: 4, start: 10, dur: 1, pid: 3, name: "Мария Лебедева", work: "Профгигиена", color: "#18A06E" },
  { day: 4, start: 12.5, dur: 1.5, pid: 4, name: "Дмитрий Орлов", work: "Лечение кариеса 47", color: "#FF5A36" },
  { day: 5, start: 11, dur: 1, pid: 6, name: "Павел Гущин", work: "Консультация", color: "#18A06E" }
];

/* ---------- Notifications ---------- */
const NOTIFS = [
  { id: "n1", type: "ai", icon: "sparkle", c: "#FF5A36", title: "Анализ снимка готов", text: "Радикс-Vision нашёл 4 находки у Дмитрия Орлова", time: "5 мин назад", unread: true, pid: 4 },
  { id: "n2", type: "plan", icon: "doc", c: "#18A06E", title: "План принят пациентом", text: "Анна Ковалёва согласилась с планом на 21 000 ₽", time: "40 мин назад", unread: true, pid: 1 },
  { id: "n3", type: "chat", icon: "chat", c: "#2F4BF0", title: "Ольга Зайцева упомянула вас", text: "«@Алексей посмотри снимок пациента 16, нужна консультация»", time: "1 ч назад", unread: true },
  { id: "n4", type: "cal", icon: "calendar", c: "#7C5CFF", title: "Напоминание о приёме", text: "Игорь Семёнов — эндодонтия завтра в 09:30", time: "2 ч назад", unread: false },
  { id: "n5", type: "billing", icon: "cash", c: "#E8941F", title: "Списание по подписке", text: "Тариф «Клиника» · 4 врача · 11 600 ₽", time: "Вчера", unread: false },
  { id: "n6", type: "community", icon: "users", c: "#11AEC8", title: "Новый кейс в сообществе", text: "Марат Хуснуллин опубликовал клинический случай имплантации", time: "Вчера", unread: false }
];

/* ---------- Activity log ---------- */
const ACTIVITY = [
  { who: "Алексей Петров", color: "#18A06E", action: "подтвердил находку «Кариес дентина» зуб 26", target: "Анна Ковалёва", time: "10:24", date: "Сегодня" },
  { who: "Алексей Петров", color: "#18A06E", action: "сформировал план лечения на 21 000 ₽", target: "Анна Ковалёва", time: "10:26", date: "Сегодня" },
  { who: "Виктор Лозовой", color: "#E8941F", action: "записал нового пациента", target: "Ольга Титова", time: "09:48", date: "Сегодня" },
  { who: "Ольга Зайцева", color: "#7C5CFF", action: "оставила комментарий к карточке", target: "Игорь Семёнов", time: "09:12", date: "Сегодня" },
  { who: "Дарья Кравец", color: "#11AEC8", action: "завершила приём «Профгигиена»", target: "Павел Гущин", time: "17:30", date: "Вчера" },
  { who: "Радикс-Vision", color: "#FF5A36", action: "проанализировал снимок (4 находки)", target: "Дмитрий Орлов", time: "16:05", date: "Вчера" },
  { who: "Марат Хуснуллин", color: "#2F4BF0", action: "обновил этап лечения «Имплантация»", target: "Сергей Мальков", time: "14:20", date: "Вчера" }
];

/* ---------- Community feed (Insta-like) ---------- */
const FEED = [
  { id: "p1", author: "Марат Хуснуллин", role: "Хирург-имплантолог · Аврора", color: "#2F4BF0", time: "2 ч назад",
    text: "Сложный случай: немедленная имплантация в зоне 36 после удаления. КЛКТ показала достаточный объём кости. Делюсь до/после — AI-анализ помог спланировать положение импланта. 🦷",
    tags: ["#имплантация", "#КЛКТ", "#клиническийслучай"], img: "implant", likes: 47, comments: 12, liked: false, shots: 2 },
  { id: "p2", author: "Ольга Зайцева", role: "Ортодонт · ДентаЛюкс", color: "#7C5CFF", time: "5 ч назад",
    text: "12 месяцев на элайнерах — результат, которым горжусь. Скученность нижнего фронта была серьёзная. Кто как ведёт ретенцию после таких кейсов?",
    tags: ["#ортодонтия", "#элайнеры", "#до_после"], img: "ortho", likes: 89, comments: 31, liked: true, shots: 2 },
  { id: "p3", author: "Радикс Команда", role: "Официальный аккаунт", color: "#FF5A36", time: "Вчера", official: true,
    text: "Обновление Радикс-Vision 3.1: точность детекции периапикальных очагов выросла до 91%. Теперь модель различает кисты и гранулёмы по плотности. Подробности — в блоге.",
    tags: ["#обновление", "#AI"], img: "update", likes: 156, comments: 24, liked: false, shots: 0 },
  { id: "p4", author: "Дарья Кравец", role: "Гигиенист · МедСтом", color: "#11AEC8", time: "Вчера",
    text: "Памятка для пациентов по домашней гигиене после профчистки. Сохраняйте и делитесь — снижает количество повторных обращений с налётом.",
    tags: ["#гигиена", "#профилактика"], img: "hygiene", likes: 62, comments: 8, liked: false, shots: 0 }
];
const FEED_COMMENTS = {
  p1: [
    { who: "Ольга Зайцева", color: "#7C5CFF", text: "Отличный результат! Какой протокол нагрузки выбрали?", time: "1 ч" },
    { who: "Алексей Петров", color: "#18A06E", text: "Чисто сработано 👏 Сколько времени заняла операция?", time: "40 мин" }
  ],
  p2: [
    { who: "Марат Хуснуллин", color: "#2F4BF0", text: "Ретенцию обычно несъёмную ставлю на нижний фронт минимум на 2 года.", time: "3 ч" }
  ]
};

/* ---------- Patient comments (team chat on card) ---------- */
const PATIENT_NOTES = {
  1: [
    { who: "Алексей Петров", color: "#18A06E", text: "Кариес 26 подтверждён, план отправлен. Пациентка согласна.", time: "10:26", me: true },
    { who: "Виктор Лозовой", color: "#E8941F", text: "Записал на лечение 24 июня 10:00.", time: "10:40" }
  ],
  2: [
    { who: "Ольга Зайцева", color: "#7C5CFF", text: "@Алексей посмотри снимок 16, нужна твоя консультация по эндо.", time: "09:12" }
  ]
};

/* ---------- Billing ---------- */
const BILLING = {
  plan: "Клиника", seats: 4, price: 2900, nextDate: "23 июля 2026",
  usage: { analyses: 142, analysesLimit: null, storage: 8.4, storageLimit: 50 },
  history: [
    { date: "23 июня 2026", desc: "Тариф «Клиника» · 4 врача", amount: 11600, status: "Оплачено" },
    { date: "23 мая 2026", desc: "Тариф «Клиника» · 4 врача", amount: 11600, status: "Оплачено" },
    { date: "23 апр 2026", desc: "Тариф «Клиника» · 3 врача", amount: 8700, status: "Оплачено" }
  ]
};

/* ---------- Данные клиники: демо-снимок + сборка поверх него ----------
   Встроенные демо-записи показываем ТОЛЬКО в локальном/офлайн-режиме
   (витрина продукта). В реальном облачном аккаунте клиника начинается
   с чистого листа — видны лишь её собственные записи из облака.
   rebuildData() вызывается повторно после авторизации (см. main.js). */
const DEMO = {
  patients: PATIENTS.slice(), crmCards: CRM_CARDS.slice(), calEvents: CAL_EVENTS.slice(),
  followups: CRM_FOLLOWUPS.slice(), notifs: NOTIFS.slice(), activity: ACTIVITY.slice(),
  notes: Object.assign({}, PATIENT_NOTES)
};
function cloudAccount() {
  try { const s = window.RadixDB && RadixDB.state(); return !!(s && s.enabled && s.clinicId); }
  catch (e) { return false; }
}
function rebuildData() {
  // Демо-записи отключены полностью: приложение всегда начинается с чистого листа,
  // показываются только собственные данные клиники (RadixStore → синхронизация в облако).
  const clean = true;
  const setArr = (arr, demo) => { arr.length = 0; if (!clean) demo.forEach(x => arr.push(x)); };
  setArr(PATIENTS, DEMO.patients);
  setArr(CRM_CARDS, DEMO.crmCards);
  setArr(CAL_EVENTS, DEMO.calEvents);
  setArr(CRM_FOLLOWUPS, DEMO.followups);
  setArr(NOTIFS, DEMO.notifs);
  setArr(ACTIVITY, DEMO.activity);
  Object.keys(PATIENT_NOTES).forEach(k => delete PATIENT_NOTES[k]);
  if (!clean) Object.assign(PATIENT_NOTES, DEMO.notes);

  // поверх базы — собственные записи клиники (RadixStore → синхронизируются в облако)
  RadixStore.get("custom_patients", []).forEach(p => PATIENTS.push(p));
  const edits = RadixStore.get("patient_edits", {});
  PATIENTS.forEach(p => { if (edits[p.id]) Object.assign(p, edits[p.id]); });
  const arch = RadixStore.get("archived_patients", []);
  for (let i = PATIENTS.length - 1; i >= 0; i--) if (arch.indexOf(PATIENTS[i].id) > -1) PATIENTS.splice(i, 1);
  RadixStore.get("custom_events", []).forEach(e => CAL_EVENTS.push(e));
  RadixStore.get("custom_crm_cards", []).forEach(c => CRM_CARDS.push(c));
}
rebuildData();
function persistCustomPatients() {
  RadixStore.set("custom_patients", PATIENTS.filter(p => p.id >= 100));
}
function rerenderApp() { if (window.__rerender) window.__rerender(); }
function addPatient(data) {
  const id = PATIENTS.reduce((m, p) => Math.max(m, p.id), 99) + 1;
  const p = {
    id, name: data.name, age: data.age || "—", since: "" + new Date().getFullYear(),
    ins: data.ins || "—", color: PALS[id % PALS.length], status: "active",
    next: "—", phone: data.phone || "", flag: "ok",
    findings: [], visits: [], arch: { count: 7, restoreAt: null, decayAt: [] }
  };
  PATIENTS.push(p); persistCustomPatients(); rerenderApp();
  return p;
}
function updatePatient(id, patch) {
  const p = PATIENTS.find(x => x.id === id); if (!p) return null;
  Object.assign(p, patch);
  if (id >= 100) persistCustomPatients();
  else {
    const edits = RadixStore.get("patient_edits", {});
    edits[id] = Object.assign(edits[id] || {}, patch);
    RadixStore.set("patient_edits", edits);
  }
  rerenderApp(); return p;
}
function archivePatient(id) {
  const i = PATIENTS.findIndex(x => x.id === id); if (i < 0) return;
  PATIENTS.splice(i, 1);
  const arch = RadixStore.get("archived_patients", []);
  if (arch.indexOf(id) < 0) { arch.push(id); RadixStore.set("archived_patients", arch); }
  if (id >= 100) persistCustomPatients();
  rerenderApp();
}
function addCalEvent(ev) {
  CAL_EVENTS.push(ev);
  const custom = RadixStore.get("custom_events", []);
  custom.push(ev); RadixStore.set("custom_events", custom);
  rerenderApp();
}

/* Связка расписания и воронки: ближайший приём пациента + его подпись */
function nextApptFor(pid) {
  const evs = CAL_EVENTS.filter(e => e.pid === pid);
  if (!evs.length) return null;
  return evs.slice().sort((a, b) => (a.day - b.day) || (a.start - b.start))[0];
}
function apptLabel(ev) {
  if (!ev) return null;
  const d = (CAL_DAYS[ev.day] || "").split(" ");
  const hm = Math.floor(ev.start) + ":" + ("0" + Math.round((ev.start % 1) * 60)).slice(-2);
  return (d[0] || "") + (d[1] ? " " + d[1] : "") + " · " + hm;
}

/* Связка с CRM: найти сделку пациента или создать кастомную (персистентно) */
function crmEnsureCard(patient, work, val) {
  let card = CRM_CARDS.find(c => c.pid === patient.id);
  if (card) return card;
  card = {
    id: "cc" + patient.id, pid: patient.id, name: patient.name, color: patient.color,
    stage: "plan", work: work || "План лечения", val: val || 0, prob: 60,
    src: "Платформа", date: "Сегодня"
  };
  CRM_CARDS.push(card);
  const custom = RadixStore.get("custom_crm_cards", []);
  custom.push(card); RadixStore.set("custom_crm_cards", custom);
  return card;
}

/* Подвинуть сделку пациента на стадию; ensure {work, val} — создать сделку, если её нет */
function crmSetStage(pid, stageId, ensure) {
  let card = CRM_CARDS.find(c => c.pid === pid);
  if (!card) {
    if (!ensure) return null;
    const p = PATIENTS.find(x => x.id === pid);
    if (!p) return null;
    card = crmEnsureCard(p, ensure.work, ensure.val);
  }
  const st = RadixStore.get("crm_stages", {});
  st[card.id] = stageId;
  RadixStore.set("crm_stages", st);
  return CRM_STAGES.find(s => s.id === stageId);
}

/* ---------- Финансы: реальные оплаты ---------- */
function getPayments() { return RadixStore.get("payments", []); }
function addPayment(p) {
  const list = getPayments();
  const doctor = (RadixStore.get("user", null) || { name: "Алексей Петров" }).name;
  list.unshift({ id: "pay" + Date.now() + "_" + Math.floor(Math.random() * 1e4), date: new Date().toISOString(), pid: p.pid, name: p.name, label: p.label, amount: p.amount, doctor: p.doctor || doctor });
  RadixStore.set("payments", list);
  rerenderApp();
  return list[0];
}
function paymentsThisMonth() {
  const now = new Date();
  return getPayments().filter(p => {
    const d = new Date(p.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
}

/* ---------- Жизненный цикл плана лечения ---------- */
function getPlan(pid) { return RadixStore.get("plan_" + pid, { status: "draft", items: null, done: {} }); }
function setPlanState(pid, patch) {
  const cur = getPlan(pid);
  const next = Object.assign({}, cur, patch);
  RadixStore.set("plan_" + pid, next);
  return next;
}

/* ---------- Допуслуги для отчёта пациента ---------- */
const UPSELLS = [
  { id: "hygiene", label: "Профессиональная гигиена", desc: "Снятие налёта и камня ультразвуком + Air Flow. Дыхание свежее, эмаль светлее на 1–2 тона.", price: 4500, match: fs => true },
  { id: "fluor", label: "Фторирование эмали", desc: "Укрепляет эмаль и останавливает ранний кариес. Всего 15 минут — лучше всего сразу после гигиены.", price: 2200, match: fs => fs.some(f => f.type === "cariesE" || f.type === "caries") },
  { id: "whitening", label: "Отбеливание ZOOM", desc: "Заметно белее за один визит. Особенно эффектно после лечения и гигиены.", price: 14900, match: fs => fs.some(f => f.type === "tartar" || f.type === "resto") },
  { id: "veneers", label: "Дизайн улыбки · виниры", desc: "Идеальная форма и цвет передних зубов. Цифровая примерка новой улыбки — бесплатно.", price: 0, match: fs => true },
  { id: "ortho", label: "Элайнеры · 3D-диагностика", desc: "Незаметное исправление прикуса. 3D-план перемещения зубов за 30 минут.", price: 1900, match: fs => true },
  { id: "implant", label: "Имплантация · консультация", desc: "Восстановление зуба под ключ: КТ-диагностика и персональный план в один визит.", price: 0, match: fs => fs.some(f => f.type === "periap") }
];
function pickUpsells(findings, enabledMap) {
  return UPSELLS.filter(u => (!enabledMap || enabledMap[u.id] !== false) && u.match(findings)).slice(0, 3);
}

/* ---------- Маркетинг клиники для отчётов (настраивается в Настройках) ---------- */
const MARKETING_DEFAULTS = {
  discount: 10, days: 14,
  bonusText: "При оплате всего плана — профессиональная гигиена в подарок",
  phone: "+7 495 120-45-67", address: "Москва, Цветной бульвар, 15",
  mech: { deadline: true, delay: true, bonus: true },
  upsells: { hygiene: true, fluor: true, whitening: true, veneers: true, ortho: true, implant: true }
};
function getMarketing() {
  const saved = RadixStore.get("marketing", {});
  const m = Object.assign({}, MARKETING_DEFAULTS, saved);
  m.mech = Object.assign({}, MARKETING_DEFAULTS.mech, saved.mech || {});
  m.upsells = Object.assign({}, MARKETING_DEFAULTS.upsells, saved.upsells || {});
  return m;
}

/* ---------- Сводная аналитика клиники (реальные данные) ---------- */
function analyticsData() {
  const pays = getPayments();
  const monthPays = paymentsThisMonth();
  const fmt = n => Math.round(n);
  // деньги по услугам (группировка по нормализованному названию)
  const byService = {};
  pays.forEach(p => { const k = (p.label || "Услуга").split(" · ")[0]; byService[k] = (byService[k] || 0) + p.amount; });
  const services = Object.keys(byService).map(k => ({ label: k, value: byService[k] })).sort((a, b) => b.value - a.value).slice(0, 8);
  // деньги по врачам
  const byDoc = {};
  pays.forEach(p => { const k = p.doctor || "—"; byDoc[k] = (byDoc[k] || 0) + p.amount; });
  const doctors = Object.keys(byDoc).map(k => ({ label: k, value: byDoc[k] })).sort((a, b) => b.value - a.value);
  // воронка из CRM + crm_stages
  const st = RadixStore.get("crm_stages", {});
  const stageOf = c => st[c.id] || c.stage;
  const funnel = CRM_STAGES.map(s => ({ id: s.id, t: s.t, c: s.c, n: CRM_CARDS.filter(c => stageOf(c) === s.id).length,
    val: CRM_CARDS.filter(c => stageOf(c) === s.id).reduce((a, c) => a + c.val, 0) }));
  const leads = CRM_CARDS.length;
  const won = CRM_CARDS.filter(c => stageOf(c) === "done").length;
  const inTreat = CRM_CARDS.filter(c => stageOf(c) === "treat" || stageOf(c) === "done").length;
  const conv = leads ? Math.round(inTreat / leads * 100) : 0;
  const active = CRM_CARDS.filter(c => stageOf(c) !== "done");
  const weighted = Math.round(active.reduce((a, c) => a + c.val * (c.prob || 50) / 100, 0));
  const avgCheck = pays.length ? Math.round(pays.reduce((a, p) => a + p.amount, 0) / pays.length) : 0;
  // структура находок (реальная, по всем пациентам)
  const findCount = {};
  let totalFind = 0;
  PATIENTS.forEach(p => (p.findings || []).forEach(f => { findCount[f.type] = (findCount[f.type] || 0) + 1; totalFind++; }));
  const dist = Object.keys(findCount).map(t => ({ type: t, label: (FIND_LIB[t] || {}).label || t, c: (FIND_LIB[t] || {}).c || "#888",
    pct: totalFind ? Math.round(findCount[t] / totalFind * 100) : 0 })).sort((a, b) => b.pct - a.pct);
  // эффективность AI: подтверждённые находки (rdx_decided_*) против всех
  let acc = 0, rej = 0, decidedTotal = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf("rdx_decided_") === 0) {
        const d = JSON.parse(localStorage.getItem(k)) || {};
        Object.keys(d).forEach(idx => { if (d[idx] === "acc") acc++; else if (d[idx] === "rej") rej++; decidedTotal++; });
      }
    }
  } catch (e) {}
  const acceptPct = (acc + rej) ? Math.round(acc / (acc + rej) * 100) : 0;
  return {
    services, doctors, funnel, leads, won, conv, weighted, avgCheck,
    monthRevenue: monthPays.reduce((a, p) => a + p.amount, 0),
    totalRevenue: pays.reduce((a, p) => a + p.amount, 0),
    paymentsCount: pays.length, dist, reports: countReports(),
    aiAccept: acceptPct, aiAccepted: acc, aiRejected: rej
  };
}

/* ---------- Счётчик заключений (ключи rdx_reports_*, тяжёлые rdx_img_* не читаем) ---------- */
function countReports() {
  let n = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf("rdx_reports_") === 0) {
        try { n += (JSON.parse(localStorage.getItem(k)) || []).length; } catch (e) {}
      }
    }
  } catch (e) {}
  return n;
}

Object.assign(window, { React, useState, useEffect, useRef, useMemo, ICONS, Icon, Arch, PATIENTS, FIND_LIB, findingInfo, initials, statusTag, PALS, CRM_STAGES, CRM_CARDS, CRM_FOLLOWUPS, TEAM, CAL_DAYS, CAL_EVENTS, NOTIFS, ACTIVITY, FEED, FEED_COMMENTS, PATIENT_NOTES, BILLING, crmSetStage, crmEnsureCard, addPatient, updatePatient, archivePatient, addCalEvent, nextApptFor, apptLabel, getPayments, addPayment, paymentsThisMonth, getPlan, setPlanState, countReports, analyticsData, UPSELLS, pickUpsells, getMarketing, MARKETING_DEFAULTS, SEVERITY, severityInfo, rebuildData });
